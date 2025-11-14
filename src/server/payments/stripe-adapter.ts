/**
 * Stripe Payment Adapter
 *
 * Implements PaymentAdapter interface for Stripe payment processor.
 *
 * Features:
 * - Stripe Elements for hosted payment fields
 * - Automatic payment confirmation
 * - Subscription management for recurring payments
 * - Webhook signature verification with stripe-signature header
 *
 * Fee Structure: 2.9% + $0.30 per transaction
 *
 * Documentation: https://stripe.com/docs/api
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
  type RecurringFrequency,
  type WebhookEventType,
} from './types';

/**
 * Stripe adapter configuration
 */
interface StripeAdapterConfig {
  apiKey: string; // Secret key (sk_test_... or sk_live_...)
  webhookSecret: string; // Webhook signing secret (whsec_...)
  testMode?: boolean;
  publishableKey: string; // Public key for client-side (pk_test_... or pk_live_...)
}

/**
 * Stripe API response types (simplified)
 */
interface StripePaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  metadata?: Record<string, string>;
  charges?: {
    data: Array<{
      id: string;
      amount: number;
      balance_transaction?: string;
      receipt_url?: string;
    }>;
  };
}

interface StripeSubscription {
  id: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  current_period_end: number;
  items: {
    data: Array<{
      price: {
        unit_amount: number;
        currency: string;
        recurring: {
          interval: 'month' | 'year';
        };
      };
    }>;
  };
  metadata?: Record<string, string>;
}

interface StripeRefund {
  id: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  amount: number;
  currency: string;
  charge: string;
}

interface StripeWebhookEvent {
  id: string;
  type: string;
  created: number;
  data: {
    object: unknown;
  };
}

/**
 * Stripe Payment Adapter Implementation
 */
export class StripeAdapter extends BasePaymentAdapter {
  readonly name = 'Stripe';
  private readonly publishableKey: string;

  // Stripe fee structure
  private readonly FEE_PERCENTAGE = 0.029; // 2.9%
  private readonly FEE_FIXED_USD = 0.30; // $0.30

  constructor(config: StripeAdapterConfig) {
    super({
      apiKey: config.apiKey,
      webhookSecret: config.webhookSecret,
      testMode: config.testMode,
    });
    this.publishableKey = config.publishableKey;
  }

  protected getBaseUrl(): string {
    return 'https://api.stripe.com/v1';
  }

  /**
   * Calculate Stripe fees
   */
  calculateFees(amount: number, donorCoversFee: boolean): FeeCalculation {
    // Convert from cents to dollars for calculation
    const amountInDollars = amount / 100;

    // Stripe fee: 2.9% + $0.30
    const calculatedFee = Math.round((amountInDollars * this.FEE_PERCENTAGE + this.FEE_FIXED_USD) * 100);

    // If donor covers fee, add it to the total
    const totalAmount = donorCoversFee ? amount + calculatedFee : amount;

    return {
      percentage: this.FEE_PERCENTAGE,
      fixed: this.FEE_FIXED_USD * 100, // Convert to cents
      calculatedFee,
      totalAmount,
    };
  }

  /**
   * Create Stripe payment intent
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    try {
      // Calculate fees
      const fees = this.calculateFees(params.amount, params.donorCoversFee ?? false);

      const response = await this.withRetry(async () => {
        return await this.fetchWithTimeout(`${this.getBaseUrl()}/payment_intents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Idempotency-Key': params.idempotencyKey,
          },
          body: new URLSearchParams({
            amount: fees.totalAmount.toString(),
            currency: params.currency.toLowerCase(),
            'metadata[donorEmail]': params.donorEmail,
            'metadata[donorName]': params.donorName ?? '',
            'metadata[donorCoversFee]': params.donorCoversFee ? 'true' : 'false',
            'metadata[originalAmount]': params.amount.toString(),
            'metadata[feeAmount]': fees.calculatedFee.toString(),
            ...this.flattenMetadata(params.metadata),
          }),
        });
      });

      if (!response.ok) {
        throw await this.handleStripeError(response);
      }

      const intent: StripePaymentIntent = await response.json();

      return {
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
        status: this.mapStripeStatus(intent.status),
        amount: fees.totalAmount,
        currency: params.currency,
        processorFee: fees.calculatedFee,
        netAmount: params.amount,
      };
    } catch (error) {
      if (error instanceof PaymentAdapterError) {
        throw error;
      }
      throw new PaymentAdapterError(
        PaymentErrorCode.API_ERROR,
        'Failed to create Stripe payment intent',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Get Stripe Elements configuration
   */
  getHostedFieldsConfig(config: HostedFieldsConfig): HostedFieldsResult {
    return {
      scriptUrl: 'https://js.stripe.com/v3/',
      publicKey: this.publishableKey,
      configuration: {
        containerId: config.containerId,
        locale: config.locale ?? 'auto',
        appearance: config.styles ?? {
          theme: 'stripe',
        },
      },
    };
  }

