import { type AuthURLOptions } from '../oauth2-flows/types';
import { type SessionManager } from '../session-managers';
import type { UserType } from '../utilities';
import * as utilities from '../utilities';

import {
  type AuthorizationCodeOptions,
  AuthCodeWithPKCE,
  AuthorizationCode,
} from '../oauth2-flows';

const createAuthorizationCodeClient = (
  options: AuthorizationCodeOptions & { clientSecret?: string },
  isPKCE: boolean
) => {
  const client = !isPKCE
    ? new AuthorizationCode(options, options.clientSecret!)
    : new AuthCodeWithPKCE(options);

  const login = async (
    sessionManager: SessionManager,
    options?: AuthURLOptions
  ) => {
    return await client.createAuthorizationURL(sessionManager, options);
  };

  const register = async (
    sessionManager: SessionManager,
    options?: AuthURLOptions
  ) => {
    return await client.createAuthorizationURL(sessionManager, {
      ...options,
      start_page: 'registration',
    });
  };

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

  const handleRedirectToApp = async (
    sessionManager: SessionManager,
    callbackURL: URL
  ) => {
    await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
  };

  const isAuthenticated = (sessionManager: SessionManager) => {
    const accessToken = utilities.getAccessToken(sessionManager);
    return !utilities.isTokenExpired(accessToken);
  };

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

  const getUser = (sessionManager: SessionManager) => {
    if (!isAuthenticated(sessionManager)) {
      throw new Error(
        'Cannot get user details, no authentication credential found'
      );
    }
    return utilities.getUserFromMemory(sessionManager)!;
  };

  const getToken = async (sessionManager: SessionManager): Promise<string> => {
    return await client.getToken(sessionManager);
  };

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
