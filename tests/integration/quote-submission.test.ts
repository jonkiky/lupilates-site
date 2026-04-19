import { describe, expect, it, vi } from 'vitest';
import { submitQuoteRequest } from '@/app/actions/quotes';

vi.mock('@/lib/repositories/quotes', () => ({
  createQuoteRequest: vi.fn().mockResolvedValue({ quoteNumber: 'Q-1001', items: [] }),
}));

describe('submitQuoteRequest', () => {
  it('returns a quote number when the payload is valid', async () => {
    const result = await submitQuoteRequest({
      customerName: 'Ada',
      companyName: 'Acme',
      email: 'ada@example.com',
      phone: '123',
      region: 'US',
      projectNotes: '',
      items: [{ productId: 'p1', quantity: 2, itemNotes: '' }],
    });
    expect(result.quoteNumber).toBe('Q-1001');
  });

  it('throws ZodError when payload is invalid', async () => {
    await expect(submitQuoteRequest({ items: [] })).rejects.toThrow();
  });
});
