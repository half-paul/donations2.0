# Schema Entity Relationship Diagram

## Entity Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DONATION PAGE SCHEMA                                 │
│                                                                              │
│  Core Entities: Donor, Gift, RecurringPlan, Campaign, Form                  │
│  Supporting: Tribute, Ecard, Receipt, Audit, WebhookEvent                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Relationships

```
┌──────────────┐
│    Donor     │
│──────────────│
│ id (PK)      │◄──┐
│ emails[]     │   │
│ firstName    │   │
│ lastName     │   │
│ phone        │   │  1:N
│ address      │   │
│ consents[]   │   │
│ preferences  │   │
└──────────────┘   │
                   │
      ┌────────────┼────────────┐
      │            │            │
      │            │            │
      ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐
│   Gift   │ │Recurring │ │   Campaign   │
│──────────│ │   Plan   │ │──────────────│
│ id (PK)  │ │──────────│ │ id (PK)      │
│ donorId  │ │ id (PK)  │ │ slug (UQ)    │
│ campaign │ │ donorId  │ │ name         │
│ formId   │ │ campaign │ │ description  │
│ amount   │ │ amount   │ │ target       │
│ status   │ │ frequency│ │ status       │
│ tribute  │ │ status   │ │ dates        │
│ fees     │ │ mandate  │ │ impact       │
└──────────┘ └──────────┘ └──────────────┘
     │                           │
     │                           │
     │                           ▼
     │                     ┌──────────┐
     │                     │   Form   │
     │                     │──────────│
     │                     │ id (PK)  │
     │                     │ campaign │
     │                     │ schema   │
     │                     │ variants │
     │                     │ version  │
     │                     └──────────┘
     │
     │
     ├──────────┐
     │          │
     ▼          ▼
┌──────────┐ ┌─────────┐
│ Receipt  │ │ Tribute │
│──────────│ │─────────│
│ id (PK)  │ │ id (PK) │
│ giftId   │ │ type    │
│ number   │ │ honoree │
│ pdfUrl   │ │ message │
│ taxInfo  │ └─────────┘
└──────────┘      │
                  │
                  ▼
             ┌──────────┐
             │  Ecard   │
             │──────────│
             │ id (PK)  │
             │ tribute  │
             │ giftId   │
             │ design   │
             │ recipient│
             │ schedule │
             └──────────┘
```

## Detailed Entity Diagrams

### Donor Entity

```
╔═══════════════════════════════════════════════════════════╗
║                         DONOR                              ║
╠═══════════════════════════════════════════════════════════╣
║ id                  UUID         PRIMARY KEY               ║
║─────────────────────────────────────────────────────────  ║
║ emails              TEXT[]       NOT NULL                  ║  ← GIN Index
║ firstName           VARCHAR(100) NOT NULL                  ║
║ lastName            VARCHAR(100) NOT NULL                  ║  ← Index
║ phone               VARCHAR(20)  NULL                      ║  ← Index
║─────────────────────────────────────────────────────────  ║
║ street1             VARCHAR(200) NULL                      ║
║ street2             VARCHAR(200) NULL                      ║
║ city                VARCHAR(100) NULL                      ║
║ state               VARCHAR(100) NULL                      ║
║ zip                 VARCHAR(20)  NULL                      ║
║ country             VARCHAR(2)   NULL                      ║
║─────────────────────────────────────────────────────────  ║
║ consents            JSONB        DEFAULT '[]'              ║
║   [{ type, granted, grantedAt, source }]                   ║
║─────────────────────────────────────────────────────────  ║
║ externalIds         JSONB        DEFAULT '[]'              ║
║   [{ system, externalId }]                                 ║
║─────────────────────────────────────────────────────────  ║
║ preferences         JSONB        DEFAULT '{}'              ║
║   { doNotContact, doNotEmail, preferredLanguage, ... }     ║
║─────────────────────────────────────────────────────────  ║
║ createdAt           TIMESTAMPTZ  DEFAULT NOW()             ║  ← Index
║ updatedAt           TIMESTAMPTZ  NOT NULL                  ║
║ deletedAt           TIMESTAMPTZ  NULL                      ║  ← Index
╚═══════════════════════════════════════════════════════════╝

Relationships:
  → gifts (1:N)
  → recurringPlans (1:N)

Indexes:
  - idx_donor_emails (GIN on emails)
  - idx_donor_name (lastName, firstName)
  - idx_donor_phone
  - idx_donor_created
  - idx_donor_deleted
```

