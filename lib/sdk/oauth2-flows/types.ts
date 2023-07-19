export enum GrantType {
  AUTHORIZATION_CODE = 'AUTHORIZATION_CODE',
  CLIENT_CREDENTIALS = 'CLIENT_CREDENTIALS',
  PKCE = 'PKCE',
}

export interface OAuth2CodeExchangeErrorResponse {
  error?: string;
  error_description?: string;
}

export interface OAuth2CodeExchangeResponse {
  access_token: string;
  expires_in: string;
  token_type: string;
  refresh_token: string;
  id_token: string;
  scope: string;
}

export interface OAuth2CCTokenErrorResponse {
  error?: string;
  error_description?: string;
}

export interface OAuth2CCTokenResponse {
  access_token: string;
  expires_in: string;
}

export interface OAuth2FlowOptions {
  clientId: string;
  logoutRedirectURL: string;
  authDomain: string;
  audience?: string;
  scope?: string;
}

export interface AuthorizationCodeOptions extends OAuth2FlowOptions {
  redirectURL: string;
}

export interface ClientCredentialsOptions extends OAuth2FlowOptions {
  clientSecret: string;
}

export interface AuthURLOptions {
  start_page?: 'registration' | 'login';
  is_create_org?: boolean;
  org_name?: string;
  org_code?: string;
  state?: string;
}
