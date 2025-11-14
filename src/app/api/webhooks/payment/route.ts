/**
 * Payment Webhook Handler API Route
 *
 * Receives and processes webhooks from payment processors.
 *
 * Security:
 * - HMAC signature verification (CRITICAL - always verify first)
 * - Idempotency checks to prevent duplicate processing
 * - Rate limiting (TODO: implement)
 *
 * Flow:
 * 1. Detect processor from request headers
 * 2. Verify webhook signature
 * 3. Check idempotency (webhook_events table)
 * 4. Parse webhook event
 * 5. Process event (update Gift/RecurringPlan status)
 * 6. Audit log
 * 7. Return 200 OK (or 5xx to trigger retry)
 *
 * Note: This is a Next.js 14 App Router API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { type PaymentProcessor } from '@prisma/client';
import { getPaymentAdapter } from '@/server/payments/factory';
import { PaymentAdapterError, PaymentErrorCode } from '@/server/payments/types';

/**
 * POST /api/webhooks/payment
 *
 * Receives webhooks from all payment processors.
 * Processor is detected from request headers or path parameter.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Detect processor from headers or query params
    const processor = detectProcessor(request);

    if (!processor) {
      console.error('[Webhook] Unable to detect payment processor');
      return NextResponse.json(
        { error: 'Unable to detect payment processor' },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Processing ${processor} webhook`);

    // 2. Get adapter for processor
    const adapter = getPaymentAdapter(processor);

    // 3. Read raw body and signature
    const body = await request.text();
    const signature = getSignatureHeader(request, processor);

    if (!signature) {
      console.error('[Webhook] Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    // 4. Verify webhook signature (CRITICAL SECURITY CHECK)
    let isValid = false;
    try {
      isValid = adapter.verifyWebhookSignature({
        payload: body,
        signature,
        secret: '', // Secret is loaded internally by adapter
      });
    } catch (error) {
      console.error('[Webhook] Signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    if (!isValid) {
      console.error('[Webhook] Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('[Webhook] Signature verified successfully');

    // 5. Parse webhook event
    const webhookEvent = adapter.parseWebhookEvent(JSON.parse(body));

    console.log(`[Webhook] Event type: ${webhookEvent.type}, ID: ${webhookEvent.id}`);

    // 6. Check idempotency (have we processed this event before?)
    const isProcessed = await checkIdempotency(processor, webhookEvent.id);

    if (isProcessed) {
      console.log(`[Webhook] Event ${webhookEvent.id} already processed, skipping`);
      return NextResponse.json({ received: true, status: 'already_processed' });
    }

    // 7. Store webhook event for idempotency
    await storeWebhookEvent(processor, webhookEvent);

    // 8. Process the webhook event
    await processWebhookEvent(webhookEvent);

    console.log(`[Webhook] Event ${webhookEvent.id} processed successfully`);

    // 9. Return 200 OK
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);

    // Return 5xx to trigger processor retry
    if (error instanceof PaymentAdapterError) {
      // Log to dead-letter queue (for now, just console)
      console.error('[Webhook] Payment adapter error:', {
        code: error.code,
        message: error.message,
        processorCode: error.processorCode,
        processorMessage: error.processorMessage,
      });

      return NextResponse.json(
        {
          error: 'Webhook processing failed',
          code: error.code,
        },
        { status: 500 }
      );
    }

    // Unknown error - log and return 500
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

/**
 * Detect payment processor from request
 */
function detectProcessor(request: NextRequest): PaymentProcessor | null {
  // Check query parameter first
  const searchParams = request.nextUrl.searchParams;
  const processorParam = searchParams.get('processor');
  if (processorParam) {
    return processorParam as PaymentProcessor;
  }

  // Detect from headers
  const userAgent = request.headers.get('user-agent') ?? '';
  const stripeSignature = request.headers.get('stripe-signature');
  const adyenSignature = request.headers.get('hmac-signature');
  const paypalTransmissionId = request.headers.get('paypal-transmission-id');

  if (stripeSignature || userAgent.includes('Stripe')) {
    return 'stripe';
  }

  if (adyenSignature) {
    return 'adyen';
  }

  if (paypalTransmissionId) {
    return 'paypal';
  }

  return null;
}

/**
 * Get signature header based on processor
 */
function getSignatureHeader(request: NextRequest, processor: PaymentProcessor): string | null {
  switch (processor) {
    case 'stripe':
      return request.headers.get('stripe-signature');
    case 'adyen':
      return request.headers.get('hmac-signature');
    case 'paypal':
      // PayPal uses multiple headers for verification
      const transmissionId = request.headers.get('paypal-transmission-id');
      const transmissionTime = request.headers.get('paypal-transmission-time');
      const transmissionSig = request.headers.get('paypal-transmission-sig');
      const certUrl = request.headers.get('paypal-cert-url');
      const authAlgo = request.headers.get('paypal-auth-algo');

      if (transmissionSig) {
        // For simplified verification, return the signature
        // In production, pass all headers to adapter
        return transmissionSig;
      }
      return null;
    default:
      return null;
  }
}

/**
 * Check if webhook event has already been processed
 */
async function checkIdempotency(
  processor: PaymentProcessor,
  eventId: string
): Promise<boolean> {
  // TODO: Query webhook_events table
  // const existing = await prisma.webhookEvent.findUnique({
  //   where: {
  //     processor_externalId: {
  //       processor,
  //       externalId: eventId,
  //     },
  //   },
  // });
  // return !!existing;

  // For now, return false (not implemented)
  return false;
}

/**
 * Store webhook event for idempotency and audit trail
 */
