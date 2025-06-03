import * as mocks from '../../mocks';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import {
  type TokenCollection,
  commitTokensToSession,
  commitTokenToSession,
  isTokenExpired,
  type TokenValidationDetailsType,
  getUserFromSession,
} from '../../../sdk/utilities';

import { KindeSDKError, KindeSDKErrorCode } from '../../../sdk/exceptions';
import { importJWK } from 'jose';

describe('token-utils', () => {
  const domain = 'local-testing@kinde.com';
  const { sessionManager } = mocks;
  let validationDetails: TokenValidationDetailsType;

  beforeAll(async () => {
    const { publicKey } = await mocks.getKeys();

    validationDetails = {
      issuer: domain,
      keyProvider: async () => await importJWK(publicKey, mocks.mockJwtAlg),
    };
  });

  describe('commitTokensToMemory', () => {
    it('stores all provided tokens to memory', async () => {
      const { token: mockAccessToken } = await mocks.getMockAccessToken(domain);
      const { token: mockIdToken } = await mocks.getMockAccessToken(domain);
      const tokenCollection: TokenCollection = {
        refresh_token: 'refresh_token',
        access_token: mockAccessToken,
        id_token: mockIdToken,
      };
      await commitTokensToSession(
        sessionManager,
        tokenCollection,
        validationDetails
      );

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
      const { token: mockAccessToken } = await mocks.getMockAccessToken(domain);
      await commitTokenToSession(
        sessionManager,
        mockAccessToken,
        'access_token',
        validationDetails
      );
      expect(await sessionManager.getSessionItem('access_token')).toBe(
        mockAccessToken
      );
    });

    it('throws exception if attempting to store invalid token', async () => {
      const { token: mockAccessToken } = await mocks.getMockAccessToken(
        domain,
        true
      );
      const commitTokenFn = async () => {
        await commitTokenToSession(
          sessionManager,
          mockAccessToken,
          'access_token',
          validationDetails
        );
      };
      await expect(commitTokenFn).rejects.toBeInstanceOf(KindeSDKError);
      await expect(commitTokenFn).rejects.toHaveProperty(
        'errorCode',
        KindeSDKErrorCode.INVALID_TOKEN_MEMORY_COMMIT
      );
    });

    it('stores user information if provide token is an id token', async () => {
      const { token: mockIdToken, payload: idTokenPayload } =
        await mocks.getMockIdToken(domain);
      await commitTokenToSession(
        sessionManager,
        mockIdToken,
        'id_token',
        validationDetails
      );

      const storedUser = await getUserFromSession(sessionManager, validationDetails);
      const expectedUser = {
        family_name: idTokenPayload.family_name,
        given_name: idTokenPayload.given_name,
        email: idTokenPayload.email,
        id: idTokenPayload.sub,
        picture: null,
        phone: undefined,
      };

      expect(await sessionManager.getSessionItem('id_token')).toBe(mockIdToken);
      expect(storedUser).toStrictEqual(expectedUser);
    });
  });

  describe('isTokenExpired()', () => {
    it('returns true if null is provided as argument', async () => {
      expect(await isTokenExpired(null, validationDetails)).toBe(true);
    });

    it('returns true if provided token is expired', async () => {
      const { token: mockAccessToken } = await mocks.getMockAccessToken(
        domain,
        true
      );
      expect(await isTokenExpired(mockAccessToken, validationDetails)).toBe(true);
    });

    it('returns true if provided token is missing "exp" claim', async () => {
      const { token: mockAccessToken } = await mocks.getMockAccessToken(
        domain,
        true
      );
      expect(await isTokenExpired(mockAccessToken, validationDetails)).toBe(true);
    });

    it('returns false if provided token is not expired', async () => {
      const { token: mockAccessToken } = await mocks.getMockAccessToken(domain);
      expect(await isTokenExpired(mockAccessToken, validationDetails)).toBe(false);
    });
  });
});
