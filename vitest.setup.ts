import { webcrypto } from 'node:crypto';

// Polyfill crypto for Node.js environment
if (typeof global.crypto === 'undefined') {
  global.crypto = webcrypto as any;
}
