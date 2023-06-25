import { isBrowserEnvironment } from '../environment';
import { type SessionManager } from './types';

export class BrowserSessionManager implements SessionManager {
  public static ITEM_NAME_PREFIX = 'browser-session-store@';
  private memCache: Record<string, unknown> = {};

  constructor() {
    if (!isBrowserEnvironment()) {
      throw new Error(
        'BrowserSessionStore must be instantiated on the browser'
      );
    }
  }

  private generateItemKey(itemKey: string): string {
    return `${BrowserSessionManager.ITEM_NAME_PREFIX}${itemKey}`;
  }

  destroySession(): void {
    sessionStorage.clear();
    this.memCache = {};
  }

  setSessionItem(itemKey: string, itemValue: unknown): void {
    const key = this.generateItemKey(itemKey);
    this.memCache[key] = itemValue;
  }

  setSessionItemBrowser(itemKey: string, itemValue: unknown): void {
    const key = this.generateItemKey(itemKey);
    const isString = typeof itemValue === 'string';
    const value = !isString ? JSON.stringify(itemValue) : itemValue;
    sessionStorage.setItem(key, value);
  }

  getSessionItem(itemKey: string): unknown | null {
    const key = this.generateItemKey(itemKey);
    return this.memCache[key] ?? null;
  }

  getSessionItemBrowser(itemKey: string): unknown | null {
    const key = this.generateItemKey(itemKey);
    return sessionStorage.getItem(key);
  }

  removeSessionItem(itemKey: string): void {
    const key = this.generateItemKey(itemKey);
    delete this.memCache[key];
  }

  removeSessionItemBrowser(itemKey: string): void {
    const key = this.generateItemKey(itemKey);
    sessionStorage.removeItem(key);
  }
}
