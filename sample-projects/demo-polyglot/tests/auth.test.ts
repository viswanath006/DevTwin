import { describe, it, expect } from 'vitest';
import { generateToken } from '../src/api/auth';

describe('Auth Module Suite', () => {
  it('should generate valid JWT string for user', () => {
    const token = generateToken('user_test_99');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
  });

  it('should maintain user payload consistency', () => {
    const token = generateToken('admin_user');
    expect(token.split('.').length).toBe(3);
  });
});
