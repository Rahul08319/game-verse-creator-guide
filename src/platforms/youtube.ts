import { GameAdapter, LocalAdapter } from './base';
import { YouTubePlayables, REWARD_IDS } from '../utils/youtubePlayables';

/**
 * YouTube Playables SDK Adapter
 * Wraps the full YouTube Playables SDK specification into the universal GameAdapter interface.
 */
export class YouTubeAdapter extends LocalAdapter implements GameAdapter {
  platform = 'youtube';

  isActive(): boolean {
    return YouTubePlayables.isActive();
  }

  async init(): Promise<boolean> {
    try {
      if (!this.isActive()) return false;
      return await YouTubePlayables.init({
        onPause: () => {
          // Pause logic handled by system listeners
        },
        onResume: () => {
          // Resume logic handled by system listeners
        },
      });
    } catch (e) {
      this.logError('YouTube Playables init failed', e);
      return false;
    }
  }

  firstFrameReady(): void {
    if (this.isActive()) {
      YouTubePlayables.firstFrameReady();
    }
  }

  gameReady(): void {
    if (this.isActive()) {
      YouTubePlayables.gameReady();
    }
  }

  async loadData<T>(): Promise<T | null> {
    try {
      if (this.isActive()) {
        return await YouTubePlayables.loadData<T>();
      }
      return super.loadData<T>();
    } catch (e) {
      this.logError('YouTube loadData failed', e);
      return super.loadData<T>();
    }
  }

  async saveData(data: Record<string, unknown>): Promise<boolean> {
    try {
      if (this.isActive()) {
        return await YouTubePlayables.saveData(data);
      }
      return super.saveData(data);
    } catch (e) {
      this.logError('YouTube saveData failed', e);
      return super.saveData(data);
    }
  }

  async sendScore(score: number): Promise<void> {
    try {
      if (this.isActive()) {
        await YouTubePlayables.sendScore(score);
      }
    } catch (e) {
      this.logError('YouTube sendScore failed', e);
    }
  }

  async requestInterstitialAd(): Promise<boolean> {
    try {
      if (this.isActive()) {
        return await YouTubePlayables.requestInterstitialAd();
      }
      return false;
    } catch (e) {
      this.logWarning('YouTube interstitial ad request failed');
      return false;
    }
  }

  async requestRewardedAd(rewardId: string = REWARD_IDS.EXTRA_LIFE): Promise<boolean> {
    try {
      if (this.isActive()) {
        return await YouTubePlayables.requestRewardedAd(rewardId);
      }
      return false;
    } catch (e) {
      this.logWarning('YouTube rewarded ad request failed');
      return false;
    }
  }

  async getLanguage(): Promise<string | null> {
    try {
      if (this.isActive()) {
        return await YouTubePlayables.getLanguage();
      }
      return super.getLanguage();
    } catch {
      return super.getLanguage();
    }
  }

  isAudioEnabled(): boolean {
    if (this.isActive()) {
      return YouTubePlayables.isAudioEnabled();
    }
    return super.isAudioEnabled();
  }

  logError(msg?: string, err?: any): void {
    YouTubePlayables.logError();
    super.logError(msg, err);
  }

  logWarning(msg?: string): void {
    YouTubePlayables.logWarning();
    super.logWarning(msg);
  }

  cleanup(): void {
    YouTubePlayables.cleanup();
    super.cleanup();
  }
}
