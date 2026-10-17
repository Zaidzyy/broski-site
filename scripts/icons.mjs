// Brand files: copies Zaid's lockups and icon from assets-src/brand/ (git-ignored) into the repo,
// makes the SVG favicon and renders the 180 px apple-touch-icon. Usage: node scripts/icons.mjs
import { copyFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'assets-src/brand';
const OUT = 'src/assets/brand';
mkdirSync(OUT, { recursive: true });
for (const f of ['broski-lockup-L2-dark.svg', 'broski-lockup-L2-light.svg', 'broski-icon-tile.svg']) copyFileSync(`${SRC}/${f}`, `${OUT}/${f}`);
copyFileSync(`${SRC}/broski-icon-tile.svg`, 'public/favicon.svg');
// iOS fills transparency with black, so the tile's corners and margin get the tile's own colour instead.
await sharp(`${SRC}/broski-icon-tile.svg`, { density: 600 }).resize(180, 180).flatten({ background: '#15171B' }).png().toFile('public/apple-touch-icon.png');
console.log('brand files written');
