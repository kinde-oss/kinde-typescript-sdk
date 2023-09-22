import { type SessionManager } from '../session-managers/index.js';
import { getClaimValue } from './token-claims.js';

import {
  type FeatureFlags,
  type GetFlagType,
  type FlagType,
  FlagDataType,
} from './types.js';

/**
 * Method extracts the provided feature flag from the access token in the
 * current session.
 * @param {SessionManager} sessionManager
 * @param {string} code
 * @param {FlagType[keyof FlagType]} defaultValue
 * @param {keyof FlagType} type
 * @returns {GetFlagType}
 */
export const getFlag = async (
  sessionManager: SessionManager,
  code: string,
  defaultValue?: FlagType[keyof FlagType],
  type?: keyof FlagType
): Promise<GetFlagType> => {
  const featureFlags =
    ((await getClaimValue(sessionManager, 'feature_flags')) as FeatureFlags) ??
    {};
  const flag = featureFlags[code];

  if (!flag && defaultValue === undefined) {
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
export const getIntegerFlag = async (
  sessionManager: SessionManager,
  code: string,
  defaultValue?: number
): Promise<number> => {
  return (await getFlag(sessionManager, code, defaultValue, 'i'))
    .value as number;
};

/**
 * Method extracts the provided string feature flag from the access token in
 * the current session.
 * @param {SessionManager} sessionManager
 * @param {string} code
 * @param {string} defaultValue
 * @returns {string} string flag value
 */
export const getStringFlag = async (
  sessionManager: SessionManager,
  code: string,
  defaultValue?: string
): Promise<string> => {
  return (await getFlag(sessionManager, code, defaultValue, 's'))
    .value as string;
};

/**
 * Method extracts the provided boolean feature flag from the access token in
 * the current session.
 * @param {SessionManager} sessionManager
 * @param {string} code
 * @param {boolean} defaultValue
 * @returns {boolean} boolean flag value
 */
export const getBooleanFlag = async (
  sessionManager: SessionManager,
  code: string,
  defaultValue?: boolean
): Promise<boolean> => {
  return (await getFlag(sessionManager, code, defaultValue, 'b'))
    .value as boolean;
};
