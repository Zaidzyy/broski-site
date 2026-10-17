// The intro gate, inlined right after the hero's markup so it starts while the rest of the page is still
// loading, instead of waiting for the main script. It holds the intro (CSS) until the display font and both
// hero pictures are ready to paint, or 1.2 s at most, then starts it on the next frame. The CSP allows exactly
// this script by its hash (vite.config.ts). src/intro.ts reads its state.
import { createHash } from 'node:crypto';

export const INTRO_GATE = `(function () {
  var hero = document.querySelector('.hero');
  var decoded, started, gone = false;
  window.__introGate = {
    decoded: new Promise(function (r) { decoded = r; }),
    started: new Promise(function (r) { started = r; })
  };
  if (!hero) { decoded(); started(); return; }
  hero.dataset.gateAt = Math.round(performance.now());
  function go(why) {
    if (gone) return;
    gone = true;
    requestAnimationFrame(function () {
      hero.dataset.introWhy = why;
      hero.dataset.introAt = Math.round(performance.now());
      hero.classList.add('is-go');
      started();
    });
  }
  setTimeout(function () { go('cap'); }, 1200);
  try {
    var pictures = Promise.all(Array.prototype.map.call(hero.querySelectorAll('.pic__main img'), function (img) {
      return img.decode().catch(function () {});
    }));
    pictures.then(decoded);
    var font = Promise.all([document.fonts.load('400 1em Anton'), document.fonts.ready]).catch(function () {});
    Promise.all([font, pictures]).then(function () { go('ready'); });
  } catch (e) {
    decoded();
    go('ready');
  }
})();`;

/** For the CSP's script-src. */
export const INTRO_GATE_HASH = `'sha256-${createHash('sha256').update(INTRO_GATE).digest('base64')}'`;
