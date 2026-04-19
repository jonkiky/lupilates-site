import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export function credentialsMatch(inputUsername: string, inputPassword: string) {
  const expectedUsername = Buffer.from(process.env.ADMIN_USERNAME ?? '');
  const expectedPassword = Buffer.from(process.env.ADMIN_PASSWORD ?? '');
  const actualUsername = Buffer.from(inputUsername);
  const actualPassword = Buffer.from(inputPassword);

  return expectedUsername.length === actualUsername.length &&
    expectedPassword.length === actualPassword.length &&
    timingSafeEqual(expectedUsername, actualUsername) &&
    timingSafeEqual(expectedPassword, actualPassword);
}
