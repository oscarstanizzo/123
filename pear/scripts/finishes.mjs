/* A four-up contact sheet of the finishes, which is the only reliable way to
   tell whether they still read as four different metals.
   node pear/scripts/finishes.mjs                                          */
import path from 'path';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(dir, 'shots');
await mkdir(out, { recursive: true });
const KEYS = ['titan', 'champagne', 'verdigris', 'onyx'];

const site = await serve(8792);
const b = await launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(site.url, { waitUntil: 'load' });
await p.click('a[href="#finishes"]'); await p.waitForTimeout(1200);

for (const k of KEYS) {
  await p.click(`.sw[data-finish="${k}"]`); await p.waitForTimeout(700);
  await (await p.$('.finish__stage')).screenshot({ path: path.join(out, `f-${k}.png`) });
}
/* compose them side by side, served over http so the <img> tags resolve */
const sheet = await b.newPage({ viewport: { width: 1360, height: 620 } });
await sheet.goto(site.url);
await sheet.setContent(
  `<body style="margin:0;background:#08090a;display:flex;align-items:center">` +
  KEYS.map(k => `<img src="/shots/f-${k}.png" style="width:25%">`).join('') + `</body>`);
await sheet.waitForTimeout(900);
await sheet.screenshot({ path: path.join(out, 'f-all.png') });
console.log('shots/f-all.png  (' + KEYS.join(', ') + ')');
await b.close(); await site.close();
