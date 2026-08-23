// Resizes every photo in images/ to 2000px on the long edge and exports
// 600 / 1200 / 2000 WebP (q80) with JPEG fallbacks (q82, mozjpeg).
// Writes images/optimized/ plus a manifest of real intrinsic dimensions
// so the HTML can carry accurate width/height attributes.
import sharp from 'sharp';
import { readdirSync, mkdirSync, writeFileSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const SRC = 'images';
const OUT = join(SRC, 'optimized');
// Long-edge targets. 1000 and 1400 exist because 600 -> 1200 is too coarse a
// step for a 390px phone at 2x, which needs ~780px: it was forced up to the
// 1200 file and paid ~130 KB for pixels it could not show.
const WIDTHS = [600, 1000, 1400, 2000];
const PHOTO_EXT = new Set(['.jpg', '.jpeg', '.png', '.heic', '.tif', '.tiff']);

mkdirSync(OUT, { recursive: true });

// Per-photo quality overrides, so the LCP image can be encoded harder than the
// rest without dropping quality across the whole gallery. Encoding once from
// the full-resolution source beats re-encoding an already-compressed variant.
const EDITS = existsSync('scripts/source-edits.json')
  ? JSON.parse(readFileSync('scripts/source-edits.json', 'utf8'))
  : {};
const qualityFor = (stem) => ({
  webp: (EDITS[stem]?.quality?.webp) ?? 80,
  jpg: (EDITS[stem]?.quality?.jpg) ?? 82,
});

const sources = readdirSync(SRC)
  .filter((f) => PHOTO_EXT.has(extname(f).toLowerCase()))
  .sort();

if (!sources.length) {
  console.error(`no source images found in ${SRC}/`);
  process.exit(1);
}

const manifest = {};
let inBytes = 0;
let outBytes = 0;

for (const file of sources) {
  const stem = basename(file, extname(file));
  const src = join(SRC, file);
  inBytes += statSync(src).size;

  // Honour EXIF orientation, then work from a single decoded pipeline.
  const base = sharp(src, { failOn: 'none' }).rotate();
  const meta = await base.metadata();
  const landscape = meta.width >= meta.height;
  const long = Math.max(meta.width, meta.height);

  const q = qualityFor(stem);
  const variants = [];

  for (const w of WIDTHS) {
    // w is the LONG edge. Never upscale past the original.
    const longEdge = Math.min(w, long);
    const resize = landscape ? { width: longEdge } : { height: longEdge };

    const pipeline = sharp(src, { failOn: 'none' })
      .rotate()
      .resize({ ...resize, withoutEnlargement: true });

    const webpPath = join(OUT, `${stem}-${w}.webp`);
    const jpgPath = join(OUT, `${stem}-${w}.jpg`);

    const [webpInfo, jpgInfo] = await Promise.all([
      pipeline.clone().webp({ quality: q.webp, effort: 6 }).toFile(webpPath),
      pipeline.clone().jpeg({ quality: q.jpg, mozjpeg: true, progressive: true }).toFile(jpgPath),
    ]);

    outBytes += webpInfo.size + jpgInfo.size;
    variants.push({ w, width: webpInfo.width, height: webpInfo.height, webp: webpInfo.size, jpg: jpgInfo.size });

    // The original was already shorter than this target — stop duplicating it.
    if (longEdge === long && w !== WIDTHS[WIDTHS.length - 1]) break;
  }

  const largest = variants[variants.length - 1];
  manifest[stem] = {
    width: largest.width,
    height: largest.height,
    aspect: +(largest.width / largest.height).toFixed(4),
    // Real pixel width of each variant — a srcset `w` descriptor must be the
    // file's actual width, which is not the long-edge target on a portrait.
    variants: variants.map((v) => ({ target: v.w, width: v.width, height: v.height })),
  };

  const kb = (n) => (n / 1024).toFixed(0).padStart(4) + ' KB';
  console.log(
    `${stem.padEnd(34)} ${meta.width}x${meta.height} -> ${largest.width}x${largest.height}  ` +
      variants.map((v) => `${v.w}:${kb(v.webp).trim()}`).join('  ')
  );
}

writeFileSync(join(SRC, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(`\n${sources.length} images   source ${mb(inBytes)} MB -> output ${mb(outBytes)} MB (all variants, both formats)`);
console.log(`manifest written to ${join(SRC, 'manifest.json')}`);
