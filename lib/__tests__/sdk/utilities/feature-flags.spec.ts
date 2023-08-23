import * as mocks from '../../mocks';

import {
  type FeatureFlags,
  FlagDataType,
  getFlag,
} from '../../../sdk/utilities';

describe('feature-flags', () => {
  let mockAccessToken: ReturnType<typeof mocks.getMockAccessToken>;
  const { sessionManager } = mocks;

  beforeEach(() => {
    mockAccessToken = mocks.getMockAccessToken();
    sessionManager.setSessionItem(
      'access_token_payload',
      mockAccessToken.payload
    );
    sessionManager.setSessionItem('access_token', mockAccessToken.token);
  });

  afterEach(() => {
    sessionManager.destroySession();
  });

  describe('getFlag', () => {
    it('throws error if no flag is found no defaultValue is given', () => {
      const code = 'non-existant-code';
      expect(() => getFlag(sessionManager, code)).toThrowError(
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
      expect(() => getFlag(sessionManager, code, true, 's')).toThrowError(
        new Error(
          `Flag ${code} is of type ${FlagDataType[flag!.t]}, expected type is ${
            FlagDataType.s
          }`
        )
      );
    });

    it('should not throw error for falsy default value which is not `undefined`', () => {
      const code = 'non-existant-code';
      const getFlagFnArray = [
        () => getFlag(sessionManager, code, false, 'b'),
        () => getFlag(sessionManager, code, '', 's'),
        () => getFlag(sessionManager, code, 0, 'i'),
      ];

      getFlagFnArray.forEach(getFlagFn => expect(getFlagFn).not.toThrow());
    });

    it('provide result contains no type if default-value is used', () => {
      const defaultValue = 'default-value';
      const code = 'non-existant-code';
      expect(getFlag(sessionManager, code, defaultValue)).toStrictEqual({
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
        expect(getFlag(sessionManager, code)).toStrictEqual({
          is_default: false,
          value: flag!.v,
          type: FlagDataType[flag!.t],
          code,
        });
      });
    });
  });
});