### Gift Entity

```
╔═══════════════════════════════════════════════════════════╗
║                          GIFT                              ║
╠═══════════════════════════════════════════════════════════╣
║ id                  UUID         PRIMARY KEY               ║
║─────────────────────────────────────────────────────────  ║
║ donorId             UUID         NOT NULL → donors.id      ║  ← FK, Index
║ campaignId          UUID         NULL → campaigns.id       ║  ← FK, Index
║ formId              UUID         NULL → forms.id           ║  ← FK, Index
║ tributeId           UUID         NULL → tributes.id        ║  ← FK, Index
║─────────────────────────────────────────────────────────  ║
║ amount              DECIMAL(12,2) NOT NULL                 ║
║ currency            Currency     DEFAULT 'USD'             ║
║ donorCoversFee      BOOLEAN      DEFAULT FALSE            ║
║ feeAmount           DECIMAL(12,2) NULL                     ║
║ processorFee        DECIMAL(12,2) NULL                     ║
║ netAmount           DECIMAL(12,2) NOT NULL                 ║
║   = amount - processorFee + feeAmount                      ║
║─────────────────────────────────────────────────────────  ║
║ status              GiftStatus   DEFAULT 'pending'         ║  ← Index
║   pending | success | failed | refunded                    ║
║─────────────────────────────────────────────────────────  ║
║ processor           Processor    NOT NULL                  ║  ← Index
║   stripe | adyen | paypal                                  ║
║ processorRef        VARCHAR(200) NULL                      ║  ← Index
║─────────────────────────────────────────────────────────  ║
║ metadata            JSONB        DEFAULT '{}'              ║
║   { utmSource, utmMedium, ipAddress, userAgent, ... }      ║
║─────────────────────────────────────────────────────────  ║
║ createdAt           TIMESTAMPTZ  DEFAULT NOW()             ║  ← Index
║ completedAt         TIMESTAMPTZ  NULL                      ║  ← Index
║ refundedAt          TIMESTAMPTZ  NULL                      ║
║ deletedAt           TIMESTAMPTZ  NULL                      ║  ← Index
╚═══════════════════════════════════════════════════════════╝

Relationships:
  ← donor (N:1)
  ← campaign (N:1, optional)
  ← form (N:1, optional)
  ← tribute (N:1, optional)
  → receipt (1:1)

Indexes:
  - idx_gift_donor (donorId)
  - idx_gift_campaign (campaignId)
  - idx_gift_form (formId)
  - idx_gift_tribute (tributeId)
  - idx_gift_status
  - idx_gift_processor_ref (processor, processorRef)
  - idx_gift_created
  - idx_gift_completed
  - idx_gift_donor_status (donorId, status) [composite]
  - idx_gift_campaign_created (campaignId, createdAt) [composite]
  - idx_gift_deleted
```

### Recurring Plan Entity

