import { GameAdapter, LocalAdapter } from './base';

export class MsnAdapter extends LocalAdapter implements GameAdapter {
  platform = 'msn';

  isActive(): boolean {
    return window.parent !== window && 
           (document.referrer.includes('msn.com') || document.referrer.includes('reddit.com'));
  }

  async init(): Promise<boolean> {
    try {
      if (this.isActive()) {
        window.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'PAUSE') {
            // handle pause
          }
        });
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  gameReady(): void {
    try {
      if (this.isActive()) {
        window.parent.postMessage({ type: 'GAME_LOADED' }, '*');
      }
    } catch (e) {}
  }

  async sendScore(score: number): Promise<void> {
    try {
      if (this.isActive()) {
        window.parent.postMessage({ type: 'SCORE_UPDATE', score }, '*');
      }
    } catch (e) {}
  }
}
