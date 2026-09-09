import { getActiveStorage, StorageKeys } from '@kinde/js-utils';
import { describe, expect, it } from 'vitest';
import { type SessionManager } from '../../../sdk/session-managers';
import { withJsUtilsStorage } from '../../../sdk/utilities/session-storage-bridge';

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

describe('session-storage-bridge', () => {
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
