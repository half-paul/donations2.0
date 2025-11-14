/**
 * Audit Router
 *
 * Handles audit log operations:
 * - log: Create audit entry (internal use)
 * - getByResource: Get audit trail for a resource
 */

import { TRPCError } from '@trpc/server';
import { createTRPCRouter, systemProcedure, adminProcedure } from '../trpc';
import { logAuditSchema, getAuditByResourceSchema } from '../schemas';

export const auditRouter = createTRPCRouter({
  /**
   * Log audit entry
   *
   * Authorization: System only
   *
   * Business Logic:
   * - Create immutable audit log entry
   * - Used internally by middleware and webhooks
   * - Append-only, never update or delete
   */
  log: systemProcedure
    .input(logAuditSchema)
    .mutation(async ({ ctx, input }) => {
      const { actor, action, resource, diffs, ipAddress, userAgent } = input;

      const audit = await ctx.db.audit.create({
        data: {
          actor,
          action,
          resource,
          diffs,
          ipAddress,
          userAgent,
        },
      });

      return audit;
    }),

  /**
   * Get audit trail by resource
   *
   * Authorization: Admin only
   *
   * Business Logic:
   * - Retrieve all audit entries for a specific resource
   * - Format: "gift:uuid", "donor:uuid", "recurring_plan:uuid"
   * - Ordered by creation date (newest first)
   * - Cursor-based pagination
   */
  getByResource: adminProcedure
    .input(getAuditByResourceSchema)
    .query(async ({ ctx, input }) => {
      const { resource, limit, cursor } = input;

      const auditEntries = await ctx.db.audit.findMany({
        where: {
          resource,
          ...(cursor && {
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { lt: cursor.id } },
            ],
          }),
        },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        take: limit + 1,
      });

      let nextCursor: typeof cursor | undefined = undefined;

      if (auditEntries.length > limit) {
        const nextItem = auditEntries.pop()!;
        nextCursor = {
          id: nextItem.id,
          createdAt: nextItem.createdAt,
        };
      }

      return {
        items: auditEntries,
        nextCursor,
      };
    }),
});
