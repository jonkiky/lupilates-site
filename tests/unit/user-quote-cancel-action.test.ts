import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { verifyUserSessionValue } from '@/lib/auth/user-session';
import { cancelUserQuoteById } from '@/lib/repositories/users';
import { cancelUserQuoteAction } from '@/app/actions/quotes';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/user-session', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/user-session')>('@/lib/auth/user-session');
  return {
    ...actual,
    verifyUserSessionValue: vi.fn(),
  };
});

vi.mock('@/lib/repositories/users', () => ({
  cancelUserQuoteById: vi.fn(),
}));

describe('cancelUserQuoteAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels a user quote when session is valid', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-session' }),
    } as never);
    vi.mocked(verifyUserSessionValue).mockReturnValue({ userId: 'user-123', expiresAt: Date.now() + 1000 });
    vi.mocked(cancelUserQuoteById).mockResolvedValue(true);

    const result = await cancelUserQuoteAction({ id: 'quote-123' });

    expect(result).toEqual({ success: true });
    expect(cancelUserQuoteById).toHaveBeenCalledWith('quote-123', 'user-123');
    expect(revalidatePath).toHaveBeenCalledWith('/user/quotes/quote-123');
  });

  it('returns unauthorized when no active session exists', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);
    vi.mocked(verifyUserSessionValue).mockReturnValue(null);

    const result = await cancelUserQuoteAction({ id: 'quote-123' });

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(cancelUserQuoteById).not.toHaveBeenCalled();
  });
});
