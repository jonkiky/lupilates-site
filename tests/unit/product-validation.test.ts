import { describe, expect, it } from 'vitest';
import { productSchema } from '@/lib/validations/product';

describe('productSchema', () => {
  it('accepts a valid product', () => {
    const result = productSchema.safeParse({
      sku: 'PRINT-001',
      name: 'Bracket',
      slug: 'bracket',
      description: 'A bracket',
      categoryId: 'c1',
      specsJson: { material: 'Nylon' },
      imageUrls: ['https://example.com/img.jpg'],
      availabilityText: 'Available',
      visibilityStatus: 'PUBLISHED',
      isFeatured: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid visibility status', () => {
    const result = productSchema.safeParse({
      sku: 'PRINT-001',
      name: 'Bracket',
      slug: 'bracket',
      description: 'A bracket',
      categoryId: 'c1',
      specsJson: {},
      imageUrls: [],
      availabilityText: 'Available',
      visibilityStatus: 'INVALID',
      isFeatured: false,
    });
    expect(result.success).toBe(false);
  });
});
