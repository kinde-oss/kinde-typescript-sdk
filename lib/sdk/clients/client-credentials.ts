import { ClientCredentials } from '../oauth2-flows';
import type { CCClientOptions } from './types';
import * as utilities from '../utilities';
import { memoryStore } from '../stores';

const createCCClient = (options: CCClientOptions) => {
  const client = new ClientCredentials(options);

  const isAuthenticated = () => {
    const accessToken = utilities.getAccessToken();
    return !utilities.isTokenExpired(accessToken);
  };

  const getToken = async (): Promise<string> => {
    return await client.getToken();
  };

  const logout = () => {
    memoryStore.clear();
    return client.logoutEndpoint;
  };

  return {
    ...utilities.featureFlagUtilities,
    ...utilities.tokenClaimUtilities,
    isAuthenticated,
    getToken,
    logout,
  };
};

export default createCCClient;
