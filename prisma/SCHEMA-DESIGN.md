# Schema Design Decisions

## Overview

This document explains the rationale behind key design decisions in the Prisma schema for the Donation Page feature.

## Core Design Principles

### 1. Type Safety First
- All fields use appropriate PostgreSQL types (UUID, DECIMAL, TIMESTAMPTZ)
- Enums for fixed value sets prevent invalid states
- NOT NULL constraints enforced at database level
- Foreign key constraints ensure referential integrity

### 2. Security & Compliance
- PII fields clearly documented for encryption
- Audit logs are immutable (append-only)
- Soft deletes preserve audit trail
- Webhook events deduplicated via unique constraints

### 3. Performance Optimization
- Strategic indexes on frequently queried fields
- Composite indexes for multi-column queries
- JSONB for flexible metadata without schema changes
- GIN indexes for array and JSONB fields

### 4. Data Integrity
- Restrictive cascading on critical relationships
- Unique constraints on business keys (slug, receipt number, webhook event ID)
- Versioning support for forms
- Correction chains for receipts

## Key Design Decisions

### Donor Model

**Decision: Use array of emails instead of separate Email table**

**Rationale**:
- Simplifies deduplication queries (single GIN index lookup)
- Most donors have 1-2 email addresses
- PostgreSQL array types perform well for small arrays
- Reduces join complexity

**Alternative Considered**: Separate `DonorEmail` table with one-to-many relationship
- Would require additional JOIN in every query
- More complex deduplication logic
- Overkill for typical use case

**Decision: Store consents as JSONB array**

**Rationale**:
- Consent structure is stable (type, granted, grantedAt, source)
- Supports multiple consent types without schema changes
- Easy to query specific consent types using JSONB operators
- Avoids separate table for relatively simple data

**Decision: Use JSONB for preferences**

**Rationale**:
- Preferences vary by organization and evolve over time
- JSONB provides flexibility without migrations
- Typical preferences: `{ doNotContact, doNotEmail, doNotCall, preferredLanguage, communicationFrequency }`
- Can add organization-specific fields without schema changes

**Decision: Soft delete with deletedAt**

**Rationale**:
- Preserves donor history for audit compliance
- Allows "undelete" if deletion was accidental
- Gifts and receipts remain accessible after donor deletion
- GDPR right to erasure can be implemented as hard delete after retention period

### Gift Model

**Decision: Store both feeAmount and processorFee separately**

**Rationale**:
- `feeAmount`: Fee paid by donor (if donorCoversFee = true)
- `processorFee`: Actual fee charged by processor
- Enables accurate financial reconciliation
- Supports different fee structures per processor
- `netAmount = amount - processorFee + feeAmount`

**Example**:
```
Donor gives $100 and covers $3.20 fee:
- amount: 100.00
- feeAmount: 3.20 (donor paid this extra)
- processorFee: 3.20 (actual processor charge)
- netAmount: 100.00 (organization receives full donation)
```

**Decision: JSONB metadata field for attribution**

**Rationale**:
- UTM parameters vary by campaign
- Captures source, medium, campaign, term, content
- Stores IP address and user agent for fraud detection
- Flexible structure supports additional tracking fields
- Avoids separate table for source attribution

**Decision: Optional campaignId and formId (nullable foreign keys)**

**Rationale**:
- Gifts can be created outside of campaigns (general donations)
- Forms may be deleted but gifts should persist
- SetNull cascading preserves gift records
- Allows retrospective campaign attribution

**Decision: Separate tributeId (nullable) instead of polymorphic tribute field**

**Rationale**:
- Not all gifts have tributes (optional feature)
- Tribute details can be shared across gifts (e.g., memorial fund)
- Clean separation of concerns
- Easy to query tribute vs. non-tribute gifts

### Recurring Plan Model

**Decision: Store mandateId (processor subscription ID) as string**

