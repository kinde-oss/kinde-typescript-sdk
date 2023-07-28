import { type default as createAuthCodeClient } from './server/authorization-code';
import { type default as createCCClient } from './server/client-credentials';

import type {
  ClientCredentialsOptions,
  AuthorizationCodeOptions,
  AuthURLOptions,
} from '../oauth2-flows';

export interface PKCEClientOptions extends AuthorizationCodeOptions {}
export interface CCClientOptions extends ClientCredentialsOptions {}
export interface ACClientOptions extends AuthorizationCodeOptions {
  clientSecret?: string;
}

export type ACClient = ReturnType<typeof createAuthCodeClient>;
export type CCClient = ReturnType<typeof createCCClient>;

export type RegisterURLOptions = Omit<
  AuthURLOptions,
  'start_page' | 'is_create_org'
>;

export type CreateOrgURLOptions = RegisterURLOptions;
export type LoginURLOptions = RegisterURLOptions;
