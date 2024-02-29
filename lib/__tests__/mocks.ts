import { type SessionManager } from '../sdk/session-managers';
import { vi } from 'vitest'

export const fetchClient = vi.fn().mockImplementation(
  async () =>
    await Promise.resolve({
      json: async () => {
        await Promise.resolve();
      },
    })
);

export const getMockAccessToken = ({
  domain = 'local-testing@kinde.com',
  isExpired = false,
  isExpClaimMissing = false,
  permissions = ['perm1', 'perm2', 'perm3'],
  noPermissions = false,
  noFeatureFlags = false
}: {
  domain?: string,
  isExpired?: boolean,
  isExpClaimMissing?: boolean,
  permissions?: string[] | undefined | null,
  noPermissions?: boolean
}) => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = isExpClaimMissing ? undefined : isExpired ? iat : iat + 1000000;
  const tokenPayload = {
    aud: [domain],
    azp: '',
    exp,
    gty: ['client_credentials'],
    iat,
    iss: domain,
    org_code: 'org_123456789',
    scp: ['openid', 'profile', 'email', 'offline'],
    permissions: noPermissions ? undefined : permissions,
    jti: '8a567995-ace9-4e82-8724-94651a5ca50c',
    sub: 'kp_0c3ff3d085flo6396as29d4ffee750be7',
    feature_flags: noFeatureFlags ? undefined : {
      is_dark_mode: { t: 'b', v: false },
      competitions_limit: { t: 'i', v: 5 },
      theme: { t: 's', v: 'pink' },
      noValue: { t: 's' },
    },
  };

  return {
    token: `.${btoa(JSON.stringify(tokenPayload))}.`,
    payload: tokenPayload,
  };
};

export const getMockIdToken = ({
  domain = 'local-testing@kinde.com',
  isExpired = false,
  noOrgCodes = false
}: {
  domain?: string,
  isExpired?: boolean,
  noOrgCodes?: boolean
}) => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = isExpired ? iat : iat + 1000000;
  const tokenPayload = {
    at_hash: 'oQ2Pa8kOCGrCoOQocpFzTA',
    aud: [domain, '35d47ccb0b5040ki3f57a2d0631af559'],
    auth_time: 1684766671,
    azp: '35d47ccb0blo40faaf57a2d0631af559',
    email: 'test-first.test-last@test.com',
    exp,
    family_name: 'test-last',
    given_name: 'test-first',
    iat,
    iss: domain,
    jti: '687ddac5-bac4-48cf-b5ba-2db3ca5107c1',
    name: 'test-first',
    org_codes: !noOrgCodes ? ['org_12345678'] : undefined,
    sub: 'kp_0c3ff3d085flo6396as29d4ffee750be7',
    updated_at: iat,
  };

  return {
    token: `.${btoa(JSON.stringify(tokenPayload))}.`,
    payload: tokenPayload,
  };
};

class ServerSessionManager implements SessionManager {
  private memCache: Record<string, unknown> = {};

  async destroySession(): Promise<void> {
    this.memCache = {};
  }

  async getSessionItem(itemKey: string) {
    return this.memCache[itemKey] ?? null;
  }

  async setSessionItem(itemKey: string, itemValue: unknown): Promise<void> {
    this.memCache[itemKey] = itemValue;
  }

  async removeSessionItem(itemKey: string): Promise<void> {
    delete this.memCache[itemKey];
  }
}

export const sessionManager = new ServerSessionManager();

global.fetch = fetchClient;