  /**
   * Confirm Stripe payment
   *
   * Note: Stripe auto-confirms when payment method is attached.
   * This method retrieves the payment intent to get final status.
   */
  async confirmPayment(params: ConfirmPaymentParams): Promise<PaymentConfirmationResult> {
    try {
      const response = await this.withRetry(async () => {
        return await this.fetchWithTimeout(
          `${this.getBaseUrl()}/payment_intents/${params.paymentIntentId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
            },
          }
        );
      });

      if (!response.ok) {
        throw await this.handleStripeError(response);
      }

      const intent: StripePaymentIntent = await response.json();
      const charge = intent.charges?.data[0];

      return {
        status: this.mapStripeStatus(intent.status),
        transactionId: charge?.id ?? intent.id,
        amount: intent.amount,
        currency: intent.currency.toUpperCase() as 'USD' | 'CAD' | 'EUR',
        receiptUrl: charge?.receipt_url,
      };
    } catch (error) {
      if (error instanceof PaymentAdapterError) {
        throw error;
      }
      throw new PaymentAdapterError(
        PaymentErrorCode.PAYMENT_FAILED,
        'Failed to confirm Stripe payment',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Refund Stripe payment
   */
  async refundPayment(params: RefundParams): Promise<RefundResult> {
    try {
      // Get payment intent to find charge ID
      let chargeId = params.transactionId;

      if (!chargeId && params.paymentIntentId) {
        const intentResponse = await this.fetchWithTimeout(
          `${this.getBaseUrl()}/payment_intents/${params.paymentIntentId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
            },
          }
        );

        if (intentResponse.ok) {
          const intent: StripePaymentIntent = await intentResponse.json();
          chargeId = intent.charges?.data[0]?.id;
        }
      }

      if (!chargeId) {
        throw new PaymentAdapterError(
          PaymentErrorCode.REFUND_FAILED,
          'No charge ID found for refund'
        );
      }

      const refundParams: Record<string, string> = {
        charge: chargeId,
      };

      if (params.amount) {
        refundParams.amount = params.amount.toString();
      }

      if (params.reason) {
        refundParams.reason = params.reason;
      }

      const response = await this.withRetry(async () => {
        return await this.fetchWithTimeout(`${this.getBaseUrl()}/refunds`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Idempotency-Key': params.idempotencyKey,
          },
          body: new URLSearchParams(refundParams),
        });
      });

      if (!response.ok) {
        throw await this.handleStripeError(response);
      }

      const refund: StripeRefund = await response.json();

