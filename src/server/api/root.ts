/**
 * Root Router
 *
 * Combines all tRPC routers into a single root router.
 * This is the main entry point for the tRPC API.
 */

import { createTRPCRouter } from './trpc';
import { donationRouter } from './routers/donation';
import { recurringRouter } from './routers/recurring';
import { tributeRouter } from './routers/tribute';
import { campaignRouter } from './routers/campaign';
import { receiptRouter } from './routers/receipt';
import { auditRouter } from './routers/audit';
import { analyticsRouter } from './routers/analytics';

/**
 * Root router with all procedure routers
 *
 * Usage in frontend:
 * - trpc.donation.create.useMutation()
 * - trpc.donation.getById.useQuery({ giftId: '...' })
 * - trpc.recurring.list.useQuery()
 * - trpc.campaign.getBySlug.useQuery({ slug: 'spring-appeal-2025' })
 */
export const appRouter = createTRPCRouter({
  donation: donationRouter,
  recurring: recurringRouter,
  tribute: tributeRouter,
  campaign: campaignRouter,
  receipt: receiptRouter,
  audit: auditRouter,
  analytics: analyticsRouter,
});

/**
 * Type definition for the app router
 * Used by frontend for type inference
 */
export type AppRouter = typeof appRouter;
