import * as mocks from '../../mocks';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';

import {
  type FeatureFlags,
  FlagDataType,
  getFlag,
  type TokenValidationDetailsType,
} from '../../../sdk/utilities';

describe('feature-flags', () => {
  let mockAccessToken: Awaited<ReturnType<typeof mocks.getMockAccessToken>>;
  const { sessionManager } = mocks;
  const authDomain = 'local-testing@kinde.com';

  let validationDetails: TokenValidationDetailsType;

  beforeAll(async () => {
    validationDetails = {
      issuer: authDomain,
    };
  });

  beforeEach(async () => {
    mockAccessToken = await mocks.getMockAccessToken();
    await sessionManager.setSessionItem('access_token', mockAccessToken.token);
  });

  afterEach(async () => {
    await sessionManager.destroySession();
  });

  describe('getFlag', () => {
    it('throws error if no flag is found no defaultValue is given', async () => {
      const code = 'non-existant-code';
      await expect(
        async () => await getFlag(sessionManager, code, validationDetails)
      ).rejects.toThrowError(
        new Error(
          `Flag ${code} was not found, and no default value has been provided`
        )
      );
    });

    it('throw error if provided type is different from typeof of found flag', async () => {
      const featureFlags = mockAccessToken.payload.feature_flags as FeatureFlags;
      const code = 'is_dark_mode';
      const flag = featureFlags[code];
      await expect(
        async () => await getFlag(sessionManager, code, validationDetails, true, 's')
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
        async () =>
          await getFlag(sessionManager, code, validationDetails, false, 'b'),
        async () => await getFlag(sessionManager, code, validationDetails, '', 's'),
        async () => await getFlag(sessionManager, code, validationDetails, 0, 'i'),
      ];

      getFlagFnArray.forEach((getFlagFn) => {
        expect(getFlagFn).not.toThrow();
      });
    });

    it('provide result contains no type if default-value is used', async () => {
      const defaultValue = 'default-value';
      const code = 'non-existant-code';
      expect(
        await getFlag(sessionManager, code, validationDetails, defaultValue)
      ).toStrictEqual({
        value: defaultValue,
        is_default: true,
        code,
      });
    });

    it('retrieves flag data for a defined feature flag', async () => {
      const featureFlags = mockAccessToken.payload.feature_flags as FeatureFlags;
      for (const code in featureFlags) {
        const flag = featureFlags[code];
        expect(await getFlag(sessionManager, code, validationDetails)).toStrictEqual(
          {
            is_default: false,
            value: flag!.v,
            type: FlagDataType[flag!.t],
            code,
          }
        );
      }
    });
  });
});
