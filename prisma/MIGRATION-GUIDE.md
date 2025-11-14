# Migration Guide

## Overview

This guide provides step-by-step instructions for applying, testing, and rolling back Prisma migrations in different environments.

## Prerequisites

- PostgreSQL 14+ installed and running
- Node.js 18+ installed
- Prisma CLI installed (`npm install -g prisma`)
- Database credentials configured in `.env`

## Environment Setup

### Development Environment

1. **Create development database**:
   ```bash
   createdb donations_dev
   ```

2. **Configure environment**:
   ```bash
   cp prisma/.env.example .env
   # Edit .env and set DATABASE_URL
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/donations_dev?schema=public"
   ```

3. **Apply migrations**:
   ```bash
   npx prisma migrate dev
   ```

4. **Seed database**:
   ```bash
   npx prisma db seed
   ```

### Test Environment

1. **Create test database**:
   ```bash
   createdb donations_test
   ```

2. **Configure environment**:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/donations_test?schema=public" npx prisma migrate deploy
   ```

3. **Seed test data**:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/donations_test?schema=public" npx prisma db seed
   ```

### Staging Environment

1. **Verify DATABASE_URL**:
   ```bash
   echo $DATABASE_URL
   # Should point to staging database
   ```

2. **Backup database**:
   ```bash
   pg_dump -h staging-db.example.com -U admin -d donations_staging > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

3. **Apply migrations**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Verify schema**:
   ```bash
   npx prisma db pull
   # Review schema.prisma for any discrepancies
   ```

### Production Environment

See "Production Migration Checklist" below.

## Migration Commands

### Development Workflow

**Create new migration**:
```bash
npx prisma migrate dev --name add_gift_notes_field
```

This will:
1. Prompt to reset database if out of sync
2. Generate migration SQL in `prisma/migrations/`
3. Apply migration to development database
4. Regenerate Prisma Client

**View pending migrations**:
```bash
npx prisma migrate status
```

**Reset database (development only)**:
```bash
npx prisma migrate reset
```

This will:
1. Drop database
2. Create database
3. Apply all migrations
4. Run seed script

### Production Deployment

**Deploy migrations (production)**:
```bash
npx prisma migrate deploy
```

This will:
1. Apply pending migrations only
2. NOT reset database
3. NOT run seed script
4. Exit with error if migrations conflict

**Resolve migration conflicts**:
```bash
npx prisma migrate resolve --applied "20251113000000_init"
```

Use when migration was applied manually or by another process.

## Initial Migration Deployment

### Step 1: Pre-Migration Checklist

- [ ] Database backup completed and verified
- [ ] Backup retention configured (30 days minimum)
- [ ] Point-in-time recovery enabled (AWS RDS)
- [ ] All application servers stopped or in maintenance mode
- [ ] Database credentials verified (read/write access)
- [ ] Connection pooling configured (max connections set)
- [ ] Migration SQL reviewed by DBA or senior engineer
- [ ] Rollback plan documented and tested
- [ ] Monitoring alerts configured (query duration, error rate)
- [ ] Team notified of migration window

### Step 2: Backup Database

**AWS RDS**:
```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier donations-prod \
  --db-snapshot-identifier donations-prod-pre-migration-$(date +%Y%m%d-%H%M%S)
```

**Self-Hosted PostgreSQL**:
```bash
# Full database dump
pg_dump -h prod-db.example.com -U admin -d donations \
  --format=custom \
  --file=backup-$(date +%Y%m%d-%H%M%S).dump

# Verify backup
pg_restore --list backup-$(date +%Y%m%d-%H%M%S).dump | head -20
```

### Step 3: Apply Migration

**Dry run (review SQL without applying)**:
```bash
# Generate SQL for review
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migration-preview.sql

# Review SQL
less migration-preview.sql
```

**Apply migration**:
```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://admin:SecurePassword@prod-db.example.com:5432/donations?schema=public"

# Apply migrations
npx prisma migrate deploy

# Expected output:
# 1 migration(s) found in prisma/migrations
# Applying migration `20251113000000_init`
# Migration `20251113000000_init` completed in 3.2s
```

### Step 4: Verify Migration

**Check migration status**:
```bash
npx prisma migrate status

# Expected output:
# Database schema is up to date!
```

**Verify tables created**:
```bash
psql $DATABASE_URL -c "\dt"

