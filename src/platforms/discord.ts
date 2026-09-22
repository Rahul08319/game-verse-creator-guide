import { GameAdapter, LocalAdapter } from './base';

export class DiscordAdapter extends LocalAdapter implements GameAdapter {
  platform = 'discord';
  private sdk: any;

  isActive(): boolean {
    return window.location.href.includes('discord') || window.parent !== window;
  }

  async init(): Promise<boolean> {
    try {
      if (!this.isActive()) return false;
      // Normally: import { DiscordSDK } from '@discord/embedded-app-sdk';
      // this.sdk = new DiscordSDK(CLIENT_ID);
      // await this.sdk.ready();
      // await this.sdk.commands.authorize({...});
      return true;
    } catch (e) {
      this.logError('Discord init error', e);
      return false;
    }
  }

  async getLanguage(): Promise<string | null> {
    return super.getLanguage(); // fallback or get from sdk.instanceParticipants
  }
}
