import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthNav } from '@/components/header/auth-nav';
import { ProfileForm } from '@/components/auth/profile-form';
import { USER_SESSION_COOKIE_NAME, verifyUserSessionValue } from '@/lib/auth/user-session';
import { getUserById, getUserQuotes } from '@/lib/repositories/users';

export const metadata = {
  title: 'My Account | B2B Quote Cart',
};

type SearchParams = {
  tab?: string;
};

type UserProfilePageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function UserProfilePage({ searchParams }: UserProfilePageProps) {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  const session = verifyUserSessionValue(sessionValue);

  if (!session) {
    redirect('/auth/login');
  }

  const user = await getUserById(session.userId);

  if (!user) {
    redirect('/auth/login');
  }

  const quotes = await getUserQuotes(session.userId);
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams?.tab === 'profile' ? 'profile' : 'quotes';

  const quotesTabClass =
    activeTab === 'quotes'
      ? 'border-stone-900 bg-stone-900 text-white'
      : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400';

  const profileTabClass =
    activeTab === 'profile'
      ? 'border-stone-900 bg-stone-900 text-white'
      : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400';

  return (
    <main className="mx-auto max-w-6xl py-8">
      <AuthNav user={{ userId: user.id, email: user.email, username: user.username }} />
      <section className="mx-auto mt-8 max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-stone-200 bg-stone-50 p-6">
          <h1 className="text-3xl font-semibold text-stone-950">My Account</h1>
          <p className="mt-2 text-sm text-stone-600">View your submitted quotes or update your profile details.</p>
        </div>

        <div className="mb-6 flex gap-3">
          <Link href="/user/profile" className={`rounded-full border px-4 py-2 text-sm font-medium ${quotesTabClass}`}>
            Quotes
          </Link>
          <Link
            href="/user/profile?tab=profile"
            className={`rounded-full border px-4 py-2 text-sm font-medium ${profileTabClass}`}
          >
            Profile
          </Link>
        </div>

        {activeTab === 'quotes' ? (
          quotes.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center">
              <h2 className="text-xl font-semibold text-stone-950">My Quotes</h2>
              <p className="mb-4 mt-2 text-stone-600">No quotes yet</p>
              <Link
                href="/"
                className="inline-block rounded-full bg-stone-950 px-6 py-2 text-sm font-medium text-white hover:bg-stone-700"
              >
                Browse products and submit a quote
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-stone-950">My Quotes</h2>
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
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          quote.status === 'NEW'
                            ? 'bg-blue-50 text-blue-700'
                            : quote.status === 'REVIEWING'
                              ? 'bg-yellow-50 text-yellow-700'
                              : quote.status === 'QUOTED'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        ) : (
          <>
            <h2 className="mb-4 text-2xl font-semibold text-stone-950">Profile</h2>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">Email</p>
                <p className="mt-2 text-base font-medium text-stone-950">{user.email}</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">Username</p>
                <p className="mt-2 text-base font-medium text-stone-950">{user.username}</p>
              </div>
            </div>

            <ProfileForm user={user} />
          </>
        )}
      </section>
    </main>
  );
}