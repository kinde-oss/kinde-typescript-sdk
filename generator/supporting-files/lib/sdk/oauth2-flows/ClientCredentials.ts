import { type SessionManager } from '../session-managers/index.js';
import * as utilities from '../utilities/index.js';
import { getSDKHeader } from '../version.js';

import type {
  OAuth2CCTokenErrorResponse,
  ClientCredentialsOptions,
  OAuth2CCTokenResponse,
} from './types.js';

/**
 * Class provides implementation for the client credentials OAuth2.0 flow.
 * @class ClientCredentials
 */
export class ClientCredentials {
  public static DEFAULT_TOKEN_SCOPES: string = 'openid profile email offline';
  public readonly logoutEndpoint: string;
  public readonly tokenEndpoint: string;

  constructor(private readonly config: ClientCredentialsOptions) {
    const { authDomain, logoutRedirectURL } = config;
    this.logoutEndpoint = `${authDomain}/logout?redirect=${logoutRedirectURL}`;
    this.tokenEndpoint = `${authDomain}/oauth2/token`;
    this.config = config;
  }

  /**
   * Method retrieves the access token, if the token present in the current session
   * is unexpired it will be returned otherwise, a new one will be be obtained by
   * performing a network call.
   * @param {SessionManager} sessionManager
   * @returns {Promise<string>}
   */
  async getToken(sessionManager: SessionManager): Promise<string> {
    const accessToken = await utilities.getAccessToken(sessionManager);
    const isTokenExpired = utilities.isTokenExpired(accessToken);
    if (accessToken && !isTokenExpired) {
      return accessToken;
    }

    const payload = await this.fetchAccessTokenFor(sessionManager);
    await utilities.commitTokenToMemory(
      sessionManager,
      payload.access_token,
      'access_token'
    );
    return payload.access_token;
  }

  /**
   * Method implements logic for requesting access token using token endpoint.
   * @param {SessionManager} sessionManager
   * @returns {Promise<OAuth2CCTokenResponse>}
   */
  private async fetchAccessTokenFor(
    sessionManager: SessionManager
  ): Promise<OAuth2CCTokenResponse> {
    const body = this.generateTokenURLParams();
    const headers = new Headers();
    headers.append(
      'Content-Type',
      'application/x-www-form-urlencoded; charset=UTF-8'
    );
    headers.append(
      ...getSDKHeader({
        frameworkVersion: this.config.frameworkVersion,
        framework: this.config.framework,
      })
    );

    const config: RequestInit = { method: 'POST', headers, body };
    const response = await fetch(this.tokenEndpoint, config);
    const payload = (await response.json()) as
      | OAuth2CCTokenErrorResponse
      | OAuth2CCTokenResponse;

    const errorPayload = payload as OAuth2CCTokenErrorResponse;
    if (errorPayload.error) {
      await sessionManager.destroySession();
      const errorDescription = errorPayload.error_description;
      const message = errorDescription ?? errorPayload.error;
      throw new Error(message);
    }

    return payload as OAuth2CCTokenResponse;
  }

  /**
   * Method provides the query params required for generating the token URL for
   * obtaining the required access token.
   * @returns {URLSearchParams}
   */
  private generateTokenURLParams(): URLSearchParams {
    const searchParams = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: this.config.scope ?? ClientCredentials.DEFAULT_TOKEN_SCOPES,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    if (this.config.audience) {
      searchParams.append('audience', this.config.audience);
    }

    return new URLSearchParams(searchParams);
  }
}
