import { type SessionManager } from '../session-managers';
import { isTokenExpired } from './token-utils';
import { type TokenType } from './types';

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

export const getClaim = (
  sessionManager: SessionManager,
  claim: string,
  type: TokenType = 'access_token'
) => {
  return { name: claim, value: getClaimValue(sessionManager, claim, type) };
};

export const getPermission = (sessionManager: SessionManager, name: string) => {
  const permissions = (getClaimValue(sessionManager, 'permissions') ??
    []) as string[];
  const isGranted = permissions.some((p) => p === name);
  const orgCode = getClaimValue(sessionManager, 'org_code') as string;
  return { orgCode, isGranted };
};

export const getOrganization = (sessionManager: SessionManager) => ({
  orgCode: getClaimValue(sessionManager, 'org_code') as string,
});

export const getPermissions = (sessionManager: SessionManager) => ({
  permissions: getClaimValue(sessionManager, 'permissions') as string[],
  orgCode: getClaimValue(sessionManager, 'org_code') as string,
});

export const getUserOrganizations = (sessionManager: SessionManager) => ({
  orgCodes: getClaimValue(sessionManager, 'org_codes', 'id_token'),
});
