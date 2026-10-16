// Section 02 markup: the pinned stage (sky, dial, top bar) and the twelve scenes.
// Rendered at build time; src/day.ts brings it to life.
import {
  SCENES, INTRO, SCORE, RECEIPT, BODY, PHONE, BRIEF, MIND, TRADING, WORK, INBOX,
  CALLOUT, TRAIN, LAPTOP, HABITS, type Scene,
} from '../data/day';
import { BEFORE, AFTER, LEVELS, type Candle } from '../data/chart';
import { esc, img } from './util';

const Z = 'zara';
/** A persona line. Zara is the default when nobody has been picked. */
const say = (s: Scene, quoted = false) =>
  `<span data-line="${s.id}">${esc(quoted ? `“${s.line[Z]}”` : s.line[Z])}</span>`;
const who = (upper = true) => `<span data-name="${upper ? 'upper' : 'name'}">${upper ? 'ZARA' : 'Zara'}</span>`;

/** Entry animation hooks: played once, the first time the scene is shown. */
const a = (kind: string, d: number, extra = '') => `data-a="${kind}" data-d="${d}"${extra}`;

const chip = (t: string, tone: string) => `<span class="chip chip--${tone}">${esc(t)}</span>`;

const wave = (n: number, cls: string) =>
  `<span class="wave ${cls}" aria-hidden="true">${Array.from({ length: n }, (_, i) =>
    `<span style="--wd:-${((i * 0.09) % 1.1).toFixed(2)}s"></span>`).join('')}</span>`;

function candles(list: Candle[]) {
  return list.map(([x, y1, y2, by, bh, up]) => {
    const c = up ? '#6FBF8E' : '#E8512F';
    return `<line x1="${x}" x2="${x}" y1="${y1}" y2="${y2}" stroke="${c}"/><rect x="${(x - 3.6).toFixed(1)}" y="${by}" width="7.2" height="${bh}" fill="${c}"/>`;
  }).join('');
}

// ---------- the twelve widgets ----------

