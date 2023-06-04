import type { CCClientOptions, OAuth2CCTokenResponse } from './types';
import { getSDKHeader } from '../sdk-version';
import * as utilities from '../utilities';

export class ClientCredentials {
  public static DEFAULT_TOKEN_SCOPES: string = 'openid profile email offline';
  public readonly logoutEndpoint: string;
  public readonly tokenEndpoint: string;

  constructor(private readonly config: CCClientOptions) {
    const { authDomain, logoutRedirectURL } = config;
    this.logoutEndpoint = `${authDomain}/logout?redirect=${logoutRedirectURL}`;
    this.tokenEndpoint = `${authDomain}/oauth2/token`;
    this.config = config;
  }

  async getToken(): Promise<string> {
    const accessToken = utilities.getAccessToken();
    const isTokenExpired = utilities.isTokenExpired(accessToken);
    if (accessToken !== null && !isTokenExpired) {
      return accessToken;
    }

    const payload = await this.fetchAccessTokenFor();
    utilities.commitTokenToMemory(payload.access_token, 'access_token');
    return payload.access_token;
  }

  private async fetchAccessTokenFor(): Promise<OAuth2CCTokenResponse> {
    const body = this.generateTokenURLParams();
    const headers = new Headers();
    headers.append(...getSDKHeader());
    headers.append(
      'Content-Type',
      'application/x-www-form-urlencoded; charset=UTF-8'
    );
    const config: RequestInit = { method: 'POST', headers, body };
    const response = await fetch(this.tokenEndpoint, config);
    return (await response.json()) as OAuth2CCTokenResponse;
  }

  private generateTokenURLParams(): URLSearchParams {
    const searchParams = {
      grant_type: 'client_credentials',
      scope: ClientCredentials.DEFAULT_TOKEN_SCOPES,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    };

    return new URLSearchParams(searchParams);
  }
}
