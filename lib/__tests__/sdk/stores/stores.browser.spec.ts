/** @jest-environment jsdom */

import { BrowserSessionStore } from '../../../sdk/stores/BrowserSessionStore';
import { sessionStore, memoryStore } from '../../../sdk/stores';

describe('stores', () => {
  it('checks if sessionStore is memoStore for node environment', () => {
    expect(sessionStore).toBeInstanceOf(BrowserSessionStore);
    expect(sessionStore).not.toBe(memoryStore);
  });
});
