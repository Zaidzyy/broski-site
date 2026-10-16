export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isPhone = () => window.innerWidth <= 700;

/** Shows a short status message (also read out by screen readers). */
export function toast(text: string) {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.textContent = text;
  el.classList.add('is-on');
  window.clearTimeout(Number(el.dataset.timer));
  el.dataset.timer = String(window.setTimeout(() => el.classList.remove('is-on'), 2400));
}
