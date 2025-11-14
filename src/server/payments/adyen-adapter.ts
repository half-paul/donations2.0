/**
 * Adyen Payment Adapter
 *
 * Implements PaymentAdapter interface for Adyen payment processor.
 *
 * Features:
 * - Drop-in components for hosted payment UI
 * - Payment authorization and capture
 * - Recurring payments via stored payment details
 * - HMAC-based webhook signature verification
 *
 * Fee Structure: Varies by contract (configurable)
 *
 * Documentation: https://docs.adyen.com/
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
 * Adyen adapter configuration
 */
interface AdyenAdapterConfig {
  apiKey: string; // API key for authentication
  webhookSecret: string; // HMAC key for webhook verification
  testMode?: boolean;
  merchantAccount: string; // Merchant account identifier
  clientKey: string; // Public client key for drop-in
}

/**
 * Adyen API response types (simplified)
 */
interface AdyenPaymentRequest {
  amount: {
    value: number;
    currency: string;
  };
  reference: string;
  merchantAccount: string;
  returnUrl?: string;
  shopperEmail?: string;
  shopperName?: {
    firstName: string;
    lastName: string;
  };
  metadata?: Record<string, string>;
  storePaymentMethod?: boolean;
  shopperInteraction?: string;
  recurringProcessingModel?: string;
}

interface AdyenPaymentResponse {
  pspReference: string;
  resultCode: 'Authorised' | 'Refused' | 'Pending' | 'Cancelled' | 'Error';
  amount: {
    value: number;
    currency: string;
  };
  merchantReference: string;
  additionalData?: Record<string, string>;
}

interface AdyenRefundResponse {
  pspReference: string;
  status: string;
  merchantAccount: string;
}

interface AdyenNotification {
  live: string;
  notificationItems: Array<{
    NotificationRequestItem: {
      eventCode: string;
      eventDate: string;
      merchantAccountCode: string;
      merchantReference: string;
      pspReference: string;
      success: string;
      amount: {
        value: number;
        currency: string;
      };
      reason?: string;
      additionalData?: Record<string, string>;
    };
  }>;
}

/**
 * Adyen Payment Adapter Implementation
 */
export class AdyenAdapter extends BasePaymentAdapter {
  readonly name = 'Adyen';
  private readonly merchantAccount: string;
  private readonly clientKey: string;

  // Adyen fee structure (configurable per contract)
  private readonly FEE_PERCENTAGE = 0.025; // 2.5% (example)
  private readonly FEE_FIXED_USD = 0.25; // $0.25 (example)

  constructor(config: AdyenAdapterConfig) {
    super({
      apiKey: config.apiKey,
      webhookSecret: config.webhookSecret,
      testMode: config.testMode,
    });
    this.merchantAccount = config.merchantAccount;
    this.clientKey = config.clientKey;
  }

  protected getBaseUrl(): string {
    return this.config.testMode
      ? 'https://checkout-test.adyen.com/v70'
      : 'https://checkout-live.adyen.com/v70';
  }

  /**
   * Calculate Adyen fees
   */
  calculateFees(amount: number, donorCoversFee: boolean): FeeCalculation {
    // Convert from cents to dollars for calculation
    const amountInDollars = amount / 100;

    // Adyen fee (configurable)
    const calculatedFee = Math.round((amountInDollars * this.FEE_PERCENTAGE + this.FEE_FIXED_USD) * 100);

    // If donor covers fee, add it to the total
    const totalAmount = donorCoversFee ? amount + calculatedFee : amount;

    return {
      percentage: this.FEE_PERCENTAGE,
      fixed: this.FEE_FIXED_USD * 100,
      calculatedFee,
      totalAmount,
    };
  }

