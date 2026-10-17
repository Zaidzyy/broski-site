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
- **B9. The still day (no JS, short windows).** The same HTML renders as twelve still sections; the dial and top bar are hidden; every widget is in its final state; the flash card shows both faces side by side instead of flipped.
- **B10. Vote endpoint.** `VOTE_ENDPOINT = ''` in `src/config.ts`: the button shows the thank-you state locally and sends nothing (tested). When set, it POSTs JSON `{ choice, email? }` with `credentials: 'omit'` and no referrer; the CSP `connect-src` picks up the endpoint's origin at build time. Formspree accepts JSON directly; Tally's public forms don't take a JSON POST, so Formspree is the simpler pick.
- **B11. Choice values** sent are stable ids: `whole-thing`, `trading-coach`, `voice-bubble`.
- **B12. Film.** `FILM_URL = ''`: the film links show a "The film is coming soon" toast and go nowhere. Setting the URL makes them normal links.
- **B13. Bubble avatar crop.** The mockup's crop landed on the hairline; the avatars are cropped around the face instead.
- **B14. README numbers.** `README.md` is generated by `npm run readme` from `docs/README.template.md` + `src/data/facts.json` + `src/data/features.ts`, so it can't drift from the site. The facts were not counted or looked up: they are the final values Zaid gave after the build. The lesson and glossary counts in `day.ts` and `features.ts` read from `facts.json` too.
- **B15. `*-listening.png`** are spares and are not used.
- **B16. CSP** is a `<meta>` injected at build only (Vite's dev server needs inline scripts). `style-src` allows `'unsafe-inline'` for style attributes (CSS custom properties per element); scripts are `'self'` only.
- **B17. Test hooks.** `window.__day` (scroll positions of each scene) and `window.__voteEndpoint` (point the form at a mocked same-origin URL) exist for the Playwright suite. Neither sends or stores anything.
- **B18. No framework.** The page is static HTML rendered at build time from the data files (`src/render/*`), then enhanced. A framework would add weight without adding anything here.
- **B19. Header on phones.** As in G7, the phone hero header shows only the Broski lockup and the status; the film and GitHub links are in section 05.

- **B20. Day hint copy.** The mockup's "SCROLL INSIDE ↓ OR PRESS PLAY" described its inner scroll box; the pinned page says "SCROLL ↓ OR PRESS PLAY".
- **B21. Short windows get the still day.** Under 520 px of height (landscape phones, 200 %+ browser zoom) the day uses the still layout instead of shrinking the pinned stage (WCAG 1.4.4 / 1.4.10). Zooming into that range reloads into the still layout; a phone keyboard opening does not (width unchanged).
- **B22. Intro timing tightened by ~0.3 s** (faces wipe at 0.95 / 1.1 s instead of 1.2 / 1.35 s; header and captions fade at 1.9 s instead of 2.2 s). Same order: letters, slash, faces, header.
- **B23. CSS inlined** into the HTML at build (`vite.config.ts`, `broski-inline-css`) so first paint doesn't wait for a stylesheet request (mobile Lighthouse FCP 2.6 s → 2.4 s).
- **B24. Bounce arrows** run 6 cycles (~10 s) instead of forever. The section 04 flows and the day's waveforms only run while on screen.
- **B25. Phone hero hint** ("TAP TO CHOOSE" / "NOW SCROLL…") is hidden on phones, as in G7.
- **B26. No-JS fallbacks.** All six feature groups render visible and JS turns them into tabs; the film links point to the README's film slot when JS is off.
- **B27. Motion is always on (Zaid's call).** The OS reduced-motion setting no longer changes the page: many Windows laptops report "reduce" only because Animation effects is off. Every `prefers-reduced-motion` rule is gone from the CSS and JS (there was no GSAP `matchMedia`), so every visitor with JavaScript gets the full animated page: the hero intro, the pinned day, widget entries, loops and reveals. The still layout stays for no JavaScript and for windows under 520 px tall (B21). There is no motion toggle.
- **B28. README images.** The hero (linked to the live site), a GIF of the day and a 2×2 grid of existing screenshots. `scripts/daygif.mjs` records the GIF (desktop, 12 fps, 11 s, 960 px, ffmpeg palettegen/paletteuse, 2.9 MB). It drives the page clock by hand, so frames are evenly spaced however slow the screenshots are. The README's images add up to 3.2 MB; only the GIF is new.
- **B29. Section 03: hover to peek, click to choose** (like the hero).
  - With a real hover pointer (`(hover: hover) and (pointer: fine)`, mouse events only), resting on a word for ~120 ms previews its group: the word lifts 4 px to the persona tint, the chosen word steps back to grey, and the ring's lit arc, the centre label and the six cards switch to it.
  - Leaving the tab row returns to the chosen group. A click (or the keyboard, unchanged) selects and locks it. A peek never changes `aria-selected`.
  - Before this, a click swapped the cards with no transition, so a click now cross-fades in 0.3 s and a peek in 0.22 s. The panels are stacked in one grid cell (with JS only) so two groups can cross-fade.
  - Each change kills the running fades and continues from the current opacity, so a fast sweep doesn't stack animations. A pass shorter than the intent delay changes nothing.
  - A hint under the row, "HOVER TO PEEK · CLICK TO CHOOSE", in the hero hint's style, only on hover devices with JS. Touch stays tap-only.
- **B30. The logo** (Zaid's brand files, put in `assets-src/brand/`; the Broski folder wasn't read).
  - `scripts/icons.mjs` copies the L2 lockups (dark and light) and the icon tile into `src/assets/brand/`, so the repo doesn't depend on the git-ignored `assets-src/`.
  - **Header:** the "BROSKI" text is replaced by the L2 lockup (dark), inlined at build time by `src/render/brand.ts`. It's 30 px tall on desktop and 26 px on phones, a link to `#top` named "Broski, back to top", and its colours are fixed (no persona tint).
  - **Hover:** with a fine pointer, on hover or keyboard focus, both rose brows (the face's and the i-dot) rotate −8° about their left end in 180 ms ease-out, and back on leave.
  - **Favicon:** the small-size icon (`broski-icon-tray-thick.svg`, heavier strokes made for 16–32 px), published as `favicon-v2.svg`. The new name means browsers that cached the old favicon fetch it fresh. A 32 px PNG fallback (`favicon-32.png`, `sizes="32x32"`) is rendered from it. The old `favicon.svg` (the "B/" mark) is removed.
  - **Touch icon:** the 180 px `apple-touch-icon.png` is still rendered from the icon tile, because it's shown large. It's flattened onto the tile colour `#15171B` because iOS fills transparent areas with black.
  - **OG image:** the lockup sits in the top-left corner, where the header brand sits on the page, at 40 px, clear of the big word. The OG alt text says so.
  - **README:** the lockup is at the top of the centred header block, 60 px tall, alt "Broski". It's a `<picture>`: the dark lockup by default, and the light one (dark wordmark) when GitHub is in light mode, because the dark lockup's light wordmark would vanish on a white page.

## Follow-up fixes (after Claude's screenshot review)

1. **Phone hero:** Zara's file is cropped flat through her hair, so on phones the top of her picture fades out with an eased mask (transparent to 6 %, opaque by 34 % of the image height), like Bro's hair thins out. Checked at 360, 390 and 430 px; tested at all three.
2. **03 bento icons:** the shared group glyph is replaced by the feature's own mark. Each card has a 36-tick ring drawn in code (an inline SVG with two paths) with its tick lit in the persona colour, at the same angle as its mark on the big ring. No icon library, no emoji. Tested: 36 different marks.
3. **Phone day:** the scene dots moved from the edge of the sky window onto the outer track (5 px, centred on the arc band). Tested: every dot clears the window.
4. **README:** the film line appears once, with an `<a id="film">` anchor; "Watch the film" and the site's no-JS film links point to `#film`.

## RAM waits

Browser runs (Playwright, Lighthouse) wait for 4 GB of free RAM: `scripts/ramcheck.mjs`, re-checking every 2 minutes for up to 30 minutes. Every wait is in `docs/ram-waits.log`. The first check waited twice (2.67 GB, 2.84 GB free); after that Zaid lifted the rule, and runs continued one browser at a time, each closed when done.

## Reviews

Two review passes ran after the first full build (separate reviewers).

**Fidelity (11 findings, all fixed):**
1. The section 03 `.ring` class also hit the dial's tick rings, so they were the wrong size and off-centre. Renamed to `.fring`; covered by a test.
2. A late `.micro { color: inherit }` turned the accent and muted micro labels bone. Removed; covered by a test.
3. Sections 02–05 were 48 px narrower on each side (border-box `.wrap`). Now 1440 px.
4. Cards, the receipt and the bubble were narrower than the content-box mockup (604 / 408 / 442 px). Fixed.
5. The caption of the face that wasn't picked didn't dim (`.fade` forwards held opacity 1). The dim now sits on the children; covered by a test.
6. The desktop dial was 585 px instead of 620 and shifted left. Fixed.
7. "Better than last Monday" was missing on the phone ending. Restored.
8. The ending's ring showed two tones. The thin track now fades out.
9. The phone hero sheet had an extra hint row. Hidden (B25).
10. Day bar copy: the hint was logged as B20, and the phone brand now reads "BROSKI".
11. Hero header and pill line height. Fixed.

**Public content, privacy, accessibility (15 findings):**
- **Fixed:**
  - 08:30 command chips on the sky were 3.77:1; now 5.25:1, and `contrast.mjs` covers on-sky greys.
  - Zoom and short windows (B21), with a test.
  - Email field border contrast.
  - The email error is tied to the field (`aria-invalid` + `aria-describedby`), with a test.
  - The hour-chip focus ring was clipped.
  - Bounce loops are capped (B24).
  - The film link without JS (B26).
  - Feature panels without JS (B26), with a test.
  - Hero controls visible while focused during the intro, with a test.
  - README privacy wording names the vote POST.
  - A quoted chat line in `docs/ram-waits.log` was reworded.
- **Done after the build:**
  - **Commit author email.** Switched to the GitHub noreply address (`86546939+Zaidzyy@users.noreply.github.com`, repo-local config) and every commit re-authored to it before the first push.
- **Left for Zaid (needs his call):**
  - **The vote with an empty endpoint** shows "Counted" while sending nothing. The prompt specifies exactly this; set `VOTE_ENDPOINT` before sharing the page.
  - **"Measured, not claimed".** The facts are Zaid's final values (17 Oct), not counted by this build.
  - **Test hooks** `window.__day` / `window.__voteEndpoint` stay in the build because the suite runs against the production build (B17).

## Tests and Lighthouse

- **Playwright:** 46 tests, all passing (Chromium build 1243, 1440×900 and 390×844). The old reduced-motion test ("twelve still sections") was replaced by three tests that emulate reduced motion and check that the page still animates: the hero intro plays; the day is pinned and the 12:30 widgets animate in; on a phone the day is still pinned. The still layout is covered by the short-window and no-JS tests. Four tests cover the 03 peek (B29): hover previews and leaving restores, a fast sweep doesn't stack or switch early, touch has no preview or hint, and the keyboard is unchanged. Four cover the logo (B30): the lockup link and its name, fixed colours, no console errors; the brow lift on hover; 26 px on phones; the favicon and the 180 px touch icon resolve to the new tile.
- **Lighthouse** (`npm run lighthouse`, local preview build):

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Desktop | 99 | 100 | 100 | 100 |
| Mobile (slow 4G, 4× CPU) | 88–91 | 100 | 100 | 100 |

After the motion change (B27), three runs. Lighthouse doesn't emulate reduced motion, so its code path is unchanged. The previous commit, scored the same way in the same session, gave 100 / 90, so the differences in Performance are run-to-run noise on this machine. The first build scored 100 / 92.

Mobile LCP is the hero image at 2.9 s on simulated slow 4G. The faces are revealed by the designed intro wipe, and the AVIF loads at high priority. FCP is 2.4 s.
