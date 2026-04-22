import { cookies } from 'next/headers';
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
import { getUserById } from '@/lib/repositories/users';
import { QuoteCartClient } from '@/components/quote/quote-cart-client';
import { AuthNav } from '@/components/header/auth-nav';

export default async function QuoteCartPage() {
  // Read user session
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  const session = verifyUserSessionValue(sessionValue);

  let user = null;
  if (session) {
    const dbUser = await getUserById(session.userId);
    if (dbUser) {
      user = { userId: dbUser.id, email: dbUser.email, username: dbUser.username };
    }
  }

  return (
    <main className="mx-auto max-w-4xl py-8">
      <AuthNav user={user} />
      <div className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Quote cart</h1>
        <p className="mt-2 text-sm text-stone-600">Adjust quantities, add item notes, and submit your request.</p>
        <QuoteCartClient />
      </div>
    </main>
  );
}
