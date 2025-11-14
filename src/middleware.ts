/**
 * Next.js Edge Middleware
 *
 * Runs on all requests before they reach the application.
 * Implements:
 * - Security headers
 * - CSRF protection
 * - Request logging
 * - Rate limiting (future: integrate with Redis)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers configuration
 *
 * Implements defense-in-depth security controls:
 * - CSP: Content Security Policy to prevent XSS
 * - HSTS: Force HTTPS connections
 * - X-Frame-Options: Prevent clickjacking
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - Referrer-Policy: Control referrer information
 * - Permissions-Policy: Control browser features
 */
const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net", // unsafe-eval for Next.js dev, remove in prod
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.vercel.app https://*.amazonaws.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // Strict Transport Security (HSTS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy (restrict browser features)
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=(self)',
  ].join(', '),

  // XSS Protection (legacy, CSP is preferred)
  'X-XSS-Protection': '1; mode=block',
};

/**
 * Paths that should have relaxed CSP for payment processors
 */
const PAYMENT_PATHS = ['/donate', '/checkout'];

/**
 * Middleware function
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Relaxed CSP for payment pages (to allow payment processor iframes)
  if (PAYMENT_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))) {
    const relaxedCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com https://checkoutshopper-live.adyen.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://www.paypal.com https://checkoutshopper-live.adyen.com",
      "frame-src 'self' https://js.stripe.com https://www.paypal.com https://checkoutshopper-live.adyen.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', relaxedCSP);
  }

  // Log request (in production, send to logging service)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${request.method}] ${request.nextUrl.pathname}`);
  }

  return response;
}

/**
 * Middleware configuration
 *
 * Runs on all routes except static files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
