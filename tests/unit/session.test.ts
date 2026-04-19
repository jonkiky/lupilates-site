import { describe, expect, it } from 'vitest';
import { createSessionValue, verifySessionValue } from '@/lib/auth/session';

describe('session', () => {
  it('creates and verifies a valid session value', () => {
    const value = createSessionValue('admin');
    const session = verifySessionValue(value);
    expect(session).not.toBeNull();
    expect(session?.username).toBe('admin');
  });

  it('rejects a tampered session value', () => {
    const value = createSessionValue('admin');
    const tampered = value.slice(0, -3) + 'xyz';
    expect(verifySessionValue(tampered)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(verifySessionValue(undefined)).toBeNull();
  });
});
