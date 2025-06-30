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
  public readonly logoutEndpoint: string;
  public readonly tokenEndpoint: string;
  public readonly tokenValidationDetails: utilities.TokenValidationDetailsType;

  constructor(private readonly config: ClientCredentialsOptions) {
    const { authDomain, logoutRedirectURL } = config;
    this.logoutEndpoint = `${authDomain}/logout?redirect=${logoutRedirectURL ?? ''}`;
    this.tokenEndpoint = `${authDomain}/oauth2/token`;
    this.config = config;
    this.tokenValidationDetails = {
      issuer: config.authDomain,
      audience: config.audience,
    };
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
    await utilities.commitTokenToSession(
      sessionManager,
      payload.access_token,
      'access_token',
      this.tokenValidationDetails
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
   * Method returns a boolean indicating if the access token in session is expired
   * or not, in the event the token is expired it makes use of the `getToken` method
   * above to first refresh it, in the event refresh fails false is returned.
   * @param sessionManager
   * @returns {Promise<boolean>}
   */
  public async isAuthenticated(sessionManager: SessionManager): Promise<boolean> {
    try {
      await this.getToken(sessionManager);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Method provides the query params required for generating the token URL for
   * obtaining the required access token.
   * @returns {URLSearchParams}
   */
  private generateTokenURLParams(): URLSearchParams {
    if (!utilities.validateClientSecret(this.config.clientSecret)) {
      throw new Error(`Invalid client secret ${this.config.clientSecret}`);
    }

    const searchParams = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    if (this.config.scope !== undefined) {
      searchParams.append('scope', this.config.scope);
    }

    if (this.config.audience) {
      const audienceArray = Array.isArray(this.config.audience)
        ? this.config.audience
        : [this.config.audience];

      audienceArray.forEach((aud) => {
        searchParams.append('audience', aud);
      });
    }

    return new URLSearchParams(searchParams);
  }
}