**Rationale**:
- Different processors use different ID formats
  - Stripe: `sub_1234567890abcdef`
  - Adyen: mandate reference
  - PayPal: billing agreement ID
- Storing as VARCHAR allows flexibility
- Composite index on (processor, mandateId) for webhook lookups

**Decision: Track both nextChargeDate and lastChargeDate**

**Rationale**:
- `nextChargeDate`: For scheduling charge jobs (indexed for performance)
- `lastChargeDate`: For detecting skipped charges or failures
- Enables "retry failed charge" logic
- Supports pause/resume functionality

**Decision: Status enum with active, paused, cancelled**

**Rationale**:
- `active`: Currently processing charges
- `paused`: Temporarily suspended, can be resumed (donor request)
- `cancelled`: Permanently ended (donor cancelled or payment failures)
- Prevents invalid state transitions
- Clear semantics for donor portal

**Decision: Separate pausedAt and cancelledAt timestamps**

**Rationale**:
- Audit trail for status changes
- Calculate pause duration
- Distinguish user-initiated vs. system-initiated cancellations
- Required for compliance reporting

### Campaign Model

**Decision: Optional targetAmount and donorTarget**

**Rationale**:
- Some campaigns have no specific goal (e.g., general fund, monthly giving)
- Allows "unlimited" campaigns
- Nullable DECIMAL and Int fields

**Decision: Optional endDate**

**Rationale**:
- Ongoing campaigns (e.g., Monthly Giving Circle) have no end date
- Null endDate = campaign runs indefinitely
- Simplifies "active campaigns" query: `WHERE status = 'active' AND (endDate IS NULL OR endDate > NOW())`

**Decision: Status enum separate from date logic**

**Rationale**:
- Status can be changed independently of dates
- Admin can pause campaign temporarily without changing dates
- Draft campaigns can have dates set before publishing
- Closed campaigns remain accessible for reporting

### Form Model

**Decision: Store full schema in JSONB instead of field-level normalization**

**Rationale**:
- Form structure is complex and varies by campaign
- Field types: text, email, phone, amount, select, checkbox, textarea
- Validation rules: required, min, max, pattern
- JSONB provides flexibility without schema changes
- Form builder UI can serialize directly to JSONB
- Versioning allows schema evolution

**Decision: Variants array for A/B testing**

**Rationale**:
- Each variant has: variantId, name, weight, schemaJSON
- Weights determine traffic split (e.g., 50/50)
- Can add/remove variants without migration
- Analytics can segment by variantId
- Empty array = no A/B test, use primary schemaJSON

**Decision: Version field with publishedAt timestamp**

**Rationale**:
- Track form evolution over time
- `publishedAt = null` = draft, not visible to public
- Allows editing form without affecting live version
- Can implement "publish" workflow: save draft → review → publish

**Decision: CSS overrides as text field**

**Rationale**:
- Simple approach for campaign-specific styling
- Injected into page as `<style>` tag
- Can override theme variables or add custom rules
- Sanitization required to prevent XSS (done in frontend)

### Receipt Model

**Decision: One-to-one relationship with Gift**

**Rationale**:
- Each gift generates exactly one receipt (initial)
- Corrections create new receipt with `correctedFromId` reference
- Simplifies queries: `gift.receipt` always returns single receipt
- No need for "latest receipt" logic

**Decision: Unique receipt number with format RCP-YYYY-NNNNNN**

**Rationale**:
- Human-readable identifier
- Year prefix for easy sorting and archiving
- Sequential number within year (use database sequence)
- Unique constraint prevents duplicates
- Example: `RCP-2025-000123`

**Decision: Regional data as JSONB**

**Rationale**:
- Tax requirements vary by country/region
  - US: EIN, 501(c)(3) status, tax year
  - Canada: Business Number, charity registration
  - EU: VAT number, charity registration
- JSONB allows country-specific fields without schema changes
- Can add new countries without migration

**Decision: Store PDF and HTML URLs (not content)**

