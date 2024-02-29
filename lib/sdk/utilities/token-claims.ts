import { type SessionManager } from '../session-managers/index.js';
import { isTokenExpired } from './token-utils.js';
import { type ClaimTokenType } from './types.js';
import { jwtDecode } from 'jwt-decode';

/**
 * Method extracts the provided claim from the provided token type in the
 * current session.
 * @param {SessionManager} sessionManager
 * @param {string} claim
 * @param {ClaimTokenType} type
 * @returns {unknown | null}
 */
export const getClaimValue = async (
  sessionManager: SessionManager,
  claim: string,
  type: ClaimTokenType = 'access_token'
): Promise<unknown | null> => {
  const token = (await sessionManager.getSessionItem(`${type}`)) as string;
  const tokenPayload: Record<string, unknown> = jwtDecode(token);
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
export const getClaim = async (
  sessionManager: SessionManager,
  claim: string,
  type: ClaimTokenType = 'access_token'
): Promise<{ name: string; value: unknown | null }> => {
  return {
    name: claim,
    value: await getClaimValue(sessionManager, claim, type),
  };
};

/**
 * Method returns the organization code from the current session and returns
 * a boolean in the returned object indicating if the provided permission is
 * present in the session.
 * @param {SessionManager} sessionManager
 * @param {string} name
 * @returns {{ orgCode: string | null, isGranted: boolean }}
 */
export const getPermission = async (
  sessionManager: SessionManager,
  name: string
): Promise<{ orgCode: string | null; isGranted: boolean }> => {
  const permissions = ((await getClaimValue(sessionManager, 'permissions')) ??
    []) as string[];
  const isGranted = permissions.some((p) => p === name);
  const orgCode = (await getClaimValue(sessionManager, 'org_code')) as string | null;
  return { orgCode, isGranted };
};

/**
 * Method extracts the organization code from the current session.
 * @param {SessionManager} sessionManager
 * @returns {{ orgCode: string | null }}
 */
export const getOrganization = async (
  sessionManager: SessionManager
): Promise<{ orgCode: string | null }> => ({
  orgCode: (await getClaimValue(sessionManager, 'org_code')) as string | null,
});

/**
 * Method extracts all the permission and the organization code in the access
 * token in the current session.
 * @param {SessionManager} sessionManager
 * @returns {{ permissions: string[], orgCode: string | null }}
 */
export const getPermissions = async (
  sessionManager: SessionManager
): Promise<{ permissions: string[]; orgCode: string | null }> => {
  const [permissions, orgCode] = await Promise.all([
    (await getClaimValue(sessionManager, 'permissions') ?? []) as Promise<string[]>,
    await getClaimValue(sessionManager, 'org_code') as Promise<string | null>,
  ]);
  return {
    permissions,
    orgCode,
  };
};

/**
 * Method extracts all organization codes from the id token in the current
 * session.
 * @param {SessionManager} sessionManager
 * @returns {{ orgCodes: string[] }}
 */
export const getUserOrganizations = async (
  sessionManager: SessionManager
): Promise<{ orgCodes: string[] }> => ({
  orgCodes: ((await getClaimValue(sessionManager, 'org_codes', 'id_token')) ??
    []) as string[],
});
