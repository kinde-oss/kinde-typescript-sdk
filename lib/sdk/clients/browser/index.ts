import createAuthCodeWithPKCEClient from './authcode-with-pkce';
import { isBrowserEnvironment } from '../../environment';
import type { PKCEClientOptions } from '../types';

export const createKindeBrowserClient = (options: PKCEClientOptions) => {
  if (!isBrowserEnvironment()) {
    throw new Error('this method must be invoked in a browser environment');
  }

  return createAuthCodeWithPKCEClient(options);
};
