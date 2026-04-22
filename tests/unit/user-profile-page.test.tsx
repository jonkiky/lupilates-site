import { describe, expect, it, vi, beforeEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import UserProfilePage from '@/app/user/profile/page';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyUserSessionValue } from '@/lib/auth/user-session';
import { getUserById, getUserQuotes } from '@/lib/repositories/users';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('@/lib/auth/user-session', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/user-session')>('@/lib/auth/user-session');
  return {
    ...actual,
    verifyUserSessionValue: vi.fn(),
  };
});

vi.mock('@/lib/repositories/users', () => ({
  getUserById: vi.fn(),
  getUserQuotes: vi.fn(),
}));

vi.mock('@/components/header/auth-nav', () => ({
  AuthNav: ({ user }: { user: unknown }) => <div data-testid="auth-nav">Auth Nav - {user ? 'user' : 'guest'}</div>,
}));

vi.mock('@/components/auth/profile-form', () => ({
  ProfileForm: () => <div data-testid="profile-form">Profile form</div>,
}));

describe('UserProfilePage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-session' }),
    } as never);

    vi.mocked(verifyUserSessionValue).mockReturnValue({
      userId: 'user-123',
      expiresAt: Date.now() + 1000,
    });

    vi.mocked(getUserById).mockResolvedValue({
      id: 'user-123',
      email: 'john@example.com',
      username: 'johnny',
      phone: null,
      wechat: null,
      passwordHash: 'hash',
      createdAt: new Date('2026-04-20T00:00:00.000Z'),
      updatedAt: new Date('2026-04-20T00:00:00.000Z'),
    } as never);

    vi.mocked(getUserQuotes).mockResolvedValue([
      {
        id: 'quote-1',
        quoteNumber: 'Q-1001',
        status: 'NEW',
        createdAt: new Date('2026-04-20T00:00:00.000Z'),
        items: [{ id: 'item-1' }],
      },
    ] as never);
  });

  it('shows the quotes tab by default', async () => {
    const component = await UserProfilePage({ searchParams: Promise.resolve({}) } as never);
    render(component);

    expect(screen.getByRole('heading', { name: /my quotes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /quote #q-1001/i })).toHaveAttribute('href', '/user/quotes/quote-1');
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/user/profile?tab=profile');
  });

  it('shows the profile editing tab when tab=profile', async () => {
    const component = await UserProfilePage({
      searchParams: Promise.resolve({ tab: 'profile' }),
    } as never);
    render(component);

    expect(screen.getByRole('heading', { name: /^profile$/i })).toBeInTheDocument();
    expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /my quotes/i })).not.toBeInTheDocument();
  });

  it('redirects unauthenticated visitors to login', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);
    vi.mocked(verifyUserSessionValue).mockReturnValue(null);

    await expect(UserProfilePage({ searchParams: Promise.resolve({}) } as never)).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });
});
