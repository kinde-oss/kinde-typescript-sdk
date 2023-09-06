import {getRandomValues} from 'uncrypto';

/**
 * Creates a random string of provided length.
 * @param {number} length
 * @returns {string} required secret
 */
export const generateRandomString = (length: number = 28): string => {
  const array = new Uint32Array(length);
  getRandomValues(array);
  return Array.from(array, (dec) =>
    ('0' + dec.toString(16)).slice(-2)
  ).join('');
};