```
╔═══════════════════════════════════════════════════════════╗
║                    RECURRING PLAN                          ║
╠═══════════════════════════════════════════════════════════╣
║ id                  UUID         PRIMARY KEY               ║
║─────────────────────────────────────────────────────────  ║
║ donorId             UUID         NOT NULL → donors.id      ║  ← FK, Index
║ campaignId          UUID         NULL → campaigns.id       ║  ← FK, Index
║─────────────────────────────────────────────────────────  ║
║ amount              DECIMAL(12,2) NOT NULL                 ║
║ currency            Currency     DEFAULT 'USD'             ║
║ frequency           Frequency    DEFAULT 'monthly'         ║
║   monthly | quarterly | annually                           ║
║─────────────────────────────────────────────────────────  ║
║ donorCoversFee      BOOLEAN      DEFAULT FALSE            ║
║ feeAmount           DECIMAL(12,2) NULL                     ║
║─────────────────────────────────────────────────────────  ║
║ status              PlanStatus   DEFAULT 'active'          ║  ← Index
║   active | paused | cancelled                              ║
║─────────────────────────────────────────────────────────  ║
║ nextChargeDate      TIMESTAMPTZ  NOT NULL                  ║  ← Index
║ lastChargeDate      TIMESTAMPTZ  NULL                      ║
║─────────────────────────────────────────────────────────  ║
║ processor           Processor    NOT NULL                  ║  ← Index
║ mandateId           VARCHAR(200) NOT NULL                  ║  ← Index
║   Stripe subscription ID, Adyen mandate, PayPal agreement  ║
║─────────────────────────────────────────────────────────  ║
║ createdAt           TIMESTAMPTZ  DEFAULT NOW()             ║  ← Index
║ updatedAt           TIMESTAMPTZ  NOT NULL                  ║
║ pausedAt            TIMESTAMPTZ  NULL                      ║
║ cancelledAt         TIMESTAMPTZ  NULL                      ║
╚═══════════════════════════════════════════════════════════╝

Relationships:
  ← donor (N:1)
  ← campaign (N:1, optional)

Indexes:
  - idx_recurring_donor (donorId)
  - idx_recurring_campaign (campaignId)
  - idx_recurring_status
  - idx_recurring_next_charge (nextChargeDate)
  - idx_recurring_processor_mandate (processor, mandateId)
  - idx_recurring_donor_status (donorId, status) [composite]
  - idx_recurring_created
```

### Campaign Entity

```
╔═══════════════════════════════════════════════════════════╗
║                       CAMPAIGN                             ║
╠═══════════════════════════════════════════════════════════╣
║ id                  UUID         PRIMARY KEY               ║
║─────────────────────────────────────────────────────────  ║
║ slug                VARCHAR(100) UNIQUE NOT NULL           ║  ← Unique Index
║ name                VARCHAR(200) NOT NULL                  ║
║ description         TEXT         NULL                      ║
║─────────────────────────────────────────────────────────  ║
║ targetAmount        DECIMAL(12,2) NULL                     ║
║ donorTarget         INTEGER      NULL                      ║
║─────────────────────────────────────────────────────────  ║
║ startDate           TIMESTAMPTZ  NULL                      ║  ← Index
║ endDate             TIMESTAMPTZ  NULL                      ║  ← Index
║─────────────────────────────────────────────────────────  ║
║ status              CampaignStatus DEFAULT 'draft'         ║  ← Index
║   draft | active | paused | closed                         ║
║─────────────────────────────────────────────────────────  ║
║ themeId             UUID         NULL (external ref)       ║
║ impactMessage       TEXT         NULL                      ║
║─────────────────────────────────────────────────────────  ║
║ createdAt           TIMESTAMPTZ  DEFAULT NOW()             ║  ← Index
║ updatedAt           TIMESTAMPTZ  NOT NULL                  ║
║ deletedAt           TIMESTAMPTZ  NULL                      ║  ← Index
╚═══════════════════════════════════════════════════════════╝

Relationships:
  → forms (1:N)
  → gifts (1:N)
  → recurringPlans (1:N)

Indexes:
  - idx_campaign_slug (unique)
  - idx_campaign_status
  - idx_campaign_dates (startDate, endDate)
  - idx_campaign_created
  - idx_campaign_deleted
```

### Form Entity

```
╔═══════════════════════════════════════════════════════════╗
║                         FORM                               ║
╠═══════════════════════════════════════════════════════════╣
║ id                  UUID         PRIMARY KEY               ║
║─────────────────────────────────────────────────────────  ║
║ campaignId          UUID         NOT NULL → campaigns.id   ║  ← FK, Index
║─────────────────────────────────────────────────────────  ║
║ schemaJSON          JSONB        NOT NULL                  ║
║   { fields[], presetAmounts[], customAmount, min, max }    ║
║─────────────────────────────────────────────────────────  ║
║ variants            JSONB        DEFAULT '[]'              ║
║   [{ variantId, name, weight, schemaJSON }]                ║
║─────────────────────────────────────────────────────────  ║
║ version             INTEGER      DEFAULT 1                 ║
║ publishedAt         TIMESTAMPTZ  NULL                      ║  ← Index
║ cssOverrides        TEXT         NULL                      ║
║─────────────────────────────────────────────────────────  ║
║ createdAt           TIMESTAMPTZ  DEFAULT NOW()             ║  ← Index
║ updatedAt           TIMESTAMPTZ  NOT NULL                  ║
╚═══════════════════════════════════════════════════════════╝

Relationships:
  ← campaign (N:1)
  → gifts (1:N)

Indexes:
  - idx_form_campaign (campaignId)
  - idx_form_published
  - idx_form_created
```

