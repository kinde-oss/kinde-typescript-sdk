import { type SessionManager } from '../session-managers/index.js';
import { AuthCodeAbstract } from './AuthCodeAbstract.js';
import * as utilities from '../utilities/index.js';

import type {
  OAuth2CodeExchangeResponse,
  AuthorizationCodeOptions,
  AuthURLOptions,
} from './types.js';

/**
 * Class provides implementation for the authorization code OAuth2.0 flow.
 * @class AuthorizationCode
 * @param {AuthorizationCodeOptions} config
 * @param {string} clientSecret
 */
export class AuthorizationCode extends AuthCodeAbstract {
  public static STATE_KEY: string = 'ac-state-key';

  constructor(
    protected readonly config: AuthorizationCodeOptions,
    private readonly clientSecret: string
  ) {
    super(config);
  }

  /**
   * Method provides implementation for `createAuthorizationURL` method mandated by
   * `AuthCodeAbstract` parent class, see corresponding comment in parent class for
   * further explanation.
   * @param {SessionManager} sessionManager
   * @param {AuthURLOptions} options
   * @returns {Promise<URL>} required authorization URL
   */
  async createAuthorizationURL(
    sessionManager: SessionManager,
    options: AuthURLOptions = {}
  ): Promise<URL> {
    this.state = options.state ?? utilities.generateRandomString();
    await sessionManager.setSessionItem(
      AuthorizationCode.STATE_KEY,
      this.state
    );
    const authURL = new URL(this.authorizationEndpoint);
    const authParams = this.generateAuthURLParams(options);
    authURL.search = authParams.toString();
    return authURL;
  }

  /**
   * Method provides implementation for `refreshTokens` method mandated by
   * `AuthCodeAbstract` parent class, see corresponding comment in parent class for
   * further explanation.
   * @param {SessionManager} sessionManager
   * @returns {Promise<OAuth2CodeExchangeResponse>}
   */
  protected async refreshTokens(
    sessionManager: SessionManager
  ): Promise<OAuth2CodeExchangeResponse> {
    const refreshToken = await utilities.getRefreshToken(sessionManager);
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken!,
    });

    const tokens = await this.fetchTokensFor(sessionManager, body);
    await utilities.commitTokensToMemory(sessionManager, tokens);
    return tokens;
  }

  /**
   * Method provides implementation for `exchangeAuthCodeForTokens` method mandated
   * by `AuthCodeAbstract` parent class, see corresponding comment in parent class
   * for further explanation.
   * @param {SessionManager} sessionManager
   * @param {URL} callbackURL
   * @returns {Promise<OAuth2CodeExchangeResponse>}
   */
  protected async exchangeAuthCodeForTokens(
    sessionManager: SessionManager,
    callbackURL: URL
  ): Promise<OAuth2CodeExchangeResponse> {
    const [code, state] = this.getCallbackURLParams(callbackURL);
    const stateKey = AuthorizationCode.STATE_KEY;
    const storedState = (await sessionManager.getSessionItem(stateKey)) as
      | string
      | null;
    if (!storedState || storedState !== state) {
      throw new Error('Authentication flow state not found');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.config.redirectURL,
      code,
    });

    try {
      return await this.fetchTokensFor(sessionManager, body);
    } finally {
      await sessionManager.removeSessionItem(stateKey);
    }
  }

  /**
   * Method provides implementation for `getBaseAuthURLParams` method mandated by
   * `AuthCodeAbstract` parent class, see corresponding comment in parent class
   * for further explanation.
   * @returns {URLSearchParams} Required query parameters
   */
  protected getBaseAuthURLParams(): URLSearchParams {
    return new URLSearchParams({
      state: this.state!,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectURL,
      response_type: 'code',
    });
  }
}
