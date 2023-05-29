import * as environment from "../environment";
import * as utilities from "../utilities";
import type { User } from "../utilities";
import { sessionStore } from "../stores";

import type {
  OAuth2CodeExchangeResponse,
  AuthURLOptions,
  PKCEClientOptions,
} from "./types";

export class AuthCodeWithPKCE {
  public static DEFAULT_TOKEN_SCOPES: string = "openid profile email offline";
  public static AUTH_FLOW_STATE_KEY: string = "acwp-authflow-state";

  public readonly authorizationEndpoint: string;
  public readonly userProfileEndpoint: string;
  public readonly logoutEndpoint: string;
  public readonly tokenEndpoint: string;
  private codeVerifier?: string;
  private state?: string;

  constructor(private readonly config: PKCEClientOptions) {
    const { authDomain, logoutRedirectURL } = config;
    this.logoutEndpoint = `${authDomain}/logout?redirect=${logoutRedirectURL}`;
    this.userProfileEndpoint = `${authDomain}/oauth2/v2/user_profile`;
    this.authorizationEndpoint = `${authDomain}/oauth2/auth`;
    this.tokenEndpoint = `${authDomain}/oauth2/token`;
    this.config = config;
  }

  async createAuthorizationURL(options: AuthURLOptions = {}): Promise<URL> {
    const challengeSetup = await utilities.setupCodeChallenge();
    this.state = utilities.generateRandomString();
    this.codeVerifier = challengeSetup.verifier;

    const authFlowStateKey = this.getAuthFlowKeyFor(this.state);
    sessionStore.setItem(
      authFlowStateKey,
      JSON.stringify({
        codeVerifier: this.codeVerifier,
        appState: options.appState,
      })
    );

    const { challenge } = challengeSetup;
    const authURL = new URL(this.authorizationEndpoint);
    const authParams = this.generateAuthURLParams(challenge, options);
    authURL.search = authParams.toString();
    return authURL;
  }

  async handleRedirectFromAuthDomain(callbackURL: URL): Promise<void> {
    const tokens = await this.exchangeAuthCodeForTokens(callbackURL);
    utilities.commitTokensToMemory(tokens);
  }

  async getToken(): Promise<string> {
    const accessToken = utilities.getAccessToken();
    const isAccessTokenExpired = utilities.isTokenExpired(accessToken);
    if (!isAccessTokenExpired) {
      return accessToken!;
    }

    const refreshToken = utilities.getRefreshToken();
    if (refreshToken === null && environment.isNodeEnvironment()) {
      throw Error("Cannot persist session no valid refresh token found");
    }

    const tokens = await this.refreshTokens();
    return tokens.access_token;
  }

  async getUserProfile() {
    const accessToken = await this.getToken();
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${accessToken}`);
    headers.append("Accept", "application/json");

    const targetURL = this.userProfileEndpoint;
    const config: RequestInit = { method: "GET", headers };
    const response = await fetch(targetURL, config);
    const payload = (await response.json()) as User;
    utilities.commitUserToMemory(payload);
    return payload;
  }

  private async refreshTokens(): Promise<OAuth2CodeExchangeResponse> {
    const refreshToken = utilities.getRefreshToken();
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken!,
      client_id: this.config.clientId,
    });

    const tokens = await this.fetchTokensFor(body);
    utilities.commitTokensToMemory(tokens);
    return tokens;
  }

  private async exchangeAuthCodeForTokens(
    callbackURL: URL
  ): Promise<OAuth2CodeExchangeResponse> {
    const searchParams = new URLSearchParams(callbackURL.search);
    const authCode = searchParams.get("code");
    const state = searchParams.get("state")!;
    const error = searchParams.get("error");
    if (error !== null) {
      throw new Error(`Authorization server reported an error: ${error}`);
    }

    const authFlowStateKey = this.getAuthFlowKeyFor(state);
    const authFlowStateString = sessionStore.getItem(authFlowStateKey) as
      | string
      | null;

    if (authFlowStateString === null) {
      throw new Error(`Authentication flow state not found`);
    }

    const authFlowState = JSON.parse(authFlowStateString);
    this.codeVerifier = authFlowState.codeVerifier;

    const body = new URLSearchParams({
      redirect_uri: this.config.redirectURL,
      client_id: this.config.clientId,
      code_verifier: this.codeVerifier!,
      grant_type: "authorization_code",
      code: authCode!,
    });

    try {
      return await this.fetchTokensFor(body);
    } finally {
      sessionStore.removeItem(this.getAuthFlowKeyFor(state));
    }
  }

  private async fetchTokensFor(
    body: URLSearchParams
  ): Promise<OAuth2CodeExchangeResponse> {
    const headers = new Headers();
    headers.append(
      "Content-Type",
      "application/x-www-form-urlencoded; charset=UTF-8"
    );
    const config: RequestInit = { method: "POST", headers, body };
    const response = await fetch(this.tokenEndpoint, config);
    return (await response.json()) as OAuth2CodeExchangeResponse;
  }

  private getAuthFlowKeyFor(state: string): string {
    return `${AuthCodeWithPKCE.AUTH_FLOW_STATE_KEY}-${state}`;
  }

  private generateAuthURLParams(
    codeChallenge: string,
    options: AuthURLOptions = {}
  ): URLSearchParams {
    const searchParams: any = {
      state: this.state!,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectURL,
      scope: AuthCodeWithPKCE.DEFAULT_TOKEN_SCOPES,
      response_type: "code",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    };

    if (options.start_page !== undefined) {
      searchParams.start_page = options.start_page;
    }

    if (options.audience !== undefined) {
      searchParams.audience = options.audience;
    }

    if (options.is_create_org !== undefined) {
      searchParams.org_name = options.org_name;
      searchParams.is_create_org = true;
    }

    if (options.scope !== undefined) {
      searchParams.scope = options.scope;
    }

    return new URLSearchParams(searchParams);
  }
}
