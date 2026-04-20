import Link from 'next/link';
import { logoutAction } from '@/app/actions/user-auth';

interface AuthNavProps {
  user: {
    userId: string;
    email: string;
  } | null;
}

export const AuthNav = ({ user }: AuthNavProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <p className="text-sm font-medium text-stone-600">B2B Quote Cart</p>
      <div className="flex gap-3">
        {user ? (
          <>
            <span className="text-sm font-medium text-stone-700">{user.email}</span>
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
      </div>
    </div>
  );
};
