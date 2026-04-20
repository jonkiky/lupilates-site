import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
import { getUserQuotes } from '@/lib/repositories/users';
import { logoutAction } from '@/app/actions/user-auth';

export default async function UserDashboardPage() {
  const cookieStore = cookies();
  const sessionValue = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  const session = verifyUserSessionValue(sessionValue);

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const quotes = await getUserQuotes(session.userId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-stone-950">My Quotes</h1>
          <p className="mt-2 text-sm text-stone-600">View and manage your submitted quotes</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Log out
          </button>
        </form>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center">
          <p className="mb-4 text-stone-600">No quotes yet</p>
          <Link
            href="/"
            className="inline-block rounded-full bg-stone-950 px-6 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Browse products and submit a quote
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/user/quotes/${quote.id}`}
              className="block rounded-2xl border border-stone-200 bg-white p-4 hover:border-stone-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-950">Quote #{quote.quoteNumber}</p>
                  <p className="text-xs text-stone-500">
                    {quote.createdAt.toLocaleDateString()} • {quote.items.length} items
                  </p>
                </div>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  quote.status === 'NEW' ? 'bg-blue-50 text-blue-700' :
                  quote.status === 'REVIEWING' ? 'bg-yellow-50 text-yellow-700' :
                  quote.status === 'QUOTED' ? 'bg-green-50 text-green-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  {quote.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
