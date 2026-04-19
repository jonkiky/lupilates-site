'use client';

import Image from 'next/image';
import { useState } from 'react';

type Product = {
  id: string;
  name: string;
  sku: string;
  description: string;
  availabilityText: string;
  specsJson: unknown;
  imageUrls: unknown;
  category: { name: string } | null;
};

type Props = { product: Product };

export function ProductDetail({ product }: Props) {
  const images = Array.isArray(product.imageUrls) ? (product.imageUrls as string[]) : [];
  const specs = product.specsJson && typeof product.specsJson === 'object' ? product.specsJson as Record<string, string> : {};
  const [activeImage, setActiveImage] = useState(0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image panel */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-stone-100">
            {images[activeImage] ? (
              <Image src={images[activeImage]} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-stone-300 text-6xl">□</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((url, i) => (
                <button key={url} onClick={() => setActiveImage(i)}
                  className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 ${i === activeImage ? 'border-stone-900' : 'border-transparent'}`}>
                  <Image src={url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Info panel */}
        <div className="flex flex-col gap-5">
          {product.category && <p className="text-sm uppercase tracking-wide text-stone-400">{product.category.name}</p>}
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">{product.name}</h1>
          <p className="text-sm text-stone-500">SKU: {product.sku}</p>
          <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">{product.availabilityText}</span>
          <p className="text-sm leading-relaxed text-stone-700">{product.description}</p>
          {Object.keys(specs).length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-stone-900">Specifications</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {Object.entries(specs).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-stone-500">{k}</dt>
                    <dd className="font-medium text-stone-900">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <button
            className="mt-4 rounded-full bg-stone-950 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700"
            onClick={() => {
              // Cart add handled by parent via event or context in future tasks
              alert('Added to quote cart — cart implementation in Task 5');
            }}
          >
            Add to quote cart
          </button>
        </div>
      </div>
    </main>
  );
}
