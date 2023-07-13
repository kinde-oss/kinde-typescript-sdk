import type { UserType, ClaimTokenType, FlagType } from '../../utilities';
import { BrowserSessionManager } from '../../session-managers';
import * as utilities from '../../utilities';

import {
  type AuthorizationCodeOptions,
  AuthCodeWithPKCE,
} from '../../oauth2-flows';

import type {
  CreateOrgURLOptions,
  RegisterURLOptions,
  LoginURLOptions,
} from '../types';

const createAuthCodeWithPKCEClient = (options: AuthorizationCodeOptions) => {
  const { featureFlags, tokenClaims } = utilities;
  const sessionManager = new BrowserSessionManager();
  const client = new AuthCodeWithPKCE(options);

  /**
   * Method makes use of the `createAuthorizationURL` method of the AuthCodeWithPKCE
   * client above to return login url.
   * @param {LoginURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  const login = async (options?: LoginURLOptions) => {
    return await client.createAuthorizationURL(sessionManager, {
      ...options,
      start_page: 'login',
    });
  };

  /**
   * Method makes use of the `createAuthorizationURL` method of the AuthCodeWithPKCE
   * client above to return registration url.
   * @param {RegisterURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  const register = async (options?: RegisterURLOptions) => {
    return await client.createAuthorizationURL(sessionManager, {
      ...options,
      start_page: 'registration',
    });
  };

  /**
   * Method makes use of the `createAuthorizationURL` method of the AuthCodeWithPKCE
   * client above to return registration url with the `is_create_org` query param
   * set to true.
   * @param {CreateOrgURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  const createOrg = async (options?: CreateOrgURLOptions) => {
    return await client.createAuthorizationURL(sessionManager, {
      ...options,
      start_page: 'registration',
      is_create_org: true,
    });
  };

  /**
   * Method makes use of the `handleRedirectFromAuthDomain` method of the
   * `AuthCodeWithPKCE` client above to handle the redirection back to the app.
   * @param {URL} callbackURL
   * @returns {Promise<void>}
   */
  const handleRedirectToApp = async (callbackURL: URL) => {
    await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
  };

  /**
   * Method acts as a wrapper around the `isAuthenticated` method provided by the
   * `AuthCodeWithPKCE` client created above.
   * @param {SessionManager} sessionManager
   * @returns {boolean}
   */
  const isAuthenticated = async () => {
    return await client.isAuthenticated(sessionManager);
  };

  /**
   * Method makes use of the `getUserProfile` method of the `AuthCodeWithPKCE` client
   * above to fetch the current user's information, raises exception if current user
   * is not authenticated.
   * @returns {Promise<UserType>}
   */
  const getUserProfile = async (): Promise<UserType> => {
    return await client.getUserProfile(sessionManager);
  };

  /**
   * Method extracts the current user's details from the current session, raises
   * exception if current user is not authenticated.
   * @returns {UserType}
   */
  const getUser = async () => {
    if (!(await isAuthenticated())) {
      throw new Error(
        'Cannot get user details, no authentication credential found'
      );
    }
    return utilities.getUserFromMemory(sessionManager)!;
  };

  /**
   * Method extracts the provided number feature flag from the access token in
   * the current session.
   * @param {string} code
   * @param {number} defaultValue
   * @returns {number} integer flag value
   */
  const getIntegerFlag = (code: string, defaultValue?: number) => {
    return featureFlags.getIntegerFlag(sessionManager, code, defaultValue);
  };

  /**
   * Method extracts the provided string feature flag from the access token in
   * the current session.
   * @param {string} code
   * @param {string} defaultValue
   * @returns {string} string flag value
   */
  const getStringFlag = (code: string, defaultValue?: string) => {
    return featureFlags.getStringFlag(sessionManager, code, defaultValue);
  };

  /**
   * Method extracts the provided boolean feature flag from the access token in
   * the current session.
   * @param {string} code
   * @param {boolean} defaultValue
   * @returns {boolean} boolean flag value
   */
  const getBooleanFlag = (code: string, defaultValue?: boolean) => {
    return featureFlags.getBooleanFlag(sessionManager, code, defaultValue);
  };

  /**
   * Method extracts the provided claim from the provided token type in the
   * current session.
   * @param {string} claim
   * @param {ClaimTokenType} type
   * @returns {unknown | null}
   */
  const getClaimValue = (
    claim: string,
    type: ClaimTokenType = 'access_token'
  ) => {
    return tokenClaims.getClaimValue(sessionManager, claim, type);
  };

  /**
   * Method extracts the provided claim from the provided token type in the
   * current session, the returned object includes the provided claim.
   * @param {string} claim
   * @param {ClaimTokenType} type
   * @returns {{ name: string, value: unknown | null }}
   */
  const getClaim = (claim: string, type: ClaimTokenType = 'access_token') => {
    return tokenClaims.getClaim(sessionManager, claim, type);
  };

  /**
   * Method returns the organization code from the current session and returns
   * a boolean in the returned object indicating if the provided permission is
   * present in the session.
   * @param {string} name
   * @returns {{ orgCode: string, isGranted: boolean }}
   */
  const getPermission = (name: string) => {
    return tokenClaims.getPermission(sessionManager, name);
  };

  /**
   * Method extracts the organization code from the current session.
   * @param {SessionManager} sessionManager
   * @returns {{ orgCode: string }}
   */
  const getOrganization = () => {
    return tokenClaims.getOrganization(sessionManager);
  };

  /**
   * Method extracts all organization codes from the id token in the current
   * session.
   * @param {SessionManager} sessionManager
   * @returns {{ orgCodes: string[] }}
   */
  const getUserOrganizations = () => {
    return tokenClaims.getUserOrganizations(sessionManager);
  };

  /**
   * Method extracts all the permission and the organization code in the access
   * token in the current session.
   * @param {SessionManager} sessionManager
   * @returns {{ permissions: string[], orgCode: string }}
   */
  const getPermissions = () => {
    return tokenClaims.getPermissions(sessionManager);
  };

  /**
   * Method makes use of the `getToken` of the `AuthCodeWithPKCE` client above
   * to return the access token from the current session.
   * @returns {Promise<string>}
   */
  const getToken = async (): Promise<string> => {
    return await client.getToken(sessionManager);
  };

  /**
   * Method extracts the provided feature flag from the access token in the
   * current session.
   * @param {string} code
   * @param {FlagType[keyof FlagType]} defaultValue
   * @param {keyof FlagType} type
   * @returns {GetFlagType}
   */
  const getFlag = (
    code: string,
    defaultValue?: FlagType[keyof FlagType],
    type?: keyof FlagType
  ) => {
    return featureFlags.getFlag(sessionManager, code, defaultValue, type);
  };

  /**
   * Method clears the current session and returns the logout URL, redirecting
   * to which will clear the user's session on the authorization server.
   * @returns {URL}
   */
  const logout = () => {
    sessionManager.destroySession();
    return new URL(client.logoutEndpoint);
  };

  return {
    getUserOrganizations,
    handleRedirectToApp,
    isAuthenticated,
    getOrganization,
    getBooleanFlag,
    getIntegerFlag,
    getUserProfile,
    getPermissions,
    getPermission,
    getClaimValue,
    getStringFlag,
    createOrg,
    getClaim,
    getToken,
    register,
    getUser,
    getFlag,
    logout,
    login,
  };
};

export default createAuthCodeWithPKCEClient;
