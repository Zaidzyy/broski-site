// 04 · The laptop's status line, as a tiny live log: one new line every ~2.5 s, newest at the bottom,
// three lines in view. Four list items take turns: the list slides up one line, then the top item
// moves to the bottom with the next text. Transform and opacity only.
import { LOG } from './data/hood';
import { whileRunning, later } from './lib/alive';

const EVERY_MS = 2500;
const SLIDE_MS = 360;

export function initHoodLog() {
  const box = document.querySelector<HTMLElement>('.lap__log');
  const list = box?.querySelector<HTMLOListElement>('ol');
  if (!box || !list) return;
  // the markup shows the last three lines, with LOG[0] waiting below them
  let next = 1;
  let timer = 0;
  const tick = () => {
    list.classList.add('is-shift');
    timer = later(SLIDE_MS, () => {
      const top = list.firstElementChild as HTMLElement;
      const line = LOG[next];
      top.textContent = line.t;
      top.classList.toggle('is-good', !!line.good);
      list.classList.remove('is-shift');
      list.append(top);
      next = (next + 1) % LOG.length;
      timer = later(EVERY_MS - SLIDE_MS, tick);
    });
  };
  whileRunning(box, (run) => {
    box.classList.toggle('is-live', run);
    window.clearTimeout(timer);
    list.classList.remove('is-shift');
    if (run) timer = later(EVERY_MS, tick);
  });
}
