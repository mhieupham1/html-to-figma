import { test, expect } from '@playwright/test';

test('real Figma runtime captures current DOM into HTML clipboard', async ({page},testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('up to date');
  await page.getByRole('combobox',{name:'Example'}).selectOption('interactive');
  await page.getByRole('button',{name:'Run code'}).click();
  await expect(page.getByRole('status')).toContainText('up to date');
  const frame = page.frameLocator('iframe[title="Live preview"]');
  await frame.getByRole('button',{name:'Update text'}).click();
  await expect(frame.getByRole('heading',{name:'Updated from JavaScript'})).toBeVisible();
  await page.getByRole('button',{name:'Copy to Figma'}).click();
  await expect(page.getByRole('status')).toContainText('Copied!',{timeout:40000});
  const clipboard = await page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    const html = await (await items[0].getType('text/html')).text();
    const doc = new DOMParser().parseFromString(html,'text/html');
    return { html, data: doc.querySelector('[data-h2d]')?.getAttribute('data-h2d') };
  });
  expect(clipboard.data).toContain('<!--(figh2d)');
  const encoded = clipboard.data?.match(/<!--\(figh2d\)(.*?)\(\/figh2d\)-->/s)?.[1];
  expect(encoded).toBeTruthy();
  const json = Buffer.from(encoded!,'base64').toString('utf8');
  expect(json).toContain('Updated from JavaScript');
  expect(JSON.parse(json).viewportRect.width).toBe(1024);
  await testInfo.attach('figma-clipboard-summary',{body:JSON.stringify({mime:'text/html',bytes:clipboard.html.length,containsUpdatedText:true}),contentType:'application/json'});
  await page.getByRole('button',{name:'Mobile viewport'}).click();
  await page.getByRole('button',{name:'Copy to Figma'}).click();
  await expect(page.getByRole('status')).toContainText('Copied!',{timeout:40000});
  const repeated = await page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    const doc = new DOMParser().parseFromString(await (await items[0].getType('text/html')).text(),'text/html');
    return doc.querySelector('[data-h2d]')!.getAttribute('data-h2d')!;
  });
  const repeatedJson = Buffer.from(repeated.match(/<!--\(figh2d\)(.*?)\(\/figh2d\)-->/s)![1],'base64').toString('utf8');
  expect(JSON.parse(repeatedJson).viewportRect.width).toBe(390);
  expect(repeatedJson).toContain('Updated from JavaScript');
});

test('failed capture runtime load can be retried successfully',async ({page}) => {
  await page.route('https://mcp.figma.com/mcp/html-to-design/capture.js', route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('up to date');
  await page.getByRole('button',{name:'Copy to Figma'}).click();
  await expect(page.getByRole('status')).toContainText('could not load');
  await page.unroute('https://mcp.figma.com/mcp/html-to-design/capture.js');
  await page.getByRole('button',{name:'Copy to Figma'}).click();
  await expect(page.getByRole('status')).toContainText('Copied!',{timeout:40000});
});
