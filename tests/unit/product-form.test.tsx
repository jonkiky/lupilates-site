import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProductForm } from '@/components/admin/product-form';

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

vi.mock('@/app/actions/products', () => ({
  saveProduct: vi.fn(),
  cloneProduct: vi.fn(),
  hideProduct: vi.fn(),
}));

describe('ProductForm', () => {
  it('auto generates slug from name on new product page; SKU stays random', () => {
    const { container } = render(<ProductForm />);

    const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
    const skuInput = container.querySelector('input[name="sku"]') as HTMLInputElement;
    const slugInput = container.querySelector('input[name="slug"]') as HTMLInputElement;

    // Capture initial random SKU
    const initialSku = skuInput.value;
    expect(initialSku).toMatch(/^\d{6}$/); // 6-digit number

    fireEvent.change(nameInput, { target: { value: 'Desk Lamp Pro' } });

    expect(slugInput.value).toBe('desk-lamp-pro');
    expect(skuInput.value).toBe(initialSku); // SKU does not change
  });
});
