/* Bundle the whole site into one self-contained file for hosts that forbid
   external requests — CSS, JS and both fonts inlined.
   The three pages become three panels behind a hash router, so one file still
   previews as a multi-page site.
   node pear/scripts/build-preview.mjs                                     */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(dir, f), 'utf8');

const PAGES = [
  { file: 'index.html',          id: 'home',     route: '/' },
  { file: 'story/index.html',    id: 'story',    route: '/story' },
  { file: 'workshop/index.html', id: 'workshop', route: '/workshop' }
];

/* ---------- styles: base first, then each page's own ------------------- */
let css = await read('css/base.css');
for (const name of ['home', 'story', 'workshop']) css += '\n' + await read(`css/${name}.css`);

/* fonts -> data URIs, so @font-face resolves with no network at all */
for (const name of ['archivo-var-latin', 'publicsans-var-latin']) {
  const b64 = (await readFile(path.join(dir, 'fonts', `${name}.woff2`))).toString('base64');
  const before = css;
  css = css.replace(`url("../fonts/${name}.woff2")`, `url("data:font/woff2;base64,${b64}")`);
  if (css === before) throw new Error(`font ${name} was not referenced by the CSS`);
}

/* ---------- panels ------------------------------------------------------ */
const linkMap = new Map([
  ['index.html', '#/'], ['../index.html', '#/'],
  ['story/index.html', '#/story'], ['../story/index.html', '#/story'],
  ['workshop/index.html', '#/workshop'], ['../workshop/index.html', '#/workshop']
]);

let panels = '';
for (const page of PAGES) {
  const html = await read(page.file);
  let body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
  body = body.replace(/\n?<script[^>]*><\/script>/g, '');

  /* rewrite every cross-page link to a route; in-page anchors are left alone */
  body = body.replace(/href="([^"]+)"/g, (whole, href) => {
    if (href.startsWith('#') || /^(https?:|mailto:|data:)/.test(href)) return whole;
    const [file, hash] = href.split('#');
    if (!linkMap.has(file)) return whole;
    return `href="${linkMap.get(file)}${hash ? '@' + hash : ''}"`;
  });

  /* Stacking whole pages in one document would repeat the ids that every page
     carries — nav and main. Suffix them per panel, and fix the skip link that
     points at one. */
  if (page.id !== 'home') {
    for (const id of ['nav', 'main']) {
      body = body.replaceAll(`id="${id}"`, `id="${id}-${page.id}"`)
                 .replaceAll(`href="#${id}"`, `href="#${id}-${page.id}"`);
    }
  }

  if (!body.includes('class="nav"')) throw new Error(`${page.file}: body extraction looks wrong`);
  panels += `<div class="pg" id="pg-${page.id}" data-route="${page.route}">\n${body}\n</div>\n`;
}
if (!panels.includes('id="stage"')) throw new Error('the home panel is missing its hero');

/* ---------- one module: the engine, the home behaviours, the router ----- */
const engine = (await read('js/scroll.js')).replace(/^export /gm, '');
const home = (await read('js/home.js'))
  .replace(/^import .*\n/m, '')
  .replace(/^init\(\);\s*$/m, '');          // the router decides when to start

const routerSrc = `/* ---------- router ------------------------------------------------------
   All three pages are in the DOM at once. Only the active one is displayed,
   so the observers on a hidden panel simply never fire; when it is shown,
   refresh() re-measures everything that was zero-height while hidden. */
const routePanels = [...document.querySelectorAll('.pg')];

function show(route, anchor) {
  const target = routePanels.find(p => p.dataset.route === route) || routePanels[0];
  for (const p of routePanels) {
    const on = p === target;
    p.hidden = !on;
    p.style.display = on ? '' : 'none';
  }
  document.title = target.id === 'pg-home' ? 'Pear — Ora'
    : target.id === 'pg-story' ? 'Pear — How we started' : 'Pear — The workshop';
  refresh();
  const el = anchor && target.querySelector('#' + CSS.escape(anchor));
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  else scrollTo({ top: 0, behavior: 'instant' });
  refresh();
}

function route() {
  /* "#/story@specs" — the part after @ is an anchor inside that page */
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, anchor] = raw.split('@');
  show(path || '/', anchor);
}
addEventListener('hashchange', route);

init();
route();
`;

/* Concatenating modules into one scope means a duplicated top-level name is a
   SyntaxError that kills the whole bundle — and the page still renders, just
   with no JavaScript at all, which is easy to miss. Catch it at build time. */
function topLevelNames(src) {
  const names = new Set();
  for (const m of src.matchAll(/^(?:export\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    names.add(m[1]);
  }
  return names;
}
{
  const seen = new Map();
  for (const [label, src] of [['scroll.js', engine], ['home.js', home], ['router', routerSrc]]) {
    for (const name of topLevelNames(src)) {
      if (seen.has(name)) {
        throw new Error(`bundle collision: "${name}" is declared at top level in both ` +
                        `${seen.get(name)} and ${label}`);
      }
      seen.set(name, label);
    }
  }
}

const script = engine + '\n' + home + '\n' + routerSrc;

const out = `<title>Pear Ora</title>
<meta name="description" content="A fictional house that makes one luxury phone a year — the product, the founding story, and the workshop.">
<style>
${css}
.pg[hidden]{display:none}
</style>
${panels}<script type="module">
${script}
</script>
`;
await writeFile(path.join(dir, 'preview.html'), out);
console.log(`preview.html  ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB (self-contained, ${PAGES.length} pages)`);
