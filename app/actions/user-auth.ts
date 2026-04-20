'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { hashPassword, comparePassword } from '@/lib/auth/password';
import { createUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
import { signupSchema, loginSchema } from '@/lib/validations/user';
import { createUser, getUserByEmail } from '@/lib/repositories/users';

export async function signupAction(input: unknown) {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.flatten() };
  }

  const { email, username, phone, password } = parsed.data;

  // Check if email already exists
  const existing = await getUserByEmail(email);
  if (existing) {
    return { success: false, error: 'Email already registered' };
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      username,
      phone: phone || null,
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
    return { success: false, error: 'Failed to create account' };
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
