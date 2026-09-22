/**
 * YouTube Playables SDK — Complete TypeScript type definitions.
 * Reflects the official SDK reference at:
 * https://developers.google.com/youtube/gaming/playables/reference/sdk
 *
 * Import this file to get full IntelliSense support for `window.ytgame`.
 */

// ---------------------------------------------------------------------------
// ytgame – top-level namespace
// ---------------------------------------------------------------------------

declare namespace ytgame {
  /**
   * Whether or not the game is running within the Playables environment.
   * Combine with an `typeof ytgame !== "undefined"` check.
   * @example
   * const inPlayablesEnv = typeof ytgame !== "undefined" && ytgame.IN_PLAYABLES_ENV;
   */
  const IN_PLAYABLES_ENV: boolean;

  /**
   * The YouTube Playables SDK version string.
   * @example
   * console.log(ytgame.SDK_VERSION); // "1.x.y" — do not log in production
   */
  const SDK_VERSION: string;

  // -------------------------------------------------------------------------
  // SdkErrorType – enumeration
  // -------------------------------------------------------------------------

  /**
   * The types of errors that the YouTube Playables SDK throws.
   */
  enum SdkErrorType {
    /** The API was temporarily unavailable. Ask players to retry. */
    API_UNAVAILABLE = "API_UNAVAILABLE",
    /** The API was called with invalid parameters. */
    INVALID_PARAMS = "INVALID_PARAMS",
    /** The API was called with parameters exceeding the size limit. */
    SIZE_LIMIT_EXCEEDED = "SIZE_LIMIT_EXCEEDED",
    /** The error type is unknown. */
    UNKNOWN = "UNKNOWN",
  }

  // -------------------------------------------------------------------------
  // SdkError – class
  // -------------------------------------------------------------------------

  /**
   * The error object that the YouTube Playables SDK throws.
   * Extends the standard `Error` with an extra `errorType` field.
   */
  class SdkError extends Error {
    /** Specific type of the error — see `SdkErrorType`. */
    readonly errorType: SdkErrorType;
    readonly message: string;
    readonly name: string;
    readonly stack?: string;
    constructor(message: string, errorType: SdkErrorType);
  }

  // -------------------------------------------------------------------------
  // ytgame.ads – namespace
  // -------------------------------------------------------------------------

  namespace ads {
    /**
     * Requests an interstitial ad to be shown.
     * Makes no guarantee the ad was displayed.
     * Do **not** use to reward players for watching.
     *
     * @example
     * try {
     *   await ytgame.ads.requestInterstitialAd();
     * } catch (error) {
     *   // error may be undefined
     * }
     */
    function requestInterstitialAd(): Promise<void>;

    /**
     * Requests a rewarded ad to be shown for a particular reward type.
     *
     * @param rewardId - A unique, stable identifier for the reward type.
     *   Must NOT contain user data. Examples: "100-coins-reward-12", "skip-level".
     * @returns `true` if the user earned the reward, `false` otherwise.
     *
     * @example
     * const earned = await ytgame.ads.requestRewardedAd("extra-life-reward");
     * if (earned) { grantExtraLife(); }
     */
    function requestRewardedAd(rewardId: string): Promise<boolean>;
  }

  // -------------------------------------------------------------------------
  // ytgame.engagement – namespace
  // -------------------------------------------------------------------------

  namespace engagement {
    /** The possible types of YouTube content. */
    enum ContentType {
      /** A YouTube video. */
      VIDEO = "VIDEO",
      /** A YouTube Playable. */
      PLAYABLE = "PLAYABLE",
    }

    /** Content descriptor passed to `openYTContent`. */
    interface Content {
      /** The YouTube video or Playable ID. */
      id: string;
      /**
       * The type of content. Defaults to `VIDEO` if omitted.
       */
      contentType?: ContentType;
    }

    /** Score descriptor passed to `sendScore`. */
    interface Score {
      /**
       * Integer score value. Must be ≤ `Number.MAX_SAFE_INTEGER`.
       * YouTube displays the highest submitted score.
       */
      value: number;
    }

    /**
     * Requests YouTube to open content corresponding to the provided ID.
     * On web: opens a new tab. On mobile: videos open in mini-player;
     * Playables replace the current Playable.
     *
     * @example
     * await ytgame.engagement.openYTContent({
     *   id: videoID,
     *   contentType: ytgame.engagement.ContentType.VIDEO,
     * });
     */
    function openYTContent(content: Content): Promise<void>;