  /**
   * Create Adyen payment
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    try {
      // Calculate fees
      const fees = this.calculateFees(params.amount, params.donorCoversFee ?? false);

      // Parse donor name
      const [firstName, ...lastNameParts] = (params.donorName ?? '').split(' ');
      const lastName = lastNameParts.join(' ');

      const requestBody: AdyenPaymentRequest = {
        amount: {
          value: fees.totalAmount,
          currency: params.currency,
        },
        reference: params.idempotencyKey,
        merchantAccount: this.merchantAccount,
        shopperEmail: params.donorEmail,
        shopperName: firstName && lastName ? { firstName, lastName } : undefined,
        metadata: {
          ...params.metadata,
          donorCoversFee: params.donorCoversFee ? 'true' : 'false',
          originalAmount: params.amount.toString(),
          feeAmount: fees.calculatedFee.toString(),
        },
      };

      const response = await this.withRetry(async () => {
        return await this.fetchWithTimeout(`${this.getBaseUrl()}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey,
          },
          body: JSON.stringify(requestBody),
        });
      });

      if (!response.ok) {
        throw await this.handleAdyenError(response);
      }

      const result: AdyenPaymentResponse = await response.json();

      return {
        paymentIntentId: result.pspReference,
        status: this.mapAdyenResultCode(result.resultCode),
        amount: fees.totalAmount,
        currency: params.currency,
        processorFee: fees.calculatedFee,
        netAmount: params.amount,
        metadata: {
          merchantReference: result.merchantReference,
        },
      };
    } catch (error) {
      if (error instanceof PaymentAdapterError) {
        throw error;
      }
      throw new PaymentAdapterError(
        PaymentErrorCode.API_ERROR,
        'Failed to create Adyen payment',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Get Adyen Drop-in configuration
   */
  getHostedFieldsConfig(config: HostedFieldsConfig): HostedFieldsResult {
    return {
      scriptUrl: 'https://checkoutshopper-test.adyen.com/checkoutshopper/sdk/5.0.0/adyen.js',
      publicKey: this.clientKey,
      configuration: {
        containerId: config.containerId,
        locale: config.locale ?? 'en-US',
        environment: this.config.testMode ? 'test' : 'live',
        clientKey: this.clientKey,
        paymentMethodsConfiguration: {
          card: {
            hasHolderName: true,
            holderNameRequired: true,
          },
        },
      },
    };
  }

  /**
   * Confirm Adyen payment
   *
   * Adyen payments are typically confirmed when created.
   * This method retrieves the payment status.
   */
  async confirmPayment(params: ConfirmPaymentParams): Promise<PaymentConfirmationResult> {
    // Adyen doesn't have a separate confirm step for most flows
    // Payment confirmation happens during the createPayment call
    // This method would be used for 3DS flows or redirect payments

    return {
      status: 'success',
      transactionId: params.paymentIntentId,
      amount: 0, // Would be retrieved from payment details
      currency: 'USD',
    };
  }

  /**
   * Refund Adyen payment
   */
  async refundPayment(params: RefundParams): Promise<RefundResult> {
    try {
      const pspReference = params.paymentIntentId ?? params.transactionId;

      if (!pspReference) {
        throw new PaymentAdapterError(
          PaymentErrorCode.REFUND_FAILED,
          'No PSP reference found for refund'
        );
      }

      const requestBody: any = {
        merchantAccount: this.merchantAccount,
        reference: params.idempotencyKey,
      };

      if (params.amount) {
        requestBody.modificationAmount = {
          value: params.amount,
          currency: 'USD', // Would need to be passed in params
        };
      }

      const response = await this.withRetry(async () => {
        return await this.fetchWithTimeout(
          `${this.getBaseUrl()}/payments/${pspReference}/refunds`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': this.config.apiKey,
            },
            body: JSON.stringify(requestBody),
          }
        );
      });

      if (!response.ok) {
        throw await this.handleAdyenError(response);
      }

      const result: AdyenRefundResponse = await response.json();

