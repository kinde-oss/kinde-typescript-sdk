import * as mocks from '../../mocks';

import {
  getUserOrganizations,
  getOrganization,
  getClaimValue,
  getPermission,
  getClaim,
  type TokenValidationDetailsType,
} from '../../../sdk/utilities';
import { importJWK } from 'jose';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('token-claims', () => {
  let mockAccessToken: Awaited<ReturnType<typeof mocks.getMockAccessToken>>;
  let mockIdToken: Awaited<ReturnType<typeof mocks.getMockIdToken>>;
  const authDomain = 'https://local-testing@kinde.com';
  const { sessionManager } = mocks;

  let validationDetails: TokenValidationDetailsType;

  beforeAll(async () => {
    const { publicKey } = await mocks.getKeys();

    validationDetails = {
      issuer: authDomain,
      keyProvider: async () => await importJWK(publicKey, mocks.mockJwtAlg),
    };

    mockAccessToken = await mocks.getMockAccessToken();
    mockIdToken = await mocks.getMockIdToken();
    await sessionManager.setSessionItem('access_token', mockAccessToken.token);
    await sessionManager.setSessionItem('id_token', mockIdToken.token);
  });

  afterAll(async () => {
    await sessionManager.destroySession();
  });

  describe('getClaimValue', () => {
    it('returns value for a token claim if claim exists', () => {
      Object.keys(mockAccessToken.payload).forEach(async (name: string) => {
        const claimValue = await getClaimValue(
          sessionManager,
          name,
          'access_token',
          validationDetails
        );
        const tokenPayload = mockAccessToken.payload as Record<string, unknown>;
        expect(claimValue).toStrictEqual(tokenPayload[name]);
      });
    });

    it('return null if claim does not exist', async () => {
      const claimName = 'non-existant-claim';
      const claimValue = await getClaimValue(
        sessionManager,
        claimName,
        'access_token',
        validationDetails
      );
      expect(claimValue).toBe(null);
    });
  });

  describe('getClaim', () => {
    it('returns value for a token claim if claim exists', () => {
      Object.keys(mockAccessToken.payload).forEach(async (name: string) => {
        const claim = await getClaim(
          sessionManager,
          name,
          'access_token',
          validationDetails
        );
        const tokenPayload = mockAccessToken.payload as Record<string, unknown>;
        expect(claim).toStrictEqual({ name, value: tokenPayload[name] });
      });
    });

    it('return null if claim does not exist', async () => {
      const claimName = 'non-existant-claim';
      const claim = await getClaim(
        sessionManager,
        claimName,
        'access_token',
        validationDetails
      );
      expect(claim).toStrictEqual({ name: claimName, value: null });
    });
  });

  describe('getPermission', () => {
    it('return orgCode and isGranted = true if permission is given', () => {
      const { permissions } = mockAccessToken.payload;
      permissions.forEach(async (permission) => {
        expect(
          await getPermission(sessionManager, permission, validationDetails)
        ).toStrictEqual({
          orgCode: mockAccessToken.payload.org_code,
          isGranted: true,
        });
      });
    });

    it('return isGranted = false is permission is not given', async () => {
      const orgCode = mockAccessToken.payload.org_code;
      const permissionName = 'non-existant-permission';
      expect(
        await getPermission(sessionManager, permissionName, validationDetails)
      ).toStrictEqual({
        orgCode,
        isGranted: false,
      });
    });
  });
  describe('getUserOrganizations', () => {
    it('lists all user organizations using id token', async () => {
      const orgCodes = mockIdToken.payload.org_codes;
      expect(
        await getUserOrganizations(sessionManager, validationDetails)
      ).toStrictEqual({
        orgCodes,
      });
    });
  });

  describe('getOrganization', () => {
    it('returns organization code using accesss token', async () => {
      const orgCode = mockAccessToken.payload.org_code;
      expect(await getOrganization(sessionManager, validationDetails)).toStrictEqual(
        { orgCode }
      );
    });
  });
});
