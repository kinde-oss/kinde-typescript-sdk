import { type CCClient, type AuthCodeClient } from './types';
import createAuthCodeClient from './authorization-code';
import createCCClient from './client-credentials';
import { GrantType } from '../oauth2-flows';

import type {
  AuthCodeClientOptions,
  PKCEClientOptions,
  CCClientOptions,
} from '../oauth2-flows/types';

export const createKindeClient = <
  C extends AuthCodeClient | CCClient,
  O extends AuthCodeClientOptions | PKCEClientOptions | CCClientOptions
>(
  grantType: GrantType,
  options: O
) => {
  switch (grantType) {
    case GrantType.AUTHORIZATION_CODE: {
      const clientOptions = options as AuthCodeClientOptions;
      return createAuthCodeClient(clientOptions, false) as C;
    }
    case GrantType.PKCE: {
      const clientOptions = options as PKCEClientOptions;
      return createAuthCodeClient(clientOptions, true) as C;
    }
    case GrantType.CLIENT_CREDENTIALS: {
      const clientOptions = options as CCClientOptions;
      return createCCClient(clientOptions) as C;
    }
    default: {
      throw new Error('Unrecognized grant type provided');
    }
  }
};

export * from './types';
