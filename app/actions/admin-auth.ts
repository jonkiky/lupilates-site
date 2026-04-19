'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { credentialsMatch } from '@/lib/auth/credentials';
import { createSessionValue, SESSION_COOKIE_NAME } from '@/lib/auth/session';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function loginAdmin(input: unknown) {
  const parsed = loginSchema.parse(input);
  if (!credentialsMatch(parsed.username, parsed.password)) {
    return { success: false, message: 'Invalid credentials' };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionValue(parsed.username), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return { success: true };
}
