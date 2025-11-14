# tRPC Routers Implementation Guide

## Overview

This document provides a comprehensive guide to the tRPC routers implemented for the Raisin Next donation management system. All routers follow T3 stack conventions with full type safety, input validation, authorization, and audit logging.

## Architecture

### Technology Stack
- **tRPC**: Type-safe RPC framework for end-to-end type safety
- **Prisma**: ORM for PostgreSQL database operations
- **Zod**: Schema validation for all inputs
- **NextAuth.js**: Authentication and session management
- **Superjson**: Data serialization for complex types (Dates, BigInt, etc.)

### Directory Structure
```
src/server/api/
├── trpc.ts                 # Base tRPC configuration and middleware
├── schemas.ts              # Zod validation schemas
├── root.ts                 # Root router combining all routers
└── routers/
    ├── donation.ts         # One-time donation operations
    ├── recurring.ts        # Recurring plan management
    ├── tribute.ts          # Tribute dedication operations
    ├── campaign.ts         # Campaign retrieval and listing
    ├── receipt.ts          # Tax receipt operations
    └── audit.ts            # Audit log operations
```

## Core Features

### 1. Type Safety
All routers provide end-to-end type safety from database to frontend:
- Prisma-generated types ensure database schema alignment
- Zod schemas validate inputs at runtime
- tRPC infers types automatically for frontend consumption
- No `any` types used throughout implementation

### 2. Input Validation
Every procedure uses Zod schemas for comprehensive input validation:
- Email format validation (RFC 5322 compliant)
- Phone number format (E.164 recommended)
- Amount constraints (min/max, decimal precision)
- String length limits and trimming
- Enum validation for status fields
- UUID validation for entity references

### 3. Authorization Patterns

#### Public Procedures
No authentication required (donation creation, campaign lookup):
```typescript
export const publicProcedure = t.procedure;
```

#### Rate-Limited Procedures
Public with rate limiting (10 requests/minute per IP):
```typescript
export const rateLimitedProcedure = publicProcedure.use(rateLimit(10, 60000));
```

#### Protected Procedures
Requires authentication:
```typescript
export const protectedProcedure = t.procedure.use(enforceAuth);
```

#### Admin Procedures
Requires admin role:
```typescript
export const adminProcedure = t.procedure.use(enforceRole(['admin']));
```

#### System Procedures
For webhooks and internal operations (requires system token):
```typescript
export const systemProcedure = t.procedure.use(enforceSystem);
```

### 4. Audit Logging
All mutations automatically create audit log entries:
- Actor (user ID or "system")
- Action (CREATE, UPDATE, DELETE, READ)
- Resource (e.g., "gift:uuid")
- Before/after diffs (PII redacted)
- Request metadata (IP, user agent)
- Immutable append-only logs

### 5. Security Features

#### PII Protection
- Sensitive fields redacted from audit logs
- Field-level encryption support (schema annotations)
- No PII in error messages or logs

#### SQL Injection Prevention
- Prisma uses parameterized queries exclusively
- No raw SQL concatenation
- Input sanitization via Zod

#### Rate Limiting
- In-memory store for development (replace with Redis for production)
- Configurable limits per endpoint
- Returns 429 with retry-after information

#### RBAC Enforcement
- Role-based access control on all protected procedures
- Resource-level permissions (donor can only access their own data)
- Fail-secure design (deny by default)

## Router Specifications

### Donation Router (`router.donation`)

#### `create` (mutation)
**Authorization**: Public, rate-limited (10/min per IP)

**Input**:
```typescript
{
  donorEmail: string,        // Required, email format
  firstName: string,         // Required, 1-100 chars
  lastName: string,          // Required, 1-100 chars
  phone?: string,            // Optional, E.164 format
  amount: number,            // Required, $1-$100,000, 2 decimal places
  currency: "USD" | "CAD" | "EUR",
  campaignId?: string,       // Optional, UUID
  formId?: string,           // Optional, UUID
  tributeId?: string,        // Optional, UUID
  donorCoversFee: boolean,   // Default: false
  metadata?: {               // Optional UTM parameters
    utmSource?: string,
    utmMedium?: string,
    utmCampaign?: string,
    utmContent?: string,
    utmTerm?: string,
    referrer?: string
  }
}
```

**Business Logic**:
1. Find or create donor by email (deduplication)
2. Check for duplicate submissions (5-minute window)
3. Validate campaign/form/tribute existence
4. Calculate fee amount if donor covers fees
5. Create gift with status=pending
6. Create audit log entry

**Returns**: Gift object with donor, campaign, tribute relations

**Error Handling**:
- `BAD_REQUEST`: Duplicate submission, inactive campaign
- `NOT_FOUND`: Campaign, form, or tribute not found
- `TOO_MANY_REQUESTS`: Rate limit exceeded

