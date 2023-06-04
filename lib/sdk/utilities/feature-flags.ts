import { getClaimValue } from './token-claims';

import {
  type FeatureFlags,
  type GetFlagType,
  type FlagType,
  FlagDataType,
} from './types';

export const getFlag = (
  code: string,
  defaultValue?: FlagType[keyof FlagType],
  type?: keyof FlagType
): GetFlagType => {
  const featureFlags = (getClaimValue('feature_flags') as FeatureFlags) ?? {};
  const flag = featureFlags[code];

  if (flag === undefined && defaultValue === undefined) {
    const message = `Flag ${code} was not found, and no default value has been provided`;
    throw new Error(message);
  }

  if (flag?.t !== undefined && type !== undefined && type !== flag?.t) {
    const message = `Flag ${code} is of type ${
      FlagDataType[flag.t]
    }, expected type ${FlagDataType[type]}`;
    throw new Error(message);
  }

  return {
    type: FlagDataType[flag!.t ?? type],
    is_default: flag?.v === undefined,
    value: flag?.v ?? defaultValue!,
    code,
  };
};

export const getIntegerFlag = (code: string, defaultValue?: number): number => {
  return getFlag(code, defaultValue, 'i').value as number;
};

export const getStringFlag = (code: string, defaultValue?: string): string => {
  return getFlag(code, defaultValue, 's').value as string;
};

export const getBooleanFlag = (
  code: string,
  defaultValue?: boolean
): boolean => {
  return getFlag(code, defaultValue, 'b').value as boolean;
};
