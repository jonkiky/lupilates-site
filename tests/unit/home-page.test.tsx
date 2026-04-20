import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

// Mock the product repository
vi.mock('@/lib/repositories/products', () => ({
  listPublishedProducts: vi.fn().mockResolvedValue([
    {
      id: '1',
      name: 'Test Product',
      slug: 'test-product',
      sku: 'TEST-001',
      description: 'A test product',
      availabilityText: 'In Stock',
      specsJson: {},
      imageUrls: [],
      categoryId: '1',
      category: { id: '1', name: 'Test Category', slug: 'test' },
    },
  ]),
}));

describe('HomePage', () => {
  it('renders the catalog entry point', async () => {
    const component = await HomePage();
    render(component);
    expect(screen.getByRole('heading', { name: /request a quote/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /browse products/i })).toBeInTheDocument();
  });
});
