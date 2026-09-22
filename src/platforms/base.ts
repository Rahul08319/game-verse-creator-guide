export interface GameAdapter {
  platform: string;
  init(): Promise<boolean>;
  firstFrameReady(): void;
  gameReady(): void;
  loadData<T>(): Promise<T | null>;
  saveData(data: Record<string, unknown>): Promise<boolean>;
  sendScore(score: number): Promise<void>;
  requestInterstitialAd(): Promise<boolean>;
  requestRewardedAd(rewardId: string): Promise<boolean>;
  getLanguage(): Promise<string | null>;
  onPause(cb: () => void): () => void;
  onResume(cb: () => void): () => void;
  isAudioEnabled(): boolean;
  onAudioEnabledChange(cb: (enabled: boolean) => void): () => void;
  logError(msg?: string, err?: any): void;
  logWarning(msg?: string): void;
  cleanup(): void;
  isActive(): boolean;
}

export class LocalAdapter implements GameAdapter {
  platform = 'local';
  private pauseCbs: (() => void)[] = [];
  private resumeCbs: (() => void)[] = [];

  async init(): Promise<boolean> {
    console.log('[LocalAdapter] init');
    return true;
  }
  firstFrameReady(): void {}
  gameReady(): void {}
  async loadData<T>(): Promise<T | null> {
    try {
      const data = localStorage.getItem('local_save_data');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  async saveData(data: Record<string, unknown>): Promise<boolean> {
    try {
      localStorage.setItem('local_save_data', JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }
  async sendScore(score: number): Promise<void> {}
  async requestInterstitialAd(): Promise<boolean> { return false; }
  async requestRewardedAd(rewardId: string): Promise<boolean> { return false; }
  async getLanguage(): Promise<string | null> { return navigator.language; }
  onPause(cb: () => void): () => void {
    this.pauseCbs.push(cb);
    return () => { this.pauseCbs = this.pauseCbs.filter(c => c !== cb); };
  }
  onResume(cb: () => void): () => void {
    this.resumeCbs.push(cb);
    return () => { this.resumeCbs = this.resumeCbs.filter(c => c !== cb); };
  }
  isAudioEnabled(): boolean { return true; }
  onAudioEnabledChange(cb: (enabled: boolean) => void): () => void { return () => {}; }
  logError(msg?: string, err?: any): void { console.error(msg, err); }
  logWarning(msg?: string): void { console.warn(msg); }
  cleanup(): void {
    this.pauseCbs = [];
    this.resumeCbs = [];
  }
  isActive(): boolean { return true; }
}
