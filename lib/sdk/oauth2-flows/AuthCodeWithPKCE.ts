import { isBrowserEnvironment } from '../environment';
import { AuthCodeAbstract } from './AuthCodeAbstract';
import * as utilities from '../utilities';

import {
  type BrowserSessionManager,
  type SessionManager,
} from '../session-managers';

import type {
  OAuth2CodeExchangeResponse,
  AuthURLOptions,
  AuthorizationCodeOptions,
} from './types';

/**
 * Class provides implementation for the authorization code with PKCE extension
 * OAuth2.0 flow, please note the use of the `isBrowserEnvironment()` method
 * in certain methods of this class, this is because this class is intended to
 * be used on both the browser and server.
 * @class AuthCodeWithPKCE
 * @param {AuthorizationCodeOptions} config
 */
export class AuthCodeWithPKCE extends AuthCodeAbstract {
  public static STATE_KEY: string = 'acwpf-state-key';
  private codeChallenge?: string;
  private codeVerifier?: string;

  constructor(protected readonly config: AuthorizationCodeOptions) {
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
    const challengeSetup = await utilities.setupCodeChallenge();
    const { challenge, verifier } = challengeSetup;
    this.codeChallenge = challenge;
    this.codeVerifier = verifier;

    this.state = options.state ?? utilities.generateRandomString();
    const setItem = isBrowserEnvironment()
      ? (sessionManager as unknown as BrowserSessionManager)
          .setSessionItemBrowser
      : sessionManager.setSessionItem;

    await setItem.call(
      sessionManager,
      this.getCodeVerifierKey(this.state),
      JSON.stringify({ codeVerifier: this.codeVerifier })
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
      refresh_token: refreshToken!,
      client_id: this.config.clientId,
    });

    const tokens = await this.fetchTokensFor(sessionManager, body, true);
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
    const [code, state] = super.getCallbackURLParams(callbackURL);
    const storedStateKey = this.getCodeVerifierKey(state);
    if (!storedStateKey?.endsWith(state)) {
      throw new Error('Received state does not match stored state');
    }

    const getItem = isBrowserEnvironment()
      ? (sessionManager as unknown as BrowserSessionManager)
          .getSessionItemBrowser
      : sessionManager.getSessionItem;

    const storedState = (await getItem.call(sessionManager, storedStateKey)) as
      | string
      | null;
    if (!storedState) {
      throw new Error('Stored state not found');
    }

    const authFlowState = JSON.parse(storedState);
    this.codeVerifier = authFlowState.codeVerifier;

    const body = new URLSearchParams({
      redirect_uri: this.config.redirectURL,
      client_id: this.config.clientId,
      code_verifier: this.codeVerifier!,
      grant_type: 'authorization_code',
      code,
    });

    const removeItem = isBrowserEnvironment()
      ? (sessionManager as unknown as BrowserSessionManager)
          .removeSessionItemBrowser
      : sessionManager.removeSessionItem;

    try {
      return await this.fetchTokensFor(sessionManager, body);
    } finally {
      await removeItem.call(sessionManager, this.getCodeVerifierKey(state));
    }
  }

  /**
   * Method generates the key against which the code verifier is stored in session
   * storage.
   * @param {string} state
   * @returns {string} - required code verifer key
   */
  private getCodeVerifierKey(state: string): string {
    return `${AuthCodeWithPKCE.STATE_KEY}-${state}`;
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
      code_challenge: this.codeChallenge!,
      code_challenge_method: 'S256',
    });
  }
}
