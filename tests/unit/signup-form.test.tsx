import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignupForm } from '@/components/auth/signup-form';
import { signupAction } from '@/app/actions/user-auth';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/app/actions/user-auth', () => ({
  signupAction: vi.fn(),
}));

describe('SignupForm', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a WeChat input field', () => {
    render(<SignupForm />);

    expect(screen.getByLabelText(/wechat/i)).toBeInTheDocument();
  });

  it('submits the optional WeChat value with the rest of the form', async () => {
    vi.mocked(signupAction).mockResolvedValue({
      success: true,
    });

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/username/i), 'valid-user');
    await user.type(screen.getByLabelText(/phone/i), '1234567890');
    await user.type(screen.getByLabelText(/wechat/i), 'wechat-id');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(signupAction).toHaveBeenCalledWith({
      email: 'user@example.com',
      username: 'valid-user',
      phone: '1234567890',
      wechat: 'wechat-id',
      password: 'password123',
      confirmPassword: 'password123',
    });
  });

  it('shows detailed field validation messages returned by the server action', async () => {
    vi.mocked(signupAction).mockResolvedValue({
      success: false,
      error: 'Please correct the highlighted fields.',
      fieldErrors: {
        email: ['Invalid email address'],
        username: ['Username must be at least 2 characters'],
        wechat: ['WeChat must be at least 2 characters'],
        confirmPassword: ['Passwords do not match'],
      },
    });

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/username/i), 'valid-user');
    await user.type(screen.getByLabelText(/wechat/i), 'x');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password456');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText('Please correct the highlighted fields.')).toBeInTheDocument();
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    expect(screen.getByText('Username must be at least 2 characters')).toBeInTheDocument();
    expect(screen.getByText('WeChat must be at least 2 characters')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });
});
