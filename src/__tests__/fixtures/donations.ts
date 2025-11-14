/**
 * Test Fixtures: Donation Data
 *
 * Reusable mock data for donation-related tests
 */

import type { Donor, Gift, RecurringPlan, Campaign } from '@prisma/client';

export const mockDonor: Donor = {
  id: 'donor-test-001',
  email: 'test.donor@example.com',
  firstName: 'Jane',
  lastName: 'Donor',
  phone: '+1-555-0100',
  addressLine1: '123 Charity Lane',
  addressLine2: 'Suite 100',
  city: 'Nonprofit City',
  state: 'CA',
  postalCode: '90210',
  country: 'US',
  preferredLanguage: 'en',
  emailOptIn: true,
  smsOptIn: false,
  externalIds: {},
  metadata: {},
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  deletedAt: null,
};

export const mockCampaign: Campaign = {
  id: 'campaign-test-001',
  slug: 'annual-fund-2024',
  name: 'Annual Fund 2024',
  description: 'Support our annual fundraising campaign',
  organizationId: 'org-test-001',
  status: 'ACTIVE',
  startDate: new Date('2024-01-01T00:00:00Z'),
  endDate: new Date('2024-12-31T23:59:59Z'),
  targetAmount: 100000,
  currency: 'USD',
  donorTarget: 500,
  themeId: 'theme-default',
  metadata: {},
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  deletedAt: null,
};

export const mockGift: Gift = {
  id: 'gift-test-001',
  donorId: 'donor-test-001',
  campaignId: 'campaign-test-001',
  amount: 100.00,
  currency: 'USD',
  status: 'COMPLETED',
  processorId: 'stripe',
  processorPaymentId: 'pi_test_123456789',
  processorCustomerId: 'cus_test_123456789',
  paymentMethod: 'CARD',
  cardBrand: 'visa',
  cardLast4: '4242',
  feeAmount: 3.20,
  feeCoveredByDonor: true,
  netAmount: 100.00,
  receiptId: 'receipt-test-001',
  tributeType: null,
  tributeHonoree: null,
  tributeMessage: null,
  ecardId: null,
  recurringPlanId: null,
  metadata: {},
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z'),
  deletedAt: null,
};

export const mockRecurringGift: Gift = {
  ...mockGift,
  id: 'gift-recurring-001',
  recurringPlanId: 'recurring-test-001',
};

export const mockRecurringPlan: RecurringPlan = {
  id: 'recurring-test-001',
  donorId: 'donor-test-001',
  campaignId: 'campaign-test-001',
  amount: 50.00,
  currency: 'USD',
  frequency: 'MONTHLY',
  status: 'ACTIVE',
  processorId: 'stripe',
  processorSubscriptionId: 'sub_test_123456789',
  processorCustomerId: 'cus_test_123456789',
  paymentMethod: 'CARD',
  cardBrand: 'visa',
  cardLast4: '4242',
  nextChargeDate: new Date('2024-02-15T00:00:00Z'),
  startDate: new Date('2024-01-15T00:00:00Z'),
  endDate: null,
  tributeType: null,
  tributeHonoree: null,
  ecardId: null,
  metadata: {},
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z'),
  deletedAt: null,
};

export const mockTributeGift: Gift = {
  ...mockGift,
  id: 'gift-tribute-001',
  tributeType: 'MEMORY',
  tributeHonoree: 'John Smith',
  tributeMessage: 'In loving memory',
  ecardId: 'ecard-test-001',
};

// Helper function to create custom mock gifts
export function createMockGift(overrides?: Partial<Gift>): Gift {
  return {
    ...mockGift,
    ...overrides,
  };
}

// Helper function to create custom mock donors
export function createMockDonor(overrides?: Partial<Donor>): Donor {
  return {
    ...mockDonor,
    ...overrides,
  };
}

// Helper function to create custom mock campaigns
export function createMockCampaign(overrides?: Partial<Campaign>): Campaign {
  return {
    ...mockCampaign,
    ...overrides,
  };
}

// Helper function to create custom mock recurring plans
export function createMockRecurringPlan(
  overrides?: Partial<RecurringPlan>
): RecurringPlan {
  return {
    ...mockRecurringPlan,
    ...overrides,
  };
}
