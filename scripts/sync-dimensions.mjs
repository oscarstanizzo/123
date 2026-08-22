// Rewrites every <img> width/height in index.html from the real intrinsic
// dimensions in images/manifest.json, and sets the before/after aspect ratio.
// Run after optimize-images.mjs so the markup never lies about aspect.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const HTML = 'index.html';
const MANIFEST = 'images/manifest.json';

if (!existsSync(MANIFEST)) {
  console.error(`${MANIFEST} not found — run: node scripts/optimize-images.mjs`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
let html = readFileSync(HTML, 'utf8');

const patched = [];
const unknown = new Set();

html = html.replace(/<img\b[^>]*>/g, (tag) => {
  const src = /src="images\/optimized\/([a-z0-9-]+)-\d+\.(?:jpg|webp)"/.exec(tag);
  if (!src) return tag;

  const stem = src[1];
  const dims = manifest[stem];
  if (!dims) {
    unknown.add(stem);
    return tag;
  }

  const before = tag;
  let out = tag
    .replace(/\swidth="\d+"/, ` width="${dims.width}"`)
    .replace(/\sheight="\d+"/, ` height="${dims.height}"`);

  if (!/\swidth="/.test(out)) out = out.replace(/^<img/, `<img width="${dims.width}" height="${dims.height}"`);
  if (out !== before) patched.push(`${stem} -> ${dims.width}x${dims.height}`);
  return out;
});

// The compare frame must match the shape of the before/after pair.
const beforeDims = manifest['backyard-transformation-before'];
const afterDims = manifest['backyard-transformation-after'];

if (beforeDims && afterDims) {
  if (Math.abs(beforeDims.aspect - afterDims.aspect) > 0.02) {
    console.warn(
      `! before/after aspects differ (${beforeDims.aspect} vs ${afterDims.aspect}) — ` +
        `the slider will cover-crop to match. Consider cropping them to the same shape.`
    );
  }
  const ratio = `${beforeDims.width}/${beforeDims.height}`;
  html = html.replace(/--ba-aspect:[^"]*/, `--ba-aspect:${ratio}`);
  console.log(`compare frame aspect -> ${ratio}`);
}

writeFileSync(HTML, html);

console.log(`\npatched ${patched.length} <img> tags:`);
patched.forEach((p) => console.log('  ' + p));

if (unknown.size) {
  console.log(`\nreferenced but not in manifest (${unknown.size}):`);
  [...unknown].forEach((s) => console.log('  ' + s));
}
