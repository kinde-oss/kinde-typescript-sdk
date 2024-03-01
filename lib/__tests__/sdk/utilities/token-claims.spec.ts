import * as mocks from '../../mocks';
import { describe, beforeEach, afterEach, expect, test } from 'vitest';

import {
  getUserOrganizations,
  getOrganization,
  getClaimValue,
  getPermission,
  getClaim,
  getPermissions
} from '../../../sdk/utilities';

describe('token-claims', () => {
  let mockAccessToken: ReturnType<typeof mocks.getMockAccessToken>;
  let mockIdToken: ReturnType<typeof mocks.getMockIdToken>;
  const { sessionManager } = mocks;

  beforeEach(async () => {
    mockAccessToken = mocks.getMockAccessToken({});
    mockIdToken = mocks.getMockIdToken({});
    await sessionManager.setSessionItem('access_token', mockAccessToken.token);
    await sessionManager.setSessionItem('id_token', mockIdToken.token);
  });

  afterEach(async () => {
    await sessionManager.destroySession();
  });

  describe('getClaimValue', () => {
    test('returns value for a token claim if claim exists', () => {
      Object.keys(mockAccessToken.payload).forEach(async (name: string) => {
        const claimValue = await getClaimValue(sessionManager, name);
        const tokenPayload = mockAccessToken.payload as Record<string, unknown>;
        expect(claimValue).toStrictEqual(tokenPayload[name]);
      });
    });

    test('return null if claim does not exist', async () => {
      const claimName = 'non-existant-claim';
      const claimValue = await getClaimValue(sessionManager, claimName);
      expect(claimValue).toBe(null);
    });
  });

  describe('getClaim', () => {
    test('returns value for a token claim if claim exists', () => {
      Object.keys(mockAccessToken.payload).forEach(async (name: string) => {
        const claim = await getClaim(sessionManager, name);
        const tokenPayload = mockAccessToken.payload as Record<string, unknown>;
        expect(claim).toStrictEqual({ name, value: tokenPayload[name] });
      });
    });

    test('return null if claim does not exist', async () => {
      const claimName = 'non-existant-claim';
      const claim = await getClaim(sessionManager, claimName);
      expect(claim).toStrictEqual({ name: claimName, value: null });
    });
  });

  describe('getPermission', () => {
    test('return orgCode and isGranted = true if permission is given', () => {
      const { permissions } = mockAccessToken.payload;
      permissions?.forEach(async (permission) => {
        expect(await getPermission(sessionManager, permission)).toStrictEqual({
          orgCode: mockAccessToken.payload.org_code,
          isGranted: true,
        });
      });
    });

    test('return isGranted = false is permission is not given', async () => {
      const orgCode = mockAccessToken.payload.org_code;
      const permissionName = 'non-existant-permission';
      expect(await getPermission(sessionManager, permissionName)).toStrictEqual({
        orgCode,
        isGranted: false,
      });
    });

    test('When no permissions in token', async () => {
      const orgCode = mockAccessToken.payload.org_code;

      mockAccessToken = mocks.getMockAccessToken({
        noPermissions: true
      });
      mockIdToken = mocks.getMockIdToken({});

      await sessionManager.setSessionItem('access_token', mockAccessToken.token);
      const permissionName = 'non-existant-permission';
      
      expect(await getPermission(sessionManager, permissionName)).toStrictEqual({
        orgCode,
        isGranted: false,
      });
    });

    
  });

  describe('getUserOrganizations', () => {
    test('lists all user organizations using id token', async () => {
      const orgCodes = mockIdToken.payload.org_codes;
      expect(await getUserOrganizations(sessionManager)).toStrictEqual({
        orgCodes,
      });
    });

    test('lists all user organizations using id token', async () => {
      mockIdToken = mocks.getMockIdToken({
        noOrgCodes: true
      });
      await sessionManager.setSessionItem('id_token', mockIdToken.token);

      expect(await getUserOrganizations(sessionManager)).toStrictEqual({
        orgCodes: [],
      });
    });
  });

  describe('getOrganization', () => {
    test('returns organization code using accesss token', async () => {
      const orgCode = mockAccessToken.payload.org_code;
      expect(await getOrganization(sessionManager)).toStrictEqual({ orgCode });
    });
  });

  describe('getPermissions', () => {
    test('returns permissions and organization code using access token', async () => {
      const { permissions, org_code } = mockAccessToken.payload;
      
      expect(await getPermissions(sessionManager)).toStrictEqual({
        permissions,
        orgCode: org_code,
      });
    });
  });
});