const W: Record<string, (s: Scene) => string> = {
  s0400: (s) => `
    <div class="receipt" ${a('print', 0.2)}>
      <div class="receipt__in">
        <div class="r-row r-b"><span>BROSKI</span><span>DAY CLOSE</span></div>
        <div class="r-cut"></div>
        <div class="r-row"><span>YESTERDAY</span><b>${RECEIPT.yesterday}</b></div>
        <div class="r-row r-dim"><span>CLOSED</span><span>${RECEIPT.closed}</span></div>
        <div class="r-cut"></div>
        <div class="r-b">TODAY</div>
        ${RECEIPT.today.map((t) => `<div>▸ ${esc(t)}</div>`).join('')}
        <div class="r-cut"></div>
        <div class="r-say">${who()} SAYS</div>
        <p class="r-quote">${say(s, true)}</p>
      </div>
    </div>`,

  s0742: (s) => `
    <div class="w-col w560">
      <div class="voicebar">
        ${wave(12, 'wave--sm')}
        <span class="reveal" ${a('wipe', 0.25)}><span class="reveal__in mono">${esc(BODY.sentence)}</span></span>
      </div>
      <div class="stats">${BODY.stats.map((st, i) => `
        <div class="stat" ${a('pop', 0.8 + i * 0.15)}><span class="k">${st.k}</span><span class="v">${esc(st.v)}</span><span class="n tone-${st.tone}">${esc(st.n)}</span></div>`).join('')}
      </div>
      <div class="says" ${a('pop', 1.45)}><span class="says__who">${who()}</span><span class="says__line serif">${say(s)}</span></div>
      <span class="micro" ${a('pop', 1.65)}>${BODY.parsed}</span>
      <div class="food" ${a('pop', 1.8)}><span class="mono">${BODY.food.said}</span><span aria-hidden="true">→</span><b>${BODY.food.est}</b><span class="micro">${BODY.food.tag}</span></div>
    </div>`,

  s0830: (s) => `
    <div class="w-row w600">
      <div class="phone">
        <div class="phone__screen">
          <div class="phone__head"><span class="phone__ava" aria-hidden="true"></span><div><b>${PHONE.title}</b><span>${PHONE.sub}</span></div></div>
          <div class="phone__chat">
            <div class="msg msg--me" ${a('pop', 0.2)}>/today</div>
            <div class="msg msg--bot" ${a('pop', 0.4)}><b>${PHONE.today.head}</b>${PHONE.today.items.map((t) => `<div class="todo"><span aria-hidden="true"></span>${esc(t)}</div>`).join('')}</div>
            <div class="msg msg--me msg--voice" ${a('pop', 0.9)}><span aria-hidden="true">▶</span>${[6, 10, 14, 8, 12, 16, 9, 5, 11, 7].map((v) => `<i style="height:${v}px"></i>`).join('')}<span class="sr-only">Voice note,</span> ${PHONE.voice}</div>
            <div class="msg msg--bot" ${a('pop', 1.1)}>${esc(PHONE.logged)}</div>
            <div class="qbtns" ${a('pop', 1.25)}>${PHONE.buttons.map((b) => `<span>${esc(b)}</span>`).join('')}</div>
          </div>
        </div>
      </div>
      <div class="phone__side">
        <div class="says says--stack" ${a('pop', 1.5)}><span class="says__who">${who()}</span><span class="says__line serif">${say(s, true)}</span></div>
        <div class="chips" ${a('pop', 1.6)}>${PHONE.commands.map((c) => chip(c, 'muted')).join('')}</div>
      </div>
    </div>`,

  s1000: (s) => `
    <div class="card w560">
      <div class="card__head"><span class="acc">${who()} · 10:00 BRIEF · 2 MIN</span><span>${BRIEF.right}</span></div>
      <div class="chips chips--pad" ${a('pop', 0.13)}>${BRIEF.chips.map((c) => chip(c.t, c.tone)).join('')}</div>
      <ol class="brief">${BRIEF.items.map((it, i) => `
        <li ${a('pop', 0.3 + i * 0.17)}><span class="brief__n">0${i + 1}</span><span>${esc(it.t)}</span>${chip(it.src, 'muted')}</li>`).join('')}
      </ol>
      <p class="card__quote serif" ${a('pop', 1.25)}>${say(s, true)}</p>
    </div>`,

  s1115: (s) => `
    <div class="w-col w520 mind">
      <div class="says" ${a('pop', 0.25)}><span class="says__who">${who()}</span><span class="says__line serif">${say(s)}</span></div>
      <div class="flash">
        <div class="flash__card" ${a('flip', 0.8)}>
          <div class="flash__front"><span class="arabic" lang="ar" dir="rtl">${MIND.word}</span><span class="micro micro--ink">${MIND.card}</span></div>
          <div class="flash__back"><span class="serif flash__tr">${MIND.translit}</span><span class="flash__mean">${MIND.meaning}</span><span class="micro acc">${MIND.back}</span></div>
        </div>
      </div>
      <div class="chips" ${a('pop', 1.5)}>${MIND.chips.map((c) => `<span class="chip chip--line">${esc(c)}</span>`).join('')}</div>
    </div>`,

  s1230: (s) => `
    <div class="card card--col w560">
      <div class="card__head"><span class="acc">${TRADING.head}</span><span>${TRADING.right}</span></div>
      <svg class="chart" viewBox="0 0 516 170" width="516" height="170" role="img" aria-label="A replay drill: the chart stops, entry, stop and target are set, then the rest of the chart is revealed.">
        <g stroke-width="1">${candles(BEFORE)}</g>
        <line x1="${LEVELS.split}" x2="${LEVELS.split}" y1="0" y2="170" stroke="rgba(230,236,245,.35)"/>
        <g ${a('pop', 0.4)} font-size="9" font-family="Geist Mono, monospace" text-anchor="end">
          <line x1="${LEVELS.split}" x2="516" y1="${LEVELS.target}" y2="${LEVELS.target}" stroke="#6FBF8E" stroke-dasharray="4 4"/><text x="512" y="${LEVELS.target - 4}" fill="#6FBF8E">TARGET</text>
          <line x1="${LEVELS.split}" x2="516" y1="${LEVELS.entry}" y2="${LEVELS.entry}" stroke="#E8EBF0" stroke-dasharray="4 4"/><text x="512" y="${LEVELS.entry - 4}" fill="#E8EBF0">ENTRY</text>
          <line x1="${LEVELS.split}" x2="516" y1="${LEVELS.stop}" y2="${LEVELS.stop}" stroke="#E8512F" stroke-dasharray="4 4"/><text x="512" y="${LEVELS.stop - 4}" fill="#E8512F">STOP</text>
        </g>
        <g ${a('fade', 0.75)} stroke-width="1">${candles(AFTER)}</g>
      </svg>
      <div class="grades" ${a('pop', 1.1)}><div class="chips">${TRADING.grades.map((g) => chip(g.t, g.tone)).join('')}</div><span class="note">${TRADING.gradeNote}</span></div>
      <div class="paper" ${a('pop', 1.3)}>
        <span>${TRADING.paper.label}</span><span class="mono">${TRADING.paper.value}</span>
        <span class="bar"><span ${a('gx', 1.35)} style="width:${TRADING.paper.pct}%"></span></span>
        <span>${TRADING.ready.label}</span><span class="mono tone-warn ls">${TRADING.ready.value}</span>
      </div>
      <p class="serif card__q19" ${a('pop', 1.55)}>${say(s, true)}</p>
      <span class="micro micro--muted" ${a('pop', 1.65)}>${TRADING.never}</span>
    </div>`,

  s1403: (s) => `
    <div class="card w560 work">
      <div class="card__head"><span class="acc">${who()} · 3 NEW JOBS</span><span>${WORK.right}</span></div>
      ${WORK.jobs.map((j, i) => `
      <div class="job" ${a('pop', 0.3 + i * 0.17)}>
        <div class="job__top"><div class="job__t"><b>${esc(j.role)}</b><span>${esc(j.where)}</span></div>${j.top ? '<div class="job__btns"><span class="btnlike btnlike--acc">Applied</span><span class="btnlike">Skip</span></div>' : ''}</div>
        <div class="job__fit"><span class="bar"><span class="${j.top ? 'is-acc' : ''}" ${a('gx', 0.45 + i * 0.17)} style="width:${j.fit}%"></span></span><span class="mono ${j.top ? '' : 'tone-muted'}">FIT ${j.fit}</span></div>
      </div>`).join('')}
      <p class="card__quote serif" ${a('pop', 1.25)}>${say(s, true)}</p>
    </div>`,

  s1520: (s) => `
    <div class="card card--col w560 inbox">
      <div class="mail" ${a('pop', 0.15)}>
        <div class="mail__meta"><span>${INBOX.from}</span><span>${INBOX.at}</span></div>
        <b>${INBOX.subject}</b>
        <span class="mail__prev">${INBOX.preview}</span>
      </div>
      <div class="week" ${a('pop', 0.5)}>${INBOX.week.map((d) => `
        <div class="wday${d.slot ? ' wday--hl' : ''}"><span class="wday__n">${d.d}</span>${d.slot ? `<span class="ev ev--slot" ${a('pop', 0.9)}>${d.slot[0]}<br>${d.slot[1]}</span>` : ''}${d.ev ? `<span class="ev">${d.ev[0]}<br>${d.ev[1]}</span>` : ''}</div>`).join('')}
      </div>
      <div class="draft" ${a('pop', 1.1)}><span class="micro micro--muted">DRAFT REPLY</span>${esc(INBOX.draft)}</div>
      <div class="btnrow" ${a('pop', 1.35)}><span class="btnlike btnlike--acc">${INBOX.actions[0]}</span><span class="btnlike">${INBOX.actions[1]}</span><span class="btnlike tone-muted">${INBOX.actions[2]}</span></div>
      <p class="serif card__q19" ${a('pop', 1.55)}>${say(s, true)}</p>
    </div>`,

  s1640: (s) => `
    <div class="callout w600">
      <div class="editor" aria-hidden="true">
        <div class="editor__bar"><span></span><span></span><em>${CALLOUT.file}</em></div>
        <div class="editor__lines">${[62, 88, 80, 92, 40, 76, 85, 55].map((w, i) => `<span style="width:${w}%;opacity:${[0.1, 0.07, 0.07, 0.07, 0.05, 0.07, 0.07, 0.05][i]}"></span>`).join('')}</div>
      </div>
      <div class="bubble" ${a('pop', 0.35)}>
        <div class="bubble__head">${img('avatar', 'bubble__ava')}<span class="acc micro">${who()} · 16:40</span></div>
        <p>${say(s)}</p>
        <div class="words" ${a('pop', 0.9)}><span class="micro micro--muted">${CALLOUT.wordsLabel}</span><span class="serif">“${CALLOUT.words}”</span></div>
        <div class="btnrow"><span class="btnlike btnlike--acc">${CALLOUT.actions[0]}</span><span class="btnlike">${CALLOUT.actions[1]}</span><span class="btnlike tone-muted">${CALLOUT.actions[2]}</span></div>
      </div>
      <span class="callout__log acc mono" ${a('pop', 1.55)}>${CALLOUT.logged}</span>
    </div>`,

  s1910: (s) => `
    <div class="card w560 train">
      <div class="card__head"><span class="acc">${TRAIN.head}</span><span>${TRAIN.right}</span></div>
      ${TRAIN.sets.map((r, i) => `
      <div class="set" ${a('pop', 0.25 + i * 0.18)}><b>${esc(r.ex)}</b>${chip(r.verdict, r.tone)}<span class="mono tone-muted">${esc(r.sets)}</span></div>`).join('')}
      <div class="chips set-week" ${a('pop', 1.05)}>${TRAIN.week.map((c) => chip(c.t, c.tone)).join('')}</div>
      <p class="card__quote card__quote--flat serif" ${a('pop', 1.3)}>${say(s, true)}</p>
    </div>`,

  s2130: (s) => `
    <div class="w-col w600 laptop-scene">
      <p class="hey serif" ${a('wipe', 0.15)}><span class="reveal__in">“Hey ${who(false)}, set me up for work.”</span></p>
      <div ${a('pop', 0.55)}>${wave(40, 'wave--lg')}</div>
      <ul class="acts">${LAPTOP.actions.map((x, i) => `
        <li ${a('pop', 0.85 + i * 0.15)}><span class="tone-good" aria-hidden="true">✓</span><span>${esc(x.t)}</span><span class="micro">${x.k}</span></li>`).join('')}
      </ul>
      <div class="says" ${a('pop', 1.55)}><span class="says__who">${who()}</span><span class="says__line serif says__line--26">${say(s)}</span></div>
      <span class="micro" ${a('pop', 1.7)}>${LAPTOP.note}</span>
    </div>`,

  s2300: (s) => `
    <div class="w-col w560 score">
      <div class="says says--stack" ${a('pop', 0.75)}><span class="says__who">${who()} · TOMORROW</span><span class="serif score__line">${say(s, true)}</span></div>
      <div class="habits" ${a('pop', 1.05)}>
        <span class="micro">${HABITS.label}</span>
        ${HABITS.rows.map((r) => `
        <div class="habit"><span class="habit__k">${r.k}</span><span class="habit__days" role="img" aria-label="${r.k}: ${[...r.days].filter((c) => c === 'x').length} of 14 days done${r.days.includes('s') ? ', one frozen day' : ''}">${[...r.days].map((c) => `<i class="${c === 'x' ? 'on' : c === 's' ? 'scar' : ''}"></i>`).join('')}</span><span class="habit__n${r.warn ? ' tone-warn' : ''}">${r.note}</span></div>`).join('')}
      </div>
    </div>`,
};

