/* Renders every nexday/ page in headless Chromium and reports console errors,
   missing chrome and horizontal overflow. Set CHROMIUM_PATH if Playwright's
   bundled browser is not installed. */
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';

const dir = new URL('../nexday', import.meta.url).pathname;
const pages = readdirSync(dir).filter(f => f.endsWith('.html'));
const extra = ['category.html?c=gloves', 'category.html?c=paper-products&s=Bath%20Tissue%20%26%20Toilet%20Paper'];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let fail = 0;

for (const p of [...pages, ...extra]) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.goto('file://' + dir + '/' + p, { waitUntil: 'load' });
  await page.waitForTimeout(250);

  const stats = await page.evaluate(() => ({
    navLinks: document.querySelectorAll('.nav__link').length,
    megaCols: document.querySelectorAll('.mega__col').length,
    footerLinks: document.querySelectorAll('.footer a').length,
    cats: document.querySelectorAll('.cat-card').length,
    prods: document.querySelectorAll('.prod').length,
    dir: document.querySelectorAll('.dir-card').length,
    brands: document.querySelectorAll('.brand-tile').length,
    h1: (document.querySelector('h1') || {}).textContent?.trim().slice(0, 46) || '(none)',
    scrollX: document.documentElement.scrollWidth > window.innerWidth + 1
  }));
  const bad = errs.length || !stats.navLinks || !stats.footerLinks || stats.h1 === '(none)' || stats.scrollX;
  if (bad) fail++;
  console.log((bad ? 'FAIL ' : 'ok   ') + p.padEnd(52), JSON.stringify(stats));
  if (errs.length) console.log('      errors:', errs.slice(0, 3));
  await ctx.close();
}

// mobile overflow pass
for (const p of ['index.html', 'products.html', 'category.html?c=gloves', 'contact.html']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('file://' + dir + '/' + p, { waitUntil: 'load' });
  await page.waitForTimeout(200);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log((over > 1 ? 'FAIL ' : 'ok   ') + '390px ' + p.padEnd(46), 'overflow=' + over);
  if (over > 1) fail++;
  await ctx.close();
}

await browser.close();
console.log(fail ? '\n' + fail + ' problem(s)' : '\nall clean');
process.exit(fail ? 1 : 0);
