import { NextResponse } from 'next/server';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://static.okx.com https://static.coinall.ltd",
  "font-src 'self' data:",
  "connect-src 'self' https://www.okx.ai https://www.okx.com https://web3.okx.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ');

export function proxy() {
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export const config = {
  matcher: ['/', '/:path*'],
};
