import { test, expect, type Page } from '@playwright/test';

async function setCode(page:Page, tab:'HTML'|'CSS'|'JS', value:string) {
  await page.getByRole('tab',{name:tab,exact:true}).click();
  await page.getByRole('textbox',{name:`${tab} code`,exact:true}).fill(value);
}

test('Run applies code, captures keep state, viewport changes preserve JS, and draft requires Run after reload', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('up to date');
  await setCode(page,'HTML','<!doctype html><html lang="vi"><head><title>Demo</title></head><body><h1 id="title">Original</h1><button id="update">Update text</button><p id="isolation"></p></body></html>');
  await setCode(page,'CSS','body {font-family: Arial; background:#e0ffee}');
  await setCode(page,'JS','document.querySelector("#update").onclick=()=>document.querySelector("h1").textContent="Changed";try{parent.document.body.dataset.leaked="yes"}catch{document.querySelector("#isolation").textContent="Isolated"}');
  await expect(page.getByRole('button',{name:'Copy to Figma',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Run code'}).click();
  const frame = page.frameLocator('iframe[title="Live preview"]');
  await expect(frame.getByRole('heading',{name:'Original'})).toBeVisible();
  await expect(frame.getByText('Isolated')).toBeVisible();
  await frame.getByRole('button',{name:'Update text'}).click();
  await expect(frame.getByRole('heading',{name:'Changed'})).toBeVisible();
  await page.getByRole('button',{name:'Mobile viewport'}).click();
  await expect(frame.getByRole('heading',{name:'Changed'})).toBeVisible();
  expect(await page.locator('iframe').evaluate(el => (el as HTMLIFrameElement).getBoundingClientRect().width)).toBeGreaterThan(0);
  await expect(page.getByText('Draft saved')).toBeVisible();
  await page.reload();
  await page.getByRole('tab',{name:'HTML',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'HTML code'})).toContainText('Original');
  await expect(page.getByRole('button',{name:'Copy to Figma',exact:true})).toBeDisabled();
});

test('resource errors surface and another Run recovers',async ({page}) => {
  await page.goto('/');
  await setCode(page,'JS','throw new Error("Example runtime failure")');
  await page.getByRole('button',{name:'Run code'}).click();
  await expect(page.getByText('Example runtime failure',{exact:false})).toBeVisible();
  await setCode(page,'JS','');
  await page.getByRole('button',{name:'Run code'}).click();
  await expect(page.getByRole('status')).toContainText('up to date');
  await expect(page.getByText('Example runtime failure',{exact:false})).toHaveCount(0);
});

test('keeps workspace usable on a narrow screen',async ({page},testInfo) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('up to date');
  await expect(page.getByRole('button',{name:'Run code'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Copy to Figma',exact:true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:testInfo.outputPath('mobile.png'),fullPage:true});
});
