import { type SessionManager } from '../session-managers';
import { getClaimValue } from './token-claims';

import {
  type FeatureFlags,
  type GetFlagType,
  type FlagType,
  FlagDataType,
} from './types';

/**
 * Method extracts the provided feature flag from the access token in the
 * current session.
 * @param {SessionManager} sessionManager
 * @param {string} code
 * @param {FlagType[keyof FlagType]} defaultValue
 * @param {keyof FlagType} type
 * @returns {GetFlagType}
 */
export const getFlag = (
  sessionManager: SessionManager,
  code: string,
  defaultValue?: FlagType[keyof FlagType],
  type?: keyof FlagType
): GetFlagType => {
  const featureFlags =
    (getClaimValue(sessionManager, 'feature_flags') as FeatureFlags) ?? {};
  const flag = featureFlags[code];

  if (!flag && !defaultValue) {
    throw new Error(
      `Flag ${code} was not found, and no default value has been provided`
    );
  }

  if (flag?.t && type && type !== flag?.t) {
    throw new Error(
      `Flag ${code} is of type ${FlagDataType[flag.t]}, expected type is ${
        FlagDataType[type]
      }`
    );
  }

  const response: GetFlagType = {
    is_default: flag?.v === undefined,
    value: flag?.v ?? defaultValue!,
    code,
  };

  if (!response.is_default) {
    response.type = FlagDataType[flag?.t ?? type!];
  }

  return response;
};

/**
 * Method extracts the provided number feature flag from the access token in
 * the current session.
 * @param {SessionManager} sessionManager
 * @param {string} code
 * @param {number} defaultValue
 * @returns {number} integer flag value
 */
export const getIntegerFlag = (
  sessionManager: SessionManager,
  code: string,
  defaultValue?: number
): number => {
  return getFlag(sessionManager, code, defaultValue, 'i').value as number;
};

/**
 * Method extracts the provided string feature flag from the access token in
 * the current session.
 * @param {SessionManager} sessionManager
 * @param {string} code
 * @param {string} defaultValue
 * @returns {string} string flag value
 */
export const getStringFlag = (
  sessionManager: SessionManager,
  code: string,
  defaultValue?: string
): string => {
  return getFlag(sessionManager, code, defaultValue, 's').value as string;
};

/**
 * Method extracts the provided boolean feature flag from the access token in
 * the current session.
 * @param {SessionManager} sessionManager
 * @param {string} code
 * @param {boolean} defaultValue
 * @returns {boolean} boolean flag value
 */
export const getBooleanFlag = (
  sessionManager: SessionManager,
  code: string,
  defaultValue?: boolean
): boolean => {
  return getFlag(sessionManager, code, defaultValue, 'b').value as boolean;
};
