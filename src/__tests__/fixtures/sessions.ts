/**
 * Test Fixtures: Session and Auth Data
 *
 * Reusable mock data for authentication and authorization tests
 */

import type { Session } from 'next-auth';
import type { User } from '@prisma/client';

export const mockUser: User = {
  id: 'user-test-001',
  email: 'user@example.com',
  name: 'Test User',
  emailVerified: new Date('2024-01-01T00:00:00Z'),
  image: null,
  role: 'USER',
  donorId: 'donor-test-001',
  organizationId: 'org-test-001',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockAdminUser: User = {
  ...mockUser,
  id: 'user-admin-001',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
};

export const mockOrgAdminUser: User = {
  ...mockUser,
  id: 'user-org-admin-001',
  email: 'org.admin@example.com',
  name: 'Org Admin User',
  role: 'ORG_ADMIN',
};

export const mockSession: Session = {
  user: {
    id: mockUser.id,
    email: mockUser.email!,
    name: mockUser.name!,
    role: mockUser.role,
    donorId: mockUser.donorId,
    organizationId: mockUser.organizationId,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockAdminSession: Session = {
  user: {
    id: mockAdminUser.id,
    email: mockAdminUser.email!,
    name: mockAdminUser.name!,
    role: mockAdminUser.role,
    donorId: mockAdminUser.donorId,
    organizationId: mockAdminUser.organizationId,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockOrgAdminSession: Session = {
  user: {
    id: mockOrgAdminUser.id,
    email: mockOrgAdminUser.email!,
    name: mockOrgAdminUser.name!,
    role: mockOrgAdminUser.role,
    donorId: mockOrgAdminUser.donorId,
    organizationId: mockOrgAdminUser.organizationId,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockUnauthenticatedSession = null;

// Helper to create custom sessions
export function createMockSession(
  overrides?: Partial<Session['user']>
): Session {
  return {
    user: {
      ...mockSession.user,
      ...overrides,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}
