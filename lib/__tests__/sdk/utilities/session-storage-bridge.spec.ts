import {
  MemoryStorage,
  StorageKeys,
  clearActiveStorage,
  getActiveStorage,
  setActiveStorage,
} from '@kinde/js-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { type SessionManager } from '../../../sdk/session-managers';
import {
  withActiveJsUtilsStorage,
  withJsUtilsStorage,
} from '../../../sdk/utilities/session-storage-bridge';

const createSessionManager = (accessToken: string): SessionManager => {
  const memCache: Record<string, unknown> = { access_token: accessToken };
  return {
    getSessionItem: async (itemKey: string) => memCache[itemKey] ?? null,
    setSessionItem: async (itemKey: string, itemValue: unknown) => {
      memCache[itemKey] = itemValue;
    },
    removeSessionItem: async (itemKey: string) => {
      delete memCache[itemKey];
    },
    destroySession: async () => {
      Object.keys(memCache).forEach((key) => {
        delete memCache[key];
      });
    },
  };
};

const installStorage = async (accessToken: string): Promise<MemoryStorage> => {
  const storage = new MemoryStorage();
  await storage.setSessionItem(StorageKeys.accessToken, accessToken);
  setActiveStorage(storage);
  return storage;
};

const swapInStorage = async (accessToken: string): Promise<void> => {
  const storage = new MemoryStorage();
  await storage.setSessionItem(StorageKeys.accessToken, accessToken);
  setActiveStorage(storage);
};

describe('session-storage-bridge', () => {
  describe('withActiveJsUtilsStorage', () => {
    afterEach(() => {
      clearActiveStorage();
    });

    it('restores the previous active storage after success', async () => {
      const previous = await installStorage('previous-token');

      const during = await withActiveJsUtilsStorage(
        async () => {
          await swapInStorage('temporary-token');
        },
        async () => getActiveStorage()?.getSessionItem(StorageKeys.accessToken)
      );

      expect(during).toBe('temporary-token');
      expect(getActiveStorage()).toBe(previous);
    });

    it('restores the previous active storage when fn() throws', async () => {
      const previous = await installStorage('previous-token');

      await expect(
        withActiveJsUtilsStorage(
          async () => {
            await swapInStorage('temporary-token');
          },
          async () => {
            throw new Error('fn failed');
          }
        )
      ).rejects.toThrow('fn failed');

      expect(getActiveStorage()).toBe(previous);
    });

    it('restores the previous active storage when activate() throws', async () => {
      const previous = await installStorage('previous-token');
      let fnRan = false;

      await expect(
        withActiveJsUtilsStorage(
          async () => {
            await swapInStorage('temporary-token');
            throw new Error('activate failed');
          },
          async () => {
            fnRan = true;
          }
        )
      ).rejects.toThrow('activate failed');

      expect(fnRan).toBe(false);
      expect(getActiveStorage()).toBe(previous);
    });
  });

  describe('withJsUtilsStorage', () => {
    it("isolates overlapping calls so they cannot read each other's storage", async () => {
      const sessionA = createSessionManager('token-a');
      const sessionB = createSessionManager('token-b');

      const delay = async (ms: number) =>
        await new Promise<void>((resolve) => {
          setTimeout(resolve, ms);
        });

      const [tokenA, tokenB] = await Promise.all([
        withJsUtilsStorage(sessionA, async () => {
          await delay(20);
          return getActiveStorage()?.getSessionItem(StorageKeys.accessToken);
        }),
        withJsUtilsStorage(sessionB, async () => {
          await delay(20);
          return getActiveStorage()?.getSessionItem(StorageKeys.accessToken);
        }),
      ]);

      expect(tokenA).toBe('token-a');
      expect(tokenB).toBe('token-b');
    });
  });
});
