import { crypto, isBrowserEnvironment } from '../environment';

/**
 * Creates a random string of provided length for the browser.
 * @param {number} length
 * @returns {string} required secret
 */
const randomStringInBrowser = (length: number = 50): string => {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (dec) =>
    ('0' + dec.toString(16)).substring(-2)
  ).join('');
};

/**
 * Creates a random string of provided length for the server.
 * @param {number} length
 * @returns {string} required secret
 */
const randomStringInNodejs = (length: number = 50): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateRandomString = isBrowserEnvironment()
  ? randomStringInBrowser
  : randomStringInNodejs;
