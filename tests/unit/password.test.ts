import { describe, expect, it } from 'vitest';
import { hashPassword, comparePassword } from '@/lib/auth/password';

describe('Password', () => {
  it('hashes a password', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
  });

  it('compares a password with its hash', async () => {
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
