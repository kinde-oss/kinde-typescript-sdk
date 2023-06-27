import { isBrowserEnvironment } from '../environment';
import { BrowserSessionStore } from './BrowserSessionStore';
import { MemoryStore } from './MemoryStore';

export const memoryStore = new MemoryStore();
export const sessionStore = isBrowserEnvironment()
  ? new BrowserSessionStore()
  : memoryStore;

export * from './types';
