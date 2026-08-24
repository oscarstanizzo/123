/* Assemble the pages from src/ + partials/.
   Three pages share a nav, a footer and the device drawing; keeping three
   copies of those in sync by hand is the kind of thing that silently drifts,
   so they live in partials/ and get stitched in here.
   node pear/scripts/build.mjs                                            */
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(dir, f), 'utf8');

const PAGES = [
  { src: 'index.html',    out: 'index.html',              root: '',    id: 'home' },
  { src: 'story.html',    out: 'story/index.html',        root: '../', id: 'story' },
  { src: 'workshop.html', out: 'workshop/index.html',     root: '../', id: 'workshop' }
];
const IDS = PAGES.map(p => p.id);

/* The hundred squares are written into the HTML rather than built by script,
   so the figure still reads with JavaScript off. Six are bought-back units;
   the positions are fixed so the picture is the same on every build. */
const BOUGHT_BACK = new Set([7, 23, 41, 58, 76, 92]);
const dots = Array.from({ length: 100 }, (_, i) =>
  `<span class="d${BOUGHT_BACK.has(i) ? ' d--off' : ''}" style="--i:${i}"></span>`
).join('');

const partials = {
  mark:     await read('partials/mark.html'),
  nav:      await read('partials/nav.html'),
  footer:   await read('partials/footer.html'),
  'device-sprite': await read('partials/device-sprite.html')
};

for (const page of PAGES) {
  let html = await read(path.join('src', page.src));

  /* {{> name}} pulls in a partial; partials may themselves use {{mark}} */
  html = html.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    if (!(name in partials)) throw new Error(`${page.src}: no partial "${name}"`);
    return partials[name];
  });
  html = html.replaceAll('{{mark}}', partials.mark.trim());
  html = html.replaceAll('{{dots}}', dots);

  /* {{root}} makes every shared link work from both / and /story/ */
  html = html.replaceAll('{{root}}', page.root);

  /* mark the current page in the nav */
  for (const id of IDS) {
    html = html.replaceAll(`{{on-${id}}}`, id === page.id ? ' aria-current="page"' : '');
  }

  const left = html.match(/\{\{[^}]+\}\}/);
  if (left) throw new Error(`${page.src}: unresolved token ${left[0]}`);

  const target = path.join(dir, page.out);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
  console.log(`${page.out.padEnd(22)} ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
}
