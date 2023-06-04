import type { PKCEClientOptions, AuthURLOptions } from '../oauth2-flows/types';
import { AuthCodeWithPKCE, AuthorizationCode } from '../oauth2-flows';
import { sessionStore, memoryStore } from '../stores';
import type { UserType } from '../utilities';
import * as utilities from '../utilities';

const createAuthorizationCodeClient = (
  options: PKCEClientOptions,
  isPKCE: boolean
) => {
  const client = !isPKCE
    ? new AuthorizationCode(options)
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

  const getUserProfile = async (): Promise<UserType> => {
    return await client.getUserProfile();
  };

  const handleRedirectToApp = async (callbackURL: URL) => {
    await client.handleRedirectFromAuthDomain(callbackURL);
  };

  const isAuthenticated = () => {
    const accessToken = utilities.getAccessToken();
    return !utilities.isTokenExpired(accessToken);
  };

  const getToken = async (): Promise<string> => {
    return await client.getToken();
  };

  const getUser = () => {
    return utilities.getUserFromMemory();
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
