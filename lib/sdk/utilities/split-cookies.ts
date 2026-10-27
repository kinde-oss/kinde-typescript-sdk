import { splitString, storageSettings } from '@kinde/js-utils';

export const getMaxCookieLength = (): number => {
  return storageSettings.maxLength;
};

export type SplitCookie = {
  name: string;
  value: string;
};

/**
 * Splits a long cookie value into multiple cookies:
 * - first chunk uses `cookieName`
 * - subsequent chunks use `cookieName1`, `cookieName2`, ...
 */
export const getSplitCookies = (
  cookieName: string,
  cookieValue: string,
  maxCookieLength: number = getMaxCookieLength()
): SplitCookie[] => {
  if (!Number.isInteger(maxCookieLength) || maxCookieLength <= 0) {
    throw new Error(
      `maxCookieLength must be a positive integer. Received: ${String(maxCookieLength)}`
    );
  }

  return splitString(cookieValue, maxCookieLength).map((value, index) => {
    return {
      name: cookieName + (index === 0 ? '' : String(index)),
      value,
    };
  });
};

/**
 * Reconstructs a cookie value from split cookies created by `getSplitCookies`.
 *
 * If the base cookie (`cookieName`) is missing, `undefined` is returned.
 */
export const getJoinedSplitCookieValue = (
  cookieName: string,
  cookies: Record<string, string | undefined>
): string | undefined => {
  if (cookies[cookieName] === undefined) {
    return undefined;
  }

  let value = '';
  let index = 0;
  let key = cookieName;
  let chunk = cookies[key];
  while (chunk !== undefined) {
    value += chunk;
    index++;
    key = `${cookieName}${String(index)}`;
    chunk = cookies[key];
  }
  return value;
};

/**
 * Helper for deleting all cookie chunks for a given base name.
 */
export const getSplitCookieNamesToDelete = (
  cookieName: string,
  existingCookieNames: string[]
): string[] => {
  return existingCookieNames.filter((name) => name.startsWith(cookieName));
};
