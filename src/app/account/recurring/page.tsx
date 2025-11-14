/**
 * Recurring Donations Page
 *
 * Allows donors to view and manage their recurring donation plans.
 * Can pause, resume, update, or cancel subscriptions.
 */

import { AuthGuard } from '@/components/auth/AuthGuard';
import Link from 'next/link';

export const metadata = {
  title: 'Recurring Donations | My Account',
  description: 'Manage your recurring donation subscriptions.',
};

export default function RecurringPlansPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/account" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              ← Back to Account
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Recurring Donations</h1>
            <p className="text-gray-600 mt-2">
              Manage your monthly, quarterly, and annual giving plans
            </p>
          </div>

          {/* Active Plans */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Plans</h2>

            {/* Empty State */}
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No recurring donations</h3>
              <p className="text-gray-600 mt-2">
                You don't have any active recurring donation plans.
              </p>
              <div className="mt-6">
                <Link
                  href="/donate"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Set Up Recurring Donation
                </Link>
              </div>
            </div>
          </div>

          {/* Paused Plans */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Paused Plans</h2>
            <p className="text-gray-500 text-sm">No paused plans</p>
          </div>

          {/* Cancelled Plans */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cancelled Plans</h2>
            <p className="text-gray-500 text-sm">No cancelled plans</p>
          </div>

          {/* Information */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900">About Recurring Donations</h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>You can pause or cancel your recurring donation at any time</li>
              <li>Changes take effect after the current billing period</li>
              <li>You'll receive an email confirmation for all changes</li>
              <li>Tax receipts are issued annually for recurring donations</li>
            </ul>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
