'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadCart, removeItem, updateQuantity, updateNotes, saveCart, type QuoteCart } from '@/lib/quote/cart-store';

export function QuoteCartClient() {
  const [cart, setCart] = useState<QuoteCart>({ items: [] });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCart(loadCart());
    setMounted(true);
  }, []);

  function mutate(next: QuoteCart) {
    setCart(next);
    saveCart(next);
  }

  if (!mounted) return null;

  if (cart.items.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-4 text-center text-stone-400">
        <p className="text-lg">Your quote cart is empty.</p>
        <Link href="/products" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <ul className="flex flex-col gap-4">
        {cart.items.map((item) => (
          <li key={item.productId} className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <div className="flex-1">
                <p className="font-medium text-stone-900">{item.productName}</p>
                <p className="text-xs text-stone-500">{item.sku}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => mutate(updateQuantity(cart, item.productId, item.quantity - 1))}
                  className="h-8 w-8 rounded-full border border-stone-200 text-sm hover:bg-stone-100"
                >−</button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => mutate(updateQuantity(cart, item.productId, item.quantity + 1))}
                  className="h-8 w-8 rounded-full border border-stone-200 text-sm hover:bg-stone-100"
                >+</button>
                <button
                  onClick={() => mutate(removeItem(cart, item.productId))}
                  className="ml-2 text-xs text-red-500 hover:underline"
                >Remove</button>
              </div>
            </div>
            <textarea
              value={item.itemNotes}
              onChange={(e) => mutate(updateNotes(cart, item.productId, e.target.value))}
              placeholder="Add notes for this item…"
              className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
              rows={2}
            />
          </li>
        ))}
      </ul>
      <Link
        href="/quote-request"
        className="self-end rounded-full bg-stone-950 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700"
      >
        Request a quote →
      </Link>
    </div>
  );
}
