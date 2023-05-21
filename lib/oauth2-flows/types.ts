export enum GrantType {
  CLIENT_CREDENTIALS = "CLIENT_CREDENTIALS",
  PKCE = "PKCE",
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

export interface PKCEClientOptions {
  redirectURL: string;
  clientId: string;
  authDomain: string;
}

export interface AuthURLOptions {
  start_page?: string;
  audience?: string;
  is_create_org?: boolean;
  org_name?: string;
  appState?: string;
  scope?: string;
}
