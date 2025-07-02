import { KindeSDKError, KindeSDKErrorCode } from '../exceptions.js';
import { type SessionManager } from '../session-managers/index.js';
import { isNodeEnvironment } from '../environment.js';
import type { UserType } from '../utilities/index.js';
import * as utilities from '../utilities/index.js';
import { getSDKHeader } from '../version.js';

import type {
  OAuth2CodeExchangeErrorResponse,
  OAuth2CodeExchangeResponse,
  AuthorizationCodeOptions,
  AuthURLOptions,
} from './types.js';
import type { GeneratePortalUrlParams } from '@kinde/js-utils';

/**
 * Abstract class provides contract (methods) for classes implementing OAuth2.0 flows
 * for authorization_code grant type, this includes the basic Authorization Code flow
 * and the PKCE extention code flow.
 * @class AuthCodeAbstract
 * @param {AuthorizationCodeOptions} config
 */
export abstract class AuthCodeAbstract {
  public static DEFAULT_TOKEN_SCOPES: string = 'openid profile email offline';
  public readonly authorizationEndpoint: string;
  public readonly userProfileEndpoint: string;
  public readonly logoutEndpoint: string;
  public readonly tokenEndpoint: string;
  protected state?: string;
  public readonly tokenValidationDetails: utilities.TokenValidationDetailsType;

  constructor(protected readonly config: AuthorizationCodeOptions) {
    const { authDomain, logoutRedirectURL } = config;
    this.logoutEndpoint = `${authDomain}/logout?redirect=${logoutRedirectURL ?? ''}`;
    this.userProfileEndpoint = `${authDomain}/oauth2/v2/user_profile`;
    this.authorizationEndpoint = `${authDomain}/oauth2/auth`;
    this.tokenEndpoint = `${authDomain}/oauth2/token`;
    this.tokenValidationDetails = {
      issuer: config.authDomain,
      audience: config.audience,
    };
  }

  /**
   * Abstract method will return the initial set of query parameters required for
   * creating the authorization URL in child class for the kinde client's register
   * and login methods.
   * @returns {URLSearchParams} Required query parameters
   */
  protected abstract getBaseAuthURLParams(): URLSearchParams;

  /**
   * Abstract method mandates implementation of logic required for creating auth URL
   * in kinde client's login and register methods, as well saving state parameter to
   * the session using the provided sessionManager.
   * @param {SessionManager} sessionManager
   * @param {AuthURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  public abstract createAuthorizationURL(
    sessionManager: SessionManager,
    options: AuthURLOptions
  ): Promise<URL>;

  /**
   * Abstract method mandates implementation of logic required for creating portal URL
   * for accessing Kinde's portal interface, utilizing session data for authentication.
   * @param {GeneratePortalUrlParams} options
   * @returns {Promise<{url: URL}>} object containing the portal URL
   */
  public abstract createPortalUrl(
    sessionManager: SessionManager,
    options: GeneratePortalUrlParams
  ): Promise<{ url: URL }>;

  /**
   * Abstract method will implement logic required for exchanging received auth code
   * post user-authentication with authorization server to receive access, refresh
   * and id tokens from this exchange.
   * @param {SessionManager} sessionManager
   * @param {URL} callbackURL
   * @returns {Promise<OAuth2CodeExchangeResponse>}
   */
  protected abstract exchangeAuthCodeForTokens(
    sessionManager: SessionManager,
    callbackURL: URL
  ): Promise<OAuth2CodeExchangeResponse>;

  /**
   * Abstract method will implement logic in child classes for refreshing access token
   * using refresh token available in current session.
   * @param {SessionManager} sessionManager
   * @param {boolean} [commitToSession=true] - Optional parameter, determines whether to commit the refreshed tokens to the session. Defaults to true.
   * @returns {Promise<OAuth2CodeExchangeResponse>}
   */
  public abstract refreshTokens(
    sessionManager: SessionManager,
    commitToSession?: boolean
  ): Promise<OAuth2CodeExchangeResponse>;

  /**
   * Method handles redirection logic to after authorization server redirects back
   * to application, this method makes use of the @see {exchangeAuthCodeForTokens}
   * method above and saves the received tokens to the current session.
   * @param {SessionManager} sessionManager
   * @param {URL} callbackURL
   * @returns {Promise<void>}
   */
  async handleRedirectFromAuthDomain(
    sessionManager: SessionManager,
    callbackURL: URL
  ): Promise<void> {
    const tokens = await this.exchangeAuthCodeForTokens(sessionManager, callbackURL);
    await utilities.commitTokensToSession(
      sessionManager,
      tokens,
      this.tokenValidationDetails
    );
  }

