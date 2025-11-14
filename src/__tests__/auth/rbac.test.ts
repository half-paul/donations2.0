/**
 * RBAC (Role-Based Access Control) Tests
 *
 * Tests permission checking and resource-level authorization.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@prisma/client';
import {
  hasPermission,
  requirePermission,
  canAccessDonor,
  canAccessGift,
  enforceResourceAccess,
} from '@/server/api/middleware/rbac';
import { TRPCError } from '@trpc/server';

describe('RBAC Permission System', () => {
  describe('hasPermission', () => {
    it('should allow platform_admin full access', () => {
      expect(hasPermission(UserRole.platform_admin, 'gifts.create')).toBe(true);
      expect(hasPermission(UserRole.platform_admin, 'users.delete')).toBe(true);
      expect(hasPermission(UserRole.platform_admin, 'settings.update')).toBe(true);
    });

    it('should restrict donor permissions', () => {
      expect(hasPermission(UserRole.donor, 'gifts.create')).toBe(true);
      expect(hasPermission(UserRole.donor, 'gifts.read')).toBe(true);
      expect(hasPermission(UserRole.donor, 'gifts.update')).toBe(false); // Cannot refund
      expect(hasPermission(UserRole.donor, 'users.list')).toBe(false);
    });

    it('should grant finance_admin financial permissions', () => {
      expect(hasPermission(UserRole.finance_admin, 'gifts.update')).toBe(true); // Refunds
      expect(hasPermission(UserRole.finance_admin, 'exports.financial')).toBe(true);
      expect(hasPermission(UserRole.finance_admin, 'receipts.regenerate')).toBe(true);
    });

    it('should grant org_admin campaign management', () => {
      expect(hasPermission(UserRole.org_admin, 'campaigns.create')).toBe(true);
      expect(hasPermission(UserRole.org_admin, 'forms.create')).toBe(true);
      expect(hasPermission(UserRole.org_admin, 'users.delete')).toBe(false); // No user management
    });

    it('should grant support_agent read-only access', () => {
      expect(hasPermission(UserRole.support_agent, 'gifts.read')).toBe(true);
      expect(hasPermission(UserRole.support_agent, 'donors.read')).toBe(true);
      expect(hasPermission(UserRole.support_agent, 'receipts.read')).toBe(true);
      expect(hasPermission(UserRole.support_agent, 'gifts.update')).toBe(false);
      expect(hasPermission(UserRole.support_agent, 'donors.update')).toBe(false);
    });
  });

  describe('requirePermission middleware', () => {
    it('should throw UNAUTHORIZED if no session', () => {
      const ctx = { session: null } as any;
      expect(() => requirePermission('gifts.create')(ctx)).toThrow(TRPCError);
    });

    it('should throw FORBIDDEN if insufficient permissions', () => {
      const ctx = {
        session: {
          user: { id: '1', role: UserRole.donor, email: 'test@example.com' },
        },
      } as any;

      expect(() => requirePermission('users.delete')(ctx)).toThrow(TRPCError);
    });

    it('should pass if user has permission', () => {
      const ctx = {
        session: {
          user: { id: '1', role: UserRole.platform_admin, email: 'admin@example.com' },
        },
      } as any;

      expect(() => requirePermission('users.delete')(ctx)).not.toThrow();
    });
  });

  describe('Resource-level authorization', () => {
    describe('canAccessDonor', () => {
      it('should allow admin to access any donor', async () => {
        const ctx = {
          session: {
            user: { id: '1', role: UserRole.platform_admin, email: 'admin@example.com' },
          },
          db: {} as any,
        };

        const result = await canAccessDonor(ctx, 'donor-123');
        expect(result).toBe(true);
      });

      it('should allow donor to access their own data', async () => {
        const ctx = {
          session: {
            user: {
              id: '1',
              role: UserRole.donor,
              donorId: 'donor-123',
              email: 'donor@example.com',
            },
          },
          db: {} as any,
        };

        const result = await canAccessDonor(ctx, 'donor-123');
        expect(result).toBe(true);
      });

      it('should deny donor access to other donor data', async () => {
        const ctx = {
          session: {
            user: {
              id: '1',
              role: UserRole.donor,
              donorId: 'donor-123',
              email: 'donor@example.com',
            },
          },
          db: {} as any,
        };

        const result = await canAccessDonor(ctx, 'donor-456');
        expect(result).toBe(false);
      });
    });

    describe('canAccessGift', () => {
      it('should allow donor to access their own gifts', async () => {
        const mockGift = { donorId: 'donor-123' };
        const ctx = {
          session: {
            user: {
              id: '1',
              role: UserRole.donor,
              donorId: 'donor-123',
              email: 'donor@example.com',
            },
          },
          db: {
            gift: {
              findUnique: vi.fn().mockResolvedValue(mockGift),
            },
          } as any,
        };

        const result = await canAccessGift(ctx, 'gift-123');
        expect(result).toBe(true);
        expect(ctx.db.gift.findUnique).toHaveBeenCalledWith({
          where: { id: 'gift-123' },
          select: { donorId: true },
        });
      });

      it('should deny donor access to other gifts', async () => {
        const mockGift = { donorId: 'donor-456' };
        const ctx = {
          session: {
            user: {
              id: '1',
              role: UserRole.donor,
              donorId: 'donor-123',
              email: 'donor@example.com',
            },
          },
          db: {
            gift: {
              findUnique: vi.fn().mockResolvedValue(mockGift),
            },
          } as any,
        };

        const result = await canAccessGift(ctx, 'gift-123');
        expect(result).toBe(false);
      });
    });
  });
});
