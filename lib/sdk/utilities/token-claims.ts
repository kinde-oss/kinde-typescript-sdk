import { type SessionManager } from '../session-managers';
import { isTokenExpired } from './token-utils';
import { type ClaimTokenType } from './types';

/**
 * Method extracts the provided claim from the provided token type in the
 * current session.
 * @param {SessionManager} sessionManager
 * @param {string} claim
 * @param {ClaimTokenType} type
 * @returns {unknown | null}
 */
export const getClaimValue = (
  sessionManager: SessionManager,
  claim: string,
  type: ClaimTokenType = 'access_token'
): unknown | null => {
  const token = sessionManager.getSessionItem(type as string) as string | null;
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
 * @param {ClaimTokenType} type
 * @returns {{ name: string, value: unknown | null }}
 */
export const getClaim = (
  sessionManager: SessionManager,
  claim: string,
  type: ClaimTokenType = 'access_token'
): { name: string; value: unknown | null } => {
  return { name: claim, value: getClaimValue(sessionManager, claim, type) };
};

/**
 * Method returns the organization code from the current session and returns
 * a boolean in the returned object indicating if the provided permission is
 * present in the session.
 * @param {SessionManager} sessionManager
 * @param {string} name
 * @returns {{ orgCode: string | null, isGranted: boolean }}
 */
export const getPermission = (
  sessionManager: SessionManager,
  name: string
): { orgCode: string | null; isGranted: boolean } => {
  const permissions = (getClaimValue(sessionManager, 'permissions') ??
    []) as string[];
  const isGranted = permissions.some((p) => p === name);
  const orgCode = getClaimValue(sessionManager, 'org_code') as string | null;
  return { orgCode, isGranted };
};

/**
 * Method extracts the organization code from the current session.
 * @param {SessionManager} sessionManager
 * @returns {{ orgCode: string | null }}
 */
export const getOrganization = (
  sessionManager: SessionManager
): { orgCode: string | null } => ({
  orgCode: getClaimValue(sessionManager, 'org_code') as string | null,
});

/**
 * Method extracts all the permission and the organization code in the access
 * token in the current session.
 * @param {SessionManager} sessionManager
 * @returns {{ permissions: string[], orgCode: string | null }}
 */
export const getPermissions = (
  sessionManager: SessionManager
): { permissions: string[]; orgCode: string | null } => ({
  permissions: (getClaimValue(sessionManager, 'permissions') ?? []) as string[],
  orgCode: getClaimValue(sessionManager, 'org_code') as string | null,
});

/**
 * Method extracts all organization codes from the id token in the current
 * session.
 * @param {SessionManager} sessionManager
 * @returns {{ orgCodes: string[] }}
 */
export const getUserOrganizations = (
  sessionManager: SessionManager
): { orgCodes: string[] } => ({
  orgCodes: (getClaimValue(sessionManager, 'org_codes', 'id_token') ??
    []) as string[],
});
