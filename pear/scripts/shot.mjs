/* Screenshots for eyeballing changes.
   node pear/scripts/shot.mjs              -> hero + full page at 1440 and 390
   node pear/scripts/shot.mjs 1440 #specs  -> one section at one width      */
import path from 'path';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(dir, 'shots');
await mkdir(out, { recursive: true });

const width = Number(process.argv[2]) || null;
const section = process.argv[3] || null;
const page = process.env.PAGE || 'index.html';   // 'story/index.html', ...
const widths = width ? [width] : [1440, 390];

const site = await serve(8791);
const b = await launch();

for (const w of widths) {
  const p = await b.newPage({
    viewport: { width: w, height: w > 800 ? 900 : 844 }, deviceScaleFactor: 2
  });
  await p.goto(site.url.replace('index.html', page), { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  if (section) {
    /* walk the page first so the reveals along the way have fired */
    const h = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 500) {
      await p.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y);
      await p.waitForTimeout(80);
    }
    const el = await p.$(section);
    if (!el) { console.log('no such section: ' + section); await p.close(); continue; }
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
    await el.screenshot({ path: path.join(out, `${page.split('/')[0].replace('.html','')}-${w}${section.replace('#','-')}.png`) });
    console.log(`shots/${page.split('/')[0].replace('.html','')}-${w}${section.replace('#','-')}.png`);
  } else {
    await p.screenshot({ path: path.join(out, `${page.split('/')[0].replace('.html','')}-hero-${w}.png`) });
    const h = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 500) {
      await p.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y);
      await p.waitForTimeout(90);
    }
    await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(out, `${page.split('/')[0].replace('.html','')}-full-${w}.png`), fullPage: true });
    console.log(`shots for ${page} at ${w} (page ${h}px)`);
  }
  await p.close();
}
await b.close(); await site.close();
