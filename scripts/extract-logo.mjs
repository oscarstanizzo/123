// Extracts the Blandi Land logo out of the supplied screenshot: crops the
// artwork, keys the white background to transparent (un-premultiplying so the
// mark keeps its colour), and writes the three lockups the site uses.
//
// This source is a phone screenshot, so it is low resolution for a logo.
// Replace it with the vector original when Blandi supplies one.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = process.argv[2] || 'images/logo/_source-screenshot.png';
const OUT = 'images/logo';
mkdirSync(OUT, { recursive: true });

// Bands measured off the screenshot.
const CROPS = {
  'blandi-land-mark':   { left: 443, top: 932, width: 293, height: 181 }, // leaves + hill
  'blandi-land-lockup': { left: 336, top: 932, width: 498, height: 278 }, // + wordmark
  'blandi-land-full':   { left: 336, top: 932, width: 498, height: 334 }, // + rule + tagline
};

const PAD = 6;

// Display sizes (CSS px) x2 for retina.
const SIZES = {
  'blandi-land-mark': [80, 160],
  'blandi-land-lockup': [150, 300],
  'blandi-land-full': [220, 440],
};

for (const [name, box] of Object.entries(CROPS)) {
  const { data, info } = await sharp(SRC)
    .extract({
      left: box.left - PAD,
      top: box.top - PAD,
      width: box.width + PAD * 2,
      height: box.height + PAD * 2,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: W, height: H, channels: C } = info;
  const rgba = Buffer.alloc(W * H * 4);

  for (let p = 0; p < W * H; p++) {
    const i = p * C;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const a = 1 - Math.min(r, g, b) / 255;

    if (a < 0.03) continue; // stays fully transparent (also kills the screenshot's faint halo)

    // Un-premultiply the white ground so the artwork keeps its own colour.
    const un = (v) => Math.max(0, Math.min(255, Math.round((v - 255 * (1 - a)) / a)));
    rgba[p * 4] = un(r);
    rgba[p * 4 + 1] = un(g);
    rgba[p * 4 + 2] = un(b);
    rgba[p * 4 + 3] = Math.round(a * 255);
  }

  const base = sharp(rgba, { raw: { width: W, height: H, channels: 4 } });

  // Only ever displayed small, so ship 1x/2x rather than the full crop.
  for (const w of SIZES[name]) {
    // Palette PNG beats WebP on this flat artwork, so PNG is the only format.
    await base.clone().resize({ width: w }).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(`${OUT}/${name}-${w}.png`);
  }
  console.log(`${name.padEnd(20)} ${W}x${H}  ->  ${SIZES[name].join(', ')}px wide`);
}
