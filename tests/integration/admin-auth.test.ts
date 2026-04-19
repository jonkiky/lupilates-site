import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/credentials', () => ({
  credentialsMatch: vi.fn().mockReturnValue(true),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
}));

describe('loginAdmin', () => {
  it('returns success when predefined credentials match', async () => {
    const { loginAdmin } = await import('@/app/actions/admin-auth');
    const result = await loginAdmin({ username: 'admin', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('returns failure when credentials do not match', async () => {
    const { credentialsMatch } = await import('@/lib/auth/credentials');
    (credentialsMatch as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);
    const { loginAdmin } = await import('@/app/actions/admin-auth');
    const result = await loginAdmin({ username: 'admin', password: 'wrong' });
    expect(result.success).toBe(false);
  });
});
