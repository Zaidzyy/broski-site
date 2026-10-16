// Small helpers shared by the build-time renderers.

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const IMG = './src/assets/img/';

/** A <picture> with AVIF + WebP. `w` lists the widths written by scripts/images.mjs. */
export function picture(name: string, cls: string, alt: string, opts: { w?: number[]; size: number; sizes?: string; lazy?: boolean; high?: boolean }) {
  const ws = opts.w;
  const set = (ext: string) => ws
    ? ws.map((w) => `${IMG}${name}-${w}.${ext} ${w}w`).join(', ')
    : `${IMG}${name}.${ext}`;
  const fallback = ws ? `${IMG}${name}-${ws[0]}.webp` : `${IMG}${name}.webp`;
  const sizes = ws && opts.sizes ? ` sizes="${opts.sizes}"` : '';
  return `<picture class="${cls}"><source type="image/avif" srcset="${set('avif')}"${sizes}><source type="image/webp" srcset="${set('webp')}"${sizes}><img src="${fallback}" alt="${esc(alt)}" width="${opts.size}" height="${opts.size}" decoding="async"${opts.lazy ? ' loading="lazy"' : ''}${opts.high ? ' fetchpriority="high"' : ''}></picture>`;
}

/** Both personas' versions of an image; CSS shows the one that matches the persona. */
export function img(kind: 'avatar', cls: string) {
  if (kind === 'avatar') {
    return ['bro', 'zara'].map((p) => picture(`${p}-avatar`, `${cls} only-${p}`, '', { size: 96, lazy: true })).join('');
  }
  return '';
}
