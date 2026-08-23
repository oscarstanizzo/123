/* Everything on this page that can silently break, checked in one pass.
   Run: node pear/scripts/verify.mjs                                     */
import path from 'path';
import { fileURLToPath } from 'url';
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';

/* the page sets scroll-behavior:smooth, so a bare scrollTo animates and any
   measurement taken right after it reads a position mid-flight */
const JUMP = y => scrollTo({ top: y, behavior: 'instant' });

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = await serve(8790);
const b = await launch();
let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS  ' : 'FAIL  ') + m); if (!c) fail++; };
const page = async (o = {}) => {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, ...o });
  await p.goto(site.url, { waitUntil: 'load' });
  return p;
};

/* ---- nothing throws, nothing 404s ---------------------------------- */
{
  const p = await page();
  const errs = [];
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', e => errs.push(String(e)));
  p.on('response', r => r.status() >= 400 && errs.push(r.status() + ' ' + r.url()));
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(900);
  ok(errs.length === 0, 'console and network clean' + (errs.length ? ': ' + errs.join(' | ') : ''));

  /* the web fonts actually arrived — over file:// they are CORS-blocked and
     every screenshot quietly renders in a fallback face instead */
  const fonts = await p.evaluate(() => ({
    head: document.fonts.check('600 16px Archivo'),
    body: document.fonts.check('400 16px PublicSans')
  }));
  ok(fonts.head && fonts.body, `web fonts loaded (Archivo ${fonts.head}, PublicSans ${fonts.body})`);
  await p.close();
}

/* ---- finish switcher drives the SVG -------------------------------- */
{
  const p = await page();
  await p.click('a[href="#finishes"]'); await p.waitForTimeout(900);
  for (const [key, label] of [['champagne','Champagne'],['verdigris','Verdigris'],['onyx','Onyx'],['titan','Natural']]) {
    await p.click(`.sw[data-finish="${key}"]`); await p.waitForTimeout(400);
    const r = await p.evaluate(() => ({
      attr: document.documentElement.dataset.finish,
      lite: getComputedStyle(document.documentElement).getPropertyValue('--f-lite').trim(),
      name: document.getElementById('fName').textContent,
      checked: document.querySelectorAll('.sw[aria-checked="true"]').length
    }));
    ok(r.attr === key && r.name === label && r.checked === 1,
       `finish ${key} applies (--f-lite ${r.lite}, exactly one radio checked)`);
  }
  /* arrow keys walk the group, as a real radiogroup does */
  await p.focus('.sw[data-finish="titan"]');
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => document.documentElement.dataset.finish) === 'champagne',
     'arrow key moves the finish selection');
  await p.close();
}

/* ---- the pinned device stays pinned for the whole detail section ---- */
{
  const p = await page();
  /* measure the sticky's own container: the sticky only engages once that
     box's top reaches the viewport top, and releases at its bottom */
  const box = await p.evaluate(() => {
    const d = document.querySelector('.detail__stage').getBoundingClientRect();
    return { top: d.top + scrollY, h: d.height };
  });
  const tops = [];
  /* sample only inside the range where the section is actually engaged:
     from its top flush with the viewport to its bottom coming into view */
  for (let i = 0; i < 5; i++) {
    await p.evaluate(JUMP, box.top + (box.h - 900) * (i / 4));
    await p.waitForTimeout(500);
    tops.push(await p.evaluate(() => Math.round(document.querySelector('.dev--detail').getBoundingClientRect().top)));
  }
  /* pinned means the device holds roughly the same viewport position throughout */
  const drift = Math.max(...tops) - Math.min(...tops);
  ok(drift < 120, `detail device stays pinned across the section (drift ${drift}px, tops ${tops.join(',')})`);

  const panelsLit = await p.evaluate(() => document.querySelectorAll('.panel.is-on').length);
  ok(panelsLit === 1, `exactly one detail panel lit at a time (${panelsLit})`);
  await p.close();
}

/* ---- counters, reveals ---------------------------------------------- */
{
  const p = await page();
  /* the counters fire at 60% visibility, so put the row squarely in view
     rather than relying on where an anchor jump happens to land */
  await p.$eval('.figures', el => el.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(2400);
  const counts = await p.$$eval('[data-count]', els => els.map(e => [e.dataset.count, e.textContent.replace(/,/g, '')]));
  ok(counts.every(([a, c]) => a === c), 'counters land on their targets: ' + JSON.stringify(counts));

  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 400) { await p.evaluate(JUMP, y); await p.waitForTimeout(55); }
  await p.waitForTimeout(700);
  const stuck = await p.$$eval('.reveal', els => els.filter(e => !e.classList.contains('is-in')).length);
  ok(stuck === 0, `every reveal fired (${stuck} stuck hidden)`);
  await p.close();
}

/* ---- booking form ---------------------------------------------------- */
{
  const p = await page();
  await p.click('a[href="#atelier"]'); await p.waitForTimeout(800);
  await p.fill('#bn', 'Alex Reyes'); await p.fill('#be', 'not-an-email');
  await p.click('#book button[type="submit"]'); await p.waitForTimeout(200);
  ok(!/Thank you/.test(await p.textContent('#bookNote')), 'a malformed email is rejected');
  await p.fill('#be', 'alex@example.com');
  await p.click('#book button[type="submit"]'); await p.waitForTimeout(200);
  ok(/Thank you, Alex/.test(await p.textContent('#bookNote')), 'a valid submit acknowledges');
  await p.close();
}

/* ---- reduced motion hides nothing ------------------------------------ */
{
  const p = await page({ reducedMotion: 'reduce' });
  await p.waitForTimeout(700);
  const r = await p.evaluate(() => ({
    faded: [...document.querySelectorAll('.reveal')].filter(e => +getComputedStyle(e).opacity < 0.9).length,
    dim:   [...document.querySelectorAll('.panel')].filter(e => +getComputedStyle(e).opacity < 0.9).length
  }));
  ok(r.faded === 0 && r.dim === 0, `reduced-motion shows all content (${r.faded} faded, ${r.dim} dim panels)`);
  await p.close();
}

/* ---- layout holds at every width ------------------------------------- */
for (const w of [1920, 1440, 1180, 900, 768, 480, 390, 320]) {
  const p = await page({ viewport: { width: w, height: 860 } });
  await p.waitForTimeout(350);
  const r = await p.evaluate(() => ({
    over: document.documentElement.scrollWidth - innerWidth,
    facts: Math.round(document.querySelector('.hero__facts').getBoundingClientRect().bottom),
    vh: innerHeight
  }));
  ok(r.over <= 0, `no horizontal overflow at ${w}px (${r.over}px)`);
  /* the hero is meant to be exactly one screen on a desktop viewport;
     below the breakpoint it stacks and is allowed to run over */
  if (w >= 1180) ok(r.facts <= r.vh, `hero fits one screen at ${w}px (facts end ${r.facts} of ${r.vh})`);
  await p.close();
}

await b.close(); await site.close();
console.log(fail ? `\n${fail} FAILING` : '\nall green');
process.exit(fail ? 1 : 0);
