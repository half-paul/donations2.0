'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import type { Campaign, DonationFormData } from '@/types/donation';
import CampaignHero from './CampaignHero';
import AmountSelector from './AmountSelector';
import DonorInformationForm from './DonorInformationForm';
import PaymentStep from './PaymentStep';
import ProgressIndicator from './ProgressIndicator';
import DonationSummaryCard from './DonationSummaryCard';
import LoadingState from '@/components/ui/LoadingState';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { calculateFee } from '@/lib/utils';

interface DonationFlowProps {
  campaign: Campaign;
}

type Step = 'amount' | 'donor-info' | 'payment';

export default function DonationFlow({ campaign }: DonationFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('amount');
  const [formData, setFormData] = useState<Partial<DonationFormData>>({
    currency: campaign.currency,
    giftType: 'one-time',
    coversFees: false,
    feeAmount: 0,
  });

  // Track if user is submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Create donation mutation
  const createDonation = api.donation.create.useMutation({
    onSuccess: (data) => {
      // Navigate to thank you page
      router.push(`/donate/${campaign.slug}/thank-you?giftId=${data.id}`);
    },
    onError: (error) => {
      setSubmitError(error.message);
      setIsSubmitting(false);
    },
  });

  const handleAmountContinue = (data: {
    amount: number;
    giftType: 'one-time' | 'recurring';
    frequency?: 'monthly' | 'quarterly' | 'annually';
  }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep('donor-info');
    scrollToTop();
  };

  const handleDonorInfoContinue = (data: {
    donor: DonationFormData['donor'];
    tribute?: DonationFormData['tribute'];
  }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep('payment');
    scrollToTop();
  };

  const handlePaymentSubmit = async (data: {
    payment: DonationFormData['payment'];
    coversFees: boolean;
  }) => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Calculate fee amount
    const feeAmount = data.coversFees
      ? calculateFee(formData.amount!, data.payment.processor)
      : 0;

    const totalAmount = (formData.amount || 0) + feeAmount;

    const completeFormData: DonationFormData = {
      amount: formData.amount!,
      currency: formData.currency!,
      giftType: formData.giftType!,
      frequency: formData.frequency,
      donor: formData.donor!,
      tribute: formData.tribute,
      payment: data.payment,
      coversFees: data.coversFees,
      feeAmount,
      totalAmount,
      campaignId: campaign.id,
    };

    try {
      await createDonation.mutateAsync({
        donorEmail: completeFormData.donor.email,
        firstName: completeFormData.donor.firstName,
        lastName: completeFormData.donor.lastName,
        phone: completeFormData.donor.phone,
        amount: completeFormData.amount,
        currency: completeFormData.currency,
        campaignId: completeFormData.campaignId,
        donorCoversFee: completeFormData.coversFees,
        metadata: {
          giftType: completeFormData.giftType,
          frequency: completeFormData.frequency,
          emailOptIn: completeFormData.donor.emailOptIn,
        },
      });
    } catch (error) {
      // Error handled by onError callback
      console.error('Donation submission error:', error);
    }
  };

  const handleBack = () => {
    const stepOrder: Step[] = ['amount', 'donor-info', 'payment'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
      scrollToTop();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const steps = [
    { id: 'amount', label: 'Amount', status: getStepStatus('amount') },
    { id: 'donor-info', label: 'Donor Info', status: getStepStatus('donor-info') },
    { id: 'payment', label: 'Payment', status: getStepStatus('payment') },
  ];

  function getStepStatus(step: Step): 'completed' | 'current' | 'upcoming' {
    const stepOrder: Step[] = ['amount', 'donor-info', 'payment'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  }

  if (isSubmitting) {
    return <LoadingState message="Processing your donation..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-gray-900">
              {campaign.name}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Secure</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator - Desktop */}
      <div className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <ProgressIndicator steps={steps} variant="desktop" />
        </div>
      </div>

      {/* Progress Indicator - Mobile */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <ProgressIndicator steps={steps} variant="mobile" />
      </div>

      {/* Back Button */}
      {currentStep !== 'amount' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-primary hover:text-primary-hover transition-colors"
            aria-label="Go back to previous step"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {submitError && (
          <div className="mb-6">
            <ErrorMessage message={submitError} onDismiss={() => setSubmitError(null)} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form Content */}
          <div className="lg:col-span-2">
            {currentStep === 'amount' && <CampaignHero campaign={campaign} />}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              {currentStep === 'amount' && (
                <AmountSelector
                  presetAmounts={campaign.presetAmounts}
                  currency={campaign.currency}
                  minAmount={campaign.minAmount}
                  maxAmount={campaign.maxAmount}
                  selectedAmount={formData.amount || null}
                  giftType={formData.giftType || 'one-time'}
                  onContinue={handleAmountContinue}
                />
              )}

              {currentStep === 'donor-info' && (
                <DonorInformationForm
                  initialData={{
                    donor: formData.donor,
                    tribute: formData.tribute,
                  }}
                  onContinue={handleDonorInfoContinue}
                />
              )}

              {currentStep === 'payment' && (
                <PaymentStep
                  amount={formData.amount!}
                  currency={formData.currency!}
                  onSubmit={handlePaymentSubmit}
                />
              )}
            </div>
          </div>

          {/* Right Column - Summary (Desktop Only) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <DonationSummaryCard
                campaign={campaign.name}
                giftType={formData.giftType!}
                frequency={formData.frequency}
                donor={formData.donor}
                amount={formData.amount || 0}
                feeAmount={formData.feeAmount || 0}
                totalAmount={(formData.amount || 0) + (formData.feeAmount || 0)}
                variant="sidebar"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
