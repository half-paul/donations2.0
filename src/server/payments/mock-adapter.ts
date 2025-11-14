/**
 * Mock Payment Adapter
 *
 * Test double for payment processor adapters.
 * Useful for unit testing and local development.
 *
 * Features:
 * - Configurable success/failure responses
 * - Simulated delays
 * - No external API calls
 * - Deterministic behavior based on input
 */

import crypto from 'crypto';
import { BasePaymentAdapter } from './adapter';
import {
  PaymentAdapterError,
  PaymentErrorCode,
  type CreatePaymentIntentParams,
  type PaymentIntentResult,
  type HostedFieldsConfig,
  type HostedFieldsResult,
  type ConfirmPaymentParams,
  type PaymentConfirmationResult,
  type RefundParams,
  type RefundResult,
  type CreateRecurringMandateParams,
  type RecurringMandateResult,
  type UpdateRecurringMandateParams,
  type CancelRecurringMandateParams,
  type WebhookVerificationParams,
  type WebhookEvent,
  type FeeCalculation,
} from './types';

/**
 * Mock adapter configuration
 */
export interface MockAdapterConfig {
  apiKey?: string;
  webhookSecret?: string;
  testMode?: boolean;
  behavior?: {
    shouldSucceed?: boolean; // Default: true
    shouldDelay?: boolean; // Default: false
    delayMs?: number; // Default: 100
    failureCode?: PaymentErrorCode; // Error code to return on failure
  };
}

/**
 * Mock Payment Adapter Implementation
 */
export class MockAdapter extends BasePaymentAdapter {
  readonly name = 'Mock';

  private readonly shouldSucceed: boolean;
  private readonly shouldDelay: boolean;
  private readonly delayMs: number;
  private readonly failureCode: PaymentErrorCode;

  // Mock fee structure (same as Stripe for consistency)
  private readonly FEE_PERCENTAGE = 0.029;
  private readonly FEE_FIXED_USD = 0.30;

  // In-memory storage for testing
  private paymentIntents = new Map<string, any>();
  private mandates = new Map<string, any>();

  constructor(config: MockAdapterConfig = {}) {
    super({
      apiKey: config.apiKey ?? 'mock_api_key',
      webhookSecret: config.webhookSecret ?? 'mock_webhook_secret',
      testMode: config.testMode ?? true,
    });

    this.shouldSucceed = config.behavior?.shouldSucceed ?? true;
    this.shouldDelay = config.behavior?.shouldDelay ?? false;
    this.delayMs = config.behavior?.delayMs ?? 100;
    this.failureCode = config.behavior?.failureCode ?? PaymentErrorCode.PAYMENT_FAILED;
  }

  protected getBaseUrl(): string {
    return 'https://mock-payment-processor.example.com';
  }

  /**
   * Calculate mock fees
   */
  calculateFees(amount: number, donorCoversFee: boolean): FeeCalculation {
    const amountInDollars = amount / 100;
    const calculatedFee = Math.round((amountInDollars * this.FEE_PERCENTAGE + this.FEE_FIXED_USD) * 100);
    const totalAmount = donorCoversFee ? amount + calculatedFee : amount;

    return {
      percentage: this.FEE_PERCENTAGE,
      fixed: this.FEE_FIXED_USD * 100,
      calculatedFee,
      totalAmount,
    };
  }

  /**
   * Create mock payment intent
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    await this.simulateDelay();

    if (!this.shouldSucceed) {
      throw new PaymentAdapterError(this.failureCode, 'Mock payment failed');
    }

    const fees = this.calculateFees(params.amount, params.donorCoversFee ?? false);
    const intentId = `mock_pi_${this.generateId()}`;
    const clientSecret = `${intentId}_secret_${this.generateId()}`;

    // Store for later retrieval
    this.paymentIntents.set(intentId, {
      id: intentId,
      amount: fees.totalAmount,
      currency: params.currency,
      status: 'pending',
      metadata: params.metadata,
      createdAt: new Date(),
    });

    return {
      paymentIntentId: intentId,
      clientSecret,
      status: 'pending',
      amount: fees.totalAmount,
      currency: params.currency,
      processorFee: fees.calculatedFee,
      netAmount: params.amount,
    };
  }

  /**
   * Get mock hosted fields configuration
   */
  getHostedFieldsConfig(config: HostedFieldsConfig): HostedFieldsResult {
    return {
      scriptUrl: 'https://mock-payment-processor.example.com/v3/mock.js',
      publicKey: 'mock_pk_test_123456',
      configuration: {
        containerId: config.containerId,
        locale: config.locale ?? 'en-US',
        theme: 'mock',
      },
    };
  }

  /**
   * Confirm mock payment
   */
  async confirmPayment(params: ConfirmPaymentParams): Promise<PaymentConfirmationResult> {
    await this.simulateDelay();

    if (!this.shouldSucceed) {
      throw new PaymentAdapterError(this.failureCode, 'Mock payment confirmation failed');
    }

    const intent = this.paymentIntents.get(params.paymentIntentId);

    if (!intent) {
      throw new PaymentAdapterError(
        PaymentErrorCode.PAYMENT_FAILED,
        'Payment intent not found'
      );
    }

    // Update status
    intent.status = 'success';
    intent.completedAt = new Date();

    const transactionId = `mock_ch_${this.generateId()}`;

    return {
      status: 'success',
      transactionId,
      amount: intent.amount,
      currency: intent.currency,
      receiptUrl: `https://mock-payment-processor.example.com/receipts/${transactionId}`,
    };
  }