### Receipt Entity

```
╔═══════════════════════════════════════════════════════════╗
║                       RECEIPT                              ║
╠═══════════════════════════════════════════════════════════╣
║ id                  UUID         PRIMARY KEY               ║
║─────────────────────────────────────────────────────────  ║
║ giftId              UUID         UNIQUE NOT NULL → gifts   ║  ← FK, Unique
║─────────────────────────────────────────────────────────  ║
║ number              VARCHAR(50)  UNIQUE NOT NULL           ║  ← Unique Index
║   Format: RCP-YYYY-NNNNNN                                  ║
║─────────────────────────────────────────────────────────  ║
║ pdfUrl              VARCHAR(500) NOT NULL                  ║
║ htmlUrl             VARCHAR(500) NULL                      ║
║─────────────────────────────────────────────────────────  ║
║ taxDeductibleAmount DECIMAL(12,2) NOT NULL                 ║
║─────────────────────────────────────────────────────────  ║
║ regionalData        JSONB        NOT NULL                  ║
║   { country, taxYear, ein, charityName, registration }     ║
║─────────────────────────────────────────────────────────  ║
║ correctedFromId     UUID         NULL → receipts.id        ║  ← FK, Index
║   Self-referencing for correction chain                    ║
║─────────────────────────────────────────────────────────  ║
║ sentAt              TIMESTAMPTZ  NOT NULL                  ║  ← Index
║ createdAt           TIMESTAMPTZ  DEFAULT NOW()             ║  ← Index
╚═══════════════════════════════════════════════════════════╝

Relationships:
  ← gift (1:1)
  ← correctedFrom (self-reference, optional)
  → corrections (1:N, self-reference)

Indexes:
  - idx_receipt_gift (unique on giftId)
  - idx_receipt_number (unique)
  - idx_receipt_sent
  - idx_receipt_created
  - idx_receipt_corrected_from
```

### Tribute & Ecard Entities

```
╔═══════════════════════════════════════════════════════════╗
║                       TRIBUTE                              ║
╠═══════════════════════════════════════════════════════════╣
║ id                  UUID         PRIMARY KEY               ║
║─────────────────────────────────────────────────────────  ║
║ type                TributeType  NOT NULL                  ║  ← Index
║   honour | memory | celebration                            ║
║─────────────────────────────────────────────────────────  ║
║ honoreeName         VARCHAR(200) NOT NULL                  ║
║ message             TEXT         NULL                      ║
║─────────────────────────────────────────────────────────  ║
║ createdAt           TIMESTAMPTZ  DEFAULT NOW()             ║  ← Index
╚═══════════════════════════════════════════════════════════╝

Relationships:
  → gifts (1:N)
  → ecards (1:N)

Indexes:
  - idx_tribute_type
  - idx_tribute_created

─────────────────────────────────────────────────────────────

╔═══════════════════════════════════════════════════════════╗
║                        ECARD                               ║
╠═══════════════════════════════════════════════════════════╣
║ id                  UUID         PRIMARY KEY               ║
║─────────────────────────────────────────────────────────  ║
║ tributeId           UUID         NOT NULL → tributes.id    ║  ← FK, Index
║ giftId              UUID         NOT NULL (not FK)         ║  ← Index
║─────────────────────────────────────────────────────────  ║
║ designId            VARCHAR(100) NOT NULL                  ║
║   Template reference (e.g., "memorial-candle")             ║
║─────────────────────────────────────────────────────────  ║
║ recipientName       VARCHAR(200) NOT NULL                  ║
║ recipientEmail      VARCHAR(200) NOT NULL                  ║  ← Index
║ personalMessage     VARCHAR(250) NULL                      ║
║─────────────────────────────────────────────────────────  ║
║ scheduleAt          TIMESTAMPTZ  NOT NULL                  ║  ← Index
║ sentAt              TIMESTAMPTZ  NULL                      ║  ← Index
║ openedAt            TIMESTAMPTZ  NULL                      ║
║─────────────────────────────────────────────────────────  ║
║ createdAt           TIMESTAMPTZ  DEFAULT NOW()             ║  ← Index
╚═══════════════════════════════════════════════════════════╝

Relationships:
  ← tribute (N:1)

Indexes:
  - idx_ecard_tribute
  - idx_ecard_gift
  - idx_ecard_schedule
  - idx_ecard_sent
  - idx_ecard_recipient
  - idx_ecard_created
```

