/**
 * Example: Donation Form with Analytics Integration
 *
 * This example demonstrates how to integrate analytics tracking
 * into a donation form component.
 */

'use client';

import { useState, useEffect } from 'react';
import { useDonationFunnelTracking, useBeforeUnload } from '@/hooks/useAnalytics';
import { trpc } from '@/trpc/client';

interface DonationFormProps {
  campaign: {
    id: string;
    slug: string;
    name: string;
  };
  formId: string;
}

export default function DonationFormWithAnalytics({ campaign, formId }: DonationFormProps) {
  // Analytics hooks
  const {
    trackDonationStarted,
    trackAmountSelected,
    trackRecurringToggled,
    trackFeeCoverageToggled,
    trackDonorInfoSubmitted,
    trackPaymentSubmitted,
    trackDonationCompleted,
    trackDonationFailed,
  } = useDonationFunnelTracking();

  useBeforeUnload(); // Flush events on page unload

  // Form state
  const [step, setStep] = useState<'amount' | 'details' | 'payment'>('amount');
  const [amount, setAmount] = useState<number | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'annually'>('monthly');
  const [donorCoversFee, setDonorCoversFee] = useState(false);
  const [feeAmount, setFeeAmount] = useState(0);

  // tRPC mutation
  const createGift = trpc.donation.create.useMutation({
    onSuccess: (gift) => {
      // Track successful donation
      trackDonationCompleted({
        gift_id: gift.id,
        campaign_id: campaign.id,
        campaign_slug: campaign.slug,
        form_id: formId,
        amount: gift.amount,
        currency: gift.currency,
        recurring: isRecurring,
        processor: gift.processor,
        processing_time_ms: Date.now() - paymentStartTime,
      });

      // Redirect to thank you page
      window.location.href = `/thank-you?gift=${gift.id}`;
    },
    onError: (error) => {
      // Track failed donation
      trackDonationFailed({
        campaign_id: campaign.id,
        campaign_slug: campaign.slug,
        form_id: formId,
        amount: amount!,
        currency: 'USD',
        processor: 'stripe',
        error_code: error.data?.code || 'UNKNOWN',
        error_message: error.message,
        retry_available: true,
      });
    },
  });

  // Track page view on mount
  useEffect(() => {
    trackDonationStarted({
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      form_id: formId,
    });
  }, [campaign.id, campaign.slug, formId]);

  // Calculate fee
  useEffect(() => {
    if (amount && donorCoversFee) {
      const fee = amount * 0.029 + 0.30; // Example: 2.9% + $0.30
      setFeeAmount(parseFloat(fee.toFixed(2)));
    } else {
      setFeeAmount(0);
    }
  }, [amount, donorCoversFee]);

  // Step 1: Amount Selection
  const handleAmountSelect = (selectedAmount: number, type: 'preset' | 'custom') => {
    setAmount(selectedAmount);

    // Track amount selection
    trackAmountSelected({
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      form_id: formId,
      amount: selectedAmount,
      currency: 'USD',
      amount_type: type,
      preset_options: [25, 50, 100, 250],
    });

    setStep('details');
  };

  // Recurring toggle
  const handleRecurringToggle = (enabled: boolean) => {
    const previousState = isRecurring;
    setIsRecurring(enabled);

    // Track recurring toggle
    trackRecurringToggled({
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      form_id: formId,
      recurring: enabled,
      frequency: enabled ? frequency : undefined,
      previous_state: previousState,
      amount,
      currency: 'USD',
    });
  };

  // Fee coverage toggle
  const handleFeeCoverageToggle = (enabled: boolean) => {
    const previousState = donorCoversFee;
    setDonorCoversFee(enabled);

    // Track fee coverage toggle
    trackFeeCoverageToggled({
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      form_id: formId,
      donor_covers_fee: enabled,
      fee_amount: enabled ? feeAmount : 0,
      fee_percentage: 2.9,
      previous_state: previousState,
      amount,
      currency: 'USD',
    });
  };

  // Step 2: Donor Information
  const handleDonorInfoSubmit = (donorData: any) => {
    // Track donor info submission (PII is automatically redacted)
    trackDonorInfoSubmitted({
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      form_id: formId,
      is_authenticated: !!donorData.userId,
      fields_completed: ['email', 'name', 'address'],
      consent_marketing: donorData.consentMarketing,
      amount,
      currency: 'USD',
    });

    setStep('payment');
  };

  // Step 3: Payment Submission
  let paymentStartTime = 0;

  const handlePaymentSubmit = async (paymentMethod: string) => {
    paymentStartTime = Date.now();

    // Track payment submission
    trackPaymentSubmitted({
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      form_id: formId,
      amount: amount!,
      currency: 'USD',
      recurring: isRecurring,
      payment_method: paymentMethod as 'card' | 'paypal',
      total_amount: amount! + (donorCoversFee ? feeAmount : 0),
    });

    // Submit donation via tRPC
    await createGift.mutateAsync({
      campaignId: campaign.id,
      formId,
      amount: amount!,
      currency: 'USD',
      donorCoversFee,
      feeAmount: donorCoversFee ? feeAmount : undefined,
      recurring: isRecurring,
      frequency: isRecurring ? frequency : undefined,
      // ... other fields
    });
  };

  // Render
  return (
    <div className="donation-form">
      <h1>{campaign.name}</h1>

      {step === 'amount' && (
        <div className="step-amount">
          <h2>Select Amount</h2>

          {/* Preset amounts */}
          <div className="preset-amounts">
            {[25, 50, 100, 250].map((preset) => (
              <button
                key={preset}
                onClick={() => handleAmountSelect(preset, 'preset')}
                className="btn-amount"
              >
                ${preset}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="custom-amount">
            <input
              type="number"
              placeholder="Other amount"
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value > 0) {
                  handleAmountSelect(value, 'custom');
                }
              }}
            />
          </div>

          {/* Recurring toggle */}
          <div className="recurring-toggle">
            <label>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => handleRecurringToggle(e.target.checked)}
              />
              Make this a monthly gift
            </label>

            {isRecurring && (
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            )}
          </div>

          {/* Fee coverage */}
          {amount && (
            <div className="fee-coverage">
              <label>
                <input
                  type="checkbox"
                  checked={donorCoversFee}
                  onChange={(e) => handleFeeCoverageToggle(e.target.checked)}
                />
                Cover processing fees (${feeAmount.toFixed(2)})
              </label>
            </div>
          )}
        </div>
      )}

      {step === 'details' && (
        <div className="step-details">
          <h2>Your Information</h2>
          {/* Donor information form */}
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleDonorInfoSubmit({
              email: formData.get('email'),
              firstName: formData.get('firstName'),
              lastName: formData.get('lastName'),
              consentMarketing: formData.get('consent') === 'on',
            });
          }}>
            <input type="email" name="email" placeholder="Email" required />
            <input type="text" name="firstName" placeholder="First Name" required />
            <input type="text" name="lastName" placeholder="Last Name" required />

            <label>
              <input type="checkbox" name="consent" />
              I'd like to receive updates about your work
            </label>

            <button type="submit">Continue to Payment</button>
          </form>
        </div>
      )}

      {step === 'payment' && (
        <div className="step-payment">
          <h2>Payment</h2>

          <div className="payment-summary">
            <p>Donation: ${amount?.toFixed(2)}</p>
            {donorCoversFee && <p>Processing Fee: ${feeAmount.toFixed(2)}</p>}
            <p className="total">
              Total: ${((amount || 0) + (donorCoversFee ? feeAmount : 0)).toFixed(2)}
            </p>
          </div>

          {/* Payment form (Stripe, PayPal, etc.) */}
          <button
            onClick={() => handlePaymentSubmit('card')}
            disabled={createGift.isLoading}
          >
            {createGift.isLoading ? 'Processing...' : 'Complete Donation'}
          </button>
        </div>
      )}
    </div>
  );
}
