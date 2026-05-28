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
      if (token) {
        await storage.setSessionItem(SDK_TO_JS_UTILS_KEYS[sdkKey], token as string);
      }
    })
  );

  setActiveStorage(storage);
  return storage;
};

/**
 * Runs a callback with the SDK session bridged to js-utils active storage,
 * restoring the previous active storage afterward.
 */
export const withJsUtilsStorage = async <T>(
  sessionManager: SessionManager,
  fn: () => Promise<T>
): Promise<T> => {
  const previous = getActiveStorage();
  await syncSessionToJsUtilsStorage(sessionManager);

  try {
    return await fn();
  } finally {
    if (previous) {
      setActiveStorage(previous);
    } else {
      clearActiveStorage();
    }
  }
};
