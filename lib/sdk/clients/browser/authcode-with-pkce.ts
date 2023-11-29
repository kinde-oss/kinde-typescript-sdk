import { BrowserSessionManager } from '../../session-managers/index.js';
import { AuthCodeWithPKCE } from '../../oauth2-flows/index.js';
import * as utilities from '../../utilities/index.js';

import type {
  UserType,
  ClaimTokenType,
  GetFlagType,
  FlagType,
} from '../../utilities/index.js';

import type {
  CreateOrgURLOptions,
  RegisterURLOptions,
  LoginURLOptions,
  BrowserPKCEClientOptions,
} from '../types.js';

const createAuthCodeWithPKCEClient = (options: BrowserPKCEClientOptions) => {
  const { featureFlags, tokenClaims } = utilities;
  const sessionManager = options.sessionManager ?? new BrowserSessionManager();
  const client = new AuthCodeWithPKCE(options);

  /**
   * Method makes use of the `createAuthorizationURL` method of the AuthCodeWithPKCE
   * client above to return login url.
   * @param {LoginURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  const login = async (options?: LoginURLOptions): Promise<URL> => {
    return await client.createAuthorizationURL(sessionManager, {
      ...options
    });
  };

  /**
   * Method makes use of the `createAuthorizationURL` method of the AuthCodeWithPKCE
   * client above to return registration url.
   * @param {RegisterURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  const register = async (options?: RegisterURLOptions): Promise<URL> => {
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
  const createOrg = async (options?: CreateOrgURLOptions): Promise<URL> => {
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
  const handleRedirectToApp = async (callbackURL: URL): Promise<void> => {
    await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
  };

  /**
   * Method acts as a wrapper around the `isAuthenticated` method provided by the
   * `AuthCodeWithPKCE` client created above.
   * @returns {Promise<boolean>}
   */
  const isAuthenticated = async (): Promise<boolean> => {
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
   * @returns {Promise<UserType>}
   */
  const getUser = async (): Promise<UserType> => {
    if (!(await isAuthenticated())) {
      throw new Error(
        'Cannot get user details, no authentication credential found'
      );
    }
    return (await utilities.getUserFromMemory(sessionManager))!;
  };

  /**
   * Method extracts the provided number feature flag from the access token in
   * the current session.
   * @param {string} code
   * @param {number} defaultValue
   * @returns {number} integer flag value
   */
  const getIntegerFlag = async (
    code: string,
    defaultValue?: number
  ): Promise<number> => {
    if (!(await isAuthenticated())) {
      throw new Error(
        `Cannot return integer flag "${code}", no authentication credential found`,
      );
    }
    return await featureFlags.getIntegerFlag(
      sessionManager,
      code,
      defaultValue
    );
  };

  /**
   * Method extracts the provided string feature flag from the access token in
   * the current session.
   * @param {string} code
   * @param {string} defaultValue
   * @returns {string} string flag value
   */
  const getStringFlag = async (
    code: string,
    defaultValue?: string
  ): Promise<string> => {
    if (!(await isAuthenticated())) {
      throw new Error(
        `Cannot return string flag "${code}", no authentication credential found`,
      );
    }
    return await featureFlags.getStringFlag(sessionManager, code, defaultValue);
  };

  /**
   * Method extracts the provided boolean feature flag from the access token in
   * the current session.
   * @param {string} code
   * @param {boolean} defaultValue
   * @returns {boolean} boolean flag value
   */
  const getBooleanFlag = async (
    code: string,
    defaultValue?: boolean
  ): Promise<boolean> => {
    if (!(await isAuthenticated())) {
      throw new Error(
        `Cannot return boolean flag "${code}", no authentication credential found`,
      );
    }
    return await featureFlags.getBooleanFlag(
      sessionManager,
      code,
      defaultValue
    );
  };

  /**
   * Method extracts the provided claim from the provided token type in the
   * current session.
   * @param {string} claim
   * @param {ClaimTokenType} type
   * @returns {unknown | null}
   */
  const getClaimValue = async (
    claim: string,
    type: ClaimTokenType = 'access_token'
  ): Promise<unknown | null> => {
    if (!(await isAuthenticated())) {
      throw new Error(
        `Cannot return claim "${claim}", no authentication credential found`,
      );
    }
    return tokenClaims.getClaimValue(sessionManager, claim, type);
  };

  /**
   * Method extracts the provided claim from the provided token type in the
   * current session, the returned object includes the provided claim.
   * @param {string} claim
   * @param {ClaimTokenType} type
   * @returns {{ name: string, value: unknown | null }}
   */
  const getClaim = async (
    claim: string,
    type: ClaimTokenType = 'access_token'
  ): Promise<{ name: string; value: unknown | null }> => {
    if (!(await isAuthenticated())) {
      throw new Error(
        `Cannot return claim "${claim}", no authentication credential found`,
      );
    }
    return await tokenClaims.getClaim(sessionManager, claim, type);
  };

  /**
   * Method returns the organization code from the current session and returns
   * a boolean in the returned object indicating if the provided permission is
   * present in the session.
   * @param {string} name
   * @returns {{ orgCode: string | null, isGranted: boolean }}
   */
  const getPermission = async (
    name: string
  ): Promise<{ orgCode: string | null; isGranted: boolean }> => {
    if (!(await isAuthenticated())) {
      throw new Error(
        `Cannot return permission "${name}", no authentication credential found`,
      );
    }
    return await tokenClaims.getPermission(sessionManager, name);
  };

  /**
   * Method extracts the organization code from the current session.
   * @returns {{ orgCode: string | null }}
   */
  const getOrganization = async (): Promise<{ orgCode: string | null }> => {
    if (!(await isAuthenticated())) {
      throw new Error(
        'Cannot return user organization, no authentication credential found',
      );
    }
    return await tokenClaims.getOrganization(sessionManager);
  };

  /**
   * Method extracts all organization codes from the id token in the current
   * session.
   * @returns {{ orgCodes: string[] }}
   */
  const getUserOrganizations = async (): Promise<{ orgCodes: string[] }> => {
    if (!(await isAuthenticated())) {
      throw new Error(
        'Cannot return user organizations, no authentication credential found',
      );
    }
    return await tokenClaims.getUserOrganizations(sessionManager);
  };

  /**
   * Method extracts all the permission and the organization code in the access
   * token in the current session.
   * @returns {{ permissions: string[], orgCode: string | null }}
   */
  const getPermissions = async (): Promise<{
    permissions: string[];
    orgCode: string | null;
  }> => {
    if (!(await isAuthenticated())) {
      throw new Error(
        'Cannot return user permissions, no authentication credential found',
      );
    }
    return await tokenClaims.getPermissions(sessionManager);
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
  const getFlag = async (
    code: string,
    defaultValue?: FlagType[keyof FlagType],
    type?: keyof FlagType
  ): Promise<GetFlagType> => {
    if (!(await isAuthenticated())) {
      throw new Error(
        `Cannot return flag "${code}", no authentication credential found`,
      );
    }
    return await featureFlags.getFlag(sessionManager, code, defaultValue, type);
  };

  /**
   * Method clears the current session and returns the logout URL, redirecting
   * to which will clear the user's session on the authorization server.
   * @returns {URL}
   */
  const logout = async (): Promise<URL> => {
    await sessionManager.destroySession();
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
