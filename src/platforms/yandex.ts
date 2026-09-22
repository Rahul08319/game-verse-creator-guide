import { GameAdapter, LocalAdapter } from './base';

declare global {
  interface Window {
    YaGames: any;
  }
}

export class YandexAdapter extends LocalAdapter implements GameAdapter {
  platform = 'yandex';
  private ysdk: any;
  private player: any;

  isActive(): boolean {
    return typeof window.YaGames !== 'undefined';
  }

  async init(): Promise<boolean> {
    try {
      if (!this.isActive()) return false;
      this.ysdk = await window.YaGames.init();
      try {
        this.player = await this.ysdk.getPlayer();
      } catch (e) {
        this.logError('Yandex player error', e);
      }
      return true;
    } catch (e) {
      this.logError('Yandex init error', e);
      return false;
    }
  }

  gameReady(): void {
    try {
      if (this.ysdk && this.ysdk.features.LoadingAPI) {
        this.ysdk.features.LoadingAPI.ready();
      }
    } catch (e) {}
  }

  async loadData<T>(): Promise<T | null> {
    try {
      if (!this.player) return super.loadData();
      const data = await this.player.getData();
      return data || null;
    } catch (e) {
      return super.loadData();
    }
  }

  async saveData(data: Record<string, unknown>): Promise<boolean> {
    try {
      if (!this.player) return super.saveData(data);
      await this.player.setData(data);
      return true;
    } catch (e) {
      return super.saveData(data);
    }
  }

  async sendScore(score: number): Promise<void> {
    try {
      if (this.ysdk) {
        const lb = await this.ysdk.getLeaderboards();
        await lb.setLeaderboardScore('game', score);
      }
    } catch (e) {
      this.logError('Yandex sendScore error', e);
    }
  }

  async requestInterstitialAd(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (!this.ysdk) {
          this.logWarning('Yandex not active');
          return resolve(false);
        }
        this.ysdk.adv.showFullscreenAdv({
          callbacks: {
            onClose: () => resolve(true),
            onError: () => resolve(false)
          }
        });
      } catch (e) {
        resolve(false);
      }
    });
  }

  async requestRewardedAd(rewardId: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (!this.ysdk) {
          this.logWarning('Yandex not active');
          return resolve(false);
        }
        this.ysdk.adv.showRewardedVideo({
          callbacks: {
            onRewarded: () => {},
            onClose: () => resolve(true),
            onError: () => resolve(false)
          }
        });
      } catch (e) {
        resolve(false);
      }
    });
  }

  async getLanguage(): Promise<string | null> {
    try {
      if (this.ysdk) return this.ysdk.environment.i18n.lang;
    } catch {}
    return super.getLanguage();
  }
}
