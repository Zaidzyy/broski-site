// Section 03: the 36 features in six groups, exactly as in the mockup.
export interface FeatureGroup { g: string; items: { t: string; d: string }[] }

export const GROUPS: FeatureGroup[] = [
  { g: 'Track', items: [
    { t: 'Habits with scars', d: 'A frozen day stays visible in the grid' },
    { t: '66-day counter', d: 'Each habit counts towards automatic' },
    { t: 'Tasks carry over', d: 'At 04:00, and missed days are counted' },
    { t: 'One-sentence logging', d: 'Water, sleep, weight and food, any order' },
    { t: 'Screen time', d: 'Banking and private windows never logged' },
    { t: 'Calendar', d: 'Reads both calendars, can add events' },
  ] },
  { g: 'Train', items: [
    { t: 'Workout sync', d: 'Pulls the session when you say you are done' },
    { t: 'Overload checks', d: 'Top of range, stalls, too many drop sets' },
    { t: 'Machine levels', d: 'Stack pins never mixed into kg' },
    { t: 'Bodyweight pace', d: 'Seven-day average against a weekly target' },
    { t: 'Split aware', d: 'Knows which day is next' },
    { t: 'Deload weeks', d: 'Counted and announced' },
  ] },
  { g: 'Work', items: [
    { t: 'Job radar', d: 'Ten countries, several boards, scored first' },
    { t: 'Pipeline', d: 'Applied to offer. It never applies for you' },
    { t: 'AI brief', d: 'Five sourced items a day, at most' },
    { t: 'Gap check', d: 'Weekly, against real job posts' },
    { t: 'Snippets', d: 'Saved prompts returned word for word' },
    { t: 'Notes canvas', d: 'Sticky notes from the app, voice or phone' },
  ] },
  { g: 'Learn', items: [
    { t: 'Arabic', d: 'Notes, flashcards, spaced repetition' },
    { t: 'Trading academy', d: '108 lessons, drills graded by rules' },
    { t: 'Paper first', d: 'Graduation gates in code. It never trades' },
    { t: 'Book citations', d: 'Cites the page, or says it is not covered' },
    { t: 'Glossary', d: '2,549 terms, searchable' },
    { t: 'Weekly homework', d: 'One focus rule from your weakest skill' },
  ] },
  { g: 'Brain', items: [
    { t: 'Remembers you', d: 'Imports your claude.ai and ChatGPT history' },
    { t: 'Secrets scrubbed', d: 'Before anything is read' },
    { t: 'Correct me', d: 'Shows what it knows. You approve each fact' },
    { t: 'Weekly review', d: 'Patterns and what needs attention' },
    { t: 'Your words', d: 'Quoted exactly, never rewritten' },
    { t: 'Shared memory', d: 'Other AI apps can ask it. Off by default' },
  ] },
  { g: 'Reach', items: [
    { t: 'The bubble', d: 'Over any app, never over fullscreen' },
    { t: 'Telegram', d: '/today, /jobs, /gym, quick buttons, voice notes' },
    { t: 'Two voices', d: 'Wake word and live mode you can interrupt' },
    { t: 'Laptop control', d: 'Apps, links, music, volume' },
    { t: 'Email', d: 'Reads and drafts. Sends only after a yes' },
    { t: 'Quiet and focus', d: 'Respects Do Not Disturb, laptop or phone' },
  ] },
];

/** Learn is open first. */
export const DEFAULT_GROUP = 3;