# Expected output:
# List of relations
# Schema |      Name       | Type  |  Owner
# --------+-----------------+-------+---------
# public | donors          | table | admin
# public | campaigns       | table | admin
# public | forms           | table | admin
# public | gifts           | table | admin
# public | recurring_plans | table | admin
# public | receipts        | table | admin
# public | tributes        | table | admin
# public | ecards          | table | admin
# public | audit_logs      | table | admin
# public | webhook_events  | table | admin
```

**Verify indexes created**:
```bash
psql $DATABASE_URL -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;"
```

**Verify foreign keys**:
```bash
psql $DATABASE_URL -c "
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;
"
```

### Step 5: Smoke Tests

Run basic queries to verify schema:

```bash
# Connect to database
psql $DATABASE_URL

-- Create test donor
INSERT INTO donors (id, emails, "firstName", "lastName", consents, "externalIds", preferences, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  ARRAY['test@example.com'],
  'Test',
  'Donor',
  '[]'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb,
  NOW(),
  NOW()
);

-- Verify donor created
SELECT id, "firstName", "lastName", emails FROM donors WHERE emails @> ARRAY['test@example.com'];

-- Create test campaign
INSERT INTO campaigns (id, slug, name, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'test-campaign',
  'Test Campaign',
  'draft',
  NOW(),
  NOW()
);

-- Verify campaign created
SELECT id, slug, name, status FROM campaigns WHERE slug = 'test-campaign';

-- Clean up test data
DELETE FROM donors WHERE emails @> ARRAY['test@example.com'];
DELETE FROM campaigns WHERE slug = 'test-campaign';

-- Exit psql
\q
```

### Step 6: Start Application

1. **Update application code**:
   ```bash
   # Regenerate Prisma Client
   npx prisma generate
   ```

2. **Start application servers**:
   ```bash
   # Example: PM2
   pm2 start ecosystem.config.js
   pm2 logs
   ```

3. **Verify application health**:
   ```bash
   curl https://api.example.org/health
   # Expected: { "status": "ok", "database": "connected" }
   ```

4. **Monitor logs for errors**:
   ```bash
   tail -f /var/log/app/error.log
   # Watch for database connection errors or query failures
   ```

## Rollback Procedures

### Scenario 1: Migration Failed Midway

**Symptoms**: Migration command exits with error, some tables created but not all.

**Steps**:

1. **Check migration status**:
   ```bash
   npx prisma migrate status
   ```

2. **If migration partially applied, resolve manually**:
   ```bash
   # Mark migration as rolled back
   npx prisma migrate resolve --rolled-back "20251113000000_init"
   ```

3. **Drop partially created tables**:
   ```bash
   psql $DATABASE_URL -c "DROP TABLE IF EXISTS gifts, donors, campaigns CASCADE;"
   ```

4. **Restore from backup**:
   ```bash
   # AWS RDS
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier donations-prod-restored \
     --db-snapshot-identifier donations-prod-pre-migration-20251113

   # Self-Hosted
   pg_restore -h prod-db.example.com -U admin -d donations --clean backup-20251113.dump
   ```

5. **Verify restoration**:
   ```bash
   psql $DATABASE_URL -c "\dt"
   # Should show no tables (or previous schema if restoring over existing db)
   ```

### Scenario 2: Migration Succeeded but Application Broken

**Symptoms**: Migration applied successfully, but application throws errors or behaves unexpectedly.

**Steps**:

1. **Review application logs**:
   ```bash
   tail -f /var/log/app/error.log
   # Look for Prisma query errors, type mismatches, missing fields
   ```

2. **Check Prisma Client version**:
   ```bash
   npx prisma -v
   # Ensure Prisma Client regenerated after migration
   ```

3. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   npm run build
   pm2 restart all
   ```

4. **If still broken, rollback schema**:

   **Option A: Apply reverse migration** (if created):
   ```bash
   # Create reverse migration
   npx prisma migrate diff \
     --from-schema-datamodel prisma/schema.prisma \
     --to-empty \
     --script > migrations/20251113000001_rollback_init/migration.sql

   # Review rollback SQL
   less migrations/20251113000001_rollback_init/migration.sql

   # Apply rollback
   npx prisma migrate deploy
   ```

   **Option B: Restore from backup**:
   See "Scenario 1: Restore from backup" above.