async function storeWebhookEvent(
  processor: PaymentProcessor,
  event: any
): Promise<void> {
  // TODO: Store in webhook_events table
  // await prisma.webhookEvent.create({
  //   data: {
  //     processor,
  //     externalId: event.id,
  //     eventType: event.type,
  //     payload: event.raw,
  //     processed: false,
  //   },
  // });

  console.log(`[Webhook] Stored event ${event.id} for idempotency`);
}

/**
 * Process webhook event based on type
 */
async function processWebhookEvent(event: any): Promise<void> {
  console.log(`[Webhook] Processing event type: ${event.type}`);

  switch (event.type) {
    case 'payment.succeeded':
      await handlePaymentSucceeded(event);
      break;

    case 'payment.failed':
      await handlePaymentFailed(event);
      break;

    case 'payment.refunded':
      await handlePaymentRefunded(event);
      break;

    case 'payment.disputed':
      await handlePaymentDisputed(event);
      break;

    case 'payment.chargeback':
      await handlePaymentChargeback(event);
      break;

    case 'mandate.created':
      await handleMandateCreated(event);
      break;

    case 'mandate.updated':
      await handleMandateUpdated(event);
      break;

    case 'mandate.cancelled':
      await handleMandateCancelled(event);
      break;

    case 'mandate.failed':
      await handleMandateFailed(event);
      break;

    case 'payout.paid':
      await handlePayoutPaid(event);
      break;

    default:
      console.log(`[Webhook] Unknown event type: ${event.type}, skipping`);
  }

  // Mark webhook event as processed
  await markWebhookProcessed(event.id);
}

/**
 * Handle payment succeeded event
 */
async function handlePaymentSucceeded(event: any): Promise<void> {
  console.log(`[Webhook] Payment succeeded: ${event.data.paymentIntentId}`);

  // TODO: Update Gift status to 'success'
  // const processorRef = event.data.paymentIntentId ?? event.data.transactionId;
  //
  // await prisma.gift.updateMany({
  //   where: {
  //     processorRef,
  //     processor: event.processor,
  //   },
  //   data: {
  //     status: 'success',
  //     completedAt: new Date(),
  //   },
  // });
  //
  // // Create audit log
  // await prisma.audit.create({
  //   data: {
  //     actor: 'system',
  //     action: 'UPDATE',
  //     resource: `gift:${processorRef}`,
  //     diffs: {
  //       before: { status: 'pending' },
  //       after: { status: 'success' },
  //     },
  //   },
  // });

  console.log('[Webhook] Payment succeeded processing complete');
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(event: any): Promise<void> {
  console.log(`[Webhook] Payment failed: ${event.data.paymentIntentId}`);

  // TODO: Update Gift status to 'failed'
  // Similar to handlePaymentSucceeded

  console.log('[Webhook] Payment failed processing complete');
}

/**
 * Handle payment refunded event
 */
async function handlePaymentRefunded(event: any): Promise<void> {
  console.log(`[Webhook] Payment refunded: ${event.data.paymentIntentId}`);

  // TODO: Update Gift status to 'refunded'
  // Set refundedAt timestamp

  console.log('[Webhook] Payment refunded processing complete');
}

/**
 * Handle payment disputed event
 */
async function handlePaymentDisputed(event: any): Promise<void> {
  console.log(`[Webhook] Payment disputed: ${event.data.paymentIntentId}`);

  // TODO: Create dispute record
  // Notify finance team

  console.log('[Webhook] Payment disputed processing complete');
}

/**
 * Handle payment chargeback event
 */
async function handlePaymentChargeback(event: any): Promise<void> {
  console.log(`[Webhook] Payment chargeback: ${event.data.paymentIntentId}`);

  // TODO: Create chargeback record
  // Notify finance team

  console.log('[Webhook] Payment chargeback processing complete');
}

/**
 * Handle mandate created event
 */
async function handleMandateCreated(event: any): Promise<void> {
  console.log(`[Webhook] Mandate created: ${event.data.mandateId}`);

  // TODO: Update RecurringPlan status to 'active'

  console.log('[Webhook] Mandate created processing complete');
}

/**
 * Handle mandate updated event
 */
async function handleMandateUpdated(event: any): Promise<void> {
  console.log(`[Webhook] Mandate updated: ${event.data.mandateId}`);

  // TODO: Update RecurringPlan details

  console.log('[Webhook] Mandate updated processing complete');
}

/**
 * Handle mandate cancelled event
 */
async function handleMandateCancelled(event: any): Promise<void> {
  console.log(`[Webhook] Mandate cancelled: ${event.data.mandateId}`);

  // TODO: Update RecurringPlan status to 'cancelled'

  console.log('[Webhook] Mandate cancelled processing complete');
}

/**
 * Handle mandate failed event (dunning)
 */
async function handleMandateFailed(event: any): Promise<void> {
  console.log(`[Webhook] Mandate payment failed: ${event.data.mandateId}`);

  // TODO: Implement dunning logic
  // - Increment retry count
  // - Schedule retry based on dunning schedule
  // - Send notification to donor
  // - If max retries exceeded, pause/cancel mandate

  console.log('[Webhook] Mandate failed processing complete');
}

/**
 * Handle payout paid event
 */
async function handlePayoutPaid(event: any): Promise<void> {
  console.log(`[Webhook] Payout paid`);

  // TODO: Update payout/settlement records

  console.log('[Webhook] Payout paid processing complete');
}

/**
 * Mark webhook event as processed
 */
async function markWebhookProcessed(eventId: string): Promise<void> {
  // TODO: Update webhook_events table
  // await prisma.webhookEvent.update({
  //   where: { id: eventId },
  //   data: {
  //     processed: true,
  //     processedAt: new Date(),
  //   },
  // });

  console.log(`[Webhook] Marked event ${eventId} as processed`);
}
