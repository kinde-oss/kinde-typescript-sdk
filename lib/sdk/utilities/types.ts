export interface TokenCollection {
  refresh_token: string;
  access_token: string;
  id_token: string;
}

export interface UserType {
  picture: null | string;
  family_name: string;
  given_name: string;
  email: string;
  id: string;
}

export type TokenType = 'refresh_token' | 'access_token' | 'id_token';

export enum FlagDataType {
  s = 'string',
  b = 'boolean',
  i = 'number',
}

export interface FlagType {
  s: string;
  b: boolean;
  i: number;
}

export interface FeatureFlag<T extends keyof FlagType> {
  t: T;
  v: FlagType[T];
}

export type FeatureFlags = Record<
  string,
  FeatureFlag<'b' | 'i' | 's'> | undefined
>;

export interface GetFlagType {
  type: 'string' | 'boolean' | 'number';
  value: FlagType[keyof FlagType];
  is_default: boolean;
  code: string;
}
