/**
 * Tribute Router
 *
 * Handles tribute dedication operations:
 * - create: Create a new tribute
 * - get: Get tribute by ID
 */

import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { createTributeSchema, getTributeSchema } from '../schemas';

export const tributeRouter = createTRPCRouter({
  /**
   * Create tribute
   *
   * Authorization: Public
   *
   * Business Logic:
   * - Create tribute record with type, honoree name, and message
   * - Tributes are standalone entities that can be attached to gifts
   * - No authentication required (tributes created during donation flow)
   */
  create: publicProcedure
    .input(createTributeSchema)
    .mutation(async ({ ctx, input }) => {
      const { type, honoreeName, message } = input;

      const tribute = await ctx.db.tribute.create({
        data: {
          type,
          honoreeName,
          message,
        },
      });

      return tribute;
    }),

  /**
   * Get tribute by ID
   *
   * Authorization: Public
   *
   * Business Logic:
   * - Retrieve tribute details
   * - Tributes are not sensitive information, so public access is allowed
   */
  get: publicProcedure
    .input(getTributeSchema)
    .query(async ({ ctx, input }) => {
      const tribute = await ctx.db.tribute.findUnique({
        where: { id: input.tributeId },
      });

      if (!tribute) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tribute not found.',
        });
      }

      return tribute;
    }),
});
