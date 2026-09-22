import { GameAdapter, LocalAdapter } from './base';

declare global {
  interface Window {
    Y8: any;
    id_net_sdk: any;
  }
}

export class Y8Adapter extends LocalAdapter implements GameAdapter {
  platform = 'y8';

  isActive(): boolean {
    return typeof window.Y8 !== 'undefined' || typeof window.id_net_sdk !== 'undefined';
  }

  async init(): Promise<boolean> {
    try {
      if (!this.isActive()) return false;
      if (window.Y8) {
        window.Y8.init({ game_id: 'GAME_ID' });
      }
      return true;
    } catch (e) {
      this.logError('Y8 init error', e);
      return false;
    }
  }

  async sendScore(score: number): Promise<void> {
    try {
      if (this.isActive() && window.Y8) {
        window.Y8.submitScore({ game_id: 'GAME_ID', score, table: 'main' });
      }
    } catch (e) {}
  }

  async requestInterstitialAd(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (!this.isActive() || !window.Y8) {
          this.logWarning('Y8 ad not active');
          return resolve(false);
        }
        window.Y8.onAdComplete = () => resolve(true);
        window.Y8.onAdError = () => resolve(false);
        window.Y8.showAd({ type: 'interstitial' });
      } catch (e) {
        resolve(false);
      }
    });
  }
}
