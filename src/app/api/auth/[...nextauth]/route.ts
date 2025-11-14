/**
 * NextAuth.js API Route Handler (App Router)
 *
 * This file exports the NextAuth.js handler for the Next.js App Router.
 * All authentication requests (sign-in, sign-out, callbacks) are handled here.
 *
 * Route: /api/auth/*
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/server/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
