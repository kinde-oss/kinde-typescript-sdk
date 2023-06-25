import { isBrowserEnvironment } from '../environment';
import { type SessionManager } from './types';

/**
 * Provides a session manager implementation for the browser.
 * @class BrowserSessionManager
 */
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

  /**
   * Prefixes provided item key with class static prefix.
   * @param {string} itemKey
   * @returns {string}
   */
  private generateItemKey(itemKey: string): string {
    return `${BrowserSessionManager.ITEM_NAME_PREFIX}${itemKey}`;
  }

  /**
   * Clears all items from session store.
   * @returns {void}
   */
  destroySession(): void {
    sessionStorage.clear();
    this.memCache = {};
  }

  /**
   * Sets the provided key-value store to the memory cache.
   * @param {string} itemKey
   * @param {unknown} itemValue
   * @returns {void}
   */
  setSessionItem(itemKey: string, itemValue: unknown): void {
    const key = this.generateItemKey(itemKey);
    this.memCache[key] = itemValue;
  }

  /**
   * Sets the provided key-value store to the browser session storage.
   * @param {string} itemKey
   * @param {unknown} itemValue
   */
  setSessionItemBrowser(itemKey: string, itemValue: unknown): void {
    const key = this.generateItemKey(itemKey);
    const isString = typeof itemValue === 'string';
    const value = !isString ? JSON.stringify(itemValue) : itemValue;
    sessionStorage.setItem(key, value);
  }

  /**
   * Gets the item for the provided key from the memory cache.
   * @param {string} itemKey
   * @returns {unknown | null}
   */
  getSessionItem(itemKey: string): unknown | null {
    const key = this.generateItemKey(itemKey);
    return this.memCache[key] ?? null;
  }

  /**
   * Gets the item for the provided key from the browser session storage.
   * @param {string} itemKey
   * @returns {unknown | null}
   */
  getSessionItemBrowser(itemKey: string): unknown | null {
    const key = this.generateItemKey(itemKey);
    return sessionStorage.getItem(key);
  }

  /**
   * Removes the item for the provided key from the memory cache.
   * @param {string} itemKey
   * @returns {void}
   */
  removeSessionItem(itemKey: string): void {
    const key = this.generateItemKey(itemKey);
    delete this.memCache[key];
  }

  /**
   * Removes the item for the provided key from the browser session storage.
   * @param {string} itemKey
   * @returns {void}
   */
  removeSessionItemBrowser(itemKey: string): void {
    const key = this.generateItemKey(itemKey);
    sessionStorage.removeItem(key);
  }
}
