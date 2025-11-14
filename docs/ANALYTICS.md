# Analytics & Instrumentation Guide

## Overview

This document provides a comprehensive guide to analytics instrumentation, event tracking, and monitoring for the Raisin Next donation platform.

## Table of Contents

1. [Event Taxonomy](#event-taxonomy)
2. [Client-Side Tracking](#client-side-tracking)
3. [Server-Side Logging](#server-side-logging)
4. [Dashboard Queries](#dashboard-queries)
5. [OpenTelemetry Instrumentation](#opentelemetry-instrumentation)
6. [Privacy & Compliance](#privacy--compliance)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Event Taxonomy

### Donation Funnel Events

All donation funnel events follow the naming pattern: `{object}_{action}`

#### 1. donation_started
**Trigger**: User lands on donation page
**Properties**:
- `campaign_id` (UUID) - Campaign identifier
- `campaign_slug` (string) - URL-friendly campaign name
- `form_id` (UUID) - Form identifier
- `variant_id` (string, optional) - A/B test variant

**Example**:
```typescript
trackDonationStarted({
  campaign_id: '123e4567-e89b-12d3-a456-426614174000',
  campaign_slug: 'spring-appeal-2025',
  form_id: '123e4567-e89b-12d3-a456-426614174001',
  variant_id: 'A',
});
```

#### 2. amount_selected
**Trigger**: User selects donation amount
**Properties**:
- `amount` (number, required) - Selected amount
- `currency` (enum, required) - USD | CAD | EUR
- `amount_type` (enum) - preset | custom
- `preset_options` (number[], optional) - Available preset amounts

**Example**:
```typescript
trackAmountSelected({
  amount: 100,
  currency: 'USD',
  amount_type: 'preset',
  preset_options: [25, 50, 100, 250],
});
```

#### 3. recurring_toggled
**Trigger**: User switches to/from recurring donation
**Properties**:
- `recurring` (boolean, required) - New state
- `frequency` (enum, optional) - monthly | quarterly | annually
- `previous_state` (boolean, optional) - Previous recurring state

#### 4. tribute_added
**Trigger**: User selects tribute dedication
**Properties**:
- `tribute` (boolean, required) - Always true
- `tribute_type` (enum, required) - honour | memory | celebration
- `ecard_selected` (boolean, optional) - Whether ecard was selected

#### 5. fee_coverage_toggled
**Trigger**: User checks/unchecks donor-covers-fees
**Properties**:
- `donor_covers_fee` (boolean, required) - New state
- `fee_amount` (number, required) - Fee amount in currency
- `fee_percentage` (number, optional) - Fee as percentage
- `previous_state` (boolean, optional) - Previous state

#### 6. donor_info_submitted
**Trigger**: User completes contact information step
**Properties**:
- `is_authenticated` (boolean, required) - Whether user is logged in
- `fields_completed` (string[], optional) - Non-PII field names only
- `consent_marketing` (boolean, optional) - Marketing consent given

#### 7. payment_submitted
**Trigger**: User clicks payment submit button
**Properties**:
- `amount` (number, required) - Donation amount
- `currency` (enum, required) - USD | CAD | EUR
- `recurring` (boolean, required) - Is recurring donation
- `payment_method` (enum, optional) - card | paypal | other
- `total_amount` (number, required) - amount + fee if applicable

#### 8. donation_completed
**Trigger**: Payment successfully processed
**Properties**:
- `gift_id` (UUID, required) - Gift database ID
- `amount` (number, required) - Donation amount
- `currency` (enum, required) - USD | CAD | EUR
- `recurring` (boolean, required) - Is recurring donation
- `processor` (enum, required) - stripe | adyen | paypal
- `processing_time_ms` (number, optional) - Time to process
- `receipt_sent` (boolean, optional) - Receipt delivery status

#### 9. donation_failed
**Trigger**: Payment processing fails
**Properties**:
- `amount` (number, required) - Attempted donation amount
- `currency` (enum, required) - USD | CAD | EUR
- `processor` (enum, required) - stripe | adyen | paypal
- `error_code` (string, required) - Error code (no sensitive data)
- `error_message` (string, required) - User-friendly error message
- `decline_reason` (string, optional) - Generic decline reason
- `retry_available` (boolean, optional) - Can user retry

---

## Client-Side Tracking

### Setup

Initialize analytics in your root layout:

```typescript
// app/layout.tsx
'use client';

import { usePageTracking } from '@/hooks/useAnalytics';

export default function RootLayout({ children }) {
  usePageTracking(); // Automatic page view tracking

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Track Events in Components

```typescript
// app/donate/[slug]/page.tsx
'use client';

import { useDonationFunnelTracking } from '@/hooks/useAnalytics';
import { useEffect } from 'react';

export default function DonatePage({ campaign }) {
  const { trackDonationStarted, trackAmountSelected } = useDonationFunnelTracking();

  useEffect(() => {
    // Track page view
    trackDonationStarted({
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      form_id: formId,
    });
  }, []);

  const handleAmountSelect = (amount: number) => {
    trackAmountSelected({
      amount,
      currency: 'USD',
      amount_type: 'preset',
    });
  };

  return <DonationForm onAmountSelect={handleAmountSelect} />;
}
```

### User Identification

Identify users after authentication:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const { identify } = useAnalytics();

// After successful login/registration
identify(donorId, {
  // Non-PII traits only
  has_recurring: true,
  last_donation_date: '2025-01-15',
  lifetime_value: 500,
});
```

### UTM Parameter Tracking

UTM parameters are automatically captured and stored in session storage:

```typescript
import { getCurrentUTMParams, storeUTMParams } from '@/lib/analytics';

// On initial page load
const utmParams = getCurrentUTMParams();
storeUTMParams(utmParams);

// UTM params are automatically included in all events
```

---

## Server-Side Logging

### API Route Handler

Analytics events are sent to `/api/analytics/track`:

```typescript
// POST /api/analytics/track
// Body: { events: AnalyticsEvent[] }

const response = await fetch('/api/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    events: [
      {
        event: 'donation_completed',
        gift_id: '...',
        amount: 100,
        currency: 'USD',
      },
    ],
  }),
});
```

### Server-Side Event Logging

Log events from tRPC procedures:

```typescript
// src/server/api/routers/donation.ts
import { getAnalyticsLogger } from '@/server/analytics/logger';

export const donationRouter = createTRPCRouter({
  create: rateLimitedProcedure
    .input(createGiftSchema)
    .mutation(async ({ ctx, input }) => {
      const gift = await ctx.db.gift.create({ data: input });

      // Log analytics event
      const logger = getAnalyticsLogger(ctx.db);
      await logger.logEvent({
        event: 'donation_completed',
        gift_id: gift.id,
        amount: input.amount,
        currency: input.currency,
        campaign_id: input.campaignId,
      });

      return gift;
    }),
});
```

---

## Dashboard Queries

### tRPC Analytics Procedures

All analytics queries are exposed via the `analytics` tRPC router:

#### 1. Conversion Funnel

```typescript
const conversionMetrics = await trpc.analytics.getConversionFunnel.useQuery({
  campaignId: '123e4567-e89b-12d3-a456-426614174000',
  dateRange: {
    start: '2025-01-01T00:00:00Z',
    end: '2025-01-31T23:59:59Z',
  },
});

// Returns:
{
  total_started: 1000,
  total_completed: 750,
  total_failed: 50,
  conversion_rate: 0.75,
  abandonment_rate: 0.20,
}
```

#### 2. Gift Metrics

```typescript
const giftMetrics = await trpc.analytics.getGiftMetrics.useQuery({
  campaignId: '123e4567-e89b-12d3-a456-426614174000',
  dateRange: { start: '...', end: '...' },
});

// Returns:
{
  total_gifts: 750,
  total_revenue: 75000,
  average_gift: 100,
  median_gift: 75,
  recurring_count: 200,
  recurring_uptake: 0.267,
  fee_cover_count: 300,
  fee_cover_rate: 0.40,
  fee_cover_uplift: 0.05,
}
```

#### 3. Funnel Step Analysis

```typescript
const funnelSteps = await trpc.analytics.getFunnelSteps.useQuery({
  campaignId: '123e4567-e89b-12d3-a456-426614174000',
  dateRange: { start: '...', end: '...' },
});

// Returns:
[
  {
    step_name: 'Started',
    step_count: 1000,
    drop_off_count: 0,
    drop_off_rate: 0,
    cumulative_rate: 1.0,
  },
  {
    step_name: 'Amount Selected',
    step_count: 900,
    drop_off_count: 100,
    drop_off_rate: 0.10,
    cumulative_rate: 0.90,
  },
  // ... more steps
]
```

#### 4. Abandonment Analysis

```typescript
const abandonment = await trpc.analytics.getAbandonmentAnalysis.useQuery({
  campaignId: '123e4567-e89b-12d3-a456-426614174000',
  dateRange: { start: '...', end: '...' },
});

// Returns:
{
  total_abandoned: 200,
  abandonment_by_step: {
    'amount_selected': 50,
    'donor_info_submitted': 80,
    'payment_submitted': 70,
  },
  abandonment_rate: 0.20,
}
```

#### 5. Campaign Performance Summary

```typescript
const performance = await trpc.analytics.getCampaignPerformance.useQuery({
  campaignSlug: 'spring-appeal-2025',
  dateRange: { start: '...', end: '...' },
});

// Returns comprehensive metrics for campaign
```

#### 6. Real-Time Activity

```typescript
const recentDonations = await trpc.analytics.getRecentActivity.useQuery({
  limit: 10,
  campaignId: '123e4567-e89b-12d3-a456-426614174000',
});

// Returns last 10 completed donations
```

#### 7. Export Analytics

```typescript
const exportData = await trpc.analytics.exportAnalytics.useQuery({
  campaignId: '123e4567-e89b-12d3-a456-426614174000',
  dateRange: { start: '...', end: '...' },
  format: 'csv', // or 'json'
});

// Returns CSV or JSON export
```

---

## OpenTelemetry Instrumentation

### Initialize Telemetry

```typescript
// src/server.ts or instrumentation.ts
import { initializeTelemetry } from '@/lib/telemetry';

initializeTelemetry();
```

### Trace Donation Flow

```typescript
import { traceDonationFlow, recordDonationMetrics } from '@/lib/telemetry';

const gift = await traceDonationFlow(
  'create',
  {
    giftId: '...',
    donorId: '...',
    campaignId: '...',
    amount: 100,
    currency: 'USD',
    processor: 'stripe',
  },
  async (span) => {
    // Create gift in database
    const gift = await db.gift.create({ data: input });

    span.setAttribute('gift.status', gift.status);

    return gift;
  }
);

// Record business metrics
recordDonationMetrics(gift.id, {
  amount: gift.amount,
  currency: gift.currency,
  recurring: false,
  processor: gift.processor,
  processingTime: 1234, // ms
  feeCovered: gift.donorCoversFee,
});
```

### Trace Payment Operations

```typescript
import { tracePaymentOperation } from '@/lib/telemetry';

const payment = await tracePaymentOperation(
  'stripe',
  'create_payment',
  {
    amount: 100,
    currency: 'USD',
    paymentMethodType: 'card',
  },
  async (span) => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 10000,
      currency: 'usd',
    });

    span.setAttribute('payment.intent_id', paymentIntent.id);

    return paymentIntent;
  }
);
```

### Monitor API Endpoints

```typescript
import { monitorEndpoint } from '@/lib/telemetry';

export const donationRouter = createTRPCRouter({
  create: rateLimitedProcedure
    .input(createGiftSchema)
    .mutation(async ({ ctx, input }) => {
      return monitorEndpoint('donation.create')(async () => {
        // Your implementation
        return await createGift(input);
      });
    }),
});
```

---

## Privacy & Compliance

### PII Redaction

All events are automatically redacted of PII before storage:

**Redacted Fields**:
- `email`, `phone`
- `firstName`, `lastName`, `name`
- `street1`, `street2`, `city`, `state`, `zip`
- `recipientEmail`, `recipientName`, `honoreeName`
- `card_number`, `cvv`, `pan`

**Safe to Track**:
- User/donor IDs (UUIDs)
- Session IDs
- Campaign/form IDs
- Gift amounts and currencies
- UTM parameters
- Aggregated metrics

### Consent Management

Respect user consent preferences:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const { updateConsent } = useAnalytics();

// Update consent when user changes preferences
updateConsent({
  analytics_tracking: true,
  performance_tracking: true,
  marketing_attribution: false,
});
```

### Do Not Track

Analytics respects the Do Not Track browser setting:

```typescript
// Automatically disabled if DNT is enabled
const analytics = new AnalyticsClient({
  respectDoNotTrack: true, // Default: true
});
```

### Data Retention

Analytics events are retained for **12 months** in the database. Older events are automatically purged via scheduled jobs.

### GDPR Right to Erasure

To delete analytics data for a specific user:

```sql
DELETE FROM analytics_events WHERE user_id = '<donor-id>';
```

---

## Testing

### Unit Tests

Run analytics tests:

```bash
npm run test src/__tests__/analytics/
```

### Test Coverage

- Event validation and schema compliance
- PII redaction
- Batching and retry logic
- UTM parameter extraction
- Consent management
- Metric calculations

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { AnalyticsClient } from '@/lib/analytics';

describe('AnalyticsClient', () => {
  it('should redact PII from events', async () => {
    const analytics = new AnalyticsClient();

    const eventWithPII = {
      event: 'donation_started',
      email: 'donor@example.com', // Should be redacted
      campaign_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    await analytics.trackEvent(eventWithPII);

    const queuedEvent = analytics['eventQueue'][0];
    expect(queuedEvent).not.toHaveProperty('email');
  });
});
```

---

## Troubleshooting

### Events Not Appearing in Database

1. **Check batch settings**: Events are batched before sending. Force flush:
   ```typescript
   await analytics.flush();
   ```

2. **Verify API endpoint**: Ensure `/api/analytics/track` is accessible:
   ```bash
   curl -X POST http://localhost:3000/api/analytics/track \
     -H "Content-Type: application/json" \
     -d '{"events":[]}'
   ```

3. **Check validation errors**: Invalid events are logged to console:
   ```typescript
   // Enable debug mode
   const analytics = new AnalyticsClient({ debug: true });
   ```

### High Drop-Off Rates

Analyze abandonment by step:

```typescript
const abandonment = await trpc.analytics.getAbandonmentAnalysis.useQuery({
  campaignId: '...',
  dateRange: { start: '...', end: '...' },
});

console.log('Abandonment by step:', abandonment.abandonment_by_step);
```

### Missing UTM Parameters

UTM parameters are stored in session storage on first page load. If missing:

1. Check session storage is enabled
2. Verify UTM params are in URL
3. Manually store params:
   ```typescript
   storeUTMParams({
     source: 'email',
     medium: 'newsletter',
     campaign: 'spring-appeal',
   });
   ```

### OpenTelemetry Not Working

1. **Verify initialization**:
   ```typescript
   initializeTelemetry(); // Call once at app startup
   ```

2. **Check environment variables**:
   ```bash
   OTEL_ENABLED=true
   OTEL_EXPORTER_OTLP_ENDPOINT=https://your-collector.com
   OTEL_EXPORTER_API_KEY=your-api-key
   ```

3. **View traces in console** (development):
   ```bash
   # Traces are logged to console if no endpoint configured
   ```

---

## Performance Considerations

### Batching

Events are batched to reduce network requests:

- **Batch size**: 10 events (configurable)
- **Batch timeout**: 5 seconds (configurable)
- **Auto-flush**: On page unload

### Sampling

For high-volume events, configure sampling:

```typescript
const analytics = new AnalyticsClient({
  sampleRate: 0.1, // Sample 10% of events
});
```

### Async Processing

All analytics tracking is async and non-blocking:

```typescript
// Fire and forget
trackEvent(event); // Does not block

// Force wait (rare)
await trackEvent(event);
await analytics.flush();
```

---

## Integration with External Services

### Segment

Enable Segment integration:

```bash
NEXT_PUBLIC_SEGMENT_WRITE_KEY=your-write-key
```

Events are automatically sent to Segment.

### Google Analytics

Enable Google Analytics:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Events are sent as GA4 events.

### Data Warehouse Export

Configure data warehouse export:

```bash
ANALYTICS_WAREHOUSE_ENABLED=true
ANALYTICS_WAREHOUSE_ENDPOINT=https://warehouse.example.com/import
ANALYTICS_WAREHOUSE_API_KEY=your-api-key
```

Events are batched and sent to your data warehouse (BigQuery, Snowflake, etc.).

---

## Summary

This analytics system provides:

- **Comprehensive event tracking** for the donation funnel
- **Privacy-first design** with automatic PII redaction
- **Real-time dashboards** with conversion, gift, and abandonment metrics
- **OpenTelemetry instrumentation** for performance monitoring
- **GDPR/CCPA compliance** with consent management and data retention
- **Production-ready** with batching, retry logic, and error handling

For questions or support, contact the data analytics team.
