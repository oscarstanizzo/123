// Screenshots the page at a given width.
// Usage: node scripts/screenshot.mjs [width] [outDir]
//   node scripts/screenshot.mjs 390
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { serve, CHROMIUM } from './lib/serve.mjs';

const WIDTH = Number(process.argv[2] || 390);
const OUT = process.argv[3] || `shots/${WIDTH}`;
const { origin, close } = await serve(8096);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROMIUM });
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: 844 },
  deviceScaleFactor: 2,
  isMobile: WIDTH < 900,
  hasTouch: WIDTH < 900,
});
const page = await ctx.newPage();
await page.goto(origin + '/', { waitUntil: 'networkidle' });

// Scroll through so the reveal observer fires everywhere.
const h = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h; y += 500) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(100);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);

const targets = [
  ['hero', null],
  ['slider', '.compare'],
  ['services', '#services'],
  ['gallery', '#work'],
  ['why', '.section--deep'],
  ['testimonials', '.quotes'],
  ['area', '.areas-body'],
  ['contact', '#contact'],
];
for (const [name, sel] of targets) {
  if (sel) {
    await page.locator(sel).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: `${OUT}/${name}.png` });
}
await page.screenshot({ path: `${OUT}/full.png`, fullPage: true });

const overflow = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  offenders: [...document.querySelectorAll('*')]
    .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
    .slice(0, 8)
    .map((el) => el.tagName + '.' + (el.className || '').toString().slice(0, 40)),
}));
console.log(`${WIDTH}px -> ${OUT}/`, overflow.offenders.length ? overflow : 'no horizontal overflow');

await browser.close();
close();
