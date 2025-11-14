/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Implements granular permission checking for the donation platform.
 *
 * Permission Model:
 * - Permissions are organized by resource (gifts, campaigns, donors, etc.)
 * - Each resource has actions (create, read, update, delete)
 * - Roles have specific permissions
 * - Resource-level authorization (users can only access their own data)
 */

import { UserRole } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type { Context } from '../trpc';

/**
 * Permission matrix
 *
 * Defines which roles have which permissions.
 */
export const PERMISSIONS = {
  // Gift permissions
  'gifts.create': [UserRole.donor, UserRole.org_admin, UserRole.finance_admin, UserRole.platform_admin],
  'gifts.read': [UserRole.donor, UserRole.org_admin, UserRole.finance_admin, UserRole.support_agent, UserRole.platform_admin],
  'gifts.update': [UserRole.finance_admin, UserRole.platform_admin], // Refunds, adjustments
  'gifts.delete': [UserRole.platform_admin], // Soft delete only

  // Recurring plan permissions
  'recurring.create': [UserRole.donor, UserRole.org_admin, UserRole.finance_admin, UserRole.platform_admin],
  'recurring.read': [UserRole.donor, UserRole.org_admin, UserRole.finance_admin, UserRole.support_agent, UserRole.platform_admin],
  'recurring.update': [UserRole.donor, UserRole.org_admin, UserRole.finance_admin, UserRole.platform_admin],
  'recurring.cancel': [UserRole.donor, UserRole.org_admin, UserRole.finance_admin, UserRole.platform_admin],

  // Donor permissions
  'donors.create': [UserRole.org_admin, UserRole.finance_admin, UserRole.platform_admin],
  'donors.read': [UserRole.donor, UserRole.org_admin, UserRole.finance_admin, UserRole.support_agent, UserRole.platform_admin],
  'donors.update': [UserRole.donor, UserRole.org_admin, UserRole.finance_admin, UserRole.platform_admin],
  'donors.delete': [UserRole.platform_admin], // GDPR right to erasure

  // Campaign permissions
  'campaigns.create': [UserRole.org_admin, UserRole.platform_admin],
  'campaigns.read': [UserRole.donor, UserRole.org_admin, UserRole.finance_admin, UserRole.support_agent, UserRole.platform_admin],
  'campaigns.update': [UserRole.org_admin, UserRole.platform_admin],
  'campaigns.delete': [UserRole.platform_admin],

  // Form permissions
  'forms.create': [UserRole.org_admin, UserRole.platform_admin],
  'forms.read': [UserRole.org_admin, UserRole.platform_admin],
  'forms.update': [UserRole.org_admin, UserRole.platform_admin],
  'forms.publish': [UserRole.org_admin, UserRole.platform_admin],
  'forms.delete': [UserRole.platform_admin],

  // Receipt permissions
  'receipts.read': [UserRole.donor, UserRole.org_admin, UserRole.finance_admin, UserRole.support_agent, UserRole.platform_admin],
  'receipts.regenerate': [UserRole.finance_admin, UserRole.platform_admin],
  'receipts.export': [UserRole.org_admin, UserRole.finance_admin, UserRole.platform_admin],

  // Tribute permissions
  'tributes.create': [UserRole.donor, UserRole.org_admin, UserRole.finance_admin, UserRole.platform_admin],
  'tributes.read': [UserRole.donor, UserRole.org_admin, UserRole.finance_admin, UserRole.support_agent, UserRole.platform_admin],
  'tributes.delete': [UserRole.platform_admin],

  // Export permissions
  'exports.financial': [UserRole.finance_admin, UserRole.platform_admin],
  'exports.donor': [UserRole.org_admin, UserRole.finance_admin, UserRole.platform_admin],
  'exports.campaign': [UserRole.org_admin, UserRole.finance_admin, UserRole.platform_admin],

  // Audit log permissions
  'audit.read': [UserRole.org_admin, UserRole.finance_admin, UserRole.platform_admin],

  // User management permissions
  'users.list': [UserRole.platform_admin],
  'users.create': [UserRole.platform_admin],
  'users.update': [UserRole.platform_admin],
  'users.updateRole': [UserRole.platform_admin],
  'users.delete': [UserRole.platform_admin],

  // Settings permissions
  'settings.read': [UserRole.org_admin, UserRole.platform_admin],
  'settings.update': [UserRole.platform_admin],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(role);
}

