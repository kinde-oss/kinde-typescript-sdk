import { default as withAuthUtilities } from "./with-auth-utilities.js";
import { type SessionManager } from '../../session-managers/index.js';
import { ClientCredentials } from '../../oauth2-flows/index.js';
import type { CCClientOptions } from '../types.js';

const createCCClient = (options: CCClientOptions) => {
  const client = new ClientCredentials(options);

  /**
   * Method clears the current session and returns the logout URL, redirecting
   * to which will clear the user's session on the authorization server.
   * @param {SessionManager} sessionManager
   * @returns {URL}
   */
  const logout = async (sessionManager: SessionManager): Promise<URL> => {
    await sessionManager.destroySession();
    return new URL(client.logoutEndpoint);
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

  /**
   * Method acts as a wrapper around the `isAuthenticated` method provided by the
   * `ClientCredentials` client created above.
   * @param {SessionManager} sessionManager
   * @returns {Promise<Boolean>}
   */
  const isAuthenticated = async (
    sessionManager: SessionManager
  ): Promise<boolean> => {
    return await client.isAuthenticated(sessionManager);
  };

  return {
    ...withAuthUtilities(isAuthenticated),
    isAuthenticated,
    getToken,
    logout,
  };
};

export default createCCClient;
