'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { hashPassword, comparePassword } from '@/lib/auth/password';
import { createUserSessionValue, USER_SESSION_COOKIE_NAME, verifyUserSessionValue } from '@/lib/auth/user-session';
import { signupSchema, loginSchema, profileUpdateSchema } from '@/lib/validations/user';
import { createUser, getUserByEmail, getUserById, updateUser } from '@/lib/repositories/users';

type SignupFieldErrors = Partial<Record<'email' | 'username' | 'phone' | 'wechat' | 'password' | 'confirmPassword', string[]>>;
type ProfileFieldErrors = Partial<Record<'currentPassword' | 'newPassword' | 'phone' | 'wechat', string[]>>;

export async function signupAction(input: unknown) {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please correct the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors as SignupFieldErrors,
    };
  }

  const { email, username, phone, wechat, password } = parsed.data;

  // Check if email already exists
  const existing = await getUserByEmail(email);
  if (existing) {
    return {
      success: false,
      error: 'An account with this email already exists.',
      fieldErrors: {
        email: ['An account with this email already exists.'],
      } satisfies SignupFieldErrors,
    };
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      username,
      phone: phone || null,
      wechat: wechat || null,
      passwordHash,
    });

    // Create session and redirect
    const sessionCookie = await cookies();
    const sessionValue = createUserSessionValue(user.id);
    sessionCookie.set(USER_SESSION_COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { success: true };
  } catch (err) {
    console.error('Signup error:', err);
    return { success: false, error: 'Failed to create account. Please try again.', fieldErrors: {} as SignupFieldErrors };
  }
}

export async function loginAction(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed' };
  }

  const { email, password } = parsed.data;

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Create session
    const sessionCookie = await cookies();
    const sessionValue = createUserSessionValue(user.id);
    sessionCookie.set(USER_SESSION_COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { success: true };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: 'Failed to log in' };
  }
}

export async function logoutAction() {
  const sessionCookie = await cookies();
  sessionCookie.delete(USER_SESSION_COOKIE_NAME);
  redirect('/');
}

export async function updateUserProfileAction(input: unknown) {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please correct the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors as ProfileFieldErrors,
    };
  }

  const { currentPassword, newPassword, phone, wechat } = parsed.data;

  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  const session = verifyUserSessionValue(sessionValue);

  if (!session) {
    return {
      success: false,
      error: 'Please sign in again.',
      fieldErrors: {} as ProfileFieldErrors,
    };
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return {
      success: false,
      error: 'Please sign in again.',
      fieldErrors: {} as ProfileFieldErrors,
    };
  }

  const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    return {
      success: false,
      error: 'Please correct the highlighted fields.',
      fieldErrors: {
        currentPassword: ['Incorrect password'],
      } satisfies ProfileFieldErrors,
    };
  }

  try {
    const passwordHash = newPassword ? await hashPassword(newPassword) : undefined;

    await updateUser(user.id, {
      phone: phone || null,
      wechat: wechat || null,
      ...(passwordHash ? { passwordHash } : {}),
    });

    return { success: true };
  } catch (err) {
    console.error('Profile update error:', err);
    return {
      success: false,
      error: 'Failed to update profile. Please try again.',
      fieldErrors: {} as ProfileFieldErrors,
    };
  }
}
