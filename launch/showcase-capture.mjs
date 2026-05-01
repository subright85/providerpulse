// One-off — capture Nami's theme showcase to inspect the Brutalist
// "incident detail" textbox pattern.
import { chromium } from 'playwright';
const URL = 'https://themes-showcase-9ptpsa5mf-subright85s-projects.vercel.app/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
console.log('Title:', await page.title());
console.log('URL:', page.url());
await page.screenshot({ path: '/tmp/showcase-1.png' });
console.log('saved /tmp/showcase-1.png');

// Try clicking Brutalist
const brutalistBtn = page.locator('button, a').filter({ hasText: /Brutalist/i }).first();
if (await brutalistBtn.count() > 0) {
  await brutalistBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/showcase-2-brutalist.png', fullPage: true });
  console.log('saved /tmp/showcase-2-brutalist.png (fullPage)');
}
await browser.close();
