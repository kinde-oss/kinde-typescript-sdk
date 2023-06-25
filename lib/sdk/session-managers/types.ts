/**
 * This interfaces provides the contract that an session management utility must
 * satisfiy in order to work with this SDK, please vist the example provided in the
 * README, to understand how this works.
 */
export interface SessionManager {
  getSessionItem: (itemKey: string) => unknown | null;
  setSessionItem: (itemKey: string, itemValue: unknown) => void;
  removeSessionItem: (itemKey: string) => void;
  destroySession: () => void;
}
