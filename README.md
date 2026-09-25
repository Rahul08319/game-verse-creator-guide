<div align="center">

# 🫧 Bubble Pop Blast

### One polished Canvas game. Thirteen native gaming ecosystems.

<p>
  <img alt="Apple Liquid Glass design" src="https://img.shields.io/badge/design-Liquid%20Glass-111111?style=for-the-badge&logo=apple&logoColor=white" />
  <img alt="YouTube Playables ready" src="https://img.shields.io/badge/YouTube-Playables%20Ready-FF0000?style=for-the-badge&logo=youtube&logoColor=white" />
  <img alt="Responsive Canvas" src="https://img.shields.io/badge/rendering-High--DPI%20Canvas-7DD3FC?style=for-the-badge" />
  <img alt="Platform engine" src="https://img.shields.io/badge/platforms-13%20native%20adapters-A78BFA?style=for-the-badge" />
</p>

**Match bubbles · build combos · defeat boss cores · ship to the platforms your players use.**

[Launch locally](#quick-start) · [Platform Universe Hub](#platform-universe) · [YouTube Playables](#youtube-playables) · [Quality checks](#quality-checks)

</div>

---

## The game

Bubble Pop Blast is a responsive bubble shooter with high-DPI Canvas rendering, rich atmospheric depth, and a glass-inspired interface. It is deliberately lightweight: the premium visual treatment runs in the existing 2D Canvas pipeline, avoiding a decorative Three.js/WebGL dependency that would compromise first-load performance.

| Play | Progression | Player comfort |
| --- | --- | --- |
| Color matching, bank shots, combos, Bomb, Freeze, Rainbow, and Nova bubbles | Boss-core worlds, daily streaks, weekly ghosts, achievements, stats, and cosmetic unlocks | Color-blind palette, reduced motion, optional haptics, touch controls, and full-screen support |

### Built to reward skill

- **Adaptive pacing** offers a color-match assist after a difficult sequence, while high accuracy makes the palette more demanding.
- **Combo rewards** give Bomb at 3×, Rainbow at 5×, and Nova on longer chains.
- **Boss encounters** in Levels 5 and 10 ask the player to match a boss core, not merely chase a score.
- **Weekly ghosts** keep a local recording of a player’s best pace to race on the next attempt.
- **Unlockable cosmetics** include Aurora and Solar themes, plus Stardust and Confetti pop effects.

## Liquid Glass visual system

The interface pairs translucent panels, soft specular highlights, smooth rounded geometry, layered shadows, and restrained motion with an atmospheric Canvas board. The board adds diffuse color fields, sparse depth stars, vignetting, and a glass edge while keeping the aim line and bubbles high-contrast and readable.

## Platform Universe

The universal adapter layer auto-detects supported environments and also accepts a query override such as `?platform=youtube` or `?platform=poki` for development. The Platform Universe Hub is available at `/platforms` and the in-game quick switcher is available from the toolbar.

| Platform family | Native integration |
| --- | --- |
| Video, social & activities | YouTube Playables, Facebook Instant Games, Discord Activities |
| Web portals | Poki, CrazyGames, Yandex Games, GameDistribution, Y8, Lagged |
| Stores & super apps | Microsoft Store PWA, JioGames, Huawei/Xiaomi Quick Games |
| Embedded distribution | MSN and Reddit Games |

Platform adapters expose each ecosystem’s relevant save, leaderboard, ad, and lifecycle capabilities. Monetization is enabled for the adapters and platforms that support it, following the selection made for this project; each provider still requires its own account, review, and runtime configuration before release.

## Quick start

```bash
npm install
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Run the YouTube Playables bundle preflight:

```bash
npm run check:playables

# 5. Package standalone distribution bundles for all 13 platforms
npm run build:platforms
```

## Controls

| Input | Action |
| --- | --- |
| Mouse / touch | Aim and shoot |
| `F` | Toggle fullscreen |
| `Esc` | Close the open panel |
|  / 🌐 toolbar icons | Open the platform switcher or Platform Universe Hub |

## YouTube Playables

The YouTube Playables SDK loads before the game bundle. The project implements readiness signaling, audio control, pause/resume, score submission, health logging, locale support, and safe save-state fallback. The layout stays responsive across portrait, landscape, and ultra-wide displays without locking orientation.

Before a release, upload the built game to a YouTube Playables Developer Portal development release and run the official [Playables Test Suite](https://developers.google.com/youtube/gaming/playables/test_suite). That suite cannot validate a local Vite server.

## Project map

```text
src/
  components/  Canvas, HUD, overlays, visual system, and platform switcher
  pages/       Game, leaderboard, and Platform Universe Hub
  platforms/   Native adapters and auto-detection layer
  utils/       Game engine, progression, effects, audio, and Playables SDK
scripts/       Bundle preflight validation
```

## Quality checks

The project exposes `window.render_game_to_text()` for observable gameplay state and `window.advanceTime(ms)` for controlled test-frame advancement. Use `npm run check:playables` before a YouTube submission to verify bundle sizes, safe filenames, and output structure.

## License

Add an MIT or commercial license before third-party distribution.

<div align="center">

Made with 🫧, high-DPI Canvas, and Liquid Glass design foundations.

</div>
