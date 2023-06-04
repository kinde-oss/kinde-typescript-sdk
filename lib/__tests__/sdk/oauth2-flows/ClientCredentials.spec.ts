import { ClientCredentials } from '../../../sdk/oauth2-flows/ClientCredentials';
import { type CCClientOptions } from '../../../sdk/oauth2-flows/types';
import { commitTokenToMemory } from '../../../sdk/utilities';
import { getSDKHeader } from '../../../sdk/sdk-version';
import { memoryStore } from '../../../sdk/stores';
import * as mocks from '../../mocks';

describe('ClientCredentials', () => {
  const clientConfig: CCClientOptions = {
    authDomain: 'https://local-testing@kinde.com',
    logoutRedirectURL: 'http://app-domain.com',
    clientSecret: 'client-secret',
    clientId: 'client-id',
  };

  describe('new ClientCredentials()', () => {
    it('can construct ClientCredentials instance', () => {
      expect(() => new ClientCredentials(clientConfig)).not.toThrowError();
    });
  });

  describe('getToken()', () => {
    const tokenEndpoint = `${clientConfig.authDomain}/oauth2/token`;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: ClientCredentials.DEFAULT_TOKEN_SCOPES,
      client_id: clientConfig.clientId,
      client_secret: clientConfig.clientSecret,
    });

    const headers = new Headers();
    headers.append(...getSDKHeader());
    headers.append(
      'Content-Type',
      'application/x-www-form-urlencoded; charset=UTF-8'
    );

    afterEach(() => {
      mocks.fetchClient.mockClear();
      memoryStore.clear();
    });

    it('return access token if an unexpired token is available in memory', async () => {
      const { authDomain } = clientConfig;
      const { token: mockAccessToken } = mocks.getMockAccessToken(authDomain);
      commitTokenToMemory(mockAccessToken, 'access_token');

      const client = new ClientCredentials(clientConfig);
      const accessToken = await client.getToken();
      expect(mocks.fetchClient).not.toHaveBeenCalled();
      expect(accessToken).toBe(mockAccessToken);
    });

    it('fetches an access token if no access token is available in memory', async () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(
        clientConfig.authDomain
      );
      mocks.fetchClient.mockResolvedValue({
        json: () => ({ access_token: mockAccessToken }),
      });

      const client = new ClientCredentials(clientConfig);
      const accessToken = await client.getToken();
      expect(accessToken).toBe(mockAccessToken);
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);
    });

    it('fetches an access token if available access token is expired', async () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(
        clientConfig.authDomain,
        true
      );
      mocks.fetchClient.mockResolvedValue({
        json: () => ({ access_token: mockAccessToken }),
      });

      const client = new ClientCredentials(clientConfig);
      const accessToken = await client.getToken();
      expect(accessToken).toBe(mockAccessToken);
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);
      expect(mocks.fetchClient).toHaveBeenCalledWith(tokenEndpoint, {
        method: 'POST',
        headers,
        body,
      });
    });

    it('commits access token to memory, when a new one is fetched', async () => {
      const mockAccessToken = mocks.getMockAccessToken(clientConfig.authDomain);
      mocks.fetchClient.mockResolvedValue({
        json: () => ({ access_token: mockAccessToken }),
      });

      const client = new ClientCredentials(clientConfig);
      await client.getToken();
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);
      expect(memoryStore.getItem('access_token')).toBe(mockAccessToken);
    });
  });
});
