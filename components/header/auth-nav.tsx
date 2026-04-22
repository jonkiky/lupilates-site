import Link from 'next/link';
import { logoutAction } from '@/app/actions/user-auth';
import { CartIcon } from '@/components/header/cart-icon';

interface AuthNavProps {
  user: {
    userId: string;
    email: string;
    username?: string;
  } | null;
}

export const AuthNav = ({ user }: AuthNavProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm font-medium text-stone-600 hover:text-stone-900">
        B2B Quote Cart
      </Link>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link href="/user/profile" className="text-sm font-medium text-stone-700 hover:text-stone-900">
              {user.username ?? user.email}
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="text-sm font-medium text-stone-700 hover:text-stone-900">
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full bg-stone-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
            >
              Sign up
            </Link>
          </>
        )}
        <CartIcon />
      </div>
    </div>
  );
};
