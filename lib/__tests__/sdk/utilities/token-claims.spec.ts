import * as mocks from '../../mocks';

import {
  getUserOrganizations,
  getOrganization,
  getClaimValue,
  getPermission,
  getClaim,
} from '../../../sdk/utilities';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('token-claims', () => {
  let mockAccessToken: Awaited<ReturnType<typeof mocks.getMockAccessToken>>;
  let mockIdToken: Awaited<ReturnType<typeof mocks.getMockIdToken>>;
  const { sessionManager } = mocks;

  beforeAll(async () => {
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
        const claimValue = await getClaimValue(sessionManager, name, 'access_token');
        const tokenPayload = mockAccessToken.payload as Record<string, unknown>;
        expect(claimValue).toStrictEqual(tokenPayload[name]);
      });
    });

    it('return null if claim does not exist', async () => {
      const claimName = 'non-existant-claim';
      const claimValue = await getClaimValue(
        sessionManager,
        claimName,
        'access_token'
      );
      expect(claimValue).toBe(null);
    });
  });

  describe('getClaim', () => {
    it('returns value for a token claim if claim exists', () => {
      Object.keys(mockAccessToken.payload).forEach(async (name: string) => {
        const claim = await getClaim(sessionManager, name, 'access_token');
        const tokenPayload = mockAccessToken.payload as Record<string, unknown>;
        expect(claim).toStrictEqual({ name, value: tokenPayload[name] });
      });
    });

    it('return null if claim does not exist', async () => {
      const claimName = 'non-existant-claim';
      const claim = await getClaim(sessionManager, claimName, 'access_token');
      expect(claim).toStrictEqual({ name: claimName, value: null });
    });
  });

  describe('getPermission', () => {
    it('return orgCode and isGranted = true if permission is given', () => {
      const { permissions } = mockAccessToken.payload;
      permissions.forEach(async (permission) => {
        expect(await getPermission(sessionManager, permission)).toStrictEqual({
          orgCode: mockAccessToken.payload.org_code,
          isGranted: true,
        });
      });
    });

    it('return isGranted = false is permission is not given', async () => {
      const orgCode = mockAccessToken.payload.org_code;
      const permissionName = 'non-existant-permission';
      expect(await getPermission(sessionManager, permissionName)).toStrictEqual({
        orgCode,
        isGranted: false,
      });
    });
  });
  describe('getUserOrganizations', () => {
    it('lists all user organizations using id token', async () => {
      const orgCodes = mockIdToken.payload.org_codes;
      expect(await getUserOrganizations(sessionManager)).toStrictEqual({
        orgCodes,
      });
    });
  });

  describe('getOrganization', () => {
    it('returns organization code using accesss token', async () => {
      const orgCode = mockAccessToken.payload.org_code;
      expect(await getOrganization(sessionManager)).toStrictEqual({ orgCode });
    });
  });
});
