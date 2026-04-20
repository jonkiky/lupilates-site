import { NextRequest, NextResponse } from 'next/server';
import { verifySessionValue, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { verifyUserSessionValue, USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';

const userSessionVerifier = async (sessionValue: string) => {
  const verified = verifyUserSessionValue(sessionValue);
  return verified ? { userId: verified.userId } : null;
};

export async function middleware(request: NextRequest) {
  // Protect /admin/* routes with admin session
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const adminSession = verifySessionValue(adminCookie);
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect /user/* routes with user session
  if (request.nextUrl.pathname.startsWith('/user')) {
    const userCookie = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value;
    const userSession = await userSessionVerifier(userCookie ?? '');
    if (!userSession) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*'],
};
