/**
 * Payment Adapter Types
 *
 * Defines type-safe interfaces for payment processor integrations.
 * All adapters must implement these interfaces to ensure consistency.
 *
 * Security: No PAN/CVV data in these types - tokens only
 */

import { type Currency, type PaymentProcessor } from '@prisma/client';

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Payment result status
 */
export type PaymentResultStatus = 'success' | 'pending' | 'failed' | 'cancelled';

/**
 * Recurring frequency
 */
export type RecurringFrequency = 'monthly' | 'quarterly' | 'annually';

/**
 * Webhook event type
 */
export type WebhookEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.pending'
  | 'payment.refunded'
  | 'payment.disputed'
  | 'payment.chargeback'
  | 'mandate.created'
  | 'mandate.updated'
  | 'mandate.cancelled'
  | 'mandate.failed'
  | 'payout.paid'
  | 'unknown';

/**
 * Fee calculation structure
 */
export interface FeeCalculation {
  percentage: number; // e.g., 0.029 for 2.9%
  fixed: number; // e.g., 0.30 for $0.30
  calculatedFee: number; // Actual fee amount
  totalAmount: number; // Original amount + fee (if donor covers)
}

// ============================================================================
// PAYMENT INTENT
// ============================================================================

/**
 * Payment intent creation parameters
 */
export interface CreatePaymentIntentParams {
  amount: number; // Amount in currency's smallest unit (e.g., cents for USD)
  currency: Currency;
  donorEmail: string;
  donorName?: string;
  donorCoversFee?: boolean;
  metadata?: Record<string, string>;
  idempotencyKey: string; // Required for all payment operations
}

/**
 * Payment intent result
 */
export interface PaymentIntentResult {
  paymentIntentId: string; // Processor's payment intent ID
  clientSecret?: string; // Client secret for frontend confirmation
  status: PaymentResultStatus;
  amount: number;
  currency: Currency;
  processorFee?: number;
  netAmount?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// HOSTED FIELDS
// ============================================================================

/**
 * Hosted fields configuration
 */
export interface HostedFieldsConfig {
  containerId: string; // DOM element ID to mount hosted fields
  styles?: Record<string, unknown>; // Custom styling
  locale?: string; // e.g., "en-US"
  returnUrl?: string; // URL to redirect after payment (for redirect flows)
}

/**
 * Hosted fields result
 */
export interface HostedFieldsResult {
  html?: string; // HTML snippet to inject (for server-side rendering)
  scriptUrl?: string; // Script URL to load (for client-side rendering)
  configuration: Record<string, unknown>; // Processor-specific config for client
  publicKey?: string; // Public API key for client-side initialization
}

// ============================================================================
// PAYMENT CONFIRMATION
// ============================================================================

/**
 * Payment confirmation parameters
 */
export interface ConfirmPaymentParams {
  paymentIntentId: string;
  paymentMethodToken?: string; // Token from hosted fields
  metadata?: Record<string, string>;
}

/**
 * Payment confirmation result
 */
export interface PaymentConfirmationResult {
  status: PaymentResultStatus;
  transactionId: string; // Processor's transaction/charge ID
  amount: number;
  currency: Currency;
  processorFee?: number;
  netAmount?: number;
  receiptUrl?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// REFUND
// ============================================================================

/**
 * Refund parameters
 */
export interface RefundParams {
  paymentIntentId?: string; // Payment intent to refund
  transactionId?: string; // Or transaction ID
  amount?: number; // Partial refund amount (omit for full refund)
  reason?: string;
  metadata?: Record<string, string>;
  idempotencyKey: string;
}

/**
 * Refund result
 */
export interface RefundResult {
  refundId: string;
  status: 'pending' | 'succeeded' | 'failed';
  amount: number;
  currency: Currency;
  transactionId: string;
}

// ============================================================================
// RECURRING MANDATE
// ============================================================================

/**
 * Recurring mandate creation parameters
 */
export interface CreateRecurringMandateParams {
  amount: number;
  currency: Currency;
  frequency: RecurringFrequency;
  donorEmail: string;
  donorName?: string;
  donorCoversFee?: boolean;
  startDate?: Date; // First charge date
  paymentMethodToken?: string; // Token from hosted fields
  metadata?: Record<string, string>;
  idempotencyKey: string;
}

/**
 * Recurring mandate result
 */
export interface RecurringMandateResult {
  mandateId: string; // Processor's subscription/mandate ID
  status: 'active' | 'pending' | 'cancelled';
  amount: number;
  currency: Currency;
  frequency: RecurringFrequency;
  nextChargeDate: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Update recurring mandate parameters
 */
export interface UpdateRecurringMandateParams {
  mandateId: string;
  amount?: number;
  paymentMethodToken?: string; // Update payment method
  metadata?: Record<string, string>;
}

/**
 * Cancel recurring mandate parameters
 */
export interface CancelRecurringMandateParams {
  mandateId: string;
  reason?: string;
  cancelImmediately?: boolean; // Cancel now vs. at end of billing period
}

// ============================================================================
// WEBHOOK
// ============================================================================

/**
 * Webhook verification parameters
 */
export interface WebhookVerificationParams {
  payload: string | Buffer; // Raw webhook payload
  signature: string; // HMAC signature from processor
  secret: string; // Webhook secret for verification
  timestamp?: string; // Optional timestamp (for replay attack prevention)
}

/**
 * Webhook event structure
 */
export interface WebhookEvent {
  id: string; // Unique event ID from processor
  type: WebhookEventType;
  processor: PaymentProcessor;
  data: {
    paymentIntentId?: string;
    transactionId?: string;
    mandateId?: string;
    status?: PaymentResultStatus;
    amount?: number;
    currency?: Currency;
    failureReason?: string;
    metadata?: Record<string, unknown>;
  };
  createdAt: Date;
  raw: Record<string, unknown>; // Full webhook payload for debugging
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Payment adapter error codes
 */
export enum PaymentErrorCode {
  // Network/API errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  API_ERROR = 'API_ERROR',

