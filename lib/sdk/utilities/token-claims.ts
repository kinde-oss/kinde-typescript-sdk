import {
  getClaim as jsGetClaim,
  getCurrentOrganization as jsGetCurrentOrganization,
  getPermission as jsGetPermission,
  getPermissions as jsGetPermissions,
  getUserOrganizations as jsGetUserOrganizations,
} from '@kinde/js-utils';
import { validateToken } from '@kinde/jwt-validator';
import { type SessionManager } from '../session-managers/index.js';
import { type ClaimTokenType, type TokenValidationDetailsType } from './types.js';
import { mapClaimTokenType, withJsUtilsStorage } from './session-storage-bridge.js';
import { isTokenExpired } from './token-utils.js';

const validateTokenForClaim = async (
  sessionManager: SessionManager,
  type: ClaimTokenType,
  validationDetails: TokenValidationDetailsType
): Promise<void> => {
  const token = (await sessionManager.getSessionItem(type)) as string;

  if (type === 'access_token') {
    if (await isTokenExpired(token, validationDetails)) {
      throw new Error('Access token expired');
    }
    return;
  }

  const validation = await validateToken({
    token,
    domain: validationDetails.issuer,
  });
  if (!validation.valid) {
    throw new Error(validation.message);
  }
};

/**
 * Method extracts the provided claim from the provided token type in the
 * current session.
 * @param {SessionManager} sessionManager
 * @param {string} claim
 * @param {ClaimTokenType} type
 * @param {TokenValidationDetailsType} validationDetails
 * @returns {unknown | null}
 */
export const getClaimValue = async (
  sessionManager: SessionManager,
  claim: string,
  type: ClaimTokenType = 'access_token',
  validationDetails: TokenValidationDetailsType
): Promise<unknown | null> => {
  await validateTokenForClaim(sessionManager, type, validationDetails);

  return await withJsUtilsStorage(sessionManager, async () => {
    const result = await jsGetClaim(claim, mapClaimTokenType(type));
    return result?.value ?? null;
  });
};

/**
 * Method extracts the provided claim from the provided token type in the
 * current session, the returned object includes the provided claim.
 * @param {SessionManager} sessionManager
 * @param {string} claim
 * @param {ClaimTokenType} type
 * @param {TokenValidationDetailsType} validationDetails
 * @returns {{ name: string, value: unknown | null }}
 */
export const getClaim = async (
  sessionManager: SessionManager,
  claim: string,
  type: ClaimTokenType,
  validationDetails: TokenValidationDetailsType
): Promise<{ name: string; value: unknown | null }> => {
  return {
    name: claim,
    value: await getClaimValue(sessionManager, claim, type, validationDetails),
  };
};

/**
 * Method returns the organization code from the current session and returns
 * a boolean in the returned object indicating if the provided permission is
 * present in the session.
 * @param {SessionManager} sessionManager
 * @param {string} name
 * @param {TokenValidationDetailsType} validationDetails
 * @returns {{ orgCode: string | null, isGranted: boolean }}
 */
export const getPermission = async (
  sessionManager: SessionManager,
  name: string,
  validationDetails: TokenValidationDetailsType
): Promise<{ orgCode: string | null; isGranted: boolean }> => {
  await validateTokenForClaim(sessionManager, 'access_token', validationDetails);

  const { orgCode, isGranted } = await withJsUtilsStorage(sessionManager, async () =>
    jsGetPermission(name)
  );

  return { orgCode, isGranted };
};

/**
 * Method extracts the organization code from the current session.
 * @param {SessionManager} sessionManager
 * @param {TokenValidationDetailsType} validationDetails
 * @returns {{ orgCode: string | null }}
 */
export const getOrganization = async (
  sessionManager: SessionManager,
  validationDetails: TokenValidationDetailsType
): Promise<{ orgCode: string | null }> => {
  await validateTokenForClaim(sessionManager, 'access_token', validationDetails);

  const orgCode = await withJsUtilsStorage(sessionManager, async () =>
    jsGetCurrentOrganization()
  );

  return { orgCode };
};

/**
 * Method extracts all the permission and the organization code in the access
 * token in the current session.
 * @param {SessionManager} sessionManager
 * @param {TokenValidationDetailsType} validationDetails
 * @returns {{ permissions: string[], orgCode: string | null }}
 */
export const getPermissions = async (
  sessionManager: SessionManager,
  validationDetails: TokenValidationDetailsType
): Promise<{ permissions: string[]; orgCode: string | null }> => {
  await validateTokenForClaim(sessionManager, 'access_token', validationDetails);

  return await withJsUtilsStorage(sessionManager, async () => jsGetPermissions());
};

/**
 * Method extracts all organization codes from the id token in the current
 * session.
 * @param {SessionManager} sessionManager
 * @param {TokenValidationDetailsType} validationDetails
 * @returns {{ orgCodes: string[] }}
 */
export const getUserOrganizations = async (
  sessionManager: SessionManager,
  validationDetails: TokenValidationDetailsType
): Promise<{ orgCodes: string[] }> => {
  await validateTokenForClaim(sessionManager, 'id_token', validationDetails);

  const orgCodes = await withJsUtilsStorage(sessionManager, async () =>
    jsGetUserOrganizations()
  );

  return { orgCodes: orgCodes ?? [] };
};
