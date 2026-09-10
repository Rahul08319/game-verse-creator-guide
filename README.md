# Bubble Pop Blast

> A bright, fast bubble shooter built for the web and prepared for YouTube Playables.

**Match bubbles. Build combos. Clear the board.** Bubble Pop Blast is a responsive Canvas game with daily and weekly seeded challenges, offline progression, accessibility settings, and YouTube Playables SDK support.

## Highlights

| Play | Progress | Accessibility |
| --- | --- | --- |
| Bubble matching, combos, power-ups, and ten escalating levels | Daily streaks, weekly runs, local stats, high scores, and achievement badges | Color-blind palette, reduced motion, touch controls, keyboard support, and optional haptics |

## Run locally

```bash
npm install
npm run dev
```

Create a production bundle with:

```bash
npm run build
```

## Controls

- **Mouse / touch** — aim and shoot
- **F** — toggle fullscreen
- **Esc** — close an open game panel

## YouTube Playables readiness

The project includes the current YouTube Playables SDK before the game bundle and implements the required readiness, audio, pause/resume, cloud-save, and environment APIs. Ad and monetization APIs are deliberately not included.

- Responsive layout for portrait, landscape, and ultra-wide displays; it keeps the game centered without locking device orientation.
- High-DPI Canvas rendering and resolution-correct input mapping for crisp visuals on mobile and desktop.
- `firstFrameReady()` then `gameReady()` notifications, safe save/resume behavior, YouTube audio control support, and score submission.
- Playables mode avoids social sharing, Supabase score writes, and multiplayer networking.
- Build output uses relative bundle paths and lazy-loaded screens to keep first load lean.

Before release, upload a production build to a YouTube Playables Developer Portal development release and run the official [Playables Test Suite](https://developers.google.com/youtube/gaming/playables/test_suite). The suite cannot validate a local Vite server.

## Project structure

```text
src/
  components/       Game UI and on-demand overlays
  pages/            Main game and leaderboard routes
  utils/            Game engine, challenges, progress, audio, and Playables SDK
public/             Static web manifest and assets
```

## Quality checks

```bash
npm run build
```

The project also exposes `window.render_game_to_text()` and `window.advanceTime(ms)` to make automated gameplay checks observable and repeatable.

## Roadmap ideas

- More curated challenge boards and boss-style levels
- Local replay ghosts for weekly runs
- Optional larger UI/text mode
- Translated UI strings using the YouTube locale API

## License

Add a license before public distribution if you want others to reuse the code.
