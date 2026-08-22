// Edits the renamed source photos before the optimizer derives anything:
//   blur — removes identifying details (house numbers, street signs)
//   crop — forces an aspect ratio, so the compare pair matches
// Config lives in scripts/source-edits.json, in source-pixel coordinates.
//
// Idempotent: a marker file per photo means re-running is a no-op, so this
// can sit in the pipeline without double-cropping on the next batch.
import sharp from 'sharp';
import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'images';
const CONFIG = 'scripts/source-edits.json';
const BLUR = 22;

const edits = JSON.parse(readFileSync(CONFIG, 'utf8'));
let done = 0;

for (const [slug, spec] of Object.entries(edits)) {
  const file = readdirSync(SRC).find((f) => f.replace(/\.[^.]+$/, '') === slug && /\.jpe?g$/i.test(f));
  if (!file) {
    console.log(`  skip ${slug} — no source file yet`);
    continue;
  }

  const path = join(SRC, file);
  const marker = join(SRC, `.${slug}.prepared`);
  if (existsSync(marker)) {
    console.log(`  skip ${slug} — already prepared`);
    continue;
  }

  let pipeline = sharp(path);
  const meta = await pipeline.metadata();
  const notes = [];

  if (spec.blur) {
    const patches = [];
    for (const b of spec.blur) {
      if (b.left + b.width > meta.width || b.top + b.height > meta.height) {
        throw new Error(`${slug}: blur region falls outside ${meta.width}x${meta.height}`);
      }
      patches.push({
        input: await sharp(path).extract({ left: b.left, top: b.top, width: b.width, height: b.height }).blur(BLUR).png().toBuffer(),
        left: b.left,
        top: b.top,
      });
      notes.push(`blurred ${b.width}x${b.height} at ${b.left},${b.top}`);
    }
    pipeline = pipeline.composite(patches);
  }

  let buf = await pipeline.jpeg({ quality: 95, subsampling: '4:4:4' }).toBuffer();

  if (spec.crop) {
    const { aspect, bias = 0.5 } = spec.crop;
    const cur = meta.width / meta.height;
    let box;

    if (cur > aspect) {
      // Too wide — trim the sides evenly.
      const w = Math.round(meta.height * aspect);
      box = { left: Math.round((meta.width - w) / 2), top: 0, width: w, height: meta.height };
    } else {
      // Too tall — trim top and bottom, `bias` of it off the top.
      const h = Math.round(meta.width / aspect);
      const excess = meta.height - h;
      box = { left: 0, top: Math.round(excess * bias), width: meta.width, height: h };
    }
    buf = await sharp(buf).extract(box).jpeg({ quality: 95, subsampling: '4:4:4' }).toBuffer();
    notes.push(`cropped ${meta.width}x${meta.height} -> ${box.width}x${box.height} (aspect ${(box.width / box.height).toFixed(3)})`);
  }

  writeFileSync(path, buf);
  writeFileSync(marker, new Date().toISOString() + '\n');
  console.log(`  ${slug}: ${notes.join('; ')}`);
  done++;
}

console.log(`\nprepared ${done} file(s)`);
