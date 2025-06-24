import type { CryptoKey, JSONWebKeySet } from 'jose';

// Cache for dynamically imported jose functions to avoid repeated imports
let joseModule: typeof import('jose') | null = null;

/**
 * Dynamically imports and caches the jose module to ensure compatibility
 * with both ESM and CommonJS environments.
 */
const getJoseModule = async (): Promise<typeof import('jose')> => {
  if (joseModule === null) {
    joseModule = await import('jose');
  }
  return joseModule;
};

/**
 * Creates a local JWK Set from the provided JSON Web Key Set.
 * Compatible with both ESM and CommonJS builds.
 */
export const createLocalJWKSet = async (jwks: JSONWebKeySet) => {
  const jose = await getJoseModule();
  return jose.createLocalJWKSet(jwks);
};

/**
 * Creates a remote JWK Set from the provided URL.
 * Compatible with both ESM and CommonJS builds.
 */
export const createRemoteJWKSet = async (
  url: URL,
  options?: { cacheMaxAge?: number }
) => {
  const jose = await getJoseModule();
  return jose.createRemoteJWKSet(url, options);
};

/**
 * Verifies a JWT token using the provided key.
 * Compatible with both ESM and CommonJS builds.
 */
export const jwtVerify = async (
  jwt: string,
  key: CryptoKey | Uint8Array,
  options?: { currentDate?: Date }
) => {
  const jose = await getJoseModule();
  return jose.jwtVerify(jwt, key, options);
};

// Re-export types
export type { CryptoKey, JSONWebKeySet };