      return {
        refundId: refund.id,
        status: refund.status === 'succeeded' ? 'succeeded' : refund.status === 'pending' ? 'pending' : 'failed',
        amount: refund.amount,
        currency: refund.currency.toUpperCase() as 'USD' | 'CAD' | 'EUR',
        transactionId: refund.charge,
      };
    } catch (error) {
      if (error instanceof PaymentAdapterError) {
        throw error;
      }
      throw new PaymentAdapterError(
        PaymentErrorCode.REFUND_FAILED,
        'Failed to process Stripe refund',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Create Stripe subscription (recurring mandate)
   */
  async createRecurringMandate(
    params: CreateRecurringMandateParams
  ): Promise<RecurringMandateResult> {
    try {
      // First, create a customer
      const customerResponse = await this.fetchWithTimeout(`${this.getBaseUrl()}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: params.donorEmail,
          name: params.donorName ?? '',
          ...(params.paymentMethodToken && { payment_method: params.paymentMethodToken }),
        }),
      });

      if (!customerResponse.ok) {
        throw await this.handleStripeError(customerResponse);
      }

      const customer: { id: string } = await customerResponse.json();

      // Create subscription
      const fees = this.calculateFees(params.amount, params.donorCoversFee ?? false);
      const interval = this.mapFrequencyToInterval(params.frequency);

      const subscriptionParams: Record<string, string> = {
        customer: customer.id,
        'items[0][price_data][currency]': params.currency.toLowerCase(),
        'items[0][price_data][unit_amount]': fees.totalAmount.toString(),
        'items[0][price_data][recurring][interval]': interval,
        'items[0][price_data][product_data][name]': 'Recurring Donation',
        'metadata[donorEmail]': params.donorEmail,
        'metadata[donorCoversFee]': params.donorCoversFee ? 'true' : 'false',
        'metadata[originalAmount]': params.amount.toString(),
        'metadata[feeAmount]': fees.calculatedFee.toString(),
        ...this.flattenMetadata(params.metadata),
      };

      if (params.paymentMethodToken) {
        subscriptionParams.default_payment_method = params.paymentMethodToken;
      }

      const response = await this.withRetry(async () => {
        return await this.fetchWithTimeout(`${this.getBaseUrl()}/subscriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Idempotency-Key': params.idempotencyKey,
          },
          body: new URLSearchParams(subscriptionParams),
        });
      });

      if (!response.ok) {
        throw await this.handleStripeError(response);
      }

      const subscription: StripeSubscription = await response.json();

      return {
        mandateId: subscription.id,
        status: subscription.status === 'active' ? 'active' : subscription.status === 'canceled' ? 'cancelled' : 'pending',
        amount: fees.totalAmount,
        currency: params.currency,
        frequency: params.frequency,
        nextChargeDate: new Date(subscription.current_period_end * 1000),
      };
    } catch (error) {
      if (error instanceof PaymentAdapterError) {
        throw error;
      }
      throw new PaymentAdapterError(
        PaymentErrorCode.MANDATE_CREATION_FAILED,
        'Failed to create Stripe subscription',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Update Stripe subscription
   */
  async updateRecurringMandate(
    params: UpdateRecurringMandateParams
  ): Promise<RecurringMandateResult> {
    try {
      const updateParams: Record<string, string> = {};

      if (params.paymentMethodToken) {
        updateParams.default_payment_method = params.paymentMethodToken;
      }

      if (params.metadata) {
        Object.assign(updateParams, this.flattenMetadata(params.metadata));
      }

      const response = await this.withRetry(async () => {
        return await this.fetchWithTimeout(
          `${this.getBaseUrl()}/subscriptions/${params.mandateId}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(updateParams),
          }
        );
      });

      if (!response.ok) {
        throw await this.handleStripeError(response);
      }

      const subscription: StripeSubscription = await response.json();
      const priceData = subscription.items.data[0]?.price;

      return {
        mandateId: subscription.id,
        status: subscription.status === 'active' ? 'active' : subscription.status === 'canceled' ? 'cancelled' : 'pending',
        amount: priceData?.unit_amount ?? 0,
        currency: (priceData?.currency.toUpperCase() as 'USD' | 'CAD' | 'EUR') ?? 'USD',
        frequency: this.mapIntervalToFrequency(priceData?.recurring.interval ?? 'month'),
        nextChargeDate: new Date(subscription.current_period_end * 1000),
      };
    } catch (error) {
      if (error instanceof PaymentAdapterError) {
        throw error;
      }
      throw new PaymentAdapterError(
        PaymentErrorCode.API_ERROR,
        'Failed to update Stripe subscription',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Cancel Stripe subscription
   */
  async cancelRecurringMandate(
    params: CancelRecurringMandateParams
  ): Promise<RecurringMandateResult> {
    try {
      const endpoint = params.cancelImmediately
        ? `${this.getBaseUrl()}/subscriptions/${params.mandateId}`
        : `${this.getBaseUrl()}/subscriptions/${params.mandateId}`;

      const response = await this.withRetry(async () => {
        return await this.fetchWithTimeout(endpoint, {
          method: params.cancelImmediately ? 'DELETE' : 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.cancelImmediately
            ? undefined
            : new URLSearchParams({ cancel_at_period_end: 'true' }),
        });
      });

      if (!response.ok) {
        throw await this.handleStripeError(response);
      }

      const subscription: StripeSubscription = await response.json();
      const priceData = subscription.items.data[0]?.price;

      return {
        mandateId: subscription.id,
        status: 'cancelled',
        amount: priceData?.unit_amount ?? 0,
        currency: (priceData?.currency.toUpperCase() as 'USD' | 'CAD' | 'EUR') ?? 'USD',
        frequency: this.mapIntervalToFrequency(priceData?.recurring.interval ?? 'month'),
        nextChargeDate: new Date(subscription.current_period_end * 1000),
      };
    } catch (error) {
      if (error instanceof PaymentAdapterError) {
        throw error;
      }
      throw new PaymentAdapterError(
        PaymentErrorCode.API_ERROR,
        'Failed to cancel Stripe subscription',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Verify Stripe webhook signature
   */
  verifyWebhookSignature(params: WebhookVerificationParams): boolean {
    try {
      const payload = typeof params.payload === 'string' ? params.payload : params.payload.toString();
      const signature = params.signature;

      // Extract timestamp and signatures from header
      const elements = signature.split(',');
      const timestampElement = elements.find((e) => e.startsWith('t='));
      const signatureElement = elements.find((e) => e.startsWith('v1='));

      if (!timestampElement || !signatureElement) {
        throw new PaymentAdapterError(
          PaymentErrorCode.INVALID_SIGNATURE,
          'Invalid Stripe webhook signature format'
        );
      }

      const timestamp = timestampElement.split('=')[1];
      const expectedSignature = signatureElement.split('=')[1];

      // Construct signed payload
      const signedPayload = `${timestamp}.${payload}`;

      // Compute HMAC
      const computedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');

      // Constant-time comparison
      return crypto.timingSafeEqual(
        Buffer.from(computedSignature, 'hex'),
        Buffer.from(expectedSignature!, 'hex')
      );
    } catch (error) {
      throw new PaymentAdapterError(
        PaymentErrorCode.INVALID_SIGNATURE,
        'Stripe webhook signature verification failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Parse Stripe webhook event
   */
  parseWebhookEvent(payload: unknown): WebhookEvent {
    const event = payload as StripeWebhookEvent;

    return {
      id: event.id,
      type: this.mapStripeEventType(event.type),
      processor: 'stripe',
      data: this.extractEventData(event),
      createdAt: new Date(event.created * 1000),
      raw: event,
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private mapStripeStatus(status: string): 'success' | 'pending' | 'failed' | 'cancelled' {
    switch (status) {
      case 'succeeded':
        return 'success';
      case 'processing':
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return 'pending';
      case 'canceled':
        return 'cancelled';
      default:
        return 'failed';
    }
  }

  private mapStripeEventType(type: string): WebhookEventType {
    const eventMap: Record<string, WebhookEventType> = {
      'payment_intent.succeeded': 'payment.succeeded',
      'payment_intent.payment_failed': 'payment.failed',
      'payment_intent.processing': 'payment.pending',
      'charge.refunded': 'payment.refunded',
      'charge.dispute.created': 'payment.disputed',
      'customer.subscription.created': 'mandate.created',
      'customer.subscription.updated': 'mandate.updated',
      'customer.subscription.deleted': 'mandate.cancelled',
      'invoice.payment_failed': 'mandate.failed',
    };

    return eventMap[type] ?? 'unknown';
  }

  private extractEventData(event: StripeWebhookEvent): WebhookEvent['data'] {
    const obj = event.data.object as any;

    return {
      paymentIntentId: obj.payment_intent ?? obj.id,
      transactionId: obj.charge ?? obj.id,
      mandateId: obj.subscription ?? obj.id,
      amount: obj.amount,
      currency: obj.currency?.toUpperCase(),
      metadata: obj.metadata,
    };
  }

  private mapFrequencyToInterval(frequency: RecurringFrequency): 'month' | 'year' {
    switch (frequency) {
      case 'monthly':
        return 'month';
      case 'quarterly':
        return 'month'; // Stripe doesn't have quarterly, use monthly with interval count
      case 'annually':
        return 'year';
    }
  }

  private mapIntervalToFrequency(interval: 'month' | 'year'): RecurringFrequency {
    return interval === 'year' ? 'annually' : 'monthly';
  }

  private flattenMetadata(metadata?: Record<string, string>): Record<string, string> {
    if (!metadata) return {};

    const flattened: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
      flattened[`metadata[${key}]`] = value;
    }
    return flattened;
  }

  private async handleStripeError(response: Response): Promise<PaymentAdapterError> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: { message: 'Unknown error' } };
    }

    const error = errorData.error;
    const code = this.mapStripeErrorCode(error.code ?? error.type);

    return new PaymentAdapterError(
      code,
      error.message ?? 'Stripe API error',
      error.code,
      error.message,
      { status: response.status }
    );
  }

  private mapStripeErrorCode(stripeCode: string): PaymentErrorCode {
    const errorMap: Record<string, PaymentErrorCode> = {
      'card_declined': PaymentErrorCode.CARD_DECLINED,
      'insufficient_funds': PaymentErrorCode.INSUFFICIENT_FUNDS,
      'expired_card': PaymentErrorCode.EXPIRED_CARD,
      'invalid_card_type': PaymentErrorCode.INVALID_CARD,
      'incorrect_number': PaymentErrorCode.INVALID_CARD,
      'invalid_expiry_month': PaymentErrorCode.INVALID_CARD,
      'invalid_expiry_year': PaymentErrorCode.INVALID_CARD,
      'invalid_cvc': PaymentErrorCode.INVALID_CARD,
      'authentication_required': PaymentErrorCode.PAYMENT_FAILED,
      'invalid_request_error': PaymentErrorCode.API_ERROR,
      'api_error': PaymentErrorCode.API_ERROR,
    };

    return errorMap[stripeCode] ?? PaymentErrorCode.UNKNOWN_ERROR;
  }
}
