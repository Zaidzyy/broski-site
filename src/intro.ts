// 01 · The intro gate's state, for the main script. The gate itself is a tiny inline script right after the hero
// (src/render/intro-gate.ts), so it starts while the page is still loading: it holds the intro, with only the
// background and the lockup showing, until the display font and both hero pictures are ready, or 1.2 s at most.
// On a cold first visit this keeps the letters from rising in a fallback font and the faces from wiping in
// before their pictures exist. Without JavaScript the intro runs at once (index.html, noscript). If the gate
// never ran (say the CSP refused it), this script starts the intro itself.

interface Gate { decoded: Promise<void>; started: Promise<void> }
const gate = (window as unknown as { __introGate?: Gate }).__introGate;
if (!gate) {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (hero) { hero.dataset.introWhy = 'fallback'; hero.classList.add('is-go'); }
}

/** Resolves when both hero pictures have decoded (or failed); the expression files start loading then. */
export const heroDecoded: Promise<void> = gate?.decoded ?? Promise.resolve();
/** Resolves on the frame the intro starts. */
export const introStarted: Promise<void> = gate?.started ?? Promise.resolve();
