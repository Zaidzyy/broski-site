// Writes README.md from docs/README.template.md, filling every number from src/data/facts.json
// and the 36 features from src/data/features.ts. Run after editing either: npm run readme
import { readFileSync, writeFileSync } from 'node:fs';
import { GROUPS } from '../src/data/features.ts';

const facts = JSON.parse(readFileSync('src/data/facts.json', 'utf8'));
const features = GROUPS
  .map((g) => [`**${g.g}**`, ...g.items.map((it) => `- ${it.t}: ${it.d}`)].join('\n'))
  .join('\n\n');
const fmt = (v) => (typeof v === 'number' && v >= 1000 ? v.toLocaleString('en-US') : String(v));
const out = readFileSync('docs/README.template.md', 'utf8')
  .replace('{{FEATURES}}', features)
  .replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in facts)) throw new Error(`facts.json has no "${k}"`);
    return fmt(facts[k]);
  });
writeFileSync('README.md', out);
console.log('README.md written');
