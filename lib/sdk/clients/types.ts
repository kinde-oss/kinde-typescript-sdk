import { type default as createAuthCodeClient } from './authorization-code';
import { type default as createCCClient } from './client-credentials';

export type AuthCodeClient = ReturnType<typeof createAuthCodeClient>;
export type CCClient = ReturnType<typeof createCCClient>;
