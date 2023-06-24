import type { UserType, TokenType, FlagType } from '../../utilities';
import { type AuthURLOptions } from '../../oauth2-flows/types';
import * as utilities from '../../utilities';

import { BrowserSessionManager } from '../../session-managers';

import {
  type AuthorizationCodeOptions,
  AuthCodeWithPKCE,
} from '../../oauth2-flows';

const createAuthCodeWithPKCEClient = (options: AuthorizationCodeOptions) => {
  const { featureFlags, tokenClaims } = utilities;
  const sessionManager = new BrowserSessionManager();
  const client = new AuthCodeWithPKCE(options);

  const login = async (options?: AuthURLOptions) => {
    return await client.createAuthorizationURL(sessionManager, options);
  };

  const register = async (options?: AuthURLOptions) => {
    return await client.createAuthorizationURL(sessionManager, {
      ...options,
      start_page: 'registration',
    });
  };

  const createOrg = async (options?: AuthURLOptions) => {
    return await client.createAuthorizationURL(sessionManager, {
      ...options,
      start_page: 'registration',
      is_create_org: true,
    });
  };

  const handleRedirectToApp = async (callbackURL: URL) => {
    await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
  };

  const isAuthenticated = () => {
    const accessToken = utilities.getAccessToken(sessionManager);
    return !utilities.isTokenExpired(accessToken);
  };

  const getUserProfile = async (): Promise<UserType> => {
    if (!isAuthenticated()) {
      throw new Error(
        'Cannot fetch user profile, no authentication credential found'
      );
    }
    return await client.getUserProfile(sessionManager);
  };

  const getUser = () => {
    if (!isAuthenticated()) {
      throw new Error(
        'Cannot get user details, no authentication credential found'
      );
    }
    return utilities.getUserFromMemory(sessionManager)!;
  };

  const getIntegerFlag = (code: string, defaultValue?: number) => {
    return featureFlags.getIntegerFlag(sessionManager, code, defaultValue);
  };

  const getStringFlag = (code: string, defaultValue?: string) => {
    return featureFlags.getStringFlag(sessionManager, code, defaultValue);
  };

  const getBooleanFlag = (code: string, defaultValue?: boolean) => {
    return featureFlags.getBooleanFlag(sessionManager, code, defaultValue);
  };

  const getClaimValue = (claim: string, type: TokenType = 'access_token') => {
    return tokenClaims.getClaimValue(sessionManager, claim, type);
  };

  const getClaim = (claim: string, type: TokenType = 'access_token') => {
    return tokenClaims.getClaim(sessionManager, claim, type);
  };

  const getPermission = (name: string) => {
    return tokenClaims.getPermission(sessionManager, name);
  };

  const getOrganization = () => {
    return tokenClaims.getOrganization(sessionManager);
  };

  const getUserOrganizations = () => {
    return tokenClaims.getUserOrganizations(sessionManager);
  };

  const getPermissions = () => {
    return tokenClaims.getPermissions(sessionManager);
  };

  const getToken = async (): Promise<string> => {
    return await client.getToken(sessionManager);
  };

  const getFlag = (
    code: string,
    defaultValue?: FlagType[keyof FlagType],
    type?: keyof FlagType
  ) => {
    return featureFlags.getFlag(sessionManager, code, defaultValue, type);
  };

  const logout = () => {
    sessionManager.destroySession();
    return client.logoutEndpoint;
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
