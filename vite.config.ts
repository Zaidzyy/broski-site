import { defineConfig, type Plugin } from 'vite';
import { renderPage } from './src/render/page';
import { BASE_PATH, SITE_URL, VOTE_ENDPOINT } from './src/config';
import { INTRO_GATE_HASH } from './src/render/intro-gate';

const base = process.env.BASE_PATH || BASE_PATH;

/** Injects the rendered page and, in builds, the Content-Security-Policy. */
function page(): Plugin {
  let isBuild = false;
  return {
    name: 'broski-page',
    configResolved(c) { isBuild = c.command === 'build'; },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const vote = VOTE_ENDPOINT ? ' ' + new URL(VOTE_ENDPOINT).origin : '';
        const csp = [
          "default-src 'self'",
          `script-src 'self' ${INTRO_GATE_HASH}`, // plus the intro gate, inlined after the hero
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self'",
          `connect-src 'self'${vote}`,
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'none'",
          "manifest-src 'self'",
        ].join('; ');
        return html
          .replace('<!--PAGE-->', renderPage())
          .replace('<!--CSP-->', isBuild ? `<meta http-equiv="Content-Security-Policy" content="${csp}">` : '')
          .replaceAll('%SITE_URL%', SITE_URL);
      },
    },
  };
}

/** Inlines the one stylesheet into the HTML, so first paint doesn't wait for a CSS request. */
function inlineCss(): Plugin {
  return {
    name: 'broski-inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = Object.values(bundle).find((f) => f.fileName === 'index.html');
      if (!html || html.type !== 'asset') return;
      let out = String(html.source);
      for (const f of Object.values(bundle)) {
        if (f.type !== 'asset' || !f.fileName.endsWith('.css')) continue;
        const tag = new RegExp(`<link rel="stylesheet"[^>]*href="[^"]*${f.fileName.replace(/[.]/g, '\\.')}"[^>]*>`);
        if (!tag.test(out)) continue;
        out = out.replace(tag, () => `<style>${String(f.source)}</style>`);
        delete bundle[f.fileName];
      }
      html.source = preload(out, bundle);
    },
  };
}

/** Preloads the BROSKI letters' font and the two hero pictures (the same srcset and sizes the page uses), so the
 *  intro, which waits for them (src/intro.ts), can start as early as possible on a first visit. */
function preload(html: string, bundle: Record<string, { fileName: string }>) {
  const font = Object.values(bundle).find((f) => /^assets\/anton-latin-400-normal-.*\.woff2$/.test(f.fileName));
  if (!font) throw new Error('preload: the Anton woff2 is missing from the bundle');
  const links = [`<link rel="preload" href="${base}${font.fileName}" as="font" type="font/woff2" crossorigin>`];
  for (const who of ['bro', 'zara']) {
    const m = html.match(new RegExp(`<picture class="pic__main"><source type="image/avif" srcset="([^"]*${who}-hero-[^"]*)" sizes="([^"]*)">`));
    if (!m) throw new Error(`preload: the ${who} hero picture was not found`);
    links.push(`<link rel="preload" as="image" type="image/avif" imagesrcset="${m[1]}" imagesizes="${m[2]}" fetchpriority="high">`);
  }
  return html.replace('<title>', `${links.join('\n')}\n<title>`);
}

export default defineConfig({
  base,
  plugins: [page(), inlineCss()],
  build: { target: 'es2020', assetsInlineLimit: 0, cssCodeSplit: false },
  preview: { port: 4173 },
});
