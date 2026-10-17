// Section 04: the laptop's live log. Sample lines; the numbers that are facts come from facts.json.
import facts from './facts.json' with { type: 'json' };

export interface LogLine { t: string; good?: boolean }

export const LOG: LogLine[] = [
  { t: 'whisper ✓ 0.42 s' },
  { t: 'kokoro ✓ ready' },
  { t: 'router → tier 0 · 0 tokens' },
  { t: 'gate: send → asks first' },
  { t: `doctor ${facts.doctorChecks}/${facts.doctorChecks} ✓` },
  { t: `voice round trip ${facts.voiceSeconds} s` },
  { t: 'RUNNING LOCALLY · 0 FAIL', good: true },
];
