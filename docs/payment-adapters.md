# Payment Adapters Documentation

## Overview

The payment adapter system provides a unified interface for integrating multiple payment processors (Stripe, Adyen, PayPal) while maintaining PCI-DSS compliance and security best practices.

## Architecture

### Adapter Pattern

All payment processors implement the `PaymentAdapter` interface, which abstracts processor-specific implementations:

```typescript
interface PaymentAdapter {
  // One-time payments
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  getHostedFieldsConfig(config: HostedFieldsConfig): HostedFieldsResult;
  confirmPayment(params: ConfirmPaymentParams): Promise<PaymentConfirmationResult>;
  refundPayment(params: RefundParams): Promise<RefundResult>;

  // Recurring payments
  createRecurringMandate(params: CreateRecurringMandateParams): Promise<RecurringMandateResult>;
  updateRecurringMandate(params: UpdateRecurringMandateParams): Promise<RecurringMandateResult>;
  cancelRecurringMandate(params: CancelRecurringMandateParams): Promise<RecurringMandateResult>;

  // Webhooks
  verifyWebhookSignature(params: WebhookVerificationParams): boolean;
  parseWebhookEvent(payload: unknown): WebhookEvent;

  // Fee calculation
  calculateFees(amount: number, donorCoversFee: boolean): FeeCalculation;
}
```

### File Structure

```
src/server/payments/
├── types.ts              # TypeScript types and interfaces
├── adapter.ts            # Base adapter interface and abstract class
├── stripe-adapter.ts     # Stripe implementation
├── adyen-adapter.ts      # Adyen implementation
├── paypal-adapter.ts     # PayPal implementation
├── mock-adapter.ts       # Mock adapter for testing
├── factory.ts            # Adapter factory for creating instances
└── index.ts              # Module exports

src/app/api/webhooks/payment/
└── route.ts              # Webhook handler API route
```

## Payment Processors

### Stripe

**Features:**
- Stripe Elements for hosted payment fields
- Automatic payment confirmation
- Subscription management for recurring payments
- Webhook signature verification with `stripe-signature` header

**Fee Structure:** 2.9% + $0.30 per transaction

**Configuration:**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_TEST_MODE=true
```

**Documentation:** https://stripe.com/docs/api

### Adyen

**Features:**
- Drop-in components for hosted payment UI
- Payment authorization and capture
- Recurring payments via stored payment details
- HMAC-based webhook signature verification

**Fee Structure:** Varies by contract (configurable)

**Configuration:**
```bash
ADYEN_API_KEY=AQE...
ADYEN_MERCHANT_ACCOUNT=YourMerchantAccount
ADYEN_CLIENT_KEY=test_...
ADYEN_WEBHOOK_SECRET=your-hmac-key
ADYEN_TEST_MODE=true
```

**Documentation:** https://docs.adyen.com/

### PayPal

**Features:**
- Smart Payment Buttons integration
- Orders API for one-time payments
- Subscriptions API for recurring payments
- Webhook signature verification with certificate validation

**Fee Structure:** 2.99% + $0.49 per transaction

**Configuration:**
```bash
PAYPAL_CLIENT_ID=AYourClientID
PAYPAL_CLIENT_SECRET=EYourClientSecret
PAYPAL_WEBHOOK_ID=your-webhook-id
PAYPAL_TEST_MODE=true
```

**Documentation:** https://developer.paypal.com/docs/api/overview/

## Usage Examples

### Creating a Payment Intent

```typescript
import { getPaymentAdapter } from '@/server/payments';

const adapter = getPaymentAdapter('stripe');

const intent = await adapter.createPaymentIntent({
  amount: 5000, // $50.00 in cents
  currency: 'USD',
  donorEmail: 'donor@example.com',
  donorName: 'John Doe',
  donorCoversFee: true,
  metadata: {
    campaignId: 'campaign-123',
    formId: 'form-456',
  },
  idempotencyKey: 'unique-key-123',
});

console.log('Payment Intent ID:', intent.paymentIntentId);
console.log('Client Secret:', intent.clientSecret);
```

### Creating a Recurring Mandate

```typescript
const mandate = await adapter.createRecurringMandate({
  amount: 2500, // $25.00 in cents
  currency: 'USD',
  frequency: 'monthly',
  donorEmail: 'donor@example.com',
  donorName: 'Jane Smith',
  donorCoversFee: false,
  startDate: new Date('2025-02-01'),
  metadata: {
    campaignId: 'campaign-123',
  },
  idempotencyKey: 'mandate-key-456',
});

console.log('Mandate ID:', mandate.mandateId);
console.log('Next Charge Date:', mandate.nextChargeDate);
```

### Processing a Refund

```typescript
const refund = await adapter.refundPayment({
  paymentIntentId: 'pi_123456',
  amount: 1000, // Partial refund of $10.00
  reason: 'Requested by donor',
  idempotencyKey: 'refund-key-789',
});

