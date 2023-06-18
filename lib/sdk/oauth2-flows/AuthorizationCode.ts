import { isNodeEnvironment } from '../environment';
import type { UserType } from '../utilities';
import * as utilities from '../utilities';
import { getSDKHeader } from '../version';
import { sessionStore } from '../stores';

import type {
  OAuth2CodeExchangeResponse,
  AuthorizationCodeOptions,
  AuthURLOptions,
} from './types';

export class AuthorizationCode {
  public static DEFAULT_TOKEN_SCOPES: string = 'openid profile email offline';
  public static STATE_KEY: string = 'ac-state-key';

  public readonly authorizationEndpoint: string;
  public readonly userProfileEndpoint: string;
  public readonly logoutEndpoint: string;
  public readonly tokenEndpoint: string;
  protected state?: string;

  constructor(
    protected readonly config: AuthorizationCodeOptions,
    private readonly clientSecret: string
  ) {
    const { authDomain, logoutRedirectURL } = config;
    this.logoutEndpoint = `${authDomain}/logout?redirect=${logoutRedirectURL}`;
    this.userProfileEndpoint = `${authDomain}/oauth2/v2/user_profile`;
    this.authorizationEndpoint = `${authDomain}/oauth2/auth`;
    this.tokenEndpoint = `${authDomain}/oauth2/token`;
    this.config = config;
  }

  async createAuthorizationURL(options: AuthURLOptions = {}) {
    this.state = options.state ?? utilities.generateRandomString();
    sessionStore.setItem(AuthorizationCode.STATE_KEY, this.state);
    const authURL = new URL(this.authorizationEndpoint);
    const authParams = this.generateAuthURLParams(options);
    authURL.search = authParams.toString();
    return authURL;
  }

  async handleRedirectFromAuthDomain(callbackURL: URL) {
    const tokens = await this.exchangeAuthCodeForTokens(callbackURL);
    utilities.commitTokensToMemory(tokens);
  }

  async getToken() {
    const accessToken = utilities.getAccessToken();
    const isAccessTokenExpired = utilities.isTokenExpired(accessToken);
    if (!isAccessTokenExpired) {
      return accessToken!;
    }

    const refreshToken = utilities.getRefreshToken();
    if (refreshToken === null && isNodeEnvironment()) {
      throw Error('Cannot persist session no valid refresh token found');
    }

    const tokens = await this.refreshTokens();
    return tokens.access_token;
  }

  async getUserProfile() {
    const accessToken = await this.getToken();
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${accessToken}`);
    headers.append('Accept', 'application/json');

    const targetURL = this.userProfileEndpoint;
    const config: RequestInit = { method: 'GET', headers };
    const response = await fetch(targetURL, config);
    const payload = (await response.json()) as UserType;
    utilities.commitUserToMemory(payload);
    return payload;
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

  protected getCallbackURLParams(callbackURL: URL) {
    const searchParams = new URLSearchParams(callbackURL.search);
    const state = searchParams.get('state')!;
    const error = searchParams.get('error');
    const code = searchParams.get('code');

    if (error !== null) {
      throw new Error(`Authorization server reported an error: ${error}`);
    }

    return [code, state];
  }

  protected async fetchTokensFor(
    body: URLSearchParams,
    useCookies: boolean = false
  ): Promise<OAuth2CodeExchangeResponse> {
    const headers = new Headers();
    headers.append(...getSDKHeader());
    headers.append(
      'Content-Type',
      'application/x-www-form-urlencoded; charset=UTF-8'
    );

    const config: RequestInit = {
      method: 'POST',
      headers,
      body,
      credentials: useCookies ? 'include' : undefined,
    };
    const response = await fetch(this.tokenEndpoint, config);
    return await response.json();
  }

  protected getBaseAuthURLParams() {
    return new URLSearchParams({
      state: this.state!,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectURL,
      response_type: 'code',
    });
  }

  protected generateAuthURLParams(
    options: AuthURLOptions = {}
  ): URLSearchParams {
    const searchParams = this.getBaseAuthURLParams();
    searchParams.append(
      'scope',
      this.config.scope ?? AuthorizationCode.DEFAULT_TOKEN_SCOPES
    );

    if (this.config.audience !== undefined) {
      searchParams.append('audience', this.config.audience);
    }

    if (options.start_page !== undefined) {
      searchParams.append('start_page', options.start_page);
    }

    if (options.org_code !== undefined) {
      searchParams.append('org_code', options.org_code);
    }

    if (options.is_create_org !== undefined) {
      searchParams.append('org_name', options.org_name ?? '');
      searchParams.append('is_create_org', 'true');
    }

    return searchParams;
  }
}