function sceneHtml(s: Scene, i: number) {
  return `
  <article class="scene" id="${s.id}" data-i="${i}" aria-labelledby="${s.id}-h">
    <div class="scene__in">
      <p class="scene__time"><span class="scene__big" aria-hidden="true">${s.time}</span><span class="scene__tag">${s.time} · ${esc(s.tag.toUpperCase())}</span></p>
      <h3 id="${s.id}-h" class="scene__h serif">${esc(s.title)}</h3>
      <p class="scene__body">${esc(s.body)}</p>
      <div class="scene__w"><div class="fit">${W[s.id](s)}</div></div>
    </div>
  </article>`;
}

// ---------- the dial ----------

/** A fixed star field: tiny radial gradients from a seeded generator. */
function stars(seed: number, n: number, maxY: number) {
  let x = seed;
  const r = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => {
    const size = [0.8, 1, 1.2, 1.6][Math.floor(r() * 4)];
    return `radial-gradient(circle at ${Math.round(r() * 100)}% ${Math.round(r() * maxY)}%,rgba(237,228,211,${(0.3 + r() * 0.6).toFixed(2)}) 0 ${size}px,transparent ${size + 0.6}px)`;
  }).join(',');
}

const SCENE_HOURS = new Set(SCENES.map((s) => Math.floor(Number(s.time.slice(0, 2)))));

