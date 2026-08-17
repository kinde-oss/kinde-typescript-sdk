import {
  getJoinedSplitCookieValue,
  getMaxCookieLength,
  getSplitCookieNamesToDelete,
  getSplitCookies,
} from '../../../sdk/utilities';
import { storageSettings } from '@kinde/js-utils';
import { describe, it, expect } from 'vitest';

describe('split-cookies utilities', () => {
  it('reads max cookie length via accessor from storageSettings', () => {
    const originalMaxLength = storageSettings.maxLength;
    storageSettings.maxLength = 7;

    try {
      expect(getMaxCookieLength()).toBe(7);
    } finally {
      storageSettings.maxLength = originalMaxLength;
    }
  });

  it('reads default max cookie length from storageSettings', () => {
    const originalMaxLength = storageSettings.maxLength;
    storageSettings.maxLength = 4;

    try {
      const split = getSplitCookies('access_token', 'abcdefghij');
      expect(split).toEqual([
        { name: 'access_token', value: 'abcd' },
        { name: 'access_token1', value: 'efgh' },
        { name: 'access_token2', value: 'ij' },
      ]);
    } finally {
      storageSettings.maxLength = originalMaxLength;
    }
  });

  it('splits a long value into multiple cookies and rejoins it', () => {
    const maxCookieLength = getMaxCookieLength();
    const original = 'a'.repeat(maxCookieLength * 2 + 123);
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
