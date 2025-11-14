/**
 * Recurring Router
 *
 * Handles recurring donation plan operations:
 * - create: Create a new recurring plan (authenticated)
 * - update: Update plan amount/frequency (owner or admin)
 * - pause: Pause a recurring plan (owner or admin)
 * - cancel: Cancel a recurring plan (owner or admin)
 * - list: List user's recurring plans (owner or admin)
 */

import { TRPCError } from '@trpc/server';
import { RecurringPlanStatus, RecurringFrequency, PaymentProcessor } from '@prisma/client';
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from '../trpc';
import {
  createRecurringPlanSchema,
  updateRecurringPlanSchema,
  pauseRecurringPlanSchema,
  cancelRecurringPlanSchema,
  listRecurringPlansSchema,
} from '../schemas';

/**
 * Helper: Calculate next charge date based on frequency
 */
function calculateNextChargeDate(currentDate: Date, frequency: RecurringFrequency): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case RecurringFrequency.monthly:
      next.setMonth(next.getMonth() + 1);
      break;
    case RecurringFrequency.quarterly:
      next.setMonth(next.getMonth() + 3);
      break;
    case RecurringFrequency.annually:
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

/**
 * Helper: Calculate fee amount for recurring plan
 */
function calculateFeeAmount(amount: number, processor: PaymentProcessor): number {
  const rates = {
    stripe: { percentage: 0.029, fixed: 0.30 },
    adyen: { percentage: 0.029, fixed: 0.30 },
    paypal: { percentage: 0.0299, fixed: 0.49 },
  };

  const rate = rates[processor];
  return Number((amount * rate.percentage + rate.fixed).toFixed(2));
}

/**
 * Helper: Find or create donor (same as donation router)
 */
async function findOrCreateDonor(
  db: any,
  email: string,
  firstName: string,
  lastName: string,
  phone?: string | null
) {
  const existingDonor = await db.donor.findFirst({
    where: {
      emails: {
        has: email,
      },
      deletedAt: null,
    },
  });

  if (existingDonor) {
    return existingDonor;
  }

  return await db.donor.create({
    data: {
      emails: [email],
      firstName,
      lastName,
      phone,
      consents: [
        {
          type: 'data_processing',
          granted: true,
          grantedAt: new Date().toISOString(),
          source: 'donation_form',
        },
      ],
      externalIds: [],
      preferences: {},
    },
  });
}

/**
 * Helper: Check if user can manage recurring plan
 */
function canManagePlan(sessionUserId: string, sessionRole: string, donorId: string, sessionDonorId?: string): boolean {
  // Admin can manage all plans
  if (sessionRole === 'admin') {
    return true;
  }

  // Owner can manage their own plans
  if (sessionDonorId === donorId) {
    return true;
  }

  return false;
}

