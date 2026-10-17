// Build-time renderer: turns the data files into the page's static HTML.
// vite.config.ts injects the result into index.html, so the page reads fine without JS.
import facts from '../data/facts.json';
import { GROUPS, DEFAULT_GROUP } from '../data/features';
import { FILM_URL, GITHUB_URL, README_ARCH_URL, README_NUMBERS_URL } from '../config';
import { renderDay } from './day';
import { esc, picture } from './util';
import { LOCKUP } from './brand';
import { LOG } from '../data/hood';
import { INTRO_GATE } from './intro-gate';

const letters = 'BROSKI'.split('').map((c, i) => `<span class="mask"><span class="ltr" style="--d:${(0.08 * i).toFixed(2)}s">${c}</span></span>`).join('');
const filmAttrs = FILM_URL ? `href="${FILM_URL}"` : `href="${GITHUB_URL}#film" data-soon aria-describedby="film-soon"`;
const ext = 'target="_blank" rel="noopener"';

function hero() {
  const face = (p: 'bro' | 'zara', alt: string) => `
    <div class="face face--${p}"><div class="pane"><div class="slide"><div class="pic"><div class="breath">
      ${picture(`${p}-hero`, 'pic__main', alt, { w: [520, 820, 1254], size: 820, sizes: '(max-width: 700px) 430px, 820px', high: true })}
      ${picture(`${p}-dim`, 'pic__dim', '', { w: [520, 820], size: 820, sizes: '(max-width: 700px) 430px, 820px', lazy: true })}
    </div></div></div></div></div>`;
  return `
<section class="hero" id="top" aria-labelledby="hero-h">
  <header class="hero__head">
    <a class="hero__brand" href="#top" aria-label="Broski, back to top">${LOCKUP}</a>
    <span class="hero__vol fade">Vol. 01 — A life, operated</span>
    <span class="hero__status fade" data-status>Two voices · one at a time</span>
    <span class="hero__links fade"><a class="pill pill--bone" ${filmAttrs}><span aria-hidden="true">▶</span> Watch the film</a><a class="pill pill--line" href="${GITHUB_URL}" ${ext}>GitHub <span aria-hidden="true">↗</span></a></span>
  </header>
  <p class="word word--solid" aria-hidden="true">${letters}</p>
  ${face('bro', 'Bro, drawn in grey: messy dark hair, headphones round his neck, a half smile.')}
  ${face('zara', 'Zara, drawn in warm colour: long fair hair, a wink and a grin.')}
  <div class="slash" aria-hidden="true"><span class="slash__line"><span></span></span></div>
  <h1 id="hero-h" class="word word--outline"><span class="sr-only">Broski</span><span aria-hidden="true">${letters}</span></h1>
  <div class="fig fig--bro fade"><span class="fig__k">FIG. 1 — BRO</span><p class="fig__t serif">Hears every excuse. Accepts none of them.</p></div>
  <div class="fig fig--zara fade"><span class="fig__k">FIG. 2 — ZARA</span><p class="fig__t serif">Softer voice. Still won't let you slide.</p></div>
  <div class="chooser fade">
    <p class="chooser__q serif" data-question aria-live="polite">Who do you want today?</p>
    <div class="chooser__pill" role="group" aria-label="Choose who to enter with">
      <button type="button" class="pick pick--bro" data-pick="bro" aria-pressed="false">Bro</button>
      <span class="chooser__slash" aria-hidden="true">/</span>
      <button type="button" class="pick pick--zara" data-pick="zara" aria-pressed="false">Zara</button>
    </div>
    <p class="chooser__hint" data-hint><span data-hint-t>HOVER TO PEEK · CLICK TO CHOOSE</span><span class="chooser__arrow" aria-hidden="true">↓</span></p>
  </div>
</section>`;
}

/** The 36 marks' angles on the section 03 ring: six groups of six, 60deg apart. */
const MARK_ANGLES = Array.from({ length: 36 }, (_, i) => 6 + Math.floor(i / 6) * 60 + (i % 6) * 9.6);

