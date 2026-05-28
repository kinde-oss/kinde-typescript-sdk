import {
  MemoryStorage,
  StorageKeys,
  clearActiveStorage,
  getActiveStorage,
  setActiveStorage,
} from '@kinde/js-utils';
import { isNodeEnvironment } from '../environment.js';
import { type SessionManager } from '../session-managers/index.js';
import type { ClaimTokenType } from './types.js';

type ActiveStorageEntry = ReturnType<typeof getActiveStorage>;
type ActiveStorageStack = ActiveStorageEntry[];

/** LIFO stack for browser nesting (concurrent interleaving is not isolated). */
let browserStorageStack: ActiveStorageStack = [];

let jsUtilsStorageContext:
  | import('node:async_hooks').AsyncLocalStorage<ActiveStorageStack>
  | undefined;

const getJsUtilsStorageContext = async (): Promise<
  import('node:async_hooks').AsyncLocalStorage<ActiveStorageStack> | undefined
> => {
  if (!isNodeEnvironment()) {
    return undefined;
  }
  if (!jsUtilsStorageContext) {
    const { AsyncLocalStorage } = await import('node:async_hooks');
    jsUtilsStorageContext = new AsyncLocalStorage<ActiveStorageStack>();
  }
  return jsUtilsStorageContext;
};

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
 * Pushes the current js-utils active storage onto the provided stack.
 */
export const pushActiveJsUtilsStorage = (stack: ActiveStorageStack): void => {
  stack.push(getActiveStorage() ?? null);
};

/**
 * Restores the js-utils active storage from the top of the provided stack (LIFO).
 */
export const popActiveJsUtilsStorage = (stack: ActiveStorageStack): void => {
  const previous = stack.pop();
  if (previous) {
    setActiveStorage(previous);
  } else {
    clearActiveStorage();
  }
};

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

const runWithActiveStorageStack = async <T>(
  stack: ActiveStorageStack,
  activate: () => Promise<void>,
  fn: () => Promise<T>
): Promise<T> => {
  pushActiveJsUtilsStorage(stack);
  await activate();
  try {
    return await fn();
  } finally {
    popActiveJsUtilsStorage(stack);
  }
};

const runInStorageContext = async <T>(
  fn: (stack: ActiveStorageStack) => Promise<T>
): Promise<T> => {
  const context = await getJsUtilsStorageContext();

  if (context) {
    const parentStack = context.getStore();
    const stack: ActiveStorageStack = parentStack ? [...parentStack] : [];
    return context.run(stack, () => fn(stack));
  }

  return fn(browserStorageStack);
};

/**
 * Runs a callback with a custom js-utils active storage setup, using a LIFO restore stack.
 */
export const withActiveJsUtilsStorage = async <T>(
  activate: () => Promise<void>,
  fn: () => Promise<T>
): Promise<T> => {
  return await runInStorageContext((stack) =>
    runWithActiveStorageStack(stack, activate, fn)
  );
};

/**
 * Runs a callback with a per-call MemoryStorage containing only the given access token.
 */
export const withAccessTokenInJsUtilsStorage = async <T>(
  accessToken: string,
  fn: () => Promise<T>
): Promise<T> => {
  return withActiveJsUtilsStorage(async () => {
    const storage = new MemoryStorage();
    await storage.setSessionItem(StorageKeys.accessToken, accessToken);
    setActiveStorage(storage);
  }, fn);
};

/**
 * Runs a callback with the SDK session bridged to js-utils active storage,
 * restoring the previous active storage afterward (LIFO per async context on Node).
 */
export const withJsUtilsStorage = async <T>(
  sessionManager: SessionManager,
  fn: () => Promise<T>
): Promise<T> => {
  return await withActiveJsUtilsStorage(async () => {
    await syncSessionToJsUtilsStorage(sessionManager);
  }, fn);
};
