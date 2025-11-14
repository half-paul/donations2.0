/**
 * Tax Receipts Page
 *
 * Allows donors to view and download their tax receipts.
 * Receipts are organized by tax year.
 */

import { AuthGuard } from '@/components/auth/AuthGuard';
import Link from 'next/link';

export const metadata = {
  title: 'Tax Receipts | My Account',
  description: 'Download your tax receipts for deductible donations.',
};

export default function ReceiptsPage() {
  const currentYear = new Date().getFullYear();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/account" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              ← Back to Account
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Tax Receipts</h1>
            <p className="text-gray-600 mt-2">
              Download receipts for your tax-deductible donations
            </p>
          </div>

          {/* Receipts by Year */}
          <div className="space-y-6">
            {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
              <div key={year} className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{year} Tax Year</h2>

                {/* Empty State */}
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="mx-auto h-10 w-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">No receipts for {year}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Information */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900">About Tax Receipts</h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Receipts are issued immediately for one-time donations</li>
              <li>Annual receipts are issued in January for recurring donations</li>
              <li>Keep these receipts for your tax records</li>
              <li>Contact support if you need a corrected receipt</li>
            </ul>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
