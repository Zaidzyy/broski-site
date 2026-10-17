// The "alive" layer: small loops that start once the hero intro has finished, and only run while their
// section is on screen and the tab is visible. Transform and opacity only.

let introResolve: () => void = () => {};
/** Resolves when the hero intro (letters, slash, faces, header) has played. */
export const introDone = new Promise<void>((r) => { introResolve = r; });
export const markIntroDone = () => introResolve();

/** Test hook: `window.__aliveSpeed = 10` runs every loop ten times faster. */
const speed = () => (window as unknown as { __aliveSpeed?: number }).__aliveSpeed || 1;
/** setTimeout on the alive clock. */
export const later = (ms: number, fn: () => void) => window.setTimeout(fn, ms / speed());
export const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Calls `on(true)` when el is on screen, the tab is visible and the intro is over; `on(false)` when any stops. */
export function whileRunning(el: Element, on: (run: boolean) => void, rootMargin = '0px') {
  let inView = false;
  let shown = document.visibilityState === 'visible';
  let intro = false;
  let running = false;
  const update = () => {
    const next = inView && shown && intro;
    if (next !== running) { running = next; on(next); }
  };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; update(); }, { rootMargin }).observe(el);
  document.addEventListener('visibilitychange', () => { shown = document.visibilityState === 'visible'; update(); });
  introDone.then(() => { intro = true; update(); });
}
