'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

type Category = { id: string; name: string; slug: string };

export function CatalogFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="search"
        placeholder="Search by name or SKU…"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => update('q', e.target.value)}
        className="flex-1 rounded-full border border-stone-300 px-4 py-2 text-sm outline-none focus:border-stone-500"
      />
      <select
        defaultValue={searchParams.get('category') ?? ''}
        onChange={(e) => update('category', e.target.value)}
        className="rounded-full border border-stone-300 px-4 py-2 text-sm outline-none focus:border-stone-500"
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.slug}>{cat.name}</option>
        ))}
      </select>
    </div>
  );
}
