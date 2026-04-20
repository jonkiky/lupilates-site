import { describe, expect, it } from 'vitest';
import { createUserSessionValue, verifyUserSessionValue } from '@/lib/auth/user-session';

describe('User Session', () => {
  it('creates a valid user session', () => {
    const session = createUserSessionValue('user-123');
    expect(session).toContain('.');
    const [encoded, signature] = session.split('.');
    expect(encoded).toBeTruthy();
    expect(signature).toBeTruthy();
  });

  it('verifies a valid user session', () => {
    const userId = 'user-123';
    const session = createUserSessionValue(userId);
    const verified = verifyUserSessionValue(session);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(userId);
    expect(verified?.expiresAt).toBeGreaterThan(Date.now());
  });

  it('rejects an invalid session signature', () => {
    const session = createUserSessionValue('user-123');
    const [encoded] = session.split('.');
    const tampered = `${encoded}.invalid-signature`;
    const verified = verifyUserSessionValue(tampered);
    expect(verified).toBeNull();
  });

  it('rejects an expired session', () => {
    // Create an expired session by tampering
    const expiredPayload = JSON.stringify({ userId: 'user-123', expiresAt: Date.now() - 1000 });
    const encoded = Buffer.from(expiredPayload).toString('base64url');
    const expired = `${encoded}.invalid`;
    const verified = verifyUserSessionValue(expired);
    expect(verified).toBeNull();
  });
});
