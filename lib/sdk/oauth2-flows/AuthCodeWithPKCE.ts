import { AuthorizationCode } from './AuthorizationCode';
import * as utilities from '../utilities';
import { sessionStore } from '../stores';

import type {
  OAuth2CodeExchangeResponse,
  AuthURLOptions,
  AuthorizationCodeOptions,
} from './types';

export class AuthCodeWithPKCE extends AuthorizationCode {
  public static STATE_KEY: string = 'acwpf-state-key';
  private codeChallenge?: string;
  private codeVerifier?: string;

  constructor(protected readonly config: AuthorizationCodeOptions) {
    super(config, '');
    this.config = config;
  }

  async createAuthorizationURL(options: AuthURLOptions = {}) {
    const challengeSetup = await utilities.setupCodeChallenge();
    const { challenge, verifier } = challengeSetup;
    this.codeChallenge = challenge;
    this.codeVerifier = verifier;

    this.state = options.state ?? utilities.generateRandomString();
    sessionStore.setItem(
      this.getCodeVerifierKey(this.state),
      JSON.stringify({ codeVerifier: this.codeVerifier })
    );

    const authURL = new URL(this.authorizationEndpoint);
    const authParams = this.generateAuthURLParams(options);
    authURL.search = authParams.toString();
    return authURL;
  }

  protected async refreshTokens() {
    const refreshToken = utilities.getRefreshToken();
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken!,
      client_id: this.config.clientId,
    });

    const tokens = await this.fetchTokensFor(body, true);
    utilities.commitTokensToMemory(tokens);
    return tokens;
  }

  protected async exchangeAuthCodeForTokens(
    callbackURL: URL
  ): Promise<OAuth2CodeExchangeResponse> {
    const [code, state] = super.getCallbackURLParams(callbackURL);
    const storedStateKey = this.getCodeVerifierKey(state!);
    if (storedStateKey === null || !storedStateKey.endsWith(state!)) {
      throw new Error('Received state does not match stored state');
    }

    const storedState = sessionStore.getItem(storedStateKey) as string | null;
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

    try {
      return await this.fetchTokensFor(body);
    } finally {
      sessionStore.removeItem(this.getCodeVerifierKey(state!));
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
