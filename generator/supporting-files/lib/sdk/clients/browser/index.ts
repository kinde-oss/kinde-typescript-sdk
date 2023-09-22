import createAuthCodeWithPKCEClient from './authcode-with-pkce.js';
import { isBrowserEnvironment } from '../../environment.js';
import type { PKCEClientOptions } from '../types.js';

export const createKindeBrowserClient = (options: PKCEClientOptions) => {
  if (!isBrowserEnvironment()) {
    throw new Error('this method must be invoked in a browser environment');
  }

  return createAuthCodeWithPKCEClient(options);
};
