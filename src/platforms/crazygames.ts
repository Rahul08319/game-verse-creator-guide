import { GameAdapter, LocalAdapter } from './base';

declare global {
  interface Window {
    CrazyGames: any;
  }
}

export class CrazyGamesAdapter extends LocalAdapter implements GameAdapter {
  platform = 'crazygames';

  isActive(): boolean {
    return typeof window.CrazyGames !== 'undefined';
  }

  async init(): Promise<boolean> {
    try {
      if (!this.isActive()) return false;
      await window.CrazyGames.SDK.init();
      window.CrazyGames.SDK.game.sdkGameLoadingStart();
      return true;
    } catch (e) {
      this.logError('CrazyGames init error', e);
      return false;
    }
  }

  gameReady(): void {
    try {
      if (this.isActive()) {
        window.CrazyGames.SDK.game.sdkGameLoadingStop();
        window.CrazyGames.SDK.game.gameplay.start();
      }
    } catch (e) {}
  }

  async requestInterstitialAd(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (!this.isActive()) {
          this.logWarning('CrazyGames not active');
          return resolve(false);
        }
        window.CrazyGames.SDK.ad.requestAd('midgame', {
          adFinished: () => resolve(true),
          adError: () => {
            this.logWarning('CrazyGames ad error');
            resolve(false);
          },
          adStarted: () => {}
        });
      } catch (e) {
        this.logWarning('CrazyGames request error');
        resolve(false);
      }
    });
  }

  async requestRewardedAd(rewardId: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (!this.isActive()) {
          this.logWarning('CrazyGames not active');
          return resolve(false);
        }
        window.CrazyGames.SDK.ad.requestAd('rewarded', {
          adFinished: () => resolve(true),
          adError: () => {
            this.logWarning('CrazyGames ad error');
            resolve(false);
          },
          adStarted: () => {}
        });
      } catch (e) {
        this.logWarning('CrazyGames request error');
        resolve(false);
      }
    });
  }

  async getLanguage(): Promise<string | null> {
    try {
      if (this.isActive()) return window.CrazyGames.SDK.environment.lang;
    } catch {}
    return super.getLanguage();
  }
}
