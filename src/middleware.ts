import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './lib/auth';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = ['/', '/login', '/register'].includes(nextUrl.pathname);
  const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard');
  const isAdminRoute = nextUrl.pathname.startsWith('/dashboard/admin');

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  if (!isLoggedIn && isDashboardRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  if (isAdminRoute && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
