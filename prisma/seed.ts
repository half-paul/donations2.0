/**
 * Prisma Seed Script
 *
 * Generates realistic test data for the donation page feature, including:
 * - Donors with various consent and preference configurations
 * - Campaigns in different states (draft, active, closed)
 * - Forms with A/B test variants
 * - Gifts (one-time and associated with recurring plans)
 * - Recurring plans (active, paused, cancelled)
 * - Tributes with e-cards
 * - Receipts
 * - Audit log entries
 * - Webhook events
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient, Currency, GiftStatus, RecurringPlanStatus, CampaignStatus, PaymentProcessor, TributeType, AuditAction, RecurringFrequency } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (in development only!)
  console.log('🧹 Cleaning existing data...');
  await prisma.audit.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.ecard.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.recurringPlan.deleteMany();
  await prisma.tribute.deleteMany();
  await prisma.form.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.donor.deleteMany();

  // ============================================================================
  // DONORS
  // ============================================================================
  console.log('👥 Creating donors...');

  const donor1 = await prisma.donor.create({
    data: {
      emails: ['sarah.johnson@example.com'],
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1-555-0101',
      street1: '123 Main Street',
      street2: 'Apt 4B',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'US',
      consents: [
        {
          type: 'email_marketing',
          granted: true,
          grantedAt: '2025-01-15T10:00:00Z',
          source: 'donation_form'
        },
        {
          type: 'data_processing',
          granted: true,
          grantedAt: '2025-01-15T10:00:00Z',
          source: 'donation_form'
        }
      ],
      externalIds: [
        { system: 'salesforce', externalId: '0031234567890ABC' }
      ],
      preferences: {
        doNotContact: false,
        doNotEmail: false,
        doNotCall: false,
        preferredLanguage: 'en',
        communicationFrequency: 'weekly'
      }
    }
  });

  const donor2 = await prisma.donor.create({
    data: {
      emails: ['michael.chen@example.com', 'mike.chen@example.com'],
      firstName: 'Michael',
      lastName: 'Chen',
      phone: '+1-555-0102',
      street1: '456 Oak Avenue',
      city: 'Toronto',
      state: 'ON',
      zip: 'M5V 3A8',
      country: 'CA',
      consents: [
        {
          type: 'data_processing',
          granted: true,
          grantedAt: '2025-02-01T14:30:00Z',
          source: 'donation_form'
        }
      ],
      externalIds: [
        { system: 'salesforce', externalId: '0031234567890DEF' },
        { system: 'raiser_edge', externalId: 'RE-54321' }
      ],
      preferences: {
        doNotContact: false,
        doNotEmail: false,
        preferredLanguage: 'en'
      }
    }
  });

  const donor3 = await prisma.donor.create({
    data: {
      emails: ['emma.martinez@example.com'],
      firstName: 'Emma',
      lastName: 'Martinez',
      phone: '+1-555-0103',
      street1: '789 Elm Street',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'US',
      consents: [
        {
          type: 'email_marketing',
          granted: true,
          grantedAt: '2025-03-10T09:15:00Z',
          source: 'donation_form'
        },
        {
          type: 'sms_marketing',
          granted: true,
          grantedAt: '2025-03-10T09:15:00Z',
          source: 'donation_form'
        }
      ],
      externalIds: [],
      preferences: {
        doNotContact: false,
        communicationFrequency: 'monthly'
      }
    }
  });

  // Anonymous donor (minimal data)
  const donor4 = await prisma.donor.create({
    data: {
      emails: ['anonymous.donor@example.com'],
      firstName: 'Anonymous',
      lastName: 'Donor',
      consents: [
        {
          type: 'data_processing',
          granted: true,
          grantedAt: '2025-04-01T12:00:00Z',
          source: 'donation_form'
        }
      ],
      externalIds: [],
      preferences: {
        doNotContact: true,
        doNotEmail: true
      }
    }
  });

  console.log(`✅ Created ${4} donors`);

  // ============================================================================
  // CAMPAIGNS
  // ============================================================================
  console.log('📢 Creating campaigns...');

  const springCampaign = await prisma.campaign.create({
    data: {
      slug: 'spring-appeal-2025',
      name: 'Spring Appeal 2025',
      description: 'Help us reach our goal of providing clean water to 10,000 families this spring.',
      targetAmount: 500000,
      donorTarget: 1000,
      startDate: new Date('2025-03-01T00:00:00Z'),
      endDate: new Date('2025-05-31T23:59:59Z'),
      status: CampaignStatus.active,
      impactMessage: 'Your donation will provide clean water to a family for an entire year!'
    }
  });

  const monthlyGivingCampaign = await prisma.campaign.create({
    data: {
      slug: 'monthly-giving-circle',
      name: 'Monthly Giving Circle',
      description: 'Join our community of monthly supporters making a sustained impact.',
      targetAmount: null, // No specific target
      donorTarget: 500,
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: null, // Ongoing
      status: CampaignStatus.active,
      impactMessage: 'Your monthly gift provides consistent support that helps us plan for the future.'
    }
  });

  const yearEndCampaign = await prisma.campaign.create({
    data: {
      slug: 'year-end-2024',
      name: 'Year End Campaign 2024',
      description: 'Thank you for an incredible year! Help us finish strong.',
      targetAmount: 250000,
      donorTarget: 750,
      startDate: new Date('2024-11-01T00:00:00Z'),
      endDate: new Date('2024-12-31T23:59:59Z'),
      status: CampaignStatus.closed,
      impactMessage: 'Your year-end gift helped us serve 5,000 families in need.'
    }
  });

  const draftCampaign = await prisma.campaign.create({
    data: {
      slug: 'summer-campaign-2025',
      name: 'Summer Campaign 2025',
      description: 'Coming soon - stay tuned!',
      targetAmount: 300000,
      donorTarget: 600,
      startDate: new Date('2025-06-01T00:00:00Z'),
      endDate: new Date('2025-08-31T23:59:59Z'),
      status: CampaignStatus.draft,
      impactMessage: null
    }
  });

  console.log(`✅ Created ${4} campaigns`);

  // ============================================================================
  // FORMS
  // ============================================================================
  console.log('📝 Creating forms...');

  const springForm = await prisma.form.create({
    data: {
      campaignId: springCampaign.id,
      schemaJSON: {
        fields: [
          { name: 'amount', type: 'amount', required: true },
          { name: 'firstName', type: 'text', required: true },
          { name: 'lastName', type: 'text', required: true },
          { name: 'email', type: 'email', required: true },
          { name: 'phone', type: 'phone', required: false }
        ],
        presetAmounts: [25, 50, 100, 250, 500],
        customAmountEnabled: true,
        minAmount: 1,
        maxAmount: 100000
      },
      variants: [
        {
          variantId: 'A',
          name: 'control',
          weight: 50,
          schemaJSON: {
            presetAmounts: [25, 50, 100, 250, 500],
            heading: 'Make a Difference Today'
          }
        },
        {
          variantId: 'B',
          name: 'higher_amounts',
          weight: 50,
          schemaJSON: {
            presetAmounts: [50, 100, 250, 500, 1000],
            heading: 'Transform Lives with Your Gift'
          }
        }
      ],
      version: 1,
      publishedAt: new Date('2025-03-01T00:00:00Z')
    }
  });

  const monthlyForm = await prisma.form.create({
    data: {
      campaignId: monthlyGivingCampaign.id,
      schemaJSON: {
        fields: [
          { name: 'amount', type: 'amount', required: true },
          { name: 'frequency', type: 'select', required: true, options: ['monthly', 'quarterly', 'annually'] },
          { name: 'firstName', type: 'text', required: true },
          { name: 'lastName', type: 'text', required: true },
          { name: 'email', type: 'email', required: true }
        ],
        presetAmounts: [15, 25, 50, 100],
        customAmountEnabled: true,
        minAmount: 5,
        maxAmount: 10000,
        defaultFrequency: 'monthly'
      },
      variants: [],
      version: 1,
      publishedAt: new Date('2025-01-01T00:00:00Z')
    }
  });

  console.log(`✅ Created ${2} forms`);

  // ============================================================================
  // TRIBUTES
  // ============================================================================
  console.log('🎗️ Creating tributes...');

  const tribute1 = await prisma.tribute.create({
    data: {
      type: TributeType.memory,
      honoreeName: 'Robert Johnson',
      message: 'In loving memory of Dad, who always believed in giving back to the community.'
    }
  });

  const tribute2 = await prisma.tribute.create({
    data: {
      type: TributeType.honour,
      honoreeName: 'Dr. Jane Smith',
      message: 'In honour of Dr. Smith\'s 40 years of service to education.'
    }
  });

  const tribute3 = await prisma.tribute.create({
    data: {
      type: TributeType.celebration,
      honoreeName: 'Emma Chen',
      message: 'Happy 50th Birthday, Emma! Here\'s to many more years of making a difference.'
    }
  });

  console.log(`✅ Created ${3} tributes`);

  // ============================================================================
  // GIFTS
  // ============================================================================
  console.log('💝 Creating gifts...');

  const gift1 = await prisma.gift.create({
    data: {
      donorId: donor1.id,
      campaignId: springCampaign.id,
      formId: springForm.id,
      amount: 100,
      currency: Currency.USD,
      donorCoversFee: true,
      feeAmount: 3.20, // 2.9% + $0.30
      processorFee: 3.20,
      netAmount: 100,
      status: GiftStatus.success,
      processor: PaymentProcessor.stripe,
      processorRef: 'ch_1234567890abcdef',
      tributeId: tribute1.id,
      metadata: {
        utmSource: 'email',
        utmMedium: 'campaign',
        utmCampaign: 'spring2025',
        ipAddress: '192.0.2.100',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
      },
      completedAt: new Date('2025-03-15T14:30:00Z')
    }
  });

  const gift2 = await prisma.gift.create({
    data: {
      donorId: donor2.id,
      campaignId: springCampaign.id,
      formId: springForm.id,
      amount: 250,
      currency: Currency.CAD,
      donorCoversFee: false,
      feeAmount: null,
      processorFee: 7.55, // 2.9% + $0.30
      netAmount: 242.45,
      status: GiftStatus.success,
      processor: PaymentProcessor.stripe,
      processorRef: 'ch_0987654321fedcba',
      metadata: {
        utmSource: 'facebook',
        utmMedium: 'social',
        ipAddress: '203.0.113.50'
      },
      completedAt: new Date('2025-03-20T10:15:00Z')
    }
  });

  const gift3 = await prisma.gift.create({
    data: {
      donorId: donor3.id,
      campaignId: springCampaign.id,
      formId: springForm.id,
      amount: 50,
      currency: Currency.USD,
      donorCoversFee: true,
      feeAmount: 1.75,
      processorFee: 1.75,
      netAmount: 50,
      status: GiftStatus.success,
      processor: PaymentProcessor.stripe,
      processorRef: 'ch_abcdef1234567890',
      tributeId: tribute2.id,
      metadata: {
        utmSource: 'google',
        utmMedium: 'cpc'
      },
      completedAt: new Date('2025-03-22T16:45:00Z')
    }
  });

  const gift4 = await prisma.gift.create({
    data: {
      donorId: donor4.id,
      campaignId: springCampaign.id,
      formId: springForm.id,
      amount: 500,
      currency: Currency.USD,
      donorCoversFee: true,
      feeAmount: 14.80,
      processorFee: 14.80,
      netAmount: 500,
      status: GiftStatus.success,
      processor: PaymentProcessor.stripe,
      processorRef: 'ch_xyz789abc123',
      metadata: {
        utmSource: 'direct'
      },
      completedAt: new Date('2025-04-01T12:00:00Z')
    }
  });

  // Failed gift (payment declined)
  const gift5 = await prisma.gift.create({
    data: {
      donorId: donor1.id,
      campaignId: springCampaign.id,
      formId: springForm.id,
      amount: 75,
      currency: Currency.USD,
      donorCoversFee: false,
      feeAmount: null,
      processorFee: null,
      netAmount: 0,
      status: GiftStatus.failed,
      processor: PaymentProcessor.stripe,
      processorRef: 'ch_failed123',
      metadata: {
        errorCode: 'card_declined',
        errorMessage: 'Your card was declined.'
      }
    }
  });

  // Pending gift (awaiting confirmation)
  const gift6 = await prisma.gift.create({
    data: {
      donorId: donor2.id,
      campaignId: monthlyGivingCampaign.id,
      formId: monthlyForm.id,
      amount: 25,
      currency: Currency.USD,
      donorCoversFee: false,
      feeAmount: null,
      processorFee: null,
      netAmount: 0,
      status: GiftStatus.pending,
      processor: PaymentProcessor.stripe,
      processorRef: null,
      metadata: {}
    }
  });

  // Refunded gift
  const gift7 = await prisma.gift.create({
    data: {
      donorId: donor3.id,
      campaignId: yearEndCampaign.id,
      formId: null,
      amount: 100,
      currency: Currency.USD,
      donorCoversFee: false,
      feeAmount: null,
      processorFee: 3.20,
      netAmount: 96.80,
      status: GiftStatus.refunded,
      processor: PaymentProcessor.stripe,
      processorRef: 'ch_refunded456',
      metadata: {},
      completedAt: new Date('2024-12-15T10:00:00Z'),
      refundedAt: new Date('2024-12-20T14:30:00Z')
    }
  });

  console.log(`✅ Created ${7} gifts`);

  // ============================================================================
  // RECURRING PLANS
  // ============================================================================
  console.log('🔄 Creating recurring plans...');

  const recurringPlan1 = await prisma.recurringPlan.create({
    data: {
      donorId: donor1.id,
      campaignId: monthlyGivingCampaign.id,
      amount: 25,
      currency: Currency.USD,
      frequency: RecurringFrequency.monthly,
      donorCoversFee: true,
      feeAmount: 1.03,
      status: RecurringPlanStatus.active,
      nextChargeDate: new Date('2025-05-01T09:00:00Z'),
      lastChargeDate: new Date('2025-04-01T09:00:00Z'),
      processor: PaymentProcessor.stripe,
      mandateId: 'sub_1234567890abcdef'
    }
  });

  const recurringPlan2 = await prisma.recurringPlan.create({
    data: {
      donorId: donor2.id,
      campaignId: monthlyGivingCampaign.id,
      amount: 50,
      currency: Currency.CAD,
      frequency: RecurringFrequency.monthly,
      donorCoversFee: false,
      feeAmount: null,
      status: RecurringPlanStatus.active,
      nextChargeDate: new Date('2025-05-10T09:00:00Z'),
      lastChargeDate: new Date('2025-04-10T09:00:00Z'),
      processor: PaymentProcessor.stripe,
      mandateId: 'sub_0987654321fedcba'
    }
  });

  const recurringPlan3 = await prisma.recurringPlan.create({
    data: {
      donorId: donor3.id,
      campaignId: monthlyGivingCampaign.id,
      amount: 15,
      currency: Currency.USD,
      frequency: RecurringFrequency.monthly,
      donorCoversFee: true,
      feeAmount: 0.74,
      status: RecurringPlanStatus.paused,
      nextChargeDate: new Date('2025-06-15T09:00:00Z'),
      lastChargeDate: new Date('2025-03-15T09:00:00Z'),
      processor: PaymentProcessor.stripe,
      mandateId: 'sub_paused123456',
      pausedAt: new Date('2025-03-20T10:00:00Z')
    }
  });

  const recurringPlan4 = await prisma.recurringPlan.create({
    data: {
      donorId: donor1.id,
      campaignId: null,
      amount: 100,
      currency: Currency.USD,
      frequency: RecurringFrequency.quarterly,
      donorCoversFee: true,
      feeAmount: 3.20,
      status: RecurringPlanStatus.cancelled,
      nextChargeDate: new Date('2025-07-01T09:00:00Z'),
      lastChargeDate: new Date('2025-01-01T09:00:00Z'),
      processor: PaymentProcessor.stripe,
      mandateId: 'sub_cancelled789',
      cancelledAt: new Date('2025-02-15T14:00:00Z')
    }
  });

  console.log(`✅ Created ${4} recurring plans`);

  // ============================================================================
  // RECEIPTS
  // ============================================================================
  console.log('🧾 Creating receipts...');

  const receipt1 = await prisma.receipt.create({
    data: {
      giftId: gift1.id,
      number: 'RCP-2025-000001',
      pdfUrl: 'https://s3.amazonaws.com/receipts/RCP-2025-000001.pdf',
      htmlUrl: 'https://example.org/receipts/RCP-2025-000001',
      taxDeductibleAmount: 100,
      regionalData: {
        country: 'US',
        taxYear: 2025,
        ein: '12-3456789',
        charityName: 'Example Nonprofit Organization',
        charityRegistration: 'Active 501(c)(3)'
      },
      sentAt: new Date('2025-03-15T14:35:00Z')
    }
  });

  const receipt2 = await prisma.receipt.create({
    data: {
      giftId: gift2.id,
      number: 'RCP-2025-000002',
      pdfUrl: 'https://s3.amazonaws.com/receipts/RCP-2025-000002.pdf',
      taxDeductibleAmount: 250,
      regionalData: {
        country: 'CA',
        taxYear: 2025,
        businessNumber: '123456789RR0001',
        charityName: 'Example Nonprofit Organization'
      },
      sentAt: new Date('2025-03-20T10:20:00Z')
    }
  });

  const receipt3 = await prisma.receipt.create({
    data: {
      giftId: gift3.id,
      number: 'RCP-2025-000003',
      pdfUrl: 'https://s3.amazonaws.com/receipts/RCP-2025-000003.pdf',
      taxDeductibleAmount: 50,
      regionalData: {
        country: 'US',
        taxYear: 2025,
        ein: '12-3456789'
      },
      sentAt: new Date('2025-03-22T16:50:00Z')
    }
  });

  // Corrected receipt
  const receipt4 = await prisma.receipt.create({
    data: {
      giftId: gift4.id,
      number: 'RCP-2025-000004',
      pdfUrl: 'https://s3.amazonaws.com/receipts/RCP-2025-000004.pdf',
      taxDeductibleAmount: 500,
      regionalData: {
        country: 'US',
        taxYear: 2025,
        ein: '12-3456789'
      },
      sentAt: new Date('2025-04-01T12:05:00Z')
    }
  });

  const receipt4Corrected = await prisma.receipt.create({
    data: {
      giftId: gift4.id,
      number: 'RCP-2025-000004-C1',
      pdfUrl: 'https://s3.amazonaws.com/receipts/RCP-2025-000004-C1.pdf',
      taxDeductibleAmount: 500,
      regionalData: {
        country: 'US',
        taxYear: 2025,
        ein: '12-3456789',
        correctionReason: 'Updated donor name'
      },
      correctedFromId: receipt4.id,
      sentAt: new Date('2025-04-02T09:00:00Z')
    }
  });

  console.log(`✅ Created ${5} receipts (including 1 correction)`);

  // ============================================================================
  // ECARDS
  // ============================================================================
  console.log('💌 Creating e-cards...');

  const ecard1 = await prisma.ecard.create({
    data: {
      tributeId: tribute1.id,
      giftId: gift1.id,
      designId: 'memorial-candle',
      recipientName: 'Mary Johnson',
      recipientEmail: 'mary.johnson@example.com',
      personalMessage: 'Mom, I made this donation in Dad\'s memory. I know how much this cause meant to him.',
      scheduleAt: new Date('2025-03-15T15:00:00Z'),
      sentAt: new Date('2025-03-15T15:00:05Z'),
      openedAt: new Date('2025-03-16T08:30:00Z')
    }
  });

  const ecard2 = await prisma.ecard.create({
    data: {
      tributeId: tribute2.id,
      giftId: gift3.id,
      designId: 'honour-certificate',
      recipientName: 'Dr. Jane Smith',
      recipientEmail: 'jane.smith@university.edu',
      personalMessage: 'Thank you for inspiring generations of students. This donation is in your honour.',
      scheduleAt: new Date('2025-03-22T17:00:00Z'),
      sentAt: new Date('2025-03-22T17:00:10Z'),
      openedAt: null // Not yet opened
    }
  });

  const ecard3 = await prisma.ecard.create({
    data: {
      tributeId: tribute3.id,
      giftId: gift3.id, // Can reuse gift if needed
      designId: 'celebration-balloons',
      recipientName: 'Emma Chen',
      recipientEmail: 'emma.chen.bday@example.com',
      personalMessage: 'Happy Birthday! Made a donation in your honour to celebrate this special day.',
      scheduleAt: new Date('2025-04-10T00:00:00Z'), // Scheduled for future
      sentAt: null,
      openedAt: null
    }
  });

  console.log(`✅ Created ${3} e-cards`);

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================
  console.log('📋 Creating audit logs...');

  await prisma.audit.create({
    data: {
      actor: donor1.id,
      action: AuditAction.CREATE,
      resource: `gift:${gift1.id}`,
      diffs: {
        after: {
          amount: 100,
          status: 'pending',
          donorCoversFee: true
        }
      },
      ipAddress: '192.0.2.100',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
    }
  });

  await prisma.audit.create({
    data: {
      actor: 'system',
      action: AuditAction.UPDATE,
      resource: `gift:${gift1.id}`,
      diffs: {
        before: { status: 'pending' },
        after: { status: 'success', completedAt: '2025-03-15T14:30:00Z' }
      },
      ipAddress: null,
      userAgent: 'webhook-processor'
    }
  });

  await prisma.audit.create({
    data: {
      actor: donor3.id,
      action: AuditAction.UPDATE,
      resource: `recurring_plan:${recurringPlan3.id}`,
      diffs: {
        before: { status: 'active' },
        after: { status: 'paused', pausedAt: '2025-03-20T10:00:00Z' }
      },
      ipAddress: '198.51.100.75',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });

  await prisma.audit.create({
    data: {
      actor: 'admin-user-123',
      action: AuditAction.UPDATE,
      resource: `gift:${gift7.id}`,
      diffs: {
        before: { status: 'success' },
        after: { status: 'refunded', refundedAt: '2024-12-20T14:30:00Z' }
      },
      ipAddress: '203.0.113.200',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    }
  });

  await prisma.audit.create({
    data: {
      actor: donor1.id,
      action: AuditAction.READ,
      resource: `donor:${donor1.id}`,
      diffs: {
        note: 'Donor accessed their profile page'
      },
      ipAddress: '192.0.2.100',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
    }
  });

  console.log(`✅ Created ${5} audit log entries`);

  // ============================================================================
  // WEBHOOK EVENTS
  // ============================================================================
  console.log('🔔 Creating webhook events...');

  await prisma.webhookEvent.create({
    data: {
      processor: PaymentProcessor.stripe,
      externalId: 'evt_1234567890abcdef',
      eventType: 'payment_intent.succeeded',
      payload: {
        id: 'evt_1234567890abcdef',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_1234567890',
            amount: 10000,
            currency: 'usd',
            status: 'succeeded'
          }
        }
      },
      processed: true,
      processedAt: new Date('2025-03-15T14:30:10Z'),
      retryCount: 0
    }
  });

  await prisma.webhookEvent.create({
    data: {
      processor: PaymentProcessor.stripe,
      externalId: 'evt_0987654321fedcba',
      eventType: 'charge.refunded',
      payload: {
        id: 'evt_0987654321fedcba',
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_refunded456',
            amount: 10000,
            refunded: true
          }
        }
      },
      processed: true,
      processedAt: new Date('2024-12-20T14:30:15Z'),
      retryCount: 0
    }
  });

  await prisma.webhookEvent.create({
    data: {
      processor: PaymentProcessor.stripe,
      externalId: 'evt_failed123abc',
      eventType: 'payment_intent.payment_failed',
      payload: {
        id: 'evt_failed123abc',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_failed123',
            status: 'failed',
            last_payment_error: {
              code: 'card_declined'
            }
          }
        }
      },
      processed: false,
      errorMessage: 'Unable to locate matching gift record',
      retryCount: 3
    }
  });

  console.log(`✅ Created ${3} webhook events`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${4} donors`);
  console.log(`   - ${4} campaigns (1 active, 1 closed, 1 draft, 1 monthly)`);
  console.log(`   - ${2} forms (with A/B testing)`);
  console.log(`   - ${3} tributes`);
  console.log(`   - ${7} gifts (4 success, 1 failed, 1 pending, 1 refunded)`);
  console.log(`   - ${4} recurring plans (2 active, 1 paused, 1 cancelled)`);
  console.log(`   - ${5} receipts (including 1 correction)`);
  console.log(`   - ${3} e-cards (2 sent, 1 scheduled)`);
  console.log(`   - ${5} audit log entries`);
  console.log(`   - ${3} webhook events`);
  console.log('\n✨ Database is ready for testing!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
