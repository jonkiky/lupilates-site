import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AuthNav } from '@/components/header/auth-nav';

vi.mock('@/app/actions/user-auth', () => ({
  logoutAction: vi.fn(),
}));

describe('AuthNav', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Authenticated state', () => {
    it('renders user email', () => {
      const user = { userId: 'user-123', email: 'john@example.com' };
      render(<AuthNav user={user} />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('renders logout button inside a form with action attribute', () => {
      const user = { userId: 'user-123', email: 'john@example.com' };
      const { container } = render(<AuthNav user={user} />);
      
      const buttons = container.querySelectorAll('button');
      const logoutButton = Array.from(buttons).find(btn => btn.textContent?.includes('Log out'));
      
      expect(logoutButton).toBeDefined();
      const form = logoutButton?.closest('form');
      expect(form).not.toBeNull();
      expect(form).toHaveAttribute('action');
    });

    it('does not render login/signup links when authenticated', () => {
      const user = { userId: 'user-123', email: 'john@example.com' };
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
      
      const spans = container.querySelectorAll('span');
      const hasEmail = Array.from(spans).some(span => span.textContent?.includes('@'));
      expect(hasEmail).toBe(false);
    });
  });

  describe('Layout', () => {
    it('renders branding text "B2B Quote Cart"', () => {
      render(<AuthNav user={null} />);
      const elements = screen.getAllByText('B2B Quote Cart');
      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0]).toBeInTheDocument();
    });

    it('has flex layout with items-center justify-between classes', () => {
      const { container } = render(<AuthNav user={null} />);
      const wrapper = container.firstChild;
      
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-between');
    });
  });
});
