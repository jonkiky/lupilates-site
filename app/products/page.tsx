import { listPublishedProducts } from '@/lib/repositories/products';
import { ProductGrid } from '@/components/catalog/product-grid';

export default async function ProductsPage() {
  const products = await listPublishedProducts({ search: '', category: '' });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 grid gap-3">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Catalog</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Browse products</h1>
      </header>
      <ProductGrid products={products} />
    </main>
  );
}
