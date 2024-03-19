import { getRandomValues } from 'uncrypto';

/**
 * Creates a random string of provided length.
 * @param {number} length
 * @returns {string} required secret
 */
export const generateRandomString = (length: number = 28): string => {
  const bytesNeeded = Math.ceil(length / 2);
  const array = new Uint32Array(bytesNeeded);
  getRandomValues(array);
  let result = Array.from(array, (dec) => ('0' + dec.toString(16)).slice(-2)).join(
    ''
  );
  if (length % 2 !== 0) {
    // If the requested length is odd, remove the last character to adjust the length
    result = result.slice(0, -1);
  }
  return result;
};
