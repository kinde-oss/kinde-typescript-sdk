import type {
  AuthorizationCodeOptions,
  SDKHeaderOverrideOptions,
} from '../../../sdk/oauth2-flows';
import { base64UrlEncode, sha256 } from '../../../sdk/utilities';
import { AuthCodeWithPKCE } from '../../../sdk/oauth2-flows';
import { KindeSDKErrorCode } from '../../../sdk/exceptions';
import { getSDKHeader } from '../../../sdk/version';
import * as mocks from '../../mocks';
import { describe, it, expect, afterEach, vi } from 'vitest';

describe('AuthCodeWitPKCE', () => {
  const { sessionManager } = mocks;
  const clientConfig: AuthorizationCodeOptions = {
    authDomain: 'https://local-testing@kinde.com',
    redirectURL: 'https://app-domain.com',
    logoutRedirectURL: 'http://app-domain.com',
    clientId: 'client-id',
  };

  describe('new AuthCodeWithPKCE', () => {
    it('can construct AuthCodeWithPKCE instance', () => {
      expect(() => new AuthCodeWithPKCE(clientConfig)).not.toThrowError();
    });
  });

  describe('createAuthorizationURL()', () => {
    afterEach(async () => {
      await sessionManager.destroySession();
    });

    it('saves generated code verifier to session storage again state', async () => {
      const client = new AuthCodeWithPKCE(clientConfig);
      const authURL = await client.createAuthorizationURL(sessionManager);
      const searchParams = new URLSearchParams(authURL.search);

      const state = searchParams.get('state');
      const expectedChallenge = searchParams.get('code_challenge');
      expect(state).toBeDefined();
      expect(expectedChallenge).toBeDefined();

      const codeVerifierKey = `${AuthCodeWithPKCE.STATE_KEY}-${state!}`;
      const codeVerifierState = JSON.parse(
        (await sessionManager.getSessionItem(codeVerifierKey)) as string
      );
      expect(codeVerifierState).toBeDefined();

      const { codeVerifier } = codeVerifierState;
      expect(codeVerifier).toBeDefined();

      const foundChallenge = base64UrlEncode(await sha256(codeVerifier));
      expect(foundChallenge).toBe(expectedChallenge);
    });

    it('uses provided state to generate authorization URL if given', async () => {
      const expectedState = 'test-app-state';
      const client = new AuthCodeWithPKCE(clientConfig);
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
    afterEach(async () => {
      await sessionManager.destroySession();
      mocks.fetchClient.mockClear();
    });

    it('throws an error if callbackURL has an error query param', async () => {
      const callbackURL = new URL(
        `${clientConfig.redirectURL}?state=state&code=code&error=error`
      );
      await expect(async () => {
        const client = new AuthCodeWithPKCE(clientConfig);
        await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
      }).rejects.toThrow('Authorization server reported an error: error');
      expect(mocks.fetchClient).not.toHaveBeenCalled();
    });

    it('throws an error if auth flow state is not present in session store', async () => {
      const callbackURL = new URL(
        `${clientConfig.redirectURL}?state=state&code=code`
      );

      await expect(async () => {
        const client = new AuthCodeWithPKCE(clientConfig);
        await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
      }).rejects.toThrow('Stored state not found');
      expect(mocks.fetchClient).not.toHaveBeenCalled();
    });

    it('destroys session when auth-code exchange returns an error', async () => {
      const callbackURL = new URL(
        `${clientConfig.redirectURL}?state=state&code=code`
      );
      const codeVerifierKey = `${AuthCodeWithPKCE.STATE_KEY}-state`;
      await sessionManager.setSessionItem(
        codeVerifierKey,
        JSON.stringify({ codeVerifier: 'code-verifier' })
      );
      await sessionManager.setSessionItem('access_token', 'stale-access');
      const destroySpy = vi.spyOn(sessionManager, 'destroySession');
      mocks.fetchClient.mockResolvedValue({
        json: () => ({
          error: 'access_denied',
          error_description: 'User denied access',
        }),
      });

      try {
        await expect(async () => {
          const client = new AuthCodeWithPKCE(clientConfig);
          await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
        }).rejects.toThrow('User denied access');
        expect(mocks.fetchClient).toHaveBeenCalled();
        expect(destroySpy).toHaveBeenCalled();
        expect(await sessionManager.getSessionItem('access_token')).toBeNull();
      } finally {
        destroySpy.mockRestore();
      }
    });

    it('destroys session when auth-code exchange returns invalid_grant', async () => {
      const callbackURL = new URL(
        `${clientConfig.redirectURL}?state=state&code=code`
      );
      const codeVerifierKey = `${AuthCodeWithPKCE.STATE_KEY}-state`;
      await sessionManager.setSessionItem(
        codeVerifierKey,
        JSON.stringify({ codeVerifier: 'code-verifier' })
      );
      await sessionManager.setSessionItem('refresh_token', 'existing-refresh');
      const destroySpy = vi.spyOn(sessionManager, 'destroySession');
      mocks.fetchClient.mockResolvedValue({
        json: () => ({
          error: 'invalid_grant',
          error_description: 'Authorization code is invalid',
        }),
      });

      try {
        await expect(async () => {
          const client = new AuthCodeWithPKCE(clientConfig);
          await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
        }).rejects.toThrow('Authorization code is invalid');
        expect(destroySpy).toHaveBeenCalled();
        expect(await sessionManager.getSessionItem('refresh_token')).toBeNull();
      } finally {
        destroySpy.mockRestore();
      }
    });

    it('exchange success does not destroy session', async () => {
      const mockAccessToken = await mocks.getMockAccessToken(
        clientConfig.authDomain
      );
      const mockIdToken = await mocks.getMockIdToken(clientConfig.authDomain);
      const destroySpy = vi.spyOn(sessionManager, 'destroySession');
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
      await sessionManager.setSessionItem(
        codeVerifierKey,
        JSON.stringify({ codeVerifier: 'code-verifier' })
      );

      const client = new AuthCodeWithPKCE(clientConfig);
      try {
        await client.handleRedirectFromAuthDomain(sessionManager, callbackURL);
        expect(mocks.fetchClient).toHaveBeenCalledTimes(1);
        expect(destroySpy).not.toHaveBeenCalled();
        expect(await sessionManager.getSessionItem('access_token')).toBe(
          mockAccessToken.token
        );
        expect(await sessionManager.getSessionItem('refresh_token')).toBe(
          'refresh_token'
        );
        expect(await sessionManager.getSessionItem('id_token')).toBe(
          mockIdToken.token
        );
      } finally {
        destroySpy.mockRestore();
      }
    });
  });

  describe('refreshTokens()', () => {
    afterEach(async () => {
      await sessionManager.destroySession();
      mocks.fetchClient.mockClear();
    });

    it('throws on refresh invalid_grant without destroying session', async () => {
      const destroySpy = vi.spyOn(sessionManager, 'destroySession');
      mocks.fetchClient.mockResolvedValue({
        json: () => ({
          error: 'invalid_grant',
          error_description: 'Refresh token is invalid or expired',
        }),
      });
      await sessionManager.setSessionItem('refresh_token', 'refresh_token');
      await sessionManager.setSessionItem('access_token', 'access_token');

      const client = new AuthCodeWithPKCE(clientConfig);
      try {
        await expect(client.refreshTokens(sessionManager)).rejects.toMatchObject({
          errorCode: KindeSDKErrorCode.STALE_REFRESH_TOKEN,
          message: 'Refresh token is invalid or expired',
        });
        expect(destroySpy).not.toHaveBeenCalled();
        expect(await sessionManager.getSessionItem('access_token')).toBe(
          'access_token'
        );
        expect(await sessionManager.getSessionItem('refresh_token')).toBe(
          'refresh_token'
        );
      } finally {
        destroySpy.mockRestore();
      }
    });

    it('commits tokens on successful refresh', async () => {
      const newAccessToken = await mocks.getMockAccessToken(clientConfig.authDomain);
      const newIdToken = await mocks.getMockIdToken(clientConfig.authDomain);
      const destroySpy = vi.spyOn(sessionManager, 'destroySession');
      mocks.fetchClient.mockResolvedValue({
        json: () => ({
          access_token: newAccessToken.token,
          refresh_token: 'new_refresh_token',
          id_token: newIdToken.token,
        }),
      });
      await sessionManager.setSessionItem('refresh_token', 'refresh_token');
      await sessionManager.setSessionItem('access_token', 'access_token');

      const client = new AuthCodeWithPKCE(clientConfig);
      try {
        const tokens = await client.refreshTokens(sessionManager);
        expect(tokens.access_token).toBe(newAccessToken.token);
        expect(destroySpy).not.toHaveBeenCalled();
        expect(await sessionManager.getSessionItem('access_token')).toBe(
          newAccessToken.token
        );
        expect(await sessionManager.getSessionItem('refresh_token')).toBe(
          'new_refresh_token'
        );
      } finally {
        destroySpy.mockRestore();
      }
    });
  });

  describe('getToken()', () => {
    afterEach(async () => {
      await sessionManager.destroySession();
      mocks.fetchClient.mockClear();
    });

    it('return an existing token if an unexpired token is available', async () => {
      const mockAccessToken = await mocks.getMockAccessToken(
        clientConfig.authDomain
      );
      await sessionManager.setSessionItem('access_token', mockAccessToken.token);
      const client = new AuthCodeWithPKCE(clientConfig);
      const token = await client.getToken(sessionManager);
      expect(token).toBe(mockAccessToken.token);
      expect(mocks.fetchClient).not.toHaveBeenCalled();
    });

    it('throws an error if no refresh token is found in memory', async () => {
      const mockAccessToken = await mocks.getMockAccessToken(
        clientConfig.authDomain,
        true
      );
      await sessionManager.setSessionItem('access_token', mockAccessToken.token);
      await expect(async () => {
        const client = new AuthCodeWithPKCE(clientConfig);
        await client.getToken(sessionManager);
      }).rejects.toThrow('Cannot persist session no valid refresh token found');
    });

    it('fetches new tokens if access token is expired and refresh token is available', async () => {
      const newAccessToken = await mocks.getMockAccessToken(clientConfig.authDomain);
      const newIdToken = await mocks.getMockIdToken(clientConfig.authDomain);
      mocks.fetchClient.mockResolvedValue({
        json: () => ({
          access_token: newAccessToken.token,
          refresh_token: 'new_refresh_token',
          id_token: newIdToken.token,
        }),
      });

      const expiredAccessToken = await mocks.getMockAccessToken(
        clientConfig.authDomain,
        true
      );
      await sessionManager.setSessionItem('access_token', expiredAccessToken.token);
      await sessionManager.setSessionItem('refresh_token', 'refresh_token');

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

      const client = new AuthCodeWithPKCE(clientConfig);
      await client.getToken(sessionManager);
      expect(mocks.fetchClient).toHaveBeenCalledWith(
        `${clientConfig.authDomain}/oauth2/token`,
        { method: 'POST', headers, body, credentials: 'include' }
      );
    });

    it('overrides SDK version header if options are provided to client constructor', async () => {
      const newAccessToken = await mocks.getMockAccessToken(clientConfig.authDomain);
      const newIdToken = await mocks.getMockIdToken(clientConfig.authDomain);
      mocks.fetchClient.mockResolvedValue({
        json: () => ({
          access_token: newAccessToken.token,
          refresh_token: 'new_refresh_token',
          id_token: newIdToken.token,
        }),
      });

      const expiredAccessToken = await mocks.getMockAccessToken(
        clientConfig.authDomain,
        true
      );
      await sessionManager.setSessionItem('access_token', expiredAccessToken.token);
      await sessionManager.setSessionItem('refresh_token', 'refresh_token');

      const headerOverrides: SDKHeaderOverrideOptions = {
        framework: 'TypeScript-Framework',
        frameworkVersion: '1.1.1',
      };

      const headers = new Headers();
      headers.append(...getSDKHeader(headerOverrides));
      headers.append(
        'Content-Type',
        'application/x-www-form-urlencoded; charset=UTF-8'
      );

      const client = new AuthCodeWithPKCE({
        ...clientConfig,
        ...headerOverrides,
      });
      await client.getToken(sessionManager);
      expect(mocks.fetchClient).toHaveBeenCalledWith(
        `${clientConfig.authDomain}/oauth2/token`,
        expect.objectContaining({ headers })
      );
    });

    it('commits new tokens to memory if new tokens are fetched', async () => {
      const newAccessToken = await mocks.getMockAccessToken(clientConfig.authDomain);
      const newIdToken = await mocks.getMockIdToken(clientConfig.authDomain);
      const newRefreshToken = 'new_refresh_token';

      mocks.fetchClient.mockResolvedValue({
        json: () => ({
          access_token: newAccessToken.token,
          refresh_token: newRefreshToken,
          id_token: newIdToken.token,
        }),
      });

      const expiredAccessToken = await mocks.getMockAccessToken(
        clientConfig.authDomain,
        true
      );
      await sessionManager.setSessionItem('access_token', expiredAccessToken.token);
      await sessionManager.setSessionItem('refresh_token', 'refresh_token');

      const client = new AuthCodeWithPKCE(clientConfig);
      await client.getToken(sessionManager);
      expect(mocks.fetchClient).toHaveBeenCalledTimes(1);

      const foundRefreshToken = await sessionManager.getSessionItem('refresh_token');
      const foundAccessToken = await sessionManager.getSessionItem('access_token');
      const foundIdToken = await sessionManager.getSessionItem('id_token');

      expect(foundAccessToken).toBe(newAccessToken.token);
      expect(foundRefreshToken).toBe(newRefreshToken);
      expect(foundIdToken).toBe(newIdToken.token);
    });
  });
});
