import { GameAdapter, LocalAdapter } from './base';

declare global {
  interface Window {
    FBInstant: any;
  }
}

export class FacebookAdapter extends LocalAdapter implements GameAdapter {
  platform = 'facebook';
  private INTERSTITIAL_AD_PLACEMENT = 'INTERSTITIAL_AD_PLACEMENT';
  private REWARDED_VIDEO_PLACEMENT = 'REWARDED_VIDEO_PLACEMENT';
  private pauseCbs: (() => void)[] = [];

  isActive(): boolean {
    return typeof window.FBInstant !== 'undefined';
  }

  async init(): Promise<boolean> {
    try {
      if (!this.isActive()) return false;
      await window.FBInstant.initializeAsync();
      await window.FBInstant.startGameAsync();
      window.FBInstant.onPause(() => this.pauseCbs.forEach(cb => cb()));
      return true;
    } catch (e) {
      this.logError('FB init error', e);
      return false;
    }
  }

  firstFrameReady(): void {
    if (this.isActive()) window.FBInstant.setLoadingProgress(50);
  }

  gameReady(): void {
    if (this.isActive()) window.FBInstant.setLoadingProgress(100);
  }

  async loadData<T>(): Promise<T | null> {
    try {
      if (!this.isActive()) return super.loadData();
      const data = await window.FBInstant.player.getDataAsync(['gameData']);
      return data.gameData ? JSON.parse(data.gameData) : null;
    } catch (e) {
      this.logError('FB load error', e);
      return super.loadData();
    }
  }

  async saveData(data: Record<string, unknown>): Promise<boolean> {
    try {
      if (!this.isActive()) return super.saveData(data);
      await window.FBInstant.player.setDataAsync({ gameData: JSON.stringify(data) });
      await window.FBInstant.player.flushDataAsync();
      return true;
    } catch (e) {
      this.logError('FB save error', e);
      return super.saveData(data);
    }
  }

  async sendScore(score: number): Promise<void> {
    // Basic implementation
  }

  async requestInterstitialAd(): Promise<boolean> {
    try {
      if (!this.isActive()) {
        this.logWarning('FBInstant not active for ads');
        return false;
      }
      const ad = await window.FBInstant.getInterstitialAdAsync(this.INTERSTITIAL_AD_PLACEMENT);
      await ad.loadAsync();
      await ad.showAsync();
      return true;
    } catch (e) {
      this.logWarning('FB interstitial ad error');
      return false;
    }
  }

  async requestRewardedAd(rewardId: string): Promise<boolean> {
    try {
      if (!this.isActive()) {
        this.logWarning('FBInstant not active for ads');
        return false;
      }
      const ad = await window.FBInstant.getRewardedVideoAsync(this.REWARDED_VIDEO_PLACEMENT);
      await ad.loadAsync();
      await ad.showAsync();
      return true;
    } catch (e) {
      this.logWarning('FB rewarded ad error');
      return false;
    }
  }

  async getLanguage(): Promise<string | null> {
    try {
      if (this.isActive()) return window.FBInstant.getLocale();
    } catch {}
    return super.getLanguage();
  }

  onPause(cb: () => void): () => void {
    this.pauseCbs.push(cb);
    return () => { this.pauseCbs = this.pauseCbs.filter(c => c !== cb); };
  }
}
