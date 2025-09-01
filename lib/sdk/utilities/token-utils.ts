import type {
  TokenCollection,
  UserType,
  TokenType,
  TokenValidationDetailsType,
} from './types.js';
import { type SessionManager } from '../session-managers/index.js';
import { KindeSDKError, KindeSDKErrorCode } from '../exceptions.js';
import { validateToken } from '@kinde/jwt-validator';
import { jwtDecoder } from '@kinde/jwt-decoder';

/**
 * Saves the provided token to the current session.
 * @param {SessionManager} sessionManager
 * @param {string} token
 * @param {TokenValidationDetailsType} validationDetails
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
      const validation = await validateToken({
        token,
        domain: validationDetails.issuer,
      });
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      const isExpired = await isTokenExpired(token, validationDetails);
      if (isExpired) {
        throw new Error('Token is expired');
      }
    } catch (error) {
      throw new KindeSDKError(
        KindeSDKErrorCode.INVALID_TOKEN_MEMORY_COMMIT,
        `Attempting to commit invalid ${type} token "${token}" to memory: ${(error as Error).message}`
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
  const payload: { ksp?: { persistent: boolean } } | null = jwtDecoder<{
    ksp: { persistent: boolean };
  }>(tokens.access_token);
  if (payload) {
    sessionManager.persistent = payload.ksp?.persistent ?? true;
  }
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
 * @param {TokenValidationDetailsType} validationDetails
 * @returns {UserType | null}
 */
export const getUserFromSession = async (
  sessionManager: SessionManager,
  validationDetails: TokenValidationDetailsType
): Promise<UserType | null> => {
  const idTokenString = (await sessionManager.getSessionItem('id_token')) as string;

  // Validate signature to prevent tampering
  const validation = await validateToken({
    token: idTokenString,
    domain: validationDetails.issuer,
  });
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  // Decode the ID token for user information
  const payload: Record<string, unknown> = jwtDecoder(idTokenString) ?? {};
  if (Object.keys(payload).length === 0) {
    throw new Error('Invalid ID token');
  }

  const user: UserType = {
    family_name: payload.family_name as string,
    given_name: payload.given_name as string,
    picture: (payload.picture as string) ?? null,
    email: payload.email as string,
    phone: payload.phone as string,
    id: payload.sub as string,
  };

  return user;
};

/**
 * Checks if the provided JWT token is valid (expired or not).
 * @param {string | null} token
 * @param {TokenValidationDetailsType} validationDetails
 * @returns {boolean} is expired or not
 */
export const isTokenExpired = async (
  token: string | null,
  validationDetails: TokenValidationDetailsType
): Promise<boolean> => {
  if (!token) return true;
  try {
    // Validate signature to prevent tampering
    const validation = await validateToken({
      token,
      domain: validationDetails.issuer,
    });
    if (!validation.valid) {
      return true;
    }

    const currentUnixTime = Math.floor(Date.now() / 1000);
    const payload = jwtDecoder(token);
    if (!payload || payload.exp === undefined) return true;
    return currentUnixTime >= payload.exp;
  } catch (error) {
    console.error(`Error checking if token is expired: ${(error as Error).message}`);
    return true;
  }
};
