import { ClientCredentials } from '../../../sdk/oauth2-flows/ClientCredentials';
import { type ClientCredentialsOptions } from '../../../sdk/oauth2-flows/types';
import { commitTokenToMemory } from '../../../sdk/utilities';
import { getSDKHeader } from '../../../sdk/version';
import * as mocks from '../../mocks';

describe('ClientCredentials', () => {
  const clientConfig: ClientCredentialsOptions = {
    authDomain: 'https://local-testing@kinde.com',
    logoutRedirectURL: 'http://app-domain.com',
    clientSecret: 'client-secret',
    clientId: 'client-id',
  };

  const { sessionManager } = mocks;

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
      sessionManager.destroySession();
      mocks.fetchClient.mockClear();
    });

    it('return access token if an unexpired token is available in memory', async () => {
      const { authDomain } = clientConfig;
      const { token: mockAccessToken } = mocks.getMockAccessToken(authDomain);
      commitTokenToMemory(sessionManager, mockAccessToken, 'access_token');

      const client = new ClientCredentials(clientConfig);
      const accessToken = await client.getToken(sessionManager);
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
      const accessToken = await client.getToken(sessionManager);
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
      const accessToken = await client.getToken(sessionManager);
      expect(accessToken).toBe(mockAccessToken);
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);
      expect(mocks.fetchClient).toHaveBeenCalledWith(tokenEndpoint, {
        method: 'POST',
        headers,
        body,
      });
    });

    it('overrides scope and audience in token request body is provided', async () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(
        clientConfig.authDomain
      );
      mocks.fetchClient.mockResolvedValue({
        json: () => ({ access_token: mockAccessToken }),
      });

      const expectedScope = 'test-scope';
      const expectedAudience = 'test-audience';
      const client = new ClientCredentials({
        ...clientConfig,
        audience: expectedAudience,
        scope: expectedScope,
      });

      const expectedBody = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: expectedScope,
        client_id: clientConfig.clientId,
        client_secret: clientConfig.clientSecret,
        audience: expectedAudience,
      });

      await client.getToken(sessionManager);
      expect(mocks.fetchClient).toHaveBeenCalledWith(tokenEndpoint, {
        method: 'POST',
        headers,
        body: expectedBody,
      });
    });

    it('commits access token to memory, when a new one is fetched', async () => {
      const mockAccessToken = mocks.getMockAccessToken(clientConfig.authDomain);
      mocks.fetchClient.mockResolvedValue({
        json: () => ({ access_token: mockAccessToken }),
      });

      const client = new ClientCredentials(clientConfig);
      await client.getToken(sessionManager);
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);
      expect(sessionManager.getSessionItem('access_token')).toBe(
        mockAccessToken
      );
    });
  });
});
