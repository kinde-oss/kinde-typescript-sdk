import { memoryStore } from '../../../sdk/stores';
import * as mocks from '../../mocks';

import {
  type FeatureFlags,
  FlagDataType,
  getFlag,
} from '../../../sdk/utilities';

describe('feature-flags', () => {
  let mockAccessToken: ReturnType<typeof mocks.getMockAccessToken>;

  beforeEach(() => {
    mockAccessToken = mocks.getMockAccessToken();
    memoryStore.setItem('access_token_payload', mockAccessToken.payload);
    memoryStore.setItem('access_token', mockAccessToken.token);
  });

  afterEach(() => {
    memoryStore.clear();
  });

  describe('getFlag', () => {
    it('throws error if no flag is found no defaultValue is given', () => {
      const code = 'non-existant-code';
      expect(() => getFlag(code)).toThrowError(
        new Error(
          `Flag ${code} was not found, and no default value has been provided`
        )
      );
    });

    it('throw error if provided type is different from typeof of found flag', () => {
      const featureFlags = mockAccessToken.payload
        .feature_flags as FeatureFlags;
      const code = 'is_dark_mode';
      const flag = featureFlags[code];
      expect(() => getFlag(code, true, 's')).toThrowError(
        new Error(
          `Flag ${code} is of type ${FlagDataType[flag!.t]}, expected type is ${
            FlagDataType.s
          }`
        )
      );
    });

    it('provide result contains no type if default-value is used', () => {
      const defaultValue = 'default-value';
      const code = 'non-existant-code';
      expect(getFlag(code, defaultValue)).toStrictEqual({
        value: defaultValue,
        is_default: true,
        code,
      });
    });

    it('retrieves flag data for a defined feature flag', () => {
      const featureFlags = mockAccessToken.payload
        .feature_flags as FeatureFlags;
      Object.keys(featureFlags).forEach((code) => {
        const flag = featureFlags[code];
        expect(getFlag(code)).toStrictEqual({
          is_default: false,
          value: flag!.v,
          type: FlagDataType[flag!.t],
          code,
        });
      });
    });
  });
});
