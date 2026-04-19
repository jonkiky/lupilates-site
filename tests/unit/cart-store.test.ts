import { describe, expect, it } from 'vitest';
import { addItem, createEmptyCart, removeItem, updateQuantity, updateNotes } from '@/lib/quote/cart-store';

describe('cart-store', () => {
  it('increments quantity when adding the same product twice', () => {
    const first = addItem(createEmptyCart(), { productId: 'p1', productName: 'Bracket', sku: 'PRINT-001' });
    const second = addItem(first, { productId: 'p1', productName: 'Bracket', sku: 'PRINT-001' });
    expect(second.items[0].quantity).toBe(2);
  });

  it('adds a new item when productId is different', () => {
    const cart = addItem(createEmptyCart(), { productId: 'p1', productName: 'Bracket', sku: 'A' });
    const result = addItem(cart, { productId: 'p2', productName: 'Pin', sku: 'B' });
    expect(result.items).toHaveLength(2);
  });

  it('removes an item', () => {
    const cart = addItem(createEmptyCart(), { productId: 'p1', productName: 'Bracket', sku: 'A' });
    const result = removeItem(cart, 'p1');
    expect(result.items).toHaveLength(0);
  });

  it('updates quantity', () => {
    const cart = addItem(createEmptyCart(), { productId: 'p1', productName: 'Bracket', sku: 'A' });
    const result = updateQuantity(cart, 'p1', 5);
    expect(result.items[0].quantity).toBe(5);
  });

  it('updates item notes', () => {
    const cart = addItem(createEmptyCart(), { productId: 'p1', productName: 'Bracket', sku: 'A' });
    const result = updateNotes(cart, 'p1', 'Special request');
    expect(result.items[0].itemNotes).toBe('Special request');
  });
});
