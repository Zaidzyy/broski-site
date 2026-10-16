// 03 · Everything else: an ARIA tablist (arrow keys, Home/End) driving the ring and the bento.
import { GROUPS, DEFAULT_GROUP } from './data/features';

export function initFeatures() {
  const list = document.querySelector<HTMLElement>('.tabs[role="tablist"]');
  if (!list) return;
  const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')!)!);
  const marks = [...document.querySelectorAll<HTMLElement>('.ring .mark')];
  const ringI = document.querySelector<HTMLElement>('[data-ring-i]')!;
  const ringG = document.querySelector<HTMLElement>('[data-ring-g]')!;

  function select(i: number, focus = false) {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
    });
    marks.forEach((m) => m.classList.toggle('is-on', Number(m.dataset.g) === i));
    ringI.textContent = `0${i + 1} / 06`;
    ringG.textContent = GROUPS[i].g;
    if (focus) tabs[i].focus();
  }

  const KEYS: Record<string, (i: number, n: number) => number> = {
    ArrowRight: (i, n) => (i + 1) % n,
    ArrowDown: (i, n) => (i + 1) % n,
    ArrowLeft: (i, n) => (i - 1 + n) % n,
    ArrowUp: (i, n) => (i - 1 + n) % n,
    Home: () => 0,
    End: (_, n) => n - 1,
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const go = KEYS[e.key];
      if (!go) return;
      e.preventDefault();
      select(go(i, tabs.length), true);
    });
  });
  select(DEFAULT_GROUP);
}
