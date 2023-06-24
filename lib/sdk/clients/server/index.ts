import createAuthCodeClient from './authorization-code';
import { isNodeEnvironment } from '../../environment';
import createCCClient from './client-credentials';
import { GrantType } from '../../oauth2-flows';

import type {
  CCClient,
  ACClient,
  PKCEClientOptions,
  ACClientOptions,
  CCClientOptions,
} from '../types';

export const createKindeServerClient = <
  C extends ACClient | CCClient,
  O extends ACClientOptions | PKCEClientOptions | CCClientOptions
>(
  grantType: GrantType,
  options: O
) => {
  if (!isNodeEnvironment()) {
    throw new Error('this method must be invoked in a node.js environment');
  }

  switch (grantType) {
    case GrantType.AUTHORIZATION_CODE: {
      const clientOptions = options as ACClientOptions;
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
