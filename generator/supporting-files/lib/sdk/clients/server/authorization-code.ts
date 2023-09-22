import { AuthorizationCode, AuthCodeWithPKCE } from '../../oauth2-flows/index.js';
import { type SessionManager } from '../../session-managers/index.js';
import type { UserType } from '../../utilities/index.js';
import * as utilities from '../../utilities/index.js';

import type {
  CreateOrgURLOptions,
  RegisterURLOptions,
  LoginURLOptions,
  ACClientOptions,
} from '../types.js';

const createAuthorizationCodeClient = (
  options: ACClientOptions,
  isPKCE: boolean
) => {
  const client = !isPKCE
    ? new AuthorizationCode(options, options.clientSecret!)
    : new AuthCodeWithPKCE(options);

  /**
   * Method makes use of the `createAuthorizationURL` method of the AuthCodeAbstract
   * client above to return login url.
   * @param {SessionManager} sessionManager
   * @param {LoginURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  const login = async (
    sessionManager: SessionManager,
    options?: LoginURLOptions
  ): Promise<URL> => {
    return await client.createAuthorizationURL(sessionManager, {
      ...options
    });
  };

  /**
   * Method makes use of the `createAuthorizationURL` method of the AuthCodeAbstract
   * client above to return registration url.
   * @param {SessionManager} sessionManager
   * @param {RegisterURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  const register = async (
    sessionManager: SessionManager,
    options?: RegisterURLOptions
  ): Promise<URL> => {
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
   * @param {CreateOrgURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  const createOrg = async (
    sessionManager: SessionManager,
    options?: CreateOrgURLOptions
  ): Promise<URL> => {
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
  ): Promise<void> => {
    await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
  };

  /**
   * Method acts as a wrapper around the `isAuthenticated` method provided by the
   * `AuthCodeAbstract` client created above.
   * @param {SessionManager} sessionManager
   * @returns {Promise<Boolean>}
   */
  const isAuthenticated = async (
    sessionManager: SessionManager
  ): Promise<boolean> => {
    return await client.isAuthenticated(sessionManager);
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
    return await client.getUserProfile(sessionManager);
  };

  /**
   * Method extracts the current user's details from the current session, raises
   * exception if current user is not authenticated.
   * @param {SessionManager} sessionManager
   * @returns {Promise<UserType>}
   */
  const getUser = async (sessionManager: SessionManager): Promise<UserType> => {
    if (!(await isAuthenticated(sessionManager))) {
      throw new Error(
        'Cannot get user details, no authentication credential found'
      );
    }
    return (await utilities.getUserFromMemory(sessionManager))!;
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
   * @returns {URL}
   */
  const logout = async (sessionManager: SessionManager): Promise<URL> => {
    await sessionManager.destroySession();
    return new URL(client.logoutEndpoint);
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