    /**
     * Sends a score to YouTube. Scores are sorted and the highest
     * is displayed in the YouTube UI.
     *
     * @example
     * await ytgame.engagement.sendScore({ value: 9800 });
     */
    function sendScore(score: Score): Promise<void>;
  }

  // -------------------------------------------------------------------------
  // ytgame.game – namespace
  // -------------------------------------------------------------------------

  namespace game {
    /**
     * Notifies YouTube that the game has begun showing frames.
     * **MUST** be called before `gameReady()`.
     * Not calling this prevents the game from being shown to users.
     *
     * @example
     * function onGameInitialized() { ytgame.game.firstFrameReady(); }
     */
    function firstFrameReady(): void;

    /**
     * Notifies YouTube that the game is ready for player interaction.
     * **MUST NOT** be called while a loading screen is still visible.
     *
     * @example
     * function onGameInteractable() { ytgame.game.gameReady(); }
     */
    function gameReady(): void;

    /**
     * Loads serialized game data from YouTube cloud save.
     * The game must handle parsing from string to internal format.
     *
     * @returns Serialized save string, or rejects with `SdkError`.
     *
     * @example
     * const data = await ytgame.game.loadData();
     * const save = JSON.parse(data);
     */
    function loadData(): Promise<string>;

    /**
     * Saves serialized game data to YouTube cloud save.
     * The string must be valid, well-formed UTF-16 and ≤ 3 MiB.
     * Use `String.prototype.isWellFormed()` to validate if needed.
     *
     * @param data - Serialized save string.
     *
     * @example
     * await ytgame.game.saveData(JSON.stringify(gameSave));
     */
    function saveData(data: string): Promise<void>;
  }

  // -------------------------------------------------------------------------
  // ytgame.health – namespace
  // -------------------------------------------------------------------------

  namespace health {
    /**
     * Logs an error to YouTube.
     * Best-effort and rate-limited — may result in data loss.
     *
     * @example
     * function onError() { ytgame.health.logError(); }
     */
    function logError(): void;

    /**
     * Logs a warning to YouTube.
     * Best-effort and rate-limited — may result in data loss.
     *
     * @example
     * function onWarning() { ytgame.health.logWarning(); }
     */
    function logWarning(): void;
  }

  // -------------------------------------------------------------------------
  // ytgame.system – namespace
  // -------------------------------------------------------------------------

  namespace system {
    /**
     * Returns the user's YouTube language setting as a BCP-47 tag.
     * Do NOT use other methods to determine locale or store it in cloud save.
     *
     * @returns BCP-47 tag, e.g. "en-US" or "es-419".
     *
     * @example
     * const localeTag = await ytgame.system.getLanguage();
     */
    function getLanguage(): Promise<string>;

    /**
     * Returns whether game audio is enabled in YouTube settings.
     * Use to initialize the game audio state.
     *
     * @example
     * if (ytgame.system.isAudioEnabled()) { enableAudio(); }
     */
    function isAudioEnabled(): boolean;

    /**
     * Registers a callback for audio enable/disable changes.
     * The game **MUST** use this to keep audio in sync with YouTube.
     *
     * @param callback - Called with the new audio state.
     * @returns A function to unregister the callback.
     *
     * @example
     * ytgame.system.onAudioEnabledChange((enabled) => { setAudio(enabled); });
     */
    function onAudioEnabledChange(
      callback: (isAudioEnabled: boolean) => void
    ): () => void;

    /**
     * Registers a callback triggered when YouTube pauses the game.
     * Called for all pause types including user exit. Save state immediately.
     * There is **no guarantee** the game will resume.
     *
     * @param callback - Called when a pause event fires.
     * @returns A function to unregister the callback.
     *
     * @example
     * ytgame.system.onPause(() => { pauseGame(); });
     */
    function onPause(callback: () => void): () => void;

    /**
     * Registers a callback triggered when YouTube resumes the game.
     * After being paused, the game is not guaranteed to resume.
     *
     * @param callback - Called when a resume event fires.
     * @returns A function to unregister the callback.
     *
     * @example
     * ytgame.system.onResume(() => { resumeGame(); });
     */
    function onResume(callback: () => void): () => void;
  }
}

// ---------------------------------------------------------------------------
// Augment Window so that `window.ytgame` is typed globally
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    ytgame?: typeof ytgame;
  }
}

export {};