function dial() {
  const labels = Array.from({ length: 24 }, (_, k) => {
    const hh = (k + 4) % 24;
    const big = SCENE_HOURS.has(hh);
    const si = big ? SCENES.findIndex((s) => Number(s.time.slice(0, 2)) === hh) : -1;
    const t = String(hh).padStart(2, '0');
    return `<span class="lab${big ? ' lab--big' : ''}" style="--a:${k * 15}deg"${big ? ` data-lab="${si}"` : ''}><span class="lab__in"><span class="lab__n">${t}</span>${big ? `<span class="lab__acc">${t}</span>` : ''}</span></span>`;
  }).join('');
  const dots = SCENES.map((s) => `<span class="dot" style="--a:${(s.hours * 15).toFixed(2)}deg"></span>`).join('');
  const skies = SCENES.map((s, i) => `<span class="sky" data-sky="${i}" style="background:${s.sky}"></span>`).join('');
  const digits = (ink: string) => SCENES.map((s, i) => `<span class="ctr__t" data-ctr="${i}">${s.time}</span>`).join('') +
    (ink === 'l' ? `<span class="ctr__score" data-score><span class="micro">${SCORE.label}</span><span class="ctr__72">${SCORE.value}</span><span class="ctr__note">${SCORE.note}</span></span>` : '');
  return `
  <div class="dial" aria-hidden="true">
    <div class="win" data-win>
      <div class="skies">${skies}</div>
      <span class="stars" data-stars style="background:${stars(7, 60, 75)}"></span>
      <span class="glow glow--dawn" data-dawn></span>
      <span class="glow glow--dusk" data-dusk></span>
      <span class="sun" data-sun></span>
      <span class="moon" data-moon></span>
      <span class="horizon horizon--l" data-ink="l"></span><span class="horizon horizon--d" data-ink="d"></span>
    </div>
    <div class="ticks" data-ticks>
      <span class="ring ring--minor"></span><span class="ring ring--major"></span>
      ${labels}
      ${dots}
    </div>
    <div class="arc" data-arc>
      <span class="arc__track"></span>
      <span class="arc__half arc__half--r"><span class="arc__fill" data-arc-r></span></span>
      <span class="arc__half arc__half--l"><span class="arc__fill" data-arc-l></span></span>
      <span class="arc__thick" data-arc-thick></span>
    </div>
    <div class="hand" data-hand><span></span></div>
    <div class="ctr">
      <div class="ctr__ink ctr__ink--l" data-ink="l">${digits('l')}</div>
      <div class="ctr__ink ctr__ink--d" data-ink="d">${digits('d')}</div>
      <div class="ctr__tags">${SCENES.map((s, i) => `<span class="ctr__tag" data-tag="${i}">${String(i + 1).padStart(2, '0')} · ${esc(s.tag.toUpperCase())}</span>`).join('')}</div>
    </div>
  </div>`;
}

