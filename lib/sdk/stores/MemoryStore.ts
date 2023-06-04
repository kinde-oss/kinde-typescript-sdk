import type { Store } from './types';

export class MemoryStore implements Store {
  public static ItemNamePrefix = 'memory-store@';
  constructor(private store: Record<string, unknown> = {}) {}

  setItem(itemKey: string, itemValue: unknown): void {
    const key = this.generateItemKey(itemKey);
    this.store[key] = itemValue;
  }

  getItem(itemKey: string): unknown | null {
    const key = this.generateItemKey(itemKey);
    const value = this.store[key];
    return value ?? null;
  }

  removeItem(itemKey: string): void {
    const key = this.generateItemKey(itemKey);
    this.store[key] = undefined;
  }

  clear(): void {
    this.store = {};
  }

  private generateItemKey(itemKey: string): string {
    return `${MemoryStore.ItemNamePrefix}${itemKey}`;
  }
}
