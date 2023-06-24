export interface SessionManager {
  getSessionItem: (itemKey: string) => unknown | null;
  setSessionItem: (itemKey: string, itemValue: unknown) => void;
  removeSessionItem: (itemKey: string) => void;
  destroySession: () => void;
}
