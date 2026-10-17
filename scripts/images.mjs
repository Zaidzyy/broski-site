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
  for (const w of dim ? [520, 820] : [520, 820, 1254]) {
    const base = sharp(`${SRC}/${srcOf[name]}.png`).resize(w, w).ensureAlpha();
    const flat = await look(base).png().toBuffer();
    await write(sharp(flat), `${name}-${w}`, dim ? 38 : 52);
  }
}

// Expressions (blinks and glances), from assets-src/expressions/: same 1254 px framing as the hero files.
// The frames were regenerated, so hair edges differ by a few pixels everywhere. Swapping whole frames would
// make the hair shimmer, so each file keeps only the part that changes (a feathered ellipse: the eyes for a
// blink, brows to chin for a glance) and is transparent elsewhere, laid over the hero image.
// Same look and widths as the hero. No dim versions: the dimmed face only breathes, and the dim layer covers these.
const REGION = {
  bro: { eyes: [632, 428, 210, 80], face: [632, 560, 270, 270] },
  zara: { eyes: [640, 438, 215, 85], face: [640, 545, 255, 245] },
};
const EXPRESSIONS = { bro: { blink: 'eyes', thinking: 'face', laugh: 'face' }, zara: { blink: 'eyes', flirty: 'face', laugh: 'face' } };
const FULL = 1254;
const FEATHER = 40;
function ellipseMask(w, [cx, cy, rx, ry]) {
  const k = w / FULL;
  const m = Buffer.alloc(w * w);
  const edge = FEATHER / Math.min(rx, ry); // the feather, as a share of the radius
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    const r = Math.hypot((x / k - cx) / rx, (y / k - cy) / ry);
    const t = Math.min(1, Math.max(0, (1 - r) / edge));
    m[y * w + x] = Math.round(255 * t * t * (3 - 2 * t));
  }
  return m;
}
for (const [who, list] of Object.entries(EXPRESSIONS)) {
  for (const [ex, region] of Object.entries(list)) {
    for (const w of [520, 820, 1254]) {
      const base = sharp(`${SRC}/expressions/${who}-${ex}.png`).resize(w, w).ensureAlpha();
      const { data } = await sharp(await looks[`${who}-hero`](base).png().toBuffer()).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const mask = ellipseMask(w, REGION[who][region]);
      for (let i = 0; i < mask.length; i++) {
        data[i * 4 + 3] = Math.round((data[i * 4 + 3] * mask[i]) / 255);
        if (!data[i * 4 + 3]) data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 0; // nothing hidden for AVIF to encode
      }
      await write(sharp(data, { raw: { width: w, height: w, channels: 4 } }), `${who}-x-${ex}-${w}`, 52);
    }
  }
}

// Bubble avatars: a square around the face (the mockup's crop landed on the hairline).
for (const who of ['bro', 'zara']) {
  const crop = { left: 376, top: 238, width: 502, height: 502 };
  await write(sharp(`${SRC}/${who}-avatar.png`).extract(crop).resize(96, 96), `${who}-avatar`, 55);
}
console.log('images written to', OUT);
