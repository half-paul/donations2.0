import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { api } from '@/trpc/server';
import DonationFlow from '@/components/donation/DonationFlow';
import LoadingState from '@/components/ui/LoadingState';
import type { Metadata } from 'next';

interface DonatePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: DonatePageProps): Promise<Metadata> {
  try {
    const campaign = await api.campaign.getBySlug({ slug: params.slug });

    return {
      title: `Donate to ${campaign.name} | Raisin Next`,
      description: campaign.description || `Support ${campaign.name} with a secure online donation`,
      openGraph: {
        title: `Donate to ${campaign.name}`,
        description: campaign.description,
        type: 'website',
        images: campaign.heroImage?.url ? [campaign.heroImage.url] : [],
      },
    };
  } catch {
    return {
      title: 'Donate | Raisin Next',
      description: 'Make a secure online donation',
    };
  }
}

export default async function DonatePage({ params }: DonatePageProps) {
  try {
    // Server-side data fetching with tRPC
    const campaign = await api.campaign.getBySlug({ slug: params.slug });

    return (
      <main className="min-h-screen bg-gray-100">
        <Suspense fallback={<LoadingState />}>
          <DonationFlow campaign={campaign} />
        </Suspense>
      </main>
    );
  } catch (error) {
    // Campaign not found or error fetching
    notFound();
  }
}

// Optional: Generate static params for ISR
export async function generateStaticParams() {
  try {
    const campaigns = await api.campaign.list({ limit: 100 });

    return campaigns.items.map((campaign) => ({
      slug: campaign.slug,
    }));
  } catch {
    return [];
  }
}

// ISR: Revalidate every hour
export const revalidate = 3600;
