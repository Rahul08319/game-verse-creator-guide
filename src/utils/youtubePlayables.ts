/**
 * YouTube Playables SDK — comprehensive, defensive wrapper.
 *
 * Covers all required, recommended, and monetization APIs:
 *   - Required:  firstFrameReady, gameReady, loadData, saveData,
 *                isAudioEnabled, onAudioEnabledChange, onPause, onResume,
 *                IN_PLAYABLES_ENV
 *   - Recommended: getLanguage, sendScore, openYTContent, logError, logWarning
 *   - Monetization: requestInterstitialAd, requestRewardedAd
 *
 * SDK is a no-op when served outside YouTube. All public methods are
 * safe to call regardless of environment.
 *
 * @see https://developers.google.com/youtube/gaming/playables/reference/sdk
 */

import type {} from '../types/ytgame';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type SavePayload = Record<string, unknown>;

export type ContentType = 'VIDEO' | 'PLAYABLE';

export interface OpenContentOptions {
  id: string;
  contentType?: ContentType;
}

export interface PlayablesCallbacks {
  onPause?: () => void;
  onResume?: () => void;
  onAudioEnabledChange?: (enabled: boolean) => void;
  getSaveData?: () => SavePayload;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FALLBACK_SAVE_KEY = 'bubble-pop-playables-save-v1';
const MAX_SAVE_BYTES = 3 * 1024 * 1024; // 3 MiB

// Reward IDs — must be stable, unique per reward type, no user data.
export const REWARD_IDS = {
  EXTRA_LIFE: 'extra-life-reward-v1',
  BOMB_POWERUP: 'bomb-powerup-reward-v1',
  CONTINUE_GAME: 'continue-game-reward-v1',
} as const;

// Minimum milliseconds between interstitial ad requests (avoid spam).
const INTERSTITIAL_COOLDOWN_MS = 45_000;

// ---------------------------------------------------------------------------
// State flags
// ---------------------------------------------------------------------------

let initialized = false;
let firstFrameSent = false;
let readySent = false;
let lastInterstitialAt = 0;
let unsubAudio: (() => void) | null = null;
let unsubPause: (() => void) | null = null;
let unsubResume: (() => void) | null = null;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Access window.ytgame safely. */
const sdk = () => window.ytgame;

/** Whether the SDK is loaded AND we are inside Playables. */
const isActive = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.ytgame !== 'undefined' &&
  Boolean(window.ytgame?.IN_PLAYABLES_ENV);

/**
 * Safely parse JSON without throwing.
 */
const safeJson = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

/**
 * Serialize a save payload to a UTF-16-safe string ≤ 3 MiB.
 * Returns null when the result would exceed limits or is malformed.
 */
const serializeSave = (data: SavePayload): string | null => {
  try {
    const serialized = JSON.stringify(data);
    // JS strings are UTF-16; each char is up to 2 bytes.
    if (serialized.length * 2 > MAX_SAVE_BYTES) return null;
    // Use String.isWellFormed() if available (ES2024).
    if (
      typeof (serialized as unknown as { isWellFormed?: () => boolean })
        .isWellFormed === 'function' &&
      !(serialized as unknown as { isWellFormed: () => boolean }).isWellFormed()
    ) {
      return null;
    }
    return serialized;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const YouTubePlayables = {
  // ── Environment ────────────────────────────────────────────────────────

  /**
   * Returns true only when inside the YouTube Playables environment
   * AND the SDK is loaded.
   */
  isActive,

  /**
   * Returns the raw SDK_VERSION string, or undefined outside Playables.
   */
  sdkVersion(): string | undefined {
    return sdk()?.SDK_VERSION;
  },

  // ── Lifecycle ──────────────────────────────────────────────────────────

  /**
   * Initialize the SDK and register all system callbacks.
   * Safe to call multiple times (idempotent).
   *
   * @returns true if running inside Playables, false otherwise.
   */
  async init(callbacks: PlayablesCallbacks = {}): Promise<boolean> {
    const api = sdk();
    // No SDK or not inside Playables — behave as local/standalone.
    if (!api || !api.IN_PLAYABLES_ENV) return false;
    if (initialized) return true;
    initialized = true;

    try {
      // Sync initial audio state.
      const audioEnabled = api.system.isAudioEnabled();
      callbacks.onAudioEnabledChange?.(audioEnabled);

      // Subscribe to audio changes (store unsubscribe fn).
      unsubAudio = api.system.onAudioEnabledChange((enabled) => {
        callbacks.onAudioEnabledChange?.(enabled);
      });

      // Subscribe to pause — immediately save state, then call game callback.
      unsubPause = api.system.onPause(() => {
        if (callbacks.getSaveData) {
          void this.saveData(callbacks.getSaveData());
        }
        callbacks.onPause?.();
      });

      // Subscribe to resume.
      unsubResume = api.system.onResume(() => {
        callbacks.onResume?.();
      });

      // Apply YouTube locale to the document language attribute.
      try {
        const locale = await api.system.getLanguage();
        if (locale) document.documentElement.lang = locale;
      } catch {
        // Non-critical — continue without locale.
        this.logWarning();
      }

      return true;
    } catch {
      this.logWarning();
      return true; // Still inside Playables even if init partially fails.
    }
  },

  /**
   * Unregister all system event listeners.
   * Call this during cleanup / component unmount.
   */
  cleanup(): void {
    try { unsubAudio?.(); } catch { /* ignore */ }
    try { unsubPause?.(); } catch { /* ignore */ }
    try { unsubResume?.(); } catch { /* ignore */ }
    unsubAudio = null;
    unsubPause = null;
    unsubResume = null;
    initialized = false;
    firstFrameSent = false;
    readySent = false;
  },

  /**
   * Notifies YouTube that the game has begun showing frames.
   * MUST be called before `gameReady()`.
   */
  firstFrameReady(): void {
    const api = sdk();
    if (!api?.IN_PLAYABLES_ENV || firstFrameSent) return;
    try {
      api.game.firstFrameReady();
      firstFrameSent = true;
    } catch {
      this.logWarning();
    }
  },

  /**
   * Notifies YouTube that the game is fully interactive.
   * MUST NOT be called while a loading screen is visible.
   */
  gameReady(): void {
    const api = sdk();
    if (!api?.IN_PLAYABLES_ENV || readySent) return;
    // Guarantee firstFrameReady was sent first.
    this.firstFrameReady();
    try {
      api.game.gameReady();
      readySent = true;
    } catch {
      this.logWarning();
    }
  },

  // ── Cloud Save ─────────────────────────────────────────────────────────

  /**
   * Loads cloud save data from YouTube.
   * Falls back to localStorage when outside Playables.
   */
  async loadData<T extends SavePayload>(): Promise<T | null> {
    try {
      const serialized = isActive()
        ? await sdk()!.game.loadData()
        : localStorage.getItem(FALLBACK_SAVE_KEY);
      return serialized ? safeJson<T>(serialized) : null;
    } catch {
      this.logWarning();
      return null;
    }
  },

  /**
   * Persists cloud save data to YouTube.
   * Falls back to localStorage when outside Playables.
   * Validates size (< 3 MiB) and UTF-16 well-formedness before saving.
   *
   * @returns true if saved successfully.
   */
  async saveData(data: SavePayload): Promise<boolean> {
    const serialized = serializeSave(data);
    if (!serialized) {
      this.logWarning();
      return false;
    }
    try {
      if (isActive()) {
        await sdk()!.game.saveData(serialized);
      } else {
        localStorage.setItem(FALLBACK_SAVE_KEY, serialized);
      }
      return true;
    } catch {
      this.logWarning();
      return false;
    }
  },

  // ── Engagement ─────────────────────────────────────────────────────────

  /**
   * Sends the player's score to YouTube.
   * Clamps to [0, Number.MAX_SAFE_INTEGER] and floors to integer.
   */
  async sendScore(score: number): Promise<void> {
    if (!isActive()) return;
    const api = sdk();
    if (!api?.engagement) return;

    const value = Math.max(
      0,
      Math.min(Number.MAX_SAFE_INTEGER, Math.floor(score))
    );
    if (!Number.isFinite(value)) return;

    try {
      await api.engagement.sendScore({ value });
    } catch {
      this.logWarning();
    }
  },

  /**
   * Requests YouTube to open a video or another Playable.
   * On web: opens a new tab. On mobile: video → mini-player,
   * Playable → replaces current Playable.
   *
   * @param options - `{ id, contentType? }` where contentType defaults to VIDEO.
   */
  async openYTContent(options: OpenContentOptions): Promise<void> {
    if (!isActive()) return;
    const api = sdk();
    if (!api?.engagement) return;

    try {
      // The SDK accepts the ContentType string values ('VIDEO' | 'PLAYABLE').
      // We pass them as-is — they match the enum members.
      const contentType = options.contentType ?? 'VIDEO';
      await api.engagement.openYTContent({ id: options.id, contentType: contentType as ytgame.engagement.ContentType });
    } catch {
      this.logWarning();
    }
  },

  // ── System / Locale ────────────────────────────────────────────────────

  /**
   * Returns the user's YouTube language as a BCP-47 tag (e.g. "en-US").
   * Do NOT use other locale detection or store the value in cloud save.
   */
  async getLanguage(): Promise<string | null> {
    if (!isActive()) return null;
    try {
      return await sdk()!.system.getLanguage();
    } catch {
      this.logWarning();
      return null;
    }
  },

  /**
   * Returns whether YouTube has audio enabled.
   * Use this to initialize audio state on startup.
   */
  isAudioEnabled(): boolean {
    if (!isActive()) return true; // Default to audio on outside Playables.
    try {
      return sdk()!.system.isAudioEnabled();
    } catch {
      return true;
    }
  },

  // ── Ads / Monetization ─────────────────────────────────────────────────

  /**
   * Requests an interstitial ad at a natural gameplay breakpoint
   * (e.g., between levels, game over screen, mid-game loading).
   *
   * - Enforces a 45-second cooldown between requests.
   * - Makes no guarantee an ad was shown.
   * - Never use to gate gameplay-critical flows.
   *
   * @returns true if the ad request was attempted, false if skipped.
   */
  async requestInterstitialAd(): Promise<boolean> {
    if (!isActive()) return false;
    const api = sdk();
    if (!api?.ads) return false;

    const now = Date.now();
    if (now - lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return false;
    lastInterstitialAt = now;

    try {
      await api.ads.requestInterstitialAd();
      return true;
    } catch {
      // Error may be undefined — handle gracefully.
      this.logWarning();
      return false;
    }
  },

  /**
   * Requests a rewarded ad for a specific in-game reward.
   * Use `REWARD_IDS` constants for stable, correct IDs.
   *
   * @param rewardId - Unique identifier for this reward type (use `REWARD_IDS`).
   * @returns true if the player earned the reward, false otherwise.
   *
   * @example
   * const earned = await YouTubePlayables.requestRewardedAd(REWARD_IDS.EXTRA_LIFE);
   * if (earned) { grantExtraLife(); }
   */
  async requestRewardedAd(rewardId: string): Promise<boolean> {
    if (!isActive()) return false;
    const api = sdk();
    if (!api?.ads) return false;

    try {
      const earned = await api.ads.requestRewardedAd(rewardId);
      return earned;
    } catch {
      // error may be undefined — handle gracefully, reward nothing.
      this.logWarning();
      return false;
    }
  },

  // ── Health & Diagnostics ───────────────────────────────────────────────

  /**
   * Logs an error to YouTube. Best-effort, rate-limited.
   */
  logError(): void {
    try {
      if (isActive()) sdk()?.health?.logError();
    } catch {
      /* best-effort */
    }
  },

  /**
   * Logs a warning to YouTube. Best-effort, rate-limited.
   */
  logWarning(): void {
    try {
      if (isActive()) sdk()?.health?.logWarning();
    } catch {
      /* best-effort */
    }
  },
};
