# broski-site build prompt v2

Build log for the Broski landing page + public README (prompt dated 17 Oct 2026).
Assumptions are numbered B1, B2, … and the safer choice was taken each time.

## Setup

- Design files copied once from the Broski seed folder into `design/` (git-ignored) and the six persona PNGs into `assets-src/` (git-ignored). The Broski folder was not read or touched after that.
- Vite 8 + TypeScript, vanilla (no UI framework). GSAP 3.15 with ScrollTrigger and ScrollToPlugin.
- Fonts self-hosted through `@fontsource` (latin subsets only): Anton 400, Geist Sans 400/500/600, Geist Mono 300/400/500, Instrument Serif 400 + italic. Noto Naskh Arabic 500 is subset to the four letters of كتاب with `subset-font` (56 KB → 2 KB): `scripts/subset-arabic.mjs`.
- Images: `scripts/images.mjs` bakes the mockup's CSS filters into the files (Bro: grayscale + contrast; Zara: light sepia + saturation; both dimmed versions: grayscale at 35 % brightness) and writes AVIF + WebP at 820 and 1254 px. Bubble avatars are 96 px face crops.

## Assumptions

- **B1. Browser for tests.** Playwright 1.64 wants Chromium build 1248, which isn't on this machine, and the prompt allows no network use beyond `npm install`. The runs use the Chromium already in the local Playwright cache (build 1243) through `PW_CHROMIUM` / `CHROME_PATH`; nothing is downloaded. In CI or on another machine, `npx playwright install chromium` works as usual.
- **B2. Pinning = CSS sticky + ScrollTrigger.** The stage is `position: sticky` inside a tall track; ScrollTrigger reads progress (scrub 0.5 s). Sticky avoids pin-spacer jumps on mobile address-bar resizes and works the same in Chrome, Firefox and Safari.
- **B3. Pin length.** 12 scenes + 0.6 of a scene for the ending = 12.6 units × 95 svh ≈ 12 screens of scroll (mockup: 11 400 px for 900 px ≈ 11.7 screens). One scene ≈ 0.95 screen.
- **B4. Widgets animate once, on entry (time-based), not scrubbed.** The mockup scrubs them with scroll; the brief says "animate once on entry". Scenes swap with a 0.35/0.55 s cross-fade when the clock crosses a scene boundary. The dial, the sky, the sun/moon, the hour highlight and the ending stay scroll-bound.
- **B5. Transform/opacity only in the day.** The mockup animated `clip-path`, `filter`, colours and conic angles. Rebuilt with transforms and opacity: the sky is twelve stacked colour layers cross-faded; the arc fill is two rotating half-rings (classic clip trick); the dark/light digits are two layers cross-faded; the wipe/print reveals are a counter-translated pair inside `overflow: hidden`; the progress line is `scaleX`.
- **B6. Hero transitions.** Outside the day's motion budget, the hero keeps the mockup's `clip-path` slide (it only runs on a pick or a peek). The slash and the pane edge share one angle on every screen size (12.6° desktop, 6° phone) because the edge is computed from the hero height, not as a percentage of width. The dimmed faces are baked images cross-faded with opacity, not a live `filter`, and they load after the page settles.
- **B7. AA on every sky.** `scripts/contrast.mjs` checks each of the 12 sky phases (both personas):
  - The page sky behind the scene text is dimmed per phase (0.58 at night up to 0.79 at noon, instead of a flat 0.58) so accent text, 72 % and 80 % bone text and the hour chips all pass 4.5:1.
  - The dial digits go dark from 10:00 to 19:10 (the mockup kept 19:10 light: 2.8:1, fails). All phases pass 3:1 for large text (lowest: 08:30, 4.15:1).
  - The scene tag under the digits sits on a dark pill (accent on a light sky failed at ~1.9:1).
  - Greys lifted: eyebrow labels `#7A746A` → `#8F887C` (4.2 → 5.5:1), footer `#5E594F` → `#8F887C`, inactive tabs `#3E3A34` → `#6E6860` (large text, 3.5:1), dial minor labels .35 → .62 opacity.
- **B8. Phone widgets.** "Full width" on a phone: each widget is scaled to the full content width (and down further if the scene would overflow the screen), instead of the mockup's fixed 0.6. The body text is dropped on phones, as allowed.
- **B9. Reduced motion (and no JS).** The same HTML renders as twelve still sections; the dial and top bar are hidden; every widget is in its final state; the flash card shows both faces side by side instead of flipped.
- **B10. Vote endpoint.** `VOTE_ENDPOINT = ''` in `src/config.ts`: the button shows the thank-you state locally and sends nothing (tested). When set, it POSTs JSON `{ choice, email? }` with `credentials: 'omit'` and no referrer; the CSP `connect-src` picks up the endpoint's origin at build time. Formspree accepts JSON directly; Tally's public forms don't take a JSON POST, so Formspree is the simpler pick.
- **B11. Choice values** sent are stable ids: `whole-thing`, `trading-coach`, `voice-bubble`.
- **B12. Film.** `FILM_URL = ''`: the film links show a "The film is coming soon" toast and go nowhere. Setting the URL makes them normal links.
- **B13. Bubble avatar crop.** The mockup's crop landed on the hairline; the avatars are cropped around the face instead.
- **B14. README numbers.** `README.md` is generated by `npm run readme` from `docs/README.template.md` + `src/data/facts.json` + `src/data/features.ts`, so it can't drift from the site. The facts were not counted or looked up: they are the values given in the prompt.
- **B15. `*-listening.png`** are spares and are not used.
- **B16. CSP** is a `<meta>` injected at build only (Vite's dev server needs inline scripts). `style-src` allows `'unsafe-inline'` for style attributes (CSS custom properties per element); scripts are `'self'` only.
- **B17. Test hooks.** `window.__day` (scroll positions of each scene) and `window.__voteEndpoint` (point the form at a mocked same-origin URL) exist for the Playwright suite. Neither sends or stores anything.
- **B18. No framework.** The page is static HTML rendered at build time from the data files (`src/render/*`), then enhanced. A framework would add weight without adding anything here.
- **B19. Header on phones.** As in G7, the phone hero header shows only "Broski" and the status; the film and GitHub links are in section 05.

## RAM waits

Browser runs (Playwright, Lighthouse) wait for 4 GB of free RAM: `scripts/ramcheck.mjs`, re-checking every 2 minutes for up to 30 minutes. Every wait is in `docs/ram-waits.log`.
