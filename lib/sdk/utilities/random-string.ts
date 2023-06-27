import { crypto, isBrowserEnvironment } from '../environment';

const randomStringInBrowser = (length: number = 50): string => {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (dec) =>
    ('0' + dec.toString(16)).substring(-2)
  ).join('');
};

const randomStringInNodejs = (length: number = 50): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateRandomString = isBrowserEnvironment()
  ? randomStringInBrowser
  : randomStringInNodejs;
