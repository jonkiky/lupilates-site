import Link from 'next/link';
import { listQuotes } from '@/lib/repositories/quotes';

export const dynamic = 'force-dynamic';

export default async function AdminQuotesPage() {
  const quotes = await listQuotes();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Admin</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Quote requests</h1>
      </header>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {quotes.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-stone-400">No quote requests yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {quotes.map((q) => (
              <li key={q.id}>
                <Link href={`/admin/quotes/${q.id}`} className="flex flex-col gap-1 px-6 py-4 hover:bg-stone-50 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-stone-900">{q.quoteNumber}</p>
                    <p className="text-sm text-stone-500">{q.customerName} · {q.companyName} · {q.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{q.status}</span>
                    <span className="text-xs text-stone-400">{q.items.length} item{q.items.length !== 1 ? 's' : ''}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
