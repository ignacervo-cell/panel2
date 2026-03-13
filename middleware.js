import { NextResponse } from 'next/server';

const PASSWORD = 'trelew2026';

export function middleware(req) {
  const auth = req.cookies.get('auth')?.value;
  if (auth === PASSWORD) return NextResponse.next();
  const url = req.nextUrl.clone();
  if (url.pathname === '/login') return NextResponse.next();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!login|_next|api|favicon).*)'],
};