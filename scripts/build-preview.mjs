// Bundles the site into one self-contained HTML file for the Artifact viewer:
// CSS, JS, fonts and photos all inlined, since the viewer's CSP blocks every
// external host. Photos still missing get a labelled placeholder instead of a
// broken image, so the layout still reads.
//
// The document is split into head and body FIRST, and markup rewrites only
// ever touch the body. Inlining assets into one big string and then running
// HTML regexes over the whole thing is a trap: main.css mentions "<picture>"
// in a comment, which made a <picture>...</picture> match swallow <body>.
//
// Preview build only. The real site stays as separate files.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'preview.html';
const src = readFileSync('index.html', 'utf8');

const dataUri = (p, mime) => `data:${mime};base64,${readFileSync(p).toString('base64')}`;

// --- split ------------------------------------------------------------
// The page's own <title> is written for search results, which makes a poor
// name in a gallery of artifacts. The preview gets the brand name.
const title = 'Blandi Land';
const head = (/<head>([\s\S]*?)<\/head>/.exec(src) || [, ''])[1];
let body = (/<body>([\s\S]*)<\/body>/.exec(src) || [, ''])[1];
if (!body) throw new Error('could not find <body> in index.html');

// --- styles: critical block from head, plus main.css ------------------
let critical = (/<style>([\s\S]*?)<\/style>/.exec(head) || [, ''])[1];
for (const f of ['archivo-var-latin', 'publicsans-var-latin']) {
  critical = critical.replace(`url(fonts/${f}.woff2) format('woff2')`, `url(${dataUri(`fonts/${f}.woff2`, 'font/woff2')}) format('woff2')`);
}
const main = readFileSync('css/main.css', 'utf8');

// --- body rewrites ----------------------------------------------------
body = body.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');   // JS is always on in the viewer
body = body.replace(/<!--\s*TODO:[\s\S]*?-->/g, '');

// One variant each, no srcset: the viewer is not a bandwidth test. Sizes come
// from the manifest so this keeps working when the variant set changes.
const manifest = existsSync('images/manifest.json') ? JSON.parse(readFileSync('images/manifest.json', 'utf8')) : {};
const pick = (slug) => {
  const v = manifest[slug] && manifest[slug].variants;
  if (!v) return null;
  const want = /hero-front-yard|backyard-transformation/.test(slug) ? 1100 : 700;
  return (v.find((x) => x.width >= want) || v[v.length - 1]).target;
};
const missing = new Set();

body = body.replace(/<picture\b[\s\S]*?<\/picture>/g, (block) => {
  const slug = (/(?:data-)?src="images\/optimized\/([a-z0-9-]+)-\d+\.(?:jpg|webp)"/.exec(block) || [])[1];
  if (!slug) return block;

  const target = pick(slug);
  const file = target ? `images/optimized/${slug}-${target}.webp` : '';
  const img = (/<img\b[^>]*>/.exec(block) || [''])[0];
  const alt = (/alt="([^"]*)"/.exec(img) || [, ''])[1];

  if (!file || !existsSync(file)) {
    missing.add(slug);
    return `<div class="pending" role="img" aria-label="Photo not uploaded yet: ${slug.replace(/-/g, ' ')}"><span>photo not uploaded yet</span><small>${slug.replace(/-/g, ' ')}</small></div>`;
  }

  const dims = /width="(\d+)" height="(\d+)"/.exec(img);
  return `<img src="${dataUri(file, 'image/webp')}"${dims ? ` width="${dims[1]}" height="${dims[2]}"` : ''}${/loading="lazy"/.test(img) ? ' loading="lazy"' : ''} decoding="async" alt="${alt}">`;
});

for (const [cls, asset] of [
  ['header__logo', 'images/logo/blandi-land-lockup-300.png'],
  ['footer__logo', 'images/logo/blandi-land-full-440.png'],
]) {
  body = body.replace(new RegExp(`<img class="${cls}"[^>]*>`), (t) =>
    t.replace(/src="[^"]*"/, `src="${dataUri(asset, 'image/png')}"`).replace(/\ssrcset="[^"]*"/, '').replace(/\ssizes="[^"]*"/, '')
  );
}

const pendingCss = `
.pending{
  display:grid;place-content:center;gap:.4rem;text-align:center;
  aspect-ratio:4/3;width:100%;
  background:repeating-linear-gradient(45deg,#EFF0EA,#EFF0EA 10px,#E7E9E1 10px,#E7E9E1 20px);
  border:1px dashed #C9CDC2;color:#63685E;
}
.pending span{font-size:.8125rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.pending small{font-size:.8125rem;opacity:.75}`;

const js = ['form', 'compare', 'reveal'].map((s) => `<script>\n${readFileSync(`js/${s}.js`, 'utf8')}\n</script>`).join('\n');

// index.html sets this in <head>; main.css hides the slider chrome without it
// (html:not(.js) rules), so dropping the head must not drop this.
const jsFlag = '<script>document.documentElement.className+=" js";<\/script>';

writeFileSync(OUT, `${jsFlag}
<title>${title}</title>
<style>${critical}</style>
<style>${main}</style>
<style>${pendingCss}</style>
${body}
${js}
`);

const size = readFileSync(OUT).length;
console.log(`${OUT} written — ${(size / 1024 / 1024).toFixed(2)} MB`);

// Sanity: the bundle must actually carry the page, not just its shell.
const out = readFileSync(OUT, 'utf8');
const imgs = (out.match(/<img /g) || []).length;
const inlined = (out.match(/data:image\//g) || []).length;
console.log(`  ${imgs} <img> tags, ${inlined} inlined, ${(out.match(/class="pending"/g) || []).length} placeholders`);
if (!out.includes('compare__frame') || inlined === 0) throw new Error('bundle looks incomplete');
if (!out.includes('className+=" js"')) throw new Error('missing the .js flag — main.css would hide the slider chrome');
if (missing.size) {
  console.log(`\nplaceholders for ${missing.size} photo(s) not yet uploaded:`);
  [...missing].forEach((s) => console.log('  ' + s));
}
