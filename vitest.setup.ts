import { webcrypto } from 'node:crypto';
import { vi } from 'vitest';
import { createJwtValidatorMock } from './lib/__tests__/mocks';

// Polyfill crypto for Node.js environment
if (typeof global.crypto === 'undefined') {
  global.crypto = webcrypto as Crypto;
}

// Mock @kinde/jwt-validator globally
vi.mock('@kinde/jwt-validator', () => createJwtValidatorMock());
