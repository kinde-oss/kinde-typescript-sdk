import * as mocks from '../../mocks';

import {
  type TokenCollection,
  commitTokensToMemory,
  commitTokenToMemory,
  isTokenExpired,
} from '../../../sdk/utilities';

import { 
  KindeSDKError,
  KindeSDKErrorCode,
} from '../../../sdk/exceptions';

describe('token-utils', () => {
  const domain = 'local-testing@kinde.com';
  const { sessionManager } = mocks;

  describe('commitTokensToMemory', () => {
    it('stores all provided tokens to memory', async () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(domain);
      const { token: mockIdToken } = mocks.getMockAccessToken(domain);
      const tokenCollection: TokenCollection = {
        refresh_token: 'refresh_token',
        access_token: mockAccessToken,
        id_token: mockIdToken,
      };
      await commitTokensToMemory(sessionManager, tokenCollection);

      expect(await sessionManager.getSessionItem('refresh_token')).toBe(
        tokenCollection.refresh_token
      );
      expect(await sessionManager.getSessionItem('access_token')).toBe(
        mockAccessToken
      );
      expect(await sessionManager.getSessionItem('id_token')).toBe(mockIdToken);
    });
  });

  describe('commitTokenToMemory()', () => {
    afterEach(async () => {
      await sessionManager.destroySession();
    });

    it('stores provided token to memory', async () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(domain);
      await commitTokenToMemory(
        sessionManager,
        mockAccessToken,
        'access_token'
      );
      expect(await sessionManager.getSessionItem('access_token')).toBe(
        mockAccessToken
      );
    });

    it('throws exception if attempting to store invalid token', async () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(domain, true);
      const commitTokenFn = async () => await commitTokenToMemory(
        sessionManager, mockAccessToken, 'access_token'
      );
      await expect(commitTokenFn).rejects.toBeInstanceOf(KindeSDKError);
      await expect(commitTokenFn).rejects.toHaveProperty(
        'errorCode', KindeSDKErrorCode.INVALID_TOKEN_MEMORY_COMMIT
      );
    });

    it('stores user information if provide token is an id token', async () => {
      const { token: mockIdToken, payload: idTokenPayload } =
        mocks.getMockIdToken(domain);
      await commitTokenToMemory(sessionManager, mockIdToken, 'id_token');

      const storedUser = await sessionManager.getSessionItem('user');
      const expectedUser = {
        family_name: idTokenPayload.family_name,
        given_name: idTokenPayload.given_name,
        email: idTokenPayload.email,
        id: idTokenPayload.sub,
        picture: null,
      };

      expect(await sessionManager.getSessionItem('id_token')).toBe(mockIdToken);
      expect(storedUser).toStrictEqual(expectedUser);
    });
  });

  describe('isTokenExpired()', () => {
    it('returns true if null is provided as argument', () => {
      expect(isTokenExpired(null)).toBe(true);
    });

    it('returns true if provided token is expired', () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(domain, true);
      expect(isTokenExpired(mockAccessToken)).toBe(true);
    });

    it('returns true if provided token is missing "exp" claim', () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(domain, true);
      expect(isTokenExpired(mockAccessToken)).toBe(true);
    });

    it('returns false if provided token is not expired', () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(domain);
      expect(isTokenExpired(mockAccessToken)).toBe(false);
    });
  });
});
