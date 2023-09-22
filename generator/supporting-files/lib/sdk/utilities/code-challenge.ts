import { generateRandomString } from './random-string.js';
import { subtle } from 'uncrypto';

/**
 * Encodes the provided ArrayBuffer string to base-64 format.
 * @param {ArrayBuffer} str
 * @returns {string}
 */
export const base64UrlEncode = (str: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Creates a one-way hash for the provided string using SHA-256
 * algorithm, the result is provided as an ArrayBuffer instance.
 * @param {string} plain
 * @returns {Promise<ArrayBuffer>}
 */
export const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await subtle.digest('SHA-256', data);
};

/**
 * Sets up the code challenge required for PKCE OAuth2.0 flow
 * returning the verifier (secret) and its corresponding one-way
 * hash (challenge).
 * @returns {Promise<{ challenge: string, verifier: string }>}
 */
export const setupCodeChallenge = async (): Promise<{
  challenge: string;
  verifier: string;
}> => {
  const secret = generateRandomString(50);
  const challenge = base64UrlEncode(await sha256(secret));
  return { challenge, verifier: secret };
};
