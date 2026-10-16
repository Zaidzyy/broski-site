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
import { initDay } from './day';
import { initFeatures } from './features';
import { initGate } from './gate';
import { initVote } from './vote';
import { reducedMotion, toast } from './lib/motion';

document.documentElement.classList.add('js');

initHero();
initDay();
initFeatures();
initGate();
initVote();

// Film: a "coming soon" state until FILM_URL is set in src/config.ts.
for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-soon]')) {
  a.addEventListener('click', (e) => { e.preventDefault(); toast('The film is coming soon'); });
}

// The loops in section 04 only run while it is on screen.
const hood = document.querySelector('.hood');
if (hood) {
  new IntersectionObserver(([e]) => hood.classList.toggle('in-view', e.isIntersecting), { rootMargin: '100px' }).observe(hood);
}

// Section 04 reveals, once.
if (!reducedMotion()) {
  ScrollTrigger.batch('.rv', {
    start: 'top 88%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }),
  });
}

// Fonts change line heights in the day; measure again once they are in.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
