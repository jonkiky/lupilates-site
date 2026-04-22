'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadCart } from '@/lib/quote/cart-store';

export function CartIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function sync() {
      const cart = loadCart();
      setCount(cart.items.reduce((sum, item) => sum + item.quantity, 0));
    }

    sync();

    // Listen for same-tab cart updates
    window.addEventListener('cart:updated', sync);
    // Listen for cross-tab cart updates
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cart:updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return (
    <Link
      href="/quote-cart"
      aria-label="View cart"
      className="relative flex items-center justify-center rounded-full border border-stone-300 p-2 text-stone-700 hover:bg-stone-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[10px] font-medium text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
