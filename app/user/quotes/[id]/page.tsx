import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
import { cancelUserQuoteAction } from '@/app/actions/quotes';
import { getUserQuoteById } from '@/lib/repositories/users';

export default async function UserQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  const session = verifyUserSessionValue(sessionValue);

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const quote = await getUserQuoteById(id, session.userId);
  if (!quote) {
    notFound();
  }

  async function handleCancelQuote() {
    'use server';
    await cancelUserQuoteAction({ id: quote.id });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/user/dashboard" className="mb-4 text-sm font-medium text-stone-600 hover:text-stone-900">
        ← Back to quotes
      </Link>

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-950">Quote #{quote.quoteNumber}</h1>
            <p className="mt-1 text-sm text-stone-600">{quote.createdAt.toLocaleDateString()}</p>
          </div>
          <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
            quote.status === 'NEW' ? 'bg-blue-50 text-blue-700' :
            quote.status === 'REVIEWING' ? 'bg-yellow-50 text-yellow-700' :
            quote.status === 'QUOTED' ? 'bg-green-50 text-green-700' :
            'bg-gray-50 text-gray-700'
          }`}>
            {quote.status}
          </span>
        </div>

        <div className="mb-6 space-y-4 border-b border-stone-200 pb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-stone-500">Contact Name</p>
              <p className="mt-1 font-medium text-stone-900">{quote.customerName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-stone-500">Email</p>
              <p className="mt-1 font-medium text-stone-900">{quote.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-stone-500">Phone</p>
              <p className="mt-1 font-medium text-stone-900">{quote.phone}</p>
            </div>
            {quote.companyName && (
              <div>
                <p className="text-xs font-medium uppercase text-stone-500">Company</p>
                <p className="mt-1 font-medium text-stone-900">{quote.companyName}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 space-y-4 border-b border-stone-200 pb-6">
          <h2 className="font-medium text-stone-950">Items</h2>
          <div className="space-y-3">
            {quote.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-stone-100 p-3">
                <p className="font-medium text-stone-950">{item.product?.name}</p>
                <p className="text-xs text-stone-500">SKU: {item.product?.sku}</p>
                <p className="text-sm text-stone-700">Quantity: {item.quantity}</p>
                {item.itemNotes && <p className="mt-2 text-sm text-stone-700">Notes: {item.itemNotes}</p>}
              </div>
            ))}
          </div>
        </div>

        {quote.projectNotes && (
          <div className="space-y-2">
            <h2 className="font-medium text-stone-950">Project Notes</h2>
            <p className="text-sm text-stone-700">{quote.projectNotes}</p>
          </div>
        )}

        {quote.status !== 'CLOSED' && (
          <form action={handleCancelQuote} className="mt-6 border-t border-stone-200 pt-6">
            <button
              type="submit"
              className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Cancel quote
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
