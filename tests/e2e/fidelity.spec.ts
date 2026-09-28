import { test, expect } from '@playwright/test';
import { prepareCapture } from '../../src/preview/prepareCapture';

type CapturedNode = {
  tag?: string; text?: string; styles?: Record<string,string>;
  childNodes?: CapturedNode[]; svg?: string;
};
const descendants = (node:CapturedNode):CapturedNode[] => [node,...(node.childNodes ?? []).flatMap(descendants)];

test('capture keeps vertical Latin text rotated and arrows as vectors without changing live DOM',async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('up to date');
  const frame=page.frameLocator('iframe[title="Live preview"]');
  const before=await frame.locator('.button, .image-label').evaluateAll(els=>els.map(el=>el.outerHTML));
  await page.getByRole('button',{name:'Copy to Figma'}).click();
  await expect(page.getByRole('status')).toContainText('Copied!',{timeout:40000});
  const encoded=await page.evaluate(async()=>{
    const [item]=await navigator.clipboard.read();
    const html=await(await item.getType('text/html')).text();
    return new DOMParser().parseFromString(html,'text/html').querySelector('[data-h2d]')!.getAttribute('data-h2d')!.match(/<!--\(figh2d\)(.*?)\(\/figh2d\)-->/s)![1];
  });
  const payload=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
  const nodes=descendants(payload.root);
  const label=nodes.find(n=>n.childNodes?.some(c=>c.text==='A NATURAL KIND OF BEAUTIFUL'))!;
  expect(label.styles?.writingMode ?? 'horizontal-tb').toBe('horizontal-tb');
  expect(label.styles?.transform).toMatch(/matrix\(0, 1, -1, 0, 0, 0\)/);
  expect(nodes.some(n=>n.text?.includes('↗'))).toBe(false);
  expect(nodes.filter(n=>n.tag==='SVG').length).toBeGreaterThanOrEqual(2);
  expect(await frame.locator('.button, .image-label').evaluateAll(els=>els.map(el=>el.outerHTML))).toEqual(before);
  await frame.getByText('Explore the collection',{exact:false}).click();
  await expect(frame.locator('.small-note')).toContainText('Welcome to the collection');
});

test('studio uses loaded shared fonts instead of local Georgia and Arial',async ({page})=>{
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('up to date');
  const frame=page.frameLocator('iframe[title="Live preview"]');
  await expect(frame.locator('h1')).toBeVisible();
  const fonts=await frame.locator('h1').evaluate(async el=>{
    await document.fonts.ready;
    return {family:getComputedStyle(el).fontFamily,loaded:Array.from(document.fonts).filter(f=>f.status==='loaded').map(f=>f.family)};
  });
  expect(fonts.family).toContain('Lora');
  expect(fonts.loaded).toContain('Lora');
  expect(fonts.loaded).toContain('Inter');
});

test('failed web fonts produce a fidelity warning instead of silent fallback',async ({page})=>{
  await page.route('https://fonts.gstatic.com/**',route=>route.abort());
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('up to date');
  await page.getByRole('button',{name:'Copy to Figma'}).click();
  await expect(page.getByRole('status')).toContainText('Copied!',{timeout:40000});
  await expect(page.getByLabel('Preview messages',{exact:true})).toContainText('fonts');
});

test('normalizing an absolute vertical label preserves its position with margins',async ({page})=>{
  await page.setContent('<div style="position:relative;width:300px;height:300px"><span id="label" style="position:absolute;left:20px;top:30px;margin:7px 0 0 11px;writing-mode:vertical-rl;font:12px Arial">VERTICAL LABEL</span></div>');
  const before=await page.locator('#label').boundingBox();
  await page.evaluate(source=>{(window as any).prepared=eval(`(${source})`)();},prepareCapture.toString());
  const during=await page.locator('#label').boundingBox();
  expect(during!.x).toBeCloseTo(before!.x,0);
  expect(during!.y).toBeCloseTo(before!.y,0);
  await page.evaluate(()=>(window as any).prepared.restore());
  expect(await page.locator('#label').boundingBox()).toEqual(before);
});

for(const display of ['inline-flex','inline-grid']) test(`arrow adaptation preserves a single anonymous item in ${display}`,async ({page})=>{
  await page.setContent(`<div style="display:${display};grid-auto-flow:column;gap:20px;font:16px Arial">Call ↗<button id="next">Next</button></div>`);
  const before=await page.locator('#next').boundingBox();
  await page.evaluate(source=>{(window as any).prepared=eval(`(${source})`)();},prepareCapture.toString());
  expect(await page.locator('svg').count()).toBe(1);
  const during=await page.locator('#next').boundingBox();
  expect(during!.x).toBeCloseTo(before!.x,0);
  await page.evaluate(()=>(window as any).prepared.restore());
  expect(await page.locator('#next').boundingBox()).toEqual(before);
});
