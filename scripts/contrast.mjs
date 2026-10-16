// AA check for every sky phase of the day.
// 1) Picks the page-sky dimming (the dark layer behind the scene text) per scene, so accent,
//    bone at 72 % / 80 %, the hour chips and the grey labels (#B4AC9E) on the sky all pass 4.5:1.
// 2) Checks the dial digits against the vivid sky inside the dial.
// Run: node scripts/contrast.mjs   (the DIM row it prints is pasted into src/day.ts)
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const mix = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t); // t of b over a (sRGB, like the browser)

const BONE = hex('#EDE4D3'), INK = hex('#0C0B0A'), DIMC = hex('#090808');
const ROSE = hex('#D88A9C'), STEEL = hex('#8EA4BA'), CHIP = hex('#A39C90'), SKYGREY = hex('#B4AC9E');
const DAWN = hex('#E7A06A');
const DUSK = { zara: { glow: '#B9687D', sky: '#4A2430' }, bro: { glow: '#4F6377', sky: '#22303D' } };
const scenes = [
  ['04:00', '#05060A', 0, 0, false], ['07:42', '#2B2533', 1, 0, false], ['08:30', '#6E6A7A', .8, 0, false],
  ['10:00', '#C7B9B0', .5, 0, true], ['11:15', '#A8BACB', .1, 0, true], ['12:30', '#CFDDE8', 0, 0, true],
  ['14:03', '#EDE4D3', 0, 0, true], ['15:20', '#E6D3B3', 0, .2, true], ['16:40', '#D79A62', 0, .9, true],
  ['19:10', '#B7735E', .3, 1, true], ['21:30', 'DUSK', 0, 1, false], ['23:00', '#040406', 0, .1, false],
];
const rows = [];
const dims = [];
for (const [t, sky, dawn, dusk, dark] of scenes) {
  let worstDim = 0.58;
  for (const p of ['zara', 'bro']) {
    const s = hex(sky === 'DUSK' ? DUSK[p].sky : sky);
    // brightest point of the page sky: the glows at full strength in their corners
    const cands = [s, mix(s, DAWN, dawn), mix(s, hex(DUSK[p].glow), dusk)];
    let a = 0.58;
    const ok = (alpha) => cands.every((c) => {
      const bg = mix(c, DIMC, alpha);
      const tag = mix(bg, BONE, 0.72), body = mix(bg, BONE, 0.8), chipBg = mix(bg, INK, 0.35);
      return ratio(ROSE, bg) >= 4.5 && ratio(STEEL, bg) >= 4.5 && ratio(SKYGREY, bg) >= 4.5 && ratio(tag, bg) >= 4.5 && ratio(body, bg) >= 4.5 && ratio(CHIP, chipBg) >= 4.5;
    });
    while (!ok(a) && a < 1) a = Math.round((a + 0.01) * 100) / 100;
    worstDim = Math.max(worstDim, a);
    // digits inside the dial: large text, 3:1
    const ink = dark ? INK : BONE;
    const dig = Math.min(...cands.slice(0, 1).map((c) => ratio(ink, c)));
    // the scene tag pill under the digits: accent on rgba(12,11,10,.86)
    const pill = mix(cands[0], INK, 0.86);
    rows.push({ t, persona: p, sky: sky === 'DUSK' ? DUSK[p].sky : sky, dim: a, digits: dig.toFixed(2) + (dig >= 3 ? ' ok' : ' FAIL'), tagRose: ratio(ROSE, pill).toFixed(2), tagSteel: ratio(STEEL, pill).toFixed(2) });
  }
  dims.push(worstDim);
}
console.table(rows);
console.log('DIM =', JSON.stringify(dims));
