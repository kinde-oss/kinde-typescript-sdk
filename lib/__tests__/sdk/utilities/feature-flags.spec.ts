import * as mocks from '../../mocks';

import {
  type FeatureFlags,
  FlagDataType,
  getFlag,
} from '../../../sdk/utilities';

describe('feature-flags', () => {
  let mockAccessToken: ReturnType<typeof mocks.getMockAccessToken>;
  const { sessionManager } = mocks;

  beforeEach(async () => {
    mockAccessToken = mocks.getMockAccessToken();
    await sessionManager.setSessionItem('access_token', mockAccessToken.token);
  });

  afterEach(async () => {
    await sessionManager.destroySession();
  });

  describe('getFlag', () => {
    it('throws error if no flag is found no defaultValue is given', async () => {
      const code = 'non-existant-code';
      await expect(
        async () => await getFlag(sessionManager, code)
      ).rejects.toThrowError(
        new Error(
          `Flag ${code} was not found, and no default value has been provided`
        )
      );
    });

    it('throw error if provided type is different from typeof of found flag', async () => {
      const featureFlags = mockAccessToken.payload
        .feature_flags as FeatureFlags;
      const code = 'is_dark_mode';
      const flag = featureFlags[code];
      await expect(
        async () => await getFlag(sessionManager, code, true, 's')
      ).rejects.toThrowError(
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
        async () => await getFlag(sessionManager, code, false, 'b'),
        async () => await getFlag(sessionManager, code, '', 's'),
        async () => await getFlag(sessionManager, code, 0, 'i'),
      ];

      getFlagFnArray.forEach((getFlagFn) => {
        expect(getFlagFn).not.toThrow();
      });
    });

    it('provide result contains no type if default-value is used', async () => {
      const defaultValue = 'default-value';
      const code = 'non-existant-code';
      expect(await getFlag(sessionManager, code, defaultValue)).toStrictEqual({
        value: defaultValue,
        is_default: true,
        code,
      });
    });

    it('retrieves flag data for a defined feature flag', async () => {
      const featureFlags = mockAccessToken.payload
        .feature_flags as FeatureFlags;
      for (const code in featureFlags) {
        const flag = featureFlags[code];
        expect(await getFlag(sessionManager, code)).toStrictEqual({
          is_default: false,
          value: flag!.v,
          type: FlagDataType[flag!.t],
          code,
        });
      }
    });
  });
});
