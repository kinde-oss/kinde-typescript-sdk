export interface Store {
  setItem: (itemKey: string, itemValue: string) => void;
  getItem: (itemKey: string) => unknown | null;
  removeItem: (itemKey: string) => void;
  clear: () => void;
}
