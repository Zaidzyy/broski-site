// 01 · The hero after its intro: breathing, parallax (or a slow drift on touch), blinks and glances.
// Breathing and drift are CSS loops; parallax is one rAF loop that stops when it settles. Everything pauses
// when the hero is off screen or the tab is hidden (lib/alive.ts).
import type { Persona } from './data/day';
import { introDone, markIntroDone, whileRunning, later, rand } from './lib/alive';
import { finePointer } from './lib/motion';

const SIZES = '(max-width: 700px) 430px, 820px';
const WIDTHS = [520, 820, 1254];
const GLANCES: Record<Persona, string[]> = { bro: ['thinking', 'laugh'], zara: ['laugh', 'flirty'] };
const BLINK_MS = 130;
const GLANCE_MS = 1400;
const TRANSITION_MS = 1100; // the hero's peek/choose slide is 1 s

// the expression overlays (scripts/images.mjs), as URLs only: nothing loads until the intro is over
const URLS = import.meta.glob('./assets/img/*-x-*.{avif,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const url = (who: Persona, ex: string, w: number, fmt: string) => URLS[`./assets/img/${who}-x-${ex}-${w}.${fmt}`];

export function initHeroAlive() {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;
  const head = hero.querySelector('.hero__head');
  const pics = [...hero.querySelectorAll<HTMLElement>('.pic')];
  const words = [...hero.querySelectorAll<HTMLElement>('.word')];
  const breath = (p: Persona) => hero.querySelector<HTMLElement>(`.face--${p} .breath`)!;

  // the intro ends when the header has faded in (1.9 s + 0.9 s); a timer covers a missed event
  const done = () => markIntroDone();
  head?.addEventListener('animationend', (e) => { if ((e as AnimationEvent).animationName === 'fadein') done(); });
  window.setTimeout(done, 3200);

  // breathing: out of sync, each from a random point in its cycle
  for (const [p, s] of [['bro', 5.5], ['zara', 6.3]] as const) breath(p).style.setProperty('--brd', `${(-Math.random() * s).toFixed(2)}s`);

  // ---- parallax (fine pointers) or the slow drift (touch, CSS) ----
  const fine = finePointer();
  hero.classList.toggle('is-coarse', !fine);
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  let raf = 0;
  let running = false;
  const frame = () => {
    cur.x += (target.x - cur.x) * 0.08;
    cur.y += (target.y - cur.y) * 0.08;
    // faces toward the cursor (up to 8 px across, 5 px up and down so the image's bottom edge never shows),
    // the letters ~5 px the other way
    for (const p of pics) p.style.translate = `${(cur.x * 8).toFixed(2)}px ${(cur.y * 5).toFixed(2)}px`;
    for (const w of words) w.style.translate = `${(-cur.x * 5).toFixed(2)}px ${(-cur.y * 5).toFixed(2)}px`;
    raf = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.002 ? requestAnimationFrame(frame) : 0;
  };
  if (fine) {
    window.addEventListener('pointermove', (e) => {
      if (!running || e.pointerType !== 'mouse') return;
      target.x = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2));
      target.y = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.5) * 2));
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
  }

  // ---- blinks and glances ----
  type Layers = { blink: HTMLElement; glance: Record<string, HTMLElement> };
  const layers: Partial<Record<Persona, Layers>> = {};
  const makeLayer = (who: Persona, ex: string, kind: 'blink' | 'glance') => {
    const pic = document.createElement('picture');
    pic.className = `pic__x pic__x--${kind}`;
    pic.dataset.x = ex;
    const set = (fmt: string) => WIDTHS.map((w) => `${url(who, ex, w, fmt)} ${w}w`).join(', ');
    pic.innerHTML = `<source type="image/avif" srcset="${set('avif')}" sizes="${SIZES}"><source type="image/webp" srcset="${set('webp')}" sizes="${SIZES}"><img src="${url(who, ex, 520, 'webp')}" alt="" width="820" height="820" decoding="async">`;
    breath(who).insertBefore(pic, breath(who).querySelector('.pic__dim'));
    return pic;
  };
  const loadLayers = () => {
    for (const who of ['bro', 'zara'] as const) {
      const glance: Record<string, HTMLElement> = {};
      for (const ex of GLANCES[who]) glance[ex] = makeLayer(who, ex, 'glance');
      layers[who] = { blink: makeLayer(who, 'blink', 'blink'), glance };
    }
  };
  introDone.then(() => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(loadLayers, { timeout: 1500 });
    else window.setTimeout(loadLayers, 300);
  });

  const other = (p: Persona): Persona => (p === 'bro' ? 'zara' : 'bro');
  /** Not dimmed: nobody picked and nobody peeked, or this one is the pick or the peek. */
  const awake = (p: Persona) => {
    const who = hero.dataset.who, peek = hero.dataset.peek;
    return who === p || (who === 'both' && (!peek || peek === p));
  };
  const timers = new Set<number>();
  const after = (ms: number, fn: () => void) => { const id = later(ms, () => { timers.delete(id); fn(); }); timers.add(id); return id; };
  const blinkAt: Record<Persona, number> = { bro: 0, zara: 0 };
  let glancing: Persona | '' = '';
  let lastGlancer: Persona | '' = '';
  const lastEx: Record<Persona, string> = { bro: '', zara: '' };
  let busyUntil = 0;
  let glanceOff = 0;

  const hideAll = (p: Persona) => {
    const l = layers[p];
    if (!l) return;
    l.blink.classList.remove('is-on');
    Object.values(l.glance).forEach((g) => g.classList.remove('is-on'));
    if (glancing === p) { glancing = ''; window.clearTimeout(glanceOff); }
  };
  const flash = (p: Persona) => {
    const l = layers[p]?.blink;
    if (!l) return;
    l.classList.add('is-on');
    after(BLINK_MS, () => l.classList.remove('is-on'));
  };
  function scheduleBlink(p: Persona, first = false) {
    const speedUp = (window as unknown as { __aliveSpeed?: number }).__aliveSpeed || 1;
    let wait = first ? rand(1200, 3000) : rand(3500, 7000);
    // the two never blink together
    const at = performance.now() + wait / speedUp;
    if (Math.abs(at - blinkAt[other(p)]) < 700 / speedUp) wait += 900;
    blinkAt[p] = performance.now() + wait / speedUp;
    after(wait, () => {
      if (awake(p) && glancing !== p) {
        flash(p);
        if (Math.random() < 0.18) after(BLINK_MS + 160, () => { if (awake(p) && glancing !== p) flash(p); }); // a double blink
      }
      scheduleBlink(p);
    });
  }
  function glance() {
    const can = (['bro', 'zara'] as const).filter((p) => awake(p) && layers[p]);
    if (!can.length) return after(rand(8000, 12000), glance);
    if (performance.now() < busyUntil) return after(1500, glance); // never during a peek/choose slide
    // the two take turns (the first one is random); a dimmed one is skipped
    const p = can.length === 1 ? can[0] : lastGlancer ? other(lastGlancer) : can[Math.floor(Math.random() * 2)];
    const options = GLANCES[p].filter((ex) => ex !== lastEx[p]);
    const ex = options[Math.floor(Math.random() * options.length)];
    const layer = layers[p]!.glance[ex];
    glancing = p; lastGlancer = p; lastEx[p] = ex;
    layers[p]!.blink.classList.remove('is-on'); // a glance never starts on top of a blink
    layer.classList.add('is-on');
    glanceOff = after(GLANCE_MS, () => {
      layer.classList.remove('is-on');
      after(200, () => { if (glancing === p) glancing = ''; });
    });
    after(rand(8000, 12000), glance);
  }

  // a pick or a peek: the dimmed one only breathes, and no glance runs during the slide
  new MutationObserver(() => {
    busyUntil = performance.now() + TRANSITION_MS;
    for (const p of ['bro', 'zara'] as const) if (!awake(p) || glancing === p) hideAll(p);
  }).observe(hero, { attributes: true, attributeFilter: ['data-who', 'data-peek'] });

  whileRunning(hero, (run) => {
    running = run;
    hero.classList.add('is-alive');
    hero.classList.toggle('is-paused', !run);
    if (run) {
      scheduleBlink('bro', true);
      scheduleBlink('zara', true);
      after(rand(2500, 4500), glance); // the first glance comes a little sooner
    } else {
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      hideAll('bro');
      hideAll('zara');
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
  });
}
