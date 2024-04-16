import { createRemoteJWKSet } from 'jose';

const remoteJwksCache: Record<string, ReturnType<typeof createRemoteJWKSet>> = {};

export const getRemoteJwks = async (domain: string) => {
  if (remoteJwksCache[domain] !== undefined) {
    return remoteJwksCache[domain];
  }

  const func = createRemoteJWKSet(new URL(`${domain}/.well-known/jwks.json`), {
    cacheMaxAge: 1000 * 60 * 60 * 24,
  });

  remoteJwksCache[domain] = func;

  return func;
};