### Audit Entity

```
╔═══════════════════════════════════════════════════════════╗
║                     AUDIT LOG                              ║
║                   (IMMUTABLE)                              ║
╠═══════════════════════════════════════════════════════════╣
║ id                  UUID         PRIMARY KEY               ║
║─────────────────────────────────────────────────────────  ║
║ actor               VARCHAR(200) NOT NULL                  ║  ← Index
║   User ID or "system"                                      ║
║─────────────────────────────────────────────────────────  ║
║ action              AuditAction  NOT NULL                  ║  ← Index
║   CREATE | UPDATE | DELETE | READ                          ║
║─────────────────────────────────────────────────────────  ║
║ resource            VARCHAR(200) NOT NULL                  ║  ← Index
║   Format: "entity:uuid" (e.g., "gift:123e4567...")         ║
║─────────────────────────────────────────────────────────  ║
║ diffs               JSONB        DEFAULT '{}'              ║
║   { before: {...}, after: {...} }                          ║
║   PII must be redacted from diffs                          ║
║─────────────────────────────────────────────────────────  ║
║ ipAddress           VARCHAR(45)  NULL                      ║
║ userAgent           VARCHAR(500) NULL                      ║
║─────────────────────────────────────────────────────────  ║
║ createdAt           TIMESTAMPTZ  DEFAULT NOW()             ║  ← Index
║                                                            ║
║ NO updatedAt - APPEND ONLY                                 ║
║ NO deletedAt - NEVER DELETE                                ║
╚═══════════════════════════════════════════════════════════╝

Indexes:
  - idx_audit_actor
  - idx_audit_action
  - idx_audit_resource
  - idx_audit_created
  - idx_audit_actor_created (actor, createdAt) [composite]

Security:
  - Immutable (no updates or deletes)
  - PII redacted from diffs
  - 12-month minimum retention
```

### Webhook Event Entity

```
╔═══════════════════════════════════════════════════════════╗
║                   WEBHOOK EVENT                            ║
║               (IDEMPOTENCY TABLE)                          ║
╠═══════════════════════════════════════════════════════════╣
║ id                  UUID         PRIMARY KEY               ║
║─────────────────────────────────────────────────────────  ║
║ processor           Processor    NOT NULL                  ║  ← Index
║ externalId          VARCHAR(200) NOT NULL                  ║  ← Unique (composite)
║   UNIQUE (processor, externalId)                           ║
║─────────────────────────────────────────────────────────  ║
║ eventType           VARCHAR(100) NOT NULL                  ║  ← Index
║   e.g., "payment_intent.succeeded"                         ║
║─────────────────────────────────────────────────────────  ║
║ payload             JSONB        NOT NULL                  ║
║   Full webhook payload for debugging                       ║
║─────────────────────────────────────────────────────────  ║
║ processed           BOOLEAN      DEFAULT FALSE             ║  ← Index
║ processedAt         TIMESTAMPTZ  NULL                      ║
║ errorMessage        TEXT         NULL                      ║
║ retryCount          INTEGER      DEFAULT 0                 ║
║─────────────────────────────────────────────────────────  ║
║ createdAt           TIMESTAMPTZ  DEFAULT NOW()             ║  ← Index
╚═══════════════════════════════════════════════════════════╝

Indexes:
  - unique_processor_event (processor, externalId) [unique]
  - idx_webhook_processor
  - idx_webhook_event_type
  - idx_webhook_processed
  - idx_webhook_created
  - idx_webhook_processor_type_status (processor, eventType, processed)

Usage:
  - Prevents duplicate webhook processing
  - Stores full payload for replay/debugging
  - Tracks retry attempts
```

