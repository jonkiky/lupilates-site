import { describe, expect, it } from 'vitest';
import { createUserSessionValue } from '@/lib/auth/user-session';
import { verifyUserSessionValueEdge } from '@/lib/auth/user-session-edge';

describe('user-session-edge', () => {
  it('verifies a valid user session value', async () => {
    const value = createUserSessionValue('user-123');
    const session = await verifyUserSessionValueEdge(value);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe('user-123');
  });

  it('rejects a tampered user session value', async () => {
    const value = createUserSessionValue('user-123');
    const tampered = value.slice(0, -3) + 'xyz';
    await expect(verifyUserSessionValueEdge(tampered)).resolves.toBeNull();
  });
});
