/**
 * @jest-environment jsdom
 */

import { BrowserSessionManager } from '../../../sdk/session-managers';

describe('BrowserSessionManager', () => {
  const sessionManager = new BrowserSessionManager();

  afterEach(async () => {
    await sessionManager.destroySession();
  });

  describe('new BrowserSessionManager()', () => {
    it('can construct BrowserSessionManager instance', () => {
      expect(() => new BrowserSessionManager()).not.toThrowError();
    });
  });

  describe('destroySession()', () => {
    it('clears all items in session after being called', async () => {
      const sessionItemKey = 'session-item-key';
      await sessionManager.setSessionItem(sessionItemKey, 'session-key-value');
      await sessionManager.destroySession();
      expect(await sessionManager.getSessionItem(sessionItemKey)).toBe(null);
    });
  });

  describe('setSessionItem()', () => {
    it('stores a value against the provided key in memory', async () => {
      const sessionItemKey = 'session-item-key';
      const sessionItemValue = 'session-item-value';
      await sessionManager.setSessionItem(sessionItemKey, sessionItemValue);
      expect(await sessionManager.getSessionItem(sessionItemKey)).toBe(
        sessionItemValue
      );
    });
  });

  describe('removeSessionItem()', () => {
    it('removes a session item from memory', async () => {
      const sessionItemKey = 'session-item-key';
      const sessionItemValue = 'session-item-value';
      await sessionManager.setSessionItem(sessionItemKey, sessionItemValue);
      expect(await sessionManager.getSessionItem(sessionItemKey)).toBe(
        sessionItemValue
      );
      await sessionManager.removeSessionItem(sessionItemKey);
      expect(await sessionManager.getSessionItem(sessionItemKey)).toBe(null);
    });
  });

  describe('setBrowserSessionItem()', () => {
    it('stores a value against the provided key in the browser\'s session storage', async () => {
      const sessionItemKey = 'session-item-key';
      const sessionItemValue = 'session-item-value';
      await sessionManager.setSessionItemBrowser(
        sessionItemKey,
        sessionItemValue
      );
      expect(await sessionManager.getSessionItemBrowser(sessionItemKey)).toBe(
        sessionItemValue
      );
    });
  });

  describe('removeBrowserSessionItem()', () => {
    it('removes a session item from the browser\'s session storage', async () => {
      const sessionItemKey = 'session-item-key';
      const sessionItemValue = 'session-item-value';
      await sessionManager.setSessionItemBrowser(
        sessionItemKey,
        sessionItemValue
      );
      expect(await sessionManager.getSessionItemBrowser(sessionItemKey)).toBe(
        sessionItemValue
      );
      await sessionManager.removeSessionItemBrowser(sessionItemKey);
      expect(await sessionManager.getSessionItemBrowser(sessionItemKey)).toBe(
        null
      );
    });
  });
});
