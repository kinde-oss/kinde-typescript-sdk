export enum KindeSDKErrorCode {
  INVALID_TOKEN_MEMORY_COMMIT = 'INVALID_TOKEN_MEMORY_COMMIT',
  FAILED_TOKENS_REFRESH_ATTEMPT = 'FAILED_TOKENS_REFRESH_ATTEMPT',
};

export class KindeSDKError extends Error {
  constructor(public errorCode: KindeSDKErrorCode, message: string) {
    super(message);
    this.name = 'KindeSDKError';
    Object.setPrototypeOf(this, KindeSDKError.prototype);
  }
}