import { memoryStore } from '../../../sdk/stores';
import * as mocks from '../../mocks';

import {
  getUserOrganizations,
  getOrganization,
  getClaimValue,
  getPermission,
  getClaim,
} from '../../../sdk/utilities';

describe('token-claims', () => {
  let mockAccessToken: ReturnType<typeof mocks.getMockAccessToken>;
  let mockIdToken: ReturnType<typeof mocks.getMockIdToken>;
  const authDomain = 'https://local-testing@kinde.com';

  beforeEach(() => {
    mockAccessToken = mocks.getMockAccessToken();
    mockIdToken = mocks.getMockIdToken();
    memoryStore.setItem('access_token_payload', mockAccessToken.payload);
    memoryStore.setItem('id_token_payload', mockIdToken.payload);
    memoryStore.setItem('access_token', mockAccessToken.token);
    memoryStore.setItem('id_token', mockIdToken.token);
  });

  afterEach(() => {
    memoryStore.clear();
  });

  describe('getClaimValue', () => {
    it('returns value for a token claim if claim exists', () => {
      Object.keys(mockAccessToken.payload).forEach((name: string) => {
        const claimValue = getClaimValue(name);
        const tokenPayload = mockAccessToken.payload as Record<string, unknown>;
        expect(claimValue).toBe(tokenPayload[name]);
      });
    });

    it('return null if claim does not exist', () => {
      const claimName = 'non-existant-claim';
      const claimValue = getClaimValue(claimName);
      expect(claimValue).toBe(null);
    });

    it('throws error if access token is expired or not present', () => {
      const mockExpiredAccessToken = mocks.getMockAccessToken(authDomain, true);
      memoryStore.setItem('access_token', mockExpiredAccessToken.token);
      expect(() => getClaimValue('claim')).toThrowError(
        'No authentication credential found, when requesting claim claim'
      );
    });

    it('throws error if id token is expired or not present', () => {
      const mockExpiredIdToken = mocks.getMockIdToken(authDomain, true);
      memoryStore.setItem('id_token', mockExpiredIdToken.token);
      expect(() => getClaimValue('claim', 'id_token')).toThrowError(
        'No authentication credential found, when requesting claim claim'
      );
    });
  });

  describe('getClaim', () => {
    it('returns value for a token claim if claim exists', () => {
      Object.keys(mockAccessToken.payload).forEach((name: string) => {
        const claim = getClaim(name);
        const tokenPayload = mockAccessToken.payload as Record<string, unknown>;
        expect(claim).toStrictEqual({ name, value: tokenPayload[name] });
      });
    });

    it('return null if claim does not exist', () => {
      const claimName = 'non-existant-claim';
      const claim = getClaim(claimName);
      expect(claim).toStrictEqual({ name: claimName, value: null });
    });
  });

  describe('getPermission', () => {
    it('return orgCode and isGranted = true if permission is given', () => {
      const { permissions } = mockAccessToken.payload;
      permissions.forEach((permission) => {
        expect(getPermission(permission)).toStrictEqual({
          orgCode: mockAccessToken.payload.org_code,
          isGranted: true,
        });
      });
    });

    it('return isGranted = false is permission is not given', () => {
      const orgCode = mockAccessToken.payload.org_code;
      const permissionName = 'non-existant-permission';
      expect(getPermission(permissionName)).toStrictEqual({
        orgCode,
        isGranted: false,
      });
    });
  });
  describe('getUserOrganizations', () => {
    it('lists all user organizations using id token', () => {
      const orgCodes = mockIdToken.payload.org_codes;
      expect(getUserOrganizations()).toStrictEqual({ orgCodes });
    });
  });

  describe('getOrganization', () => {
    it('returns organization code using accesss token', () => {
      const orgCode = mockAccessToken.payload.org_code;
      expect(getOrganization()).toStrictEqual({ orgCode });
    });
  });
});
