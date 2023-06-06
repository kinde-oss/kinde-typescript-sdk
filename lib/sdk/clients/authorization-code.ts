import { type AuthURLOptions } from '../oauth2-flows/types';
import { sessionStore, memoryStore } from '../stores';
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

  const login = async (options?: AuthURLOptions) => {
    return await client.createAuthorizationURL(options);
  };

  const register = async (options?: AuthURLOptions) => {
    return await client.createAuthorizationURL({
      ...options,
      start_page: 'registration',
    });
  };

  const createOrg = async (options?: AuthURLOptions) => {
    return await client.createAuthorizationURL({
      ...options,
      start_page: 'registration',
      is_create_org: true,
    });
  };

  const handleRedirectToApp = async (callbackURL: URL) => {
    await client.handleRedirectFromAuthDomain(callbackURL);
  };

  const isAuthenticated = () => {
    const accessToken = utilities.getAccessToken();
    return !utilities.isTokenExpired(accessToken);
  };

  const getUserProfile = async (): Promise<UserType> => {
    if (!isAuthenticated()) {
      throw new Error(
        'Cannot fetch user profile, no authentication credential found'
      );
    }
    return await client.getUserProfile();
  };

  const getUser = () => {
    if (!isAuthenticated()) {
      throw new Error(
        'Cannot get user details, no authentication credential found'
      );
    }
    return utilities.getUserFromMemory()!;
  };

  const getToken = async (): Promise<string> => {
    return await client.getToken();
  };

  const logout = () => {
    sessionStore.clear();
    memoryStore.clear();
    return client.logoutEndpoint;
  };

  return {
    ...utilities.featureFlagUtilities,
    ...utilities.tokenClaimUtilities,
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
