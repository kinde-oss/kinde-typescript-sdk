/**
 * Validates that the supplied client secret is in the correct format.
 * @param {string} secret
 * @returns {boolean}
 */
export const validateClientSecret = (secret: string): boolean => {
  return !!secret.match('^[a-zA-Z0-9]{40,60}$')?.length;
};
