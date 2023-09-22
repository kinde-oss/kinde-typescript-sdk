/**
 * This interfaces provides the contract that an session management utility must
 * satisfiy in order to work with this SDK, please vist the example provided in the
 * README, to understand how this works.
 */
type Awaitable<T> = Promise<T>;

export interface SessionManager {
  getSessionItem: (itemKey: string) => Awaitable<unknown | null>;
  setSessionItem: (itemKey: string, itemValue: unknown) => Awaitable<void>;
  removeSessionItem: (itemKey: string) => Awaitable<void>;
  destroySession: () => Awaitable<void>;
}
