export enum KindeSDKErrorCode {
  INVALID_TOKEN_MEMORY_COMMIT = 'INVALID_TOKEN_MEMORY_COMMIT',
  FAILED_TOKENS_REFRESH_ATTEMPT = 'FAILED_TOKENS_REFRESH_ATTEMPT',
  /**
   * Refresh token was rejected (typically `invalid_grant`). Often caused by a
   * concurrent refresh that already rotated the token — do not treat as a
   * signal to clear a still-valid session.
   */
  STALE_REFRESH_TOKEN = 'STALE_REFRESH_TOKEN',
}

export class KindeSDKError extends Error {
  constructor(
    public errorCode: KindeSDKErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'KindeSDKError';
    Object.setPrototypeOf(this, KindeSDKError.prototype);
  }
}
