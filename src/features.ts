// 03 · Everything else: an ARIA tablist (arrow keys, Home/End) driving the ring and the bento.
// Like the hero: hover to peek (mouse only, ~120 ms intent), click to choose. Leaving the row goes back to the choice.
import { gsap } from 'gsap';
import { GROUPS, DEFAULT_GROUP } from './data/features';
import { finePointer } from './lib/motion';
import { whileRunning, later } from './lib/alive';

const INTENT_MS = 120;
const CLICK_S = 0.3;
const PEEK_S = 0.22;
const WANDER_MS = 1200;
const IDLE_MS = 4000;

export function initFeatures() {
  const found = document.querySelector<HTMLElement>('.tabs[role="tablist"]');
  if (!found) return;
  const list = found;
  const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')!)!);
  const marks = [...document.querySelectorAll<HTMLElement>('.fring .mark')];
  const ringI = document.querySelector<HTMLElement>('[data-ring-i]')!;
  const ringG = document.querySelector<HTMLElement>('[data-ring-g]')!;
  let selected = DEFAULT_GROUP;
  let shown = DEFAULT_GROUP;
  let timer = 0;

  /** Shows group i in the ring and the bento, cross-fading the cards. Any fade still running is taken over. */
  function show(i: number, seconds: number) {
    list.classList.toggle('is-peeking', i !== selected);
    tabs.forEach((t, k) => t.classList.toggle('is-peek', k === i && i !== selected));
    if (i === shown) return;
    shown = i;
    marks.forEach((m) => m.classList.toggle('is-on', Number(m.dataset.g) === i));
    ringI.textContent = `0${i + 1} / 06`;
    ringG.textContent = GROUPS[i].g;
    gsap.killTweensOf(panels);
    panels.forEach((p, k) => {
      if (k === i) {
        // fade in from wherever it is (it may be halfway out from a quick pass over the row)
        const from = p.hidden ? 0 : Number(gsap.getProperty(p, 'opacity'));
        p.hidden = false;
        gsap.fromTo(p, { opacity: from }, { opacity: 1, duration: seconds, ease: 'power1.out', clearProps: 'opacity' });
      } else if (!p.hidden) {
        gsap.to(p, { opacity: 0, duration: seconds, ease: 'power1.in', onComplete: () => { p.hidden = true; gsap.set(p, { clearProps: 'opacity' }); } });
      }
    });
  }

  function select(i: number, focus = false) {
    window.clearTimeout(timer);
    selected = i;
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    show(i, CLICK_S);
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
    t.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !finePointer()) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => show(i, PEEK_S), INTENT_MS);
    });
  });
  list.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(timer);
    show(selected, PEEK_S);
  });

  // first paint: the default group, no fade
  panels.forEach((p, k) => { p.hidden = k !== DEFAULT_GROUP; });
  shown = -1;
  show(DEFAULT_GROUP, 0);

  // ---- alive: while nobody is using the section, one lit tick wanders round the ring ----
  const section = list.closest('section')!;
  let at = Math.floor(Math.random() * marks.length);
  let step = 0;
  let resume = 0;
  let onScreen = false;
  let hovering = false;
  let idle = true;
  const halt = () => {
    window.clearTimeout(step);
    step = 0;
    marks[at].classList.remove('is-wander');
  };
  const walk = () => {
    marks[at].classList.remove('is-wander');
    do at = (at + 1) % marks.length; while (marks[at].classList.contains('is-on')); // past the chosen group's arc
    marks[at].classList.add('is-wander');
    step = later(WANDER_MS, walk);
  };
  const update = () => {
    const go = onScreen && idle && !hovering;
    if (go && !step) step = later(WANDER_MS / 2, walk);
    if (!go && step) halt();
  };
  const touched = () => {
    idle = false;
    update();
    window.clearTimeout(resume);
    resume = later(IDLE_MS, () => { idle = true; update(); });
  };
  for (const zone of [list, section.querySelector('.rest__body')!]) {
    zone.addEventListener('pointerenter', () => { hovering = true; update(); });
    zone.addEventListener('pointerleave', () => { hovering = false; touched(); });
  }
  for (const ev of ['pointerdown', 'keydown', 'focusin']) section.addEventListener(ev, touched);
  whileRunning(section, (run) => { onScreen = run; update(); });
}
