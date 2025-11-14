/**
 * Analytics Event Types and Schemas
 *
 * Defines all event tracking schemas for the donation platform.
 * Ensures type safety and privacy compliance across all analytics implementations.
 */

import { z } from 'zod';

// ============================================================================
// UTM & Attribution Types
// ============================================================================

export const utmSchema = z.object({
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  term: z.string().optional(),
  content: z.string().optional(),
}).strict();

export type UTMParams = z.infer<typeof utmSchema>;

// ============================================================================
// Base Event Properties (included with ALL events)
// ============================================================================

export const baseEventPropertiesSchema = z.object({
  // Campaign & Form Context
  campaign_id: z.string().uuid().optional(),
  campaign_slug: z.string().optional(),
  form_id: z.string().uuid().optional(),

  // Financial Context
  amount: z.number().positive().optional(),
  currency: z.enum(['USD', 'CAD', 'EUR']).optional(),

  // Recurring Context
  recurring: z.boolean().optional(),
  frequency: z.enum(['monthly', 'quarterly', 'annually']).optional(),

  // Fee Coverage
  donor_covers_fee: z.boolean().optional(),
  fee_amount: z.number().nonnegative().optional(),

  // Tribute
  tribute: z.boolean().optional(),
  tribute_type: z.enum(['honour', 'memory', 'celebration']).optional(),

  // Attribution (UTM)
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  term: z.string().optional(),
  content: z.string().optional(),

  // Session & User
  session_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(), // Donor ID (if authenticated)

  // Technical Context (auto-captured)
  page_url: z.string().url().optional(),
  referrer: z.string().optional(),
  user_agent: z.string().optional(),
  viewport_width: z.number().int().positive().optional(),
  viewport_height: z.number().int().positive().optional(),

  // Timestamps
  timestamp: z.string().datetime().optional(),
}).strict();

export type BaseEventProperties = z.infer<typeof baseEventPropertiesSchema>;

// ============================================================================
// Donation Funnel Event Schemas
// ============================================================================

// 1. donation_started - User lands on donation page
export const donationStartedSchema = baseEventPropertiesSchema.extend({
  event: z.literal('donation_started'),
  variant_id: z.string().optional(), // A/B test variant
}).strict();

export type DonationStartedEvent = z.infer<typeof donationStartedSchema>;

// 2. amount_selected - Amount chosen (preset or custom)
export const amountSelectedSchema = baseEventPropertiesSchema.extend({
  event: z.literal('amount_selected'),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'CAD', 'EUR']),
  amount_type: z.enum(['preset', 'custom']),
  preset_options: z.array(z.number()).optional(), // Available preset amounts
}).strict();

export type AmountSelectedEvent = z.infer<typeof amountSelectedSchema>;

// 3. recurring_toggled - User switches to/from recurring
export const recurringToggledSchema = baseEventPropertiesSchema.extend({
  event: z.literal('recurring_toggled'),
  recurring: z.boolean(),
  frequency: z.enum(['monthly', 'quarterly', 'annually']).optional(),
  previous_state: z.boolean().optional(),
}).strict();

export type RecurringToggledEvent = z.infer<typeof recurringToggledSchema>;

// 4. tribute_added - Tribute dedication selected
export const tributeAddedSchema = baseEventPropertiesSchema.extend({
  event: z.literal('tribute_added'),
  tribute: z.literal(true),
  tribute_type: z.enum(['honour', 'memory', 'celebration']),
  ecard_selected: z.boolean().optional(),
}).strict();

export type TributeAddedEvent = z.infer<typeof tributeAddedSchema>;

// 5. fee_coverage_toggled - Donor-covers-fees checked/unchecked
export const feeCoverageToggledSchema = baseEventPropertiesSchema.extend({
  event: z.literal('fee_coverage_toggled'),
  donor_covers_fee: z.boolean(),
  fee_amount: z.number().nonnegative(),
  fee_percentage: z.number().nonnegative().optional(),
  previous_state: z.boolean().optional(),
}).strict();

export type FeeCoverageToggledEvent = z.infer<typeof feeCoverageToggledSchema>;

// 6. donor_info_submitted - Contact information entered
export const donorInfoSubmittedSchema = baseEventPropertiesSchema.extend({
  event: z.literal('donor_info_submitted'),
  is_authenticated: z.boolean(),
  fields_completed: z.array(z.string()).optional(), // Non-PII field names only
  consent_marketing: z.boolean().optional(),
}).strict();

export type DonorInfoSubmittedEvent = z.infer<typeof donorInfoSubmittedSchema>;

// 7. payment_submitted - Payment button clicked
export const paymentSubmittedSchema = baseEventPropertiesSchema.extend({
  event: z.literal('payment_submitted'),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'CAD', 'EUR']),
  recurring: z.boolean(),
  payment_method: z.enum(['card', 'paypal', 'other']).optional(),
  total_amount: z.number().positive(), // amount + fee if applicable
}).strict();

export type PaymentSubmittedEvent = z.infer<typeof paymentSubmittedSchema>;