### Scenario 3: Migration Succeeded but Performance Issues

**Symptoms**: Migration applied successfully, queries are slow, database CPU/memory usage high.

**Steps**:

1. **Identify slow queries**:
   ```bash
   # Enable query logging (PostgreSQL)
   psql $DATABASE_URL -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
   psql $DATABASE_URL -c "SELECT pg_reload_conf();"

   # View slow queries
   tail -f /var/log/postgresql/postgresql.log | grep duration
   ```

2. **Check missing indexes**:
   ```bash
   psql $DATABASE_URL -c "
   SELECT
     schemaname,
     tablename,
     attname,
     n_distinct,
     correlation
   FROM pg_stats
   WHERE schemaname = 'public'
     AND (n_distinct > 100 OR n_distinct = -1)
   ORDER BY tablename, attname;
   "
   ```

3. **Verify indexes created**:
   ```bash
   psql $DATABASE_URL -c "SELECT * FROM pg_indexes WHERE schemaname = 'public';"
   ```

4. **Add missing indexes manually** (if needed):
   ```sql
   -- Example: Add missing index
   CREATE INDEX idx_gifts_donor_status ON gifts(donor_id, status);
   ```

5. **Analyze tables**:
   ```bash
   psql $DATABASE_URL -c "ANALYZE donors, gifts, campaigns, recurring_plans;"
   ```

6. **Monitor query performance**:
   ```bash
   # Use pg_stat_statements extension
   psql $DATABASE_URL -c "SELECT query, calls, total_exec_time, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
   ```

## Data Migration Patterns

### Adding Non-Nullable Column with Default

**Scenario**: Add `netAmount` column to `gifts` table (required for existing rows).

**Migration**:
```sql
-- Step 1: Add column as nullable
ALTER TABLE gifts ADD COLUMN net_amount DECIMAL(12,2);

-- Step 2: Backfill data
UPDATE gifts SET net_amount = amount - COALESCE(processor_fee, 0) + COALESCE(fee_amount, 0);

-- Step 3: Make column required
ALTER TABLE gifts ALTER COLUMN net_amount SET NOT NULL;
```

**Prisma Schema**:
```prisma
model Gift {
  netAmount Decimal @db.Decimal(12, 2)
}
```

### Renaming Column

**Scenario**: Rename `honoreeName` to `honoree_name` (snake_case).

**Migration**:
```sql
-- Rename column (preserves data)
ALTER TABLE tributes RENAME COLUMN "honoreeName" TO honoree_name;
```

**Prisma Schema**:
```prisma
model Tribute {
  honoreeName String @map("honoree_name") @db.VarChar(200)
}
```

### Changing Enum Values

**Scenario**: Add new gift status `processing`.

**Migration**:
```sql
-- Add new enum value
ALTER TYPE "GiftStatus" ADD VALUE 'processing';
```

**Note**: Cannot remove enum values. To remove, must recreate enum:

```sql
-- Create new enum
CREATE TYPE "GiftStatus_new" AS ENUM ('pending', 'success', 'failed', 'refunded');

-- Migrate data
ALTER TABLE gifts ALTER COLUMN status TYPE "GiftStatus_new" USING status::text::"GiftStatus_new";

-- Drop old enum
DROP TYPE "GiftStatus";

-- Rename new enum
ALTER TYPE "GiftStatus_new" RENAME TO "GiftStatus";
```

### Splitting Table

**Scenario**: Split `donors` table into `donors` and `donor_addresses`.

**Migration**:
```sql
-- Create new table
CREATE TABLE donor_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  street1 VARCHAR(200),
  street2 VARCHAR(200),
  city VARCHAR(100),
  state VARCHAR(100),
  zip VARCHAR(20),
  country VARCHAR(2),
  created_at TIMESTAMPTZ(3) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(3) DEFAULT NOW()
);

-- Migrate data
INSERT INTO donor_addresses (donor_id, street1, street2, city, state, zip, country, created_at, updated_at)
SELECT id, street1, street2, city, state, zip, country, created_at, updated_at
FROM donors
WHERE street1 IS NOT NULL;

-- Drop old columns (after verification)
ALTER TABLE donors DROP COLUMN street1, DROP COLUMN street2, DROP COLUMN city, DROP COLUMN state, DROP COLUMN zip, DROP COLUMN country;
```

## Production Migration Checklist

