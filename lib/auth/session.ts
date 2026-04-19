import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE_NAME = 'admin_session';

function sign(value: string) {
  return createHmac('sha256', process.env.SESSION_SECRET ?? 'dev-secret').update(value).digest('hex');
}

export function createSessionValue(username: string) {
  const payload = JSON.stringify({ username, expiresAt: Date.now() + 1000 * 60 * 60 * 8 });
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionValue(value: string | undefined) {
  if (!value) return null;
  const [encoded, signature] = value.split('.');
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { username: string; expiresAt: number };
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
