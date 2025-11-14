/**
 * Authentication Hooks
 *
 * Custom hooks for working with NextAuth.js sessions and authorization.
 */

'use client';

import { useSession as useNextAuthSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@prisma/client';
import type { Session } from 'next-auth';

/**
 * Re-export useSession with proper typing
 */
export function useSession() {
  return useNextAuthSession();
}

/**
 * useRequireAuth Hook
 *
 * Ensures user is authenticated, redirects to sign-in if not.
 *
 * Usage:
 * ```tsx
 * function ProtectedPage() {
 *   const { session, loading } = useRequireAuth();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return <div>Welcome, {session.user.name}</div>;
 * }
 * ```
 */
export function useRequireAuth(redirectTo: string = '/auth/signin') {
  const { data: session, status } = useNextAuthSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to sign-in with callback URL
      const callbackUrl = encodeURIComponent(window.location.pathname);
      router.push(`${redirectTo}?callbackUrl=${callbackUrl}`);
    }
  }, [status, router, redirectTo]);

  return {
    session,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
  };
}

/**
 * useRequireRole Hook
 *
 * Ensures user has one of the required roles, redirects if not.
 *
 * Usage:
 * ```tsx
 * function AdminPage() {
 *   const { session, loading } = useRequireRole([UserRole.platform_admin, UserRole.org_admin]);
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return <div>Admin Panel</div>;
 * }
 * ```
 */
export function useRequireRole(
  allowedRoles: UserRole[],
  redirectTo: string = '/unauthorized'
) {
  const { data: session, status } = useNextAuthSession();
  const router = useRouter();

  const hasRequiredRole = session?.user && allowedRoles.includes(session.user.role);

  useEffect(() => {
    if (status === 'unauthenticated') {
      // User not authenticated, redirect to sign-in
      const callbackUrl = encodeURIComponent(window.location.pathname);
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
    } else if (status === 'authenticated' && !hasRequiredRole) {
      // User authenticated but doesn't have required role
      router.push(redirectTo);
    }
  }, [status, hasRequiredRole, router, redirectTo]);

  return {
    session,
    loading: status === 'loading',
    authorized: hasRequiredRole,
  };
}

/**
 * useHasPermission Hook
 *
 * Checks if current user has a specific permission based on role.
 * Does not redirect, just returns boolean.
 *
 * Usage:
 * ```tsx
 * function DonorList() {
 *   const canExport = useHasPermission([UserRole.finance_admin, UserRole.platform_admin]);
 *
 *   return (
 *     <div>
 *       {canExport && <button>Export Data</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useHasPermission(allowedRoles: UserRole[]): boolean {
  const { data: session, status } = useNextAuthSession();

  if (status === 'loading' || !session?.user) {
    return false;
  }

  return allowedRoles.includes(session.user.role);
}

/**
 * useCurrentUser Hook
 *
 * Returns the current authenticated user, or null if not authenticated.
 */
export function useCurrentUser() {
  const { data: session, status } = useNextAuthSession();

  return {
    user: session?.user ?? null,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
  };
}

/**
 * useDonorId Hook
 *
 * Returns the donorId for the current user (if they're a donor).
 * Useful for querying donor-specific data.
 */
export function useDonorId(): string | null {
  const { data: session } = useNextAuthSession();
  return session?.user?.donorId ?? null;
}
