import { GameAdapter, LocalAdapter } from './base';
import { YouTubeAdapter } from './youtube';
import { FacebookAdapter } from './facebook';
import { PokiAdapter } from './poki';
import { CrazyGamesAdapter } from './crazygames';
import { YandexAdapter } from './yandex';
import { GameDistributionAdapter } from './gamedistribution';
import { DiscordAdapter } from './discord';
import { JioGamesAdapter } from './jiogames';
import { Y8Adapter } from './y8';
import { LaggedAdapter } from './lagged';
import { MicrosoftAdapter } from './microsoft';
import { HuaweiAdapter } from './huawei';
import { MsnAdapter } from './msn';

export interface PlatformCapabilities {
  cloudSave: boolean;
  interstitialAds: boolean;
  rewardedAds: boolean;
  scoreLeaderboard: boolean;
  localeSync: boolean;
  audioSync: boolean;
  offlineSupport: boolean;
}

export interface PlatformMeta {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  category: 'Video & Streaming' | 'Social & Chat' | 'Web Portals' | 'Regional & Telecom' | 'Desktop & OS' | 'Quick Apps';
  brandColor: string;
  icon: string;
  description: string;
  sdkRequirements: string[];
  capabilities: PlatformCapabilities;
  docsUrl: string;
}

export const PLATFORMS_CATALOG: PlatformMeta[] = [
  {
    id: 'youtube',
    name: 'YouTube Playables',
    badge: 'Certified',
    tagline: 'Google Playables SDK v1 with cloud save, ads & locale',
    category: 'Video & Streaming',
    brandColor: '#FF0000',
    icon: '▶️',
    description: 'Direct YouTube client integration for Android, iOS, and Web with firstFrameReady(), gameReady(), audio sync, and zero-latency save.',
    sdkRequirements: [
      '<script src="https://www.youtube.com/game_api/v1"></script> in root index.html before all code',
      'firstFrameReady() and gameReady() lifecycle calls',
      'isAudioEnabled() and onAudioEnabledChange() audio sync',
      'onPause() and onResume() state freeze/restore',
      'loadData() and saveData() cloud saves (< 3 MiB UTF-16)',
      'sendScore() integer score submission',
      'requestInterstitialAd() & requestRewardedAd() monetization',
    ],
    capabilities: {
      cloudSave: true,
      interstitialAds: true,
      rewardedAds: true,
      scoreLeaderboard: true,
      localeSync: true,
      audioSync: true,
      offlineSupport: false,
    },
    docsUrl: 'https://developers.google.com/youtube/gaming/playables',
  },
  {
    id: 'facebook',
    name: 'Facebook Instant Games',
    badge: 'Integrated',
    tagline: 'FBInstant 7.x SDK with Messenger & social viral loop',
    category: 'Social & Chat',
    brandColor: '#1877F2',
    icon: '💬',
    description: 'Instant loading on Facebook Feed, Groups, and Messenger chats with async player data sync and rewarded video placement.',
    sdkRequirements: [
      'FBInstant.initializeAsync() & startGameAsync()',
      'FBInstant.setLoadingProgress(100)',
      'FBInstant.player.getDataAsync() & setDataAsync() with flushDataAsync()',
      'getInterstitialAdAsync() and getRewardedVideoAsync()',
      'FBInstant.getLocale() for BCP-47 user locale',
    ],
    capabilities: {
      cloudSave: true,
      interstitialAds: true,
      rewardedAds: true,
      scoreLeaderboard: true,
      localeSync: true,
      audioSync: false,
      offlineSupport: false,
    },
    docsUrl: 'https://developers.facebook.com/docs/games/instant-games',
  },
  {
    id: 'poki',
    name: 'Poki',
    badge: 'Integrated',
    tagline: 'Poki SDK v2 with commercialBreak & rewardedBreak',
    category: 'Web Portals',
    brandColor: '#0083FF',
    icon: '🕹️',
    description: 'Premier web gaming portal with automated commercial breaks, rewarded videos, gameplay telemetry, and zero tracking dependencies.',
    sdkRequirements: [
      'PokiSDK.init() promise resolution',
      'PokiSDK.gameLoadingStart() & gameLoadingFinished()',
      'PokiSDK.gameplayStart() & gameplayStop() pacing',
      'PokiSDK.commercialBreak() between levels',
      'PokiSDK.rewardedBreak() for extra lives',
    ],
    capabilities: {
      cloudSave: false,
      interstitialAds: true,
      rewardedAds: true,
      scoreLeaderboard: false,
      localeSync: true,
      audioSync: false,
      offlineSupport: true,
    },
    docsUrl: 'https://sdk.poki.com',
  },
  {
    id: 'crazygames',
    name: 'CrazyGames',
    badge: 'Integrated',
    tagline: 'CrazyGames SDK v3 with happytime & Adblock detection',
    category: 'Web Portals',
    brandColor: '#9333EA',
    icon: '👾',
    description: 'Global web portal with happytime() celebration rewards, banner and midgame ad triggers, and Adblock resilience.',
    sdkRequirements: [
      'CrazyGames.SDK.init() initialization',
      'sdkGameLoadingStart() and sdkGameLoadingStop()',
      'happytime() event trigger on level clears',
      'requestAd("midgame") and requestAd("rewarded")',
      'hasAdblock() detection fallback',
    ],
    capabilities: {
      cloudSave: false,
      interstitialAds: true,
      rewardedAds: true,
      scoreLeaderboard: false,
      localeSync: true,
      audioSync: false,
      offlineSupport: true,
    },
    docsUrl: 'https://docs.crazygames.com',
  },
  {
    id: 'yandex',
    name: 'Yandex Games',
    badge: 'Integrated',
    tagline: 'YaGames SDK with cloud saves, ads & leaderboards',
    category: 'Web Portals',
    brandColor: '#FC3F1D',
    icon: '🌐',
    description: 'Leading European/CIS gaming platform with native leaderboards, cloud saves across mobile & desktop, and localized monetizations.',
    sdkRequirements: [
      'YaGames.init() resolver',
      'ysdk.features.LoadingAPI.ready()',
      'ysdk.getPlayer() for cloud data storage',
      'ysdk.adv.showFullscreenAdv() & showRewardedVideo()',
      'ysdk.getLeaderboards() score recording',
    ],
    capabilities: {
      cloudSave: true,
      interstitialAds: true,
      rewardedAds: true,
      scoreLeaderboard: true,
      localeSync: true,
      audioSync: false,
      offlineSupport: false,
    },
    docsUrl: 'https://yandex.ru/dev/games/doc',
  },
  {
    id: 'gamedistribution',
    name: 'GameDistribution',
    badge: 'Integrated',
    tagline: 'GD SDK HTML5 global syndication network',
    category: 'Web Portals',
    brandColor: '#10B981',
    icon: '🌍',
    description: 'Worldwide publisher network syndicating Bubble Pop Blast across thousands of arcade sites with pre-roll and mid-roll ads.',
    sdkRequirements: [
      'window.GD_OPTIONS declaration with gameId',
      'gdsdk.showAd("interstitial")',
      'gdsdk.showAd("rewarded")',
      'SDK_GAME_PAUSE and SDK_GAME_RESUME listeners',
    ],
    capabilities: {
      cloudSave: false,
      interstitialAds: true,
      rewardedAds: true,
      scoreLeaderboard: false,
      localeSync: true,
      audioSync: false,
      offlineSupport: true,
    },
    docsUrl: 'https://gamedistribution.com/developers',
  },
  {
    id: 'discord',
    name: 'Discord Activities',
    badge: 'Integrated',
    tagline: 'Discord Embedded App SDK with Rich Presence',
    category: 'Social & Chat',
    brandColor: '#5865F2',
    icon: '🎮',
    description: 'Play directly inside Discord voice channels and group chats with embedded SDK authentication and Rich Presence telemetry.',
    sdkRequirements: [
      'DiscordSDK initialization with Client ID',
      'sdk.ready() lifecycle authorization',
      'setActivity() with current Level & Score',
      'IFrame communication inside voice channel sandbox',
    ],
    capabilities: {
      cloudSave: false,
      interstitialAds: false,
      rewardedAds: false,
      scoreLeaderboard: true,
      localeSync: true,
      audioSync: false,
      offlineSupport: false,
    },
    docsUrl: 'https://discord.com/developers/docs/activities/overview',
  },
  {
    id: 'jiogames',
    name: 'JioGames',
    badge: 'Integrated',
    tagline: 'India #1 Telecom & Set-top Box gaming ecosystem',
    category: 'Regional & Telecom',
    brandColor: '#0A3A8B',
    icon: '🇮🇳',
    description: 'Optimized for 450M+ Jio subscribers across JioPhone, Android set-top boxes, and web portal with JioGames SDK hooks.',
    sdkRequirements: [
      'JioGames.init() and onReady() hooks',
      'JioGames.showAd() interstitial & rewarded',
      'JioGames.submitScore() leaderboard',
      'Remote control & D-pad keypad navigation support',
    ],
    capabilities: {
      cloudSave: true,
      interstitialAds: true,
      rewardedAds: true,
      scoreLeaderboard: true,
      localeSync: true,
      audioSync: false,
      offlineSupport: true,
    },
    docsUrl: 'https://jiogames.com',
  },
  {
    id: 'y8',
    name: 'Y8 Games',
    badge: 'Integrated',
    tagline: 'ID.net player profiles & high score tables',
    category: 'Web Portals',
    brandColor: '#E11D48',
    icon: '🎱',
    description: 'Classic arcade titan supporting player achievements, high score tables, and community bookmarks.',
    sdkRequirements: [
      'Y8.init({ game_id }) initialization',
      'Y8.submitScore({ score, table })',
      'Y8.showAd({ type: "interstitial" })',
    ],
    capabilities: {
      cloudSave: false,
      interstitialAds: true,
      rewardedAds: false,
      scoreLeaderboard: true,
      localeSync: true,
      audioSync: false,
      offlineSupport: true,
    },
    docsUrl: 'https://account.id.net/developers',
  },
  {
    id: 'lagged',
    name: 'Lagged',
    badge: 'Integrated',
    tagline: 'Clean HTML5 responsive arcade standards',
    category: 'Web Portals',
    brandColor: '#8B5CF6',
    icon: '⚡',
    description: 'Ultra-fast, lightweight HTML5 arcade with instant fullscreen scaling and zero blocking scripts.',
    sdkRequirements: [
      'Zero-dependency standalone canvas execution',
      'Auto-resizing responsive viewport',
      'localStorage high scores & preferences',
    ],
    capabilities: {
      cloudSave: false,
      interstitialAds: false,
      rewardedAds: false,
      scoreLeaderboard: false,
      localeSync: true,
      audioSync: false,
      offlineSupport: true,
    },
    docsUrl: 'https://lagged.com',
  },
  {
    id: 'microsoft',
    name: 'Microsoft Store (PWA)',
    badge: 'Integrated',
    tagline: 'Windows 11 / Xbox Progressive Web App package',
    category: 'Desktop & OS',
    brandColor: '#0078D4',
    icon: '🪟',
    description: 'Packaged with Microsoft PWA Builder for Windows 10/11 Microsoft Store distribution with native window framing and local storage.',
    sdkRequirements: [
      'Web App Manifest with standalone display mode',
      'Windows.Storage / localSettings fallback',
      'Gamepad / keyboard mapping (F for fullscreen, Esc for panels)',
    ],
    capabilities: {
      cloudSave: true,
      interstitialAds: false,
      rewardedAds: false,
      scoreLeaderboard: false,
      localeSync: true,
      audioSync: true,
      offlineSupport: true,
    },
    docsUrl: 'https://docs.microsoft.com/en-us/microsoft-edge/progressive-web-apps-chromium',
  },
  {
    id: 'huawei',
    name: 'Huawei & Xiaomi Quick Games',
    badge: 'Integrated',
    tagline: 'Mini Game Runtime for HarmonyOS & MIUI',
    category: 'Quick Apps',
    brandColor: '#C026D3',
    icon: '📱',
    description: 'Tap-to-play instant quick app runtime with sub-second launch times without full APK installation.',
    sdkRequirements: [
      'Huawei Browser Services (hbs) / miapp detection',
      'Quick App system.storage key-value pairs',
      'Adaptive screen density scaling for mobile displays',
    ],
    capabilities: {
      cloudSave: true,
      interstitialAds: false,
      rewardedAds: false,
      scoreLeaderboard: false,
      localeSync: true,
      audioSync: false,
      offlineSupport: true,
    },
    docsUrl: 'https://developer.huawei.com/consumer/en/doc/development/quickApp-Guides',
  },
  {
    id: 'msn',
    name: 'MSN & Reddit Games',
    badge: 'Integrated',
    tagline: 'Cross-origin iFrame postMessage protocol',
    category: 'Web Portals',
    brandColor: '#0284C7',
    icon: '📰',
    description: 'Embedded across Microsoft Start / MSN Games portal and Reddit embed threads with postMessage score and pause orchestration.',
    sdkRequirements: [
      'window.parent.postMessage("GAME_LOADED")',
      'window.parent.postMessage("SCORE_UPDATE", score)',
      'window.addEventListener("message") for PAUSE/RESUME',
    ],
    capabilities: {
      cloudSave: false,
      interstitialAds: false,
      rewardedAds: false,
      scoreLeaderboard: true,
      localeSync: true,
      audioSync: false,
      offlineSupport: true,
    },
    docsUrl: 'https://zone.msn.com',
  },
];