**Pre-Migration** (1 week before):
- [ ] Review migration SQL with team
- [ ] Identify high-risk changes (data migrations, enum changes)
- [ ] Create rollback plan for each migration
- [ ] Test migration on staging environment with production-like data volume
- [ ] Measure migration duration on staging (estimate production time)
- [ ] Schedule migration window (low-traffic period)
- [ ] Notify stakeholders of planned downtime (if applicable)
- [ ] Prepare monitoring dashboards (database CPU, query duration, error rate)

**Pre-Migration** (1 day before):
- [ ] Verify backup retention policy (30 days minimum)
- [ ] Test backup restoration process
- [ ] Create migration runbook with exact commands
- [ ] Assign roles (DBA, engineer, observer)
- [ ] Set up communication channel (Slack, Zoom)

**During Migration**:
- [ ] Enable maintenance mode (if applicable)
- [ ] Stop application servers or pause traffic
- [ ] Create database snapshot/backup
- [ ] Verify backup completed successfully
- [ ] Apply migration with timing: `time npx prisma migrate deploy`
- [ ] Verify migration status: `npx prisma migrate status`
- [ ] Run smoke tests (see "Step 5: Smoke Tests" above)
- [ ] Regenerate Prisma Client: `npx prisma generate`
- [ ] Start application servers
- [ ] Verify application health endpoints
- [ ] Monitor error logs for 10 minutes
- [ ] Gradually increase traffic (if using load balancer)
- [ ] Disable maintenance mode

**Post-Migration** (1 hour after):
- [ ] Monitor database performance (CPU, memory, query duration)
- [ ] Review slow query logs
- [ ] Check error rates in application logs
- [ ] Verify key user flows (create donation, view receipt)
- [ ] Run ANALYZE on large tables: `psql -c "ANALYZE gifts, donors;"`
- [ ] Update migration status in project tracker
- [ ] Notify stakeholders of successful completion

**Post-Migration** (1 week after):
- [ ] Review migration retrospective (what went well, what to improve)
- [ ] Update runbook with lessons learned
- [ ] Archive database backups to cold storage (if not auto-archived)
- [ ] Delete temporary/test data created during migration

## Troubleshooting

### Error: "Migration failed: column already exists"

**Cause**: Migration was partially applied or run multiple times.

**Solution**:
```bash
# Mark migration as applied
npx prisma migrate resolve --applied "20251113000000_init"

# Or drop the conflicting column
psql $DATABASE_URL -c "ALTER TABLE gifts DROP COLUMN IF EXISTS net_amount;"

# Re-run migration
npx prisma migrate deploy
```

### Error: "Migration failed: relation does not exist"

**Cause**: Database is out of sync with migration history.

**Solution**:
```bash
# Check migration status
npx prisma migrate status

# If no migrations applied, apply from scratch
npx prisma migrate deploy

# If some migrations applied, check which are pending
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy
```

### Error: "Migration failed: constraint violation"

**Cause**: Existing data violates new constraint (NOT NULL, UNIQUE, FOREIGN KEY).

**Solution**:
```sql
-- Example: NOT NULL constraint fails
-- Find rows with NULL values
SELECT * FROM gifts WHERE net_amount IS NULL;

-- Backfill NULL values
UPDATE gifts SET net_amount = 0 WHERE net_amount IS NULL;

-- Re-run migration
```

### Error: "Connection pool exhausted"

**Cause**: Too many concurrent connections during migration.

**Solution**:
```bash
# Increase connection pool limit
export DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20"

# Or close existing connections
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'donations' AND pid <> pg_backend_pid();"

# Re-run migration
npx prisma migrate deploy
```

## Best Practices

1. **Always backup before migrating production**
2. **Test migrations on staging with production-like data volume**
3. **Schedule migrations during low-traffic windows**
4. **Monitor database performance for at least 1 hour post-migration**
5. **Use transactions for data migrations** (wrap in BEGIN/COMMIT)
6. **Add indexes concurrently to avoid locking**: `CREATE INDEX CONCURRENTLY ...`
7. **Avoid enum changes in production** (complex to rollback)
8. **Document rollback plan before applying migration**
9. **Keep migrations small and focused** (one logical change per migration)
10. **Never edit applied migrations** (create new migration instead)

## Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL ALTER TABLE Documentation](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
- [AWS RDS Snapshots](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_CreateSnapshot.html)
