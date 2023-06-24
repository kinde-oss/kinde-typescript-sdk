import type { AuthorizationCodeOptions } from '../../../sdk/oauth2-flows';
import { base64UrlEncode, sha256 } from '../../../sdk/utilities';
import { AuthCodeWithPKCE } from '../../../sdk/oauth2-flows';
import { getSDKHeader } from '../../../sdk/version';
import * as mocks from '../../mocks';

describe('AuthCodeWitPKCE', () => {
  const clientConfig: AuthorizationCodeOptions = {
    authDomain: 'https://local-testing@kinde.com',
    redirectURL: 'https://app-domain.com',
    logoutRedirectURL: 'http://app-domain.com',
    clientId: 'client-id',
  };

  const client = new AuthCodeWithPKCE(clientConfig);
  const { sessionManager } = mocks;

  describe('new AuthCodeWithPKCE', () => {
    it('can construct AuthCodeWithPKCE instance', () => {
      expect(() => new AuthCodeWithPKCE(clientConfig)).not.toThrowError();
    });
  });

  describe('createAuthorizationURL()', () => {
    afterEach(() => {
      sessionManager.destroySession();
    });

    it('saves generated code verifier to session storage again state', async () => {
      const authURL = await client.createAuthorizationURL(sessionManager);
      const searchParams = new URLSearchParams(authURL.search);

      const state = searchParams.get('state');
      const expectedChallenge = searchParams.get('code_challenge');
      expect(state).toBeDefined();
      expect(expectedChallenge).toBeDefined();

      const codeVerifierKey = `${AuthCodeWithPKCE.STATE_KEY}-${state!}`;
      const codeVerifierState = JSON.parse(
        sessionManager.getSessionItem(codeVerifierKey)! as string
      );
      expect(codeVerifierState).toBeDefined();

      const { codeVerifier } = codeVerifierState;
      expect(codeVerifier).toBeDefined();

      const foundChallenge = base64UrlEncode(await sha256(codeVerifier));
      expect(foundChallenge).toBe(expectedChallenge);
    });

    it('uses provided state to generate authorization URL if given', async () => {
      const expectedState = 'test-app-state';
      const authURL = await client.createAuthorizationURL(sessionManager, {
        state: expectedState,
      });
      const searchParams = new URLSearchParams(authURL.search);

      const state = searchParams.get('state');
      const expectedChallenge = searchParams.get('code_challenge');
      expect(state).toBe(expectedState);
      expect(expectedChallenge).toBeDefined();
    });
  });

  describe('handleRedirectFromAuthDomain()', () => {
    afterEach(() => {
      sessionManager.destroySession();
      mocks.fetchClient.mockClear();
    });

    it('throws an error if callbackURL has an error query param', async () => {
      const callbackURL = new URL(
        `${clientConfig.redirectURL}?state=state&code=code&error=error`
      );
      await expect(async () => {
        await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
      }).rejects.toThrow('Authorization server reported an error: error');
      expect(mocks.fetchClient).not.toHaveBeenCalled();
    });

    it('throws an error if auth flow state is not present in session store', async () => {
      const callbackURL = new URL(
        `${clientConfig.redirectURL}?state=state&code=code`
      );

      await expect(async () => {
        await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
      }).rejects.toThrow('Stored state not found');
      expect(mocks.fetchClient).not.toHaveBeenCalled();
    });

    it('saves tokens to memory store after exchanging auth code for tokens', async () => {
      const mockAccessToken = mocks.getMockAccessToken(clientConfig.authDomain);
      const mockIdToken = mocks.getMockIdToken(clientConfig.authDomain);
      mocks.fetchClient.mockResolvedValue({
        json: () => ({
          access_token: mockAccessToken.token,
          refresh_token: 'refresh_token',
          id_token: mockIdToken.token,
        }),
      });

      const callbackURL = new URL(
        `${clientConfig.redirectURL}?state=state&code=code`
      );
      const codeVerifierKey = `${AuthCodeWithPKCE.STATE_KEY}-state`;
      sessionManager.setSessionItem(
        codeVerifierKey,
        JSON.stringify({ codeVerifier: 'code-verifier' })
      );
      await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);

      const foundRefreshToken = sessionManager.getSessionItem('refresh_token');
      const foundAccessToken = sessionManager.getSessionItem('access_token');
      const foundIdToken = sessionManager.getSessionItem('id_token');

      expect(foundAccessToken).toBe(mockAccessToken.token);
      expect(foundRefreshToken).toBe('refresh_token');
      expect(foundIdToken).toBe(mockIdToken.token);
    });
  });

  describe('getToken()', () => {
    afterEach(() => {
      sessionManager.destroySession();
      mocks.fetchClient.mockClear();
    });

    it('return an existing token if an unexpired token is available', async () => {
      const mockAccessToken = mocks.getMockAccessToken(clientConfig.authDomain);
      sessionManager.setSessionItem('access_token', mockAccessToken.token);
      const token = await client.getToken(sessionManager);
      expect(token).toBe(mockAccessToken.token);
      expect(mocks.fetchClient).not.toHaveBeenCalled();
    });

    it('throws an error if no refresh token is found in memory', async () => {
      const mockAccessToken = mocks.getMockAccessToken(
        clientConfig.authDomain,
        true
      );
      sessionManager.setSessionItem('access_token', mockAccessToken.token);
      await expect(async () => {
        await client.getToken(sessionManager);
      }).rejects.toThrow('Cannot persist session no valid refresh token found');
    });

    it('fetches new tokens if access token is expired and refresh token is available', async () => {
      const newAccessToken = mocks.getMockAccessToken(clientConfig.authDomain);
      const newIdToken = mocks.getMockIdToken(clientConfig.authDomain);
      mocks.fetchClient.mockResolvedValue({
        json: () => ({
          access_token: newAccessToken.token,
          refresh_token: 'new_refresh_token',
          id_token: newIdToken.token,
        }),
      });

      const expiredAccessToken = mocks.getMockAccessToken(
        clientConfig.authDomain,
        true
      );
      sessionManager.setSessionItem('access_token', expiredAccessToken.token);
      sessionManager.setSessionItem('refresh_token', 'refresh_token');

      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: 'refresh_token',
        client_id: clientConfig.clientId,
      });

      const headers = new Headers();
      headers.append(...getSDKHeader());
      headers.append(
        'Content-Type',
        'application/x-www-form-urlencoded; charset=UTF-8'
      );

      await client.getToken(sessionManager);
      expect(mocks.fetchClient).toHaveBeenCalledWith(
        `${clientConfig.authDomain}/oauth2/token`,
        { method: 'POST', headers, body, credentials: 'include' }
      );
    });

    it('commits new tokens to memory if new tokens are fetched', async () => {
      const newAccessToken = mocks.getMockAccessToken(clientConfig.authDomain);
      const newIdToken = mocks.getMockIdToken(clientConfig.authDomain);
      const newRefreshToken = 'new_refresh_token';

      mocks.fetchClient.mockResolvedValue({
        json: () => ({
          access_token: newAccessToken.token,
          refresh_token: newRefreshToken,
          id_token: newIdToken.token,
        }),
      });

      const expiredAccessToken = mocks.getMockAccessToken(
        clientConfig.authDomain,
        true
      );
      sessionManager.setSessionItem('access_token', expiredAccessToken.token);
      sessionManager.setSessionItem('refresh_token', 'refresh_token');

      await client.getToken(sessionManager);
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);

      const foundRefreshToken = sessionManager.getSessionItem('refresh_token');
      const foundAccessToken = sessionManager.getSessionItem('access_token');
      const foundIdToken = sessionManager.getSessionItem('id_token');

      expect(foundAccessToken).toBe(newAccessToken.token);
      expect(foundRefreshToken).toBe(newRefreshToken);
      expect(foundIdToken).toBe(newIdToken.token);
    });
  });
});
