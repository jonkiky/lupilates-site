import { notFound } from 'next/navigation';
import { getQuoteById } from '@/lib/repositories/quotes';
import { QuoteStatusForm } from '@/components/admin/quote-status-form';

export const dynamic = 'force-dynamic';

export default async function AdminQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteById(id);
  if (!quote) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Quote</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">{quote.quoteNumber}</h1>
      </header>

      <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-500">Customer</h2>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div><dt className="text-xs text-stone-400">Name</dt><dd className="text-sm text-stone-900">{quote.customerName}</dd></div>
          <div><dt className="text-xs text-stone-400">Company</dt><dd className="text-sm text-stone-900">{quote.companyName}</dd></div>
          <div><dt className="text-xs text-stone-400">Email</dt><dd className="text-sm text-stone-900">{quote.email}</dd></div>
          <div><dt className="text-xs text-stone-400">Phone</dt><dd className="text-sm text-stone-900">{quote.phone}</dd></div>
          <div><dt className="text-xs text-stone-400">Region</dt><dd className="text-sm text-stone-900">{quote.region}</dd></div>
        </dl>
        {quote.projectNotes && (
          <div className="mt-4">
            <dt className="text-xs text-stone-400">Project notes</dt>
            <dd className="mt-1 text-sm text-stone-700">{quote.projectNotes}</dd>
          </div>
        )}
      </section>

      <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-500">Items</h2>
        <ul className="flex flex-col gap-3">
          {quote.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-900">{item.productNameSnapshot}</p>
                <p className="text-xs text-stone-400">{item.skuSnapshot}</p>
                {item.itemNotes && <p className="mt-1 text-xs text-stone-500">{item.itemNotes}</p>}
              </div>
              <p className="text-sm text-stone-600">×{item.quantity}</p>
            </li>
          ))}
        </ul>
      </section>

      <QuoteStatusForm quoteId={quote.id} currentStatus={quote.status} currentNotes={quote.internalNotes ?? ''} />
    </main>
  );
}