## Data Flow Diagrams

### One-Time Donation Flow

```
User → Form → Gift Creation → Payment Processing → Receipt Generation

1. User submits form
   ↓
2. Create Donor (or find existing by email)
   ↓
3. Create Gift (status: pending)
   ↓
4. Create Audit log (CREATE gift)
   ↓
5. Process payment with processor
   ↓
6. Webhook: payment.succeeded
   ↓
7. Create WebhookEvent (idempotency check)
   ↓
8. Update Gift (status: success, completedAt)
   ↓
9. Create Audit log (UPDATE gift)
   ↓
10. Create Receipt (number: RCP-2025-NNNNNN)
    ↓
11. Send email with receipt PDF
    ↓
12. Create Audit log (CREATE receipt)
```

### Recurring Donation Flow

```
User → Form → RecurringPlan Creation → Recurring Charges

1. User submits recurring form
   ↓
2. Create Donor (or find existing)
   ↓
3. Create mandate with payment processor
   ↓
4. Create RecurringPlan (status: active, mandateId)
   ↓
5. Create Audit log (CREATE recurring_plan)
   ↓
6. Schedule first charge (nextChargeDate)

[Cron Job: Daily at 9 AM]
   ↓
7. Find RecurringPlans where nextChargeDate <= NOW()
   ↓
8. For each plan:
   - Create Gift (from recurring plan)
   - Charge payment method via processor
   - Webhook: charge.succeeded
   - Update RecurringPlan (lastChargeDate, nextChargeDate)
   - Generate Receipt
   - Create Audit logs
```

### Tribute Gift with E-card Flow

```
User → Form + Tribute → Gift → E-card Delivery

1. User submits form with tribute option
   ↓
2. Create Donor
   ↓
3. Create Tribute (type, honoreeName, message)
   ↓
4. Create Gift (tributeId)
   ↓
5. IF e-card requested:
   - Create Ecard (tributeId, giftId, recipientEmail, scheduleAt)
   ↓
6. Process payment
   ↓
7. Webhook: payment.succeeded
   ↓
8. Update Gift (status: success)
   ↓
9. Generate Receipt (includes tribute dedication)
   ↓
10. Schedule e-card delivery

[Cron Job: E-card Sender - Every 15 minutes]
   ↓
11. Find Ecards where scheduleAt <= NOW() AND sentAt IS NULL
   ↓
12. For each e-card:
    - Send email with tribute notification
    - Update Ecard (sentAt)
    - Create Audit log
```

## Index Coverage Analysis

### High-Traffic Queries

1. **Find donor by email**
   - Query: `SELECT * FROM donors WHERE emails @> ARRAY['user@example.com']`
   - Index: `idx_donor_emails` (GIN)
   - Coverage: Full

2. **Get donor giving history**
   - Query: `SELECT * FROM gifts WHERE donor_id = ? AND status = 'success' ORDER BY completed_at DESC`
   - Index: `idx_gift_donor_status` (composite)
   - Coverage: Full

3. **Campaign dashboard (gifts + totals)**
   - Query: `SELECT * FROM gifts WHERE campaign_id = ? ORDER BY created_at DESC LIMIT 100`
   - Index: `idx_gift_campaign_created` (composite)
   - Coverage: Full

4. **Find gift by processor reference (webhook handler)**
   - Query: `SELECT * FROM gifts WHERE processor = 'stripe' AND processor_ref = 'ch_123...'`
   - Index: `idx_gift_processor_ref` (composite)
   - Coverage: Full

