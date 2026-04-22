import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { USER_SESSION_COOKIE_NAME, verifyUserSessionValue } from '@/lib/auth/user-session';

export default async function UserDashboardPage() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
  const session = verifyUserSessionValue(sessionValue);

  if (!session) {
    redirect('/auth/login');
  }

  redirect('/user/profile');
}
