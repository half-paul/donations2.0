# Prisma Schema Documentation Index

## Quick Start

1. **Set up environment**:
   ```bash
   cp prisma/.env.example .env
   # Edit .env and configure DATABASE_URL
   ```

2. **Apply initial migration**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed test data**:
   ```bash
   npx prisma db seed
   ```

4. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

## File Overview

### Core Schema Files

#### `schema.prisma`
The main Prisma schema file defining all entities, relationships, indexes, and enums.

**Contains**:
- 10 core entities (Donor, Gift, RecurringPlan, Campaign, Form, Receipt, Tribute, Ecard, Audit, WebhookEvent)
- 10 enums (Currency, GiftStatus, RecurringFrequency, etc.)
- 50+ indexes for query optimization
- Comprehensive field documentation
- Foreign key relationships with cascading rules

**Key Features**:
- UUID primary keys
- Soft deletes (deletedAt)
- JSONB for flexible metadata
- Array types for multi-value fields
- TIMESTAMPTZ for timezone-aware dates

#### `migrations/20251113000000_init/migration.sql`
Initial migration SQL that creates all tables, indexes, enums, and foreign keys.

**Contains**:
- CREATE TYPE statements for all enums
- CREATE TABLE statements for all entities
- CREATE INDEX statements for all indexes
- ALTER TABLE statements for foreign keys
- COMMENT statements for table and column documentation

**Size**: ~600 lines of SQL

**Execution Time**: ~3-5 seconds on empty database

### Seed Data

#### `seed.ts`
TypeScript seed script that generates realistic test data.

**Creates**:
- 4 donors (with various consent configurations)
- 4 campaigns (active, closed, draft, monthly)
- 2 forms (with A/B testing variants)
- 3 tributes (honour, memory, celebration)
- 7 gifts (success, failed, pending, refunded)
- 4 recurring plans (active, paused, cancelled)
- 5 receipts (including correction example)
- 3 e-cards (sent, scheduled)
- 5 audit log entries
- 3 webhook events

**Usage**:
```bash
npx prisma db seed
```

**Configuration** (add to package.json):
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Documentation

#### `README.md` (15 sections, ~500 lines)
Comprehensive documentation covering schema structure, usage, and best practices.

**Sections**:
1. Overview
2. Database configuration
3. Schema structure (all entities)
4. Enums documentation
5. Foreign key relationships
6. Migration strategy
7. Seed data usage
8. Performance optimization tips
9. Security considerations (PII protection, SQL injection prevention)
10. Data retention & compliance (GDPR/CCPA)
11. Common query patterns
12. Testing strategies
13. Troubleshooting guide
14. Best practices
15. Resources & links

**Best For**: New team members, comprehensive reference

#### `SCHEMA-DESIGN.md` (20 sections, ~800 lines)
Detailed rationale for every design decision in the schema.

**Sections**:
1. Design principles
2. Donor model decisions (arrays vs. tables, JSONB usage)
3. Gift model decisions (fee tracking, metadata)
4. Recurring plan decisions (mandate IDs, scheduling)
5. Campaign model decisions (optional targets, dates)
6. Form model decisions (JSONB schema, A/B testing)
7. Receipt model decisions (correction chains, regional data)
8. Tribute/Ecard decisions (separation, tracking)
9. Audit model decisions (immutability, diffs)
10. Webhook model decisions (idempotency)
11. Index strategy (rationale for each index)
12. Data type choices (UUID vs. BIGINT, DECIMAL vs. INTEGER)
13. Soft delete strategy
14. Future enhancements
15. Migration checklist

**Best For**: Understanding "why" decisions were made, architecture reviews

#### `MIGRATION-GUIDE.md` (10 sections, ~600 lines)
Step-by-step guide for applying, testing, and rolling back migrations.

**Sections**:
1. Prerequisites & environment setup
2. Migration commands (dev, staging, production)
3. Initial migration deployment (detailed checklist)
4. Rollback procedures (3 scenarios)
5. Data migration patterns (add column, rename, enum changes)
6. Production migration checklist (pre/during/post)
7. Troubleshooting common errors
8. Best practices
9. Example migrations
10. Resources

**Best For**: DevOps, database administrators, production deployments

#### `SCHEMA-DIAGRAM.md` (10 sections, ~700 lines)
Visual schema diagrams and relationship documentation.

