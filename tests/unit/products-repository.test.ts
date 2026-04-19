import { describe, expect, it, vi } from 'vitest';
import { listPublishedProducts } from '@/lib/repositories/products';

vi.mock('@/lib/db', () => ({
  db: {
    product: { findMany: vi.fn().mockResolvedValue([{ id: 'p1', name: 'Precision Nylon Bracket', slug: 'precision-nylon-bracket', sku: 'PRINT-001', category: { name: 'Industrial Parts' } }]) },
  },
}));

describe('listPublishedProducts', () => {
  it('returns published products only', async () => {
    const products = await listPublishedProducts({ search: '', category: '' });
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Precision Nylon Bracket');
  });
});
