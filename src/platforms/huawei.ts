import { GameAdapter, LocalAdapter } from './base';

declare global {
  interface Window {
    hbs: any;
    miapp: any;
  }
}

export class HuaweiAdapter extends LocalAdapter implements GameAdapter {
  platform = 'huawei';

  isActive(): boolean {
    return typeof window.hbs !== 'undefined' || 
           typeof window.miapp !== 'undefined' ||
           window.navigator.userAgent.includes('HuaweiBrowser') ||
           window.navigator.userAgent.includes('HUAWEI');
  }

  // Quick games use their own storage APIs
}