**Sections**:
1. Entity overview (high-level diagram)
2. Core relationships diagram
3. Detailed entity diagrams (ASCII art for each table)
4. Data flow diagrams (donation flows, recurring charges, tribute e-cards)
5. Index coverage analysis
6. Performance estimates (query speeds, storage)
7. Security considerations summary
8. Foreign key cascading summary
9. Storage estimates (by entity)
10. Summary checklist

**Best For**: Visual learners, onboarding, architecture presentations

### Configuration

#### `.env.example`
Environment variable template for database connection.

**Contains**:
- DATABASE_URL examples (local, staging, production)
- Connection pool settings
- SSL configuration guidance

**Usage**:
```bash
cp prisma/.env.example .env
# Edit .env with your database credentials
```

## Documentation Navigation

### I'm new to this project
Start here:
1. Read `README.md` (sections 1-3: Overview, Database, Schema Structure)
2. Review `SCHEMA-DIAGRAM.md` (Entity Overview and Core Relationships)
3. Run `npx prisma db seed` to see example data
4. Read `README.md` (section 12: Common Queries) for usage examples

### I need to apply migrations
Start here:
1. Read `MIGRATION-GUIDE.md` (sections 1-3: Environment Setup, Commands, Initial Migration)
2. For production: Follow `MIGRATION-GUIDE.md` section 6 (Production Checklist)
3. If issues: See `MIGRATION-GUIDE.md` section 7 (Troubleshooting)

### I need to understand design decisions
Start here:
1. Read `SCHEMA-DESIGN.md` (section matching your entity of interest)
2. Review `schema.prisma` comments for implementation details
3. Check `SCHEMA-DIAGRAM.md` for visual representation

### I need to optimize queries
Start here:
1. Read `README.md` section 7 (Performance Optimization)
2. Review `SCHEMA-DIAGRAM.md` section 5 (Index Coverage Analysis)
3. Check `schema.prisma` for existing indexes
4. See `SCHEMA-DESIGN.md` section 11 (Index Strategy) for rationale

### I need to implement security/compliance
Start here:
1. Read `README.md` section 9 (Security Considerations)
2. Review `README.md` section 10 (Data Retention & Compliance)
3. Check `SCHEMA-DESIGN.md` section 13 (Soft Delete Strategy)
4. See `SCHEMA-DIAGRAM.md` section 7 (Security Summary)

### I need to troubleshoot issues
Start here:
1. Check `MIGRATION-GUIDE.md` section 7 (Troubleshooting)
2. Review `README.md` section 13 (Troubleshooting)
3. Verify migrations: `npx prisma migrate status`
4. Check database: `psql $DATABASE_URL -c "\dt"`

## File Summary

| File | Lines | Purpose | Audience |
|------|-------|---------|----------|
| `schema.prisma` | ~600 | Schema definition | Developers |
| `migrations/*/migration.sql` | ~600 | Initial database setup | DevOps, DBAs |
| `seed.ts` | ~500 | Test data generation | Developers, QA |
| `README.md` | ~500 | Comprehensive reference | All team members |
| `SCHEMA-DESIGN.md` | ~800 | Design rationale | Architects, Senior Engineers |
| `MIGRATION-GUIDE.md` | ~600 | Migration procedures | DevOps, DBAs |
| `SCHEMA-DIAGRAM.md` | ~700 | Visual documentation | All team members |
| `.env.example` | ~20 | Configuration template | Developers, DevOps |
| `INDEX.md` (this file) | ~200 | Navigation guide | All team members |

**Total Documentation**: ~4,900 lines of comprehensive documentation

## Entity Quick Reference

| Entity | Purpose | Key Fields | Relationships |
|--------|---------|-----------|---------------|
| **Donor** | Contact information | emails[], firstName, lastName, consents | → gifts, recurringPlans |
| **Gift** | Donation transaction | amount, status, fees, processorRef | ← donor, campaign, form, tribute; → receipt |
| **RecurringPlan** | Subscription | amount, frequency, mandateId, nextChargeDate | ← donor, campaign |
| **Campaign** | Fundraising initiative | slug, name, target, dates, status | → forms, gifts, recurringPlans |
| **Form** | Donation form config | schemaJSON, variants, version | ← campaign; → gifts |
| **Receipt** | Tax receipt | number, pdfUrl, taxDeductibleAmount | ← gift; ← correctedFrom (self) |
| **Tribute** | Honour/memory | type, honoreeName, message | → gifts, ecards |
| **Ecard** | Notification | recipientEmail, scheduleAt, sentAt | ← tribute |
| **Audit** | Audit log (immutable) | actor, action, resource, diffs | - |
| **WebhookEvent** | Idempotency | processor, externalId, processed | - |

