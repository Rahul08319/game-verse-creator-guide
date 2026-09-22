import { GameAdapter, LocalAdapter } from './base';

declare global {
  interface Window {
    __gdjs: any;
    GD_OPTIONS: any;
    gdsdk: any;
  }
}

export class GameDistributionAdapter extends LocalAdapter implements GameAdapter {
  platform = 'gamedistribution';

  isActive(): boolean {
    return typeof window.gdsdk !== 'undefined' || typeof window.GD_OPTIONS !== 'undefined';
  }

  async init(): Promise<boolean> {
    try {
      if (!this.isActive()) return false;
      window.GD_OPTIONS = {
        gameId: 'GAME_ID',
        onEvent: (event: any) => {
          // Handle SDK_READY, SDK_ERROR, SDK_GAME_START, SDK_GAME_PAUSE, SDK_GAME_RESUME
        }
      };
      return true;
    } catch (e) {
      this.logError('GD init error', e);
      return false;
    }
  }

  async requestInterstitialAd(): Promise<boolean> {
    try {
      if (!this.isActive() || !window.gdsdk) {
        this.logWarning('GD SDK not active');
        return false;
      }
      window.gdsdk.showAd('interstitial');
      return true;
    } catch (e) {
      this.logWarning('GD interstitial error');
      return false;
    }
  }

  async requestRewardedAd(rewardId: string): Promise<boolean> {
    try {
      if (!this.isActive() || !window.gdsdk) {
        this.logWarning('GD SDK not active');
        return false;
      }
      window.gdsdk.showAd('rewarded');
      return true; // We don't have promise-based callback here, just assuming triggered
    } catch (e) {
      this.logWarning('GD rewarded error');
      return false;
    }
  }
}