  // Authentication errors
  INVALID_API_KEY = 'INVALID_API_KEY',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',

  // Payment errors
  CARD_DECLINED = 'CARD_DECLINED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  EXPIRED_CARD = 'EXPIRED_CARD',
  INVALID_CARD = 'INVALID_CARD',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // Webhook errors
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  WEBHOOK_PROCESSING_FAILED = 'WEBHOOK_PROCESSING_FAILED',

  // Idempotency errors
  IDEMPOTENCY_KEY_REUSED = 'IDEMPOTENCY_KEY_REUSED',

  // General errors
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  REFUND_FAILED = 'REFUND_FAILED',
  MANDATE_CREATION_FAILED = 'MANDATE_CREATION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Payment adapter error
 */
export class PaymentAdapterError extends Error {
  constructor(
    public readonly code: PaymentErrorCode,
    message: string,
    public readonly processorCode?: string,
    public readonly processorMessage?: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PaymentAdapterError';
    Object.setPrototypeOf(this, PaymentAdapterError.prototype);
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    const retryableCodes = [
      PaymentErrorCode.NETWORK_ERROR,
      PaymentErrorCode.TIMEOUT,
      PaymentErrorCode.API_ERROR,
    ];
    return retryableCodes.includes(this.code);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    const userMessages: Record<PaymentErrorCode, string> = {
      [PaymentErrorCode.NETWORK_ERROR]: 'A network error occurred. Please try again.',
      [PaymentErrorCode.TIMEOUT]: 'The request timed out. Please try again.',
      [PaymentErrorCode.API_ERROR]: 'A temporary error occurred. Please try again.',
      [PaymentErrorCode.INVALID_API_KEY]: 'Payment system configuration error. Please contact support.',
      [PaymentErrorCode.AUTHENTICATION_FAILED]: 'Payment system authentication failed. Please contact support.',
      [PaymentErrorCode.CARD_DECLINED]: 'Your card was declined. Please try a different payment method.',
      [PaymentErrorCode.INSUFFICIENT_FUNDS]: 'Insufficient funds. Please try a different payment method.',
      [PaymentErrorCode.EXPIRED_CARD]: 'Your card has expired. Please use a different payment method.',
      [PaymentErrorCode.INVALID_CARD]: 'Invalid card details. Please check and try again.',
      [PaymentErrorCode.PAYMENT_FAILED]: 'Payment failed. Please try again or use a different payment method.',
      [PaymentErrorCode.INVALID_SIGNATURE]: 'Invalid webhook signature.',
      [PaymentErrorCode.WEBHOOK_PROCESSING_FAILED]: 'Webhook processing failed.',
      [PaymentErrorCode.IDEMPOTENCY_KEY_REUSED]: 'This request has already been processed.',
      [PaymentErrorCode.INVALID_AMOUNT]: 'Invalid payment amount.',
      [PaymentErrorCode.INVALID_CURRENCY]: 'Invalid currency.',
      [PaymentErrorCode.REFUND_FAILED]: 'Refund failed. Please contact support.',
      [PaymentErrorCode.MANDATE_CREATION_FAILED]: 'Failed to set up recurring payment. Please try again.',
      [PaymentErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again or contact support.',
    };

    return userMessages[this.code] || this.message;
  }
}

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number; // Maximum retry attempts
  initialDelayMs: number; // Initial delay before first retry
  maxDelayMs: number; // Maximum delay between retries
  backoffMultiplier: number; // Exponential backoff multiplier
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 4000,
  backoffMultiplier: 2,
};
