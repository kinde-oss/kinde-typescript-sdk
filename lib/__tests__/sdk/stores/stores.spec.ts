import { sessionStore, memoryStore } from '../../../sdk/stores';
import { MemoryStore } from '../../../sdk/stores/MemoryStore';

describe('stores', () => {
  it('checks if sessionStore is memoStore for node environment', () => {
    expect(sessionStore).toBeInstanceOf(MemoryStore);
    expect(sessionStore).toBe(memoryStore);
  });
});
