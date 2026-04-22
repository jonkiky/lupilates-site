'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { addItem, loadCart, saveCart } from '@/lib/quote/cart-store';
import { LoginRecommendationModal } from '@/components/quote/login-recommendation-modal';

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  availabilityText: string;
  images: { url: string }[];
  category: { name: string } | null;
};

export function ProductCard({ product, isLoggedIn }: { product: Product; isLoggedIn: boolean }) {
  const firstImage = product.images[0]?.url ?? null;
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    addToCartInternal();
  }

  function addToCartInternal() {
    setIsAdding(true);
    try {
      const cart = loadCart();
      const updated = addItem(cart, {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
      });
      saveCart(updated);

      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <>
      <Link
        href={`/products/${product.slug}`}
        className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:shadow-md"
      >
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          {firstImage ? (
            <Image src={firstImage} alt={product.name} fill className="object-cover transition group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-300">
              <span className="text-4xl">□</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          {product.category && (
            <p className="text-xs uppercase tracking-wide text-stone-400">{product.category.name}</p>
          )}
          <h3 className="text-sm font-medium text-stone-900 group-hover:text-stone-600">{product.name}</h3>
          <p className="text-xs text-stone-500">{product.sku}</p>
          <p className="mt-auto pt-2 text-xs font-medium text-emerald-600">{product.availabilityText}</p>
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
              justAdded
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:scale-95'
            } disabled:opacity-50`}
          >
            {justAdded ? '✓ Added to cart' : isAdding ? 'Adding...' : '+ Add to cart'}
          </button>
        </div>
      </Link>

      <LoginRecommendationModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onContinueAsGuest={() => addToCartInternal()}
      />
    </>
  );
}
