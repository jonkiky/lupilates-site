import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cookies } from 'next/headers';
import { comparePassword, hashPassword } from '@/lib/auth/password';
import { getUserById, updateUser } from '@/lib/repositories/users';
import { verifyUserSessionValue } from '@/lib/auth/user-session';
import { updateUserProfileAction } from '@/app/actions/user-auth';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/auth/password', () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock('@/lib/repositories/users', () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock('@/lib/auth/user-session', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/user-session')>('@/lib/auth/user-session');
  return {
    ...actual,
    verifyUserSessionValue: vi.fn(),
  };
});

describe('updateUserProfileAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates phone and WeChat after verifying the current password', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-session' }),
    } as never);
    vi.mocked(verifyUserSessionValue).mockReturnValue({ userId: 'user-123', expiresAt: Date.now() + 1000 });
    vi.mocked(getUserById).mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      username: 'johnny',
      phone: '1234567890',
      wechat: 'wechat-id',
      passwordHash: 'stored-hash',
      createdAt: new Date('2026-04-20T00:00:00.000Z'),
      updatedAt: new Date('2026-04-20T00:00:00.000Z'),
    });
    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(updateUser).mockResolvedValue({ id: 'user-123' } as never);

    const result = await updateUserProfileAction({
      currentPassword: 'current-password',
      newPassword: '',
      phone: '0987654321',
      wechat: 'new-wechat',
    });

    expect(result).toEqual({ success: true });
    expect(updateUser).toHaveBeenCalledWith('user-123', {
      phone: '0987654321',
      wechat: 'new-wechat',
    });
  });

  it('returns a currentPassword field error when the password is wrong', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-session' }),
    } as never);
    vi.mocked(verifyUserSessionValue).mockReturnValue({ userId: 'user-123', expiresAt: Date.now() + 1000 });
    vi.mocked(getUserById).mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      username: 'johnny',
      phone: '1234567890',
      wechat: 'wechat-id',
      passwordHash: 'stored-hash',
      createdAt: new Date('2026-04-20T00:00:00.000Z'),
      updatedAt: new Date('2026-04-20T00:00:00.000Z'),
    });
    vi.mocked(comparePassword).mockResolvedValue(false);

    const result = await updateUserProfileAction({
      currentPassword: 'wrong-password',
      newPassword: '',
      phone: '0987654321',
      wechat: 'new-wechat',
    });

    expect(result).toEqual({
      success: false,
      error: 'Please correct the highlighted fields.',
      fieldErrors: {
        currentPassword: ['Incorrect password'],
      },
    });
  });

  it('hashes and stores a new password when supplied', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-session' }),
    } as never);
    vi.mocked(verifyUserSessionValue).mockReturnValue({ userId: 'user-123', expiresAt: Date.now() + 1000 });
    vi.mocked(getUserById).mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      username: 'johnny',
      phone: '1234567890',
      wechat: 'wechat-id',
      passwordHash: 'stored-hash',
      createdAt: new Date('2026-04-20T00:00:00.000Z'),
      updatedAt: new Date('2026-04-20T00:00:00.000Z'),
    });
    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(hashPassword).mockResolvedValue('new-hash');
    vi.mocked(updateUser).mockResolvedValue({ id: 'user-123' } as never);

    await updateUserProfileAction({
      currentPassword: 'current-password',
      newPassword: 'new-password-123',
      phone: '',
      wechat: '',
    });

    expect(hashPassword).toHaveBeenCalledWith('new-password-123');
    expect(updateUser).toHaveBeenCalledWith('user-123', {
      phone: null,
      wechat: null,
      passwordHash: 'new-hash',
    });
  });
});