/**
 * YouTube Playables SDK Helper
 * Wraps the YouTube Playables v1 SDK for easy integration.
 * Reference: https://developers.google.com/youtube/gaming/playables/reference/sdk
 */

declare global {
  interface Window {
    ytgame?: {
      game: {
        onReady: (callback: () => void) => void;
        onPause: (callback: () => void) => void;
        onResume: (callback: () => void) => void;
        firstFrameReady: () => void;
        gameReady: () => void;
        sendScore: (score: number) => void;
      };
      system: {
        onSave: (callback: (key: string) => string) => void;
        onLoad: (callback: (key: string, value: string) => void) => void;
      };
    };
  }
}

let isYTPlayable = false;
let onPauseCallback: (() => void) | null = null;
let onResumeCallback: (() => void) | null = null;

export const YouTubePlayables = {
  /**
   * Initialize YouTube Playables SDK integration.
   * Call this early in your app lifecycle.
   */
  init: (callbacks?: { onPause?: () => void; onResume?: () => void }) => {
    if (!window.ytgame) {
      console.log('YouTube Playables SDK not detected, running standalone.');
      return;
    }

    isYTPlayable = true;
    onPauseCallback = callbacks?.onPause || null;
    onResumeCallback = callbacks?.onResume || null;

    window.ytgame.game.onReady(() => {
      console.log('YouTube Playables: Game ready callback fired');
    });

    window.ytgame.game.onPause(() => {
      console.log('YouTube Playables: Paused');
      onPauseCallback?.();
    });

    window.ytgame.game.onResume(() => {
      console.log('YouTube Playables: Resumed');
      onResumeCallback?.();
    });
  },

  /** Signal that the first frame has been rendered */
  firstFrameReady: () => {
    if (isYTPlayable && window.ytgame) {
      window.ytgame.game.firstFrameReady();
    }
  },

  /** Signal that the game is fully loaded and ready to play */
  gameReady: () => {
    if (isYTPlayable && window.ytgame) {
      window.ytgame.game.gameReady();
    }
  },

  /** Submit a score to YouTube Playables leaderboard */
  sendScore: (score: number) => {
    if (isYTPlayable && window.ytgame) {
      window.ytgame.game.sendScore(score);
    }
  },

  /** Check if running inside YouTube Playables */
  isActive: () => isYTPlayable,
};