**Rationale**:
- Receipts are immutable once sent
- Store in S3 for durability and cost-effectiveness
- URLs can be signed for secure access
- Reduces database size (no large BYTEA fields)
- Can regenerate receipts from gift data if needed

**Decision: Correction chain with correctedFromId**

**Rationale**:
- Allows reissuing receipts for errors (wrong name, wrong amount)
- Preserves original receipt for audit trail
- `correctedFromId` points to receipt being corrected
- Can traverse chain: original → correction 1 → correction 2
- Receipt number format: `RCP-2025-000123-C1`, `RCP-2025-000123-C2`

### Tribute & Ecard Models

**Decision: Separate Tribute and Ecard tables**

**Rationale**:
- Tribute can exist without e-card (donor doesn't want to send notification)
- E-card requires tribute (can't send e-card without tribute details)
- Many-to-many possible: one tribute, multiple e-cards to different recipients
- Clean separation: tribute = "what", ecard = "notification"

**Decision: Store designId as string reference**

**Rationale**:
- Design templates stored outside database (frontend assets)
- `designId` references template name (e.g., "memorial-candle", "honour-certificate")
- Allows adding new designs without migration
- Frontend maps designId to template path

**Decision: Track scheduleAt, sentAt, openedAt**

**Rationale**:
- `scheduleAt`: When e-card should be sent (future scheduling support)
- `sentAt`: When e-card was actually sent (delivery confirmation)
- `openedAt`: When recipient opened e-card (tracking pixel)
- Enables delivery analytics and troubleshooting

**Decision: E-card references giftId as regular field (not foreign key)**

**Rationale**:
- Avoids circular dependency (Gift → Tribute → Ecard → Gift)
- Gift can be deleted without cascading to e-card (rare case)
- E-card primarily belongs to tribute
- Can query gifts with e-cards via tributeId

### Audit Model

**Decision: Immutable, append-only structure**

**Rationale**:
- Audit logs must never be modified or deleted (compliance)
- No `updatedAt` or `deletedAt` fields
- No UPDATE or DELETE operations allowed
- Postgres row-level security can enforce this
- Manual cleanup requires DBA intervention

**Decision: Resource format as "entity:uuid"**

**Rationale**:
- Easy to parse: `const [entity, id] = resource.split(':')`
- Supports any entity type without enum
- Index on resource field enables fast lookups
- Example: `gift:123e4567-e89b-12d3-a456-426614174000`

**Decision: Diffs as JSONB with before/after**

**Rationale**:
- Captures exact field changes for UPDATE actions
- CREATE: only `after` (no `before`)
- DELETE: only `before` (no `after`)
- READ: no diffs, just access record
- Example: `{ before: { status: "pending" }, after: { status: "success" } }`

**Decision: Store ipAddress and userAgent**

**Rationale**:
- Required for security investigations
- Helps identify suspicious activity (multiple IPs, bot user agents)
- GDPR compliant (IP is PII but justified for security)
- Can be anonymized after retention period

**Decision: Actor as string (user ID or "system")**

**Rationale**:
- Supports both user-initiated and system-initiated actions
- "system" for webhook handlers, cron jobs, background processes
- User ID for authenticated actions
- Can expand to include service accounts: "service:stripe-sync"

### Webhook Event Model

**Decision: Unique constraint on (processor, externalId)**

**Rationale**:
- Ensures idempotency (prevents duplicate processing)
- Payment processors send same event multiple times
- Database enforces deduplication at insert
- Example: `INSERT ... ON CONFLICT (processor, externalId) DO NOTHING`

**Decision: Store full payload as JSONB**

**Rationale**:
- Required for debugging webhook failures
- Can replay event if processing logic changes
- Captures processor-specific fields
- No need to define schema for every event type
- Can extract relevant fields in application code

**Decision: Track processed, processedAt, errorMessage, retryCount**

**Rationale**:
- `processed`: Boolean flag for quick filtering
- `processedAt`: When successfully processed (audit trail)
- `errorMessage`: Why processing failed (debugging)
- `retryCount`: Prevent infinite retries (max 5)
- Query unprocessed: `WHERE processed = false AND retryCount < 5`

**Decision: Support multiple processors (enum)**

**Rationale**:
- Organizations may use different processors by region or campaign
- Webhook format differs per processor
- Routing logic: `switch (event.processor) { case 'stripe': ... }`
- Future-proof for adding new processors

## Index Strategy

### Rationale for Each Index

**Single-Column Indexes**:
1. Foreign keys (automatic performance boost for JOINs)
2. Status fields (frequent filtering: `WHERE status = 'active'`)
3. Date fields (sorting and range queries: `WHERE createdAt > ?`)
4. Unique business keys (fast lookups: `WHERE slug = ?`)

**Composite Indexes**:
1. `(donorId, status)` on gifts
   - Query: "Get all successful gifts for donor"
   - Covers both WHERE and ORDER BY clauses

2. `(campaignId, createdAt)` on gifts
   - Query: "Get campaign gifts sorted by date"
   - Supports campaign dashboards

3. `(processor, processorRef)` on gifts
   - Query: "Find gift by Stripe charge ID"
   - Used in webhook handlers

4. `(processor, externalId)` on webhook_events
   - Unique constraint + lookup performance
   - Most critical index for idempotency

**Array Indexes (GIN)**:
1. `emails` on donors
   - Query: "Find donor by email address"
   - GIN index supports `@>` and `&&` operators
   - Example: `WHERE emails @> ARRAY['user@example.com']`

**JSONB Indexes** (not implemented yet, add if needed):
- `CREATE INDEX idx_gift_metadata ON gifts USING GIN (metadata);`
- Enables queries like: `WHERE metadata @> '{"utmSource": "email"}'`
- Add only if UTM filtering becomes common

### Index Size Considerations

Estimated index sizes for 1M gifts:

- `idx_gift_donor`: ~50 MB (UUID)
- `idx_gift_status`: ~20 MB (enum, 4 values)
- `idx_gift_created`: ~40 MB (timestamp)
- `idx_gift_donor_status`: ~70 MB (composite)

**Total estimated index size**: ~400 MB for 1M gifts

Trade-off: Indexes consume storage and slow down writes, but dramatically speed up reads (100x+ for large tables).

## Data Type Choices

### UUID vs. BIGINT for IDs

**Decision: Use UUID**

**Rationale**:
- Non-sequential (prevents enumeration attacks)
- Globally unique (supports distributed systems)
- Can generate client-side (useful for offline mode)
- 128-bit vs. 64-bit (larger but acceptable)

**Trade-off**: UUIDs are slightly slower than BIGINT for joins and indexing, but security and scalability benefits outweigh performance cost.

### DECIMAL vs. INTEGER for Money

**Decision: Use DECIMAL(12, 2)**

**Rationale**:
- Avoids floating-point rounding errors
- DECIMAL(12, 2) = up to $9,999,999,999.99
- Standard for financial applications
- 12 digits = up to $10 billion (sufficient)
- 2 decimal places = cents precision

**Alternative Considered**: Store as INTEGER (cents)
- Requires manual multiplication/division
- Easy to make mistakes in currency conversion
- No type safety for currency vs. cents
- DECIMAL is clearer and safer

### TIMESTAMPTZ vs. TIMESTAMP

**Decision: Use TIMESTAMPTZ**

**Rationale**:
- Stores timezone information (UTC)
- Converts to user's timezone on retrieval
- Essential for global applications
- Prevents "what time zone is this?" questions
- Slightly larger (8 bytes vs. 8 bytes) but worth it

**Best Practice**: Always store in UTC, convert to local timezone in application layer.

### JSONB vs. JSON

**Decision: Use JSONB**

**Rationale**:
- Binary storage (faster queries)
- Supports indexing (GIN indexes)
- Supports operators (`@>`, `->`, `->>`)
- Slightly slower on insert (parsing overhead) but much faster on query
- Standard choice for PostgreSQL

## Soft Delete Strategy

### Why Soft Deletes?

**Entities with deletedAt**:
- Donor (GDPR compliance, audit trail)
- Campaign (historical reporting)
- Gift (financial audit)

**Rationale**:
- Preserves foreign key relationships
- Allows "undelete" functionality
- Supports audit and compliance requirements
- Can be hard deleted after retention period

### Query Patterns

**Always filter by deletedAt**:
```typescript
// Find active donors
const donors = await prisma.donor.findMany({
  where: { deletedAt: null }
});

// Include deleted donors (admin view)
const allDonors = await prisma.donor.findMany();

// Find deleted donors (audit view)
const deletedDonors = await prisma.donor.findMany({
  where: { deletedAt: { not: null } }
});
```

### Hard Delete After Retention

After legal retention period (typically 7 years for financial records):

```typescript
// Find donors deleted >7 years ago
const expiredDonors = await prisma.donor.findMany({
  where: {
    deletedAt: {
      lt: new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000)
    }
  }
});

// Permanently delete (irreversible)
for (const donor of expiredDonors) {
  await prisma.donor.delete({ where: { id: donor.id } });
}
```

## Future Schema Enhancements

### Potential Additions (Post-MVP)

1. **Matching Gifts**
   - `MatchingGift` table with employer, match ratio, status
   - Link to original gift via `matchedGiftId`

2. **Pledges**
   - `Pledge` table for commitment to donate (payment later)
   - Status: pending, fulfilled, cancelled
   - Due date, reminder schedule

3. **Gift Designations**
   - `Designation` table for funds, programs, projects
   - Many-to-many relationship with gifts (split gifts)

4. **Donor Households**
   - `Household` table to group related donors
   - Primary contact, address sharing

5. **Email Tracking**
   - `EmailEvent` table for sent, delivered, opened, clicked
   - Links to receipts, e-cards, stewardship emails

6. **A/B Test Results**
   - `ABTestResult` table for conversion metrics by variant
   - Auto-promote winning variant

7. **Gift Tags/Labels**
   - `Tag` table for custom categorization
   - Many-to-many with gifts (e.g., "major donor", "new donor")

8. **Donor Segments**
   - `Segment` table for marketing lists
   - Dynamic rules stored as JSONB

## Migration Checklist

When applying this schema to production:

- [ ] Review DATABASE_URL connection string (SSL, connection limits)
- [ ] Verify PostgreSQL version (14+ recommended)
- [ ] Enable pgcrypto extension for UUID generation: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- [ ] Run initial migration: `npx prisma migrate deploy`
- [ ] Verify all indexes created: `SELECT * FROM pg_indexes WHERE schemaname = 'public';`
- [ ] Set up connection pooling (PgBouncer or RDS Proxy)
- [ ] Configure backup schedule (daily snapshots, point-in-time recovery)
- [ ] Enable query logging for slow queries (>1s)
- [ ] Set up monitoring alerts (connection pool, query duration)
- [ ] Document encryption-at-rest setup for PII fields
- [ ] Configure row-level security for audit table (if needed)
- [ ] Test GDPR data export and deletion workflows
- [ ] Seed initial data (campaigns, forms) for testing
- [ ] Run performance tests with realistic data volume
- [ ] Review and approve schema with security team
- [ ] Document rollback plan for migration failures

## Conclusion

This schema design prioritizes:
1. **Type safety** - Enums, constraints, foreign keys prevent invalid data
2. **Security** - PII protection, audit logging, soft deletes
3. **Performance** - Strategic indexes, JSONB for flexibility
4. **Compliance** - GDPR support, immutable audit logs, retention policies
5. **Maintainability** - Clear relationships, documented decisions, versioning

The schema is production-ready for the Donation Page MVP and extensible for future features.
