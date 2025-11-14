/**
 * RoleGuard Component
 *
 * Restricts access based on user role.
 * Shows/hides UI elements or entire routes based on required roles.
 */

'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
  mode?: 'hide' | 'redirect';
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback,
  redirectTo = '/unauthorized',
  mode = 'hide',
}: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const hasPermission = session?.user && allowedRoles.includes(session.user.role);

  useEffect(() => {
    if (mode === 'redirect' && status === 'authenticated' && !hasPermission) {
      router.push(redirectTo);
    }
  }, [mode, status, hasPermission, router, redirectTo]);

  if (status === 'loading') {
    return null; // Or return a skeleton loader
  }

  if (!hasPermission) {
    if (mode === 'redirect') {
      return null; // Will redirect via useEffect
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook version of RoleGuard for more flexible usage
 */
export function useHasRole(allowedRoles: UserRole[]): boolean {
  const { data: session, status } = useSession();

  if (status === 'loading' || !session?.user) {
    return false;
  }

  return allowedRoles.includes(session.user.role);
}
