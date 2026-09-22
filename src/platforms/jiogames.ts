import { GameAdapter, LocalAdapter } from './base';

declare global {
  interface Window {
    JioGames: any;
  }
}

export class JioGamesAdapter extends LocalAdapter implements GameAdapter {
  platform = 'jiogames';

  isActive(): boolean {
    return typeof window.JioGames !== 'undefined';
  }

  async init(): Promise<boolean> {
    try {
      if (!this.isActive()) return false;
      window.JioGames.init();
      return true;
    } catch (e) {
      this.logError('JioGames init error', e);
      return false;
    }
  }

  gameReady(): void {
    try {
      if (this.isActive()) window.JioGames.onReady();
    } catch (e) {}
  }

  async loadData<T>(): Promise<T | null> {
    try {
      if (!this.isActive()) return super.loadData();
      const data = window.JioGames.loadData('gameData');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return super.loadData();
    }
  }

  async saveData(data: Record<string, unknown>): Promise<boolean> {
    try {
      if (!this.isActive()) return super.saveData(data);
      window.JioGames.saveData('gameData', JSON.stringify(data));
      return true;
    } catch (e) {
      return super.saveData(data);
    }
  }

  async sendScore(score: number): Promise<void> {
    try {
      if (this.isActive()) window.JioGames.submitScore(score);
    } catch (e) {}
  }

  async requestInterstitialAd(): Promise<boolean> {
    try {
      if (!this.isActive()) {
        this.logWarning('JioGames ads not available');
        return false;
      }
      window.JioGames.showAd();
      return true;
    } catch (e) {
      this.logWarning('JioGames ad error');
      return false;
    }
  }
}