/** A small copy of the ring with one tick lit: the feature's own mark on the dial. */
function tickIcon(lit: number) {
  const seg = (a: number, r1: number, r2: number) => {
    const t = (a * Math.PI) / 180, s = Math.sin(t), c = Math.cos(t);
    const f = (v: number) => v.toFixed(2);
    return `M${f(17 + r1 * s)} ${f(17 - r1 * c)}L${f(17 + r2 * s)} ${f(17 - r2 * c)}`;
  };
  const rest = MARK_ANGLES.map((a, i) => (i === lit ? '' : seg(a, 12, 15.5))).join('');
  return `<svg class="tile__mark" viewBox="0 0 34 34" width="34" height="34" aria-hidden="true"><path class="tk" d="${rest}"/><path class="tk-on" d="${seg(MARK_ANGLES[lit], 9, 16.5)}"/></svg>`;
}

function rest() {
  const marks = GROUPS.map((_, g) => Array.from({ length: 6 }, (_, k) =>
    `<span class="mark" data-g="${g}" style="--a:${(6 + g * 60 + k * 9.6).toFixed(1)}deg"></span>`).join('')).join('');
  const tabs = GROUPS.map((g, i) => {
    const on = i === DEFAULT_GROUP;
    const id = g.g.toLowerCase();
    return `<button type="button" role="tab" id="tab-${id}" class="tab" aria-selected="${on}" aria-controls="panel-${id}" tabindex="${on ? 0 : -1}"><span class="tab__g">${g.g}</span><span class="tab__n" aria-hidden="true">06</span></button>`;
  }).join('');
  const panels = GROUPS.map((g, i) => {
    const id = g.g.toLowerCase();
    return `<div role="tabpanel" id="panel-${id}" class="bento" aria-labelledby="tab-${id}" tabindex="0">
      <h3 class="sr-only">${g.g}: six features</h3>
      <ul class="bento__grid">${g.items.map((it, k) => `
        <li class="tile${k === 0 ? ' tile--acc' : ''}"><span class="tile__top">${tickIcon(i * 6 + k)}<span class="tile__n" aria-hidden="true">0${k + 1}</span></span><b class="tile__t">${esc(it.t)}</b><span class="tile__d">${esc(it.d)}</span></li>`).join('')}
      </ul>
    </div>`;
  }).join('');
  return `
<section class="sect rest" id="everything" aria-labelledby="rest-h">
  <div class="wrap">
    <div class="grid12 sect__head">
      <div class="sect__h"><span class="eyebrow">03 · Everything else</span><h2 id="rest-h" class="h-xl serif">That was one day.<br><em class="h-dim">Here's the rest.</em></h2></div>
      <p class="lede sect__lede">Thirty-six marks on the dial, one per feature. Pick a part of it.</p>
    </div>
    <div class="tabs" role="tablist" aria-label="Feature groups">${tabs}</div>
    <p class="tabs__hint" aria-hidden="true">HOVER TO PEEK · CLICK TO CHOOSE</p>
    <div class="rest__body">
      <div class="fring" aria-hidden="true">${marks}
        <div class="fring__c"><span class="fring__i micro" data-ring-i>0${DEFAULT_GROUP + 1} / 06</span><span class="fring__g" data-ring-g>${GROUPS[DEFAULT_GROUP].g}</span><span class="micro acc">6 THINGS</span></div>
      </div>
      <div class="panels">${panels}</div>
    </div>
  </div>
</section>`;
}

