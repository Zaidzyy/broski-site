import '@fontsource/anton/latin-400.css';
import '@fontsource/geist-sans/latin-400.css';
import '@fontsource/geist-sans/latin-500.css';
import '@fontsource/geist-sans/latin-600.css';
import '@fontsource/geist-mono/latin-300.css';
import '@fontsource/geist-mono/latin-400.css';
import '@fontsource/geist-mono/latin-500.css';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/day.css';
import './styles/sections.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initHero } from './hero';
import { initHeroAlive } from './hero-alive';
import { initHoodLog } from './hood';
import { initDay } from './day';
import { initFeatures } from './features';
import { initGate } from './gate';
import { initVote } from './vote';
import './intro'; // first: starts the intro if the inline gate never ran
import { toast } from './lib/motion';
import { introDone } from './lib/alive';

document.documentElement.classList.add('js');

initHero();
initHeroAlive();
initFeatures();
initGate();
initVote();
initHoodLog();

// Film: a "coming soon" state until FILM_URL is set in src/config.ts.
for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-soon]')) {
  a.addEventListener('click', (e) => { e.preventDefault(); toast('The film is coming soon'); });
}

// The loops in section 04 only run while it is on screen.
const hood = document.querySelector('.hood');
if (hood) {
  new IntersectionObserver(([e]) => hood.classList.toggle('in-view', e.isIntersecting), { rootMargin: '100px' }).observe(hood);
}

// Below the fold: the day (its layout and scroll triggers are the heaviest setup on the page), the 04 reveals,
// and measuring again once the fonts are in. It waits for the intro, so nothing competes with it, or for the
// first scroll, whichever comes first.
let below = false;
function startBelow() {
  if (below) return;
  below = true;
  initDay();
  ScrollTrigger.batch('.rv', {
    start: 'top 88%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }),
  });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
introDone.then(startBelow);
window.addEventListener('scroll', startBelow, { once: true, passive: true });
