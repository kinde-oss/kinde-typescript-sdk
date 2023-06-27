import { MemoryStore } from '../../../sdk/stores/MemoryStore';

describe('MemoryStore', () => {
  const itemValue = { value: 'test-item-value' };
  const itemKey = 'test-item-key';

  it('can create MemoryStore instance', () => {
    expect(() => new MemoryStore()).not.toThrowError();
  });

  it('will return null if there is no item against key', () => {
    const memoryStore = new MemoryStore();
    expect(memoryStore.getItem(itemKey)).toBe(null);
  });

  it('will add item to store once setItem is called', () => {
    const memoryStore = new MemoryStore();
    memoryStore.setItem(itemKey, itemValue);
    expect(memoryStore.getItem(itemKey)).toBe(itemValue);
  });

  it('will return null for key after it is removed', () => {
    const memoryStore = new MemoryStore();
    memoryStore.removeItem(itemKey);
    expect(memoryStore.getItem(itemKey)).toBe(null);
  });

  it('will empty store once clear() is called', () => {
    const memoryStore = new MemoryStore();
    memoryStore.setItem(`${itemKey}-0`, itemValue);
    memoryStore.setItem(`${itemKey}-1`, itemValue);
    memoryStore.clear();
    expect(memoryStore.getItem(`${itemKey}-0`)).toBe(null);
    expect(memoryStore.getItem(`${itemKey}-1`)).toBe(null);
  });
});
