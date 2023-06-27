import { generateRandomString } from './random-string';
import { crypto } from '../environment';

export const base64UrlEncode = (str: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
};

export const setupCodeChallenge = async (): Promise<{
  challenge: string;
  verifier: string;
}> => {
  const secret = generateRandomString(50);
  const challenge = base64UrlEncode(await sha256(secret));
  return { challenge, verifier: secret };
};