export function renderDay() {
  const chips = SCENES.map((s, i) =>
    `<button type="button" class="hchip" data-go="${i}" aria-label="Jump to ${s.time}, ${esc(s.tag)}">${s.time}</button>`).join('');
  return `
<section class="day" id="day" aria-labelledby="day-h">
  <div class="day__intro wrap grid12">
    <div class="day__intro-l">
      <span class="eyebrow">${INTRO.eyebrow}</span>
      <h2 id="day-h" class="h-xl serif">One day with <em class="acc" data-name="name">Zara</em>.<br>04:00 to 23:00.</h2>
    </div>
    <div class="day__intro-r">
      <p class="lede">${INTRO.lede}</p>
      <button type="button" class="mouse-pill" data-play-intro><span class="mouse" aria-hidden="true"><span class="bounce"></span></span><span>${INTRO.pill}</span></button>
    </div>
  </div>
  <div class="day__track">
    <div class="day__stage">
      <div class="day__bg" aria-hidden="true">
        <div class="skies">${SCENES.map((s, i) => `<span class="sky" data-bgsky="${i}" style="background:${s.sky}"></span>`).join('')}</div>
        <span class="stars" data-bgstars style="background:${stars(3, 70, 70)}"></span>
        <span class="glow glow--dawn" data-bgdawn></span>
        <span class="glow glow--dusk" data-bgdusk></span>
        <span class="day__dim" data-dim></span>
      </div>
      <div class="day__bar">
        <span class="day__brand">Broski · one day</span>
        <nav class="hchips" aria-label="Jump to a moment">${chips}</nav>
        <div class="pswitch" role="group" aria-label="Who walks you through the day">
          <button type="button" data-persona-btn="bro" aria-pressed="false">Bro</button><button type="button" data-persona-btn="zara" aria-pressed="true">Zara</button>
        </div>
        <button type="button" class="playbtn" data-play aria-pressed="false"><span class="playbtn__i" aria-hidden="true">▶</span><span class="playbtn__t">Play the day</span></button>
      </div>
      <div class="day__prog" aria-hidden="true"><span data-prog></span></div>
      ${dial()}
      <p class="day__cue" data-cue aria-hidden="true"><span class="bounce">↓</span><span class="cue-d">SCROLL TO MOVE THE CLOCK</span><span class="cue-p">SWIPE UP TO MOVE THE CLOCK</span><span class="bounce cue-d">↓</span></p>
      <div class="scenes">${SCENES.map(sceneHtml).join('')}</div>
      <span class="day__hint" aria-hidden="true">SCROLL ↓ OR PRESS PLAY</span>
    </div>
  </div>
</section>`;
}
