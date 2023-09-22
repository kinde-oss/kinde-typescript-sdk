import createAuthCodeClient from './authorization-code.js';
import { isNodeEnvironment } from '../../environment.js';
import createCCClient from './client-credentials.js';
import { GrantType } from '../../oauth2-flows/index.js';

import type {
  CCClient,
  ACClient,
  PKCEClientOptions,
  ACClientOptions,
  CCClientOptions,
} from '../types.js';

type Options<T> = T extends GrantType.PKCE ? PKCEClientOptions : T extends GrantType.AUTHORIZATION_CODE ? ACClientOptions : T extends GrantType.CLIENT_CREDENTIALS ? CCClientOptions : never;
type Client<T> = T extends PKCEClientOptions ? ACClient : T extends ACClientOptions ? ACClient : T extends  CCClientOptions ? CCClient : never; 

export const createKindeServerClient = <G extends GrantType>(
  grantType: G,
  options: Options<G>
) => {
  if (!isNodeEnvironment()) {
    throw new Error('this method must be invoked in a node.js environment');
  }

  switch (grantType) {
    case GrantType.AUTHORIZATION_CODE: {
      const clientOptions = options as ACClientOptions;
      return createAuthCodeClient(clientOptions, false) as Client<Options<G>>;
    }
    case GrantType.PKCE: {
      const clientOptions = options as PKCEClientOptions;
      return createAuthCodeClient(clientOptions, true) as Client<Options<G>>;
    }
    case GrantType.CLIENT_CREDENTIALS: {
      const clientOptions = options as CCClientOptions;
      return createCCClient(clientOptions) as Client<Options<G>>;
    }
    default: {
      throw new Error('Unrecognized grant type provided');
    }
  }
};
