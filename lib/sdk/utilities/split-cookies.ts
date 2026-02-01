import { splitString } from '@kinde/js-utils';

export const MAX_COOKIE_LENGTH = 3000;

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
  maxCookieLength: number = MAX_COOKIE_LENGTH
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
  while (true) {
    const key = `${cookieName}${index === 0 ? '' : String(index)}`;
    const chunk = cookies[key];
    if (chunk === undefined) {
      break;
    }
    value += chunk;
    index++;
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
