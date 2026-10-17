# broski-site build prompt v2: report

The Broski landing page (GitHub Pages) and the public README, built from the decided design (`Mix.dc.html`, G6, G7, J1 Day, DayPhone). Details, assumptions B1–B26 and the review results are in [BUILD-LOG.md](BUILD-LOG.md).

## What was built

- **01 Hero (G6 / G7).**
  - The header carries the L2 lockup (Zaid's brand files): a link back to the top, whose two rose brows lift on hover. The favicon, touch icon, OG image and README use the same brand (B30).
  - The intro runs in order: letters rise, the slash grows, the faces wipe in, the header fades. On a first visit it waits, showing only the background and the lockup, until its font and both pictures are ready, or 1.2 s at most, so it plays as smoothly as on a reload (B32).
  - Hover peek (pointer only, ~120 ms intent), click to pick, click again for both.
  - The accent recolours the page: steel for Bro, rose for Zara.
  - On a phone the chooser is a bottom sheet.
  - After the intro it stays alive (B31): the faces breathe out of sync, drift with the cursor (a slow drift on touch), blink every few seconds, and now and then one glances (Bro thinking or laughing, Zara laughing or flirty). The dimmed face only breathes.
- **02 The day (J1, 12 scenes).**
  - A pinned stage (~12 screens of scroll) with the 24-hour dial, the vivid sky inside it, the sun and moon, and a dimmed sky behind.
  - Each scene's widgets animate once on entry.
  - The ending: the window closes, the ticks fall away, the arc shrinks to 72 %, and the 72 appears.
  - Top bar: hour chips, the Bro/Zara switch, ▶ Play (about 25 s, press again to stop) and a progress line.
  - Phone: a small pinned dial, with the scene below at full width.
  - Motion is always on, whatever the OS reduced-motion setting says (Zaid's call, B27). Twelve still sections only without JavaScript or in windows under 520 px tall.
- **03 Everything else.** Six Anton word tabs (an ARIA tablist with arrow keys and Home/End), the 36-mark ring and the bento. Learn is open first. Like the hero: hover to peek (mouse only, ~120 ms intent), click to choose. While it's on screen, one lit tick wanders round the ring; it pauses while the pointer is on a word or a card.
- **04 Under the hood.**
  - Tier cards.
  - The laptop's status line is a tiny live log, a new line every ~2.5 s with a blinking cursor.
  - The live gate: Yes / No / Try again.
  - The laptop drawing with its link-outs.
  - Stack chips.
- **05 Yours?** The "Yet?" heading, the links, and the vote card (a radio group, optional email, "Count me in" disabled until a pick, and a thank-you state).
- **Footer.** The proof line from `facts.json`.
- **README.md.** Generated from `docs/README.template.md` + `src/data/facts.json` + `src/data/features.ts` (`npm run readme`). Images:
  - the hero, linked to the live site;
  - a looping GIF of the day ([docs/media/day.gif](media/day.gif), recorded by `scripts/daygif.mjs`);
  - a 2×2 grid: 12:30, everything else, under the hood, the phone.
- **Deploy.** `.github/workflows/deploy.yml` (written, not run). The base path comes from `src/config.ts` / `BASE_PATH`.

## Screenshots

- **Desktop:**
  - Hero: [both](screens/desktop-01-hero.webp) · [Bro](screens/desktop-01-hero-bro.webp) · [Zara](screens/desktop-01-hero-zara.webp)
  - [Day intro](screens/desktop-02-day-intro.webp)
  - Day scenes 1–12: [01](screens/desktop-day-01.webp) [02](screens/desktop-day-02.webp) [03](screens/desktop-day-03.webp) [04](screens/desktop-day-04.webp) [05](screens/desktop-day-05.webp) [06](screens/desktop-day-06.webp) [07](screens/desktop-day-07.webp) [08](screens/desktop-day-08.webp) [09](screens/desktop-day-09.webp) [10](screens/desktop-day-10.webp) [11](screens/desktop-day-11.webp) [12](screens/desktop-day-12.webp) · [end (72)](screens/desktop-day-13-end.webp)
  - Sections: [03](screens/desktop-03-rest.webp) · [04](screens/desktop-04-hood.webp) · [05](screens/desktop-05-yours.webp) · [footer](screens/desktop-06-footer.webp)
- **Phone (390×844):** the same set with the `phone-` prefix in [screens/](screens/).
- **Without JavaScript:** [the still day](screens/no-js-day.webp)
- **Phone hero at the edge widths:** [360 px](screens/phone-360-01-hero.webp) · [430 px](screens/phone-430-01-hero.webp)

![Hero](screens/desktop-01-hero.webp)
![16:40](screens/desktop-day-09.webp)
![Phone, 04:00](screens/phone-day-01.webp)

## The facts

`src/data/facts.json` holds exactly the final values Zaid gave after the build. Nothing was counted or looked up: 3,207 tests, 0.5 s on-device voice, 0 telemetry, 66 Doctor checks, 109 lessons, 2,549 glossary terms, 2026-10-01 → 2026-10-17, 17 days, 575 commits, 41 Claude Code runs. Every number on the site and in the README is read from that file (the lesson and glossary counts in the day and the bento included), so they can't drift.

## Tests and Lighthouse

- **Playwright:** 64 passing.
  - Load with no console errors and no third-party requests.
  - CSP and meta present; no cookies or storage written.
  - Persona recolouring and hover peek.
  - Every scene and its dial digits; the ending's 72; hour chips; Play/stop; the intro pill.
  - Reduced motion emulated: the page still animates (hero intro, pinned day, widget entries, also on a phone); phone (no horizontal scroll, pinned dial, every scene reachable); short windows; no JS.
  - Tabs by keyboard; the gate; the film's "coming soon"; the skip link.
  - Vote (vote endpoint set; the Formspree URL is intercepted, never reached):
    - nothing is sent before "Count me in";
    - one POST of exactly `{choice, _gotcha}` / `{choice, email, _gotcha}` with both JSON headers;
    - the honeypot is present, empty, off screen and skipped by Tab;
    - an error status or a network failure shows the failure line, never "Counted", and keeps the pick for a retry;
    - a bad email is caught;
    - the CSP adds only `https://formspree.io`, to connect-src.
  - Regression tests for the review findings.
- **Lighthouse:**
  - Desktop: 99 / 100 / 100 / 100.
  - Mobile: 92 / 100 / 100 / 100 (Performance / Accessibility / Best Practices / SEO), two runs after the intro gate. LCP is 2.9 s (a hero letter), as before; FCP 2.3 s.
  - Earlier: 90 after the alive pass; 88–91 after the motion change; 100 / 92 at the first build.
- **Cold first visit** (slow 4G, 4× CPU, empty cache; B32):
  - Dropped frames during the intro: 50–53 before, 14–20 after.
  - Long tasks during the intro: 1.24–1.45 s before, 0.50–0.62 s after.
  - The letters no longer rise in a fallback font, and the faces no longer wipe in before their pictures exist.
  - Clips: `review/first-load-before.mp4` and `review/first-load-after.mp4`.

## What Zaid does next

1. Create the public repo `broski-site` on GitHub.
2. ~~Optional, before the first push: switch the commit email to the GitHub noreply address.~~ **Done:** this repo uses `Zaidzyy <86546939+Zaidzyy@users.noreply.github.com>` (repo-local config) and every commit was re-authored to it.
3. Push.
4. Settings → Pages → Source: **GitHub Actions**.
5. ~~Create a Formspree form and set `VOTE_ENDPOINT`.~~ **Done:** the vote endpoint is set to `https://formspree.io/f/mzedopnj` (B10). After the first push, send one test vote from the live site and check it arrives in Formspree.
6. Later, set `FILM_URL` in `src/config.ts` and replace the film line in `docs/README.template.md`, then run `npm run readme`.
