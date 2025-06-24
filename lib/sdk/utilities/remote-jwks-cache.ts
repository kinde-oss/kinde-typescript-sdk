import { createRemoteJWKSet } from './jose-compat.js';

const remoteJwksCache: Record<
  string,
  Awaited<ReturnType<typeof createRemoteJWKSet>>
> = {};

export const getRemoteJwks = async (domain: string) => {
  if (remoteJwksCache[domain] !== undefined) {
    return remoteJwksCache[domain];
  }

  const func = await createRemoteJWKSet(new URL(`${domain}/.well-known/jwks.json`), {
    cacheMaxAge: 1000 * 60 * 60 * 24,
  });

  remoteJwksCache[domain] = func;

  return func;
};