export function getPlatformAdapter(id: string): GameAdapter {
  switch (id.toLowerCase()) {
    case 'youtube':
      return new YouTubeAdapter();
    case 'facebook':
      return new FacebookAdapter();
    case 'poki':
      return new PokiAdapter();
    case 'crazygames':
      return new CrazyGamesAdapter();
    case 'yandex':
      return new YandexAdapter();
    case 'gamedistribution':
      return new GameDistributionAdapter();
    case 'discord':
      return new DiscordAdapter();
    case 'jiogames':
      return new JioGamesAdapter();
    case 'y8':
      return new Y8Adapter();
    case 'lagged':
      return new LaggedAdapter();
    case 'microsoft':
      return new MicrosoftAdapter();
    case 'huawei':
      return new HuaweiAdapter();
    case 'msn':
      return new MsnAdapter();
    default:
      return new LocalAdapter();
  }
}

export function detectPlatform(): GameAdapter {
  if (typeof window === 'undefined') return new LocalAdapter();

  // 1. Explicit query parameter override (e.g. ?platform=poki)
  try {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('platform');
    if (requested) {
      const match = PLATFORMS_CATALOG.find(p => p.id === requested.toLowerCase());
      if (match) {
        console.info(`[PlatformEngine] Loaded via query override: ${match.name}`);
        return getPlatformAdapter(match.id);
      }
    }
  } catch {
    // Ignore URL parse error
  }

  // 2. Local storage persistent override
  try {
    const saved = localStorage.getItem('game_platform_override');
    if (saved && saved !== 'auto') {
      const match = PLATFORMS_CATALOG.find(p => p.id === saved.toLowerCase());
      if (match) {
        console.info(`[PlatformEngine] Loaded via saved override: ${match.name}`);
        return getPlatformAdapter(match.id);
      }
    }
  } catch {
    // Ignore storage error
  }

  // 3. Environmental automatic detection
  const yt = new YouTubeAdapter();
  if (yt.isActive()) return yt;

  const fb = new FacebookAdapter();
  if (fb.isActive()) return fb;

  const poki = new PokiAdapter();
  if (poki.isActive()) return poki;

  const crazy = new CrazyGamesAdapter();
  if (crazy.isActive()) return crazy;

  const yandex = new YandexAdapter();
  if (yandex.isActive()) return yandex;

  const gd = new GameDistributionAdapter();
  if (gd.isActive()) return gd;

  const discord = new DiscordAdapter();
  if (discord.isActive()) return discord;

  const jio = new JioGamesAdapter();
  if (jio.isActive()) return jio;

  const y8 = new Y8Adapter();
  if (y8.isActive()) return y8;

  const lagged = new LaggedAdapter();
  if (lagged.isActive()) return lagged;

  const ms = new MicrosoftAdapter();
  if (ms.isActive()) return ms;

  const huawei = new HuaweiAdapter();
  if (huawei.isActive()) return huawei;

  const msn = new MsnAdapter();
  if (msn.isActive()) return msn;

  return new LocalAdapter();
}

export let adapter: GameAdapter = detectPlatform();

export function setPlatformOverride(id: string): GameAdapter {
  if (typeof window !== 'undefined') {
    if (id === 'auto') {
      localStorage.removeItem('game_platform_override');
    } else {
      localStorage.setItem('game_platform_override', id);
    }
  }
  adapter = id === 'auto' ? detectPlatform() : getPlatformAdapter(id);
  return adapter;
}

export * from './base';
