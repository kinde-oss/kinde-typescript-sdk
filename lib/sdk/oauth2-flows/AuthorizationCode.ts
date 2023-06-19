import { AuthCodeAbstract } from './AuthCodeAbstract';
import * as utilities from '../utilities';
import { sessionStore } from '../stores';

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

  async createAuthorizationURL(options: AuthURLOptions = {}) {
    this.state = options.state ?? utilities.generateRandomString();
    sessionStore.setItem(AuthorizationCode.STATE_KEY, this.state);
    const authURL = new URL(this.authorizationEndpoint);
    const authParams = this.generateAuthURLParams(options);
    authURL.search = authParams.toString();
    return authURL;
  }

  protected async refreshTokens() {
    const refreshToken = utilities.getRefreshToken();
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken!,
    });

    const tokens = await this.fetchTokensFor(body);
    utilities.commitTokensToMemory(tokens);
    return tokens;
  }

  protected async exchangeAuthCodeForTokens(
    callbackURL: URL
  ): Promise<OAuth2CodeExchangeResponse> {
    const [code, state] = this.getCallbackURLParams(callbackURL);
    const stateKey = AuthorizationCode.STATE_KEY;
    const storedState = sessionStore.getItem(stateKey) as string | null;
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
      sessionStore.removeItem(stateKey);
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
