// Rewrites every image reference in index.html from images/manifest.json:
//   - width/height attributes, from the real intrinsic size
//   - srcset / data-srcset / imagesrcset, with each variant's REAL pixel width
//   - the before/after slider's aspect ratio
//
// The srcset part matters more than it looks. The optimizer sizes by long
// edge, so a portrait photo's "1200" file is only ~950px wide; declaring it
// as 1200w tells the browser it has more resolution than it does.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const HTML = 'index.html';
const MANIFEST = 'images/manifest.json';

if (!existsSync(MANIFEST)) {
  console.error(`${MANIFEST} not found — run: node scripts/optimize-images.mjs`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
let html = readFileSync(HTML, 'utf8');

const srcsetFor = (slug, ext) => {
  const m = manifest[slug];
  if (!m || !m.variants) return null;
  return m.variants.map((v) => `images/optimized/${slug}-${v.target}.${ext} ${v.width}w`).join(', ');
};

const slugOf = (s) => (/images\/optimized\/([a-z0-9-]+)-\d+\.(?:jpg|webp)/.exec(s) || [])[1];

const patched = [];
const unknown = new Set();

// --- srcset / data-srcset on <source> and <img> -------------------------
html = html.replace(/(data-)?srcset="([^"]*images\/optimized\/[^"]*)"/g, (whole, dataPrefix, value) => {
  const slug = slugOf(value);
  if (!slug) return whole;
  if (!manifest[slug]) { unknown.add(slug); return whole; }

  const ext = /\.webp/.test(value) ? 'webp' : 'jpg';
  const next = srcsetFor(slug, ext);
  if (!next) return whole;
  patched.push(`${slug} ${ext} srcset`);
  return `${dataPrefix || ''}srcset="${next}"`;
});

// --- the hero preload -----------------------------------------------------
html = html.replace(/imagesrcset="([^"]*)"/g, (whole, value) => {
  const slug = slugOf(value);
  if (!slug || !manifest[slug]) return whole;
  patched.push(`${slug} preload imagesrcset`);
  return `imagesrcset="${srcsetFor(slug, 'webp')}"`;
});

// --- default src, in case its variant no longer exists --------------------
html = html.replace(/(data-)?src="images\/optimized\/([a-z0-9-]+)-(\d+)\.(jpg|webp)"/g, (whole, dataPrefix, slug, target, ext) => {
  const m = manifest[slug];
  if (!m || !m.variants) return whole;
  if (m.variants.some((v) => String(v.target) === target)) return whole;
  // Fall back to the middle variant.
  const mid = m.variants[Math.min(1, m.variants.length - 1)];
  patched.push(`${slug} src -> ${mid.target}`);
  return `${dataPrefix || ''}src="images/optimized/${slug}-${mid.target}.${ext}"`;
});

// --- width / height -------------------------------------------------------
html = html.replace(/<img\b[^>]*>/g, (tag) => {
  const slug = slugOf(tag);
  if (!slug) return tag;
  const dims = manifest[slug];
  if (!dims) { unknown.add(slug); return tag; }

  let out = tag.replace(/\swidth="\d+"/, ` width="${dims.width}"`).replace(/\sheight="\d+"/, ` height="${dims.height}"`);
  if (!/\swidth="/.test(out)) out = out.replace(/^<img/, `<img width="${dims.width}" height="${dims.height}"`);
  if (out !== tag) patched.push(`${slug} -> ${dims.width}x${dims.height}`);
  return out;
});

// --- compare frame aspect -------------------------------------------------
const before = manifest['backyard-transformation-before'];
const after = manifest['backyard-transformation-after'];
if (before && after) {
  if (Math.abs(before.aspect - after.aspect) > 0.02) {
    console.warn(`! before/after aspects differ (${before.aspect} vs ${after.aspect}) — the slider will cover-crop to match.`);
  }
  html = html.replace(/--ba-aspect:[^"]*/, `--ba-aspect:${before.width}/${before.height}`);
  console.log(`compare frame aspect -> ${before.width}/${before.height}`);
}

writeFileSync(HTML, html);

console.log(`\npatched ${patched.length} reference(s)`);
if (unknown.size) {
  console.log(`\nreferenced but not in manifest (${unknown.size}):`);
  [...unknown].forEach((s) => console.log('  ' + s));
}
