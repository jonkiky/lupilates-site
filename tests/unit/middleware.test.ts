import { describe, expect, it, vi, beforeEach } from 'vitest';
import { middleware } from '@/middleware';
import { verifySessionValueEdge } from '@/lib/auth/session-edge';
import { verifyUserSessionValueEdge } from '@/lib/auth/user-session-edge';

const mockRedirect = vi.fn((url: URL) => ({ type: 'redirect', url: url.toString() }));
const mockNext = vi.fn(() => ({ type: 'next' }));

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => mockRedirect(url),
    next: () => mockNext(),
  },
}));

vi.mock('@/lib/auth/session-edge', () => ({
  verifySessionValueEdge: vi.fn(),
}));

vi.mock('@/lib/auth/user-session-edge', () => ({
  verifyUserSessionValueEdge: vi.fn(),
}));

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifySessionValueEdge).mockResolvedValue(null);
    vi.mocked(verifyUserSessionValueEdge).mockResolvedValue(null);
  });

  it('does not redirect /admin/login to itself when unauthenticated', async () => {
    const request = {
      nextUrl: { pathname: '/admin/login' },
      cookies: { get: vi.fn().mockReturnValue(undefined) },
      url: 'http://localhost:3000/admin/login',
    };

    const result = await middleware(request as never);

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toEqual({ type: 'next' });
  });
});
