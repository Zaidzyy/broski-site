// 02 · The day. One scroll-bound value, t (0 → UNITS), drives the dial and the sky.
// Scenes swap when t crosses a whole number; each scene's widgets play once, on first entry.
// Motion budget: only the dial moves continuously; only transform and opacity animate.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SCENES } from './data/day';
import { setWho } from './lib/persona';
import { reducedMotion, isPhone } from './lib/motion';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const N = SCENES.length;
/** 12 scenes plus room for the ending (the window closes, the arc becomes the 72). */
export const UNITS = 12.6;
/** Scroll per unit, as a share of the viewport height. 12.6 × 0.95 ≈ 12 screens of scroll. */
export const UNIT_VH = 0.95;
const W = 0.22; // half-width of the move between two scenes (the hand holds in between)
const PLAY_SECONDS = 25;

// per-scene dial values (sun and moon in fractions of the dial window; from the mockup's keyframes)
const ANGLE = SCENES.map((s) => s.hours * 15);
const INK = SCENES.map((s) => (s.darkInk ? 1 : 0));
const STARS = [1, 0.25, 0, 0, 0, 0, 0, 0, 0, 0.1, 0.7, 1];
const DAWN = [0, 1, 0.8, 0.5, 0.1, 0, 0, 0, 0, 0.3, 0, 0];
const DUSK = [0, 0, 0, 0, 0, 0, 0, 0.2, 0.9, 1, 1, 0.1];
/** Page-sky dimming per scene, from scripts/contrast.mjs, so scene text keeps AA on every sky. */
const DIM = [0.58, 0.72, 0.69, 0.74, 0.73, 0.78, 0.79, 0.77, 0.7, 0.66, 0.61, 0.58];
const SUN: [number, number][] = [[60, 560], [80, 400], [70, 300], [90, 170], [150, 110], [230, 80], [310, 90], [395, 140], [415, 340], [430, 380], [450, 560], [450, 560]].map(([x, y]) => [x / 496, y / 496]);
const MOON: [number, number, number][] = [[380, 140, 0.8], [430, 110, 0.2], [560, 0, 0], [560, 0, 0], [560, 0, 0], [560, 0, 0], [560, 0, 0], [560, 0, 0], [560, 0, 0], [560, 0, 0], [360, 150, 0.7], [250, 116, 1]].map(([x, y, o]) => [x / 496, y / 496, o]);

// the ending, in units
const END = { win: [11.7, 12.1], ticks: [11.75, 12.1], hand: [11.75, 11.95], arc: [11.75, 12.15], thick: [11.85, 12.2], digits: [11.7, 11.85], score: [11.9, 12.25] };
const FINAL_ARC = 259.2; // 72% of the dial

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (x: number) => x * x * (3 - 2 * x);
const span = (t: number, [a, b]: number[]) => smooth(clamp((t - a) / (b - a)));
const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

/** Which two scenes t sits between, and how far. The hand holds for the middle 56% of a scene. */
function pair(t: number): [number, number, number] {
  const b = Math.round(t);
  if (b >= 1 && b <= N - 1 && Math.abs(t - b) < W) return [b - 1, b, smooth((t - (b - W)) / (2 * W))];
  const i = clamp(Math.floor(t), 0, N - 1);
  return [i, i, 0];
}
const at = (arr: number[], t: number) => { const [i, j, f] = pair(t); return lerp(arr[i], arr[j], f); };
/** A scene's own plateau: fades in over the first 15% of its unit, out over the last 15%. */
function plateau(t: number, k: number) {
  const u = t - k;
  if (k === 0 && u < 0.5) return 1;
  if (k === N - 1 && u > 0.5) return 1 - span(t, END.digits);
  return clamp(Math.min(u / 0.15, (1 - u) / 0.15));
}

/** Where a chip or the tests send the clock: the middle of each scene's hold. */
export const sceneT = (i: number) => (i === N - 1 ? 11.45 : i + 0.5);

