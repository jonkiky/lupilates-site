import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,95,59,0.18),_transparent_30%),linear-gradient(180deg,_#fbf7f2_0%,_#efe7db_100%)] text-ink">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/80 p-8 shadow-[0_24px_80px_rgba(24,20,17,0.12)] backdrop-blur sm:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-copper">B2B Product Catalog</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Request a quote for commercial 3D print products.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-stone-700 sm:text-lg">
            Browse products, build a quote cart, and submit project requirements without a checkout flow.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/products"
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
      </section>
    </main>
  );
}
