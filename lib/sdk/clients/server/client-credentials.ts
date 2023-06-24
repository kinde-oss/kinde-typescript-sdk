import { type SessionManager } from '../../session-managers';
import { ClientCredentials } from '../../oauth2-flows';
import type { CCClientOptions } from '../types';
import * as utilities from '../../utilities';

const createCCClient = (options: CCClientOptions) => {
  const client = new ClientCredentials(options);

  const isAuthenticated = (sessionManager: SessionManager) => {
    const accessToken = utilities.getAccessToken(sessionManager);
    return !utilities.isTokenExpired(accessToken);
  };

  const logout = (sessionManager: SessionManager) => {
    sessionManager.destroySession();
    return client.logoutEndpoint;
  };

  const getToken = async (sessionManager: SessionManager): Promise<string> => {
    return await client.getToken(sessionManager);
  };

  return {
    ...utilities.featureFlags,
    ...utilities.tokenClaims,
    isAuthenticated,
    getToken,
    logout,
  };
};

export default createCCClient;
