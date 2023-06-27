import { type SessionManager } from '../../session-managers';
import { ClientCredentials } from '../../oauth2-flows';
import type { CCClientOptions } from '../types';
import * as utilities from '../../utilities';

const createCCClient = (options: CCClientOptions) => {
  const client = new ClientCredentials(options);

  /**
   * Method extracts the access token from the current session and checks if the
   * token is expired or not.
   * @param {SessionManager} sessionManager
   * @returns {boolean}
   */
  const isAuthenticated = (sessionManager: SessionManager) => {
    const accessToken = utilities.getAccessToken(sessionManager);
    return !utilities.isTokenExpired(accessToken);
  };

  /**
   * Method clears the current session and returns the logout URL, redirecting
   * to which will clear the user's session on the authorization server.
   * @param {SessionManager} sessionManager
   * @returns {string}
   */
  const logout = (sessionManager: SessionManager) => {
    sessionManager.destroySession();
    return client.logoutEndpoint;
  };

  /**
   * Method makes use of the `getToken` method of the `ClientCredentials` client
   * to retrieve an access token.
   * @param sessionManager
   * @returns {Promise<string>}
   */
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
