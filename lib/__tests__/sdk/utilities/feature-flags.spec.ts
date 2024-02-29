import * as mocks from '../../mocks';

import { type FeatureFlag, type FeatureFlags, FlagDataType, getFlag, getIntegerFlag, getStringFlag, getBooleanFlag } from '../../../sdk/utilities';
import { describe, test, beforeEach, afterEach, expect } from 'vitest';

describe('feature-flags', () => {
  let mockAccessToken: ReturnType<typeof mocks.getMockAccessToken>;
  const { sessionManager } = mocks;

  beforeEach(async () => {
    mockAccessToken = mocks.getMockAccessToken({});
    await sessionManager.setSessionItem('access_token', mockAccessToken.token);
  });

  afterEach(async () => {
    await sessionManager.destroySession();
  });

  describe('getFlag', () => {
    test('throws error if no flag is found no defaultValue is given', async () => {
      const code = 'non-existant-code';
      await expect(
        async () => await getFlag(sessionManager, code)
      ).rejects.toThrowError(
        new Error(
          `Flag ${code} was not found, and no default value has been provided`
        )
      );
    });

    test('throw error if provided type is different from typeof of found flag', async () => {
      const featureFlags = mockAccessToken.payload.feature_flags as FeatureFlags;
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

    test('should not throw error for falsy default value which is not `undefined`', () => {
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

    test('provide result contains no type if default-value is used', async () => {
      const defaultValue = 'default-value';
      const code = 'non-existant-code';
      expect(await getFlag(sessionManager, code, defaultValue)).toStrictEqual({
        value: defaultValue,
        is_default: true,
        code,
      });
    });

    test('retrieves flag data for a defined feature flag', async () => {
      const featureFlags = mockAccessToken.payload.feature_flags as FeatureFlags;
      for (const code in featureFlags) {
        const flag = featureFlags[code];
        const isDefault = flag!.v === undefined;

        const expectedResult: FeatureFlag = {
          is_default: isDefault,
          value: isDefault ? 'default' : flag!.v,
          code,
        };

        if (!isDefault) {
          expectedResult.type = FlagDataType[flag!.t];
        }

        expect(await getFlag(sessionManager, code, 'default')).toStrictEqual(expectedResult);
      }
    });

    test('integer flag', async () => {
      const code = 'competitions_limit';
      expect(await getIntegerFlag(sessionManager, code)).toStrictEqual(5);
    })

    test('string flag', async () => {
      const code = 'theme';
      expect(await getStringFlag(sessionManager, code)).toStrictEqual('pink');
    })

    test('boolean flag', async () => {
      const code = 'is_dark_mode';
      expect(await getBooleanFlag(sessionManager, code)).toStrictEqual(false);
    })

    test('no value in feature flag, use default', async () => {

      const code = 'noValue';
      expect( 
        await getFlag(sessionManager, code, 'default')
      ).toStrictEqual({
        is_default: true,
        value: 'default',
        code,
      });
    })
  });
});
