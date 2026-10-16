// Section 02, "One day with Zara": every scene's copy and sample data, taken from the
// mockups (Mix.dc.html / Day.dc.html). All of it is invented. Nothing here is real data.

export type Persona = 'bro' | 'zara';
export type Line = Record<Persona, string>;

export interface Scene {
  id: string;
  time: string;
  /** Hours after 04:00, so the dial angle is hours * 15deg. */
  hours: number;
  tag: string;
  title: string;
  body: string;
  line: Line;
  /** Sky inside the dial while this scene holds. */
  sky: string;
  /** The dial digits go dark on bright skies. */
  darkInk: boolean;
}

const h = (t: string) => {
  const [hh, mm] = t.split(':').map(Number);
  return (hh - 4 + 24) % 24 + mm / 60;
};

const scene = (time: string, tag: string, title: string, body: string, line: Line, sky: string, darkInk: boolean): Scene => ({
  id: 's' + time.replace(':', ''), time, hours: h(time), tag, title, body, line, sky, darkInk,
});

/** Bro's dusk sky and Zara's are tinted by the persona. */
export const DUSK = { bro: { glow: '#4F6377', sky: '#22303D' }, zara: { glow: '#B9687D', sky: '#4A2430' } };

export const SCENES: Scene[] = [
  scene('04:00', 'Day reset', 'Your day starts when the last one ends.',
    'Four to four. Late nights count for the day you actually lived. At 04:00 yesterday closes, unfinished tasks carry over and today is planned around your calendar.',
    { bro: "Yesterday's closed at 68. Legs, two jobs, bed by 00:30. Move.", zara: "Yesterday's filed at 68. Today's ready: legs, two jobs, bed by 00:30." },
    '#05060A', false),
  scene('07:42', 'Body', 'You talk. It logs.',
    'One sentence, three entries. Food works the same way. If the sentence parses, no AI is even called.',
    { bro: "Logged. Six-forty isn't enough. Earlier tonight.", zara: "Got it. Sleep's a bit short, let's fix that tonight." },
    '#2B2533', false),
  scene('08:30', 'Phone', 'Away from the laptop? It follows you.',
    'The same messages land on Telegram. /today, /jobs, /gym, quick buttons and voice notes. Nothing needs the laptop open.',
    { bro: "Three left. Being away doesn't take you off the hook.", zara: "Three things left today. Tap one when it's done." },
    '#6E6A7A', false),
  scene('10:00', 'Brief', 'The morning brief. Two minutes, then go.',
    'What changed in AI that matters to you, with sources. Never more than five items, and some days it just says nothing worth your time.',
    { bro: 'Five things. Read them, then work.', zara: 'Morning. Five things worth knowing, two minutes.' },
    '#C7B9B0', true),
  scene('11:15', 'Mind', 'Ten minutes, between tasks.',
    'Arabic notes and flashcards in small pieces. Spaced repetition decides what comes back.',
    { bro: 'Ten minutes. One word. Say it.', zara: "Quick one before your next task. What's this word?" },
    '#A8BACB', true),
  scene('12:30', 'Trading', 'A trading coach that never trades.',
    '108 lessons built from your own books, drills graded by rules, and paper trades until the numbers say you are ready. Exchange keys are read-only.',
    { bro: '64 of 100 paper trades. Not yet. Do the drill.', zara: 'Clean process on that one. 36 paper trades to go.' },
    '#CFDDE8', true),
  scene('14:03', 'Work', 'A job lands. It already read it.',
    "Ten countries, several sources, scored against your skills before you see it. A weekly check shows which skills the market wants that you don't have yet.",
    { bro: 'Kestrel fits. 91. Read it before the day eats it.', zara: 'This one fits you, 91. Want me to open it?' },
    '#EDE4D3', true),
  scene('15:20', 'Inbox', 'The inbox and the calendar talk to each other.',
    'It reads the email, checks your week, drafts the reply and the event. Email text is treated as data, never as instructions. Nothing goes out until you say yes.',
    { bro: "Thursday 15:00 is free. Draft's ready. Say yes and it goes.", zara: "Thursday works, you're free until the gym. Want me to send it?" },
    '#E6D3B3', true),
  scene('16:40', 'Call-out', 'It notices. Then it says something.',
    'A bubble floats over whatever you are doing. Excuses get answered with words you wrote yourself on a good day.',
    { bro: 'Two rest days. Plan says never two. Legs today. Go now, or say the excuse out loud so we can both hear it.', zara: 'Two rest days in a row, and your plan says never two. Legs and side delts are next. Low on energy? The short version is enough today.' },
    '#D79A62', true),
  scene('19:10', 'Train', 'The workout reads itself.',
    'Finish the session and it pulls the sets, then checks them against your plan: top of range, stalls, missed legs, deload week.',
    { bro: 'Leg press topped out. Add a plate Thursday. RDL stalled three times: drop ten percent.', zara: 'Nice session. Leg press is ready for a plate. RDL has stalled, try ten percent lighter.' },
    '#B7735E', true),
  scene('21:30', 'Laptop', 'Talk to the laptop. It does things.',
    "Wake word, local voice, a live mode you can interrupt. Apps, links, music, volume and quiet hours. Anything that can't be undone asks first.",
    { bro: 'Set. Two hours. Phone down.', zara: 'All set. Two quiet hours, go.' },
    'var(--dusk-sky)', false),
  scene('23:00', 'Score', 'The day gets an honest score.',
    'Not a streak to protect. A number for what happened, habits with their scars showing, and one line about tomorrow.',
    { bro: '72. Better than Monday. Same again tomorrow, earlier to bed.', zara: '72, better than last Monday. Proud of today. Bed early?' },
    '#040406', false),
];

