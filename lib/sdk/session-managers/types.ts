/**
 * This interfaces provides the contract that an session management utility must
 * satisfiy in order to work with this SDK, please vist the example provided in the
 * README, to understand how this works.
 */
type Awaitable<T> = Promise<T>;

export interface SessionManager {
  persistent?: boolean;
  getSessionItem: <T = unknown>(itemKey: string) => Awaitable<T | unknown | null>;
  setSessionItem: <T = unknown>(itemKey: string, itemValue: T) => Awaitable<void>;
  removeSessionItem: (itemKey: string) => Awaitable<void>;
  destroySession: () => Awaitable<void>;
}
