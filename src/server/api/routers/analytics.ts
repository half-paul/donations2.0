/**
 * Analytics tRPC Router
 *
 * Provides dashboard query procedures for analytics metrics:
 * - Conversion funnel analysis
 * - Gift metrics (average, total, recurring uptake)
 * - Fee coverage analysis
 * - Abandonment tracking
 * - Campaign performance
 */

import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '../trpc';
import type {
  ConversionMetrics,
  GiftMetrics,
  FunnelStepMetrics,
  CampaignMetrics,
} from '../../../types/analytics';
import { ANALYTICS_EVENTS } from '../../../types/analytics';

// ============================================================================
// Input Schemas
// ============================================================================

const dateRangeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

const campaignFilterSchema = z.object({
  campaignId: z.string().uuid().optional(),
  campaignSlug: z.string().optional(),
  dateRange: dateRangeSchema,
});

const funnelAnalysisSchema = z.object({
  campaignId: z.string().uuid().optional(),
  dateRange: dateRangeSchema,
  segmentBy: z.enum(['source', 'medium', 'device']).optional(),
});

// ============================================================================
// Analytics Router
// ============================================================================

export const analyticsRouter = createTRPCRouter({
  /**
   * Get conversion funnel metrics
   *
   * Returns:
   * - Total started, completed, failed
   * - Conversion rate
   * - Abandonment rate
   */
  getConversionFunnel: adminProcedure
    .input(campaignFilterSchema)
    .query(async ({ ctx, input }): Promise<ConversionMetrics> => {
      const { campaignId, dateRange } = input;

      const where = {
        createdAt: {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end),
        },
        ...(campaignId && { campaignId }),
      };

      // Count events by type
      const [started, completed, failed] = await Promise.all([
        ctx.db.analyticsEvent.count({
          where: {
            ...where,
            eventName: ANALYTICS_EVENTS.DONATION_STARTED,
          },
        }),
        ctx.db.analyticsEvent.count({
          where: {
            ...where,
            eventName: ANALYTICS_EVENTS.DONATION_COMPLETED,
          },
        }),
        ctx.db.analyticsEvent.count({
          where: {
            ...where,
            eventName: ANALYTICS_EVENTS.DONATION_FAILED,
          },
        }),
      ]);

      const conversionRate = started > 0 ? completed / started : 0;
      const abandonmentRate = started > 0 ? (started - completed - failed) / started : 0;

      return {
        total_started: started,
        total_completed: completed,
        total_failed: failed,
        conversion_rate: conversionRate,
        abandonment_rate: abandonmentRate,
      };
    }),

  /**
   * Get gift metrics
   *
   * Returns:
   * - Total gifts and revenue
   * - Average and median gift
   * - Recurring uptake
   * - Fee coverage rate and uplift
   */
  getGiftMetrics: adminProcedure
    .input(campaignFilterSchema)
    .query(async ({ ctx, input }): Promise<GiftMetrics> => {
      const { campaignId, dateRange } = input;

      const where = {
        completedAt: {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end),
        },
        status: 'success',
        ...(campaignId && { campaignId }),
      };

      // Get all successful gifts
      const gifts = await ctx.db.gift.findMany({
        where,
        select: {
          amount: true,
          donorCoversFee: true,
          feeAmount: true,
        },
      });

      const totalGifts = gifts.length;
      const totalRevenue = gifts.reduce((sum, g) => sum + Number(g.amount), 0);
      const amounts = gifts.map((g) => Number(g.amount)).sort((a, b) => a - b);
      const medianGift = amounts.length > 0 ? amounts[Math.floor(amounts.length / 2)] : 0;
      const averageGift = totalGifts > 0 ? totalRevenue / totalGifts : 0;

      // Recurring uptake
      const recurringCount = await ctx.db.recurringPlan.count({
        where: {
          createdAt: {
            gte: new Date(dateRange.start),
            lte: new Date(dateRange.end),
          },
          status: 'active',
          ...(campaignId && { campaignId }),
        },
      });

      const recurringUptake = totalGifts > 0 ? recurringCount / totalGifts : 0;

      // Fee coverage
      const feeCoverGifts = gifts.filter((g) => g.donorCoversFee);
      const feeCoverCount = feeCoverGifts.length;
      const feeCoverRate = totalGifts > 0 ? feeCoverCount / totalGifts : 0;

      const totalFees = feeCoverGifts.reduce((sum, g) => sum + Number(g.feeAmount ?? 0), 0);
      const feeCoverUplift = totalRevenue > 0 ? totalFees / totalRevenue : 0;

      return {
        total_gifts: totalGifts,
        total_revenue: totalRevenue,
        average_gift: averageGift,
        median_gift: medianGift,
        recurring_count: recurringCount,
        recurring_uptake: recurringUptake,
        fee_cover_count: feeCoverCount,
        fee_cover_rate: feeCoverRate,
        fee_cover_uplift: feeCoverUplift,
      };
    }),

  /**
   * Get funnel step analysis
   *
   * Returns drop-off rates at each step of the donation funnel
   */
  getFunnelSteps: adminProcedure
    .input(funnelAnalysisSchema)
    .query(async ({ ctx, input }): Promise<FunnelStepMetrics[]> => {
      const { campaignId, dateRange } = input;

      const where = {
        createdAt: {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end),
        },
        ...(campaignId && { campaignId }),
      };

      // Define funnel steps in order
      const steps = [
        { name: 'Started', event: ANALYTICS_EVENTS.DONATION_STARTED },
        { name: 'Amount Selected', event: ANALYTICS_EVENTS.AMOUNT_SELECTED },
        { name: 'Donor Info Submitted', event: ANALYTICS_EVENTS.DONOR_INFO_SUBMITTED },
        { name: 'Payment Submitted', event: ANALYTICS_EVENTS.PAYMENT_SUBMITTED },
        { name: 'Completed', event: ANALYTICS_EVENTS.DONATION_COMPLETED },
      ];

      // Count unique sessions at each step
      const stepCounts = await Promise.all(
        steps.map(async (step) => {
          const events = await ctx.db.analyticsEvent.findMany({
            where: {
              ...where,
              eventName: step.event,
            },
            select: {
              sessionId: true,
            },
            distinct: ['sessionId'],
          });

          return {
            name: step.name,
            count: events.length,
          };
        })
      );

      // Calculate drop-off rates
      const totalStarted = stepCounts[0].count;
      let previousCount = totalStarted;

      const metrics: FunnelStepMetrics[] = stepCounts.map((step, index) => {
        const dropOffCount = index > 0 ? previousCount - step.count : 0;
        const dropOffRate = previousCount > 0 ? dropOffCount / previousCount : 0;
        const cumulativeRate = totalStarted > 0 ? step.count / totalStarted : 0;

        previousCount = step.count;

        return {
          step_name: step.name,
          step_count: step.count,
          drop_off_count: dropOffCount,
          drop_off_rate: dropOffRate,
          cumulative_rate: cumulativeRate,
        };
      });

      return metrics;
    }),

  /**
   * Get abandonment analysis by step
   *
   * Identifies where users are abandoning the donation flow
   */
  getAbandonmentAnalysis: adminProcedure
    .input(campaignFilterSchema)
    .query(async ({ ctx, input }) => {
      const { campaignId, dateRange } = input;

      const where = {
        createdAt: {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end),
        },
        ...(campaignId && { campaignId }),
      };

      // Find sessions that started but didn't complete
      const startedSessions = await ctx.db.analyticsEvent.findMany({
        where: {
          ...where,
          eventName: ANALYTICS_EVENTS.DONATION_STARTED,
        },
        select: {
          sessionId: true,
        },
        distinct: ['sessionId'],
      });

      const completedSessions = await ctx.db.analyticsEvent.findMany({
        where: {
          ...where,
          eventName: ANALYTICS_EVENTS.DONATION_COMPLETED,
        },
        select: {
          sessionId: true,
        },
        distinct: ['sessionId'],
      });

      const completedSessionIds = new Set(completedSessions.map((s) => s.sessionId));
      const abandonedSessionIds = startedSessions
        .map((s) => s.sessionId)
        .filter((id) => !completedSessionIds.has(id));

      // Find last event for each abandoned session
      const lastEvents = await ctx.db.analyticsEvent.groupBy({
        by: ['sessionId', 'eventName'],
        where: {
          sessionId: {
            in: abandonedSessionIds,
          },
        },
        _max: {
          createdAt: true,
        },
      });

      // Count abandonments by last event
      const abandonmentByStep = lastEvents.reduce((acc, event) => {
        const eventName = event.eventName;
        acc[eventName] = (acc[eventName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total_abandoned: abandonedSessionIds.length,
        abandonment_by_step: abandonmentByStep,
        abandonment_rate: startedSessions.length > 0
          ? abandonedSessionIds.length / startedSessions.length
          : 0,
      };
    }),

  /**
   * Get campaign performance summary
   *
   * Comprehensive metrics for a specific campaign
   */
  getCampaignPerformance: adminProcedure
    .input(campaignFilterSchema)
    .query(async ({ ctx, input }): Promise<CampaignMetrics> => {
      const { campaignId, campaignSlug, dateRange } = input;

      // Get campaign details
      const campaign = await ctx.db.campaign.findFirst({
        where: {
          ...(campaignId && { id: campaignId }),
          ...(campaignSlug && { slug: campaignSlug }),
        },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get conversion metrics
      const conversion = await ctx.analyticsRouter.getConversionFunnel({
        campaignId: campaign.id,
        dateRange,
      });

      // Get gift metrics
      const gifts = await ctx.analyticsRouter.getGiftMetrics({
        campaignId: campaign.id,
        dateRange,
      });

      // Get funnel steps
      const funnel = await ctx.analyticsRouter.getFunnelSteps({
        campaignId: campaign.id,
        dateRange,
      });

      return {
        campaign_id: campaign.id,
        campaign_slug: campaign.slug,
        conversion,
        gifts,
        funnel,
      };
    }),

  /**
   * Get real-time donation activity
   *
   * Returns recent donations for live dashboards
   */
  getRecentActivity: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(10),
        campaignId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, campaignId } = input;

      const events = await ctx.db.analyticsEvent.findMany({
        where: {
          eventName: ANALYTICS_EVENTS.DONATION_COMPLETED,
          ...(campaignId && { campaignId }),
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        select: {
          id: true,
          eventName: true,
          amount: true,
          currency: true,
          recurring: true,
          campaignSlug: true,
          utmSource: true,
          createdAt: true,
        },
      });

      return events;
    }),

  /**
   * Export analytics data to CSV
   *
   * Generates CSV export for finance/reporting
   */
  exportAnalytics: adminProcedure
    .input(
      z.object({
        campaignId: z.string().uuid().optional(),
        dateRange: dateRangeSchema,
        format: z.enum(['csv', 'json']).default('csv'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { campaignId, dateRange, format } = input;

      const events = await ctx.db.analyticsEvent.findMany({
        where: {
          createdAt: {
            gte: new Date(dateRange.start),
            lte: new Date(dateRange.end),
          },
          ...(campaignId && { campaignId }),
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (format === 'json') {
        return { data: events, format: 'json' };
      }

      // Convert to CSV
      const headers = [
        'Event Name',
        'Session ID',
        'User ID',
        'Campaign ID',
        'Amount',
        'Currency',
        'Recurring',
        'UTM Source',
        'UTM Medium',
        'UTM Campaign',
        'Timestamp',
      ];

      const rows = events.map((e) => [
        e.eventName,
        e.sessionId,
        e.userId ?? '',
        e.campaignId ?? '',
        e.amount?.toString() ?? '',
        e.currency ?? '',
        e.recurring?.toString() ?? '',
        e.utmSource ?? '',
        e.utmMedium ?? '',
        e.utmCampaign ?? '',
        e.createdAt.toISOString(),
      ]);

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

      return {
        data: csv,
        format: 'csv',
        filename: `analytics-export-${dateRange.start}-${dateRange.end}.csv`,
      };
    }),
});
