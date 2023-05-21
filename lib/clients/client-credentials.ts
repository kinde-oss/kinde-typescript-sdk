import type { CCClientOptions } from "../oauth2-flows";
import { ClientCredentials } from "../oauth2-flows";
import * as utilities from "../utilities";
import { memoryStore } from "../stores";

const createCCClient = (options: CCClientOptions) => {
  const client = new ClientCredentials(options);

  const isAuthenticated = () => {
    const accessToken = utilities.getAccessToken();
    return !utilities.isTokenExpired(accessToken);
  };

  const flushTokens = () => {
    memoryStore.clear();
  };

  const getToken = async (): Promise<string> => {
    return await client.getToken();
  };

  return {
    ...utilities.featureFlagUtilities,
    ...utilities.tokenClaimUtilities,
    isAuthenticated,
    flushTokens,
    getToken,
  };
};

export default createCCClient;
