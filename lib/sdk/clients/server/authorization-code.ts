import { type AuthURLOptions } from '../../oauth2-flows/types';
import { type SessionManager } from '../../session-managers';
import type { UserType } from '../../utilities';
import * as utilities from '../../utilities';

import {
  type AuthorizationCodeOptions,
  AuthCodeWithPKCE,
  AuthorizationCode,
} from '../../oauth2-flows';

const createAuthorizationCodeClient = (
  options: AuthorizationCodeOptions & { clientSecret?: string },
  isPKCE: boolean
) => {
  const client = !isPKCE
    ? new AuthorizationCode(options, options.clientSecret!)
    : new AuthCodeWithPKCE(options);

  /**
   * Method makes use of the `createAuthorizationURL` method of the AuthCodeAbstract
   * client above to return login url.
   * @param {SessionManager} sessionManager
   * @param {AuthURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  const login = async (
    sessionManager: SessionManager,
    options?: AuthURLOptions
  ) => {
    return await client.createAuthorizationURL(sessionManager, options);
  };

  /**
   * Method makes use of the `createAuthorizationURL` method of the AuthCodeAbstract
   * client above to return registration url.
   * @param {SessionManager} sessionManager
   * @param {AuthURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  const register = async (
    sessionManager: SessionManager,
    options?: AuthURLOptions
  ) => {
    return await client.createAuthorizationURL(sessionManager, {
      ...options,
      start_page: 'registration',
    });
  };

  /**
   * Method makes use of the `createAuthorizationURL` method of the AuthCodeAbstract
   * client above to return registration url with the `is_create_org` query param
   * set to true.
   * @param {SessionManager} sessionManager
   * @param {AuthURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  const createOrg = async (
    sessionManager: SessionManager,
    options?: AuthURLOptions
  ) => {
    return await client.createAuthorizationURL(sessionManager, {
      ...options,
      start_page: 'registration',
      is_create_org: true,
    });
  };

  /**
   * Method makes use of the `handleRedirectFromAuthDomain` method of the
   * `AuthCodeAbstract` client above to handle the redirection back to the app.
   * @param {SessionManager} sessionManager
   * @param {URL} callbackURL
   * @returns {Promise<void>}
   */
  const handleRedirectToApp = async (
    sessionManager: SessionManager,
    callbackURL: URL
  ) => {
    await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
  };

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
   * Method makes use of the `getUserProfile` method of the `AuthCodeAbstract` client
   * above to fetch the current user's information, raises exception if current user
   * is not authenticated.
   * @param {SessionManager} sessionManager
   * @returns {Promise<UserType>}
   */
  const getUserProfile = async (
    sessionManager: SessionManager
  ): Promise<UserType> => {
    if (!isAuthenticated(sessionManager)) {
      throw new Error(
        'Cannot fetch user profile, no authentication credential found'
      );
    }
    return await client.getUserProfile(sessionManager);
  };

  /**
   * Method extracts the current user's details from the current session, raises
   * exception if current user is not authenticated.
   * @param {SessionManager} sessionManager
   * @returns {UserType}
   */
  const getUser = (sessionManager: SessionManager) => {
    if (!isAuthenticated(sessionManager)) {
      throw new Error(
        'Cannot get user details, no authentication credential found'
      );
    }
    return utilities.getUserFromMemory(sessionManager)!;
  };

  /**
   * Method makes use of the `getToken` method of the `AuthCodeAbstract` client
   * to retrieve an access token.
   * @param sessionManager
   * @returns {Promise<string>}
   */
  const getToken = async (sessionManager: SessionManager): Promise<string> => {
    return await client.getToken(sessionManager);
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

  return {
    ...utilities.featureFlags,
    ...utilities.tokenClaims,
    handleRedirectToApp,
    isAuthenticated,
    getUserProfile,
    createOrg,
    getToken,
    register,
    getUser,
    logout,
    login,
  };
};

export default createAuthorizationCodeClient;
