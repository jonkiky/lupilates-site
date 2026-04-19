import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    quoteRequest: {
      findMany: vi.fn().mockResolvedValue([{ quoteNumber: 'Q-1001', status: 'NEW', items: [] }]),
      findUnique: vi.fn().mockResolvedValue({ id: 'qr1', quoteNumber: 'Q-1001', status: 'NEW', items: [] }),
      update: vi.fn().mockResolvedValue({ id: 'qr1', status: 'REVIEWING' }),
    },
  },
}));

describe('quotes repository', () => {
  it('listQuotes returns quote requests in newest-first order', async () => {
    const { listQuotes } = await import('@/lib/repositories/quotes');
    const results = await listQuotes();
    expect(results[0].quoteNumber).toBe('Q-1001');
  });

  it('getQuoteById returns a single quote', async () => {
    const { getQuoteById } = await import('@/lib/repositories/quotes');
    const result = await getQuoteById('qr1');
    expect(result?.quoteNumber).toBe('Q-1001');
  });

  it('updateQuoteStatus updates status and notes', async () => {
    const { updateQuoteStatus } = await import('@/lib/repositories/quotes');
    const result = await updateQuoteStatus('qr1', 'REVIEWING', 'Follow up tomorrow');
    expect(result.status).toBe('REVIEWING');
  });
});
