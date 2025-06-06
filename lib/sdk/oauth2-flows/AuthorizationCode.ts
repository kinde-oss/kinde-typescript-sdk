import { type SessionManager } from '../session-managers/index.js';
import { AuthCodeAbstract } from './AuthCodeAbstract.js';
import * as utilities from '../utilities/index.js';

import type {
  OAuth2CodeExchangeResponse,
  AuthorizationCodeOptions,
  AuthURLOptions,
} from './types.js';
import type { GeneratePortalUrlParams } from '@kinde/js-utils';
import { createPortalUrl } from '../utilities/createPortalUrl.js';

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
    const providedState = options.state ?? options.authUrlParams?.state;

    this.state =
      providedState ??
      ((await sessionManager.getSessionItem(
        AuthorizationCode.STATE_KEY
      )) as string) ??
      utilities.generateRandomString();

    await sessionManager.setSessionItem(AuthorizationCode.STATE_KEY, this.state);
    const authURL = new URL(this.authorizationEndpoint);
    const authParams = this.generateAuthURLParams(options);
    authURL.search = authParams.toString();
    return authURL;
  }

  /**
   * Method provides implementation for `createPortalUrl` method mandated by
   * `AuthCodeAbstract` parent class, see corresponding comment in parent class for
   * further explanation.
   * @param {SessionManager} sessionManager
   * @param {Omit<GeneratePortalUrlParams, 'domain'>} options
   * @returns {Promise<{url: URL}>} required authorization URL
   */
  async createPortalUrl(
    sessionManager: SessionManager,
    options: Omit<GeneratePortalUrlParams, 'domain'>
  ): Promise<{ url: URL }> {
    return await createPortalUrl(sessionManager, {
      domain: this.config.authDomain,
      ...options,
    });
  }

  /**
   * Method provides implementation for `refreshTokens` method mandated by
   * `AuthCodeAbstract` parent class, see corresponding comment in parent class for
   * further explanation.
   * @param {SessionManager} sessionManager
   * @param {boolean} [commitToSession=true] - Optional parameter, determines whether to commit the refreshed tokens to the session. Defaults to true.
   * @returns {Promise<OAuth2CodeExchangeResponse>}
   */
  public async refreshTokens(
    sessionManager: SessionManager,
    commitToSession: boolean = true
  ): Promise<OAuth2CodeExchangeResponse> {
    const refreshToken = await utilities.getRefreshToken(sessionManager);

    if (!utilities.validateClientSecret(this.clientSecret)) {
      throw new Error(`Invalid client secret ${this.clientSecret}`);
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken!,
    });

    const tokens = await this.fetchTokensFor(sessionManager, body);
    if (commitToSession) {
      await utilities.commitTokensToSession(
        sessionManager,
        tokens,
        this.tokenValidationDetails
      );
    }
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
    if (!storedState) {
      throw new Error(
        `Authentication flow: Received: ${state} | Expected: State not found`
      );
    }

    if (storedState !== state) {
      throw new Error(
        `Authentication flow: State mismatch. Received: ${state} | Expected: ${storedState}`
      );
    }

    if (!utilities.validateClientSecret(this.clientSecret)) {
      throw new Error(`Invalid client secret ${this.clientSecret}`);
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
