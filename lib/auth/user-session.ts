import { createHmac, timingSafeEqual } from 'crypto';

const USER_SESSION_COOKIE_NAME = 'user_session';

function sign(value: string) {
  return createHmac('sha256', process.env.SESSION_SECRET ?? 'dev-secret').update(value).digest('hex');
}

export function createUserSessionValue(userId: string) {
  const payload = JSON.stringify({ userId, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 }); // 7 days
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyUserSessionValue(value: string | undefined) {
  if (!value) return null;
  const [encoded, signature] = value.split('.');
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { userId: string; expiresAt: number };
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export { USER_SESSION_COOKIE_NAME };
