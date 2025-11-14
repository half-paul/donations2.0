/**
 * Receipt Router
 *
 * Handles tax receipt operations:
 * - getById: Get receipt by ID
 * - regenerate: Regenerate receipt (corrected receipt)
 */

import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc';
import { getReceiptByIdSchema, regenerateReceiptSchema } from '../schemas';

export const receiptRouter = createTRPCRouter({
  /**
   * Get receipt by ID
   *
   * Authorization: Donor (owner) or Admin
   *
   * Business Logic:
   * - Retrieve receipt with gift and donor details
   * - Donor can only view their own receipts
   * - Admin can view all receipts
   */
  getById: protectedProcedure
    .input(getReceiptByIdSchema)
    .query(async ({ ctx, input }) => {
      const receipt = await ctx.db.receipt.findUnique({
        where: { id: input.receiptId },
        include: {
          gift: {
            include: {
              donor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  emails: true,
                  street1: true,
                  street2: true,
                  city: true,
                  state: true,
                  zip: true,
                  country: true,
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
            },
          },
        },
      });

      if (!receipt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Receipt not found.',
        });
      }

      // Authorization: Owner or admin
      const isOwner = ctx.session.user.donorId === receipt.gift.donorId;
      const isAdmin = ctx.session.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this receipt.',
        });
      }

      return receipt;
    }),

  /**
   * Regenerate receipt
   *
   * Authorization: Admin only
   *
   * Business Logic:
   * 1. Create new receipt with correctedFromId reference
   * 2. Mark old receipt as corrected
   * 3. Generate new PDF (external service)
   * 4. Send corrected receipt via email
   * 5. Create audit log entry
   *
   * Use cases:
   * - Donor name correction
   * - Address update for tax purposes
   * - Amount correction (rare)
   */
  regenerate: adminProcedure
    .input(regenerateReceiptSchema)
    .mutation(async ({ ctx, input }) => {
      const { receiptId, reason } = input;

      return await ctx.db.$transaction(async (tx) => {
        // 1. Get original receipt
        const originalReceipt = await tx.receipt.findUnique({
          where: { id: receiptId },
          include: {
            gift: true,
          },
        });

        if (!originalReceipt) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Original receipt not found.',
          });
        }

        // 2. Check if already corrected
        const existingCorrection = await tx.receipt.findFirst({
          where: {
            correctedFromId: receiptId,
          },
        });

        if (existingCorrection) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This receipt has already been corrected.',
          });
        }

        // 3. Generate new receipt number
        const newReceiptNumber = `${originalReceipt.number}-C${await getNextCorrectionNumber(tx, receiptId)}`;

        // 4. Create corrected receipt
        const newReceipt = await tx.receipt.create({
          data: {
            giftId: originalReceipt.giftId,
            number: newReceiptNumber,
            pdfUrl: `https://s3.amazonaws.com/receipts/${newReceiptNumber}.pdf`, // Placeholder
            htmlUrl: originalReceipt.htmlUrl
              ? `${originalReceipt.htmlUrl}-corrected`
              : undefined,
            taxDeductibleAmount: originalReceipt.taxDeductibleAmount,
            regionalData: {
              ...((originalReceipt.regionalData as any) || {}),
              correctionReason: reason,
              originalReceiptNumber: originalReceipt.number,
            },
            correctedFromId: originalReceipt.id,
            sentAt: new Date(),
          },
          include: {
            gift: {
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
            },
          },
        });

        // 5. Create audit log
        await tx.audit.create({
          data: {
            actor: ctx.session.user.id,
            action: 'CREATE',
            resource: `receipt:${newReceipt.id}`,
            diffs: {
              correctionReason: reason,
              originalReceiptId: originalReceipt.id,
              newReceiptNumber,
            },
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
          },
        });

        // TODO: Generate PDF and send via email
        // await generateReceiptPDF(newReceipt);
        // await sendCorrectedReceipt(newReceipt.gift.donor.emails[0], newReceipt);

        return newReceipt;
      });
    }),
});

/**
 * Helper: Get next correction number for a receipt
 */
async function getNextCorrectionNumber(tx: any, originalReceiptId: string): Promise<number> {
  const corrections = await tx.receipt.count({
    where: {
      correctedFromId: originalReceiptId,
    },
  });

  return corrections + 1;
}
