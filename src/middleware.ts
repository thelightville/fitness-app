import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './lib/auth';

const { auth } = NextAuth(authConfig);

const HTML_NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  Expires: '0',
  Pragma: 'no-cache',
  'Surrogate-Control': 'no-store',
};

/**
 * Applies final no-store headers to public HTML pages that Cloudflare must never cache.
 */
function withNoCacheHeaders(response: NextResponse) {
  // Next.js static page responses can override next.config.js cache headers.
  for (const [key, value] of Object.entries(HTML_NO_CACHE_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

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

  if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
    return withNoCacheHeaders(NextResponse.redirect(new URL('/dashboard', nextUrl)));
  }

  if (isPublicRoute) {
    return withNoCacheHeaders(NextResponse.next());
  }

  if (!isLoggedIn && isDashboardRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  if (isAdminRoute && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