#### `getById` (query)
**Authorization**: Owner or Admin

**Input**: `{ giftId: string }`

**Returns**: Gift with donor, campaign, tribute, receipt relations

#### `list` (query)
**Authorization**: Admin only

**Input**:
```typescript
{
  campaignId?: string,
  status?: "pending" | "success" | "failed" | "refunded",
  dateRange?: { from?: Date, to?: Date },
  cursor?: { id: string, createdAt: Date },
  limit: number  // 1-100, default 20
}
```

**Returns**: Paginated gift list with nextCursor

#### `update` (mutation)
**Authorization**: System/webhook only

**Input**:
```typescript
{
  giftId: string,
  status: "pending" | "success" | "failed" | "refunded",
  processorRef?: string,
  completedAt?: Date,
  processorFee?: number,
  refundedAt?: Date
}
```

**Business Logic**:
1. Idempotency check (processorRef)
2. Calculate net amount on success
3. Generate receipt if payment succeeded
4. Create audit log

**Returns**: Updated gift

---

### Recurring Router (`router.recurring`)

#### `create` (mutation)
**Authorization**: Authenticated donors

**Input**:
```typescript
{
  donorEmail: string,
  firstName: string,
  lastName: string,
  phone?: string,
  amount: number,            // Min $5, max $10,000
  currency: "USD" | "CAD" | "EUR",
  frequency: "monthly" | "quarterly" | "annually",
  nextChargeDate: Date,
  campaignId?: string,
  donorCoversFee: boolean,
  mandateId: string          // From payment processor
}
```

**Business Logic**:
1. Find or create donor
2. Validate campaign
3. Calculate fee amount
4. Create recurring plan with status=active
5. Create audit log

**Returns**: RecurringPlan with donor, campaign relations

#### `update` (mutation)
**Authorization**: Owner or Admin

**Input**:
```typescript
{
  planId: string,
  amount?: number,
  frequency?: "monthly" | "quarterly" | "annually",
  donorCoversFee?: boolean
}
```

**Business Logic**:
1. Verify ownership
2. Cannot update cancelled plans
3. Recalculate next charge date if frequency changed
4. Update mandate with payment processor (external call)
5. Create audit log

**Returns**: Updated plan

#### `pause` (mutation)
**Authorization**: Owner or Admin

**Input**: `{ planId: string }`

**Business Logic**:
1. Set status=paused
2. Set pausedAt timestamp
3. Create audit log

**Returns**: Updated plan

#### `cancel` (mutation)
**Authorization**: Owner or Admin

**Input**: `{ planId: string, reason?: string }`

**Business Logic**:
1. Set status=cancelled
2. Set cancelledAt timestamp
3. Cancel mandate with payment processor (external call)
4. Create audit log with reason

**Returns**: Updated plan

#### `list` (query)
**Authorization**: Owner or Admin

**Input**:
```typescript
{
  donorId?: string,  // Admin can specify, otherwise uses session
  status?: "active" | "paused" | "cancelled",
  limit: number,
  cursor?: { id: string, createdAt: Date }
}
```

**Returns**: Paginated recurring plans

---

### Tribute Router (`router.tribute`)

#### `create` (mutation)
**Authorization**: Public

**Input**:
```typescript
{
  type: "honour" | "memory" | "celebration",
  honoreeName: string,    // 1-200 chars
  message?: string        // 0-500 chars
}
```

**Returns**: Tribute object

#### `get` (query)
**Authorization**: Public

**Input**: `{ tributeId: string }`

**Returns**: Tribute object

---

### Campaign Router (`router.campaign`)

#### `getBySlug` (query)
**Authorization**: Public (active campaigns only for non-admins)

**Input**: `{ slug: string }`

**Business Logic**:
1. Retrieve campaign with published forms
2. Calculate progress metrics (currentAmount, donorCount, progressPercentage)
3. Only show active campaigns to public users

**Returns**:
```typescript
{
  ...campaign,
  forms: Form[],
  progress: {
    currentAmount: number,
    donorCount: number,
    progressPercentage: number
  }
}
```

#### `list` (query)
**Authorization**: Public (filtered) or Admin (all)

**Input**:
```typescript
{
  status?: "draft" | "active" | "paused" | "closed",
  limit: number,
  cursor?: { id: string, createdAt: Date }
}
```

**Business Logic**:
- Public users only see active campaigns
- Admins can filter by any status
- Progress calculated for each campaign

**Returns**: Paginated campaigns with progress

---

### Receipt Router (`router.receipt`)

#### `getById` (query)
**Authorization**: Owner or Admin

**Input**: `{ receiptId: string }`

**Returns**: Receipt with gift, donor, campaign, tribute details

#### `regenerate` (mutation)
**Authorization**: Admin only

