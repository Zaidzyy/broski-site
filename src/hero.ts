// 01 · Hero: hover peeks (pointer devices, ~120 ms intent), click picks, clicking again goes back to both.
import { getWho, onWho, setWho, type Who } from './lib/persona';
import { finePointer } from './lib/motion';
import { introDone } from './lib/alive';

const QUESTION: Record<string, string> = {
  both: 'Who do you want today?',
  bro: 'Discipline it is.',
  zara: 'Good choice. Let’s go.',
  peekbro: 'Strict. Steady. Honest.',
  peekzara: 'Warm. Sharp. Persistent.',
};
const STATUS: Record<Who, string> = { both: 'Two voices · one at a time', bro: 'Bro is on', zara: 'Zara is on' };
const INTENT_MS = 120;

export function initHero() {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;
  const q = hero.querySelector<HTMLElement>('[data-question]')!;
  const status = hero.querySelector<HTMLElement>('[data-status]')!;
  const hint = hero.querySelector<HTMLElement>('[data-hint-t]')!;
  const picks = [...hero.querySelectorAll<HTMLButtonElement>('[data-pick]')];
  const idleHint = finePointer() ? 'HOVER TO PEEK · CLICK TO CHOOSE' : 'TAP TO CHOOSE';
  let peek = '';
  let timer = 0;

  hero.dataset.who = 'both';
  hero.dataset.peek = '';
  hint.textContent = idleHint;

  const paint = () => {
    const who = getWho();
    hero.dataset.who = who;
    hero.dataset.peek = who === 'both' ? peek : '';
    q.textContent = who === 'both' ? QUESTION[peek ? 'peek' + peek : 'both'] : QUESTION[who];
    status.textContent = STATUS[who];
    hint.textContent = who === 'both' ? idleHint : `NOW SCROLL · LIVE ONE DAY WITH ${who.toUpperCase()}`;
    for (const b of picks) b.setAttribute('aria-pressed', String(b.dataset.pick === who));
  };

  for (const b of picks) {
    const p = b.dataset.pick as 'bro' | 'zara';
    b.addEventListener('click', () => {
      window.clearTimeout(timer);
      peek = '';
      setWho(getWho() === p ? 'both' : p);
    });
    b.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !finePointer()) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { peek = p; paint(); }, INTENT_MS);
    });
    b.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      window.clearTimeout(timer);
      // a short grace period, so sliding from one pill to the other doesn't flick back to centre
      timer = window.setTimeout(() => { peek = ''; paint(); }, INTENT_MS);
    });
  }
  onWho(paint);

  // The dimmed faces are only needed after a pick: fetch them once the page has settled.
  const ready = () => hero.classList.add('dims-ready');
  const idle = (cb: () => void) => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(cb, { timeout: 2500 });
    else setTimeout(cb, 1200);
  };
  introDone.then(() => idle(ready)); // after the intro, so nothing heavy loads while it plays
  for (const b of picks) b.addEventListener('pointerenter', ready, { once: true });
}
