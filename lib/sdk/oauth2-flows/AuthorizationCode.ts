import { type SessionManager } from '../session-managers';
import { AuthCodeAbstract } from './AuthCodeAbstract';
import * as utilities from '../utilities';

import type {
  OAuth2CodeExchangeResponse,
  AuthorizationCodeOptions,
  AuthURLOptions,
} from './types';

export class AuthorizationCode extends AuthCodeAbstract {
  public static STATE_KEY: string = 'ac-state-key';

  constructor(
    protected readonly config: AuthorizationCodeOptions,
    private readonly clientSecret: string
  ) {
    super(config);
  }

  async createAuthorizationURL(
    sessionManager: SessionManager,
    options: AuthURLOptions = {}
  ) {
    this.state = options.state ?? utilities.generateRandomString();
    sessionManager.setSessionItem(AuthorizationCode.STATE_KEY, this.state);
    const authURL = new URL(this.authorizationEndpoint);
    const authParams = this.generateAuthURLParams(options);
    authURL.search = authParams.toString();
    return authURL;
  }

  protected async refreshTokens(sessionManager: SessionManager) {
    const refreshToken = utilities.getRefreshToken(sessionManager);
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken!,
    });

    const tokens = await this.fetchTokensFor(body);
    utilities.commitTokensToMemory(sessionManager, tokens);
    return tokens;
  }

  protected async exchangeAuthCodeForTokens(
    sessionManager: SessionManager,
    callbackURL: URL
  ): Promise<OAuth2CodeExchangeResponse> {
    const [code, state] = this.getCallbackURLParams(callbackURL);
    const stateKey = AuthorizationCode.STATE_KEY;
    const storedState = sessionManager.getSessionItem(stateKey) as
      | string
      | null;
    if (storedState === null || storedState !== state) {
      throw new Error('Authentication flow state not found');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.config.redirectURL,
      code: code!,
    });

    try {
      return await this.fetchTokensFor(body);
    } finally {
      sessionManager.removeSessionItem(stateKey);
    }
  }

  protected getBaseAuthURLParams() {
    return new URLSearchParams({
      state: this.state!,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectURL,
      response_type: 'code',
    });
  }
}