export function initDay() {
  const day = document.querySelector<HTMLElement>('.day');
  if (!day) return;
  const stage = day.querySelector<HTMLElement>('.day__stage')!;
  const track = day.querySelector<HTMLElement>('.day__track')!;
  const scenes = [...day.querySelectorAll<HTMLElement>('.scene')];
  const fits = scenes.map((s) => s.querySelector<HTMLElement>('.fit')!);
  const introBtn = day.querySelector<HTMLButtonElement>('[data-play-intro]');

  // ---- persona buttons in the top bar ----
  for (const b of day.querySelectorAll<HTMLButtonElement>('[data-persona-btn]')) {
    b.addEventListener('click', () => setWho(b.dataset.personaBtn as 'bro' | 'zara'));
  }

  // Too short for the pinned stage (landscape phones, high browser zoom): use the still version.
  const tooShort = () => window.innerHeight < 520;
  if (reducedMotion() || tooShort()) {
    // Twelve still sections, each in its final state. No pinning, no auto-scroll.
    day.classList.add('is-static-js');
    const fitStatic = () => scenes.forEach((s, i) => fitWidget(s, fits[i], s.querySelector<HTMLElement>('.scene__w')!.clientWidth, Infinity));
    fitStatic();
    window.addEventListener('resize', fitStatic);
    introBtn?.addEventListener('click', () => scenes[0].scrollIntoView());
    return;
  }

  // Crossing into "too short" (zooming in a lot) reloads into the still version, keeping the place.
  // A keyboard opening only changes the height; zoom changes the width too.
  const w0 = window.innerWidth;
  window.addEventListener('resize', () => { if (tooShort() && window.innerWidth !== w0) window.location.reload(); });
  day.classList.add('is-live');
  day.style.setProperty('--units', String(UNITS));
  day.style.setProperty('--unit-h', `${UNIT_VH * 100}svh`);

  const q = <T extends Element = HTMLElement>(sel: string) => [...stage.querySelectorAll<T & HTMLElement>(sel)];
  const el = {
    skies: q('[data-sky]'), bgSkies: q('[data-bgsky]'),
    stars: q('[data-stars], [data-bgstars]'), dawn: q('[data-dawn], [data-bgdawn]'), dusk: q('[data-dusk], [data-bgdusk]'),
    dim: stage.querySelector<HTMLElement>('[data-dim]')!,
    sun: stage.querySelector<HTMLElement>('[data-sun]')!, moon: stage.querySelector<HTMLElement>('[data-moon]')!,
    win: stage.querySelector<HTMLElement>('[data-win]')!, ticks: stage.querySelector<HTMLElement>('[data-ticks]')!,
    hand: stage.querySelector<HTMLElement>('[data-hand]')!,
    arcR: stage.querySelector<HTMLElement>('[data-arc-r]')!, arcL: stage.querySelector<HTMLElement>('[data-arc-l]')!,
    thick: stage.querySelector<HTMLElement>('[data-arc-thick]')!,
    track: stage.querySelector<HTMLElement>('[data-arc-track]')!,
    inkL: q('[data-ink="l"]'), inkD: q('[data-ink="d"]'),
    ctr: SCENES.map((_, i) => q(`[data-ctr="${i}"], [data-tag="${i}"]`)),
    labs: SCENES.map((_, i) => stage.querySelector<HTMLElement>(`[data-lab="${i}"] .lab__in`)),
    labAcc: SCENES.map((_, i) => stage.querySelector<HTMLElement>(`[data-lab="${i}"] .lab__acc`)),
    score: stage.querySelector<HTMLElement>('[data-score]')!,
    cue: stage.querySelector<HTMLElement>('[data-cue]')!,
    prog: stage.querySelector<HTMLElement>('[data-prog]')!,
    chips: q<HTMLButtonElement>('[data-go]'),
    play: stage.querySelector<HTMLButtonElement>('[data-play]')!,
  };

  // Write a style only when it changes.
  const last = new WeakMap<HTMLElement, Record<string, string>>();
  const set = (node: HTMLElement | null, prop: 'opacity' | 'transform', v: string) => {
    if (!node) return;
    const prev = last.get(node) ?? {};
    if (prev[prop] === v) return;
    node.style[prop] = v;
    last.set(node, { ...prev, [prop]: v });
  };
  const op = (n: HTMLElement | null, v: number) => set(n, 'opacity', v.toFixed(3));
  const tf = (n: HTMLElement | null, v: string) => set(n, 'transform', v);

  let winSize = 496;
  let active = -1;
  const played = new Set<number>();
  let onscreen = false;

  function render(t: number) {
    const [i, j, f] = pair(t);
    // skies: the current layer at full, the next one fading in over it
    for (const list of [el.skies, el.bgSkies]) list.forEach((n, k) => op(n, k === i ? 1 : k === j ? f : 0));
    el.stars.forEach((n) => op(n, at(STARS, t)));
    el.dawn.forEach((n) => op(n, at(DAWN, t)));
    el.dusk.forEach((n) => op(n, at(DUSK, t)));
    op(el.dim, at(DIM, t));
    const sx = lerp(SUN[i][0], SUN[j][0], f) * winSize, sy = lerp(SUN[i][1], SUN[j][1], f) * winSize;
    tf(el.sun, `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0)`);
    const mx = lerp(MOON[i][0], MOON[j][0], f) * winSize, my = lerp(MOON[i][1], MOON[j][1], f) * winSize;
    tf(el.moon, `translate3d(${mx.toFixed(1)}px,${my.toFixed(1)}px,0)`);
    op(el.moon, lerp(MOON[i][2], MOON[j][2], f));

    const ink = at(INK, t);
    el.inkL.forEach((n) => op(n, 1 - ink));
    el.inkD.forEach((n) => op(n, ink));
    SCENES.forEach((_, k) => {
      const v = plateau(t, k);
      el.ctr[k].forEach((n) => op(n, v));
      const h = clamp(Math.min((t - k) / 0.15, (k + 1 - t) / 0.15));
      tf(el.labs[k], `translate(-50%,-50%) scale(${(1 + 0.5 * h).toFixed(3)})`);
      op(el.labAcc[k], h);
    });

    // hand + arc, then the ending
    const angle = at(ANGLE, t);
    tf(el.hand, `rotate(${angle.toFixed(2)}deg)`);
    op(el.hand, 1 - span(t, END.hand));
    const sweep = lerp(angle, FINAL_ARC, span(t, END.arc));
    tf(el.arcR, `rotate(${clamp(sweep, 0, 180).toFixed(2)}deg)`);
    tf(el.arcL, `rotate(${clamp(sweep - 180, 0, 180).toFixed(2)}deg)`);
    const thick = span(t, END.thick);
    op(el.arcR, sweep < 0.2 ? 0 : 1 - thick);
    op(el.arcL, sweep <= 180 ? 0 : 1 - thick);
    op(el.thick, thick);
    op(el.track, 1 - thick);
    tf(el.thick, `scale(${lerp(0.96, 1, thick).toFixed(3)})`);
    const w = span(t, END.win);
    op(el.win, 1 - w);
    tf(el.win, `scale(${lerp(1, 0.86, w).toFixed(3)})`);
    const tk = span(t, END.ticks);
    op(el.ticks, 1 - tk);
    tf(el.ticks, `translate3d(0,${(tk * 16).toFixed(1)}px,0)`);
    const sc = span(t, END.score);
    op(el.score, sc);
    tf(el.score, `scale(${lerp(0.7, 1, sc).toFixed(3)})`);

    op(el.cue, t < 0.4 ? 1 : clamp(1 - (t - 0.4) / 0.6));
    tf(el.prog, `scaleX(${(t / UNITS).toFixed(4)})`);

    const next = clamp(Math.floor(t), 0, N - 1);
    if (next !== active) show(next);
  }

  // ---- scenes ----
  function entry(i: number) {
    if (played.has(i)) return;
    played.add(i);
    const tl = gsap.timeline();
    for (const n of scenes[i].querySelectorAll<HTMLElement>('[data-a]')) {
      const d = Number(n.dataset.d || 0);
      switch (n.dataset.a) {
        case 'pop': tl.to(n, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }, d); break;
        case 'fade': tl.to(n, { opacity: 1, duration: 0.5, ease: 'power1.out' }, d); break;
        case 'gx': tl.to(n, { scaleX: 1, duration: 0.7, ease: 'power2.out' }, d); break;
        case 'flip': tl.to(n, { rotateY: 180, duration: 0.9, ease: 'power2.inOut' }, d); break;
        case 'wipe': {
          const inner = n.querySelector('.reveal__in');
          tl.to(n, { xPercent: 0, duration: 0.6, ease: 'power2.inOut' }, d).to(inner, { xPercent: 0, duration: 0.6, ease: 'power2.inOut' }, d);
          break;
        }
        case 'print': tl.to([n, n.firstElementChild], { yPercent: 0, duration: 1.8, ease: 'power2.inOut' }, d); break;
      }
    }
  }
  function primeEntries() {
    scenes.forEach((s) => {
      for (const n of s.querySelectorAll<HTMLElement>('[data-a]')) {
        switch (n.dataset.a) {
          case 'pop': gsap.set(n, { opacity: 0, y: 18, scale: 0.96 }); break;
          case 'fade': gsap.set(n, { opacity: 0 }); break;
          case 'gx': gsap.set(n, { scaleX: 0, transformOrigin: '0 50%' }); break;
          case 'flip': gsap.set(n, { rotateY: 0 }); break;
          case 'wipe': gsap.set(n, { xPercent: -100 }); gsap.set(n.querySelector('.reveal__in'), { xPercent: 100 }); break;
          case 'print': gsap.set(n, { yPercent: -100 }); gsap.set(n.firstElementChild, { yPercent: 100 }); break;
        }
      }
    });
  }

  function show(i: number) {
    const prev = active;
    active = i;
    scenes.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (prev >= 0) gsap.to(scenes[prev], { opacity: 0, y: i > prev ? -40 : 40, duration: 0.35, ease: 'power2.in', overwrite: true });
    gsap.fromTo(scenes[i], { opacity: 0, y: prev < 0 ? 0 : i > prev ? 50 : -50 }, { opacity: 1, y: 0, duration: 0.55, delay: prev < 0 ? 0 : 0.12, ease: 'power3.out', overwrite: true });
    el.chips.forEach((c, k) => (k === i ? c.setAttribute('aria-current', 'true') : c.removeAttribute('aria-current')));
    if (onscreen) entry(i);
  }

  // ---- layout: dial size and position, scene column, fit-to-space scaling ----
  function layout() {
    const vw = stage.clientWidth, vh = stage.clientHeight;
    let D: number, dx: number, dy: number, sx: number, sy: number, sw: number, sh: number;
    if (isPhone()) {
      D = Math.min(236, vw - 154, vh * 0.32);
      dx = (vw - D) / 2; dy = 52 + Math.max(36, Math.min(44, vh * 0.05));
      sx = 18; sw = vw - 36; sy = dy + D + 62; sh = vh - sy - 14;
    } else {
      const bar = 64;
      D = Math.max(300, Math.min(620, vh - bar - 150, (vw - 140) * 0.48));
      const leftCol = Math.max(D + 100, vw * 0.5);
      dx = Math.max(56, (leftCol - D) / 2 + 10);
      dy = bar + (vh - bar - D) / 2 + 4;
      sx = dx + D + Math.max(70, Math.min(110, vw * 0.065));
      sw = Math.min(620, vw - sx - 40); sy = bar + 48; sh = vh - sy - 56;
    }
    const s = stage.style;
    s.setProperty('--D', `${D}px`); s.setProperty('--dx', `${dx}px`); s.setProperty('--dy', `${dy}px`);
    s.setProperty('--sx', `${sx}px`); s.setProperty('--sy', `${sy}px`); s.setProperty('--sw', `${sw}px`); s.setProperty('--sh', `${sh}px`);
    if (!isPhone()) {
      const k = D / 620;
      s.setProperty('--win-in', `${62 * k}px`); s.setProperty('--arc-in', `${40 * k}px`); s.setProperty('--hand-top', `${46 * k}px`);
      s.setProperty('--hand-len', `${92 * k}px`); s.setProperty('--digit', `${96 * k}px`); s.setProperty('--ctr-in', `${148 * k}px`);
      s.setProperty('--sun', `${64 * k}px`); s.setProperty('--moon', `${44 * k}px`); s.setProperty('--arc-thick', `${46 * k}px`);
    } else {
      for (const p of ['--win-in', '--arc-in', '--hand-top', '--hand-len', '--digit', '--ctr-in', '--sun', '--moon', '--arc-thick']) s.removeProperty(p);
    }
    winSize = el.win.offsetWidth || 496;
    scenes.forEach((sc, i) => {
      const inner = sc.querySelector<HTMLElement>('.scene__in')!;
      const wrap = sc.querySelector<HTMLElement>('.scene__w')!;
      if (isPhone()) {
        inner.style.transform = '';
        fitWidget(sc, fits[i], sw, sh - wrap.offsetTop - 8);
      } else {
        fits[i].style.transform = ''; wrap.style.height = '';
        const k = Math.min(1, sw / 620, sh / inner.offsetHeight);
        inner.style.transform = k < 1 ? `scale(${k.toFixed(3)})` : '';
      }
    });
  }

  primeEntries();
  layout();

  const proxy = { t: 0 };
  gsap.to(proxy, {
    t: UNITS, ease: 'none',
    onUpdate: () => render(proxy.t),
    scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true },
  });
  ScrollTrigger.create({
    trigger: track, start: 'top 70%', end: 'bottom top',
    onToggle: (self) => { onscreen = self.isActive; day.classList.toggle('is-onscreen', onscreen); if (onscreen && active >= 0) entry(active); },
  });
  render(0);
  ScrollTrigger.addEventListener('refreshInit', layout);

  // ---- chips, play ----
  const yFor = (t: number) => {
    const st = track.getBoundingClientRect().top + window.scrollY;
    return st + (t / UNITS) * (track.offsetHeight - window.innerHeight);
  };
  const tNow = () => clamp((window.scrollY - yFor(0)) / (yFor(UNITS) - yFor(0)), 0, 1) * UNITS;
  let playing: gsap.core.Animation | null = null;
  const setPlaying = (on: boolean) => {
    el.play.setAttribute('aria-pressed', String(on));
    el.play.querySelector('.playbtn__i')!.textContent = on ? '❚❚' : '▶';
    el.play.querySelector('.playbtn__t')!.textContent = on ? 'Stop' : isPhone() ? 'Play' : 'Play the day';
    day.classList.toggle('is-playing', on);
  };
  const stop = () => { playing?.kill(); playing = null; setPlaying(false); };
  function play() {
    if (playing) return stop();
    let from = tNow();
    if (from >= UNITS - 0.05 || window.scrollY < yFor(0) - 2) from = 0;
    const left = (UNITS - from) / UNITS;
    setPlaying(true);
    const tl = gsap.timeline({ onComplete: () => { playing = null; setPlaying(false); } });
    if (Math.abs(window.scrollY - yFor(from)) > 4) tl.to(window, { scrollTo: { y: yFor(from), autoKill: false }, duration: 0.8, ease: 'power2.inOut' });
    tl.to(window, {
      scrollTo: { y: yFor(UNITS), autoKill: true, onAutoKill: () => { stop(); } },
      duration: PLAY_SECONDS * left, ease: 'none',
    });
    playing = tl;
  }
  setPlaying(false);
  el.play.addEventListener('click', play);
  introBtn?.addEventListener('click', () => { if (playing) stop(); play(); el.play.focus({ preventScroll: true }); });
  el.chips.forEach((c, i) => c.addEventListener('click', () => {
    stop();
    gsap.to(window, { scrollTo: { y: yFor(sceneT(i)), autoKill: true }, duration: 0.9, ease: 'power2.inOut' });
  }));
  // a wheel, touch or key stops Play
  const userStops = () => { if (playing) stop(); };
  window.addEventListener('wheel', userStops, { passive: true });
  window.addEventListener('touchstart', userStops, { passive: true });
  window.addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key) && e.target === document.body) userStops(); });

  // for the tests: where each scene's hold sits on the page
  (window as unknown as { __day: object }).__day = { yFor, sceneT, UNITS, t: () => proxy.t, active: () => active };
}

/** Scales a widget down to the space it has (phones, short windows). */
function fitWidget(scene: HTMLElement, fit: HTMLElement, maxW: number, maxH: number) {
  const wrap = scene.querySelector<HTMLElement>('.scene__w')!;
  fit.style.transform = '';
  const w = fit.offsetWidth, h = fit.offsetHeight;
  const k = Math.min(1, maxW / w, maxH / h);
  if (k < 1) { fit.style.transform = `scale(${k.toFixed(3)})`; wrap.style.height = `${Math.ceil(h * k)}px`; }
  else wrap.style.height = '';
}
