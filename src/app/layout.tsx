/**
 * Root Layout
 *
 * Top-level layout for the entire application.
 * Configures fonts, providers, and global structure.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TRPCReactProvider } from '~/trpc/react';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Raisin Next',
    default: 'Raisin Next - Modern Fundraising Platform',
  },
  description:
    'Support causes you care about with secure, accessible online donations.',
  keywords: ['donation', 'fundraising', 'nonprofit', 'charity', 'giving'],
  authors: [{ name: 'Raisin Software' }],
  creator: 'Raisin Software',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Raisin Next',
  },
  twitter: {
    card: 'summary_large_image',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
