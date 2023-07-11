/**
 * @jest-environment jsdom
 */

import { BrowserSessionManager } from '../../../sdk/session-managers';

describe('BrowserSessionManager', () => {
  const sessionManager = new BrowserSessionManager();

  afterEach(() => {
    sessionManager.destroySession();
  });

  describe('new BrowserSessionManager()', () => {
    it('can construct BrowserSessionManager instance', () => {
      expect(() => new BrowserSessionManager()).not.toThrowError();
    });
  });

  describe('destroySession()', () => {
    it('clears all items in session after being called', () => {
      const sessionItemKey = 'session-item-key';
      sessionManager.setSessionItem(sessionItemKey, 'session-key-value');
      sessionManager.destroySession();
      expect(sessionManager.getSessionItem(sessionItemKey)).toBe(null);
    });
  });

  describe('setSessionItem()', () => {
    it('stores a value against the provided key in memory', () => {
      const sessionItemKey = 'session-item-key';
      const sessionItemValue = 'session-item-value';
      sessionManager.setSessionItem(sessionItemKey, sessionItemValue);
      expect(sessionManager.getSessionItem(sessionItemKey)).toBe(
        sessionItemValue
      );
    });
  });

  describe('removeSessionItem()', () => {
    it('removes a session item from memory', () => {
      const sessionItemKey = 'session-item-key';
      const sessionItemValue = 'session-item-value';
      sessionManager.setSessionItem(sessionItemKey, sessionItemValue);
      expect(sessionManager.getSessionItem(sessionItemKey)).toBe(
        sessionItemValue
      );
      sessionManager.removeSessionItem(sessionItemKey);
      expect(sessionManager.getSessionItem(sessionItemKey)).toBe(null);
    });
  });

  describe('setBrowserSessionItem()', () => {
    it('stores a value against the provided key in the browser\'s session storage', () => {
      const sessionItemKey = 'session-item-key';
      const sessionItemValue = 'session-item-value';
      sessionManager.setSessionItemBrowser(sessionItemKey, sessionItemValue);
      expect(sessionManager.getSessionItemBrowser(sessionItemKey)).toBe(
        sessionItemValue
      );
    });
  });

  describe('removeBrowserSessionItem()', () => {
    it('removes a session item from the browser\'s session storage', () => {
      const sessionItemKey = 'session-item-key';
      const sessionItemValue = 'session-item-value';
      sessionManager.setSessionItemBrowser(sessionItemKey, sessionItemValue);
      expect(sessionManager.getSessionItemBrowser(sessionItemKey)).toBe(
        sessionItemValue
      );
      sessionManager.removeSessionItemBrowser(sessionItemKey);
      expect(sessionManager.getSessionItemBrowser(sessionItemKey)).toBe(null);
    });
  });
});