## Common Commands

### Development
```bash
# Apply migrations and seed
npx prisma migrate dev
npx prisma db seed

# Reset database (drops all data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### Production
```bash
# Apply pending migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Generate Prisma Client
npx prisma generate
```

### Database Inspection
```bash
# Pull schema from database
npx prisma db pull

# View database tables
psql $DATABASE_URL -c "\dt"

# View indexes
psql $DATABASE_URL -c "SELECT * FROM pg_indexes WHERE schemaname = 'public';"

# View foreign keys
psql $DATABASE_URL -c "SELECT * FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';"
```

## Enum Quick Reference

```typescript
// Currency
enum Currency { USD, CAD, EUR }

// Gift Status
enum GiftStatus { pending, success, failed, refunded }

// Recurring Frequency
enum RecurringFrequency { monthly, quarterly, annually }

// Recurring Plan Status
enum RecurringPlanStatus { active, paused, cancelled }

// Campaign Status
enum CampaignStatus { draft, active, paused, closed }

// Payment Processor
enum PaymentProcessor { stripe, adyen, paypal }

// Tribute Type
enum TributeType { honour, memory, celebration }

// Audit Action
enum AuditAction { CREATE, UPDATE, DELETE, READ }

// Consent Type
enum ConsentType {
  email_marketing,
  sms_marketing,
  data_processing,
  third_party_sharing
}
```

## Key Design Highlights

### Type Safety
- ✅ UUID primary keys (non-sequential, secure)
- ✅ Enums for fixed value sets
- ✅ DECIMAL for money (no rounding errors)
- ✅ TIMESTAMPTZ for timezone-aware dates

### Performance
- ✅ 50+ strategic indexes
- ✅ Composite indexes for multi-column queries
- ✅ GIN indexes for array and JSONB fields
- ✅ Optimized for 1M+ records

### Security
- ✅ PII fields documented and marked for encryption
- ✅ Prepared statements (Prisma default)
- ✅ Immutable audit logs
- ✅ Soft deletes for compliance

### Flexibility
- ✅ JSONB for metadata, consents, preferences
- ✅ Array types for emails and external IDs
- ✅ Optional foreign keys (nullable)
- ✅ Versioning support (forms)

### Compliance
- ✅ GDPR/CCPA support (consent tracking, soft deletes)
- ✅ Audit trail (12-month minimum retention)
- ✅ Data retention policies
- ✅ Right to erasure support

## Support

For questions or issues:

1. **Schema questions**: See `README.md` or `SCHEMA-DESIGN.md`
2. **Migration issues**: See `MIGRATION-GUIDE.md` section 7
3. **Performance issues**: See `README.md` section 7 or `SCHEMA-DIAGRAM.md` section 5
4. **Security/compliance**: See `README.md` sections 9-10

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-13 | 1.0 | Initial schema design and documentation |

## Next Steps

After reviewing this documentation:

1. **Set up local environment**:
   - Copy `.env.example` to `.env`
   - Configure DATABASE_URL
   - Run `npx prisma migrate dev`
   - Run `npx prisma db seed`

2. **Implement tRPC routers** (next phase):
   - Donor operations (create, update, getById, list)
   - Gift operations (create, update, refund, list)
   - Recurring plan operations (create, update, pause, cancel)
   - Campaign operations (create, update, list, getBySlug)
   - Form operations (create, update, publish)

3. **Implement webhook handlers**:
   - Stripe webhooks (payment.succeeded, charge.refunded)
   - Adyen webhooks (AUTHORISATION, REFUND)
   - PayPal webhooks (PAYMENT.CAPTURE.COMPLETED)

4. **Implement audit logging**:
   - Create audit middleware for tRPC
   - Log all CREATE, UPDATE, DELETE, READ operations
   - Redact PII from diffs

5. **Set up monitoring**:
   - Database query performance (slow query log)
   - Connection pool metrics
   - Error rates
   - Webhook processing latency

---

**Documentation Version**: 1.0
**Last Updated**: 2025-11-13
**Maintained By**: Engineering Team
