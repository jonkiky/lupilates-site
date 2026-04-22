import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileForm } from '@/components/auth/profile-form';
import { updateUserProfileAction } from '@/app/actions/user-auth';

vi.mock('@/app/actions/user-auth', () => ({
  updateUserProfileAction: vi.fn(),
}));

describe('ProfileForm', () => {
  const user = {
    id: 'user-123',
    email: 'user@example.com',
    username: 'johnny',
    phone: '1234567890',
    wechat: 'wechat-id',
    passwordHash: 'hash',
    createdAt: new Date('2026-04-20T00:00:00.000Z'),
    updatedAt: new Date('2026-04-20T00:00:00.000Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the saved phone and WeChat values', () => {
    render(<ProfileForm user={user} />);

    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('wechat-id')).toBeInTheDocument();
  });

  it('submits current password, new password, phone, and WeChat updates', async () => {
    vi.mocked(updateUserProfileAction).mockResolvedValue({ success: true });

    const actor = userEvent.setup();
    render(<ProfileForm user={user} />);

    await actor.type(screen.getByLabelText(/current password/i), 'current-password');
    await actor.type(screen.getByLabelText(/new password/i), 'new-password-123');
    await actor.clear(screen.getByLabelText(/phone/i));
    await actor.type(screen.getByLabelText(/phone/i), '0987654321');
    await actor.clear(screen.getByLabelText(/wechat/i));
    await actor.type(screen.getByLabelText(/wechat/i), 'new-wechat');
    await actor.click(screen.getByRole('button', { name: /update profile/i }));

    expect(updateUserProfileAction).toHaveBeenCalledWith({
      currentPassword: 'current-password',
      newPassword: 'new-password-123',
      phone: '0987654321',
      wechat: 'new-wechat',
    });
  });

  it('renders field-level errors returned by the server action', async () => {
    vi.mocked(updateUserProfileAction).mockResolvedValue({
      success: false,
      fieldErrors: {
        currentPassword: ['Incorrect password'],
      },
    });

    const actor = userEvent.setup();
    render(<ProfileForm user={user} />);

    await actor.type(screen.getByLabelText(/current password/i), 'wrong-password');
    await actor.click(screen.getByRole('button', { name: /update profile/i }));

    expect(await screen.findByText('Incorrect password')).toBeInTheDocument();
  });
});