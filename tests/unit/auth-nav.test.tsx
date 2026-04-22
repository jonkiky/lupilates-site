import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AuthNav } from '@/components/header/auth-nav';

vi.mock('@/app/actions/user-auth', () => ({
  logoutAction: vi.fn(),
}));

vi.mock('@/components/header/cart-icon', () => ({
  CartIcon: () => <a href="/quote-cart" aria-label="View cart">Cart</a>,
}));

describe('AuthNav', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Authenticated state', () => {
    it('renders the username as a profile link', () => {
      const user = { userId: 'user-123', email: 'john@example.com', username: 'johnny' };
      render(<AuthNav user={user} />);

      const profileLink = screen.getByRole('link', { name: 'johnny' });
      expect(profileLink).toHaveAttribute('href', '/user/profile');
    });

    it('renders logout button inside a form with action attribute', () => {
      const user = { userId: 'user-123', email: 'john@example.com', username: 'johnny' };
      const { container } = render(<AuthNav user={user} />);
      
      const buttons = container.querySelectorAll('button');
      const logoutButton = Array.from(buttons).find(btn => btn.textContent?.includes('Log out'));
      
      expect(logoutButton).toBeDefined();
      const form = logoutButton?.closest('form');
      expect(form).not.toBeNull();
      expect(form).toHaveAttribute('action');
    });

    it('does not render login/signup links when authenticated', () => {
      const user = { userId: 'user-123', email: 'john@example.com', username: 'johnny' };
      render(<AuthNav user={user} />);
      
      expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated state', () => {
    it('renders login and signup links with correct hrefs', () => {
      render(<AuthNav user={null} />);
      
      const loginLink = screen.getByRole('link', { name: /log in/i });
      const signupLink = screen.getByRole('link', { name: /sign up/i });
      
      expect(loginLink).toHaveAttribute('href', '/auth/login');
      expect(signupLink).toHaveAttribute('href', '/auth/signup');
    });

    it('does not render email or logout button when unauthenticated', () => {
      const { container } = render(<AuthNav user={null} />);
      
      const buttons = container.querySelectorAll('button');
      const logoutButton = Array.from(buttons).find(btn => btn.textContent?.includes('Log out'));
      expect(logoutButton).toBeUndefined();
      
      expect(screen.queryByRole('link', { name: /johnny/i })).not.toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('renders branding as a link to home page', () => {
      render(<AuthNav user={null} />);
      const brandingLink = screen.getByRole('link', { name: 'B2B Quote Cart' });
      expect(brandingLink).toHaveAttribute('href', '/');
    });

    it('has flex layout with items-center justify-between classes', () => {
      const { container } = render(<AuthNav user={null} />);
      const wrapper = container.firstChild;
      
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('renders a cart icon link to /quote-cart as the last item in the nav', () => {
      const { container } = render(<AuthNav user={null} />);
      const cartLink = screen.getByRole('link', { name: /view cart/i });
      expect(cartLink).toHaveAttribute('href', '/quote-cart');

      // cart icon must be the last child of the right-side nav group
      const navGroup = container.querySelector('.flex.items-center.gap-3');
      expect(navGroup?.lastElementChild).toBe(cartLink.closest('a'));

      const { rerender } = render(<AuthNav user={{ userId: 'u1', email: 'a@b.com', username: 'alice' }} />);
      expect(screen.getAllByRole('link', { name: /view cart/i })[1]).toHaveAttribute('href', '/quote-cart');
    });
  });
});
