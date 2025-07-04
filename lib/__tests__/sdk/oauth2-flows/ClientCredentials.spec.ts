import { ClientCredentials } from '../../../sdk/oauth2-flows/ClientCredentials';
import { type ClientCredentialsOptions } from '../../../sdk/oauth2-flows/types';
import {
  type TokenValidationDetailsType,
  commitTokenToSession,
  generateRandomString,
} from '../../../sdk/utilities';
import { getSDKHeader } from '../../../sdk/version';
import * as mocks from '../../mocks';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';

describe('ClientCredentials', () => {
  const clientConfig: ClientCredentialsOptions = {
    authDomain: 'https://local-testing@kinde.com',
    logoutRedirectURL: 'http://app-domain.com',
    clientSecret: generateRandomString(50),
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

    let validationDetails: TokenValidationDetailsType;

    beforeAll(async () => {
      validationDetails = {
        issuer: clientConfig.authDomain,
      };
    });

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientConfig.clientId,
      client_secret: clientConfig.clientSecret,
    });

    const headers = new Headers();
    headers.append(...getSDKHeader());
    headers.append(
      'Content-Type',
      'application/x-www-form-urlencoded; charset=UTF-8'
    );

    afterEach(async () => {
      await sessionManager.destroySession();
      mocks.fetchClient.mockClear();
    });

    it('throws an exception when fetching access token returns an error response', async () => {
      const errorDescription = 'error_description';
      mocks.fetchClient.mockResolvedValue({
        json: () => ({
          error: 'error',
          [errorDescription]: errorDescription,
        }),
      });

      const client = new ClientCredentials(clientConfig);
      await expect(async () => {
        await client.getToken(sessionManager);
      }).rejects.toThrow(errorDescription);
      expect(mocks.fetchClient).toHaveBeenCalled();
    });

    it('return access token if an unexpired token is available in memory', async () => {
      const { authDomain } = clientConfig;
      const { token: mockAccessToken } = await mocks.getMockAccessToken(authDomain);
      await commitTokenToSession(
        sessionManager,
        mockAccessToken,
        'access_token',
        validationDetails
      );

      const client = new ClientCredentials(clientConfig);
      const accessToken = await client.getToken(sessionManager);
      expect(mocks.fetchClient).not.toHaveBeenCalled();
      expect(accessToken).toBe(mockAccessToken);
    });

    it('fetches an access token if no access token is available in memory', async () => {
      const { token: mockAccessToken } = await mocks.getMockAccessToken(
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
      const { token: expiredMockAccessToken } = await mocks.getMockAccessToken(
        clientConfig.authDomain,
        true
      );
      await sessionManager.setSessionItem('access_token', expiredMockAccessToken);
      const { token: mockAccessToken } = await mocks.getMockAccessToken(
        clientConfig.authDomain
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
      const { token: mockAccessToken } = await mocks.getMockAccessToken(
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
        client_id: clientConfig.clientId,
        client_secret: clientConfig.clientSecret,
        scope: expectedScope,
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
      const mockAccessToken = await mocks.getMockAccessToken(
        clientConfig.authDomain
      );
      mocks.fetchClient.mockResolvedValue({
        json: () => ({ access_token: mockAccessToken.token }),
      });

      const client = new ClientCredentials(clientConfig);
      await client.getToken(sessionManager);
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);
      expect(await sessionManager.getSessionItem('access_token')).toBe(
        mockAccessToken.token
      );
    });
  });
});
