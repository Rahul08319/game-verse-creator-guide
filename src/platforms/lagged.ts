import { GameAdapter, LocalAdapter } from './base';

export class LaggedAdapter extends LocalAdapter implements GameAdapter {
  platform = 'lagged';

  isActive(): boolean {
    return window.location.hostname.includes('lagged.com');
  }

  async init(): Promise<boolean> {
    return true; // standard HTML5
  }
}
