/* Everything across the three pages that can silently break, in one pass.
   Run: node pear/scripts/verify.mjs                                       */
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['index.html', 'story/index.html', 'workshop/index.html'];

/* the page sets scroll-behavior:smooth, so a bare scrollTo animates and a
   measurement taken right after reads a position mid-flight */
const JUMP = y => scrollTo({ top: y, behavior: 'instant' });

const site = await serve(8790);
const b = await launch();
let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS  ' : 'FAIL  ') + m); if (!c) fail++; };
const base = site.url.replace('index.html', '');
const open = async (page, o = {}) => {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, ...o });
  await p.goto(base + page, { waitUntil: 'load' });
  return p;
};

/* ================= per page: the things every page must get right ======= */
for (const page of PAGES) {
  const tag = page.split('/')[0].replace('.html', '') || 'home';

  const p = await open(page);
  const errs = [];
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', e => errs.push(String(e)));
  p.on('response', r => r.status() >= 400 && errs.push(r.status() + ' ' + r.url()));
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(900);
  ok(errs.length === 0, `[${tag}] console and network clean` + (errs.length ? ': ' + errs.join(' | ') : ''));

  /* the web fonts arrived — over file:// they are CORS-blocked and every
     screenshot then quietly renders in a fallback face */
  const fonts = await p.evaluate(() => document.fonts.check('600 16px Archivo') &&
                                       document.fonts.check('400 16px PublicSans'));
  ok(fonts, `[${tag}] web fonts loaded`);

  /* split headings must end up visible — a word stuck in its mask is invisible
     text, which is the worst possible failure of this effect */
  const split = await p.evaluate(() => {
    const heads = [...document.querySelectorAll('[data-split]')];
    return {
      n: heads.length,
      unsplit: heads.filter(h => !h.classList.contains('is-split')).length,
      words: heads.reduce((a, h) => a + h.querySelectorAll('.sw-i').length, 0)
    };
  });
  ok(split.n > 0 && split.unsplit === 0 && split.words > 0,
     `[${tag}] ${split.n} headings split into ${split.words} words, none left unsplit`);

  /* walk the page, then nothing may still be hidden */
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 400) { await p.evaluate(JUMP, y); await p.waitForTimeout(55); }
  await p.waitForTimeout(800);
  const hidden = await p.evaluate(() => ({
    reveals: [...document.querySelectorAll('.reveal')].filter(e => !e.classList.contains('is-in')).length,
    words: [...document.querySelectorAll('.sw-i')]
      .filter(e => new DOMMatrix(getComputedStyle(e).transform).m42 > 2).length
  }));
  ok(hidden.reveals === 0 && hidden.words === 0,
     `[${tag}] nothing left hidden (${hidden.reveals} reveals, ${hidden.words} words still masked)`);

  const counts = await p.$$eval('[data-count]', els =>
    els.map(e => [e.dataset.count, e.textContent.replace(/,/g, '')]));
  ok(counts.every(([a, c]) => a === c), `[${tag}] counters land on target: ${JSON.stringify(counts)}`);
  await p.close();

  /* reduced motion must leave every page fully readable */
  const q = await open(page, { reducedMotion: 'reduce' });
  await q.waitForTimeout(800);
  const rm = await q.evaluate(() => ({
    faded: [...document.querySelectorAll('.reveal')].filter(e => +getComputedStyle(e).opacity < 0.9).length,
    masked: [...document.querySelectorAll('.sw-i')]
      .filter(e => new DOMMatrix(getComputedStyle(e).transform).m42 > 2).length
  }));
  ok(rm.faded === 0 && rm.masked === 0,
     `[${tag}] reduced motion shows everything (${rm.faded} faded, ${rm.masked} masked)`);
  await q.close();

  /* layout holds at every width */
  for (const w of [1920, 1440, 1180, 900, 768, 480, 390, 320]) {
    const r = await open(page, { viewport: { width: w, height: 860 } });
    await r.waitForTimeout(350);
    const over = await r.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(over <= 0, `[${tag}] no horizontal overflow at ${w}px (${over}px)`);
    await r.close();
  }
}

/* ================= every internal link resolves to a real file ========== */
{
  const seen = new Set(); const broken = [];
  for (const page of PAGES) {
    const p = await open(page);
    const hrefs = await p.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
    for (const href of hrefs) {
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const file = path.join(dir, path.dirname(page), href.split('#')[0]);
      const key = page + '->' + href;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!existsSync(file)) broken.push(key);
    }
    await p.close();
  }
  ok(broken.length === 0, `every internal link resolves (${seen.size} checked)` +
     (broken.length ? ': ' + broken.join(', ') : ''));
}

