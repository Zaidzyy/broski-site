// Brand files: copies Zaid's lockups and icons from assets-src/brand/ (git-ignored) into the repo,
// makes the favicon from the small-size icon (heavier strokes, for 16–32 px) with a 32 px PNG fallback,
// and renders the 180 px apple-touch-icon from the tile (it's shown large). Usage: node scripts/icons.mjs
import { copyFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'assets-src/brand';
const OUT = 'src/assets/brand';
mkdirSync(OUT, { recursive: true });
for (const f of ['broski-lockup-L2-dark.svg', 'broski-lockup-L2-light.svg', 'broski-icon-tile.svg', 'broski-icon-tray-thick.svg']) copyFileSync(`${SRC}/${f}`, `${OUT}/${f}`);
// a new file name, so browsers that cached the old favicon fetch this one
copyFileSync(`${SRC}/broski-icon-tray-thick.svg`, 'public/favicon-v2.svg');
await sharp(`${SRC}/broski-icon-tray-thick.svg`, { density: 600 }).resize(32, 32).png().toFile('public/favicon-32.png');
// iOS fills transparency with black, so the tile's corners and margin get the tile's own colour instead.
await sharp(`${SRC}/broski-icon-tile.svg`, { density: 600 }).resize(180, 180).flatten({ background: '#15171B' }).png().toFile('public/apple-touch-icon.png');
console.log('brand files written');
