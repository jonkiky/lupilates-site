import Link from 'next/link';
import { listQuotes } from '@/lib/repositories/quotes';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [quotes, productCount] = await Promise.all([
    listQuotes(),
    db.product.count(),
  ]);

  const statusCounts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] ?? 0) + 1;
    return acc;
  }, {});

  const recentQuotes = quotes.slice(0, 5);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Dashboard</h1>
        </div>
        <Link href="/admin/products/new" className="self-start rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white">
          + Add product
        </Link>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Total products</p>
          <p className="mt-1 text-3xl font-semibold text-stone-950">{productCount}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Total quote requests</p>
          <p className="mt-1 text-3xl font-semibold text-stone-950">{quotes.length}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">New / Reviewing</p>
          <p className="mt-1 text-3xl font-semibold text-stone-950">
            {(statusCounts['NEW'] ?? 0) + (statusCounts['REVIEWING'] ?? 0)}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-stone-900">Recent quote requests</h2>
          <Link href="/admin/quotes" className="text-sm text-stone-500 hover:text-stone-900">View all →</Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {recentQuotes.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-stone-400">No quote requests yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {recentQuotes.map((q) => (
                <li key={q.id}>
                  <Link href={`/admin/quotes/${q.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-stone-50">
                    <div>
                      <p className="font-medium text-stone-900">{q.quoteNumber}</p>
                      <p className="text-sm text-stone-500">{q.customerName} · {q.companyName}</p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{q.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