export const INTRO = {
  eyebrow: '02 · The day',
  lede: 'Twelve moments from an ordinary day. Every one of them is something Broski does on its own. Sample data only.',
  pill: 'Scroll to live it · or press ▶ Play',
};

export const SCORE = { label: 'DAY SCORE', value: 72, note: 'Better than last Monday' };

// ---- widget data, scene by scene ----

export const RECEIPT = {
  yesterday: '68 / 100',
  closed: '03:59',
  today: ['Legs + side delts', '2 jobs to read', '10 min Arabic', 'Bed by 00:30'],
};

export const BODY = {
  sentence: 'water 500, slept 6h40, weight 70.4',
  stats: [
    { k: 'WATER', v: '0.5 / 4 L', n: '+500 ml just now', tone: 'muted' },
    { k: 'SLEEP', v: '6h40', n: '1h50 under target', tone: 'warn' },
    { k: 'WEIGHT', v: '70.4 kg', n: '+0.2 this week', tone: 'good' },
  ],
  parsed: 'PARSED LOCALLY · 0 AI CALLS · 3 ENTRIES',
  food: { said: '“two eggs, toast, coffee”', est: '≈ 420 kcal · 26 g protein', tag: 'ESTIMATED' },
};

export const PHONE = {
  title: 'Broski',
  sub: 'bot · your chat only',
  today: { head: 'Today · 3 left', items: ['Gym, legs at 18:30', 'Read 2 jobs', '10 min Arabic'] },
  voice: '0:04',
  logged: 'Logged: water 500 ml. 1.5 of 4 L.',
  buttons: ['+250 ml', 'Gym done', 'Note', 'Quiet 1 h'],
  commands: ['/TODAY', '/PLAN', '/JOBS', '/GYM', '/TRADING', '/NOTE', '/FOCUS', '/QUIET'],
};

export const BRIEF = {
  right: 'ALSO ON YOUR PHONE',
  chips: [
    { t: '13:00 · CALL WITH RECRUITER', tone: 'acc' },
    { t: '18:30 · GYM, LEGS', tone: 'sand' },
    { t: '2 TASKS CARRIED OVER', tone: 'warn' },
  ],
  items: [
    { t: 'Agent SDK release notes: one change touches a tool you use', src: 'CHANGELOG' },
    { t: 'Three AI-engineer roles in Dubai now ask for MCP', src: 'JOB BOARDS' },
    { t: 'A workflow tool you use shipped a new node', src: 'RELEASE NOTES' },
    { t: 'Gap check: evals keep showing up in job posts. Task added.', src: 'WEEKLY GAP CHECK' },
  ],
};

export const MIND = {
  word: 'كتاب',
  translit: 'kitāb',
  meaning: 'book',
  card: 'ARABIC · CARD 3 OF 8',
  back: 'GOT IT · BACK IN 3 DAYS',
  chips: ['ARABIC · 10 MIN', '148 NOTES · QUICK-ADD BY VOICE'],
};