function hood() {
  const tiers = [
    ['Tier 0', 'No AI', '"water 500" is parsed in code', '0 tokens'],
    ['Tier 1', 'Local', 'Ollama sorts imports and scrubs secrets', 'on the laptop'],
    ['Tier 2', 'Sonnet', 'Everyday chat and check-ins', 'most turns'],
    ['Tier 3', 'Opus', 'Weekly review, memory writing', 'rare, worth it'],
  ];
  const flow = (color: string) => `<span class="flow flow--${color}" aria-hidden="true"><span></span></span>`;
  const local = [
    ['Speech to text', 'WHISPER · GPU'], ['Both voices', 'KOKORO · GPU'], ['Wake word', 'ON-DEVICE'],
    ['Your data', 'SQLITE + VAULT'], ['Secrets', 'WINDOWS DPAPI'], ['Self-check', `DOCTOR · ${facts.doctorChecks} CHECKS`],
  ];
  const stack = ['Electron', 'React', 'TypeScript', 'SQLite', 'Claude Agent SDK', 'Ollama', 'faster-whisper', 'Kokoro', 'Telegram Bot API', 'ActivityWatch', 'Google Calendar'];
  return `
<section class="sect hood" id="hood" aria-labelledby="hood-h">
  <div class="wrap hood__wrap">
    <div class="grid12 sect__head">
      <div class="sect__h"><span class="eyebrow">04 · Under the hood</span><h2 id="hood-h" class="h-xl serif">Cheap where it can be.<br><em class="h-dim">Careful where it counts.</em></h2></div>
      <p class="lede sect__lede">Every message takes the cheapest route that can handle it. Anything that leaves the laptop or can't be undone waits for a yes.</p>
    </div>
    <ol class="tiers">${tiers.map(([k, t, d, n], i) => `
      <li class="tier rv" style="--mix:${4 + i * 5}%"><span class="eyebrow">${k}</span><span class="tier__t">${t}</span><span class="tier__d">${esc(d)}</span><span class="eyebrow acc">${n}</span></li>`).join('')}
    </ol>
    <div class="hood__grid">
      <div class="gate" id="gate">
        <h3 class="eyebrow">The gate · press Yes</h3>
        <div class="gate__row"><div class="req"><span class="req__t">“What's on Thursday?”</span><span class="req__k">calendar.read · READ</span></div>${flow('good')}<span class="done">✓ ANSWERED</span></div>
        <div class="gate__row"><div class="req"><span class="req__t">“Play my focus mix”</span><span class="req__k">spotify.play · EVERYDAY</span></div>${flow('good')}<span class="done">✓ PLAYING</span></div>
        <div class="gate__row gate__row--send" data-gate="wait">
          <div class="req req--send"><span class="req__t">“Reply to Kestrel: Thursday works”</span><span class="req__k">email.send · CAN'T BE UNDONE</span></div>
          <span class="gate__mid" aria-hidden="true"><span class="flow flow--gate"><span></span></span><span class="gate__bar"></span></span>
          <span class="gate__ctl">
            <span class="gate__label" data-gate-label role="status">WAITING FOR YOUR YES</span>
            <span class="gate__btns"><button type="button" class="gbtn gbtn--yes" data-gate-yes>Yes</button><button type="button" class="gbtn" data-gate-no>No</button></span>
            <button type="button" class="gate__again" data-gate-again hidden>↺ TRY AGAIN</button>
          </span>
        </div>
        <ul class="legend">
          <li><span class="tone-good">FREE</span><span>Reading, searching, logging</span></li>
          <li><span class="tone-good">FREE</span><span>Apps, links, music, volume</span></li>
          <li><span class="tone-bad">ASKS FIRST</span><span>Send, delete, pay, run commands</span></li>
        </ul>
      </div>
      <div class="onlap">
        <h3 class="eyebrow">On this laptop</h3>
        <div class="lap">
          <div class="lap__screen">
            <ul class="lap__chips">${local.map(([t, k]) => `<li><b>${t}</b><span>${k}</span></li>`).join('')}</ul>
            <div class="lap__log" aria-hidden="true"><ol>${[4, 5, 6, 0].map((i) => `<li${LOG[i].good ? ' class="is-good"' : ''}>${esc(LOG[i].t)}</li>`).join('')}</ol></div>
            <p class="sr-only">Running locally, 0 failures.</p>
          </div>
          <div class="lap__base" aria-hidden="true"></div>
          <svg class="lap__links" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">
            <path d="M380 70 C 420 70 420 46 452 46" stroke="#D88A9C" class="dashflow"/>
            <path d="M380 150 L 452 150" stroke="#E8512F" stroke-dasharray="3 5"/>
            <path d="M380 230 C 420 230 420 254 452 254" stroke="#8F887C" class="dashflow"/>
          </svg>
          <ul class="lap__out" aria-label="What leaves the laptop">
            <li class="out out--claude"><b>Claude</b><span>TEXT ONLY</span></li>
            <li class="out out--audio"><span>✕ AUDIO NEVER SENT</span></li>
            <li class="out out--tg"><b>Telegram</b><span>YOUR CHAT ONLY</span></li>
          </ul>
          <p class="lap__cap eyebrow">Your voice and your secrets never leave it.</p>
        </div>
      </div>
    </div>
    <ul class="stack rv" aria-label="Stack">${stack.map((s) => `<li>${s}</li>`).join('')}</ul>
  </div>
</section>`;
}

