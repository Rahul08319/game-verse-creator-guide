<div align="center">

# 🫧 Bubble Pop Blast

### A fast, responsive Canvas bubble shooter — certified for YouTube Playables

[![YouTube Playables](https://img.shields.io/badge/YouTube-Playables%20Ready-FF0000?logo=youtube&logoColor=white&style=for-the-badge)](https://developers.google.com/youtube/gaming/playables)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black&style=for-the-badge)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=for-the-badge)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)](https://tailwindcss.com/)

**Match bubbles · Build combos · Clear the board · Earn on YouTube**

</div>

---

## ✨ Highlights

<table>
<tr>
<td align="center" width="33%">

### 🎮 Gameplay
Bubble matching, power-ups, combos, and 10 escalating levels — including boss fights and adaptive difficulty.

</td>
<td align="center" width="33%">

### 📈 Progress
Daily streaks, weekly challenge runs, local high scores, achievement badges, and cloud save via YouTube.

</td>
<td align="center" width="33%">

### ♿ Accessible
Color-blind palette, reduced motion, responsive portrait/landscape layout, touch, mouse, and keyboard support.

</td>
</tr>
</table>

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (with YouTube Playables CSP headers)
npm run dev

# Production build
npm run build

# Run YouTube Playables preflight validation
npm run check:playables
```

### Controls

| Input | Action |
|---|---|
| Mouse / Touch | Aim and shoot bubbles |
| `F` | Toggle fullscreen |
| `Esc` | Close open panel |

---

## 🎯 YouTube Playables SDK Integration

> The YouTube Playables SDK connects web games with the YouTube environment. This project implements **all required APIs**, **all recommended APIs**, and full **ads monetization** support.

### SDK Setup

The SDK is loaded **before** the game bundle in [`index.html`](./index.html) — this is a hard publishing requirement:

```html
<!-- MUST be the first script — loads before any game code -->
<script src="https://www.youtube.com/game_api/v1"></script>
```

### ✅ Compliance Matrix

| API | Category | Status | Implementation |
|---|---|---|---|
| `ytgame.game.firstFrameReady()` | **Required** | ✅ | [`youtubePlayables.ts`](./src/utils/youtubePlayables.ts) · [`Index.tsx`](./src/pages/Index.tsx) |
| `ytgame.game.gameReady()` | **Required** | ✅ | After setup completes, guarded against duplicates |
| `ytgame.IN_PLAYABLES_ENV` | **Required** | ✅ | `isActive()` checks both `typeof ytgame` and `IN_PLAYABLES_ENV` |
| `ytgame.system.isAudioEnabled()` | **Required** | ✅ | Initializes game audio state on startup |
| `ytgame.system.onAudioEnabledChange()` | **Required** | ✅ | Syncs in real-time with YouTube audio toggle |
| `ytgame.system.onPause()` | **Required** | ✅ | Saves game state immediately; pauses gameplay |
| `ytgame.system.onResume()` | **Required** | ✅ | Resumes gameplay state |
| `ytgame.game.loadData()` | **Required** | ✅ | Restores settings, scores, and game state from cloud |
| `ytgame.game.saveData(data)` | **Required** | ✅ | Saves on score change, settings, and on pause |
| `ytgame.system.getLanguage()` | **Recommended** | ✅ | Sets `document.documentElement.lang` from BCP-47 locale |
| `ytgame.engagement.sendScore()` | **Recommended** | ✅ | Called on level complete and game over |
| `ytgame.engagement.openYTContent()` | **Recommended** | ✅ | Available via YouTube button in toolbar |
| `ytgame.health.logError()` | **Recommended** | ✅ | Called on SDK catch blocks |
| `ytgame.health.logWarning()` | **Recommended** | ✅ | Called on non-critical SDK failures |
| `ytgame.ads.requestInterstitialAd()` | **Monetization** | ✅ | Between levels and on game over (45s cooldown) |
| `ytgame.ads.requestRewardedAd()` | **Monetization** | ✅ | "Watch Ad → +1 Life" offer on game over |
| `ytgame.SDK_VERSION` | **Optional** | ✅ | Exposed via `YouTubePlayables.sdkVersion()` |
| `ytgame.SdkError` / `SdkErrorType` | **Error Handling** | ✅ | Full types in [`ytgame.d.ts`](./src/types/ytgame.d.ts) |

---

## 💰 Ads Monetization

YouTube Playables supports three ad types. This game implements all three:

```
┌─────────────────────────────────────────────────────────────┐
│  YouTube Ads in Bubble Pop Blast                            │
│                                                             │
│  📺 Pre-roll Ads        → Automatic (no code needed)       │
│  ⏸️  Interstitial Ads   → Between levels + Game Over        │
│  🎁 Rewarded Ads        → "Watch Ad → +1 Life" offer       │
└─────────────────────────────────────────────────────────────┘
```

### Interstitial Ads

Called automatically between levels and on game over — non-blocking, with a **45-second cooldown** to avoid spam:

```typescript
// Between levels / on game over
void YouTubePlayables.requestInterstitialAd();
```

### Rewarded Ads

Players can voluntarily watch an ad to earn an extra life when they hit Game Over:

```typescript
const earned = await YouTubePlayables.requestRewardedAd(REWARD_IDS.EXTRA_LIFE);
if (earned) {
  // Grant +1 life and continue
}
```

**Reward IDs** (stable, no user data):

| Constant | ID | Description |
|---|---|---|
| `REWARD_IDS.EXTRA_LIFE` | `extra-life-reward-v1` | +1 Life on game over |
| `REWARD_IDS.BOMB_POWERUP` | `bomb-powerup-reward-v1` | Bomb power-up grant |
| `REWARD_IDS.CONTINUE_GAME` | `continue-game-reward-v1` | Continue from checkpoint |

> **Always handle errors gracefully.** Players interact across many devices and network conditions. Ad requests may fail silently — the game never gates required gameplay behind an ad result.

---

## 🛡️ Content Security Policy (CSP)

YouTube enforces a strict CSP on all Playables. The dev server replicates it locally so you catch violations early:

```
default-src 'none';
script-src 'report-sample' 'self' 'unsafe-eval' 'unsafe-inline' blob:
  https://www.youtube.com/game_api/v0
  https://www.youtube.com/game_api/v0/
  https://www.youtube.com/game_api/v1
  https://www.youtube.com/game_api/v1/;
object-src 'none';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' blob: data:;
media-src 'self' blob:;
font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com;
connect-src 'self' blob: data:;
sandbox allow-pointer-lock allow-same-origin allow-scripts;
base-uri 'self';
manifest-src 'self';
worker-src 'self' blob:
```

To test locally with Chrome DevTools overrides:
1. Open DevTools → **Sources** → **Overrides** → Enable Local Overrides
2. Override `index.html` response headers to add the CSP above
3. Any violations appear in the **Console** as `Content Security Policy` errors

---

## 🧪 Testing with the Official Test Suite

Before submitting, validate your integration:

1. Run `npm run build` locally
2. Run `npm run check:playables` — validates bundle sizes, file names, and SDK load order
3. Upload to [YouTube Playables Developer Portal](https://www.youtube.com/playables_portal) as a **development release**
4. Run the [official Playables Test Suite](https://developers.google.com/youtube/gaming/playables/test_suite)

> ⚠️ **The Test Suite cannot validate a local Vite dev server.** You must upload a production build to the Developer Portal.

---

## 🗂️ Project Structure

```
game-verse-creator-guide/
├── index.html                  # SDK script loaded FIRST (required)
├── src/
│   ├── types/
│   │   └── ytgame.d.ts         # Complete official SDK TypeScript types
│   ├── utils/
│   │   ├── youtubePlayables.ts # Full SDK wrapper (all required + monetization APIs)
│   │   ├── soundManager.ts     # Audio — respects ytgame.system.isAudioEnabled()
│   │   └── ...
│   ├── pages/
│   │   └── Index.tsx           # Main game: SDK init, lifecycle, ads, score submission
│   └── components/
│       └── ...                 # UI overlays including rewarded ad offer
├── scripts/
│   └── check-playables.mjs     # Pre-publish validation: sizes, names, SDK order
└── vite.config.ts              # CSP headers mirroring YouTube Playables policy
```

---

## 🎮 YouTube Playables Readiness Checklist

- [x] **SDK Script** — loaded before any game code in `index.html`
- [x] **`firstFrameReady()`** — called on first render frame
- [x] **`gameReady()`** — called only when game is interactive (no loading screen)
- [x] **Audio** — initialized from `isAudioEnabled()`, updates via `onAudioEnabledChange()`
- [x] **Pause/Resume** — state saved immediately on pause; gameplay pauses/resumes correctly
- [x] **Cloud Save** — `loadData()` + `saveData()` with UTF-16 validation and 3 MiB limit
- [x] **Locale** — language set via `getLanguage()` (BCP-47); never cached in cloud save
- [x] **Score** — sent via `sendScore()` on level complete and game over
- [x] **Interstitial Ads** — between levels and game over, with 45s cooldown
- [x] **Rewarded Ads** — "Watch Ad → +1 Life" offer with stable reward IDs
- [x] **Environment Guard** — multiplayer, social sharing, Supabase writes disabled in Playables env
- [x] **Responsive Layout** — portrait, landscape, ultra-wide; no device orientation lock
- [x] **High-DPI Canvas** — crisp rendering and touch-correct input on all screen densities
- [x] **CSP Compatible** — no external requests outside YouTube's policy
- [x] **Bundle Size** — initial load < 15 MiB, total < 250 MiB, all files < 30 MiB each
- [x] **TypeScript** — complete SDK types in `src/types/ytgame.d.ts`

---

## 🧩 TypeScript Definitions

Full type definitions for the YouTube Playables SDK are in [`src/types/ytgame.d.ts`](./src/types/ytgame.d.ts), covering all namespaces:

```typescript
// Environment
ytgame.IN_PLAYABLES_ENV          // boolean
ytgame.SDK_VERSION               // string

// Game lifecycle (Required)
ytgame.game.firstFrameReady()    // void
ytgame.game.gameReady()          // void
ytgame.game.loadData()           // Promise<string>
ytgame.game.saveData(data)       // Promise<void>

// System (Required)
ytgame.system.isAudioEnabled()   // boolean
ytgame.system.onAudioEnabledChange(cb)  // () => void (unsubscribe)
ytgame.system.onPause(cb)        // () => void
ytgame.system.onResume(cb)       // () => void
ytgame.system.getLanguage()      // Promise<string>  ← BCP-47 tag

// Engagement (Recommended)
ytgame.engagement.sendScore({ value })              // Promise<void>
ytgame.engagement.openYTContent({ id, contentType }) // Promise<void>

// Ads / Monetization
ytgame.ads.requestInterstitialAd()         // Promise<void>
ytgame.ads.requestRewardedAd(rewardId)     // Promise<boolean>

// Health (Recommended)
ytgame.health.logError()    // void
ytgame.health.logWarning()  // void

// Errors
ytgame.SdkError             // extends Error { errorType: SdkErrorType }
ytgame.SdkErrorType         // API_UNAVAILABLE | INVALID_PARAMS | SIZE_LIMIT_EXCEEDED | UNKNOWN
```

Official type definitions download:
[`index.d.ts`](https://www.youtube.com/playablesportal/static/youtube_ytgame_web_deploy_mpm_files/index.d.ts)

---

## 🔗 Resources

| Resource | Link |
|---|---|
| YouTube Playables Overview | [developers.google.com/youtube/gaming/playables](https://developers.google.com/youtube/gaming/playables) |
| SDK Reference | [/reference/sdk](https://developers.google.com/youtube/gaming/playables/reference/sdk) |
| Publishing Requirements | [/certification/requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements) |
| Test Suite | [/test_suite](https://developers.google.com/youtube/gaming/playables/test_suite) |
| Test Suite Guide | [/reference/test_suite_guide](https://developers.google.com/youtube/gaming/playables/reference/test_suite_guide) |
| Code Samples | [/samples/oss_samples](https://developers.google.com/youtube/gaming/playables/samples/oss_samples) |
| Developer Portal | [youtube.com/playables_portal](https://www.youtube.com/playables_portal) |
| Playables Community | [Discord](https://discord.gg/eEFBtMswKT) |

---

## 🗺️ Roadmap

- [ ] Additional curated challenge boards and boss-style levels
- [ ] Local replay ghosts for weekly runs
- [ ] Larger UI/text mode option
- [ ] Translated UI strings using `ytgame.system.getLanguage()`
- [ ] `openYTContent` to surface YouTube gaming content in-game

---

## 📄 License

Add a license before public distribution if you want others to reuse the code.

---

<div align="center">

Built with ❤️ for YouTube Playables

</div>
