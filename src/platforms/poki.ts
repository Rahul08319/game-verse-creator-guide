import { GameAdapter, LocalAdapter } from './base';

declare global {
  interface Window {
    PokiSDK: any;
  }
}

export class PokiAdapter extends LocalAdapter implements GameAdapter {
  platform = 'poki';

  isActive(): boolean {
    return typeof window.PokiSDK !== 'undefined';
  }

  async init(): Promise<boolean> {
    try {
      if (!this.isActive()) return false;
      await window.PokiSDK.init();
      window.PokiSDK.gameLoadingStart();
      return true;
    } catch (e) {
      this.logError('Poki init error', e);
      return false;
    }
  }

  gameReady(): void {
    try {
      if (this.isActive()) {
        window.PokiSDK.gameLoadingFinished();
        window.PokiSDK.gameplayStart();
      }
    } catch (e) {}
  }

  async requestInterstitialAd(): Promise<boolean> {
    try {
      if (!this.isActive()) {
        this.logWarning('Poki interstitial not supported here');
        return false;
      }
      window.PokiSDK.gameplayStop();
      await window.PokiSDK.commercialBreak();
      window.PokiSDK.gameplayStart();
      return true;
    } catch (e) {
      this.logWarning('Poki ad error');
      window.PokiSDK.gameplayStart();
      return false;
    }
  }

  async requestRewardedAd(rewardId: string): Promise<boolean> {
    try {
      if (!this.isActive()) {
        this.logWarning('Poki rewarded not supported here');
        return false;
      }
      window.PokiSDK.gameplayStop();
      const success = await window.PokiSDK.rewardedBreak();
      window.PokiSDK.gameplayStart();
      return success;
    } catch (e) {
      this.logWarning('Poki ad error');
      window.PokiSDK.gameplayStart();
      return false;
    }
  }
}
