// The L2 lockup (dark tile with the face + the "broski" wordmark), inlined at build time so it stays crisp.
// Source: src/assets/brand/ (written by scripts/icons.mjs). The two rose brows get a class for the hover lift.
import { readFileSync } from 'node:fs';

const raw = readFileSync('src/assets/brand/broski-lockup-L2-dark.svg', 'utf8');
const brows = ['<line x1="54"', '<line x1="220.70"'];
if (!brows.every((b) => raw.includes(b))) throw new Error('lockup: the two brow lines were not found');

export const LOCKUP = brows.reduce((svg, b) => svg.replace(b, b.replace('<line', '<line class="brow"')), raw)
  .replace(/<title>[^<]*<\/title>/, '')
  .replace(/ width="[^"]*" height="[^"]*"/, '')
  .replace('<svg ', '<svg class="lockup" aria-hidden="true" focusable="false" ')
  .trim();
