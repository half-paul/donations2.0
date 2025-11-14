/**
 * Payment Adapter Interface
 *
 * Defines the contract that all payment processor adapters must implement.
 * This abstraction enables pluggable payment processors while maintaining
 * a consistent interface for the application.
 *
 * Security: All adapters must:
 * - Use hosted fields/tokenization (no PAN/CVV handling)
 * - Verify webhook signatures using HMAC
 * - Implement idempotency for all payment operations
 * - Never log sensitive payment data
 *
 * PCI Compliance: SAQ-A-EP (hosted fields only)
 */

import type {
  CreatePaymentIntentParams,
  PaymentIntentResult,
  HostedFieldsConfig,
  HostedFieldsResult,
  ConfirmPaymentParams,
  PaymentConfirmationResult,
  RefundParams,
  RefundResult,
  CreateRecurringMandateParams,
  RecurringMandateResult,
  UpdateRecurringMandateParams,
  CancelRecurringMandateParams,
  WebhookVerificationParams,
  WebhookEvent,
  FeeCalculation,
} from './types';

/**
 * Base Payment Adapter Interface
 *
 * All payment processor implementations must extend this interface.
 */
export interface PaymentAdapter {
  /**
   * Get the processor name
   */
  readonly name: string;

  /**
   * Calculate processor fees
   *
   * @param amount - Payment amount in smallest currency unit
   * @param donorCoversFee - Whether donor is covering the fee
   * @returns Fee calculation details
   */
  calculateFees(amount: number, donorCoversFee: boolean): FeeCalculation;

  // ==========================================================================
  // ONE-TIME PAYMENTS
  // ==========================================================================

  /**
   * Create a payment intent
   *
   * This initiates a payment session and returns the necessary data for
   * the frontend to complete the payment flow.
   *
   * @param params - Payment intent parameters
   * @returns Payment intent result with client secret
   * @throws PaymentAdapterError on failure
   */
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;

  /**
   * Get hosted fields configuration
   *
   * Returns configuration for embedding payment fields in the frontend.
   * This enables PCI-compliant payment collection without handling card data.
   *
   * @param config - Hosted fields configuration
   * @returns Hosted fields setup data
   */
  getHostedFieldsConfig(config: HostedFieldsConfig): HostedFieldsResult;

  /**
   * Confirm a payment
   *
   * Completes a payment that was initiated with createPaymentIntent.
   * Some processors auto-confirm on payment method collection, others require
   * explicit confirmation.
   *
   * @param params - Payment confirmation parameters
   * @returns Payment confirmation result
   * @throws PaymentAdapterError on failure
   */
  confirmPayment(params: ConfirmPaymentParams): Promise<PaymentConfirmationResult>;

  /**
   * Refund a payment
   *
   * Issues a full or partial refund for a completed payment.
   *
   * @param params - Refund parameters
   * @returns Refund result
   * @throws PaymentAdapterError on failure
   */
  refundPayment(params: RefundParams): Promise<RefundResult>;

  // ==========================================================================
  // RECURRING PAYMENTS
  // ==========================================================================

  /**
   * Create a recurring payment mandate
   *
   * Sets up a subscription or recurring payment schedule.
   *
   * @param params - Recurring mandate parameters
   * @returns Recurring mandate result
   * @throws PaymentAdapterError on failure
   */
  createRecurringMandate(
    params: CreateRecurringMandateParams
  ): Promise<RecurringMandateResult>;

  /**
   * Update a recurring payment mandate
   *
   * Modifies an existing recurring payment (amount, payment method, etc.)
   *
   * @param params - Update parameters
   * @returns Updated mandate result
   * @throws PaymentAdapterError on failure
   */
  updateRecurringMandate(
    params: UpdateRecurringMandateParams
  ): Promise<RecurringMandateResult>;

  /**
   * Cancel a recurring payment mandate
   *
   * Cancels an active recurring payment.
   *
   * @param params - Cancellation parameters
   * @returns Cancelled mandate result
   * @throws PaymentAdapterError on failure
   */
  cancelRecurringMandate(
    params: CancelRecurringMandateParams
  ): Promise<RecurringMandateResult>;

  // ==========================================================================
  // WEBHOOKS
  // ==========================================================================

  /**
   * Verify webhook signature
   *
   * Validates that a webhook request is authentic using HMAC signature
   * verification. This is CRITICAL for security - never process unverified webhooks.
   *
   * @param params - Webhook verification parameters
   * @returns true if signature is valid
   * @throws PaymentAdapterError with INVALID_SIGNATURE code if verification fails
   */
  verifyWebhookSignature(params: WebhookVerificationParams): boolean;

  /**
   * Parse and handle webhook event
   *
   * Converts processor-specific webhook payload into standardized WebhookEvent.
   * This method should be called AFTER signature verification.
   *
   * @param payload - Raw webhook payload (already verified)
   * @returns Standardized webhook event
   * @throws PaymentAdapterError on parsing failure
   */
  parseWebhookEvent(payload: unknown): WebhookEvent;
}

/**
 * Abstract base class for payment adapters
 *
 * Provides common functionality for all adapters.
 */
export abstract class BasePaymentAdapter implements PaymentAdapter {
  abstract readonly name: string;

  constructor(
    protected readonly config: {
      apiKey: string;
      webhookSecret: string;
      testMode?: boolean;
    }
  ) {
    if (!config.apiKey) {
      throw new Error(`Missing API key for ${this.name} adapter`);
    }
    if (!config.webhookSecret) {
      throw new Error(`Missing webhook secret for ${this.name} adapter`);
    }
  }

  /**
   * Get API base URL based on test mode
   */
  protected getBaseUrl(): string {
    throw new Error('getBaseUrl must be implemented by subclass');
  }

  /**
   * Calculate fees with processor-specific rates
   */
  abstract calculateFees(amount: number, donorCoversFee: boolean): FeeCalculation;

  // Payment operations
  abstract createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResult>;

  abstract getHostedFieldsConfig(config: HostedFieldsConfig): HostedFieldsResult;

  abstract confirmPayment(params: ConfirmPaymentParams): Promise<PaymentConfirmationResult>;

  abstract refundPayment(params: RefundParams): Promise<RefundResult>;

  // Recurring operations
  abstract createRecurringMandate(
    params: CreateRecurringMandateParams
  ): Promise<RecurringMandateResult>;

  abstract updateRecurringMandate(
    params: UpdateRecurringMandateParams
  ): Promise<RecurringMandateResult>;

  abstract cancelRecurringMandate(
    params: CancelRecurringMandateParams
  ): Promise<RecurringMandateResult>;

  // Webhook operations
  abstract verifyWebhookSignature(params: WebhookVerificationParams): boolean;

  abstract parseWebhookEvent(payload: unknown): WebhookEvent;

  /**
   * Helper to execute operation with retry logic
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    config?: { maxAttempts?: number; delayMs?: number }
  ): Promise<T> {
    const maxAttempts = config?.maxAttempts ?? 3;
    const initialDelay = config?.delayMs ?? 1000;

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          break;
        }

        // Calculate exponential backoff delay
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Helper to make HTTP request with timeout
   */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<Response> {
    const { timeout = 30000, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