console.log('Refund ID:', refund.refundId);
console.log('Refund Status:', refund.status);
```

### Hosted Fields Integration (Frontend)

```typescript
// Get hosted fields configuration
const adapter = getPaymentAdapter('stripe');
const config = adapter.getHostedFieldsConfig({
  containerId: 'payment-element',
  locale: 'en-US',
  returnUrl: 'https://example.com/donate/complete',
});

// Load script on client
const script = document.createElement('script');
script.src = config.scriptUrl;
script.onload = () => {
  // Initialize hosted fields
  const stripe = Stripe(config.publicKey);
  const elements = stripe.elements();
  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');
};
document.head.appendChild(script);
```

## Webhook Handling

### Webhook Flow

1. **Detect Processor:** Identify processor from request headers or query params
2. **Verify Signature:** CRITICAL - Always verify webhook signature before processing
3. **Check Idempotency:** Query `webhook_events` table to prevent duplicate processing
4. **Parse Event:** Convert processor-specific payload to standardized `WebhookEvent`
5. **Process Event:** Update `Gift` or `RecurringPlan` status in database
6. **Audit Log:** Record event processing in audit log
7. **Return Response:** 200 OK on success, 5xx on failure (triggers retry)

### Webhook Endpoint

```
POST /api/webhooks/payment?processor=stripe
POST /api/webhooks/payment?processor=adyen
POST /api/webhooks/payment?processor=paypal
```

### Webhook Event Types

- `payment.succeeded` - Payment completed successfully
- `payment.failed` - Payment declined or failed
- `payment.pending` - Payment requires additional action
- `payment.refunded` - Payment was refunded
- `payment.disputed` - Payment disputed by cardholder
- `payment.chargeback` - Chargeback initiated
- `mandate.created` - Recurring mandate created
- `mandate.updated` - Recurring mandate updated
- `mandate.cancelled` - Recurring mandate cancelled
- `mandate.failed` - Recurring payment failed (dunning)
- `payout.paid` - Payout/settlement completed

### Webhook Signature Verification

Each processor uses a different signature verification method:

**Stripe:** HMAC-SHA256 with `stripe-signature` header
```typescript
const signature = request.headers.get('stripe-signature');
const isValid = adapter.verifyWebhookSignature({
  payload: requestBody,
  signature,
  secret: webhookSecret,
});
```

**Adyen:** HMAC-SHA256 with notification request fields
```typescript
const signature = notificationItem.additionalData.hmacSignature;
const isValid = adapter.verifyWebhookSignature({
  payload: notificationPayload,
  signature,
  secret: webhookSecret,
});
```

**PayPal:** Certificate-based verification (simplified HMAC for now)
```typescript
const signature = request.headers.get('paypal-transmission-sig');
const isValid = adapter.verifyWebhookSignature({
  payload: requestBody,
  signature,
  secret: webhookSecret,
});
```

## Security & Compliance

### PCI-DSS Compliance (SAQ-A-EP)

The adapter system is designed for **SAQ-A-EP** compliance:

1. **Hosted Fields Only:** All adapters use processor-hosted payment fields
2. **No PAN/CVV Storage:** Never store full card numbers or CVV
3. **Token-Based Processing:** Only handle tokenized payment methods
4. **TLS 1.2+:** All processor communications use TLS 1.2 or higher
5. **Secure Webhook Verification:** HMAC signature verification required

### Critical Security Rules

**NEVER:**
- Log raw PAN (Primary Account Number) or CVV data
- Store card numbers in database (use tokens only)
- Skip webhook signature verification
- Process webhooks without idempotency checks
- Include sensitive data in error messages

**ALWAYS:**
- Verify webhook signatures before processing
- Use idempotency keys for payment operations
- Store processor transaction IDs for reconciliation
- Implement retry logic with exponential backoff
- Log security events to audit log

### Idempotency

All payment operations require idempotency keys to prevent duplicate charges:

```typescript
const idempotencyKey = crypto.randomUUID(); // Generate unique key

const intent = await adapter.createPaymentIntent({
  // ... other params
  idempotencyKey,
});
```

Webhook events use the processor's event ID for idempotency:

```sql
CREATE UNIQUE INDEX unique_processor_event
ON webhook_events (processor, externalId);
```

## Error Handling

### Error Codes

```typescript
enum PaymentErrorCode {
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

