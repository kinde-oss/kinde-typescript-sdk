import { type default as createAuthCodeClient } from './server/authorization-code.js';
import { type default as createCCClient } from './server/client-credentials.js';

import type {
  ClientCredentialsOptions,
  AuthorizationCodeOptions,
  AuthURLOptions,
} from '../oauth2-flows/index.js';
import { type SessionManager} from "../session-managers";

export interface BrowserPKCEClientOptions extends AuthorizationCodeOptions {
  sessionManager?: SessionManager
}

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
