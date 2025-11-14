/**
 * Donation Router
 *
 * Handles one-time donation operations:
 * - create: Create a new donation (public, rate-limited)
 * - getById: Retrieve donation details (authenticated)
 * - list: List donations with filters (admin only)
 * - update: Update donation status (system/webhook only)
 */

import { TRPCError } from '@trpc/server';
import { GiftStatus, PaymentProcessor } from '@prisma/client';
import {
  createTRPCRouter,
  publicProcedure,
  rateLimitedProcedure,
  protectedProcedure,
  adminProcedure,
  systemProcedure,
} from '../trpc';
import {
  createDonationSchema,
  getDonationByIdSchema,
  listDonationsSchema,
  updateDonationSchema,
} from '../schemas';

/**
 * Helper: Calculate fee amount based on processor and amount
 */
function calculateFeeAmount(amount: number, processor: PaymentProcessor): number {
  // Stripe/Adyen: 2.9% + $0.30
  // PayPal: 2.99% + $0.49
  const rates = {
    stripe: { percentage: 0.029, fixed: 0.30 },
    adyen: { percentage: 0.029, fixed: 0.30 },
    paypal: { percentage: 0.0299, fixed: 0.49 },
  };

  const rate = rates[processor];
  return Number((amount * rate.percentage + rate.fixed).toFixed(2));
}

/**
 * Helper: Find or create donor by email
 */