  // Other errors
  IDEMPOTENCY_KEY_REUSED = 'IDEMPOTENCY_KEY_REUSED',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  REFUND_FAILED = 'REFUND_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### Retry Logic

All adapters implement exponential backoff retry for transient errors:

```typescript
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 4000,
  backoffMultiplier: 2,
};

// Retry schedule: 1s, 2s, 4s
```

### User-Friendly Error Messages

```typescript
try {
  const intent = await adapter.createPaymentIntent(params);
} catch (error) {
  if (error instanceof PaymentAdapterError) {
    const userMessage = error.getUserMessage();
    // Display to user: "Your card was declined. Please try a different payment method."

    const isRetryable = error.isRetryable();
    // Determine if retry is appropriate
  }
}
```

## Fee Calculation

### Donor Covers Fees

When donors opt to cover processing fees, the adapter automatically calculates and adds the fee:

```typescript
const fees = adapter.calculateFees(5000, true); // $50.00, donor covers fee

console.log(fees);
// {
//   percentage: 0.029,           // 2.9%
//   fixed: 30,                   // $0.30
//   calculatedFee: 175,          // $1.75
//   totalAmount: 5175,           // $51.75 (charged to donor)
// }
```

### Fee Transparency

Always display fee breakdown to donors before payment:

```
Donation Amount:     $50.00
Processing Fee:       $1.75
Total:               $51.75
```

## Testing

### Mock Adapter

Use `MockAdapter` for unit tests:

```typescript
import { MockAdapter } from '@/server/payments';

const adapter = new MockAdapter({
  behavior: {
    shouldSucceed: true,
    shouldDelay: false,
    delayMs: 100,
  },
});

const intent = await adapter.createPaymentIntent({
  amount: 5000,
  currency: 'USD',
  donorEmail: 'test@example.com',
  idempotencyKey: 'test-key-123',
});

expect(intent.status).toBe('pending');
```

### Sandbox Testing

All adapters support test mode:

- **Stripe:** Use test API keys (`sk_test_...`)
- **Adyen:** Use test environment (`checkout-test.adyen.com`)
- **PayPal:** Use sandbox environment (`api-m.sandbox.paypal.com`)

### Test Card Numbers

**Stripe:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Insufficient Funds: `4000 0000 0000 9995`

**Adyen:**
- Success: `5101 1800 0000 0007`
- Decline: `5101 1800 0000 0015`

**PayPal:**
- Use PayPal sandbox accounts

## Reconciliation

### Transaction Metadata

All adapters store reconciliation metadata:

```typescript
interface PaymentIntentResult {
  paymentIntentId: string;      // Processor's payment intent ID
  transactionId?: string;        // Processor's transaction ID
  amount: number;                // Total amount charged
  currency: Currency;            // Currency code
  processorFee?: number;         // Processor fee amount
  netAmount?: number;            // Net amount after fees
  metadata?: Record<string, unknown>; // Additional processor data
}
```

### Daily Reconciliation

1. Query `gifts` table for completed donations
2. Match `processorRef` to processor transaction records
3. Compare amounts, fees, and settlement status
4. Flag discrepancies for manual review
5. Export reconciliation report (CSV/PDF)

## Monitoring & Observability

### Metrics to Track

- Payment success rate (by processor)
- Average payment processing time
- Webhook processing latency
- Error rates (by error code)
- Fee amounts collected
- Retry counts
- Idempotency violations

### Logging

All payment operations are logged:

```typescript
console.log('[Payment] Creating intent', {
  processor: 'stripe',
  amount: 5000,
  currency: 'USD',
  donorCoversFee: true,
  // NEVER log PAN/CVV or sensitive data
});
```

### Alerts

Configure alerts for:

- Error rate > 5%
- Webhook signature verification failures
- Payment processor API downtime
- Unusual refund patterns
- Idempotency violations

## Migration Guide

### Adding a New Processor

1. Create new adapter class extending `BasePaymentAdapter`
2. Implement all required methods from `PaymentAdapter` interface
3. Add processor configuration to `factory.ts`
4. Update webhook handler to detect new processor
5. Add processor to Prisma schema enum
6. Test with sandbox/test environment
7. Document fee structure and configuration
8. Update monitoring dashboards

### Switching Processors

1. Add new processor configuration
2. Create feature flag for gradual rollout
3. Route percentage of traffic to new processor
4. Monitor success rates and error rates
5. Gradually increase traffic to new processor
6. Once stable, deprecate old processor
7. Maintain webhook handlers for both during transition

## Troubleshooting

### Common Issues

**Issue:** Webhook signature verification fails
- **Solution:** Verify webhook secret is correct, check payload is raw string

**Issue:** Duplicate payment charges
- **Solution:** Ensure idempotency keys are unique and stored correctly

**Issue:** Payment stuck in pending status
- **Solution:** Check webhook endpoint is accessible, verify processor dashboard

**Issue:** Refund fails with "charge not found"
- **Solution:** Verify payment has been captured, check transaction ID

### Debug Mode

Enable debug logging:

```bash
DEBUG=payments:* npm run dev
```

## API Reference

See TypeScript types in `/src/server/payments/types.ts` for complete API documentation.

## Support

For issues or questions:
- **Documentation:** This file
- **Code:** `/src/server/payments/`
- **Prisma Schema:** `/prisma/schema.prisma`
- **Webhook Handler:** `/src/app/api/webhooks/payment/route.ts`
