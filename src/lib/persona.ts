// The one piece of shared state: who is on. 'both' until someone picks in the hero.
// Everything after the hero speaks as Zara while it is still 'both'.
import { SCENES, type Persona } from '../data/day';

export type Who = 'both' | Persona;
type Listener = (who: Who) => void;

let who: Who = 'both';
const listeners: Listener[] = [];

export const getWho = () => who;
export const speaker = (): Persona => (who === 'bro' ? 'bro' : 'zara');

export function onWho(fn: Listener) { listeners.push(fn); }

export function setWho(next: Who) {
  if (next === who) return;
  who = next;
  document.body.dataset.persona = who;
  const p = speaker();
  const name = p === 'bro' ? 'Bro' : 'Zara';
  for (const el of document.querySelectorAll<HTMLElement>('[data-who]')) {
    el.textContent = el.dataset.who === 'upper' ? name.toUpperCase() : name;
  }
  for (const s of SCENES) {
    for (const el of document.querySelectorAll<HTMLElement>(`[data-line="${s.id}"]`)) {
      const quoted = el.textContent?.startsWith('“');
      el.textContent = quoted ? `“${s.line[p]}”` : s.line[p];
    }
  }
  for (const b of document.querySelectorAll<HTMLElement>('[data-persona-btn]')) {
    b.setAttribute('aria-pressed', String(b.dataset.personaBtn === p));
  }
  listeners.forEach((fn) => fn(who));
}
