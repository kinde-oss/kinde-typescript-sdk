import { validateToken } from '@kinde/jwt-validator';
import { type SessionManager } from '../session-managers/index.js';
import { type ClaimTokenType, type TokenValidationDetailsType } from './types.js';
import { isTokenExpired } from './token-utils.js';

export const validateTokenForClaim = async (
  sessionManager: SessionManager,
  type: ClaimTokenType,
  validationDetails: TokenValidationDetailsType
): Promise<void> => {
  const token = (await sessionManager.getSessionItem(type)) as string | null;

  if (type === 'access_token') {
    if (token == null) {
      throw new Error('Access token missing');
    }
    if (await isTokenExpired(token, validationDetails)) {
      throw new Error('Access token expired');
    }
    return;
  }

  if (token == null) {
    throw new Error('ID token missing');
  }

  const validation = await validateToken({
    token,
    domain: validationDetails.issuer,
  });
  if (!validation.valid) {
    throw new Error(validation.message);
  }
};