// 8. donation_completed - Payment successful
export const donationCompletedSchema = baseEventPropertiesSchema.extend({
  event: z.literal('donation_completed'),
  gift_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'CAD', 'EUR']),
  recurring: z.boolean(),
  processor: z.enum(['stripe', 'adyen', 'paypal']),
  processing_time_ms: z.number().int().nonnegative().optional(),
  receipt_sent: z.boolean().optional(),
}).strict();

export type DonationCompletedEvent = z.infer<typeof donationCompletedSchema>;

// 9. donation_failed - Payment failed with reason
export const donationFailedSchema = baseEventPropertiesSchema.extend({
  event: z.literal('donation_failed'),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'CAD', 'EUR']),
  processor: z.enum(['stripe', 'adyen', 'paypal']),
  error_code: z.string(),
  error_message: z.string(), // User-friendly message (no sensitive data)
  decline_reason: z.string().optional(), // Generic decline reason
  retry_available: z.boolean().optional(),
}).strict();

export type DonationFailedEvent = z.infer<typeof donationFailedSchema>;

// ============================================================================
// Union Type for All Events
// ============================================================================

export const analyticsEventSchema = z.discriminatedUnion('event', [
  donationStartedSchema,
  amountSelectedSchema,
  recurringToggledSchema,
  tributeAddedSchema,
  feeCoverageToggledSchema,
  donorInfoSubmittedSchema,
  paymentSubmittedSchema,
  donationCompletedSchema,
  donationFailedSchema,
]);

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

// ============================================================================
// Event Names (for type-safe tracking)
// ============================================================================

export const ANALYTICS_EVENTS = {
  DONATION_STARTED: 'donation_started',
  AMOUNT_SELECTED: 'amount_selected',
  RECURRING_TOGGLED: 'recurring_toggled',
  TRIBUTE_ADDED: 'tribute_added',
  FEE_COVERAGE_TOGGLED: 'fee_coverage_toggled',
  DONOR_INFO_SUBMITTED: 'donor_info_submitted',
  PAYMENT_SUBMITTED: 'payment_submitted',
  DONATION_COMPLETED: 'donation_completed',
  DONATION_FAILED: 'donation_failed',
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// ============================================================================
// Privacy-Safe Identifiers
// ============================================================================

/**
 * Redact PII from event properties
 *
 * Ensures no personally identifiable information is logged in analytics.
 * This function is applied automatically before sending events.
 */
export function redactPII<T extends Record<string, any>>(properties: T): T {
  const sensitiveFields = [
    'email',
    'phone',
    'firstName',
    'lastName',
    'street1',
    'street2',
    'city',
    'state',
    'zip',
    'recipientEmail',
    'recipientName',
    'honoreeName',
    'name',
    'address',
    'card_number',
    'cvv',
    'pan',
  ];

  const redacted = { ...properties };

  for (const field of sensitiveFields) {
    if (field in redacted) {
      delete redacted[field];
    }
  }

  return redacted;
}

// ============================================================================
// Metric Definitions (for dashboard queries)
// ============================================================================

export interface ConversionMetrics {
  total_started: number;
  total_completed: number;
  total_failed: number;
  conversion_rate: number; // completed / started
  abandonment_rate: number; // (started - completed) / started
}

export interface GiftMetrics {
  total_gifts: number;
  total_revenue: number;
  average_gift: number;
  median_gift: number;
  recurring_count: number;
  recurring_uptake: number; // recurring / total
  fee_cover_count: number;
  fee_cover_rate: number; // fee_cover / total
  fee_cover_uplift: number; // total_fees / total_revenue
}

export interface FunnelStepMetrics {
  step_name: string;
  step_count: number;
  drop_off_count: number;
  drop_off_rate: number; // drop_off / previous_step
  cumulative_rate: number; // step_count / total_started
}

export interface CampaignMetrics {
  campaign_id: string;
  campaign_slug: string;
  conversion: ConversionMetrics;
  gifts: GiftMetrics;
  funnel: FunnelStepMetrics[];
}

// ============================================================================
// Date Range Filters
// ============================================================================

export const dateRangeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
}).strict();

export type DateRange = z.infer<typeof dateRangeSchema>;

// ============================================================================
// Consent & Privacy
// ============================================================================

export interface ConsentPreferences {
  analytics_tracking: boolean; // General analytics
  performance_tracking: boolean; // Performance/error monitoring
  marketing_attribution: boolean; // UTM/campaign tracking
}

export const defaultConsentPreferences: ConsentPreferences = {
  analytics_tracking: true,
  performance_tracking: true,
  marketing_attribution: true,
};

// ============================================================================
// Exports
// ============================================================================

export type {
  UTMParams,
  BaseEventProperties,
  DonationStartedEvent,
  AmountSelectedEvent,
  RecurringToggledEvent,
  TributeAddedEvent,
  FeeCoverageToggledEvent,
  DonorInfoSubmittedEvent,
  PaymentSubmittedEvent,
  DonationCompletedEvent,
  DonationFailedEvent,
  AnalyticsEvent,
  AnalyticsEventName,
  ConversionMetrics,
  GiftMetrics,
  FunnelStepMetrics,
  CampaignMetrics,
  DateRange,
  ConsentPreferences,
};
