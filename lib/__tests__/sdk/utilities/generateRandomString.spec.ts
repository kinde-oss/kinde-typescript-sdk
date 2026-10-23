import { generateRandomString } from '../../../sdk/utilities';
import { describe, it, expect } from 'vitest';

describe('generateRandomString', () => {
  it('returns a string of the requested length for even lengths', () => {
    const result = generateRandomString(50);
    expect(result.length).toBe(50);
  });

  it('returns floor(length/2) hex pairs for odd lengths (@kinde/js-utils behavior)', () => {
    expect(generateRandomString(25).length).toBe(24);
    expect(generateRandomString(47).length).toBe(46);
  });
});
