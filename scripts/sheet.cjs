// Dev helper: contact sheet of screenshots. node scripts/sheet.cjs <dir> <out> <cols> <width> <prefix...>
const sharp = require('sharp');
const fs = require('fs');
const [dir, out, cols, w, ...pat] = process.argv.slice(2);
(async () => {
  const files = fs.readdirSync(dir).filter((f) => pat.some((p) => f.startsWith(p))).sort();
  const imgs = await Promise.all(files.map((f) => sharp(`${dir}/${f}`).resize(+w).toBuffer({ resolveWithObject: true })));
  const h = Math.max(...imgs.map((i) => i.info.height)), c = +cols, rows = Math.ceil(imgs.length / c);
  await sharp({ create: { width: c * (+w + 8), height: rows * (h + 8), channels: 3, background: '#444' } })
    .composite(imgs.map((im, i) => ({ input: im.data, left: (i % c) * (+w + 8), top: Math.floor(i / c) * (h + 8) }))).png().toFile(out);
  console.log(files.join(' '));
})();
