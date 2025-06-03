import { type JWK, SignJWT, exportJWK, generateKeyPair, importJWK } from 'jose';
import { type SessionManager } from '../sdk/session-managers';
import { vi } from 'vitest';

let mockPrivateKey: JWK | undefined;
let mockPublicKey: JWK | undefined;

export const mockJwtAlg = 'RS256';

export const getKeys = async (): Promise<{ privateKey: JWK; publicKey: JWK }> => {
  if (mockPrivateKey !== undefined && mockPublicKey !== undefined) {
    return { privateKey: mockPrivateKey, publicKey: mockPublicKey };
  }
  const { publicKey: generatedPublicKey, privateKey: generatedPrivateKey } =
    await generateKeyPair(mockJwtAlg, { extractable: true });

  const generatedPrivateJwk = await exportJWK(generatedPrivateKey);
  const generatedPublicJwk = await exportJWK(generatedPublicKey);

  mockPrivateKey = generatedPrivateJwk;
  mockPublicKey = generatedPublicJwk;

  return { privateKey: mockPrivateKey, publicKey: mockPublicKey };
};

export const fetchClient = vi.fn().mockImplementation(
  async () =>
    await Promise.resolve({
      json: async () => {
        await Promise.resolve();
      },
    })
);

export const getMockAccessToken = async (
  domain: string = 'local-testing@kinde.com',
  isExpired: boolean = false,
  isExpClaimMissing: boolean = false
) => {
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
    permissions: ['perm1', 'perm2', 'perm3'],
    jti: '8a567995-ace9-4e82-8724-94651a5ca50c',
    sub: 'kp_0c3ff3d085flo6396as29d4ffee750be7',
    feature_flags: {
      is_dark_mode: { t: 'b', v: false },
      competitions_limit: { t: 'i', v: 5 },
      theme: { t: 's', v: 'pink' },
    },
  };

  const { privateKey } = await getKeys();
  const key = await importJWK(privateKey, mockJwtAlg);
  const jwt = await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: mockJwtAlg })
    .sign(key);

  return {
    token: jwt,
    payload: tokenPayload,
  };
};

export const getMockIdToken = async (
  domain: string = 'local-testing@kinde.com',
  isExpired: boolean = false
) => {
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
    org_codes: ['org_12345678'],
    sub: 'kp_0c3ff3d085flo6396as29d4ffee750be7',
    updated_at: iat,
  };

  const { privateKey } = await getKeys();
  const key = await importJWK(privateKey, mockJwtAlg);
  const jwt = await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: mockJwtAlg })
    .sign(key);

  return {
    token: jwt,
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
