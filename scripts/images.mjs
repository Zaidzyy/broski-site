// Bakes the hero looks (the mockup's CSS filters) into the files and writes AVIF + WebP.
// Input: assets-src/*.png (git-ignored). Output: public/img/*.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'assets-src';
const OUT = 'src/assets/img';
mkdirSync(OUT, { recursive: true });

const contrast = (img, k) => img.linear(k, -(128 * k) + 128);
// sepia(.3): 70% identity + 30% the CSS sepia matrix
const S = [[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]];
const sepia = (a) => S.map((row, i) => row.map((v, j) => (i === j ? 1 - a : 0) + a * v));

const looks = {
  // grayscale(1) contrast(1.15) brightness(.92)
  'bro-hero': (i) => contrast(i.grayscale(), 1.15).modulate({ brightness: 0.92 }),
  // sepia(.3) saturate(1.1) contrast(1.05)
  'zara-hero': (i) => contrast(i.recomb(sepia(0.3)).modulate({ saturation: 1.1 }), 1.05),
  // grayscale(1) brightness(.35): the dimmed face when the other one is picked
  'bro-dim': (i) => i.grayscale().linear(0.35, 0),
  'zara-dim': (i) => i.grayscale().linear(0.35, 0),
};
const srcOf = { 'bro-hero': 'bro-hero', 'zara-hero': 'zara-hero', 'bro-dim': 'bro-hero', 'zara-dim': 'zara-hero' };

async function write(pipeline, name, q) {
  await pipeline.clone().avif({ quality: q, effort: 6 }).toFile(`${OUT}/${name}.avif`);
  await pipeline.clone().webp({ quality: q + 12, alphaQuality: 80 }).toFile(`${OUT}/${name}.webp`);
}

for (const [name, look] of Object.entries(looks)) {
  const dim = name.endsWith('-dim');
  for (const w of dim ? [820] : [820, 1254]) {
    const base = sharp(`${SRC}/${srcOf[name]}.png`).resize(w, w).ensureAlpha();
    const flat = await look(base).png().toBuffer();
    await write(sharp(flat), `${name}-${w}`, dim ? 38 : 52);
  }
}

// Bubble avatars: a square around the face (the mockup's crop landed on the hairline).
for (const who of ['bro', 'zara']) {
  const crop = { left: 376, top: 238, width: 502, height: 502 };
  await write(sharp(`${SRC}/${who}-avatar.png`).extract(crop).resize(96, 96), `${who}-avatar`, 55);
}
console.log('images written to', OUT);
