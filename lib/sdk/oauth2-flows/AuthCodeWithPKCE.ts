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

export class AuthCodeWithPKCE extends AuthCodeAbstract {
  public static STATE_KEY: string = 'acwpf-state-key';
  private codeChallenge?: string;
  private codeVerifier?: string;

  constructor(protected readonly config: AuthorizationCodeOptions) {
    super(config);
  }

  async createAuthorizationURL(
    sessionManager: SessionManager,
    options: AuthURLOptions = {}
  ) {
    const challengeSetup = await utilities.setupCodeChallenge();
    const { challenge, verifier } = challengeSetup;
    this.codeChallenge = challenge;
    this.codeVerifier = verifier;

    this.state = options.state ?? utilities.generateRandomString();
    const setItem = isBrowserEnvironment()
      ? (sessionManager as unknown as BrowserSessionManager).setItemBrowser
      : sessionManager.setSessionItem;

    setItem.call(
      sessionManager,
      this.getCodeVerifierKey(this.state),
      JSON.stringify({ codeVerifier: this.codeVerifier })
    );

    const authURL = new URL(this.authorizationEndpoint);
    const authParams = this.generateAuthURLParams(options);
    authURL.search = authParams.toString();
    return authURL;
  }

  protected async refreshTokens(sessionManager: SessionManager) {
    const refreshToken = utilities.getRefreshToken(sessionManager);
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken!,
      client_id: this.config.clientId,
    });

    const tokens = await this.fetchTokensFor(body, true);
    utilities.commitTokensToMemory(sessionManager, tokens);
    return tokens;
  }

  protected async exchangeAuthCodeForTokens(
    sessionManager: SessionManager,
    callbackURL: URL
  ): Promise<OAuth2CodeExchangeResponse> {
    const [code, state] = super.getCallbackURLParams(callbackURL);
    const storedStateKey = this.getCodeVerifierKey(state!);
    if (storedStateKey === null || !storedStateKey.endsWith(state!)) {
      throw new Error('Received state does not match stored state');
    }

    const getItem = isBrowserEnvironment()
      ? (sessionManager as unknown as BrowserSessionManager)
          .getSessionItemBrowser
      : sessionManager.getSessionItem;

    const storedState = getItem.call(sessionManager, storedStateKey) as
      | string
      | null;
    if (storedState === null) {
      throw new Error('Stored state not found');
    }

    const authFlowState = JSON.parse(storedState);
    this.codeVerifier = authFlowState.codeVerifier;

    const body = new URLSearchParams({
      redirect_uri: this.config.redirectURL,
      client_id: this.config.clientId,
      code_verifier: this.codeVerifier!,
      grant_type: 'authorization_code',
      code: code!,
    });

    const removeItem = isBrowserEnvironment()
      ? (sessionManager as unknown as BrowserSessionManager)
          .removeSessionItemBrowser
      : sessionManager.removeSessionItem;

    try {
      return await this.fetchTokensFor(body);
    } finally {
      removeItem.call(sessionManager, this.getCodeVerifierKey(state!));
    }
  }

  private getCodeVerifierKey(state: string): string {
    return `${AuthCodeWithPKCE.STATE_KEY}-${state}`;
  }

  protected getBaseAuthURLParams() {
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
