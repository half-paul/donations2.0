/**
 * Mock Context Utilities
 *
 * Helper functions for creating mock tRPC contexts in tests
 */

import { mockDeep } from 'vitest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import type { Session } from 'next-auth';

/**
 * Create a mock tRPC context for testing
 */
export function createMockContext(session: Session | null = null) {
  return {
    db: mockDeep<PrismaClient>(),
    session,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  };
}

/**
 * Create a mock context with admin session
 */
export function createAdminContext() {
  return createMockContext({
    user: {
      id: 'admin-001',
      email: 'admin@test.local',
      name: 'Admin User',
      role: 'ADMIN',
      donorId: null,
      organizationId: 'org-001',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

/**
 * Create a mock context with org admin session
 */
export function createOrgAdminContext() {
  return createMockContext({
    user: {
      id: 'org-admin-001',
      email: 'org.admin@test.local',
      name: 'Org Admin',
      role: 'ORG_ADMIN',
      donorId: null,
      organizationId: 'org-001',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

/**
 * Create a mock context with user session
 */
export function createUserContext(donorId: string = 'donor-001') {
  return createMockContext({
    user: {
      id: 'user-001',
      email: 'user@test.local',
      name: 'Test User',
      role: 'USER',
      donorId,
      organizationId: 'org-001',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

/**
 * Create a mock context with unauthenticated session
 */
export function createUnauthenticatedContext() {
  return createMockContext(null);
}