  /**
   * Refund mock payment
   */
  async refundPayment(params: RefundParams): Promise<RefundResult> {
    await this.simulateDelay();

    if (!this.shouldSucceed) {
      throw new PaymentAdapterError(PaymentErrorCode.REFUND_FAILED, 'Mock refund failed');
    }

    const refundId = `mock_re_${this.generateId()}`;

    return {
      refundId,
      status: 'succeeded',
      amount: params.amount ?? 0,
      currency: 'USD',
      transactionId: params.transactionId ?? params.paymentIntentId ?? '',
    };
  }

  /**
   * Create mock recurring mandate
   */
  async createRecurringMandate(
    params: CreateRecurringMandateParams
  ): Promise<RecurringMandateResult> {
    await this.simulateDelay();

    if (!this.shouldSucceed) {
      throw new PaymentAdapterError(
        PaymentErrorCode.MANDATE_CREATION_FAILED,
        'Mock mandate creation failed'
      );
    }

    const fees = this.calculateFees(params.amount, params.donorCoversFee ?? false);
    const mandateId = `mock_sub_${this.generateId()}`;

    const nextChargeDate = this.calculateNextChargeDate(params.frequency, params.startDate);

    // Store for later retrieval
    this.mandates.set(mandateId, {
      id: mandateId,
      amount: fees.totalAmount,
      currency: params.currency,
      frequency: params.frequency,
      status: 'active',
      nextChargeDate,
      metadata: params.metadata,
      createdAt: new Date(),
    });

    return {
      mandateId,
      status: 'active',
      amount: fees.totalAmount,
      currency: params.currency,
      frequency: params.frequency,
      nextChargeDate,
    };
  }

  /**
   * Update mock recurring mandate
   */
  async updateRecurringMandate(
    params: UpdateRecurringMandateParams
  ): Promise<RecurringMandateResult> {
    await this.simulateDelay();

    if (!this.shouldSucceed) {
      throw new PaymentAdapterError(PaymentErrorCode.API_ERROR, 'Mock mandate update failed');
    }

    const mandate = this.mandates.get(params.mandateId);

    if (!mandate) {
      throw new PaymentAdapterError(PaymentErrorCode.API_ERROR, 'Mandate not found');
    }

    // Update mandate
    if (params.amount) {
      mandate.amount = params.amount;
    }
    if (params.metadata) {
      mandate.metadata = { ...mandate.metadata, ...params.metadata };
    }

    return {
      mandateId: mandate.id,
      status: mandate.status,
      amount: mandate.amount,
      currency: mandate.currency,
      frequency: mandate.frequency,
      nextChargeDate: mandate.nextChargeDate,
    };
  }

  /**
   * Cancel mock recurring mandate
   */
  async cancelRecurringMandate(
    params: CancelRecurringMandateParams
  ): Promise<RecurringMandateResult> {
    await this.simulateDelay();

    if (!this.shouldSucceed) {
      throw new PaymentAdapterError(PaymentErrorCode.API_ERROR, 'Mock mandate cancellation failed');
    }

    const mandate = this.mandates.get(params.mandateId);

    if (!mandate) {
      throw new PaymentAdapterError(PaymentErrorCode.API_ERROR, 'Mandate not found');
    }

    // Update status
    mandate.status = 'cancelled';
    mandate.cancelledAt = new Date();

    return {
      mandateId: mandate.id,
      status: 'cancelled',
      amount: mandate.amount,
      currency: mandate.currency,
      frequency: mandate.frequency,
      nextChargeDate: mandate.nextChargeDate,
    };
  }

  /**
   * Verify mock webhook signature
   */
  verifyWebhookSignature(params: WebhookVerificationParams): boolean {
    const payload = typeof params.payload === 'string' ? params.payload : params.payload.toString();

    // Simple HMAC verification
    const computedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(computedSignature, 'hex'),
        Buffer.from(params.signature, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Parse mock webhook event
   */
  parseWebhookEvent(payload: unknown): WebhookEvent {
    const event = payload as any;

    return {
      id: event.id ?? `mock_evt_${this.generateId()}`,
      type: event.type ?? 'payment.succeeded',
      processor: 'stripe', // Mock as Stripe for compatibility
      data: {
        paymentIntentId: event.data?.paymentIntentId,
        transactionId: event.data?.transactionId,
        mandateId: event.data?.mandateId,
        status: event.data?.status ?? 'success',
        amount: event.data?.amount,
        currency: event.data?.currency ?? 'USD',
        metadata: event.data?.metadata,
      },
      createdAt: new Date(event.created ?? Date.now()),
      raw: event,
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private async simulateDelay(): Promise<void> {
    if (this.shouldDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
  }

  private generateId(): string {
    return crypto.randomBytes(12).toString('hex');
  }

  private calculateNextChargeDate(frequency: string, startDate?: Date): Date {
    const date = startDate ?? new Date();

    switch (frequency) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'annually':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date;
  }

  /**
   * Test helper: Get stored payment intent
   */
  getPaymentIntent(id: string): any {
    return this.paymentIntents.get(id);
  }

  /**
   * Test helper: Get stored mandate
   */
  getMandate(id: string): any {
    return this.mandates.get(id);
  }

  /**
   * Test helper: Clear all stored data
   */
  clearData(): void {
    this.paymentIntents.clear();
    this.mandates.clear();
  }

  /**
   * Test helper: Generate webhook signature
   */
  generateWebhookSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');
  }
}
