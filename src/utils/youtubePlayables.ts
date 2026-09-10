/**
 * Thin, defensive wrapper for the YouTube Playables SDK.
 * The SDK is deliberately a no-op while the game is served outside YouTube.
 */

type SavePayload = Record<string, unknown>;

interface YouTubePlayablesSdk {
  IN_PLAYABLES_ENV: boolean;
  SDK_VERSION?: string;
  game: {
    firstFrameReady: () => void;
    gameReady: () => void;
    loadData: () => Promise<string>;
    saveData: (data: string) => Promise<void>;
  };
  system: {
    getLanguage: () => Promise<string>;
    isAudioEnabled: () => boolean;
    onAudioEnabledChange: (callback: (enabled: boolean) => void) => () => void;
    onPause: (callback: () => void) => () => void;
    onResume: (callback: () => void) => () => void;
  };
  engagement?: {
    sendScore: (score: { value: number }) => Promise<void>;
  };
  health?: {
    logError: () => void;
    logWarning: () => void;
  };
}

declare global {
  interface Window {
    ytgame?: YouTubePlayablesSdk;
  }
}

const FALLBACK_SAVE_KEY = 'bubble-pop-playables-save-v1';
const MAX_SAVE_BYTES = 3 * 1024 * 1024;

let initialized = false;
let firstFrameSent = false;
let readySent = false;

const sdk = (): YouTubePlayablesSdk | undefined => window.ytgame;
const isActive = (): boolean => Boolean(sdk()?.IN_PLAYABLES_ENV);

const safeJson = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const serializeSave = (data: SavePayload): string | null => {
  try {
    const serialized = JSON.stringify(data);
    if (serialized.length * 2 > MAX_SAVE_BYTES) return null;
    if (typeof serialized.isWellFormed === 'function' && !serialized.isWellFormed()) return null;
    return serialized;
  } catch {
    return null;
  }
};

export interface PlayablesCallbacks {
  onPause?: () => void;
  onResume?: () => void;
  onAudioEnabledChange?: (enabled: boolean) => void;
  getSaveData?: () => SavePayload;
}

export const YouTubePlayables = {
  async init(callbacks: PlayablesCallbacks = {}): Promise<boolean> {
    const api = sdk();
    if (!api || !api.IN_PLAYABLES_ENV) return false;
    if (initialized) return true;
    initialized = true;

    try {
      callbacks.onAudioEnabledChange?.(api.system.isAudioEnabled());
      api.system.onAudioEnabledChange((enabled) => callbacks.onAudioEnabledChange?.(enabled));
      api.system.onPause(() => {
        if (callbacks.getSaveData) void this.saveData(callbacks.getSaveData());
        callbacks.onPause?.();
      });
      api.system.onResume(() => callbacks.onResume?.());

      const language = await api.system.getLanguage();
      if (language) document.documentElement.lang = language;
      return true;
    } catch {
      this.logWarning();
      return true;
    }
  },

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

  gameReady(): void {
    const api = sdk();
    if (!api?.IN_PLAYABLES_ENV || readySent) return;
    this.firstFrameReady();
    try {
      api.game.gameReady();
      readySent = true;
    } catch {
      this.logWarning();
    }
  },

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

  async saveData(data: SavePayload): Promise<boolean> {
    const serialized = serializeSave(data);
    if (!serialized) {
      this.logWarning();
      return false;
    }
    try {
      if (isActive()) await sdk()!.game.saveData(serialized);
      else localStorage.setItem(FALLBACK_SAVE_KEY, serialized);
      return true;
    } catch {
      this.logWarning();
      return false;
    }
  },

  async sendScore(score: number): Promise<void> {
    const value = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(score)));
    if (!isActive() || !Number.isFinite(value) || !sdk()?.engagement) return;
    try {
      await sdk()!.engagement!.sendScore({ value });
    } catch {
      this.logWarning();
    }
  },

  logError(): void {
    try { if (isActive()) sdk()?.health?.logError(); } catch { /* best effort */ }
  },

  logWarning(): void {
    try { if (isActive()) sdk()?.health?.logWarning(); } catch { /* best effort */ }
  },

  isActive,
};
