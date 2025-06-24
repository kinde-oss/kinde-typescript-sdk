import type {
  TokenCollection,
  UserType,
  TokenType,
  TokenValidationDetailsType,
} from './types.js';
import { type SessionManager } from '../session-managers/index.js';
import { KindeSDKError, KindeSDKErrorCode } from '../exceptions.js';
import { jwtVerify } from './jose-compat.js';

/**
 * Saves the provided token to the current session.
 * @param {SessionManager} sessionManager
 * @param {string} token
 * @param {TokenType} type
 */
export const commitTokenToSession = async (
  sessionManager: SessionManager,
  token: string,
  type: TokenType,
  validationDetails: TokenValidationDetailsType
): Promise<void> => {
  if (!token) {
    await sessionManager.removeSessionItem(type);
    return;
  }

  if (type === 'access_token' || type === 'id_token') {
    try {
      const key = await validationDetails.keyProvider();
      await jwtVerify(token, key);
    } catch (e) {
      throw new KindeSDKError(
        KindeSDKErrorCode.INVALID_TOKEN_MEMORY_COMMIT,
        `Attempting to commit invalid ${type} token "${token}" to memory`
      );
    }
  }

  await sessionManager.setSessionItem(type, token);
};

/**
 * Saves the access, refresh and id tokens provided in the `TokenCollection`
 * object to the current session.
 * @param {SessionManager} sessionManager
 * @param tokens
 */
export const commitTokensToSession = async (
  sessionManager: SessionManager,
  tokens: TokenCollection,
  validationDetails: TokenValidationDetailsType
): Promise<void> => {
  await Promise.all([
    commitTokenToSession(
      sessionManager,
      tokens.refresh_token,
      'refresh_token',
      validationDetails
    ),
    commitTokenToSession(
      sessionManager,
      tokens.access_token,
      'access_token',
      validationDetails
    ),
    commitTokenToSession(
      sessionManager,
      tokens.id_token,
      'id_token',
      validationDetails
    ),
  ]);
};

/**
 * Extracts the refresh token from current session returns null if the
 * token is not found.
 * @param {SessionManager} sessionManager
 * @returns {string | null}
 */
export const getRefreshToken = async (
  sessionManager: SessionManager
): Promise<string | null> => {
  return await (sessionManager.getSessionItem('refresh_token') as Promise<
    string | null
  >);
};

/**
 * Extracts the access token from current session returns null if the
 * token is not found.
 * @param {SessionManager} sessionManager
 * @returns {string | null}
 */
export const getAccessToken = async (
  sessionManager: SessionManager
): Promise<string | null> => {
  return await (sessionManager.getSessionItem('access_token') as Promise<
    string | null
  >);
};

/**
 * Extracts the user information from the current session returns null if
 * the token is not found.
 * @param {SessionManager} sessionManager
 * @returns {string | null}
 */
export const getUserFromSession = async (
  sessionManager: SessionManager,
  validationDetails: TokenValidationDetailsType
): Promise<UserType | null> => {
  const idTokenString = (await sessionManager.getSessionItem('id_token')) as string;
  const idToken = await jwtVerify(
    idTokenString,
    await validationDetails.keyProvider(),
    { currentDate: new Date(0) }
  );

  const user: UserType = {
    family_name: idToken.payload.family_name as string,
    given_name: idToken.payload.given_name as string,
    picture: (idToken.payload.picture as string) ?? null,
    email: idToken.payload.email as string,
    phone: idToken.payload.phone as string,
    id: idToken.payload.sub!,
  };

  return user;
};

/**
 * Checks if the provided JWT token is valid (expired or not).
 * @param {string | null} token
 * @returns {boolean} is expired or not
 */
export const isTokenExpired = async (
  token: string | null,
  validationDetails: TokenValidationDetailsType
): Promise<boolean> => {
  if (!token) return true;
  try {
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const tokenPayload = await jwtVerify(
      token,
      await validationDetails.keyProvider()
    );
    if (tokenPayload.payload.exp === undefined) return true;
    return currentUnixTime >= tokenPayload.payload.exp;
  } catch (e) {
    return true;
  }
};
