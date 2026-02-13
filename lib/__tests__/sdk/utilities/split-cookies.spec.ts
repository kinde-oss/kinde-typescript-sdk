import {
  getJoinedSplitCookieValue,
  getSplitCookieNamesToDelete,
  getSplitCookies,
  MAX_COOKIE_LENGTH,
} from '../../../sdk/utilities';
import { describe, it, expect } from 'vitest';

describe('split-cookies utilities', () => {
  it('splits a long value into multiple cookies and rejoins it', () => {
    const original = 'a'.repeat(MAX_COOKIE_LENGTH * 2 + 123);
    const split = getSplitCookies('access_token', original);

    expect(split.length).toBe(3);
    expect(split[0].name).toBe('access_token');
    expect(split[1].name).toBe('access_token1');
    expect(split[2].name).toBe('access_token2');

    const cookieRecord: Record<string, string> = Object.fromEntries(
      split.map((c) => [c.name, c.value])
    );
    const joined = getJoinedSplitCookieValue('access_token', cookieRecord);
    expect(joined).toBe(original);
  });

  it('returns undefined if the base cookie is missing', () => {
    const cookies: Record<string, string> = {
      access_token1: 'chunk',
    };
    expect(getJoinedSplitCookieValue('access_token', cookies)).toBeUndefined();
  });

  it('throws when maxCookieLength is not a positive integer', () => {
    expect(() => getSplitCookies('access_token', 'value', 0)).toThrow(
      'maxCookieLength must be a positive integer'
    );
    expect(() => getSplitCookies('access_token', 'value', -1)).toThrow(
      'maxCookieLength must be a positive integer'
    );
    expect(() => getSplitCookies('access_token', 'value', 1.5)).toThrow(
      'maxCookieLength must be a positive integer'
    );
  });

  it('lists all cookie chunks to delete via startsWith', () => {
    const names = [
      'access_token',
      'access_token1',
      'access_token2',
      'id_token',
      'access_token_payload',
    ];
    expect(getSplitCookieNamesToDelete('access_token', names)).toEqual([
      'access_token',
      'access_token1',
      'access_token2',
      'access_token_payload',
    ]);
  });
});
