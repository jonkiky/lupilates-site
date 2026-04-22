import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

// Mock the product repository
vi.mock('@/lib/repositories/products', () => ({
  listPublishedProducts: vi.fn().mockResolvedValue([
    {
      id: '1',
      name: 'Test Product',
      slug: 'test-product',
      sku: 'TEST-001',
      description: 'A test product',
      availabilityText: 'In Stock',
      specsJson: {},
      images: [],
      categoryId: '1',
      category: { id: '1', name: 'Test Category', slug: 'test' },
    },
  ]),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

// Mock auth utilities
vi.mock('@/lib/auth/user-session', () => ({
  verifyUserSessionValue: vi.fn().mockReturnValue(null),
  USER_SESSION_COOKIE_NAME: 'session',
}));

// Mock user repository
vi.mock('@/lib/repositories/users', () => ({
  getUserById: vi.fn().mockResolvedValue(null),
}));

// Mock AuthNav component
vi.mock('@/components/header/auth-nav', () => ({
  AuthNav: ({ user }: { user: unknown }) => (
    <div data-testid="auth-nav">Auth Nav - User: {user ? 'authenticated' : 'anonymous'}</div>
  ),
}));

describe('HomePage', () => {
  it('renders the catalog entry point', async () => {
    const component = await HomePage();
    render(component);
    expect(screen.getByRole('heading', { name: /request a quote/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /browse products/i })).toBeInTheDocument();
    expect(screen.getByTestId('auth-nav')).toBeInTheDocument();
  });
});
