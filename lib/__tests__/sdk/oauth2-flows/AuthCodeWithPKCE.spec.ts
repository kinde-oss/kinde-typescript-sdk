import type { PKCEClientOptions } from '../../../sdk/oauth2-flows';
import { base64UrlEncode, sha256 } from '../../../sdk/utilities';
import { memoryStore, sessionStore } from '../../../sdk/stores';
import { AuthCodeWithPKCE } from '../../../sdk/oauth2-flows';
import { getSDKHeader } from '../../../sdk/sdk-version';
import * as mocks from '../../mocks';

describe('AuthCodeWitPKCE', () => {
  const clientConfig: PKCEClientOptions = {
    authDomain: 'https://local-testing@kinde.com',
    redirectURL: 'https://app-domain.com',
    logoutRedirectURL: 'http://app-domain.com',
    clientId: 'client-id',
  };

  const client = new AuthCodeWithPKCE(clientConfig);

  describe('new AuthCodeWithPKCE', () => {
    it('can construct AuthCodeWithPKCE instance', () => {
      expect(() => new AuthCodeWithPKCE(clientConfig)).not.toThrowError();
    });
  });

  describe('createAuthorizationURL()', () => {
    afterEach(() => {
      sessionStore.clear();
    });

    it('uses default scopes if none is provided in the url options', async () => {
      const authURL = await client.createAuthorizationURL();
      const searchParams = new URLSearchParams(authURL.search);
      expect(searchParams.get('scope')).toBe(
        AuthCodeWithPKCE.DEFAULT_TOKEN_SCOPES
      );
    });

    it('saves generated code verifier to session storage again state', async () => {
      const authURL = await client.createAuthorizationURL();
      const searchParams = new URLSearchParams(authURL.search);

      const state = searchParams.get('state');
      const expectedChallenge = searchParams.get('code_challenge');
      expect(state).toBeDefined();
      expect(expectedChallenge).toBeDefined();

      const codeVerifierKey = `${AuthCodeWithPKCE.STATE_KEY}-${state!}`;
      const codeVerifierState = JSON.parse(
        sessionStore.getItem(codeVerifierKey)! as string
      );
      expect(codeVerifierState).toBeDefined();

      const { codeVerifier } = codeVerifierState;
      expect(codeVerifier).toBeDefined();

      const foundChallenge = base64UrlEncode(await sha256(codeVerifier));
      expect(foundChallenge).toBe(expectedChallenge);
    });

    it('uses provided state to generate authorization URL if given', async () => {
      const expectedState = 'test-app-state';
      const authURL = await client.createAuthorizationURL({
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
      mocks.fetchClient.mockClear();
      sessionStore.clear();
      memoryStore.clear();
    });

    it('throws an error if callbackURL has an error query param', async () => {
      const callbackURL = new URL(
        `${clientConfig.redirectURL}?state=state&code=code&error=error`
      );
      await expect(async () => {
        await client.handleRedirectFromAuthDomain(callbackURL);
      }).rejects.toThrow('Authorization server reported an error: error');
      expect(mocks.fetchClient).not.toHaveBeenCalled();
    });

    it('throws an error if auth flow state is not present in session store', async () => {
      const callbackURL = new URL(
        `${clientConfig.redirectURL}?state=state&code=code`
      );

      await expect(async () => {
        await client.handleRedirectFromAuthDomain(callbackURL);
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
      sessionStore.setItem(
        codeVerifierKey,
        JSON.stringify({ codeVerifier: 'code-verifier' })
      );
      await client.handleRedirectFromAuthDomain(callbackURL);
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);

      const foundRefreshToken = memoryStore.getItem('refresh_token');
      const foundAccessToken = memoryStore.getItem('access_token');
      const foundIdToken = memoryStore.getItem('id_token');

      expect(foundAccessToken).toBe(mockAccessToken.token);
      expect(foundRefreshToken).toBe('refresh_token');
      expect(foundIdToken).toBe(mockIdToken.token);
    });
  });

  describe('getToken()', () => {
    afterEach(() => {
      mocks.fetchClient.mockClear();
      sessionStore.clear();
      memoryStore.clear();
    });

    it('return an existing token if an unexpired token is available', async () => {
      const mockAccessToken = mocks.getMockAccessToken(clientConfig.authDomain);
      memoryStore.setItem('access_token', mockAccessToken.token);
      const token = await client.getToken();
      expect(token).toBe(mockAccessToken.token);
      expect(mocks.fetchClient).not.toHaveBeenCalled();
    });

    it('throws an error if no refresh token is found in memory', async () => {
      const mockAccessToken = mocks.getMockAccessToken(
        clientConfig.authDomain,
        true
      );
      memoryStore.setItem('access_token', mockAccessToken.token);
      await expect(async () => {
        await client.getToken();
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
      memoryStore.setItem('access_token', expiredAccessToken.token);
      memoryStore.setItem('refresh_token', 'refresh_token');

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

      await client.getToken();
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
      memoryStore.setItem('access_token', expiredAccessToken.token);
      memoryStore.setItem('refresh_token', 'refresh_token');

      await client.getToken();
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);

      const foundRefreshToken = memoryStore.getItem('refresh_token');
      const foundAccessToken = memoryStore.getItem('access_token');
      const foundIdToken = memoryStore.getItem('id_token');

      expect(foundAccessToken).toBe(newAccessToken.token);
      expect(foundRefreshToken).toBe(newRefreshToken);
      expect(foundIdToken).toBe(newIdToken.token);
    });
  });

  describe('getUserProfile()', () => {
    afterEach(() => {
      mocks.fetchClient.mockClear();
      sessionStore.clear();
      memoryStore.clear();
    });

    it('fetches user profile using the available access token', async () => {
      const mockAccessToken = mocks.getMockAccessToken(clientConfig.authDomain);
      memoryStore.setItem('access_token', mockAccessToken.token);

      const headers = new Headers();
      headers.append('Authorization', `Bearer ${mockAccessToken.token}`);
      headers.append('Accept', 'application/json');

      mocks.fetchClient.mockResolvedValue({
        json: () => ({
          family_name: 'family_name',
          given_name: 'give_name',
          email: 'test@test.com',
          picture: null,
          id: 'id',
        }),
      });

      await client.getUserProfile();
      expect(mocks.fetchClient).toHaveBeenCalledWith(
        `${clientConfig.authDomain}/oauth2/v2/user_profile`,
        { method: 'GET', headers }
      );
    });

    it('commits fetched user details to memory store', async () => {
      const mockAccessToken = mocks.getMockAccessToken(clientConfig.authDomain);
      memoryStore.setItem('access_token', mockAccessToken.token);
      const userDetails = {
        family_name: 'family_name',
        given_name: 'give_name',
        email: 'test@test.com',
        picture: null,
        id: 'id',
      };

      mocks.fetchClient.mockResolvedValue({
        json: () => userDetails,
      });

      await client.getUserProfile();
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);
      expect(memoryStore.getItem('user')).toStrictEqual(userDetails);
    });
  });
});
