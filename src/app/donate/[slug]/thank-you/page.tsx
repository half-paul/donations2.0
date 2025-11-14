/**
 * Donation Thank You Page
 *
 * Confirmation page shown after successful donation.
 * Displays receipt, impact message, and social sharing options.
 *
 * Route: /donate/[slug]/thank-you?giftId=xxx
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { api } from '~/trpc/server';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ShareIcon, EnvelopeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ThankYouPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    giftId?: string;
  };
}

export const metadata: Metadata = {
  title: 'Thank You for Your Donation',
  description: 'Your donation has been received. Thank you for your support!',
  robots: 'noindex, nofollow', // Don't index thank you pages
};

export default async function ThankYouPage({
  params,
  searchParams,
}: ThankYouPageProps) {
  // Gift ID is required
  if (!searchParams.giftId) {
    redirect(`/donate/${params.slug}`);
  }

  // Fetch gift details
  let gift;
  try {
    gift = await api.donation.getById({ giftId: searchParams.giftId });
  } catch (error) {
    notFound();
  }

  // Ensure gift is successful
  if (gift.status !== 'success') {
    notFound();
  }

  // Fetch campaign for context
  const campaign = gift.campaign;

  // Calculate impact (if campaign has impact metrics)
  const impactAmount = gift.netAmount || gift.amount;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <CheckCircleIcon className="w-20 h-20 text-success-600 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Thank You for Your Donation!
          </h1>
          <p className="text-xl text-gray-600">
            Your generosity makes a difference.
          </p>
        </div>

        {/* Donation Summary Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Donation Confirmation
          </h2>

          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-gray-600">Amount</dt>
              <dd className="font-semibold text-gray-900">
                ${gift.amount.toFixed(2)} {gift.currency}
              </dd>
            </div>

            {gift.donorCoversFee && gift.feeAmount && (
              <div className="flex justify-between text-sm">
                <dt className="text-gray-600">Processing Fee (covered by you)</dt>
                <dd className="text-gray-600">
                  ${gift.feeAmount.toFixed(2)}
                </dd>
              </div>
            )}

            {gift.donorCoversFee && (
              <div className="flex justify-between border-t pt-4">
                <dt className="text-gray-600">Total Charged</dt>
                <dd className="font-semibold text-gray-900">
                  ${(gift.amount + (gift.feeAmount || 0)).toFixed(2)} {gift.currency}
                </dd>
              </div>
            )}

            <div className="flex justify-between border-t pt-4">
              <dt className="text-gray-600">Date</dt>
              <dd className="text-gray-600">
                {new Date(gift.completedAt || gift.createdAt).toLocaleDateString(
                  'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </dd>
            </div>

            {campaign && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Campaign</dt>
                <dd className="text-gray-600">{campaign.name}</dd>
              </div>
            )}

            {gift.tribute && (
              <div className="flex justify-between">
                <dt className="text-gray-600">In {gift.tribute.type} of</dt>
                <dd className="text-gray-600">{gift.tribute.honoreeName}</dd>
              </div>
            )}

            {gift.receipt && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Receipt Number</dt>
                <dd className="font-mono text-sm text-gray-600">
                  {gift.receipt.number}
                </dd>
              </div>
            )}
          </dl>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {gift.receipt?.pdfUrl && (
              <a
                href={gift.receipt.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download Receipt
              </a>
            )}

            <button
              type="button"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {
                // Email receipt functionality
                window.location.href = `mailto:?subject=My Donation Receipt&body=Thank you for your donation of $${gift.amount} to ${campaign?.name || 'our campaign'}.`;
              }}
            >
              <EnvelopeIcon className="w-5 h-5" />
              Email Receipt
            </button>
          </div>
        </div>

        {/* Impact Message */}
        {campaign?.impactMessage && (
          <div className="bg-primary-50 rounded-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Impact
            </h2>
            <div
              className="text-gray-700 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: campaign.impactMessage }}
            />
          </div>
        )}

        {/* Social Sharing */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Spread the Word
          </h2>
          <p className="text-gray-600 mb-6">
            Help us reach more supporters by sharing this campaign with your friends
            and family.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `I just donated to ${campaign?.name || 'a great cause'}! Join me in making a difference.`
              )}&url=${encodeURIComponent(
                typeof window !== 'undefined'
                  ? window.location.origin + `/donate/${params.slug}`
                  : ''
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-colors"
            >
              <ShareIcon className="w-5 h-5" />
              Share on Twitter
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                typeof window !== 'undefined'
                  ? window.location.origin + `/donate/${params.slug}`
                  : ''
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors"
            >
              <ShareIcon className="w-5 h-5" />
              Share on Facebook
            </a>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            What's Next?
          </h2>

          <ul className="space-y-4">
            <li className="flex gap-3">
              <EnvelopeIcon className="w-6 h-6 text-primary-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Check Your Email</div>
                <div className="text-gray-600 text-sm">
                  We've sent a receipt to {gift.donor?.firstName || 'your email'}. It
                  should arrive within a few minutes.
                </div>
              </div>
            </li>

            <li className="flex gap-3">
              <CheckCircleIcon className="w-6 h-6 text-success-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">
                  Your donation is tax-deductible
                </div>
                <div className="text-gray-600 text-sm">
                  Keep your receipt for your tax records. Tax ID: XX-XXXXXXX
                </div>
              </div>
            </li>
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/donate/${params.slug}`}
              className="px-6 py-3 text-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Make Another Donation
            </Link>

            <Link
              href="/"
              className="px-6 py-3 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            A confirmation email has been sent to your email address.
            <br />
            If you don't see it, please check your spam folder.
          </p>
        </div>
      </div>
    </main>
  );
}

/**
 * No caching for thank you pages (always fresh data)
 */
export const revalidate = 0;
export const dynamic = 'force-dynamic';
