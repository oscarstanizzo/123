// Applies the camera-filename → descriptive-slug mapping.
// Anything not on the list is left alone and reported, never guessed at.
import { readdirSync, renameSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const DIR = 'images';

const MAP = {
  IMG_9148: 'hero-front-yard-armour-stone',
  IMG_0566: 'backyard-transformation-before',
  IMG_0547: 'backyard-transformation-after',
  IMG_7969: 'crew-loaded-bin-junk-removal',
  IMG_0543: 'river-rock-shed-bed',
  IMG_0580: 'cleanup-side-yard-before',
  IMG_0733: 'mulch-backyard-japanese-maple',
  IMG_9337: 'front-bed-hostas-rock-accent',
  IMG_0717: 'foundation-bed-hemlock',
  IMG_0704: 'mulch-ring-mature-pine-after',
  IMG_0685: 'mulch-ring-fabric-during',
  IMG_9570: 'new-planting-timber-edge',
  IMG_9560: 'cedar-hedge-stained-fence',
};

const files = readdirSync(DIR).filter((f) => !f.startsWith('.'));
const renamed = [];
const already = [];
const unknown = [];

for (const file of files) {
  const ext = extname(file);
  const stem = basename(file, ext);
  const target = MAP[stem.toUpperCase()];

  if (!target) {
    if (Object.values(MAP).includes(stem)) already.push(file);
    else unknown.push(file);
    continue;
  }

  const dest = join(DIR, target + ext.toLowerCase());
  if (existsSync(dest)) {
    console.error(`! refusing to overwrite existing ${dest} (from ${file})`);
    continue;
  }
  renameSync(join(DIR, file), dest);
  renamed.push(`${file}  ->  ${target}${ext.toLowerCase()}`);
}

console.log(`\nrenamed (${renamed.length}):`);
renamed.forEach((r) => console.log('  ' + r));

if (already.length) {
  console.log(`\nalready renamed (${already.length}):`);
  already.forEach((f) => console.log('  ' + f));
}

const missing = Object.entries(MAP).filter(
  ([, slug]) => !readdirSync(DIR).some((f) => basename(f, extname(f)) === slug)
);
if (missing.length) {
  console.log(`\nMISSING from folder (${missing.length}) — on the mapping but no file found:`);
  missing.forEach(([k, v]) => console.log(`  ${k} (${v})`));
}

if (unknown.length) {
  console.log(`\nNOT ON THE MAPPING (${unknown.length}) — left untouched, inspect before assuming:`);
  unknown.forEach((f) => console.log('  ' + f));
}
console.log('');
