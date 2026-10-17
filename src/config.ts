// Site settings. Zaid edits this file; nothing here is secret.

/** Where the vote card POSTs `{ choice, email?, _gotcha }` (a Formspree form, called with our own fetch).
 *  Empty = nothing is ever sent. Its origin is added to the CSP's connect-src at build time (vite.config.ts). */
export const VOTE_ENDPOINT = 'https://formspree.io/f/mzedopnj';

/** This repo on GitHub (the README is the GitHub button's target). */
export const GITHUB_URL = 'https://github.com/Zaidzyy/broski-site';

/** Zaid's public GitHub profile. */
export const PROFILE_URL = 'https://github.com/Zaidzyy';

/** The launch film. Empty = the film links show a "coming soon" state. */
export const FILM_URL = '';

/** Where the site is served from, used for absolute OG/canonical URLs. */
export const SITE_URL = 'https://zaidzyy.github.io/broski-site/';

/** Base path for GitHub Pages. Overridden by the BASE_PATH env var at build time. */
export const BASE_PATH = '/broski-site/';

export const README_ARCH_URL = `${GITHUB_URL}#how-its-built`;
export const README_NUMBERS_URL = `${GITHUB_URL}#measured-not-claimed`;
