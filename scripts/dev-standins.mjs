// Stand-in photos ONLY for local perf/layout testing until the real ones land.
// Noise is added so WebP/JPEG compress to realistic photographic sizes.
import sharp from 'sharp';

const names = [
  ['IMG_9148','hero front yard armour stone','#5b6b4a',4032,3024],
  ['IMG_0566','BEFORE overgrown backyard','#6b5f4a',4032,2688],
  ['IMG_0547','AFTER river rock + fence','#3f6b52',4032,2688],
  ['IMG_7969','crew loaded bin','#4a5b6b',4032,3024],
  ['IMG_0543','river rock shed bed','#7a7f78',4032,3024],
  ['IMG_0580','cleanup side yard before','#6b6350',4032,3024],
  ['IMG_0733','mulch japanese maple','#3b3330',4032,3024],
  ['IMG_9337','front bed hostas','#4f6b3f',4032,3024],
  ['IMG_0717','foundation bed hemlock','#37503c',4032,3024],
  ['IMG_0704','mulch ring pine after','#453a33',4032,3024],
  ['IMG_0685','mulch ring fabric during','#5a5148',4032,3024],
  ['IMG_9570','new planting timber edge','#5d6b46',4032,3024],
  ['IMG_9560','cedar hedge stained fence','#8a6440',4032,3024],
];

for (const [file, label, bg, W, H] of names) {
  const noise = await sharp({
    create: { width: Math.round(W / 3), height: Math.round(H / 3), channels: 3, noise: { type: 'gaussian', mean: 128, sigma: 42 } },
  }).png().toBuffer();

  const overlay = Buffer.from(
    `<svg width="${W}" height="${H}">` +
      `<rect width="${W}" height="${H}" fill="${bg}" opacity="0.55"/>` +
      `<text x="50%" y="50%" font-family="sans-serif" font-size="${Math.round(W / 22)}" fill="#fff" text-anchor="middle" opacity="0.92">${label}</text>` +
      `<text x="50%" y="60%" font-family="sans-serif" font-size="${Math.round(W / 45)}" fill="#fff" text-anchor="middle" opacity="0.6">${W}x${H} STAND-IN</text>` +
      `</svg>`
  );

  await sharp(noise)
    .resize(W, H)
    .composite([{ input: overlay }])
    .jpeg({ quality: 95 })
    .toFile(`images/${file}.jpg`);
}
console.log('stand-ins created:', names.length);
