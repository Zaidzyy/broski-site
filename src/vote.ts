// 05 · The vote card. With VOTE_ENDPOINT empty it only shows the thank-you state and sends nothing.
// With an endpoint, it POSTs exactly { choice, email? }. Never the persona, never anything else.
import { VOTE_ENDPOINT } from './config';

export function buildPayload(choice: string, email: string): { choice: string; email?: string } {
  const e = email.trim();
  return e ? { choice, email: e } : { choice };
}

/** Test hook: lets the Playwright suite point the form at a mocked endpoint. */
const endpoint = () => (window as unknown as { __voteEndpoint?: string }).__voteEndpoint ?? VOTE_ENDPOINT;

export function initVote() {
  const form = document.querySelector<HTMLFormElement>('[data-vote]');
  if (!form) return;
  const send = form.querySelector<HTMLButtonElement>('.vote__send')!;
  const err = form.querySelector<HTMLElement>('[data-vote-err]')!;
  const done = document.querySelector<HTMLElement>('[data-vote-done]')!;
  const thanks = done.querySelector<HTMLElement>('[data-vote-thanks]')!;
  const picked = done.querySelector<HTMLElement>('[data-vote-picked]')!;
  const redo = done.querySelector<HTMLButtonElement>('[data-vote-redo]')!;
  const choice = () => form.querySelector<HTMLInputElement>('input[name="choice"]:checked');
  const emailIn = form.elements.namedItem('email') as HTMLInputElement;
  const fail = (msg: string, field = false) => {
    err.textContent = msg;
    err.hidden = false;
    if (field) { emailIn.setAttribute('aria-invalid', 'true'); emailIn.focus(); }
  };

  form.addEventListener('change', () => { send.disabled = !choice(); });
  send.disabled = !choice();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const c = choice();
    if (!c) return;
    const email = emailIn.value;
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      fail('That email looks off. Fix it, or leave it empty.', true);
      return;
    }
    err.hidden = true;
    emailIn.removeAttribute('aria-invalid');
    const url = endpoint();
    if (url) {
      send.disabled = true;
      send.textContent = 'Counting…';
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(buildPayload(c.value, email)),
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
        });
        if (!res.ok) throw new Error(String(res.status));
      } catch {
        fail('Couldn’t send that. Try again in a moment.');
        send.disabled = false;
        send.textContent = 'Count me in';
        return;
      }
      send.textContent = 'Count me in';
    }
    picked.textContent = c.closest('label')!.querySelector('b')!.textContent;
    form.hidden = true;
    done.hidden = false;
    thanks.focus();
  });

  redo.addEventListener('click', () => {
    done.hidden = true;
    form.hidden = false;
    send.disabled = !choice();
    (choice() ?? form.querySelector<HTMLInputElement>('input[name="choice"]'))!.focus();
  });
}
