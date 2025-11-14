# Analytics Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Configure Environment

Copy analytics variables to your `.env` file:

```bash
# Analytics (optional - works without external providers)
NEXT_PUBLIC_SEGMENT_WRITE_KEY=              # Optional: Segment
NEXT_PUBLIC_GA_MEASUREMENT_ID=              # Optional: Google Analytics
NEXT_PUBLIC_ANALYTICS_ENDPOINT=/api/analytics/track

# OpenTelemetry (optional)
OTEL_ENABLED=true
OTEL_SERVICE_NAME=raisin-next
```

### 3. Run Database Migration

```bash
npm run db:generate
npm run db:migrate:deploy
```

### 4. Initialize in App

```typescript
// app/layout.tsx
import { usePageTracking } from '@/hooks/useAnalytics';

export default function RootLayout({ children }) {
  usePageTracking(); // ← Add this line
  return <html><body>{children}</body></html>;
}
```

Done! Analytics is now tracking page views.

---

## Track Donation Events (3 lines of code)

```typescript
import { useDonationFunnelTracking } from '@/hooks/useAnalytics';

const { trackDonationStarted, trackAmountSelected, trackDonationCompleted } = useDonationFunnelTracking();

// On page load
trackDonationStarted({ campaign_id, campaign_slug, form_id });

// When amount selected
trackAmountSelected({ amount: 100, currency: 'USD', amount_type: 'preset' });

// When payment succeeds
trackDonationCompleted({ gift_id, amount: 100, currency: 'USD', processor: 'stripe' });
```

---

## Query Dashboard Metrics

```typescript
import { trpc } from '@/trpc/client';

// Conversion funnel
const metrics = trpc.analytics.getConversionFunnel.useQuery({
  campaignId: '...',
  dateRange: { start: '2025-01-01T00:00:00Z', end: '2025-01-31T23:59:59Z' },
});

console.log(metrics.data);
// {
//   total_started: 1000,
//   total_completed: 750,
//   conversion_rate: 0.75
// }
```

---

## All Funnel Events

| Event | When to Track | Required Properties |
|-------|---------------|---------------------|
| `donation_started` | User lands on donation page | `campaign_id`, `campaign_slug` |
| `amount_selected` | Amount chosen | `amount`, `currency`, `amount_type` |
| `recurring_toggled` | Recurring switched on/off | `recurring`, `frequency` |
| `tribute_added` | Tribute selected | `tribute_type` |
| `fee_coverage_toggled` | Fee coverage checked | `donor_covers_fee`, `fee_amount` |
| `donor_info_submitted` | Contact info entered | `is_authenticated` |
| `payment_submitted` | Payment button clicked | `amount`, `currency`, `total_amount` |
| `donation_completed` | ✅ Payment successful | `gift_id`, `amount`, `processor` |
| `donation_failed` | ❌ Payment failed | `error_code`, `error_message` |

---

## Dashboard Queries

| Query | What It Returns | Use Case |
|-------|----------------|----------|
| `getConversionFunnel` | Conversion rate, abandonment | Overall performance |
| `getGiftMetrics` | Average gift, recurring uptake, fee coverage | Financial metrics |
| `getFunnelSteps` | Drop-off by step | UX optimization |
| `getAbandonmentAnalysis` | Where users quit | Identify friction points |
| `getCampaignPerformance` | All metrics for one campaign | Campaign reporting |
| `getRecentActivity` | Last N donations | Live dashboard |
| `exportAnalytics` | CSV/JSON export | Finance reporting |

---

## Privacy & Compliance

### Automatic PII Redaction

These fields are **automatically removed** before storage:
- `email`, `phone`, `firstName`, `lastName`
- `street1`, `street2`, `city`, `state`, `zip`
- `card_number`, `cvv`, `pan`

### Safe to Track

- User IDs (UUIDs)
- Session IDs
- Campaign/form IDs
- Gift amounts
- UTM parameters
- Timestamps

### Consent Management

```typescript
const { updateConsent } = useAnalytics();

updateConsent({
  analytics_tracking: true,
  performance_tracking: true,
  marketing_attribution: false,
});
```

---

## Performance Tips

### Batching (automatic)
- Events batched: 10 events max
- Auto-flush: Every 5 seconds
- Page unload: Force flush

### Force Flush (when needed)

```typescript
import { analytics } from '@/lib/analytics';

await analytics.flush(); // Ensure all events sent
```

### Sampling (for high volume)

```typescript
const analytics = new AnalyticsClient({
  sampleRate: 0.1, // Sample 10% of events
});
```

---

## Testing

```bash
# Run analytics tests
npm test src/__tests__/analytics/

# Test API endpoint
curl -X POST http://localhost:3000/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{"events":[]}'
```

---

## Troubleshooting

### Events not in database?

1. Check batching: `await analytics.flush()`
2. Enable debug: `const analytics = new AnalyticsClient({ debug: true })`
3. Verify endpoint: `curl /api/analytics/track`

### UTM params missing?

```typescript
import { storeUTMParams, getCurrentUTMParams } from '@/lib/analytics';

const params = getCurrentUTMParams();
storeUTMParams(params); // Store in session
```

### Need custom event?

```typescript
analytics.trackEvent({
  event: 'custom_event_name', // Must match schema
  campaign_id: '...',
  // ... properties
});
```

---

## OpenTelemetry (Optional)

### Enable Tracing

```bash
# .env
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-collector.com
```

### Trace Donation Flow

```typescript
import { traceDonationFlow } from '@/lib/telemetry';

const gift = await traceDonationFlow('create', { giftId, amount }, async (span) => {
  // Your code here
  return await createGift();
});
```

### Monitor API Latency

```typescript
import { monitorEndpoint } from '@/lib/telemetry';

return monitorEndpoint('donation.create')(async () => {
  // Your implementation
});
```

---

## Next Steps

1. **Build Dashboard**: Use tRPC queries to create admin analytics dashboard
2. **Set Alerts**: Monitor conversion rate drops, error spikes
3. **A/B Testing**: Track variant performance
4. **Export Automation**: Schedule daily finance exports

---

## Resources

- **Full Documentation**: `/docs/ANALYTICS.md`
- **Example Integration**: `/docs/examples/donation-form-analytics-integration.tsx`
- **Implementation Summary**: `/ANALYTICS-IMPLEMENTATION-SUMMARY.md`
- **Tests**: `/src/__tests__/analytics/analytics.test.ts`

---

## Support

Questions? Check the full documentation or contact:
- Data Analytics Team: analytics@raisin.org
- Technical Support: support@raisin.org