export const VOTES = [
  { id: 'whole-thing', t: 'The whole thing', d: 'Bro or Zara, the day, all 36 features' },
  { id: 'trading-coach', t: 'Just the trading coach', d: 'Academy, drills, paper trading. Never trades' },
  { id: 'voice-bubble', t: 'Just the voice + bubble', d: 'Local voice, wake word, laptop control' },
];

function yours() {
  return `
<section class="sect yours" id="yours" aria-labelledby="yours-h">
  <div class="wrap grid12 yours__grid">
    <div class="yours__l">
      <span class="eyebrow">05 · Yours?</span>
      <h2 id="yours-h" class="h-yet serif">It's mine.<br><em class="h-dim">You can't install it.</em><br><em class="acc">Yet?</em></h2>
      <nav class="yours__links" aria-label="More about Broski">
        <a class="pill pill--bone pill--lg" ${filmAttrs}><span aria-hidden="true">▶</span> Watch the film</a>
        <a class="pill pill--line pill--lg" href="${README_ARCH_URL}" ${ext}>How it's built</a>
        <a class="pill pill--line pill--lg" href="${GITHUB_URL}" ${ext}>GitHub <span aria-hidden="true">↗</span></a>
      </nav>
      ${FILM_URL ? '' : '<p class="sr-only" id="film-soon">The film is coming soon.</p>'}
    </div>
    <div class="vote">
      <form class="vote__form" data-vote novalidate>
        <p class="vote__q">Right now Broski runs on one laptop for one person. I'm deciding whether to build a version anyone can run. <b>Which part would you actually use?</b></p>
        <fieldset class="vote__opts">
          <legend class="sr-only">Which part would you actually use?</legend>
          ${VOTES.map((v) => `
          <label class="opt"><input type="radio" name="choice" value="${v.id}"><span class="opt__dot" aria-hidden="true"></span><b>${v.t}</b><span class="opt__d">${v.d}</span></label>`).join('')}
        </fieldset>
        <label class="vote__email"><span class="eyebrow">Email · optional</span><input type="email" name="email" placeholder="you@example.com" autocomplete="email" inputmode="email" aria-describedby="vote-err"></label>
        <div class="vote__hp" aria-hidden="true"><label>Leave this empty <input type="text" name="_gotcha" value="" tabindex="-1" autocomplete="off" aria-hidden="true"></label></div>
        <button type="submit" class="vote__send" disabled>Count me in</button>
        <p class="vote__err" id="vote-err" data-vote-err role="alert" hidden></p>
        <p class="vote__fine">One vote, no account. The email is only used to tell you if this ships, and it's deleted if it doesn't.</p>
      </form>
      <div class="vote__done" data-vote-done hidden>
        <p class="eyebrow acc">✓ Counted</p>
        <p class="vote__thanks serif" tabindex="-1" data-vote-thanks>If it happens, you will hear first.</p>
        <p class="vote__picked">You picked: <b data-vote-picked></b></p>
        <button type="button" class="gate__again" data-vote-redo>↺ CHANGE MY VOTE</button>
      </div>
    </div>
  </div>
</section>`;
}

function footer() {
  const n = (x: number) => x.toLocaleString('en-US');
  return `
<footer class="foot">
  <div class="foot__in">
    <p class="proof"><span><b class="acc">${n(facts.tests)}</b> tests</span><span class="proof__dot" aria-hidden="true">·</span><span><b class="acc">${facts.voiceSeconds} s</b> on-device voice</span><span class="proof__dot" aria-hidden="true">·</span><span><b class="acc">${facts.telemetry}</b> telemetry</span></p>
    <div class="foot__row"><span>Broski — Vol. 01</span><span>Built by one, for one</span><a href="${README_NUMBERS_URL}" ${ext}>Full numbers in the README <span aria-hidden="true">↗</span></a></div>
  </div>
</footer>`;
}

export function renderPage() {
  return `<a class="skip" href="#day">Skip to the day</a>
<main id="main">${hero()}<script>${INTRO_GATE}</script>${renderDay()}${rest()}${hood()}${yours()}</main>${footer()}
<div class="toast" data-toast role="status" aria-live="polite"></div>`;
}
