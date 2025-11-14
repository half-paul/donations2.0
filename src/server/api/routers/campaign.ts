/**
 * Campaign Router
 *
 * Handles campaign operations:
 * - getBySlug: Get campaign by slug for public donation pages
 * - list: List campaigns with filters
 */

import { TRPCError } from '@trpc/server';
import { CampaignStatus } from '@prisma/client';
import { createTRPCRouter, publicProcedure, adminProcedure } from '../trpc';
import { getCampaignBySlugSchema, listCampaignsSchema } from '../schemas';

export const campaignRouter = createTRPCRouter({
  /**
   * Get campaign by slug
   *
   * Authorization: Public
   *
   * Business Logic:
   * - Retrieve campaign with form, theme, and progress metrics
   * - Calculate current amount raised and donor count
   * - Only return active campaigns to public (admins can view all)
   */
  getBySlug: publicProcedure
    .input(getCampaignBySlugSchema)
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: {
          slug: input.slug,
          deletedAt: null,
        },
        include: {
          forms: {
            where: {
              publishedAt: {
                not: null,
              },
            },
            orderBy: {
              publishedAt: 'desc',
            },
            take: 1, // Get most recent published form
          },
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found.',
        });
      }

      // Only show active campaigns to public users
      if (campaign.status !== CampaignStatus.active && !ctx.session?.user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found.',
        });
      }

      // Calculate progress metrics
      const stats = await ctx.db.gift.aggregate({
        where: {
          campaignId: campaign.id,
          status: 'success',
          deletedAt: null,
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      const currentAmount = Number(stats._sum.amount || 0);
      const donorCount = stats._count.id;

      // Calculate progress percentage
      let progressPercentage = 0;
      if (campaign.targetAmount) {
        progressPercentage = Math.round(
          (currentAmount / Number(campaign.targetAmount)) * 100
        );
      }

      return {
        ...campaign,
        progress: {
          currentAmount,
          donorCount,
          progressPercentage,
        },
      };
    }),

  /**
   * List campaigns
   *
   * Authorization: Public (filtered) or Admin (all)
   *
   * Business Logic:
   * - Public users only see active campaigns
   * - Admin users can see all campaigns
   * - Filter by status (optional)
   * - Cursor-based pagination
   */
  list: publicProcedure
    .input(listCampaignsSchema)
    .query(async ({ ctx, input }) => {
      const { status, limit, cursor } = input;

      // Public users can only see active campaigns
      const statusFilter = ctx.session?.user?.role === 'admin'
        ? status
        : CampaignStatus.active;

      const campaigns = await ctx.db.campaign.findMany({
        where: {
          status: statusFilter,
          deletedAt: null,
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

      if (campaigns.length > limit) {
        const nextItem = campaigns.pop()!;
        nextCursor = {
          id: nextItem.id,
          createdAt: nextItem.createdAt,
        };
      }

      // Calculate progress for each campaign
      const campaignsWithProgress = await Promise.all(
        campaigns.map(async (campaign) => {
          const stats = await ctx.db.gift.aggregate({
            where: {
              campaignId: campaign.id,
              status: 'success',
              deletedAt: null,
            },
            _sum: {
              amount: true,
            },
            _count: {
              id: true,
            },
          });

          const currentAmount = Number(stats._sum.amount || 0);
          const donorCount = stats._count.id;

          let progressPercentage = 0;
          if (campaign.targetAmount) {
            progressPercentage = Math.round(
              (currentAmount / Number(campaign.targetAmount)) * 100
            );
          }

          return {
            ...campaign,
            progress: {
              currentAmount,
              donorCount,
              progressPercentage,
            },
          };
        })
      );

      return {
        items: campaignsWithProgress,
        nextCursor,
      };
    }),
});
