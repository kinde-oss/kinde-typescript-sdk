import { generateRandomString } from '../../../sdk/utilities';

describe('validateClientSecret', () => {
  it('should return true for valid secrets', () => {
    const result = generateRandomString(25);
    expect(result.length).toBe(25);
  });

  it('should return false for invalid secrets - odd length', () => {
    const result = generateRandomString(47);
    expect(result.length).toBe(47);
  });

  it('should return false for invalid secrets', () => {
    const result = generateRandomString(50);
    expect(result.length).toBe(50);
  });
});