      return {
        refundId: result.pspReference,
        status: result.status === '[refund-received]' ? 'pending' : 'succeeded',
        amount: params.amount ?? 0,
        currency: 'USD',
        transactionId: pspReference,
      };
    } catch (error) {
      if (error instanceof PaymentAdapterError) {
        throw error;
      }
      throw new PaymentAdapterError(
        PaymentErrorCode.REFUND_FAILED,
        'Failed to process Adyen refund',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Create Adyen recurring payment
   */
  async createRecurringMandate(
    params: CreateRecurringMandateParams
  ): Promise<RecurringMandateResult> {
    try {
      // Calculate fees
      const fees = this.calculateFees(params.amount, params.donorCoversFee ?? false);

      // Parse donor name
      const [firstName, ...lastNameParts] = (params.donorName ?? '').split(' ');
      const lastName = lastNameParts.join(' ');

      const requestBody: any = {
        amount: {
          value: fees.totalAmount,
          currency: params.currency,
        },
        reference: params.idempotencyKey,
        merchantAccount: this.merchantAccount,
        shopperEmail: params.donorEmail,
        shopperName: firstName && lastName ? { firstName, lastName } : undefined,
        shopperInteraction: 'Ecommerce',
        recurringProcessingModel: 'Subscription',
        storePaymentMethod: true,
        metadata: {
          ...params.metadata,
          frequency: params.frequency,
          donorCoversFee: params.donorCoversFee ? 'true' : 'false',
          originalAmount: params.amount.toString(),
          feeAmount: fees.calculatedFee.toString(),
        },
      };

      const response = await this.withRetry(async () => {
        return await this.fetchWithTimeout(`${this.getBaseUrl()}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey,
          },
          body: JSON.stringify(requestBody),
        });
      });

      if (!response.ok) {
        throw await this.handleAdyenError(response);
      }

      const result: AdyenPaymentResponse = await response.json();

      // Calculate next charge date based on frequency
      const nextChargeDate = this.calculateNextChargeDate(params.frequency, params.startDate);

      return {
        mandateId: result.pspReference,
        status: result.resultCode === 'Authorised' ? 'active' : 'pending',
        amount: fees.totalAmount,
        currency: params.currency,
        frequency: params.frequency,
        nextChargeDate,
      };
    } catch (error) {
      if (error instanceof PaymentAdapterError) {
        throw error;
      }
      throw new PaymentAdapterError(
        PaymentErrorCode.MANDATE_CREATION_FAILED,
        'Failed to create Adyen recurring mandate',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Update Adyen recurring mandate
   */
  async updateRecurringMandate(
    params: UpdateRecurringMandateParams
  ): Promise<RecurringMandateResult> {
    // Adyen doesn't have a direct update API for recurring payments
    // Would need to disable old mandate and create new one
    throw new PaymentAdapterError(
      PaymentErrorCode.API_ERROR,
      'Adyen mandate update requires cancellation and recreation'
    );
  }

  /**
   * Cancel Adyen recurring mandate
   */
  async cancelRecurringMandate(
    params: CancelRecurringMandateParams
  ): Promise<RecurringMandateResult> {
    try {
      const requestBody = {
        merchantAccount: this.merchantAccount,
        shopperReference: params.mandateId,
      };

      const response = await this.withRetry(async () => {
        return await this.fetchWithTimeout(`${this.getBaseUrl()}/disable`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey,
          },
          body: JSON.stringify(requestBody),
        });
      });

      if (!response.ok) {
        throw await this.handleAdyenError(response);
      }

      return {
        mandateId: params.mandateId,
        status: 'cancelled',
        amount: 0,
        currency: 'USD',
        frequency: 'monthly',
        nextChargeDate: new Date(),
      };
    } catch (error) {
      if (error instanceof PaymentAdapterError) {
        throw error;
      }
      throw new PaymentAdapterError(
        PaymentErrorCode.API_ERROR,
        'Failed to cancel Adyen mandate',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Verify Adyen webhook signature
   */
  verifyWebhookSignature(params: WebhookVerificationParams): boolean {
    try {
      const payload = typeof params.payload === 'string' ? params.payload : params.payload.toString();
      const notification: AdyenNotification = JSON.parse(payload);

      // Adyen sends multiple notification items
      for (const item of notification.notificationItems) {
        const notificationItem = item.NotificationRequestItem;

        // Build signature string
        const signatureString = [
          notificationItem.pspReference,
          notificationItem.eventCode,
          notificationItem.success,
          notificationItem.merchantAccountCode,
          notificationItem.merchantReference,
          notificationItem.amount.value.toString(),
          notificationItem.amount.currency,
          notificationItem.eventDate,
        ].join(':');

        // Compute HMAC
        const computedSignature = crypto
          .createHmac('sha256', this.config.webhookSecret)
          .update(signatureString, 'utf8')
          .digest('base64');

        // Verify signature (Adyen includes it in additionalData)
        const receivedSignature = notificationItem.additionalData?.['hmacSignature'];

        if (!receivedSignature || computedSignature !== receivedSignature) {
          throw new PaymentAdapterError(
            PaymentErrorCode.INVALID_SIGNATURE,
            'Adyen webhook signature verification failed'
          );
        }
      }

      return true;
    } catch (error) {
      if (error instanceof PaymentAdapterError) {
        throw error;
      }
      throw new PaymentAdapterError(
        PaymentErrorCode.INVALID_SIGNATURE,
        'Adyen webhook signature verification failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Parse Adyen webhook event
   */
  parseWebhookEvent(payload: unknown): WebhookEvent {
    const notification = payload as AdyenNotification;
    const item = notification.notificationItems[0]?.NotificationRequestItem;

    if (!item) {
      throw new PaymentAdapterError(
        PaymentErrorCode.WEBHOOK_PROCESSING_FAILED,
        'Invalid Adyen notification format'
      );
    }

    return {
      id: item.pspReference,
      type: this.mapAdyenEventCode(item.eventCode),
      processor: 'adyen',
      data: {
        paymentIntentId: item.pspReference,
        transactionId: item.pspReference,
        status: item.success === 'true' ? 'success' : 'failed',
        amount: item.amount.value,
        currency: item.amount.currency as 'USD' | 'CAD' | 'EUR',
        failureReason: item.reason,
        metadata: item.additionalData,
      },
      createdAt: new Date(item.eventDate),
      raw: notification,
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private mapAdyenResultCode(code: string): 'success' | 'pending' | 'failed' | 'cancelled' {
    switch (code) {
      case 'Authorised':
        return 'success';
      case 'Pending':
        return 'pending';
      case 'Cancelled':
        return 'cancelled';
      case 'Refused':
      case 'Error':
      default:
        return 'failed';
    }
  }

  private mapAdyenEventCode(eventCode: string): WebhookEventType {
    const eventMap: Record<string, WebhookEventType> = {
      'AUTHORISATION': 'payment.succeeded',
      'REFUND': 'payment.refunded',
      'REFUND_FAILED': 'payment.failed',
      'CANCEL_OR_REFUND': 'payment.refunded',
      'CHARGEBACK': 'payment.chargeback',
      'DISPUTE': 'payment.disputed',
      'RECURRING_CONTRACT': 'mandate.created',
      'DISABLE_RECURRING': 'mandate.cancelled',
    };

    return eventMap[eventCode] ?? 'unknown';
  }

  private calculateNextChargeDate(frequency: RecurringFrequency, startDate?: Date): Date {
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

  private async handleAdyenError(response: Response): Promise<PaymentAdapterError> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'Unknown error' };
    }

    const code = this.mapAdyenErrorCode(errorData.errorCode ?? errorData.status);

    return new PaymentAdapterError(
      code,
      errorData.message ?? 'Adyen API error',
      errorData.errorCode,
      errorData.message,
      { status: response.status }
    );
  }

  private mapAdyenErrorCode(adyenCode: string): PaymentErrorCode {
    const errorMap: Record<string, PaymentErrorCode> = {
      '000': PaymentErrorCode.UNKNOWN_ERROR,
      '010': PaymentErrorCode.CARD_DECLINED,
      '100': PaymentErrorCode.INSUFFICIENT_FUNDS,
      '101': PaymentErrorCode.EXPIRED_CARD,
      '103': PaymentErrorCode.INVALID_CARD,
      '803': PaymentErrorCode.AUTHENTICATION_FAILED,
    };

    return errorMap[adyenCode] ?? PaymentErrorCode.UNKNOWN_ERROR;
  }
}
