import { GameAdapter, LocalAdapter } from './base';

declare global {
  interface Window {
    Windows: any;
  }
}

export class MicrosoftAdapter extends LocalAdapter implements GameAdapter {
  platform = 'microsoft';

  isActive(): boolean {
    return typeof window.Windows !== 'undefined' || window.navigator.userAgent.includes('Edge');
  }

  async loadData<T>(): Promise<T | null> {
    try {
      if (typeof window.Windows !== 'undefined') {
        const data = window.Windows.Storage.ApplicationData.current.localSettings.values['gameData'];
        return data ? JSON.parse(data) : null;
      }
    } catch (e) {
      this.logError('MS load error', e);
    }
    return super.loadData();
  }

  async saveData(data: Record<string, unknown>): Promise<boolean> {
    try {
      if (typeof window.Windows !== 'undefined') {
        window.Windows.Storage.ApplicationData.current.localSettings.values['gameData'] = JSON.stringify(data);
        return true;
      }
    } catch (e) {
      this.logError('MS save error', e);
    }
    return super.saveData(data);
  }
}
