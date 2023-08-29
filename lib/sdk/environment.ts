enum JSEnvironment {
  BROWSER = 'BROWSER',
  NODEJS = 'NODEJS',
}

const currentEnvironment =
  typeof window === 'undefined' ? JSEnvironment.NODEJS : JSEnvironment.BROWSER;

/**
 * Method returns if current environment is node.js
 * @returns {boolean}
 */
export const isNodeEnvironment = (): boolean => {
  return currentEnvironment === JSEnvironment.NODEJS;
};

/**
 * Method returns if current environment is browser.
 * @returns {boolean}
 */
export const isBrowserEnvironment = (): boolean => {
  return currentEnvironment === JSEnvironment.BROWSER;
};

export const crypto =
  currentEnvironment === JSEnvironment.NODEJS
    ? globalThis.crypto ?? require("crypto")
    : globalThis.crypto;
