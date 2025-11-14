/**
 * Zod Validation Schemas
 *
 * Centralized input validation schemas for all tRPC procedures.
 * Enforces business rules, data types, and constraints.
 */

import { z } from 'zod';
import { Currency, GiftStatus, RecurringFrequency, RecurringPlanStatus, TributeType, AuditAction, CampaignStatus } from '@prisma/client';

/**
 * Common validation patterns
 */
const emailSchema = z.string().email().max(255).toLowerCase().trim();
const phoneSchema = z.string().max(20).regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format (E.164 recommended)').optional();
const uuidSchema = z.string().uuid();
const positiveDecimal = z.number().positive().multipleOf(0.01);

/**
 * Donation Router Schemas
 */

// Create donation input
export const createDonationSchema = z.object({
  // Donor information
  donorEmail: emailSchema,
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  phone: phoneSchema,

  // Gift details
  amount: positiveDecimal.min(1).max(100000, 'Amount cannot exceed $100,000'),
  currency: z.nativeEnum(Currency),

  // Attribution
  campaignId: uuidSchema.optional(),
  formId: uuidSchema.optional(),

  // Tribute
  tributeId: uuidSchema.optional(),

  // Fee coverage
  donorCoversFee: z.boolean().default(false),

  // Metadata
  metadata: z.object({
    utmSource: z.string().max(100).optional(),
    utmMedium: z.string().max(100).optional(),
    utmCampaign: z.string().max(100).optional(),
    utmContent: z.string().max(100).optional(),
    utmTerm: z.string().max(100).optional(),
    referrer: z.string().max(500).optional(),
  }).optional().default({}),
});

// Get donation by ID
export const getDonationByIdSchema = z.object({
  giftId: uuidSchema,
});

// List donations with filters
export const listDonationsSchema = z.object({
  campaignId: uuidSchema.optional(),
  status: z.nativeEnum(GiftStatus).optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
  // Cursor-based pagination
  cursor: z.object({
    id: uuidSchema,
    createdAt: z.date(),
  }).optional(),
  limit: z.number().min(1).max(100).default(20),
});

// Update donation (webhook processing)
export const updateDonationSchema = z.object({
  giftId: uuidSchema,
  status: z.nativeEnum(GiftStatus),
  processorRef: z.string().max(200).optional(),
  completedAt: z.date().optional(),
  processorFee: positiveDecimal.optional(),
  refundedAt: z.date().optional(),
});

/**
 * Recurring Router Schemas
 */

// Create recurring plan
export const createRecurringPlanSchema = z.object({
  // Donor information
  donorEmail: emailSchema,
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  phone: phoneSchema,

  // Recurring details
  amount: positiveDecimal.min(5, 'Recurring donations must be at least $5').max(10000),
  currency: z.nativeEnum(Currency),
  frequency: z.nativeEnum(RecurringFrequency),
  nextChargeDate: z.date(),

  // Attribution
  campaignId: uuidSchema.optional(),

  // Fee coverage
  donorCoversFee: z.boolean().default(false),

  // Payment processor details
  mandateId: z.string().max(200), // Subscription/mandate ID from processor
});

// Update recurring plan
export const updateRecurringPlanSchema = z.object({
  planId: uuidSchema,
  amount: positiveDecimal.min(5).max(10000).optional(),
  frequency: z.nativeEnum(RecurringFrequency).optional(),
  donorCoversFee: z.boolean().optional(),
});

// Pause recurring plan
export const pauseRecurringPlanSchema = z.object({
  planId: uuidSchema,
});

// Cancel recurring plan
export const cancelRecurringPlanSchema = z.object({
  planId: uuidSchema,
  reason: z.string().max(500).optional(),
});

// List recurring plans
export const listRecurringPlansSchema = z.object({
  donorId: uuidSchema.optional(), // If not provided, uses session user's donorId
  status: z.nativeEnum(RecurringPlanStatus).optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.object({
    id: uuidSchema,
    createdAt: z.date(),
  }).optional(),
});

/**
 * Tribute Router Schemas
 */

// Create tribute
export const createTributeSchema = z.object({
  type: z.nativeEnum(TributeType),
  honoreeName: z.string().min(1).max(200).trim(),
  message: z.string().max(500).trim().optional(),
});

// Get tribute by ID
export const getTributeSchema = z.object({
  tributeId: uuidSchema,
});

/**
 * Campaign Router Schemas
 */

// Get campaign by slug
export const getCampaignBySlugSchema = z.object({
  slug: z.string().min(1).max(100).toLowerCase().trim(),
});

// List campaigns
export const listCampaignsSchema = z.object({
  status: z.nativeEnum(CampaignStatus).optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.object({
    id: uuidSchema,
    createdAt: z.date(),
  }).optional(),
});

/**
 * Receipt Router Schemas
 */

// Get receipt by ID
export const getReceiptByIdSchema = z.object({
  receiptId: uuidSchema,
});

// Regenerate receipt
export const regenerateReceiptSchema = z.object({
  receiptId: uuidSchema,
  reason: z.string().min(1).max(500).trim(),
});

/**
 * Audit Router Schemas
 */

// Log audit entry (internal use)
export const logAuditSchema = z.object({
  actor: z.string().max(200),
  action: z.nativeEnum(AuditAction),
  resource: z.string().max(200),
  diffs: z.any(), // JSON object
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().max(500).optional(),
});

// Get audit by resource
export const getAuditByResourceSchema = z.object({
  resource: z.string().max(200),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.object({
    id: uuidSchema,
    createdAt: z.date(),
  }).optional(),
});

/**
 * Type exports for use in procedures
 */
export type CreateDonationInput = z.infer<typeof createDonationSchema>;
export type GetDonationByIdInput = z.infer<typeof getDonationByIdSchema>;
export type ListDonationsInput = z.infer<typeof listDonationsSchema>;
export type UpdateDonationInput = z.infer<typeof updateDonationSchema>;

export type CreateRecurringPlanInput = z.infer<typeof createRecurringPlanSchema>;
export type UpdateRecurringPlanInput = z.infer<typeof updateRecurringPlanSchema>;
export type PauseRecurringPlanInput = z.infer<typeof pauseRecurringPlanSchema>;
export type CancelRecurringPlanInput = z.infer<typeof cancelRecurringPlanSchema>;
export type ListRecurringPlansInput = z.infer<typeof listRecurringPlansSchema>;

export type CreateTributeInput = z.infer<typeof createTributeSchema>;
export type GetTributeInput = z.infer<typeof getTributeSchema>;

export type GetCampaignBySlugInput = z.infer<typeof getCampaignBySlugSchema>;
export type ListCampaignsInput = z.infer<typeof listCampaignsSchema>;

export type GetReceiptByIdInput = z.infer<typeof getReceiptByIdSchema>;
export type RegenerateReceiptInput = z.infer<typeof regenerateReceiptSchema>;

export type LogAuditInput = z.infer<typeof logAuditSchema>;
export type GetAuditByResourceInput = z.infer<typeof getAuditByResourceSchema>;
