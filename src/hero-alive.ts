// 01 · The hero after its intro: breathing, parallax (or a slow drift on touch), blinks and glances.
// Breathing, drift and parallax run in one rAF loop on their own clock, which only advances while the hero
// is on screen and the tab is visible (lib/alive.ts), so a pause and a resume never jump. Every motion
// starts from rest and its amplitude eases in over 1.5 s, so the intro hands over without a jump.
import type { Persona } from './data/day';
import { markIntroDone, whileRunning, later, rand } from './lib/alive';
import { finePointer } from './lib/motion';
import { introStarted, heroDecoded } from './intro';

const SIZES = '(max-width: 700px) 430px, 820px';
const WIDTHS = [520, 820, 1254];
const GLANCES: Record<Persona, string[]> = { bro: ['thinking', 'laugh'], zara: ['laugh', 'flirty'] };
const BLINK_MS = 130;
const GLANCE_MS = 1400;
const TRANSITION_MS = 1100; // the hero's peek/choose slide is 1 s
const RAMP_S = 1.5;
const easeOut = (x: number) => 1 - (1 - x) ** 3;

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

  // the intro ends when the header has faded in (1.9 s + 0.9 s after it starts); a timer covers a missed event
  const done = () => markIntroDone();
  head?.addEventListener('animationend', (e) => { if ((e as AnimationEvent).animationName === 'fadein') done(); });
  introStarted.then(() => window.setTimeout(done, 3200));

  // ---- breathing, and parallax (fine pointers) or a slow drift (touch) ----
  const fine = finePointer();
  hero.classList.toggle('is-coarse', !fine);
  // breathing: out of sync through the periods and a random wait before each face's first breath,
  // and every breath starts from rest (no random starting phase)
  const breathers = (['bro', 'zara'] as const).map((p, i) => ({ el: breath(p), period: [5.5, 6.3][i], wait: rand(0, 2) }));
  const target = { x: 0, y: 0 }; // where the cursor pulls; 0 until it moves, so nothing snaps
  const cur = { x: 0, y: 0 };
  let clock = 0; // seconds of alive time
  let last = 0;
  let raf = 0;
  let running = false;
  const written = new WeakMap<HTMLElement, string>();
  const put = (el: HTMLElement, prop: 'transform' | 'translate', v: string) => {
    if (written.get(el) === v) return;
    written.set(el, v);
    el.style[prop] = v;
  };
  const frame = (now: number) => {
    clock += last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    const amp = easeOut(Math.min(1, clock / RAMP_S));
    for (const b of breathers) {
      const u = clock - b.wait;
      const k = u > 0 ? ((1 - Math.cos((2 * Math.PI * u) / b.period)) / 2) * amp : 0; // 0 → 1 → 0
      put(b.el, 'transform', k ? `translate3d(0, ${(-3 * k).toFixed(3)}px, 0) scale(${(1 + 0.012 * k).toFixed(5)})` : '');
    }
    let fx: number, fy: number, wx: number, wy: number;
    if (fine) {
      // faces toward the cursor (8 px across, 5 px up and down, so the picture's bottom edge never shows),
      // the letters ~5 px the other way
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      [fx, fy, wx, wy] = [cur.x * 8 * amp, cur.y * 5 * amp, -cur.x * 5 * amp, -cur.y * 5 * amp];
    } else {
      const d = Math.sin((2 * Math.PI * clock) / 12) * amp; // ±4 px over 12 s, from rest
      [fx, fy, wx, wy] = [4 * d, 0, -2 * d, 0];
    }
    const px = (x: number, y: number) => (Math.abs(x) + Math.abs(y) < 0.005 ? '' : `${x.toFixed(2)}px ${y.toFixed(2)}px`);
    for (const p of pics) put(p, 'translate', px(fx, fy));
    for (const w of words) put(w, 'translate', px(wx, wy));
    raf = requestAnimationFrame(frame);
  };
  if (fine) {
    window.addEventListener('pointermove', (e) => {
      if (!running || e.pointerType !== 'mouse') return;
      target.x = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2));
      target.y = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.5) * 2));
    }, { passive: true });
  }

  // ---- blinks and glances ----
  // The six expression files (~15 KB each) start loading, at low priority, as soon as the hero pictures have
  // decoded, so the first glance never waits. If one still isn't ready when its moment comes, that blink or
  // glance waits for it instead of being skipped.
  type Layers = { blink: HTMLElement; glance: Record<string, HTMLElement> };
  const layers: Partial<Record<Persona, Layers>> = {};
  const loaded = new WeakMap<HTMLElement, Promise<boolean>>();
  const makeLayer = (who: Persona, ex: string, kind: 'blink' | 'glance') => {
    const pic = document.createElement('picture');
    pic.className = `pic__x pic__x--${kind}`;
    pic.dataset.x = ex;
    const set = (fmt: string) => WIDTHS.map((w) => `${url(who, ex, w, fmt)} ${w}w`).join(', ');
    pic.innerHTML = `<source type="image/avif" srcset="${set('avif')}" sizes="${SIZES}"><source type="image/webp" srcset="${set('webp')}" sizes="${SIZES}"><img src="${url(who, ex, 520, 'webp')}" alt="" width="820" height="820" decoding="async" fetchpriority="low">`;
    breath(who).insertBefore(pic, breath(who).querySelector('.pic__dim'));
    loaded.set(pic, pic.querySelector('img')!.decode().then(() => true, () => false));
    return pic;
  };
  let layersMade: () => void = () => {};
  const made = new Promise<void>((r) => { layersMade = r; });
  heroDecoded.then(() => {
    for (const who of ['bro', 'zara'] as const) {
      const glance: Record<string, HTMLElement> = {};
      for (const ex of GLANCES[who]) glance[ex] = makeLayer(who, ex, 'glance');
      layers[who] = { blink: makeLayer(who, 'blink', 'blink'), glance };
    }
    layersMade();
  });
  /** Resolves with the layer once its picture can be shown (false if it failed to load). */
  const whenReady = async (who: Persona, pick: (l: Layers) => HTMLElement) => {
    await made;
    const el = pick(layers[who]!);
    return (await loaded.get(el)) ? el : null;
  };

  const other = (p: Persona): Persona => (p === 'bro' ? 'zara' : 'bro');
  /** Not dimmed: nobody picked and nobody peeked, or this one is the pick or the peek. */
  const awake = (p: Persona) => {
    const who = hero.dataset.who, peek = hero.dataset.peek;
    return who === p || (who === 'both' && (!peek || peek === p));
  };
  const timers = new Set<number>();
  let gen = 0; // bumped on every pause, so a wait that ends after it does nothing
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
  const flash = (l: HTMLElement) => {
    l.classList.add('is-on');
    after(BLINK_MS, () => l.classList.remove('is-on'));
  };
  function scheduleBlink(p: Persona, first = false) {
    const speedUp = (window as unknown as { __aliveSpeed?: number }).__aliveSpeed || 1;
    // the first blink comes 1–2 s after the intro (or a scroll back), so people who move on early still see one
    let wait = first ? rand(1000, 2000) : rand(3500, 7000);
    // the two never blink together
    const at = performance.now() + wait / speedUp;
    if (Math.abs(at - blinkAt[other(p)]) < 700 / speedUp) wait += 900;
    blinkAt[p] = performance.now() + wait / speedUp;
    const g = gen;
    after(wait, async () => {
      const l = await whenReady(p, (x) => x.blink);
      if (g !== gen) return;
      if (l && awake(p) && glancing !== p) {
        flash(l);
        if (Math.random() < 0.18) after(BLINK_MS + 160, () => { if (awake(p) && glancing !== p) flash(l); }); // a double blink
      }
      scheduleBlink(p);
    });
  }
  async function glance() {
    const g = gen;
    const can = (['bro', 'zara'] as const).filter(awake);
    if (!can.length) return after(rand(8000, 12000), glance);
    if (performance.now() < busyUntil) return after(1500, glance); // never during a peek/choose slide
    // the two take turns (the first one is random); a dimmed one is skipped
    const p = can.length === 1 ? can[0] : lastGlancer ? other(lastGlancer) : can[Math.floor(Math.random() * 2)];
    const options = GLANCES[p].filter((ex) => ex !== lastEx[p]);
    const ex = options[Math.floor(Math.random() * options.length)];
    const layer = await whenReady(p, (x) => x.glance[ex]);
    if (g !== gen) return;
    if (!layer) return after(rand(8000, 12000), glance);
    if (!awake(p) || performance.now() < busyUntil) return after(1500, glance); // things changed while it loaded
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
      last = 0; // the clock carries on from where it paused
      if (!raf) raf = requestAnimationFrame(frame);
      scheduleBlink('bro', true);
      scheduleBlink('zara', true);
      after(rand(2500, 4500), glance); // the first glance comes a little sooner
    } else {
      gen++;
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      hideAll('bro');
      hideAll('zara');
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
  });
}
