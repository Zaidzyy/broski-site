import { defineConfig, type Plugin } from 'vite';
import { renderPage } from './src/render/page';
import { BASE_PATH, SITE_URL, VOTE_ENDPOINT } from './src/config';

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
          "script-src 'self'",
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
      html.source = out;
    },
  };
}

export default defineConfig({
  base,
  plugins: [page(), inlineCss()],
  build: { target: 'es2020', assetsInlineLimit: 0, cssCodeSplit: false },
  preview: { port: 4173 },
});
