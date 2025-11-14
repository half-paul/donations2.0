/**
 * Payment Adapter Factory
 *
 * Centralized factory for creating payment processor adapters.
 * Handles configuration loading from environment variables and
 * AWS Secrets Manager (in production).
 *
 * Usage:
 *   const adapter = getPaymentAdapter('stripe');
 *   const intent = await adapter.createPaymentIntent(...);
 */

import { type PaymentProcessor } from '@prisma/client';
import { type PaymentAdapter } from './adapter';
import { StripeAdapter } from './stripe-adapter';
import { AdyenAdapter } from './adyen-adapter';
import { PayPalAdapter } from './paypal-adapter';

/**
 * Payment processor configuration
 */
interface ProcessorConfig {
  stripe?: {
    apiKey: string;
    webhookSecret: string;
    publishableKey: string;
    testMode: boolean;
  };
  adyen?: {
    apiKey: string;
    webhookSecret: string;
    merchantAccount: string;
    clientKey: string;
    testMode: boolean;
  };
  paypal?: {
    apiKey: string; // Client ID
    webhookSecret: string; // Client Secret
    webhookId?: string;
    testMode: boolean;
  };
}

/**
 * Adapter cache to prevent recreating adapters on every request
 */
const adapterCache = new Map<PaymentProcessor, PaymentAdapter>();

/**
 * Load payment processor configuration from environment variables
 *
 * In production, this should load from AWS Secrets Manager.
 * For now, we'll use environment variables.
 */
function loadConfig(): ProcessorConfig {
  const config: ProcessorConfig = {};

  // Stripe configuration
  if (process.env.STRIPE_SECRET_KEY) {
    config.stripe = {
      apiKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
      testMode: process.env.STRIPE_TEST_MODE === 'true',
    };
  }

  // Adyen configuration
  if (process.env.ADYEN_API_KEY) {
    config.adyen = {
      apiKey: process.env.ADYEN_API_KEY,
      webhookSecret: process.env.ADYEN_WEBHOOK_SECRET ?? '',
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT ?? '',
      clientKey: process.env.ADYEN_CLIENT_KEY ?? '',
      testMode: process.env.ADYEN_TEST_MODE === 'true',
    };
  }

  // PayPal configuration
  if (process.env.PAYPAL_CLIENT_ID) {
    config.paypal = {
      apiKey: process.env.PAYPAL_CLIENT_ID,
      webhookSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
      webhookId: process.env.PAYPAL_WEBHOOK_ID,
      testMode: process.env.PAYPAL_TEST_MODE === 'true',
    };
  }

  return config;
}

/**
 * Get payment adapter instance for the specified processor
 *
 * @param processor - Payment processor name
 * @returns Payment adapter instance
 * @throws Error if processor is not configured
 */
export function getPaymentAdapter(processor: PaymentProcessor): PaymentAdapter {
  // Check cache first
  const cached = adapterCache.get(processor);
  if (cached) {
    return cached;
  }

  // Load configuration
  const config = loadConfig();

  // Create adapter based on processor
  let adapter: PaymentAdapter;

  switch (processor) {
    case 'stripe':
      if (!config.stripe) {
        throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.');
      }
      adapter = new StripeAdapter(config.stripe);
      break;

    case 'adyen':
      if (!config.adyen) {
        throw new Error('Adyen is not configured. Set ADYEN_API_KEY environment variable.');
      }
      adapter = new AdyenAdapter(config.adyen);
      break;

    case 'paypal':
      if (!config.paypal) {
        throw new Error('PayPal is not configured. Set PAYPAL_CLIENT_ID environment variable.');
      }
      adapter = new PayPalAdapter(config.paypal);
      break;

    default:
      throw new Error(`Unsupported payment processor: ${processor}`);
  }

  // Cache the adapter
  adapterCache.set(processor, adapter);

  return adapter;
}

/**
 * Get all configured payment processors
 *
 * @returns Array of configured processor names
 */
export function getConfiguredProcessors(): PaymentProcessor[] {
  const config = loadConfig();
  const processors: PaymentProcessor[] = [];

  if (config.stripe) processors.push('stripe');
  if (config.adyen) processors.push('adyen');
  if (config.paypal) processors.push('paypal');

  return processors;
}

/**
 * Check if a processor is configured
 *
 * @param processor - Payment processor to check
 * @returns true if processor is configured
 */
export function isProcessorConfigured(processor: PaymentProcessor): boolean {
  const config = loadConfig();

  switch (processor) {
    case 'stripe':
      return !!config.stripe;
    case 'adyen':
      return !!config.adyen;
    case 'paypal':
      return !!config.paypal;
    default:
      return false;
  }
}

/**
 * Clear adapter cache (useful for testing)
 */
export function clearAdapterCache(): void {
  adapterCache.clear();
}

/**
 * Load secrets from AWS Secrets Manager (production)
 *
 * This is a stub for now. In production, implement this to load
 * secrets from AWS Secrets Manager.
 */
async function loadSecretsFromAWS(secretName: string): Promise<Record<string, string>> {
  // TODO: Implement AWS Secrets Manager integration
  // const client = new SecretsManagerClient({ region: 'us-east-1' });
  // const response = await client.send(
  //   new GetSecretValueCommand({ SecretId: secretName })
  // );
  // return JSON.parse(response.SecretString ?? '{}');

  throw new Error('AWS Secrets Manager integration not implemented');
}
