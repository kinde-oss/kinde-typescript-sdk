import { type SessionManager } from '../session-managers';
import { isTokenExpired } from './token-utils';
import { type TokenType } from './types';

/**
 * Method extracts the provided claim from the provided token type in the
 * current session.
 * @param {SessionManager} sessionManager
 * @param {string} claim
 * @param {TokenType} type
 * @returns {unknown | null}
 */
export const getClaimValue = (
  sessionManager: SessionManager,
  claim: string,
  type: TokenType = 'access_token'
): unknown | null => {
  const token = sessionManager.getSessionItem(type) as string | null;
  if (isTokenExpired(token)) {
    throw new Error(
      `No authentication credential found, when requesting claim ${claim}`
    );
  }

  const tokenPayload = sessionManager.getSessionItem(
    `${type}_payload`
  ) as Record<string, unknown>;
  return tokenPayload[claim] ?? null;
};

/**
 * Method extracts the provided claim from the provided token type in the
 * current session, the returned object includes the provided claim.
 * @param {SessionManager} sessionManager
 * @param {string} claim
 * @param {TokenType} type
 * @returns {{ name: string, value: unknown | null }}
 */
export const getClaim = (
  sessionManager: SessionManager,
  claim: string,
  type: TokenType = 'access_token'
) => {
  return { name: claim, value: getClaimValue(sessionManager, claim, type) };
};

/**
 * Method returns the organization code from the current session and returns
 * a boolean in the returned object indicating if the provided permission is
 * present in the session.
 * @param {SessionManager} sessionManager
 * @param {string} name
 * @returns {{ orgCode: string, isGranted: boolean }}
 */
export const getPermission = (sessionManager: SessionManager, name: string) => {
  const permissions = (getClaimValue(sessionManager, 'permissions') ??
    []) as string[];
  const isGranted = permissions.some((p) => p === name);
  const orgCode = getClaimValue(sessionManager, 'org_code') as string;
  return { orgCode, isGranted };
};

/**
 * Method extracts the organization code from the current session.
 * @param {SessionManager} sessionManager
 * @returns {{ orgCode: string }}
 */
export const getOrganization = (sessionManager: SessionManager) => ({
  orgCode: getClaimValue(sessionManager, 'org_code') as string,
});

/**
 * Method extracts all the permission and the organization code in the access
 * token in the current session.
 * @param {SessionManager} sessionManager
 * @returns {{ permissions: string[], orgCode: string }}
 */
export const getPermissions = (sessionManager: SessionManager) => ({
  permissions: getClaimValue(sessionManager, 'permissions') as string[],
  orgCode: getClaimValue(sessionManager, 'org_code') as string,
});

/**
 * Method extracts all organization codes from the id token in the current
 * session.
 * @param {SessionManager} sessionManager
 * @returns {{ orgCodes: string[] }}
 */
export const getUserOrganizations = (sessionManager: SessionManager) => ({
  orgCodes: getClaimValue(sessionManager, 'org_codes', 'id_token'),
});