export const recurringRouter = createTRPCRouter({
  /**
   * Create recurring plan
   *
   * Authorization: Authenticated donors only
   *
   * Business Logic:
   * 1. Find or create donor by email
   * 2. Validate campaign if provided
   * 3. Calculate fee amount if donor covers fees
   * 4. Create recurring plan with active status
   * 5. Create audit log entry
   *
   * Note: mandateId should be obtained from payment processor before calling this
   */
  create: protectedProcedure
    .input(createRecurringPlanSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        donorEmail,
        firstName,
        lastName,
        phone,
        amount,
        currency,
        frequency,
        nextChargeDate,
        campaignId,
        donorCoversFee,
        mandateId,
      } = input;

      return await ctx.db.$transaction(async (tx) => {
        // 1. Find or create donor
        const donor = await findOrCreateDonor(
          tx,
          donorEmail,
          firstName,
          lastName,
          phone
        );

        // 2. Validate campaign
        if (campaignId) {
          const campaign = await tx.campaign.findUnique({
            where: { id: campaignId, deletedAt: null },
          });

          if (!campaign) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Campaign not found.',
            });
          }

          if (campaign.status !== 'active') {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'This campaign is not currently accepting donations.',
            });
          }
        }

        // 3. Calculate fee amount
        const processor = PaymentProcessor.stripe; // Default processor
        const feeAmount = donorCoversFee ? calculateFeeAmount(amount, processor) : null;

        // 4. Create recurring plan
        const plan = await tx.recurringPlan.create({
          data: {
            donorId: donor.id,
            campaignId,
            amount,
            currency,
            frequency,
            donorCoversFee,
            feeAmount,
            status: RecurringPlanStatus.active,
            nextChargeDate,
            processor,
            mandateId,
          },
          include: {
            donor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                emails: true,
              },
            },
            campaign: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });

        // 5. Create audit log
        await tx.audit.create({
          data: {
            actor: donor.id,
            action: 'CREATE',
            resource: `recurring_plan:${plan.id}`,
            diffs: {
              after: {
                amount: plan.amount,
                frequency: plan.frequency,
                status: plan.status,
              },
            },
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
          },
        });

        return plan;
      });
    }),

  /**
   * Update recurring plan
   *
   * Authorization: Owner or Admin
   *
   * Business Logic:
   * 1. Verify plan exists and user has permission
   * 2. Update amount, frequency, or fee coverage
   * 3. Recalculate next charge date if frequency changed
   * 4. Update mandate with payment processor (external call)
   * 5. Create audit log entry
   */
  update: protectedProcedure
    .input(updateRecurringPlanSchema)
    .mutation(async ({ ctx, input }) => {
      const { planId, amount, frequency, donorCoversFee } = input;

      return await ctx.db.$transaction(async (tx) => {
        // 1. Get existing plan
        const existingPlan = await tx.recurringPlan.findUnique({
          where: { id: planId },
          include: {
            donor: true,
          },
        });

        if (!existingPlan) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Recurring plan not found.',
          });
        }

        // 2. Check authorization
        if (!canManagePlan(ctx.session.user.id, ctx.session.user.role, existingPlan.donorId, ctx.session.user.donorId)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this recurring plan.',
          });
        }

        // 3. Cannot update cancelled plans
        if (existingPlan.status === RecurringPlanStatus.cancelled) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot update a cancelled recurring plan.',
          });
        }

        // 4. Calculate updated values
        const updatedAmount = amount ?? existingPlan.amount;
        const updatedFrequency = frequency ?? existingPlan.frequency;
        const updatedDonorCoversFee = donorCoversFee ?? existingPlan.donorCoversFee;

        const updatedFeeAmount = updatedDonorCoversFee
          ? calculateFeeAmount(Number(updatedAmount), existingPlan.processor)
          : null;

        // Recalculate next charge date if frequency changed
        let updatedNextChargeDate = existingPlan.nextChargeDate;

        if (frequency && frequency !== existingPlan.frequency) {
          updatedNextChargeDate = calculateNextChargeDate(new Date(), updatedFrequency);
        }

        // 5. Update plan
        const plan = await tx.recurringPlan.update({
          where: { id: planId },
          data: {
            amount: updatedAmount,
            frequency: updatedFrequency,
            donorCoversFee: updatedDonorCoversFee,
            feeAmount: updatedFeeAmount,
            nextChargeDate: updatedNextChargeDate,
          },
          include: {
            donor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                emails: true,
              },
            },
            campaign: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });

        // 6. Create audit log
        await tx.audit.create({
          data: {
            actor: ctx.session.user.id,
            action: 'UPDATE',
            resource: `recurring_plan:${plan.id}`,
            diffs: {
              before: {
                amount: existingPlan.amount,
                frequency: existingPlan.frequency,
                donorCoversFee: existingPlan.donorCoversFee,
              },
              after: {
                amount: plan.amount,
                frequency: plan.frequency,
                donorCoversFee: plan.donorCoversFee,
              },
            },
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
          },
        });

        // TODO: Update mandate with payment processor
        // await paymentAdapter.updateSubscription(plan.mandateId, { amount: updatedAmount });

        return plan;
      });
    }),

  /**
   * Pause recurring plan
   *
   * Authorization: Owner or Admin
   *
   * Business Logic:
   * 1. Verify plan exists and user has permission
   * 2. Set status to paused
   * 3. Set pausedAt timestamp
   * 4. Create audit log entry
   */
  pause: protectedProcedure
    .input(pauseRecurringPlanSchema)
    .mutation(async ({ ctx, input }) => {
      const { planId } = input;

      return await ctx.db.$transaction(async (tx) => {
        const existingPlan = await tx.recurringPlan.findUnique({
          where: { id: planId },
        });

        if (!existingPlan) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Recurring plan not found.',
          });
        }

        if (!canManagePlan(ctx.session.user.id, ctx.session.user.role, existingPlan.donorId, ctx.session.user.donorId)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to pause this recurring plan.',
          });
        }

        if (existingPlan.status !== RecurringPlanStatus.active) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only active recurring plans can be paused.',
          });
        }

        const plan = await tx.recurringPlan.update({
          where: { id: planId },
          data: {
            status: RecurringPlanStatus.paused,
            pausedAt: new Date(),
          },
          include: {
            donor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                emails: true,
              },
            },
          },
        });

        await tx.audit.create({
          data: {
            actor: ctx.session.user.id,
            action: 'UPDATE',
            resource: `recurring_plan:${plan.id}`,
            diffs: {
              before: { status: existingPlan.status },
              after: { status: plan.status, pausedAt: plan.pausedAt },
            },
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
          },
        });

        return plan;
      });
    }),

  /**
   * Cancel recurring plan
   *
   * Authorization: Owner or Admin
   *
   * Business Logic:
   * 1. Verify plan exists and user has permission
   * 2. Set status to cancelled
   * 3. Set cancelledAt timestamp
   * 4. Cancel mandate with payment processor
   * 5. Create audit log entry
   */
  cancel: protectedProcedure
    .input(cancelRecurringPlanSchema)
    .mutation(async ({ ctx, input }) => {
      const { planId, reason } = input;

      return await ctx.db.$transaction(async (tx) => {
        const existingPlan = await tx.recurringPlan.findUnique({
          where: { id: planId },
        });

        if (!existingPlan) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Recurring plan not found.',
          });
        }

        if (!canManagePlan(ctx.session.user.id, ctx.session.user.role, existingPlan.donorId, ctx.session.user.donorId)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to cancel this recurring plan.',
          });
        }

        if (existingPlan.status === RecurringPlanStatus.cancelled) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This recurring plan is already cancelled.',
          });
        }

        const plan = await tx.recurringPlan.update({
          where: { id: planId },
          data: {
            status: RecurringPlanStatus.cancelled,
            cancelledAt: new Date(),
          },
          include: {
            donor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                emails: true,
              },
            },
          },
        });

        await tx.audit.create({
          data: {
            actor: ctx.session.user.id,
            action: 'UPDATE',
            resource: `recurring_plan:${plan.id}`,
            diffs: {
              before: { status: existingPlan.status },
              after: { status: plan.status, cancelledAt: plan.cancelledAt, reason },
            },
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
          },
        });

        // TODO: Cancel mandate with payment processor
        // await paymentAdapter.cancelSubscription(plan.mandateId);

        return plan;
      });
    }),

  /**
   * List recurring plans
   *
   * Authorization: Owner or Admin
   *
   * Business Logic:
   * - If donorId provided and user is admin: list that donor's plans
   * - If no donorId: list current user's plans
   * - Filter by status (optional)
   * - Cursor-based pagination
   */
  list: protectedProcedure
    .input(listRecurringPlansSchema)
    .query(async ({ ctx, input }) => {
      const { donorId, status, limit, cursor } = input;

      // Determine which donor's plans to list
      let targetDonorId: string | undefined;

      if (donorId) {
        // Admin can list any donor's plans
        if (ctx.session.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can view other donors\' recurring plans.',
          });
        }
        targetDonorId = donorId;
      } else {
        // List current user's plans
        if (!ctx.session.user.donorId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User is not associated with a donor account.',
          });
        }
        targetDonorId = ctx.session.user.donorId;
      }

      const plans = await ctx.db.recurringPlan.findMany({
        where: {
          donorId: targetDonorId,
          status,
          ...(cursor && {
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { lt: cursor.id } },
            ],
          }),
        },
        include: {
          donor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              emails: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        take: limit + 1,
      });

      let nextCursor: typeof cursor | undefined = undefined;

      if (plans.length > limit) {
        const nextItem = plans.pop()!;
        nextCursor = {
          id: nextItem.id,
          createdAt: nextItem.createdAt,
        };
      }

      return {
        items: plans,
        nextCursor,
      };
    }),
});