/* ================= home: the finish switcher and the pinned device ====== */
{
  const p = await open('index.html');
  await p.$eval('#finishes', el => el.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(700);
  for (const [key, label] of [['champagne','Champagne'],['verdigris','Verdigris'],['onyx','Onyx'],['titan','Natural']]) {
    await p.click(`.sw[data-finish="${key}"]`); await p.waitForTimeout(350);
    const r = await p.evaluate(() => ({
      attr: document.documentElement.dataset.finish,
      lite: getComputedStyle(document.documentElement).getPropertyValue('--f-lite').trim(),
      name: document.getElementById('fName').textContent,
      checked: document.querySelectorAll('.sw[aria-checked="true"]').length
    }));
    ok(r.attr === key && r.name === label && r.checked === 1,
       `[home] finish ${key} applies (--f-lite ${r.lite}, one radio checked)`);
  }
  await p.focus('.sw[data-finish="titan"]');
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => document.documentElement.dataset.finish) === 'champagne',
     '[home] arrow key moves the finish selection');

  /* the sticky device must hold position for the whole Detail section */
  const box = await p.evaluate(() => {
    const d = document.querySelector('.detail__stage').getBoundingClientRect();
    return { top: d.top + scrollY, h: d.height };
  });
  const tops = [];
  for (let i = 0; i < 5; i++) {
    await p.evaluate(JUMP, box.top + (box.h - 900) * (i / 4));
    await p.waitForTimeout(450);
    tops.push(await p.evaluate(() =>
      Math.round(document.querySelector('.dev--detail').getBoundingClientRect().top)));
  }
  const drift = Math.max(...tops) - Math.min(...tops);
  ok(drift < 120, `[home] detail device stays pinned (drift ${drift}px)`);

  await p.$eval('#atelier', el => el.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(500);
  await p.fill('#bn', 'Alex Reyes'); await p.fill('#be', 'not-an-email');
  await p.click('#book button[type="submit"]'); await p.waitForTimeout(200);
  ok(!/Thank you/.test(await p.textContent('#bookNote')), '[home] a malformed email is rejected');
  await p.fill('#be', 'alex@example.com');
  await p.click('#book button[type="submit"]'); await p.waitForTimeout(200);
  ok(/Thank you, Alex/.test(await p.textContent('#bookNote')), '[home] a valid submit acknowledges');
  await p.close();
}

/* ================= story: the pinned horizontal rail ==================== */
{
  const p = await open('story/index.html');
  await p.waitForTimeout(800);
  const box = await p.evaluate(() => {
    const r = document.querySelector('.rail').getBoundingClientRect();
    return { top: r.top + scrollY, h: r.height,
             over: document.querySelector('.rail__track').scrollWidth - innerWidth };
  });
  /* the section must be tall enough to spend the whole sideways travel */
  ok(box.h > box.over, `[story] rail is tall enough for its travel (${Math.round(box.h)}px for ${Math.round(box.over)}px)`);

  const seen = [];
  for (let i = 0; i <= 4; i++) {
    await p.evaluate(JUMP, box.top + (box.h - 900) * (i / 4));
    await p.waitForTimeout(450);
    seen.push(await p.evaluate(() => ({
      x: Math.round(new DOMMatrix(getComputedStyle(document.querySelector('.rail__track')).transform).m41),
      pin: Math.round(document.querySelector('.rail__pin').getBoundingClientRect().top)
    })));
  }
  const pinned = seen.every(s => Math.abs(s.pin) <= 2);
  ok(pinned, `[story] rail stays pinned throughout (tops ${seen.map(s => s.pin).join(',')})`);

  const xs = seen.map(s => s.x);
  const monotonic = xs.every((x, i) => i === 0 || x <= xs[i - 1]);
  ok(monotonic && xs[0] === 0 && Math.abs(xs.at(-1) + box.over) < 3,
     `[story] track travels its full width, one way (${xs.join(' → ')} of ${-Math.round(box.over)})`);

  /* with motion off the rail must stop pinning and become scrollable by hand */
  await p.close();
  const q = await open('story/index.html', { reducedMotion: 'reduce' });
  await q.waitForTimeout(600);
  const stat = await q.evaluate(() => {
    const r = document.querySelector('.rail');
    return { static: r.classList.contains('is-static'),
             scrollable: document.querySelector('.rail__pin').scrollWidth >
                         document.querySelector('.rail__pin').clientWidth };
  });
  ok(stat.static && stat.scrollable, '[story] with motion off the rail becomes a scrollable row');
  await q.close();
}

/* ================= workshop: the scrub-driven spine ===================== */
{
  const p = await open('workshop/index.html');
  const box = await p.evaluate(() => {
    const r = document.querySelector('.rooms__list').getBoundingClientRect();
    return { top: r.top + scrollY, h: r.height };
  });
  const ps = [];
  for (let i = 0; i <= 3; i++) {
    await p.evaluate(JUMP, box.top - 600 + (box.h + 600) * (i / 3));
    await p.waitForTimeout(400);
    ps.push(+await p.evaluate(() =>
      getComputedStyle(document.querySelector('.rooms__list')).getPropertyValue('--p')));
  }
  const rising = ps.every((v, i) => i === 0 || v >= ps[i - 1]);
  ok(rising && ps[0] < 0.5 && ps.at(-1) > 0.7,
     `[workshop] spine fills as the rooms scroll past (${ps.join(' → ')})`);
  await p.close();
}

await b.close(); await site.close();
console.log(fail ? `\n${fail} FAILING` : '\nall green');
process.exit(fail ? 1 : 0);
