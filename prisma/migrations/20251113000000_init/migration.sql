-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'CAD', 'EUR');

-- CreateEnum
CREATE TYPE "GiftStatus" AS ENUM ('pending', 'success', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('monthly', 'quarterly', 'annually');

-- CreateEnum
CREATE TYPE "RecurringPlanStatus" AS ENUM ('active', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'paused', 'closed');

-- CreateEnum
CREATE TYPE "PaymentProcessor" AS ENUM ('stripe', 'adyen', 'paypal');

-- CreateEnum
CREATE TYPE "TributeType" AS ENUM ('honour', 'memory', 'celebration');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'READ');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('email_marketing', 'sms_marketing', 'data_processing', 'third_party_sharing');

-- CreateTable
CREATE TABLE "donors" (
    "id" UUID NOT NULL,
    "emails" TEXT[] NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "street1" VARCHAR(200),
    "street2" VARCHAR(200),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "zip" VARCHAR(20),
    "country" VARCHAR(2),
    "consents" JSONB NOT NULL DEFAULT '[]',
    "externalIds" JSONB NOT NULL DEFAULT '[]',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "targetAmount" DECIMAL(12,2),
    "donorTarget" INTEGER,
    "startDate" TIMESTAMPTZ(3),
    "endDate" TIMESTAMPTZ(3),
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "themeId" UUID,
    "impactMessage" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "schemaJSON" JSONB NOT NULL,
    "variants" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMPTZ(3),
    "cssOverrides" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tributes" (
    "id" UUID NOT NULL,
    "type" "TributeType" NOT NULL,
    "honoreeName" VARCHAR(200) NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifts" (
    "id" UUID NOT NULL,
    "donorId" UUID NOT NULL,
    "campaignId" UUID,
    "formId" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "donorCoversFee" BOOLEAN NOT NULL DEFAULT false,
    "feeAmount" DECIMAL(12,2),
    "processorFee" DECIMAL(12,2),
    "netAmount" DECIMAL(12,2) NOT NULL,
    "status" "GiftStatus" NOT NULL DEFAULT 'pending',
    "processor" "PaymentProcessor" NOT NULL,
    "processorRef" VARCHAR(200),
    "tributeId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),
    "refundedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_plans" (
    "id" UUID NOT NULL,
    "donorId" UUID NOT NULL,
    "campaignId" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "frequency" "RecurringFrequency" NOT NULL DEFAULT 'monthly',
    "donorCoversFee" BOOLEAN NOT NULL DEFAULT false,
    "feeAmount" DECIMAL(12,2),
    "status" "RecurringPlanStatus" NOT NULL DEFAULT 'active',
    "nextChargeDate" TIMESTAMPTZ(3) NOT NULL,
    "lastChargeDate" TIMESTAMPTZ(3),
    "processor" "PaymentProcessor" NOT NULL,
    "mandateId" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "pausedAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),

    CONSTRAINT "recurring_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "giftId" UUID NOT NULL,
    "number" VARCHAR(50) NOT NULL,
    "pdfUrl" VARCHAR(500) NOT NULL,
    "htmlUrl" VARCHAR(500),
    "taxDeductibleAmount" DECIMAL(12,2) NOT NULL,
    "regionalData" JSONB NOT NULL,
    "correctedFromId" UUID,
    "sentAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecards" (
    "id" UUID NOT NULL,
    "tributeId" UUID NOT NULL,
    "giftId" UUID NOT NULL,
    "designId" VARCHAR(100) NOT NULL,
    "recipientName" VARCHAR(200) NOT NULL,
    "recipientEmail" VARCHAR(200) NOT NULL,
    "personalMessage" VARCHAR(250),
    "scheduleAt" TIMESTAMPTZ(3) NOT NULL,
    "sentAt" TIMESTAMPTZ(3),
    "openedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor" VARCHAR(200) NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resource" VARCHAR(200) NOT NULL,
    "diffs" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "processor" "PaymentProcessor" NOT NULL,
    "externalId" VARCHAR(200) NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMPTZ(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_donor_emails" ON "donors" USING GIN ("emails");

-- CreateIndex
CREATE INDEX "idx_donor_name" ON "donors"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "idx_donor_created" ON "donors"("createdAt");

-- CreateIndex
CREATE INDEX "idx_donor_deleted" ON "donors"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_donor_phone" ON "donors"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

-- CreateIndex
CREATE INDEX "idx_campaign_slug" ON "campaigns"("slug");

-- CreateIndex
CREATE INDEX "idx_campaign_status" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "idx_campaign_dates" ON "campaigns"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "idx_campaign_created" ON "campaigns"("createdAt");

-- CreateIndex
CREATE INDEX "idx_campaign_deleted" ON "campaigns"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_form_campaign" ON "forms"("campaignId");

-- CreateIndex
CREATE INDEX "idx_form_published" ON "forms"("publishedAt");

-- CreateIndex
CREATE INDEX "idx_form_created" ON "forms"("createdAt");

-- CreateIndex
CREATE INDEX "idx_tribute_type" ON "tributes"("type");

-- CreateIndex
CREATE INDEX "idx_tribute_created" ON "tributes"("createdAt");

-- CreateIndex
CREATE INDEX "idx_gift_donor" ON "gifts"("donorId");

-- CreateIndex
CREATE INDEX "idx_gift_campaign" ON "gifts"("campaignId");

-- CreateIndex
CREATE INDEX "idx_gift_form" ON "gifts"("formId");

-- CreateIndex
CREATE INDEX "idx_gift_status" ON "gifts"("status");

-- CreateIndex
CREATE INDEX "idx_gift_processor_ref" ON "gifts"("processor", "processorRef");

-- CreateIndex
CREATE INDEX "idx_gift_created" ON "gifts"("createdAt");

-- CreateIndex
CREATE INDEX "idx_gift_completed" ON "gifts"("completedAt");

-- CreateIndex
CREATE INDEX "idx_gift_tribute" ON "gifts"("tributeId");

-- CreateIndex
CREATE INDEX "idx_gift_donor_status" ON "gifts"("donorId", "status");

-- CreateIndex
CREATE INDEX "idx_gift_campaign_created" ON "gifts"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_gift_deleted" ON "gifts"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_recurring_donor" ON "recurring_plans"("donorId");

-- CreateIndex
CREATE INDEX "idx_recurring_campaign" ON "recurring_plans"("campaignId");

-- CreateIndex
CREATE INDEX "idx_recurring_status" ON "recurring_plans"("status");

-- CreateIndex
CREATE INDEX "idx_recurring_next_charge" ON "recurring_plans"("nextChargeDate");

-- CreateIndex
CREATE INDEX "idx_recurring_processor_mandate" ON "recurring_plans"("processor", "mandateId");

-- CreateIndex
CREATE INDEX "idx_recurring_donor_status" ON "recurring_plans"("donorId", "status");

-- CreateIndex
CREATE INDEX "idx_recurring_created" ON "recurring_plans"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_giftId_key" ON "receipts"("giftId");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_number_key" ON "receipts"("number");

-- CreateIndex
CREATE INDEX "idx_receipt_gift" ON "receipts"("giftId");

-- CreateIndex
CREATE INDEX "idx_receipt_number" ON "receipts"("number");

-- CreateIndex
CREATE INDEX "idx_receipt_sent" ON "receipts"("sentAt");

-- CreateIndex
CREATE INDEX "idx_receipt_created" ON "receipts"("createdAt");

-- CreateIndex
CREATE INDEX "idx_receipt_corrected_from" ON "receipts"("correctedFromId");

-- CreateIndex
CREATE INDEX "idx_ecard_tribute" ON "ecards"("tributeId");

-- CreateIndex
CREATE INDEX "idx_ecard_gift" ON "ecards"("giftId");

-- CreateIndex
CREATE INDEX "idx_ecard_schedule" ON "ecards"("scheduleAt");

-- CreateIndex
CREATE INDEX "idx_ecard_sent" ON "ecards"("sentAt");

-- CreateIndex
CREATE INDEX "idx_ecard_recipient" ON "ecards"("recipientEmail");

-- CreateIndex
CREATE INDEX "idx_ecard_created" ON "ecards"("createdAt");

-- CreateIndex
CREATE INDEX "idx_audit_actor" ON "audit_logs"("actor");

-- CreateIndex
CREATE INDEX "idx_audit_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_resource" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "idx_audit_created" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "idx_audit_actor_created" ON "audit_logs"("actor", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_processor_externalId_key" ON "webhook_events"("processor", "externalId");

-- CreateIndex
CREATE INDEX "idx_webhook_processor" ON "webhook_events"("processor");

-- CreateIndex
CREATE INDEX "idx_webhook_event_type" ON "webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "idx_webhook_processed" ON "webhook_events"("processed");

-- CreateIndex
CREATE INDEX "idx_webhook_created" ON "webhook_events"("createdAt");

-- CreateIndex
CREATE INDEX "idx_webhook_processor_type_status" ON "webhook_events"("processor", "eventType", "processed");

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_tributeId_fkey" FOREIGN KEY ("tributeId") REFERENCES "tributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_plans" ADD CONSTRAINT "recurring_plans_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_plans" ADD CONSTRAINT "recurring_plans_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "gifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_correctedFromId_fkey" FOREIGN KEY ("correctedFromId") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecards" ADD CONSTRAINT "ecards_tributeId_fkey" FOREIGN KEY ("tributeId") REFERENCES "tributes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- COMMENT ON DATABASE SCHEMA
COMMENT ON TABLE "donors" IS 'Stores donor contact information and preferences. PII fields should be encrypted at rest.';
COMMENT ON TABLE "campaigns" IS 'Fundraising campaigns with goals, dates, and branding configuration.';
COMMENT ON TABLE "forms" IS 'Donation form configurations tied to campaigns, supporting A/B testing via variants.';
COMMENT ON TABLE "tributes" IS 'Tribute dedications for honour, memory, or celebration gifts.';
COMMENT ON TABLE "gifts" IS 'Individual donation transactions with full payment and fee tracking.';
COMMENT ON TABLE "recurring_plans" IS 'Recurring donation subscriptions with mandate/subscription references.';
COMMENT ON TABLE "receipts" IS 'Tax receipts for completed gifts, including PDF URLs and regional compliance data.';
COMMENT ON TABLE "ecards" IS 'E-card notifications sent to tribute recipients with delivery tracking.';
COMMENT ON TABLE "audit_logs" IS 'Immutable audit trail for all system actions. Never delete records from this table.';
COMMENT ON TABLE "webhook_events" IS 'Webhook event deduplication and processing tracking for idempotency.';

-- COMMENT ON COLUMNS
COMMENT ON COLUMN "donors"."emails" IS 'Array of email addresses for deduplication. PII - encrypt at rest.';
COMMENT ON COLUMN "donors"."consents" IS 'Array of consent records with type, granted date, and source.';
COMMENT ON COLUMN "donors"."externalIds" IS 'External system IDs for CRM sync (e.g., Salesforce, Raiser''s Edge).';
COMMENT ON COLUMN "donors"."preferences" IS 'Communication preferences and do-not-contact flags.';
COMMENT ON COLUMN "donors"."deletedAt" IS 'Soft delete timestamp. When set, donor is logically deleted but retained for audit.';

COMMENT ON COLUMN "gifts"."netAmount" IS 'Amount after all fees: amount - processorFee + feeAmount (if donor covers fees).';
COMMENT ON COLUMN "gifts"."processorRef" IS 'External transaction ID from payment processor for reconciliation.';
COMMENT ON COLUMN "gifts"."metadata" IS 'UTM parameters, IP address, user agent, and other source attribution data.';

COMMENT ON COLUMN "recurring_plans"."mandateId" IS 'Payment processor subscription/mandate ID (Stripe subscription, Adyen mandate, etc.).';

COMMENT ON COLUMN "receipts"."number" IS 'Unique receipt identifier in format RCP-YYYY-NNNNNN.';
COMMENT ON COLUMN "receipts"."regionalData" IS 'Country-specific tax compliance data (EIN, charity registration, tax year, etc.).';

COMMENT ON COLUMN "audit_logs"."diffs" IS 'Before/after values for UPDATE actions. PII must be redacted.';
COMMENT ON COLUMN "audit_logs"."createdAt" IS 'Immutable timestamp. Audit logs cannot be updated or deleted.';

COMMENT ON COLUMN "webhook_events"."externalId" IS 'Event ID from payment processor. Used for idempotency via unique constraint.';
