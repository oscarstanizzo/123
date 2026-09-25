/* Turns the generated PNGs in nexday/images/src/ into the WebP files the site
   ships. Source PNGs are ~3 MB each and never reach the browser; keep them out
   of the published build and out of git.

   Usage: node scripts/optimize-nexday-images.mjs */
import sharp from 'sharp';
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'nexday', 'images');
const src = join(root, 'src');
mkdirSync(root, { recursive: true });

/* Department shots are shown at ~270px wide on a category card and ~232px in a
   product grid, so 720px covers both at 2x with room to spare. The hero runs
   full-bleed, so it gets a desktop and a phone width. */
const JOBS = [
  { match: /^dept-/, width: 720, height: 540, quality: 74, suffix: '' },
  { match: /^hero-/, width: 1920, height: 1080, quality: 72, suffix: '' },
  { match: /^hero-/, width: 960, height: 540, quality: 70, suffix: '-960' }
];

const files = readdirSync(src).filter((f) => f.endsWith('.png'));
let total = 0;

for (const file of files) {
  for (const job of JOBS) {
    if (!job.match.test(file)) continue;
    const out = join(root, file.replace(/\.png$/, job.suffix + '.webp'));
    await sharp(join(src, file))
      .resize(job.width, job.height, { fit: 'cover' })
      .webp({ quality: job.quality })
      .toFile(out);
    const kb = Math.round(statSync(out).size / 1024);
    total += kb;
    console.log(String(kb).padStart(5) + ' KB  ' + out.split('/').pop());
  }
}

console.log('\n' + files.length + ' sources → ' + total + ' KB of WebP');
