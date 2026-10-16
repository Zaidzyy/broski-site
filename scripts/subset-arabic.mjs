// Subsets Noto Naskh Arabic 500 down to the one word on the page: كتاب (kitāb).
import subsetFont from 'subset-font';
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('node_modules/@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-arabic-500-normal.woff2');
const out = await subsetFont(src, 'كتاب', { targetFormat: 'woff2' });
writeFileSync('src/assets/fonts/naskh-kitab.woff2', out);
console.log('naskh-kitab.woff2', out.length, 'bytes (from', src.length, ')');
