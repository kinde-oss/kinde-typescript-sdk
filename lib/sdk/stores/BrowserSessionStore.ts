import type { Store } from './types';

export class BrowserSessionStore implements Store {
  public static ItemNamePrefix = 'browser-session-store@';

  setItem(itemKey: string, itemValue: string): void {
    const key = this.generateItemKey(itemKey);
    sessionStorage.setItem(key, itemValue);
  }

  getItem(itemKey: string): string | null {
    const key = this.generateItemKey(itemKey);
    return sessionStorage.getItem(key);
  }

  removeItem(itemKey: string): void {
    const key = this.generateItemKey(itemKey);
    sessionStorage.removeItem(key);
  }

  clear(): void {
    sessionStorage.clear();
  }

  private generateItemKey(itemKey: string): string {
    return `${BrowserSessionStore.ItemNamePrefix}${itemKey}`;
  }
}
