/**
 * Main Donation Page
 *
 * Public-facing donation form for a specific campaign.
 * SSR with ISR for performance and SEO.
 *
 * Route: /donate/[slug]
 * Example: /donate/spring-appeal
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '~/trpc/server';
import { DonationFlow } from '~/components/donation/DonationFlow';

interface DonatePageProps {
  params: {
    slug: string;
  };
  searchParams: {
    amount?: string;
    frequency?: 'monthly' | 'quarterly' | 'annually';
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: DonatePageProps): Promise<Metadata> {
  try {
    const campaign = await api.campaign.getBySlug({ slug: params.slug });

    return {
      title: `Support ${campaign.name} | Donate Now`,
      description: campaign.description || `Make a donation to support ${campaign.name}`,
      openGraph: {
        title: `Support ${campaign.name}`,
        description: campaign.description || undefined,
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'Campaign Not Found',
    };
  }
}

/**
 * Main donation page component
 * Server Component with SSR for campaign data
 */
export default async function DonatePage({
  params,
  searchParams,
}: DonatePageProps) {
  // Fetch campaign data server-side
  let campaign;
  try {
    campaign = await api.campaign.getBySlug({ slug: params.slug });
  } catch (error) {
    // Campaign not found or error fetching
    notFound();
  }

  // Check if campaign is active
  if (campaign.status !== 'active') {
    notFound();
  }

  // Extract UTM parameters for attribution
  const utmParams = {
    source: searchParams.utm_source,
    medium: searchParams.utm_medium,
    campaign: searchParams.utm_campaign,
  };

  // Pre-fill amount and frequency if provided in URL
  const initialAmount = searchParams.amount
    ? parseFloat(searchParams.amount)
    : undefined;
  const initialFrequency = searchParams.frequency;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Campaign Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {campaign.name}
            </h1>
            {campaign.description && (
              <p className="text-lg text-gray-700">{campaign.description}</p>
            )}
          </div>

          {/* Campaign Progress (if goals set) */}
          {(campaign.targetAmount || campaign.donorTarget) && (
            <div className="mt-8 max-w-3xl">
              <div className="bg-gray-100 rounded-lg p-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>
                    {campaign.targetAmount && (
                      <>
                        ${campaign.currentAmount?.toLocaleString() || 0} raised of $
                        {campaign.targetAmount.toLocaleString()} goal
                      </>
                    )}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-primary-600 h-4 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (campaign.progressPercentage || 0),
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  {campaign.donorCount !== undefined && (
                    <span>{campaign.donorCount} donors</span>
                  )}
                  {campaign.progressPercentage !== undefined && (
                    <span>{campaign.progressPercentage}%</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Donation Form */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <DonationFlow
          campaignId={campaign.id}
          campaignSlug={campaign.slug}
          formId={campaign.formId || undefined}
          initialAmount={initialAmount}
          initialFrequency={initialFrequency}
          utmParams={utmParams}
        />
      </div>

      {/* Impact Message */}
      {campaign.impactMessage && (
        <div className="bg-primary-50 border-t border-primary-100">
          <div className="container mx-auto px-4 py-12 max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your Impact
            </h2>
            <div
              className="text-gray-700 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: campaign.impactMessage }}
            />
          </div>
        </div>
      )}
    </main>
  );
}

/**
 * Enable ISR with 1-hour revalidation
 * Fresh data for most visitors, fast page loads
 */
export const revalidate = 3600; // 1 hour

/**
 * Generate static params for popular campaigns at build time
 * This creates static pages for better performance
 */
export async function generateStaticParams() {
  try {
    // Fetch active campaigns at build time
    const campaigns = await api.campaign.list({
      status: 'active',
      limit: 20, // Pre-render top 20 campaigns
    });

    return campaigns.map((campaign) => ({
      slug: campaign.slug,
    }));
  } catch (error) {
    // If error fetching campaigns, return empty array
    // Pages will be generated on-demand
    return [];
  }
}
