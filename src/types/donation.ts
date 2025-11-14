/**
 * Donation-related type definitions
 * Centralized types for the donation flow
 */

export type Currency = 'USD' | 'CAD' | 'EUR';

export type GiftType = 'one-time' | 'recurring';

export type Frequency = 'monthly' | 'quarterly' | 'annually';

export type TributeType = 'honour' | 'memory' | 'celebration';

export type GiftStatus = 'pending' | 'success' | 'failed' | 'refunded';

export type PaymentProcessor = 'stripe' | 'adyen' | 'paypal';

export interface PresetAmount {
  value: number;
  impactMessage: string;
}

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string;
  heroImage?: {
    url: string;
    alt: string;
    width: number;
    height: number;
  };
  goal?: {
    targetAmount: number;
    currentAmount: number;
    supporterCount: number;
    progressPercentage: number;
  };
  presetAmounts: PresetAmount[];
  currency: Currency;
  minAmount: number;
  maxAmount: number;
  status: 'active' | 'paused' | 'completed';
}

export interface DonorInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  emailOptIn: boolean;
}

export interface TributeInfo {
  type: TributeType;
  honoreeName: string;
  message?: string;
  ecard?: {
    recipientName: string;
    recipientEmail: string;
    templateId: string;
    personalMessage?: string;
    sendDate: Date;
  };
}

export interface PaymentInfo {
  processor: PaymentProcessor;
  paymentMethodId: string; // Token from processor
}

export interface DonationFormData {
  // Step 1: Amount
  amount: number;
  currency: Currency;
  giftType: GiftType;
  frequency?: Frequency;

  // Step 2: Donor Info
  donor: DonorInfo;
  tribute?: TributeInfo;

  // Step 3: Payment
  payment: PaymentInfo;
  coversFees: boolean;
  feeAmount: number;
  totalAmount: number;

  // Metadata
  campaignId?: string;
  formId?: string;
  metadata?: Record<string, unknown>;
}

export interface Gift {
  id: string;
  donorId: string;
  campaignId?: string;
  amount: number;
  currency: Currency;
  status: GiftStatus;
  donorCoversFee: boolean;
  feeAmount?: number;
  processorFee?: number;
  netAmount: number;
  processor: PaymentProcessor;
  processorRef?: string;
  completedAt?: Date;
  refundedAt?: Date;
  receiptId?: string;
  tributeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Receipt {
  id: string;
  giftId: string;
  number: string;
  pdfUrl: string;
  taxDeductibleAmount: number;
  sentAt: Date;
  createdAt: Date;
}

export interface RecurringPlan {
  id: string;
  donorId: string;
  campaignId?: string;
  amount: number;
  currency: Currency;
  frequency: Frequency;
  status: 'active' | 'paused' | 'cancelled';
  nextChargeDate?: Date;
  startDate: Date;
  cancelledAt?: Date;
  paymentMethodId: string;
  processor: PaymentProcessor;
  mandateId?: string;
  totalDonated: number;
  chargeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Form validation error types
export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationErrors {
  [key: string]: string;
}
