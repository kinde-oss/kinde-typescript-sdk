import {
  MemoryStorage,
  StorageKeys,
  clearActiveStorage,
  getActiveStorage,
  setActiveStorage,
} from '@kinde/js-utils';
import { type SessionManager } from '../session-managers/index.js';
import type { ClaimTokenType } from './types.js';

const SDK_TO_JS_UTILS_KEYS = {
  access_token: StorageKeys.accessToken,
  id_token: StorageKeys.idToken,
  refresh_token: StorageKeys.refreshToken,
} as const;

export const mapClaimTokenType = (
  type: ClaimTokenType
): 'accessToken' | 'idToken' =>
  type === 'access_token' ? 'accessToken' : 'idToken';

/**
 * Copies SDK session tokens into a js-utils MemoryStorage and sets it as active storage.
 */
export const syncSessionToJsUtilsStorage = async (
  sessionManager: SessionManager
): Promise<MemoryStorage> => {
  const storage = new MemoryStorage();

  await Promise.all(
    (
      Object.keys(SDK_TO_JS_UTILS_KEYS) as Array<keyof typeof SDK_TO_JS_UTILS_KEYS>
    ).map(async (sdkKey) => {
      const token = await sessionManager.getSessionItem(sdkKey);
      if (typeof token === 'string') {
        await storage.setSessionItem(SDK_TO_JS_UTILS_KEYS[sdkKey], token);
      }
    })
  );

  setActiveStorage(storage);
  return storage;
};

/**
 * Overlapping calls are serialized so only one holds process-global
 * `setActiveStorage` at a time. Nested `withJsUtilsStorage` is unsupported.
 */
let bridgeLock: Promise<void> = Promise.resolve();

const withBridgeLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  const prev = bridgeLock;
  let release!: () => void;
  bridgeLock = new Promise((r) => {
    release = r;
  });
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
};

/**
 * Runs a callback with a custom js-utils active storage setup, restoring the
 * previous active storage afterward. Concurrent bridged calls are serialized.
 */
export const withActiveJsUtilsStorage = async <T>(
  activate: () => Promise<void>,
  fn: () => Promise<T>
): Promise<T> => {
  return withBridgeLock(async () => {
    const previous = getActiveStorage() ?? null;
    try {
      await activate();
      return await fn();
    } finally {
      if (previous) {
        setActiveStorage(previous);
      } else {
        clearActiveStorage();
      }
    }
  });
};

/**
 * Runs a callback with the SDK session bridged to js-utils active storage,
 * restoring the previous active storage afterward.
 */
export const withJsUtilsStorage = async <T>(
  sessionManager: SessionManager,
  fn: () => Promise<T>
): Promise<T> => {
  return await withActiveJsUtilsStorage(async () => {
    await syncSessionToJsUtilsStorage(sessionManager);
  }, fn);
};
