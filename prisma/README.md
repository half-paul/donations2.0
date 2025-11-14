# Prisma Schema Documentation

## Overview

This Prisma schema implements the complete data model for the Donation Page feature, supporting one-time gifts, recurring plans, campaigns, forms, tributes, e-cards, receipts, and comprehensive audit logging.

## Database

**Target Database**: PostgreSQL 14+ (AWS Aurora/RDS compatible)

**Key Features**:
- JSONB support for flexible metadata storage
- Array types for multi-value fields (emails, consents)
- Timestamptz for timezone-aware timestamps
- UUID primary keys for all tables
- Soft deletes with deletedAt timestamps
- Comprehensive indexing strategy

## Schema Structure

### Core Entities

#### Donor
Stores donor contact information, preferences, and consents.

**Key Features**:
- Multiple email addresses (array) for deduplication
- JSONB consents array with type, granted date, and source
- External IDs for CRM synchronization (Salesforce, Raiser's Edge)
- Communication preferences and do-not-contact flags
- Soft delete support for audit trail preservation

**PII Fields** (encrypt at rest):
- `emails`, `firstName`, `lastName`, `phone`
- Address fields: `street1`, `street2`, `city`, `state`, `zip`, `country`

**Indexes**:
- GIN index on `emails` array for fast lookups
- Composite index on `lastName`, `firstName` for name searches
- Indexes on `createdAt`, `deletedAt`, `phone`

#### Campaign
Fundraising campaigns with goals, dates, and configuration.

**Key Features**:
- Unique slug for URL routing
- Optional target amount and donor count
- Date ranges with optional end dates (for ongoing campaigns)
- Status workflow: draft → active → paused/closed
- Impact messaging for thank-you pages

**Indexes**:
- Unique index on `slug`
- Indexes on `status`, `startDate`, `endDate`, `createdAt`, `deletedAt`

#### Form
Donation form configurations with A/B testing support.

**Key Features**:
- JSONB schema for form builder configuration
- Variants array for A/B testing
- Versioning support
- CSS overrides for custom styling
- Publishing workflow

**Schema JSON Structure**:
```json
{
  "fields": [
    { "name": "amount", "type": "amount", "required": true },
    { "name": "firstName", "type": "text", "required": true }
  ],
  "presetAmounts": [25, 50, 100, 250],
  "customAmountEnabled": true,
  "minAmount": 1,
  "maxAmount": 100000
}
```

**Indexes**:
- Index on `campaignId` (foreign key)
- Indexes on `publishedAt`, `createdAt`

#### Gift
Individual donation transactions with full payment tracking.

**Key Features**:
- Multi-currency support (USD, CAD, EUR)
- Donor-covers-fee tracking with fee amount calculation
- Net amount calculation: `amount - processorFee + feeAmount`
- Payment processor reference for reconciliation
- Status workflow: pending → success/failed/refunded
- JSONB metadata for UTM parameters and source attribution
- Optional tribute association

**Financial Calculations**:
- `amount`: Donation amount
- `feeAmount`: Fee paid by donor (if `donorCoversFee = true`)
- `processorFee`: Actual fee charged by payment processor
- `netAmount`: `amount - processorFee + feeAmount`

**Indexes**:
- Indexes on `donorId`, `campaignId`, `formId`, `tributeId`
- Composite index on `processor`, `processorRef` for external lookups
- Composite index on `donorId`, `status` for donor history
- Composite index on `campaignId`, `createdAt` for reporting
- Indexes on `status`, `createdAt`, `completedAt`, `deletedAt`

#### RecurringPlan
Recurring donation subscriptions with mandate/subscription tracking.

**Key Features**:
- Frequency options: monthly, quarterly, annually
- Next charge date scheduling
- Status workflow: active → paused/cancelled
- Payment processor mandate ID (Stripe subscription, Adyen mandate)
- Donor-covers-fee support
- Optional campaign attribution

**Indexes**:
- Indexes on `donorId`, `campaignId`, `status`
- Index on `nextChargeDate` for charge scheduling
- Composite index on `processor`, `mandateId`
- Composite index on `donorId`, `status`

#### Tribute
Honour, memory, or celebration dedications.

**Key Features**:
- Type enum: honour, memory, celebration
- Honoree name and optional message
- Associated with gifts and e-cards

**Indexes**:
- Indexes on `type`, `createdAt`

#### Receipt
Tax receipts for completed gifts.

**Key Features**:
- Unique receipt number format: `RCP-YYYY-NNNNNN`
- PDF and optional HTML URLs (S3 storage)
- Tax deductible amount (may differ from gift amount if fees covered)
- Regional compliance data (JSONB) for country-specific requirements
- Correction chain support (`correctedFromId`)
- One-to-one relationship with Gift

**Regional Data Structure**:
```json
{
  "country": "US",
  "taxYear": 2025,
  "ein": "12-3456789",
  "charityName": "Example Nonprofit",
  "charityRegistration": "Active 501(c)(3)"
}
```

**Indexes**:
- Unique index on `giftId`
- Unique index on `number`
- Indexes on `sentAt`, `createdAt`, `correctedFromId`

#### Ecard
E-card notifications for tribute gifts.

**Key Features**:
- Design template reference (e.g., "memorial-candle")
- Recipient information (PII - encrypt at rest)
- Personal message (max 250 chars)
- Scheduling support (immediate or future delivery)
- Delivery tracking: `scheduleAt`, `sentAt`, `openedAt`

**Indexes**:
- Indexes on `tributeId`, `giftId`
- Indexes on `scheduleAt`, `sentAt`, `recipientEmail`, `createdAt`

#### Audit
Immutable audit log for all system actions.

**Key Features**:
- Actor tracking (user ID or "system")
- Action enum: CREATE, UPDATE, DELETE, READ
- Resource format: `{entity}:{uuid}`
- Before/after diffs (JSONB) - **PII must be redacted**
- Request context: IP address, user agent
- Append-only (no updates or deletes)

**Diffs Structure**:
```json
{
  "before": { "status": "pending" },
  "after": { "status": "success", "completedAt": "2025-01-15T10:00:00Z" }
}
```

**Indexes**:
- Indexes on `actor`, `action`, `resource`, `createdAt`
- Composite index on `actor`, `createdAt`

#### WebhookEvent
Webhook event deduplication and processing tracking.

**Key Features**:
- Unique constraint on `processor + externalId` for idempotency
- Full payload storage (JSONB) for debugging
- Processing status tracking
- Error message and retry count
- Supports all payment processors (Stripe, Adyen, PayPal)

**Indexes**:
- Unique composite index on `processor`, `externalId`
- Indexes on `processor`, `eventType`, `processed`, `createdAt`
- Composite index on `processor`, `eventType`, `processed`

## Enums

### Currency
- `USD`: US Dollar
- `CAD`: Canadian Dollar
- `EUR`: Euro

### GiftStatus
- `pending`: Payment initiated but not confirmed
- `success`: Payment completed successfully
- `failed`: Payment failed or declined
- `refunded`: Payment was refunded

### RecurringFrequency
- `monthly`: Monthly recurring charges
- `quarterly`: Quarterly recurring charges
- `annually`: Annual recurring charges

### RecurringPlanStatus
- `active`: Currently processing charges
- `paused`: Temporarily suspended, can be resumed
- `cancelled`: Permanently cancelled

### CampaignStatus
- `draft`: Not yet published
- `active`: Currently accepting donations
- `paused`: Temporarily disabled
- `closed`: Ended, no longer accepting donations

### PaymentProcessor
- `stripe`: Stripe payment processor
- `adyen`: Adyen payment processor
- `paypal`: PayPal payment processor

### TributeType
- `honour`: In honour of someone
- `memory`: In memory of someone (memorial)
- `celebration`: To celebrate an occasion

### AuditAction
- `CREATE`: Entity creation
- `UPDATE`: Entity update
- `DELETE`: Entity deletion
- `READ`: Sensitive data access (PII, financial)

### ConsentType
- `email_marketing`: Email marketing consent
- `sms_marketing`: SMS marketing consent
- `data_processing`: General data processing consent
- `third_party_sharing`: Third-party data sharing consent

## Foreign Key Relationships

### Cascading Rules

**Restrict (prevent deletion if references exist)**:
- `Form.campaignId` → `Campaign.id`
- `Gift.donorId` → `Donor.id`
- `RecurringPlan.donorId` → `Donor.id`
- `Receipt.giftId` → `Gift.id`
- `Ecard.tributeId` → `Tribute.id`

**Set Null (allow deletion, set reference to null)**:
- `Gift.campaignId` → `Campaign.id`
- `Gift.formId` → `Form.id`
- `Gift.tributeId` → `Tribute.id`
- `RecurringPlan.campaignId` → `Campaign.id`
- `Receipt.correctedFromId` → `Receipt.id`

### Relationship Types

**One-to-Many**:
- Donor → Gifts
- Donor → RecurringPlans
- Campaign → Forms
- Campaign → Gifts
- Campaign → RecurringPlans
- Form → Gifts
- Tribute → Gifts
- Tribute → Ecards

**One-to-One**:
- Gift → Receipt

## Migration Strategy

### Initial Migration

The initial migration (`20251113000000_init`) creates all tables, indexes, enums, and foreign keys.

**To apply**:
```bash
npx prisma migrate deploy
```

**To reset (development only)**:
```bash
npx prisma migrate reset
```

### Future Migrations

When making schema changes:

1. Update `schema.prisma`
2. Generate migration:
   ```bash
   npx prisma migrate dev --name descriptive_migration_name
   ```
3. Review generated SQL in `prisma/migrations/`
4. Test migration in development
5. Apply to production:
   ```bash
   npx prisma migrate deploy
   ```

## Seed Data

The seed script (`prisma/seed.ts`) generates realistic test data including:

- 4 donors with various consent configurations
- 4 campaigns (active, closed, draft, monthly)
- 2 forms with A/B testing variants
- 3 tributes (honour, memory, celebration)
- 7 gifts (success, failed, pending, refunded)
- 4 recurring plans (active, paused, cancelled)
- 5 receipts (including correction example)
- 3 e-cards (sent, scheduled)
- 5 audit log entries
- 3 webhook events

**To run**:
```bash
npx prisma db seed
```

**Configure in package.json**:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Performance Optimization

### Index Strategy

**Single-Column Indexes**:
- Primary keys (automatic)
- Foreign keys
- Status fields (for filtering)
- Date fields (for sorting/filtering)
- Unique constraints (slug, receipt number)

**Composite Indexes**:
- `(donorId, status)` on gifts - for donor history queries
- `(campaignId, createdAt)` on gifts - for campaign reports
- `(processor, processorRef)` on gifts - for webhook lookups
- `(processor, mandateId)` on recurring_plans - for webhook lookups
- `(actor, createdAt)` on audit_logs - for user activity reports
- `(processor, externalId)` on webhook_events - for idempotency
- `(processor, eventType, processed)` on webhook_events - for processing queue

**Array Indexes**:
- GIN index on `donors.emails` - for email deduplication

### Query Optimization Tips

1. **Use select to fetch only needed fields**:
   ```typescript
   const gift = await prisma.gift.findUnique({
     where: { id },
     select: { id: true, amount: true, status: true }
   });
   ```

2. **Use include sparingly**:
   ```typescript
   const gift = await prisma.gift.findUnique({
     where: { id },
     include: { donor: true, receipt: true }
   });
   ```

3. **Implement cursor-based pagination**:
   ```typescript
   const gifts = await prisma.gift.findMany({
     take: 20,
     skip: 1,
     cursor: { id: lastGiftId },
     orderBy: { createdAt: 'desc' }
   });
   ```

4. **Use transactions for atomic operations**:
   ```typescript
   await prisma.$transaction(async (tx) => {
     const gift = await tx.gift.create({ data: giftData });
     await tx.receipt.create({ data: { giftId: gift.id, ...receiptData } });
     await tx.audit.create({ data: auditData });
   });
   ```

5. **Batch operations when possible**:
   ```typescript
   await prisma.gift.createMany({
     data: gifts,
     skipDuplicates: true
   });
   ```

## Security Considerations

### PII Protection

**Encrypt at rest**:
- `donors.emails`
- `donors.firstName`, `donors.lastName`
- `donors.phone`
- `donors.street1`, `donors.street2`, `donors.city`, `donors.state`, `donors.zip`
- `ecards.recipientName`, `ecards.recipientEmail`

**Redact from logs and traces**:
- All PII fields above
- `gifts.metadata` (may contain IP addresses)
- `audit.diffs` (exclude PII from before/after values)

### SQL Injection Prevention

Prisma uses prepared statements by default. **Never** use raw SQL with user input:

```typescript
// SAFE - Prisma handles parameterization
await prisma.gift.findMany({ where: { donorId: userId } });

// DANGEROUS - Never do this
await prisma.$queryRawUnsafe(`SELECT * FROM gifts WHERE donor_id = '${userId}'`);

// SAFE - Use tagged template for raw queries
await prisma.$queryRaw`SELECT * FROM gifts WHERE donor_id = ${userId}`;
```

### Audit Logging

**Log these actions**:
- All gift creation, updates, refunds
- Recurring plan creation, updates, cancellations
- Donor profile updates
- Receipt generation and corrections
- Sensitive data access (READ action)

**Exclude from audit diffs**:
- Credit card details (never stored)
- Full email addresses in diffs (use "***@example.com" or hash)
- Phone numbers in diffs

### RBAC Implementation

Apply permission checks in tRPC middleware before database operations:

```typescript
// Example middleware
const requirePermission = (permission: string) => {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user?.permissions.includes(permission)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next();
  });
};

// Usage
export const giftRouter = router({
  create: procedure
    .use(requirePermission('gifts.create'))
    .input(createGiftSchema)
    .mutation(async ({ input }) => {
      // Create gift
    })
});
```

## Data Retention & Compliance

### Soft Deletes

Entities with `deletedAt` field:
- `donors`
- `campaigns`
- `gifts`

**Query active records only**:
```typescript
await prisma.donor.findMany({
  where: { deletedAt: null }
});
```

**Permanently delete (GDPR right to erasure)**:
```typescript
// After legal review and retention period
await prisma.donor.delete({ where: { id } });
```

### Audit Log Retention

- **Minimum**: 12 months
- **Recommended**: 7 years for financial transactions
- **Never delete**: Audit logs are immutable

### GDPR/CCPA Compliance

**Consent tracking**:
```typescript
const donor = await prisma.donor.create({
  data: {
    emails: ['user@example.com'],
    firstName: 'John',
    lastName: 'Doe',
    consents: [
      {
        type: 'email_marketing',
        granted: true,
        grantedAt: new Date().toISOString(),
        source: 'donation_form'
      }
    ]
  }
});
```

**Data export (GDPR right to access)**:
```typescript
const donorData = await prisma.donor.findUnique({
  where: { id },
  include: {
    gifts: true,
    recurringPlans: true
  }
});
```

**Data deletion (GDPR right to erasure)**:
```typescript
// Soft delete first
await prisma.donor.update({
  where: { id },
  data: { deletedAt: new Date() }
});

// After retention period, permanent delete
await prisma.donor.delete({ where: { id } });
```

## Common Queries

### Find donor by email
```typescript
const donor = await prisma.donor.findFirst({
  where: {
    emails: { has: 'user@example.com' },
    deletedAt: null
  }
});
```

### Get campaign with gift statistics
```typescript
const campaign = await prisma.campaign.findUnique({
  where: { slug: 'spring-appeal-2025' },
  include: {
    _count: { select: { gifts: true } },
    gifts: {
      where: { status: 'success' },
      select: { amount: true, currency: true }
    }
  }
});

const totalRaised = campaign.gifts.reduce((sum, gift) => sum + Number(gift.amount), 0);
const donorCount = campaign._count.gifts;
```

### Get donor giving history
```typescript
const history = await prisma.gift.findMany({
  where: {
    donorId,
    status: 'success',
    deletedAt: null
  },
  include: {
    campaign: { select: { name: true } },
    receipt: { select: { number: true, pdfUrl: true } }
  },
  orderBy: { completedAt: 'desc' }
});
```

### Get pending recurring charges
```typescript
const dueCharges = await prisma.recurringPlan.findMany({
  where: {
    status: 'active',
    nextChargeDate: { lte: new Date() }
  },
  include: {
    donor: { select: { firstName: true, lastName: true, emails: true } }
  }
});
```

### Get unprocessed webhooks
```typescript
const pendingWebhooks = await prisma.webhookEvent.findMany({
  where: {
    processed: false,
    retryCount: { lt: 5 }
  },
  orderBy: { createdAt: 'asc' }
});
```

## Testing

### Unit Tests

Use in-memory SQLite for fast unit tests:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'file::memory:?cache=shared' }
  }
});

beforeAll(async () => {
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Integration Tests

Use a dedicated test database:

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/donations_test" npx prisma migrate deploy
DATABASE_URL="postgresql://user:pass@localhost:5432/donations_test" npx jest
```

## Troubleshooting

### Migration Failures

**Issue**: Migration fails due to existing data violating new constraints

**Solution**: Create a data migration before schema migration
```sql
-- Example: Set default values before adding NOT NULL constraint
UPDATE gifts SET net_amount = amount WHERE net_amount IS NULL;
```

### Connection Pool Exhaustion

**Issue**: "Too many connections" errors

**Solution**: Configure connection pool limits
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration
  __internal: {
    pool: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 60000
    }
  }
});
```

### Slow Queries

**Issue**: Queries taking >1s

**Solution**: Use Prisma query logging to identify slow queries
```typescript
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' }
  ]
});

prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});
```

## Support & Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
