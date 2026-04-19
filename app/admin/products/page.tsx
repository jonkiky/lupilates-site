import Link from 'next/link';
import { listAllProducts } from '@/lib/repositories/products';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await listAllProducts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Products</h1>
        </div>
        <Link href="/admin/products/new" className="self-start rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white">
          + New product
        </Link>
      </header>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {products.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-stone-400">No products yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {products.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-stone-50">
                  <div>
                    <p className="font-medium text-stone-900">{p.name}</p>
                    <p className="text-sm text-stone-500">{p.sku}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    p.visibilityStatus === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                    p.visibilityStatus === 'DRAFT' ? 'bg-stone-100 text-stone-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {p.visibilityStatus}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
