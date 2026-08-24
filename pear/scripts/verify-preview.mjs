/* The bundle is a different artefact from the site — three pages stacked in one
   document behind a router — so it needs its own checks.
   Run: node pear/scripts/build-preview.mjs && node pear/scripts/verify-preview.mjs */
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';

const site = await serve(8796);
const b = await launch();
let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS  ' : 'FAIL  ') + m); if (!c) fail++; };

const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [], external = [];
p.on('pageerror', e => errs.push(String(e)));
/* The browser asks for /favicon.ico on its own and logs a generic
   "Failed to load resource" with no URL attached. Network failures that matter
   are caught by the response handler below, so drop that one message rather
   than letting it mask real script errors. */
p.on('console', m => {
  if (m.type() !== 'error') return;
  const t = m.text();
  if (/Failed to load resource/.test(t)) return;
  errs.push(t);
});
p.on('response', r => {
  if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errs.push(r.status() + ' ' + r.url());
});
p.on('request', r => {
  const u = r.url();
  /* favicon.ico is requested by the browser itself and is supplied by the host,
     not the bundle, so a 404 for it says nothing about this file */
  if (!u.startsWith('http://127.0.0.1') && !u.startsWith('data:') && !u.endsWith('favicon.ico')) {
    external.push(u);
  }
});
await p.goto('http://127.0.0.1:8796/preview.html', { waitUntil: 'load' });
await p.waitForTimeout(1300);

ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
/* the whole point of the bundle: it must reach nothing outside itself */
ok(external.length === 0, 'no external requests' + (external.length ? ': ' + external.join(', ') : ''));
ok(await p.evaluate(() => document.fonts.check('600 16px Archivo') &&
                          document.fonts.check('400 16px PublicSans')),
   'both fonts resolve from their data URIs');

/* stacking pages must not leave two elements sharing an id */
const dupes = await p.evaluate(() => {
  const seen = new Map(), dup = [];
  for (const el of document.querySelectorAll('[id]')) {
    if (seen.has(el.id)) dup.push(el.id); else seen.set(el.id, 1);
  }
  return [...new Set(dup)];
});
ok(dupes.length === 0, 'no duplicate ids across the stacked pages' +
   (dupes.length ? ': ' + dupes.join(', ') : ''));

const visible = () => p.evaluate(() =>
  [...document.querySelectorAll('.pg')].filter(x => getComputedStyle(x).display !== 'none')
    .map(x => x.id));

ok((await visible()).join() === 'pg-home', 'the default route shows the home page');

for (const [route, id, title] of [['#/story', 'pg-story', 'How we started'],
                                  ['#/workshop', 'pg-workshop', 'The workshop'],
                                  ['#/', 'pg-home', 'Ora']]) {
  await p.click(`.pg:not([hidden]) .nav__links a[href="${route}"], .pg:not([hidden]) .brand[href="${route}"]`);
  await p.waitForTimeout(800);
  const v = await visible();
  ok(v.join() === id && (await p.title()).includes(title),
     `${route} shows only ${id} and retitles the tab`);
}

/* a panel is display:none when the engine first measures it, so the rail's
   travel is zero until refresh() re-measures on route change */
await p.click('.pg:not([hidden]) .nav__links a[href="#/story"]');
await p.waitForTimeout(800);
const rail = await p.evaluate(() => {
  const r = document.querySelector('#pg-story .rail').getBoundingClientRect();
  const t = document.querySelector('#pg-story .rail__track');
  return { h: Math.round(r.height), over: Math.round(t.scrollWidth - innerWidth) };
});
ok(rail.over > 0 && rail.h > rail.over,
   `the rail is re-measured after its panel is shown (${rail.h}px for ${rail.over}px of travel)`);

await p.evaluate(() => {
  const r = document.querySelector('#pg-story .rail').getBoundingClientRect();
  scrollTo({ top: r.top + scrollY + r.height / 2, behavior: 'instant' });
});
await p.waitForTimeout(600);
const x = await p.evaluate(() => Math.round(
  new DOMMatrix(getComputedStyle(document.querySelector('#pg-story .rail__track')).transform).m41));
ok(x < -100, `the rail still scrubs inside the bundle (x ${x})`);

/* the nav belongs to the visible panel, not just the first one in the document */
const stuck = await p.evaluate(() =>
  document.querySelector('#pg-story .nav').classList.contains('is-stuck'));
ok(stuck, "the visible panel's own nav responds to scroll");

await b.close(); await site.close();
console.log(fail ? `\n${fail} FAILING` : '\nall green');
process.exit(fail ? 1 : 0);
