import { describe, expect, it } from 'vitest';
import { hashPassword, comparePassword } from '@/lib/auth/password';

describe('Password', () => {
  it('returns password as-is without hashing', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);
    expect(hash).toBe(password);
  });

  it('compares a password with stored plain-text value', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);
    const matches = await comparePassword(password, hash);
    expect(matches).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);
    const matches = await comparePassword('wrong-password', hash);
    expect(matches).toBe(false);
  });
});
