import { getSDKHeader } from '../../../sdk/version';
import * as mocks from '../../mocks';

import {
  type AuthURLOptions,
  AuthorizationCode,
  type AuthorizationCodeOptions,
} from '../../../sdk/oauth2-flows';

describe('AuthorizationCode', () => {
  const clientSecret = 'client-secret' as const;
  const clientConfig: AuthorizationCodeOptions = {
    authDomain: 'https://local-testing@kinde.com',
    redirectURL: 'https://app-domain.com',
    logoutRedirectURL: 'http://app-domain.com',
    clientId: 'client-id',
  };

  const client = new AuthorizationCode(clientConfig, clientSecret);
  const { sessionManager } = mocks;

  describe('new AuthorizationCode', () => {
    it('can construct AuthorizationCode instance', () => {
      expect(
        () => new AuthorizationCode(clientConfig, 'client-secret')
      ).not.toThrowError();
    });
  });

  describe('createAuthorizationURL()', () => {
    afterEach(() => {
      sessionManager.destroySession();
    });

    it('uses default scopes if none is provided in the url options', async () => {
      const authURL = await client.createAuthorizationURL(sessionManager);
      const searchParams = new URLSearchParams(authURL.search);
      expect(searchParams.get('scope')).toBe(
        AuthorizationCode.DEFAULT_TOKEN_SCOPES
      );
    });

    it('uses provided scope and audience if given in url options', async () => {
      const expectedScope = 'test-scope';
      const expectedAudience = 'test-audience';
      const testClient = new AuthorizationCode(
        {
          ...clientConfig,
          audience: expectedAudience,
          scope: expectedScope,
        },
        'client-secret'
      );
      const authURL = await testClient.createAuthorizationURL(sessionManager);
      const searchParams = new URLSearchParams(authURL.search);
      expect(searchParams.get('audience')).toBe(expectedAudience);
      expect(searchParams.get('scope')).toBe(expectedScope);
    });

    it('overrides optional url search params if they are provided', async () => {
      const expectedParams: AuthURLOptions = {
        is_create_org: true,
        start_page: 'registration',
        org_code: 'test-org-code',
        org_name: 'test-org-name',
      };

      const authURL = await client.createAuthorizationURL(
        sessionManager,
        expectedParams
      );
      const searchParams = new URLSearchParams(authURL.search);
      Object.entries(expectedParams).forEach(([key, expectedValue]) => {
        expect(searchParams.get(key)).toBe(String(expectedValue));
      });
    });

    it('saves state to session storage again state', async () => {
      const authURL = await client.createAuthorizationURL(sessionManager);
      const searchParams = new URLSearchParams(authURL.search);
      const state = searchParams.get('state');
      const stateKey = AuthorizationCode.STATE_KEY;
      const storedState = sessionManager.getSessionItem(stateKey)! as string;
      expect(storedState).toBe(state);
    });

    it('uses provided state to generate authorization URL if given', async () => {
      const expectedState = 'test-app-state';
      const authURL = await client.createAuthorizationURL(sessionManager, {
        state: expectedState,
      });
      const searchParams = new URLSearchParams(authURL.search);
      const state = searchParams.get('state');
      expect(state).toBe(expectedState);
    });
  });

  describe('handleRedirectFromAuthDomain()', () => {
    afterEach(() => {
      mocks.fetchClient.mockClear();
      sessionManager.destroySession();
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
      }).rejects.toThrow('Authentication flow state not found');
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
      const stateKey = AuthorizationCode.STATE_KEY;
      sessionManager.setSessionItem(stateKey, 'state');
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
      mocks.fetchClient.mockClear();
      sessionManager.destroySession();
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
        client_id: clientConfig.clientId,
        client_secret: clientSecret,
        refresh_token: 'refresh_token',
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
        { method: 'POST', headers, body, credentials: undefined }
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

  describe('getUserProfile()', () => {
    afterEach(() => {
      mocks.fetchClient.mockClear();
      sessionManager.destroySession();
    });

    it('fetches user profile using the available access token', async () => {
      const mockAccessToken = mocks.getMockAccessToken(clientConfig.authDomain);
      sessionManager.setSessionItem('access_token', mockAccessToken.token);

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

      await client.getUserProfile(sessionManager);
      expect(mocks.fetchClient).toHaveBeenCalledWith(
        `${clientConfig.authDomain}/oauth2/v2/user_profile`,
        { method: 'GET', headers }
      );
    });

    it('commits fetched user details to memory store', async () => {
      const mockAccessToken = mocks.getMockAccessToken(clientConfig.authDomain);
      sessionManager.setSessionItem('access_token', mockAccessToken.token);
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

      await client.getUserProfile(sessionManager);
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);
      expect(sessionManager.getSessionItem('user')).toStrictEqual(userDetails);
    });
  });
});