export const TRADING = {
  head: 'ACADEMY · REPLAY DRILL 12',
  right: 'HISTORICAL CHART · PAPER',
  grades: [
    { t: 'PLAN ✓', tone: 'good' },
    { t: 'STOP AT INVALIDATION ✓', tone: 'good' },
    { t: '1% RISK ✓', tone: 'good' },
    { t: '+2.1 R', tone: 'acc' },
  ],
  gradeNote: 'Graded on process, never on whether price went up.',
  paper: { label: 'Paper trades before tiny real size', value: '64 / 100', pct: 64 },
  ready: { label: 'Ready?', value: 'NOT YET' },
  never: 'BROSKI NEVER PLACES A TRADE · READ-ONLY KEYS · NO PRICE CALLS',
};

export const WORK = {
  right: 'SCORED BEFORE YOU SAW THEM',
  jobs: [
    { role: 'AI Security Engineer', where: 'Kestrel Labs · Abu Dhabi', fit: 91, top: true },
    { role: 'GenAI Engineer, Agents', where: 'Northwind · Remote (UK)', fit: 68, top: false },
    { role: 'SOC Automation Engineer', where: 'Halcyon Systems · Dubai', fit: 64, top: false },
  ],
};

export const INBOX = {
  from: 'Recruiting · Kestrel Labs',
  at: '15:18',
  subject: 'Interview: does Thursday 15:00 work?',
  preview: 'Would Thursday at 15:00 Dubai time work for a 45-minute call with the team?',
  week: [
    { d: 'MON', ev: ['18:30', 'Gym'] },
    { d: 'TUE' },
    { d: 'WED', ev: ['18:30', 'Gym'] },
    { d: 'THU', slot: ['15:00', 'Interview'], ev: ['18:30', 'Gym'] },
    { d: 'FRI' },
    { d: 'SAT', ev: ['18:30', 'Gym'] },
    { d: 'SUN' },
  ] as { d: string; ev?: string[]; slot?: string[] }[],
  draft: 'Thursday at 15:00 works for me. Looking forward to meeting the team.',
  actions: ['Send + add event', 'Edit', 'Not now'],
};

export const CALLOUT = {
  file: 'cover-letter-draft.md',
  wordsLabel: 'IF YOU SAY “LATER”: YOUR WORDS, WRITTEN ON A GOOD DAY',
  words: 'Tired is a feeling, not a plan.',
  actions: ['Going now', 'Short version', 'Later'],
  logged: '✓ GOING NOW · LOGGED 16:41',
};

export const TRAIN = {
  head: 'LEGS · DAY 4 · SYNCED 19:08',
  right: 'FROM YOUR WORKOUT APP',
  sets: [
    { ex: 'Leg press', verdict: 'TOP OF RANGE → ADD A PLATE', tone: 'good', sets: '3 × 12 · level 14' },
    { ex: 'Romanian deadlift', verdict: 'STALLED 3 SESSIONS → TRY −10%', tone: 'warn', sets: '3 × 8 · 80 kg' },
    { ex: 'Lying leg curl', verdict: 'ON PLAN', tone: 'muted', sets: '3 × 10 · level 9' },
    { ex: 'Standing calf raise', verdict: 'MISSED', tone: 'bad', sets: 'not logged' },
  ],
  week: [
    { t: 'LEGS 2 / 2 THIS WEEK ✓', tone: 'good' },
    { t: 'WEEK 6 OF 7 · DELOAD NEXT', tone: 'sand' },
  ],
};

export const LAPTOP = {
  actions: [
    { t: 'Opened VS Code', k: 'APP' },
    { t: 'Opened your job tracker', k: 'LINK' },
    { t: 'Focus mix on Spotify, volume 30', k: 'MUSIC' },
    { t: 'Quiet for 2 hours, laptop and phone', k: 'QUIET' },
  ],
  note: 'VOICE RUNS ON THIS LAPTOP · SEND, DELETE, PAY ALWAYS ASK',
};

/** 14 days per habit: x = done, . = missed, s = a frozen day (the scar). */
export const HABITS = {
  label: 'HABITS · LAST 14 DAYS · A FROZEN DAY STAYS VISIBLE',
  rows: [
    { k: 'WATER 4 L', days: 'xxxxxxxxxxxxxx', note: '19 d' },
    { k: 'SLEEP BY 00:30', days: '..xxx.xxxxxxxx', note: '8 d' },
    { k: 'READ 20 MIN', days: 'xxxxxxxsxxxxxx', note: '12 d · 1 scar', warn: true },
    { k: 'GYM 5× / WEEK', days: 'xx.xxx.xxx.xxx', note: 'on plan' },
    { k: 'NO SUGAR', days: 'xxxxxxxxx..xxx', note: '3 d' },
  ],
};