5. **Webhook idempotency check**
   - Query: `INSERT INTO webhook_events (...) ON CONFLICT (processor, external_id) DO NOTHING`
   - Index: `unique_processor_event` (unique constraint)
   - Coverage: Full (prevents duplicates)

6. **Recurring charges due today**
   - Query: `SELECT * FROM recurring_plans WHERE status = 'active' AND next_charge_date <= NOW()`
   - Index: `idx_recurring_next_charge`
   - Coverage: Partial (filter on status then next_charge_date)
   - Optimization: Consider composite index `(status, next_charge_date)` if query becomes slow

## Performance Estimates

### Expected Query Performance (1M gifts)

| Query | Without Index | With Index | Speedup |
|-------|--------------|------------|---------|
| Find donor by email | 500ms | 5ms | 100x |
| Donor giving history | 800ms | 10ms | 80x |
| Campaign gifts sorted | 1200ms | 15ms | 80x |
| Gift by processor ref | 600ms | 3ms | 200x |
| Webhook idempotency | 400ms | 1ms | 400x |
| Active recurring plans | 300ms | 20ms | 15x |

### Storage Estimates (1M gifts, 100K donors)

| Entity | Rows | Row Size | Table Size | Index Size | Total |
|--------|------|----------|------------|------------|-------|
| donors | 100K | 1KB | 100 MB | 50 MB | 150 MB |
| gifts | 1M | 500B | 500 MB | 400 MB | 900 MB |
| recurring_plans | 50K | 300B | 15 MB | 30 MB | 45 MB |
| campaigns | 100 | 500B | 50 KB | 20 KB | 70 KB |
| forms | 200 | 2KB | 400 KB | 100 KB | 500 KB |
| receipts | 1M | 300B | 300 MB | 150 MB | 450 MB |
| tributes | 50K | 200B | 10 MB | 5 MB | 15 MB |
| ecards | 30K | 300B | 9 MB | 10 MB | 19 MB |
| audit_logs | 5M | 400B | 2 GB | 800 MB | 2.8 GB |
| webhook_events | 2M | 500B | 1 GB | 400 MB | 1.4 GB |
| **TOTAL** | - | - | **3.9 GB** | **1.8 GB** | **5.7 GB** |

**Recommendation**: Provision 20 GB database storage for 2 years of growth headroom.

## Security Considerations

### PII Protection Summary

| Entity | PII Fields | Protection |
|--------|-----------|------------|
| donors | emails, firstName, lastName, phone, address | Encrypt at rest, redact from logs |
| ecards | recipientName, recipientEmail | Encrypt at rest, redact from logs |
| gifts | metadata.ipAddress | Anonymize after 90 days |
| audit_logs | diffs (may contain PII) | Redact PII fields before storing |

### Foreign Key Cascading Summary

| Relationship | On Delete | Rationale |
|-------------|-----------|-----------|
| Form → Campaign | RESTRICT | Prevent campaign deletion if forms exist |
| Gift → Donor | RESTRICT | Prevent donor deletion if gifts exist |
| Gift → Campaign | SET NULL | Allow campaign deletion, preserve gifts |
| Gift → Form | SET NULL | Allow form deletion, preserve gifts |
| Gift → Tribute | SET NULL | Allow tribute deletion (rare), preserve gifts |
| Receipt → Gift | RESTRICT | Prevent gift deletion if receipt exists |
| Ecard → Tribute | RESTRICT | Prevent tribute deletion if ecards exist |

**GDPR Compliance**: Soft delete donors first (`deletedAt`), then hard delete after retention period.

## Summary

This schema provides:

- ✅ **Type Safety**: Strong typing with enums, constraints, foreign keys
- ✅ **Performance**: Strategic indexes for all high-traffic queries
- ✅ **Security**: PII protection, audit logging, idempotency
- ✅ **Compliance**: GDPR support, soft deletes, data retention
- ✅ **Flexibility**: JSONB for metadata, consents, preferences, regional data
- ✅ **Scalability**: Optimized for millions of records
- ✅ **Maintainability**: Clear relationships, documented design decisions

Estimated database size for 1M gifts: **5.7 GB** (3.9 GB data + 1.8 GB indexes)
