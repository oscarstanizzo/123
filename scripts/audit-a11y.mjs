// Heading outline, focus visibility, anchor offset and horizontal overflow.
import { chromium } from 'playwright';
import { serve, CHROMIUM } from './lib/serve.mjs';

const { origin, close } = await serve(8095);
const browser = await chromium.launch({ executablePath: CHROMIUM });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(origin + '/', { waitUntil: 'networkidle' });

let problems = 0;

// --- heading outline ---
const headings = await page.evaluate(() =>
  [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({ level: +h.tagName[1], text: h.textContent.trim().slice(0, 44) }))
);
console.log('heading outline:');
let prev = 0;
for (const h of headings) {
  const skip = prev && h.level > prev + 1;
  if (skip) problems++;
  console.log(`  ${'  '.repeat(h.level - 1)}h${h.level} ${h.text}${skip ? '   <-- SKIPPED LEVEL' : ''}`);
  prev = h.level;
}
const h1s = headings.filter((h) => h.level === 1).length;
if (h1s !== 1) { console.log(`  !! expected exactly one h1, found ${h1s}`); problems++; }

// --- anchor offset under the sticky header ---
for (const id of ['work', 'services', 'contact']) {
  // Navigate by hash directly — not every section is linked from the page.
  await page.evaluate((i) => {
    window.location.hash = '';
    window.location.hash = i;
  }, id);
  await page.waitForTimeout(350);
  const ok = await page.evaluate((i) => {
    const hh = document.querySelector('.header').getBoundingClientRect().height;
    const el = document.querySelector(`#${i} h2`);
    return el ? el.getBoundingClientRect().top > hh : true;
  }, id);
  if (!ok) { console.log(`  !! #${id} lands under the sticky header`); problems++; }
}
console.log('\nanchor offsets clear the sticky header:', problems === 0 ? 'yes' : 'see above');

// --- focus visibility on every interactive element ---
await page.evaluate(() => window.scrollTo(0, 0));
const count = await page.evaluate(() => document.querySelectorAll('a[href],button,input,textarea,select,[tabindex]:not([tabindex="-1"])').length);
const noRing = [];
for (let i = 0; i < count; i++) {
  await page.keyboard.press('Tab');
  const r = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
    // A checkbox may delegate its ring to the styled sibling.
    const sib = el.nextElementSibling ? getComputedStyle(el.nextElementSibling) : null;
    const sibRing = sib && sib.outlineStyle !== 'none' && parseFloat(sib.outlineWidth) > 0;
    return { tag: el.tagName, cls: (el.className || '').toString().slice(0, 30), ok: ring || sibRing };
  });
  if (r && !r.ok) noRing.push(r);
}
console.log('focusable elements:', count, '| without a visible ring:', noRing.length);
noRing.slice(0, 8).forEach((r) => console.log('   ', r));
if (noRing.length) problems++;

// --- horizontal overflow at narrow widths ---
for (const w of [360, 390, 768]) {
  const c = await browser.newContext({ viewport: { width: w, height: 800 }, isMobile: w < 900, hasTouch: w < 900 });
  const pg = await c.newPage();
  await pg.goto(origin + '/', { waitUntil: 'networkidle' });
  const o = await pg.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    offenders: [...document.querySelectorAll('*')]
      .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 5)
      .map((el) => el.tagName + '.' + (el.className || '').toString().slice(0, 30)),
  }));
  const ok = o.scrollW <= o.clientW + 1;
  if (!ok) problems++;
  console.log(`${w}px overflow:`, ok ? 'none' : o);
  await c.close();
}

await browser.close();
close();
console.log(problems ? `\n${problems} problem(s)` : '\nno problems found');
if (problems) process.exit(1);
