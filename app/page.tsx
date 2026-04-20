import Link from 'next/link';
import { listPublishedProducts } from '@/lib/repositories/products';
import { ProductGrid } from '@/components/catalog/product-grid';

export default async function HomePage() {
  const products = await listPublishedProducts({ search: '', category: '' });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,95,59,0.18),_transparent_30%),linear-gradient(180deg,_#fbf7f2_0%,_#efe7db_100%)] text-ink">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-stone-600">B2B Quote Cart</p>
        <div className="flex gap-3">
          <a href="/auth/login" className="text-sm font-medium text-stone-700 hover:text-stone-900">
            Log in
          </a>
          <a
            href="/auth/signup"
            className="rounded-full bg-stone-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
          >
            Sign up
          </a>
        </div>
      </div>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-6 rounded-[2rem] border border-black/5 bg-white/80 p-8 shadow-[0_24px_80px_rgba(24,20,17,0.12)] backdrop-blur sm:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-copper">B2B Product Catalog</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Request a quote for commercial 3D print products.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-stone-700 sm:text-lg">
            Browse products, build a quote cart, and submit project requirements without a checkout flow.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="#products"
              className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
            >
              Browse products
            </Link>
            <Link
              href="/quote-cart"
              className="inline-flex items-center justify-center rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/40"
            >
              Open quote cart
            </Link>
          </div>
        </div>

        <div id="products" className="mx-auto max-w-6xl">
          <header className="mb-8 grid gap-3">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Catalog</p>
            <h2 className="text-3xl font-semibold tracking-tight text-stone-950">Browse products</h2>
          </header>
          <ProductGrid products={products} />
        </div>
      </section>
    </main>
  );
}