**Input**: `{ receiptId: string, reason: string }`

**Business Logic**:
1. Create new receipt with correctedFromId
2. Generate new receipt number (e.g., "RCP-2025-000001-C1")
3. Include correction reason in regionalData
4. Generate PDF (external service)
5. Send corrected receipt via email
6. Create audit log

**Returns**: New receipt

---

### Audit Router (`router.audit`)

#### `log` (mutation)
**Authorization**: System only

**Input**:
```typescript
{
  actor: string,
  action: "CREATE" | "UPDATE" | "DELETE" | "READ",
  resource: string,      // e.g., "gift:uuid"
  diffs: any,            // JSON object
  ipAddress?: string,
  userAgent?: string
}
```

**Returns**: Audit entry

#### `getByResource` (query)
**Authorization**: Admin only

**Input**:
```typescript
{
  resource: string,
  limit: number,
  cursor?: { id: string, createdAt: Date }
}
```

**Returns**: Paginated audit trail

---

## Usage Examples

### Frontend (React Query + tRPC)

#### Create Donation
```typescript
import { trpc } from '@/utils/trpc';

function DonationForm() {
  const createDonation = trpc.donation.create.useMutation({
    onSuccess: (gift) => {
      console.log('Donation created:', gift.id);
      // Redirect to payment processor
    },
    onError: (error) => {
      console.error('Donation failed:', error.message);
    }
  });

  const handleSubmit = (data) => {
    createDonation.mutate({
      donorEmail: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      amount: data.amount,
      currency: 'USD',
      donorCoversFee: data.coverFee,
      metadata: {
        utmSource: 'email',
        utmCampaign: 'spring2025'
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={createDonation.isLoading}>
        {createDonation.isLoading ? 'Processing...' : 'Donate'}
      </button>
    </form>
  );
}
```

#### Get Campaign
```typescript
import { trpc } from '@/utils/trpc';

function CampaignPage({ slug }: { slug: string }) {
  const { data: campaign, isLoading } = trpc.campaign.getBySlug.useQuery({
    slug
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{campaign.name}</h1>
      <p>{campaign.description}</p>
      <ProgressBar
        current={campaign.progress.currentAmount}
        target={campaign.targetAmount}
        percentage={campaign.progress.progressPercentage}
      />
    </div>
  );
}
```

#### List Recurring Plans
```typescript
import { trpc } from '@/utils/trpc';

function RecurringPlansList() {
  const { data, fetchNextPage, hasNextPage } =
    trpc.recurring.list.useInfiniteQuery(
      { limit: 10, status: 'active' },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor
      }
    );

  return (
    <div>
      {data?.pages.map((page) =>
        page.items.map((plan) => (
          <RecurringPlanCard key={plan.id} plan={plan} />
        ))
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </div>
  );
}
```

#### Update Recurring Plan
```typescript
const updatePlan = trpc.recurring.update.useMutation({
  onSuccess: () => {
    toast.success('Plan updated successfully');
  }
});

const handleUpdateAmount = (planId: string, newAmount: number) => {
  updatePlan.mutate({
    planId,
    amount: newAmount
  });
};
```

### Backend (Webhook Handler)

#### Process Payment Success Webhook
```typescript
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

export async function POST(req: Request) {
  // Verify webhook signature (HMAC)
  const isValid = verifyWebhookSignature(req);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const payload = await req.json();
  const { giftId, processorRef, completedAt, processorFee } = payload;

  // Create tRPC context with system token
  const ctx = await createTRPCContext({
    req: {
      headers: {
        authorization: `Bearer ${process.env.SYSTEM_TOKEN}`
      }
    }
  } as any);

  // Call tRPC procedure
  const caller = appRouter.createCaller(ctx);

  try {
    await caller.donation.update({
      giftId,
      status: 'success',
      processorRef,
      completedAt: new Date(completedAt),
      processorFee
    });

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return new Response('Processing failed', { status: 500 });
  }
}
```

## Performance Optimization

### Database Queries
- All queries use Prisma's `select` and `include` to fetch only needed fields
- Strategic indexes on common query patterns (defined in schema)
- Cursor-based pagination prevents offset performance issues
- Transactions ensure atomicity for multi-step operations

### Caching Strategy
- ISR/Edge caching for campaign pages (Next.js)
- React Query caching on client (stale-while-revalidate)
- Consider Redis for rate limiting in production

### N+1 Prevention
- Use `include` for related data in single query
- Batch operations when processing multiple records
- Monitor with Prisma query logging

## Error Handling

### tRPC Error Codes
```typescript
// Client errors (4xx)
BAD_REQUEST          // Invalid input, business rule violation
UNAUTHORIZED         // Authentication required
FORBIDDEN            // Insufficient permissions
NOT_FOUND            // Resource doesn't exist
TOO_MANY_REQUESTS    // Rate limit exceeded

// Server errors (5xx)
INTERNAL_SERVER_ERROR  // Unexpected error
```

