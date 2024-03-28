import { validateClientSecret } from '../../../sdk/utilities';

describe('validateClientSecret', () => {
  it('should return true for valid secrets', () => {
    const validSecret = 'HlibujiUbwbMXofgh12F7Abur5JM5FZCDZHJQenpwEO7UCsNnqzm';
    const result = validateClientSecret(validSecret);
    expect(result).toBe(true);
  });

  it('should return false for invalid secrets', () => {
    const invalidSecret = '123';
    const result = validateClientSecret(invalidSecret);
    expect(result).toBe(false);
  });
});
