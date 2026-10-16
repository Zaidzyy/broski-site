// Waits until at least 4 GB of RAM is free before a browser run (the laptop is shared with Broski).
// Re-checks every 2 minutes for up to 30 minutes; every wait is appended to docs/ram-waits.log.
import { freemem } from 'node:os';
import { appendFileSync } from 'node:fs';

const NEED = 4 * 1024 ** 3, STEP = 120_000, MAX = 30 * 60_000;
const gb = () => (freemem() / 1024 ** 3).toFixed(2);
const log = (m) => { const line = `${new Date().toISOString()} ${m}`; console.log(line); appendFileSync('docs/ram-waits.log', line + '\n'); };

const t0 = Date.now();
while (freemem() < NEED) {
  if (Date.now() - t0 >= MAX) { log(`gave up after 30 min, free ${gb()} GB (${process.argv[2] || 'run'})`); process.exit(2); }
  log(`free ${gb()} GB < 4 GB, waiting 2 min (${process.argv[2] || 'run'})`);
  await new Promise((r) => setTimeout(r, STEP));
}
console.log(`RAM ok: ${gb()} GB free`);
