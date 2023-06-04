import { memoryStore } from '../../../sdk/stores';
import * as mocks from '../../mocks';

import {
  type TokenCollection,
  commitTokensToMemory,
  commitTokenToMemory,
  isTokenExpired,
} from '../../../sdk/utilities';

describe('token-utils', () => {
  const domain = 'local-testing@kinde.com';

  describe('commitTokensToMemory', () => {
    it('stores all provided tokens to memory', () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(domain);
      const { token: mockIdToken } = mocks.getMockAccessToken(domain);
      const tokenCollection: TokenCollection = {
        refresh_token: 'refresh_token',
        access_token: mockAccessToken,
        id_token: mockIdToken,
      };
      commitTokensToMemory(tokenCollection);

      expect(memoryStore.getItem('refresh_token')).toBe(
        tokenCollection.refresh_token
      );
      expect(memoryStore.getItem('access_token')).toBe(mockAccessToken);
      expect(memoryStore.getItem('id_token')).toBe(mockIdToken);
    });
  });

  describe('commitTokenToMemory()', () => {
    afterEach(() => {
      memoryStore.clear();
    });

    it('stores provided token to memory', () => {
      const { token: mockAccessToken } = mocks.getMockAccessToken(domain);
      commitTokenToMemory(mockAccessToken, 'access_token');
      expect(memoryStore.getItem('access_token')).toBe(mockAccessToken);
    });

    it('stores user information if provide token is an id token', () => {
      const { token: mockIdToken, payload: idTokenPayload } =
        mocks.getMockIdToken(domain);
      commitTokenToMemory(mockIdToken, 'id_token');

      const storedUser = JSON.parse(memoryStore.getItem('user') as string);
      const expectedUser = {
        family_name: idTokenPayload.family_name,
        given_name: idTokenPayload.given_name,
        email: idTokenPayload.email,
        id: idTokenPayload.sub,
        picture: null,
      };

      expect(memoryStore.getItem('id_token')).toBe(mockIdToken);
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
