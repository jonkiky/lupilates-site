import { describe, expect, it } from 'vitest';
import { createSessionValue } from '@/lib/auth/session';
import { verifySessionValueEdge } from '@/lib/auth/session-edge';

describe('session-edge', () => {
  it('verifies a valid session value', async () => {
    const value = createSessionValue('admin');
    const session = await verifySessionValueEdge(value);
    expect(session).not.toBeNull();
    expect(session?.username).toBe('admin');
  });

  it('rejects a tampered session value', async () => {
    const value = createSessionValue('admin');
    const tampered = value.slice(0, -3) + 'xyz';
    await expect(verifySessionValueEdge(tampered)).resolves.toBeNull();
  });
});