/**
 * Auto-captures launch screenshots from the live site.
 * Run: node launch/capture.mjs
 * Output: launch/screenshots/*.png
 */

import { chromium } from 'playwright';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, 'screenshots');
const URL = process.env.PP_URL ?? 'https://providerpulse-woad.vercel.app/';

async function run() {
  const browser = await chromium.launch();
  console.log('→ ' + URL);

  // 1. Desktop hero — 1280x800, 8 cards visible
  {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: join(OUT, '1-hero-desktop.png'),
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });
    console.log('✓ 1-hero-desktop.png');

    // 2. Full page (taller, captures whole grid + footer)
    await page.screenshot({
      path: join(OUT, '2-fullpage-desktop.png'),
      fullPage: true,
    });
    console.log('✓ 2-fullpage-desktop.png');

    // 3. OpenAI card zoom — match the rounded-2xl card button (top of grid)
    const openaiCard = page.locator('button.rounded-2xl').filter({ hasText: 'OpenAI' }).first();
    if (await openaiCard.count() > 0) {
      await openaiCard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await openaiCard.screenshot({ path: join(OUT, '3-openai-card.png') });
      console.log('✓ 3-openai-card.png');
    } else {
      console.log('⚠ OpenAI card not found');
    }

    // 4. Detail modal — click OpenAI card, then capture
    if (await openaiCard.count() > 0) {
      await openaiCard.click();
      await page.waitForTimeout(1000);
      // Modal screenshot
      const modal = page.locator('div.fixed.inset-0').first();
      if (await modal.count() > 0) {
        await page.screenshot({
          path: join(OUT, '4-openai-detail-modal.png'),
          clip: { x: 0, y: 0, width: 1280, height: 900 },
        });
        console.log('✓ 4-openai-detail-modal.png');
      }
      await page.keyboard.press('Escape');
    }

    await ctx.close();
  }

  // 5. Mobile — 390x844 (iPhone 14 Pro), single column
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: join(OUT, '5-mobile-hero.png'),
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log('✓ 5-mobile-hero.png');

    await page.screenshot({
      path: join(OUT, '6-mobile-fullpage.png'),
      fullPage: true,
    });
    console.log('✓ 6-mobile-fullpage.png');

    await ctx.close();
  }

  await browser.close();
  console.log('\nDone. Files in launch/screenshots/');
}

run().catch(e => { console.error(e); process.exit(1); });
