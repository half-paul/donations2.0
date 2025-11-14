/**
 * Payment Adapters Module
 *
 * Exports all payment adapter components for easy importing.
 *
 * Usage:
 *   import { getPaymentAdapter, PaymentErrorCode } from '@/server/payments';
 */

// Core interfaces and types
export { type PaymentAdapter, BasePaymentAdapter } from './adapter';
export * from './types';

// Processor adapters
export { StripeAdapter } from './stripe-adapter';
export { AdyenAdapter } from './adyen-adapter';
export { PayPalAdapter } from './paypal-adapter';
export { MockAdapter } from './mock-adapter';

// Factory
export {
  getPaymentAdapter,
  getConfiguredProcessors,
  isProcessorConfigured,
  clearAdapterCache,
} from './factory';
