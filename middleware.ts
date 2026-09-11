import { NextResponse } from 'next/server';

// Reject before streaming starts; page-level notFound guards remain as defense
// in depth. This middleware never runs on normal menu or preference routes.
export function middleware() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.next();
}

export const config = { matcher: ['/preview-check/:path*'] };
