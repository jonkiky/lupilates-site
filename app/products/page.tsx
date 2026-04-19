import { Suspense } from 'react';
import { listPublishedProducts, listCategories } from '@/lib/repositories/products';
import { ProductGrid } from '@/components/catalog/product-grid';
import { CatalogFilters } from '@/components/catalog/catalog-filters';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([
    listPublishedProducts({ search: params.q ?? '', category: params.category ?? '' }),
    listCategories(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 grid gap-3">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Catalog</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Browse products</h1>
      </header>
      <div className="mb-6">
        <Suspense>
          <CatalogFilters categories={categories} />
        </Suspense>
      </div>
      <ProductGrid products={products} />
    </main>
  );
}
