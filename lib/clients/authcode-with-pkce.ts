import type { PKCEClientOptions, AuthURLOptions } from "../oauth2-flows/types";
import { sessionStore, memoryStore } from "../stores";
import { AuthCodeWithPKCE } from "../oauth2-flows";
import * as utilities from "../utilities";
import type { User } from "../utilities";

const createAuthCodeWithPKCEClient = (options: PKCEClientOptions) => {
  const client = new AuthCodeWithPKCE(options);

  const login = async (
    options: AuthURLOptions,
    onLoginRedirect: (callbackURL: URL) => void
  ) => {
    const authURL = await client.createAuthorizationURL(options);
    onLoginRedirect(authURL);
  };

  const register = async (
    options: AuthURLOptions,
    onRegisterRedirect: (callbackURL: URL) => void
  ) => {
    const authURL = await client.createAuthorizationURL({
      ...options,
      start_page: "registration",
    });
    onRegisterRedirect(authURL);
  };

  const createOrg = async (
    options: AuthURLOptions,
    onCreateRedirect: (callbackURL: URL) => void
  ) => {
    const authURL = await client.createAuthorizationURL({
      ...options,
      start_page: "registration",
      is_create_org: true,
    });
    onCreateRedirect(authURL);
  };

  const getUserProfile = async (): Promise<User> => {
    return await client.getUserProfile();
  };

  const handleRedirectToApp = async (
    callbackURL: URL,
    onAppRedirect: () => void
  ) => {
    await client.handleRedirectFromAuthDomain(callbackURL);
    onAppRedirect();
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

export default createAuthCodeWithPKCEClient;
