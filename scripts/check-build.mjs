// Static checks against the brief's hard requirements: every referenced asset
// exists, every image has alt + explicit dimensions, and the initial page
// weight stays under 1 MB.
import { readFileSync, existsSync, statSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const problems = [];
const notes = [];

// --- referenced assets exist -------------------------------------------------
const refs = new Set();
for (const m of html.matchAll(/(?:data-src|src|href)="((?:images|css|js|fonts)\/[^"]+)"/g)) refs.add(m[1]);
for (const m of html.matchAll(/(?:data-)?srcset="([^"]+)"/g)) {
  for (const part of m[1].split(',')) {
    const url = part.trim().split(/\s+/)[0];
    if (url) refs.add(url);
  }
}
for (const m of html.matchAll(/imagesrcset="([^"]+)"/g)) {
  for (const part of m[1].split(',')) {
    const url = part.trim().split(/\s+/)[0];
    if (url) refs.add(url);
  }
}

const missing = [...refs].filter((r) => !existsSync(r));
if (missing.length) problems.push(`${missing.length} referenced asset(s) missing:\n    ` + missing.join('\n    '));

// --- every <img> has alt, width, height --------------------------------------
const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
imgs.forEach((tag, i) => {
  const id = (/(?:data-)?src="([^"]+)"/.exec(tag) || [, `#${i}`])[1];
  if (!/\salt="/.test(tag)) problems.push(`<img> without alt: ${id}`);
  if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) problems.push(`<img> without explicit width/height: ${id}`);
});

// --- loading / fetchpriority --------------------------------------------------
const hero = imgs.filter((t) => t.includes('fetchpriority="high"'));
if (hero.length !== 1) problems.push(`expected exactly 1 image with fetchpriority="high", found ${hero.length}`);
if (hero[0] && /loading="lazy"/.test(hero[0])) problems.push('hero image must not be loading="lazy"');

const belowFold = imgs.filter((t) => !t.includes('fetchpriority="high"'));
const notLazy = belowFold.filter((t) => !/loading="lazy"/.test(t));
if (notLazy.length) problems.push(`${notLazy.length} below-the-fold image(s) missing loading="lazy"`);

// --- headings -----------------------------------------------------------------
const h1s = [...html.matchAll(/<h1\b/g)].length;
if (h1s !== 1) problems.push(`expected exactly 1 <h1>, found ${h1s}`);

// --- placeholders that must be replaced before launch ------------------------
if (html.includes('FORMSPREE_ENDPOINT_HERE')) notes.push('Formspree endpoint is still the placeholder');
if (html.includes('PLACEHOLDER REVIEWS')) notes.push('testimonials are still marked as placeholders');

// --- initial page weight ------------------------------------------------------
const size = (p) => (existsSync(p) ? statSync(p).size : 0);
const initial = [
  ['index.html', size('index.html')],
  ['css/main.css', size('css/main.css')],
  ['js/compare.js', size('js/compare.js')],
  ['js/reveal.js', size('js/reveal.js')],
  ['js/form.js', size('js/form.js')],
  ['fonts/archivo-var-latin.woff2', size('fonts/archivo-var-latin.woff2')],
  ['fonts/publicsans-var-latin.woff2', size('fonts/publicsans-var-latin.woff2')],
  ['hero 1200 webp', size('images/optimized/hero-front-yard-armour-stone-1200.webp')],
  ['before 1200 webp', size('images/optimized/backyard-transformation-before-1200.webp')],
  ['after 1200 webp', size('images/optimized/backyard-transformation-after-1200.webp')],
];

const total = initial.reduce((a, [, b]) => a + b, 0);
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

console.log('initial load (mobile viewport, above the fold):');
for (const [name, bytes] of initial) console.log(`  ${name.padEnd(32)} ${kb(bytes).padStart(10)}`);
console.log(`  ${'TOTAL'.padEnd(32)} ${kb(total).padStart(10)}   budget 1024.0 KB`);

if (total > 1024 * 1024) problems.push(`initial page weight ${kb(total)} exceeds the 1 MB budget`);

console.log('');
if (notes.length) {
  console.log('pre-launch to-do:');
  notes.forEach((n) => console.log('  - ' + n));
  console.log('');
}
if (problems.length) {
  console.log(`FAILED (${problems.length}):`);
  problems.forEach((p) => console.log('  - ' + p));
  process.exit(1);
}
console.log('all checks passed');
