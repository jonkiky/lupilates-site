import { createHmac, timingSafeEqual } from 'crypto';
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export function credentialsMatch(inputUsername: string, inputPassword: string) {
  const secret = process.env.SESSION_SECRET ?? 'dev-secret';
  const hmac = (value: string) =>
    createHmac('sha256', secret).update(value).digest();

  const expectedUsernameHash = hmac(process.env.ADMIN_USERNAME ?? '');
  const expectedPasswordHash = hmac(process.env.ADMIN_PASSWORD ?? '');
  const actualUsernameHash = hmac(inputUsername);
  const actualPasswordHash = hmac(inputPassword);

  const usernameMatch = timingSafeEqual(expectedUsernameHash, actualUsernameHash);
  const passwordMatch = timingSafeEqual(expectedPasswordHash, actualPasswordHash);

  return usernameMatch && passwordMatch;
}
