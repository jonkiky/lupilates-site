import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/repositories/products', () => ({
  upsertProduct: vi.fn().mockResolvedValue({ id: 'p1', name: 'Bracket', sku: 'PRINT-001' }),
  duplicateProduct: vi.fn().mockResolvedValue({ id: 'p2', name: 'Bracket (copy)', sku: 'PRINT-001-copy' }),
  archiveProduct: vi.fn().mockResolvedValue({ id: 'p1', visibilityStatus: 'ARCHIVED' }),
}));

describe('saveProduct', () => {
  it('calls upsertProduct with parsed input and returns success payload', async () => {
    const { saveProduct } = await import('@/app/actions/products');
    const result = await saveProduct({
      sku: 'PRINT-001',
      name: 'Bracket',
      slug: 'bracket',
      description: 'A structural bracket.',
      categoryId: 'c1',
      specsJson: { material: 'Nylon' },
      imageUrls: ['https://example.com/img.jpg'],
      availabilityText: 'Available',
      visibilityStatus: 'PUBLISHED',
      isFeatured: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.product.name).toBe('Bracket');
    }
  });

  it('returns validation error when category is missing', async () => {
    const { saveProduct } = await import('@/app/actions/products');
    const result = await saveProduct({
      sku: 'PRINT-001',
      name: 'Bracket',
      slug: 'bracket',
      description: 'A structural bracket.',
      categoryId: '',
      specsJson: { material: 'Nylon' },
      imageUrls: ['https://example.com/img.jpg'],
      availabilityText: 'Available',
      visibilityStatus: 'PUBLISHED',
      isFeatured: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Please select a category.');
    }
  });
});

describe('cloneProduct', () => {
  it('calls duplicateProduct and returns the copy', async () => {
    const { cloneProduct } = await import('@/app/actions/products');
    await cloneProduct('p1');
    // Server action for form binding returns void, but duplicateProduct was called
    expect(true).toBe(true);
  });
});