async function findOrCreateDonor(
  db: any,
  email: string,
  firstName: string,
  lastName: string,
  phone?: string | null
) {
  // Check if donor exists with this email
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

  // Create new donor
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
 * Helper: Check for duplicate donations
 * Prevents duplicate submissions within 5 minutes
 */
async function checkDuplicateDonation(
  db: any,
  donorId: string,
  amount: number,
  minutesWindow: number = 5
): Promise<boolean> {
  const cutoff = new Date(Date.now() - minutesWindow * 60 * 1000);

  const duplicate = await db.gift.findFirst({
    where: {
      donorId,
      amount,
      createdAt: {
        gte: cutoff,
      },
    },
  });

  return !!duplicate;
}

export const donationRouter = createTRPCRouter({
  /**
   * Create a one-time donation
   *
   * Authorization: Public (rate-limited)
   * Rate Limit: 10 requests per minute per IP
   *
   * Business Logic:
   * 1. Find or create donor by email
   * 2. Check for duplicate submissions
   * 3. Calculate fee amount if donor covers fees
   * 4. Create gift record with pending status
   * 5. Create audit log entry
   *
   * Returns: Gift object with ID (status=pending)
   */
  create: rateLimitedProcedure
    .input(createDonationSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        donorEmail,
        firstName,
        lastName,
        phone,
        amount,
        currency,
        campaignId,
        formId,
        tributeId,
        donorCoversFee,
        metadata,
      } = input;

      // Use transaction for atomicity
      return await ctx.db.$transaction(async (tx) => {
        // 1. Find or create donor
        const donor = await findOrCreateDonor(
          tx,
          donorEmail,
          firstName,
          lastName,
          phone
        );

        // 2. Check for duplicate donations
        const isDuplicate = await checkDuplicateDonation(tx, donor.id, amount);

        if (isDuplicate) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'A similar donation was recently submitted. Please wait a few minutes before trying again.',
          });
        }

        // 3. Calculate fees
        const processor = PaymentProcessor.stripe; // Default processor (can be parameterized later)
        const feeAmount = donorCoversFee ? calculateFeeAmount(amount, processor) : null;
        const netAmount = donorCoversFee ? amount : 0; // Will be calculated on success

        // 4. Verify campaign and form existence
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

        if (formId) {
          const form = await tx.form.findUnique({
            where: { id: formId },
          });

          if (!form || !form.publishedAt) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Form not found or not published.',
            });
          }
        }

        if (tributeId) {
          const tribute = await tx.tribute.findUnique({
            where: { id: tributeId },
          });

          if (!tribute) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Tribute not found.',
            });
          }
        }

        // 5. Create gift record
        const gift = await tx.gift.create({
          data: {
            donorId: donor.id,
            campaignId,
            formId,
            tributeId,
            amount,
            currency,
            donorCoversFee,
            feeAmount,
            processorFee: null, // Set on webhook success
            netAmount,
            status: GiftStatus.pending,
            processor,
            processorRef: null, // Set by payment processor
            metadata: {
              ...metadata,
              ipAddress: ctx.ipAddress,
              userAgent: ctx.userAgent,
            },
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
            campaign: true,
            tribute: true,
          },
        });

        // 6. Create audit log
        await tx.audit.create({
          data: {
            actor: donor.id,
            action: 'CREATE',
            resource: `gift:${gift.id}`,
            diffs: {
              after: {
                amount: gift.amount,
                currency: gift.currency,
                status: gift.status,
                donorCoversFee: gift.donorCoversFee,
              },
            },
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
          },
        });

        return gift;
      });
    }),

  /**
   * Get donation by ID
   *
   * Authorization: Donor (owner) or Admin
   *
   * Business Logic:
   * - Donor can only view their own donations
   * - Admin can view all donations
   */
  getById: protectedProcedure
    .input(getDonationByIdSchema)
    .query(async ({ ctx, input }) => {
      const gift = await ctx.db.gift.findUnique({
        where: { id: input.giftId, deletedAt: null },
        include: {
          donor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              emails: true,
              phone: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tribute: true,
          receipt: true,
        },
      });

      if (!gift) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Donation not found.',
        });
      }

      // Authorization: Owner or admin
      const isOwner = ctx.session.user.donorId === gift.donorId;
      const isAdmin = ctx.session.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this donation.',
        });
      }

      return gift;
    }),

  /**
   * List donations with filters
   *
   * Authorization: Admin only
   *
   * Features:
   * - Filter by campaign, status, date range
   * - Cursor-based pagination
   * - Sorted by creation date (newest first)
   */
  list: adminProcedure
    .input(listDonationsSchema)
    .query(async ({ ctx, input }) => {
      const { campaignId, status, dateRange, cursor, limit } = input;

      const gifts = await ctx.db.gift.findMany({
        where: {
          campaignId,
          status,
          deletedAt: null,
          createdAt: {
            gte: dateRange?.from,
            lte: dateRange?.to,
          },
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
        take: limit + 1, // Fetch one extra to determine if there are more results
      });

      let nextCursor: typeof cursor | undefined = undefined;

      if (gifts.length > limit) {
        const nextItem = gifts.pop()!;
        nextCursor = {
          id: nextItem.id,
          createdAt: nextItem.createdAt,
        };
      }

      return {
        items: gifts,
        nextCursor,
      };
    }),

  /**
   * Update donation status
   *
   * Authorization: System/Webhook only
   *
   * Business Logic:
   * 1. Update gift status and processor reference
   * 2. Calculate net amount on success
   * 3. Create receipt if status is success
   * 4. Create audit log entry
   *
   * Idempotency: Uses processorRef to prevent duplicate processing
   */
  update: systemProcedure
    .input(updateDonationSchema)
    .mutation(async ({ ctx, input }) => {
      const { giftId, status, processorRef, completedAt, processorFee, refundedAt } = input;

      return await ctx.db.$transaction(async (tx) => {
        // Check if gift exists
        const existingGift = await tx.gift.findUnique({
          where: { id: giftId },
        });

        if (!existingGift) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Gift not found.',
          });
        }

        // Idempotency check: If processorRef already set and matches, return existing gift
        if (existingGift.processorRef === processorRef && processorRef) {
          return existingGift;
        }

        // Calculate net amount for successful payments
        let netAmount = existingGift.netAmount;

        if (status === GiftStatus.success && processorFee) {
          netAmount = existingGift.donorCoversFee
            ? Number(existingGift.amount) // Donor covered fee, so full amount goes to org
            : Number(existingGift.amount) - processorFee; // Deduct fee from donation
        }

        // Update gift
        const gift = await tx.gift.update({
          where: { id: giftId },
          data: {
            status,
            processorRef,
            processorFee,
            netAmount,
            completedAt,
            refundedAt,
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

        // Create receipt if payment succeeded
        if (status === GiftStatus.success && !existingGift.receipt) {
          const receiptNumber = await generateReceiptNumber(tx);

          await tx.receipt.create({
            data: {
              giftId: gift.id,
              number: receiptNumber,
              pdfUrl: `https://s3.amazonaws.com/receipts/${receiptNumber}.pdf`, // Placeholder
              taxDeductibleAmount: gift.amount,
              regionalData: {
                country: 'US',
                taxYear: new Date().getFullYear(),
                ein: '12-3456789', // Placeholder
              },
              sentAt: new Date(),
            },
          });
        }

        // Create audit log
        await tx.audit.create({
          data: {
            actor: 'system',
            action: 'UPDATE',
            resource: `gift:${gift.id}`,
            diffs: {
              before: { status: existingGift.status },
              after: { status: gift.status, completedAt: gift.completedAt },
            },
            ipAddress: ctx.ipAddress,
            userAgent: 'webhook-processor',
          },
        });

        return gift;
      });
    }),
});

/**
 * Helper: Generate unique receipt number
 */
async function generateReceiptNumber(tx: any): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.receipt.count({
    where: {
      number: {
        startsWith: `RCP-${year}-`,
      },
    },
  });

  const nextNumber = count + 1;
  return `RCP-${year}-${nextNumber.toString().padStart(6, '0')}`;
}
