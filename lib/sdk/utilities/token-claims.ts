import { type TokenType } from './types';
import { memoryStore } from '../stores';

export const getClaimValue = (
  claim: string,
  type: TokenType = 'access_token'
): unknown | null => {
  const tokenPayload = memoryStore.getItem(`${type}_payload`) as Record<
    string,
    unknown
  >;
  return tokenPayload[claim] ?? null;
};

export const getClaim = (claim: string, type: TokenType = 'access_token') => {
  return { name: claim, value: getClaimValue(claim, type) };
};

export const getPermission = (name: string) => {
  const permissions = (getClaimValue('permissions') ?? []) as string[];
  const isGranted = permissions.some((p) => p === name);
  const orgCode = getClaimValue('org_code') as string;
  return { orgCode, isGranted };
};

export const getOrganization = () => ({
  orgCode: getClaimValue('org_code') as string,
});

export const getPermissions = () => ({
  permissions: getClaimValue('permissions') as string[],
  orgCode: getClaimValue('org_code') as string,
});

export const getUserOrganizations = () => ({
  orgCodes: getClaimValue('org_codes', 'id_token'),
});
