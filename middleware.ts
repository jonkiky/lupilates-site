import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { verifySessionValueEdge } from '@/lib/auth/session-edge';
import { USER_SESSION_COOKIE_NAME } from '@/lib/auth/user-session';
import { verifyUserSessionValueEdge } from '@/lib/auth/user-session-edge';

export async function middleware(request: NextRequest) {
  // Protect /admin/* routes with admin session
  if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
    const adminCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const adminSession = await verifySessionValueEdge(adminCookie);
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect /user/* routes with user session
  if (request.nextUrl.pathname.startsWith('/user')) {
    const userCookie = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value;
    const userSession = await verifyUserSessionValueEdge(userCookie);
    if (!userSession) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*'],
};