  /**
   * Method retrieves the access token, if the token present in the current session
   * is unexpired it will be returned otherwise, a new one will be obtained using
   * the refresh token if the refresh token is not available either an error will
   * be thrown.
   * @param {SessionManager} sessionManager
   * @returns {Promise<string>}
   */
  public async getToken(sessionManager: SessionManager): Promise<string> {
    const accessToken = await utilities.getAccessToken(sessionManager);
    if (!accessToken) {
      throw new Error('No authentication credential found');
    }

    const isAccessTokenExpired = await utilities.isTokenExpired(
      accessToken,
      this.tokenValidationDetails
    );
    if (!isAccessTokenExpired) {
      return accessToken;
    }

    const refreshToken = await utilities.getRefreshToken(sessionManager);
    if (!refreshToken && isNodeEnvironment()) {
      throw Error('Cannot persist session no valid refresh token found');
    }

    try {
      const tokens = await this.refreshTokens(sessionManager);
      return tokens.access_token;
    } catch (error) {
      throw new KindeSDKError(
        KindeSDKErrorCode.FAILED_TOKENS_REFRESH_ATTEMPT,
        `Failed to refresh tokens owing to: ${(error as Error).message}`
      );
    }
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
   * Method makes use of the user profile V2 endpoint to fetch the authenticated
   * user's profile information.
   * @param {SessionManager} sessionManager
   * @returns {Promise<UserType>}
   */
  async getUserProfile(sessionManager: SessionManager): Promise<UserType> {
    const accessToken = await this.getToken(sessionManager);
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${accessToken}`);
    headers.append('Accept', 'application/json');

    const targetURL = this.userProfileEndpoint;
    const config: RequestInit = { method: 'GET', headers };
    const response = await fetch(targetURL, config);
    const payload = (await response.json()) as UserType;

    return payload;
  }

  /**
   * A helper method employed by @see {exchangeAuthCodeForTokens} method in child
   * classes to extract code and state parameters from the received callback URL
   * an exception is raised in the event the callback URL contains an error query
   * parameter.
   * @param {URL} callbackURL
   * @returns {[string, string]} c
   */
  protected getCallbackURLParams(callbackURL: URL): [string, string] {
    const searchParams = new URLSearchParams(callbackURL.search);
    const state = searchParams.get('state')!;
    const error = searchParams.get('error');
    const code = searchParams.get('code')!;

    if (error) {
      throw new Error(`Authorization server reported an error: ${error}`);
    }

    return [code, state];
  }

  /**
   * Method implements logic for fetching tokens from the authorization server using
   * the provided body, the `useCookies` is used exclusively on the browser.
   * @param {SessionManager} sessionManager
   * @param {URLSearchParams} body
   * @param {boolean} useCookies
   * @returns {Promise<OAuth2CodeExchangeResponse>}
   */
  protected async fetchTokensFor(
    sessionManager: SessionManager,
    body: URLSearchParams,
    useCookies: boolean = false
  ): Promise<OAuth2CodeExchangeResponse> {
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

    const config: RequestInit = {
      method: 'POST',
      headers,
      body,
      credentials: useCookies ? 'include' : undefined,
    };
    const response = await fetch(this.tokenEndpoint, config);
    const payload = (await response.json()) as
      | OAuth2CodeExchangeErrorResponse
      | OAuth2CodeExchangeResponse;

    const errorPayload = payload as OAuth2CodeExchangeErrorResponse;
    if (errorPayload.error) {
      await sessionManager.destroySession();
      const errorDescription = errorPayload.error_description;
      const message = errorDescription ?? errorPayload.error;
      throw new Error(message);
    }

    return payload as OAuth2CodeExchangeResponse;
  }

  /**
   * Helper method employed by @see {createAuthorizationURL} method above for
   * generating the aforementioned authorization URL.
   * @param {AuthURLOptions}
   * @returns {URLSearchParams}
   */
  protected generateAuthURLParams(options: AuthURLOptions = {}): URLSearchParams {
    const searchParams = this.getBaseAuthURLParams();

    let scope = this.config.scope ?? AuthCodeAbstract.DEFAULT_TOKEN_SCOPES;
    scope = scope.split(' ').includes('openid') ? scope : `${scope} openid`;

    let searchParamsObject: Record<string, unknown> = {
      scope,
    };

    if (options.start_page) {
      searchParamsObject.start_page = options.start_page;
    }

    if (options.org_code) {
      searchParamsObject.org_code = options.org_code;
    }

    if (options.is_create_org) {
      searchParamsObject.org_name = options.org_name ?? '';
      searchParamsObject.is_create_org = 'true';
    }

    if (options.authUrlParams) {
      const {
        lang,
        login_hint: loginHint,
        connection_id: connectionId,
        state,
        ...rest
      } = options.authUrlParams;

      searchParamsObject = { ...rest, ...searchParamsObject };

      if (lang) {
        searchParamsObject.lang = lang;
      }

      if (loginHint) {
        searchParamsObject.login_hint = loginHint;
      }

      if (connectionId) {
        searchParamsObject.connection_id = connectionId;
      }
    }

    for (const key in searchParamsObject) {
      const value = searchParamsObject[key];
      if (typeof value === 'object' && value !== null) {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }

    if (this.config.audience) {
      const audienceArray = Array.isArray(this.config.audience)
        ? this.config.audience
        : [this.config.audience];

      audienceArray.forEach((aud) => {
        searchParams.append('audience', aud);
      });
    }

    return searchParams;
  }
}
