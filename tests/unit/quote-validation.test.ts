import { describe, expect, it } from 'vitest';
import { loginSchema } from '@/lib/auth/credentials';
import { quoteRequestSchema } from '@/lib/validations/quote';

describe('quoteRequestSchema', () => {
  it('rejects an empty cart', () => {
    const result = quoteRequestSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it('accepts empty contact fields when cart has items', () => {
    const result = quoteRequestSchema.safeParse({
      customerName: '',
      companyName: '',
      email: '',
      phone: '',
      region: '',
      items: [{ productId: 'p1', quantity: 1, itemNotes: '' }],
    });
    expect(result.success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('requires username and password', () => {
    const result = loginSchema.safeParse({ username: '', password: '' });
    expect(result.success).toBe(false);
  });
});