### Error Response Format
```typescript
{
  message: "User-friendly error message",
  code: "BAD_REQUEST",
  data: {
    zodError: {
      fieldErrors: {
        amount: ["Amount must be at least $1"]
      }
    }
  }
}
```

## Testing Strategy

### Unit Tests (Vitest)
```typescript
import { describe, it, expect } from 'vitest';
import { calculateFeeAmount } from './donation';

describe('calculateFeeAmount', () => {
  it('should calculate Stripe fees correctly', () => {
    expect(calculateFeeAmount(100, 'stripe')).toBe(3.20);
  });

  it('should calculate PayPal fees correctly', () => {
    expect(calculateFeeAmount(100, 'paypal')).toBe(3.48);
  });
});
```

### Integration Tests
```typescript
import { appRouter } from '@/server/api/root';
import { createInnerTRPCContext } from '@/server/api/trpc';

describe('donation.create', () => {
  it('should create donation and donor', async () => {
    const ctx = createInnerTRPCContext({ session: null });
    const caller = appRouter.createCaller(ctx);

    const gift = await caller.donation.create({
      donorEmail: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      amount: 100,
      currency: 'USD',
      donorCoversFee: false
    });

    expect(gift.status).toBe('pending');
    expect(gift.donor.emails).toContain('test@example.com');
  });
});
```

## Deployment Checklist

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
SYSTEM_TOKEN=your-secure-system-token-here
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://yourdomain.com
```

### Database Migrations
```bash
# Development
pnpm db:migrate

# Production
pnpm db:migrate:deploy
```

### Production Considerations
1. Replace in-memory rate limiting with Redis
2. Configure Prisma connection pooling for serverless
3. Set up CloudWatch/DataDog for OpenTelemetry traces
4. Enable CORS for tRPC endpoints if needed
5. Configure Secrets Manager for sensitive values
6. Set up webhook signature verification
7. Implement idempotency keys for payment operations
8. Configure email service for receipts
9. Set up S3 for receipt PDF storage
10. Enable database backups and point-in-time recovery

## Security Hardening

### CSRF Protection
```typescript
// Implemented by Next.js for App Router automatically
// For API routes, use next-csrf package
```

### Rate Limiting (Production)
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});
```

### Webhook Signature Verification
```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

## Monitoring & Observability

### OpenTelemetry Instrumentation
All tRPC procedures automatically instrumented with:
- Span name: `trpc.{router}.{procedure}`
- Attributes: procedure type, input (sanitized), user ID
- Duration tracking
- Error recording

### Key Metrics to Monitor
- Donation creation rate (gifts/minute)
- Conversion funnel drop-off
- Payment success rate
- Average gift amount
- Recurring plan churn rate
- API latency (p50, p95, p99)
- Error rates by endpoint
- Rate limit hit rate

### Alerting Thresholds
- Error rate > 5%: Warning
- Error rate > 10%: Critical
- p95 latency > 2s: Warning
- Payment success rate < 95%: Critical
- Database connection pool exhaustion: Critical

## Support & Troubleshooting

### Common Issues

#### "Rate limit exceeded"
- Check IP address extraction in production (behind proxy)
- Increase rate limit for legitimate high-traffic scenarios
- Implement user-based rate limiting for authenticated endpoints

#### "Duplicate donation detected"
- Verify duplicate detection window (5 minutes)
- Check for clock skew issues
- Consider idempotency keys for payment processor

#### "Transaction deadlock"
- Review transaction isolation levels
- Minimize transaction duration
- Implement retry logic with exponential backoff

### Debug Mode
```typescript
// Enable Prisma query logging
const db = new PrismaClient({
  log: ['query', 'error', 'warn']
});
```

## Contributing Guidelines

### Adding New Procedures
1. Define Zod schema in `schemas.ts`
2. Implement procedure in appropriate router
3. Add authorization middleware
4. Implement business logic with transactions
5. Add audit logging
6. Write unit tests
7. Update this README

### Code Review Checklist
- [ ] Input validation with Zod
- [ ] Authorization checks
- [ ] Transaction usage for multi-step operations
- [ ] Audit logging for mutations
- [ ] PII redaction in logs
- [ ] Error handling with user-friendly messages
- [ ] Type safety (no `any` types)
- [ ] Tests covering edge cases
- [ ] Documentation updated

## License

This implementation is part of the Raisin Next project and follows the project's licensing terms.

## Contact

For questions or issues related to tRPC routers:
- Backend Engineering Team
- Documentation: `/docs`
- Architecture Decision Records: `/docs/adr`
