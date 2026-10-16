// 04 · The gate (L1): two requests flow through; the email waits at the red bar for Yes / No.
export function initGate() {
  const row = document.querySelector<HTMLElement>('.gate__row--send');
  if (!row) return;
  const label = row.querySelector<HTMLElement>('[data-gate-label]')!;
  const yes = row.querySelector<HTMLButtonElement>('[data-gate-yes]')!;
  const no = row.querySelector<HTMLButtonElement>('[data-gate-no]')!;
  const again = row.querySelector<HTMLButtonElement>('[data-gate-again]')!;
  const LABEL = { wait: 'WAITING FOR YOUR YES', yes: '✓ SENT AFTER YOUR YES', no: 'NOT SENT' };

  const setState = (s: keyof typeof LABEL) => {
    row.dataset.gate = s;
    label.textContent = LABEL[s];
    again.hidden = s === 'wait';
    (s === 'wait' ? yes : again).focus({ preventScroll: true });
  };
  yes.addEventListener('click', () => setState('yes'));
  no.addEventListener('click', () => setState('no'));
  again.addEventListener('click', () => setState('wait'));
}
