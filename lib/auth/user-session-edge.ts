type UserSessionPayload = { userId: string; expiresAt: number };

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  if (typeof atob === 'function') {
    return decodeURIComponent(
      Array.from(atob(padded))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
  }

  return Buffer.from(padded, 'base64').toString('utf8');
}

async function signEdge(value: string): Promise<string> {
  const secret = process.env.SESSION_SECRET ?? 'dev-secret';
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return toHex(signature);
}

export async function verifyUserSessionValueEdge(value: string | undefined): Promise<UserSessionPayload | null> {
  if (!value) return null;

  const [encoded, signature] = value.split('.');
  if (!encoded || !signature) return null;

  const expected = await signEdge(encoded);
  if (!constantTimeEquals(signature, expected)) return null;

  try {
    const parsed = JSON.parse(decodeBase64Url(encoded)) as UserSessionPayload;
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}