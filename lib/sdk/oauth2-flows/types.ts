export enum GrantType {
  AUTHORIZATION_CODE = 'AUTHORIZATION_CODE',
  CLIENT_CREDENTIALS = 'CLIENT_CREDENTIALS',
  PKCE = 'PKCE',
}

export interface OAuth2CodeExchangeResponse {
  access_token: string;
  expires_in: string;
  token_type: string;
  refresh_token: string;
  id_token: string;
  scope: string;
}

export interface OAuth2CCTokenResponse {
  access_token: string;
  expires_in: string;
}

export interface CommonClientOptions {
  clientId: string;
  logoutRedirectURL: string;
  authDomain: string;
}

export interface CCClientOptions extends CommonClientOptions {
  clientSecret: string;
}

export interface AuthCodeClientOptions extends CommonClientOptions {
  clientSecret?: string;
  redirectURL: string;
}

export interface PKCEClientOptions
  extends Omit<AuthCodeClientOptions, 'clientSecret'> {}

export interface AuthURLOptions {
  start_page?: string;
  audience?: string;
  is_create_org?: boolean;
  org_name?: string;
  state?: string;
  scope?: string;
}
