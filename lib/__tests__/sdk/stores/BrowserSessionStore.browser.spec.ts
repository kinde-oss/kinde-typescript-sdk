/* @jest-environment jsdom */

import { BrowserSessionStore as SessionStore } from '../../../sdk/stores/BrowserSessionStore';

describe('BrowserSessionStore', () => {
  const itemValue = JSON.stringify({ value: 'test-item-value' });
  const itemKey = 'test-item-key';

  it('can create sessionStore instance', () => {
    expect(() => new SessionStore()).not.toThrowError();
  });

  it('will return null if there is no item against key', () => {
    const sessionStore = new SessionStore();
    expect(sessionStore.getItem(itemKey)).toBe(null);
  });

  it('will add item to store once setItem is called', () => {
    const sessionStore = new SessionStore();
    sessionStore.setItem(itemKey, itemValue);
    expect(sessionStore.getItem(itemKey)).toBe(itemValue);
  });

  it('will return null for key after it is removed', () => {
    const sessionStore = new SessionStore();
    sessionStore.removeItem(itemKey);
    expect(sessionStore.getItem(itemKey)).toBe(null);
  });

  it('will empty store once clear() is called', () => {
    const sessionStore = new SessionStore();
    sessionStore.setItem(`${itemKey}-0`, itemValue);
    sessionStore.setItem(`${itemKey}-1`, itemValue);
    sessionStore.clear();
    expect(sessionStore.getItem(`${itemKey}-0`)).toBe(null);
    expect(sessionStore.getItem(`${itemKey}-1`)).toBe(null);
  });
});