/**
 * Require permission middleware
 *
 * Throws FORBIDDEN if user doesn't have the required permission.
 */
export function requirePermission(permission: Permission) {
  return (ctx: Context) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    if (!hasPermission(ctx.session.user.role, permission)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You do not have permission to ${permission}.`,
      });
    }
  };
}

/**
 * Resource-level authorization helpers
 *
 * These ensure users can only access their own data.
 */

/**
 * Check if user can access a specific donor's data
 */
export async function canAccessDonor(
  ctx: Context,
  donorId: string
): Promise<boolean> {
  const { session, db } = ctx;

  if (!session?.user) {
    return false;
  }

  // Platform admins, org admins, finance admins, and support agents can access all donors
  if ([
    UserRole.platform_admin,
    UserRole.org_admin,
    UserRole.finance_admin,
    UserRole.support_agent,
  ].includes(session.user.role)) {
    return true;
  }

  // Donors can only access their own data
  if (session.user.role === UserRole.donor && session.user.donorId === donorId) {
    return true;
  }

  return false;
}

/**
 * Check if user can access a specific gift
 */
export async function canAccessGift(
  ctx: Context,
  giftId: string
): Promise<boolean> {
  const { session, db } = ctx;

  if (!session?.user) {
    return false;
  }

  // Admins and support can access all gifts
  if ([
    UserRole.platform_admin,
    UserRole.org_admin,
    UserRole.finance_admin,
    UserRole.support_agent,
  ].includes(session.user.role)) {
    return true;
  }

  // Donors can only access their own gifts
  if (session.user.role === UserRole.donor && session.user.donorId) {
    const gift = await db.gift.findUnique({
      where: { id: giftId },
      select: { donorId: true },
    });

    return gift?.donorId === session.user.donorId;
  }

  return false;
}

/**
 * Check if user can access a specific recurring plan
 */
export async function canAccessRecurringPlan(
  ctx: Context,
  planId: string
): Promise<boolean> {
  const { session, db } = ctx;

  if (!session?.user) {
    return false;
  }

  // Admins can access all plans
  if ([
    UserRole.platform_admin,
    UserRole.org_admin,
    UserRole.finance_admin,
  ].includes(session.user.role)) {
    return true;
  }

  // Donors can only access their own plans
  if (session.user.role === UserRole.donor && session.user.donorId) {
    const plan = await db.recurringPlan.findUnique({
      where: { id: planId },
      select: { donorId: true },
    });

    return plan?.donorId === session.user.donorId;
  }

  return false;
}

/**
 * Check if user can access a specific receipt
 */
export async function canAccessReceipt(
  ctx: Context,
  receiptId: string
): Promise<boolean> {
  const { session, db } = ctx;

  if (!session?.user) {
    return false;
  }

  // Admins and support can access all receipts
  if ([
    UserRole.platform_admin,
    UserRole.org_admin,
    UserRole.finance_admin,
    UserRole.support_agent,
  ].includes(session.user.role)) {
    return true;
  }

  // Donors can only access their own receipts
  if (session.user.role === UserRole.donor && session.user.donorId) {
    const receipt = await db.receipt.findUnique({
      where: { id: receiptId },
      include: { gift: { select: { donorId: true } } },
    });

    return receipt?.gift.donorId === session.user.donorId;
  }

  return false;
}

/**
 * Enforce resource-level authorization
 *
 * Usage:
 * ```ts
 * await enforceResourceAccess(ctx, 'gift', giftId);
 * ```
 */
export async function enforceResourceAccess(
  ctx: Context,
  resourceType: 'donor' | 'gift' | 'recurring' | 'receipt',
  resourceId: string
): Promise<void> {
  let hasAccess = false;

  switch (resourceType) {
    case 'donor':
      hasAccess = await canAccessDonor(ctx, resourceId);
      break;
    case 'gift':
      hasAccess = await canAccessGift(ctx, resourceId);
      break;
    case 'recurring':
      hasAccess = await canAccessRecurringPlan(ctx, resourceId);
      break;
    case 'receipt':
      hasAccess = await canAccessReceipt(ctx, resourceId);
      break;
  }

  if (!hasAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You do not have access to this ${resourceType}.`,
    });
  }
}
