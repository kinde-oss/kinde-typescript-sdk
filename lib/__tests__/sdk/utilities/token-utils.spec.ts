import * as mocks from '../../mocks';

import {
  type TokenCollection,
  commitTokensToMemory,
  commitTokenToMemory,
  isTokenExpired,
} from '../../../sdk/utilities';

describe('token-utils', () => {
  const domain = 'local-testing@kinde.com';
  const { sessionManager } = mocks;

  describe('commitTokensToMemory', () => {
    it('stores all provided tokens to memory', () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(domain);
      const { token: mockIdToken } = mocks.getMockAccessToken(domain);
      const tokenCollection: TokenCollection = {
        refresh_token: 'refresh_token',
        access_token: mockAccessToken,
        id_token: mockIdToken,
      };
      commitTokensToMemory(sessionManager, tokenCollection);

      expect(sessionManager.getSessionItem('refresh_token')).toBe(
        tokenCollection.refresh_token
      );
      expect(sessionManager.getSessionItem('access_token')).toBe(
        mockAccessToken
      );
      expect(sessionManager.getSessionItem('id_token')).toBe(mockIdToken);
    });
  });

  describe('commitTokenToMemory()', () => {
    afterEach(() => {
      sessionManager.destroySession();
    });

    it('stores provided token to memory', () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(domain);
      commitTokenToMemory(sessionManager, mockAccessToken, 'access_token');
      expect(sessionManager.getSessionItem('access_token')).toBe(
        mockAccessToken
      );
    });

    it('stores user information if provide token is an id token', () => {
      const { token: mockIdToken, payload: idTokenPayload } =
        mocks.getMockIdToken(domain);
      commitTokenToMemory(sessionManager, mockIdToken, 'id_token');

      const storedUser = JSON.parse(
        sessionManager.getSessionItem('user') as string
      );
      const expectedUser = {
        family_name: idTokenPayload.family_name,
        given_name: idTokenPayload.given_name,
        email: idTokenPayload.email,
        id: idTokenPayload.sub,
        picture: null,
      };

      expect(sessionManager.getSessionItem('id_token')).toBe(mockIdToken);
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

    it('returns false if provided token is not expired', () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(domain);
      expect(isTokenExpired(mockAccessToken)).toBe(false);
    });
  });
});
