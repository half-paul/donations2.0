/**
 * Account Dashboard Page
 *
 * Authenticated donor self-service portal.
 * Shows donation history, recurring plans, and quick actions.
 */

import { AuthGuard } from '@/components/auth/AuthGuard';
import { SignOutButton } from '@/components/auth/SignOutButton';
import Link from 'next/link';

export const metadata = {
  title: 'My Account | Donation Platform',
  description: 'Manage your donations, recurring plans, and account settings.',
};

export default function AccountPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
                <p className="text-gray-600 mt-1">
                  Manage your donations and account settings
                </p>
              </div>
              <SignOutButton className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm font-medium text-gray-600">Total Donated</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">$0.00</div>
              <div className="text-sm text-gray-500 mt-1">All time</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm font-medium text-gray-600">Recurring Plans</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">0</div>
              <div className="text-sm text-gray-500 mt-1">Active subscriptions</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm font-medium text-gray-600">Last Donation</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">-</div>
              <div className="text-sm text-gray-500 mt-1">Never</div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/account/receipts"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900">Tax Receipts</h2>
              <p className="text-gray-600 mt-2">
                Download your tax receipts for deductible donations
              </p>
              <div className="mt-4 text-blue-600 font-medium">View Receipts →</div>
            </Link>

            <Link
              href="/account/recurring"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900">Recurring Donations</h2>
              <p className="text-gray-600 mt-2">
                Manage your monthly, quarterly, or annual giving plans
              </p>
              <div className="mt-4 text-blue-600 font-medium">Manage Plans →</div>
            </Link>

            <Link
              href="/account/settings"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
              <p className="text-gray-600 mt-2">
                Update your contact information and communication preferences
              </p>
              <div className="mt-4 text-blue-600 font-medium">Edit Settings →</div>
            </Link>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900">Donation History</h2>
              <p className="text-gray-600 mt-2">
                View all your past donations and their impact
              </p>
              <div className="mt-4">
                <p className="text-gray-500 text-sm">No donations yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
