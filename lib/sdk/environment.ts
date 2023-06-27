enum JSEnvironment {
  BROWSER = 'BROWSER',
  NODEJS = 'NODEJS',
}

const currentEnvironment =
  typeof window === 'undefined' ? JSEnvironment.NODEJS : JSEnvironment.BROWSER;

export const isNodeEnvironment = (): boolean => {
  return currentEnvironment === JSEnvironment.NODEJS;
};

export const isBrowserEnvironment = (): boolean => {
  return currentEnvironment === JSEnvironment.BROWSER;
};

export const crypto =
  currentEnvironment === JSEnvironment.NODEJS
    ? require('crypto')
    : globalThis.crypto;
