/**
 * Account Settings Page
 *
 * Allows donors to update their contact information and communication preferences.
 */

import { AuthGuard } from '@/components/auth/AuthGuard';
import Link from 'next/link';

export const metadata = {
  title: 'Account Settings | My Account',
  description: 'Update your contact information and preferences.',
};

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/account" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              ← Back to Account
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Account Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your contact information and preferences
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Communication Preferences */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Communication Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="emailMarketing"
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="emailMarketing" className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Email Updates</div>
                  <div className="text-sm text-gray-600">
                    Receive updates about our programs and impact
                  </div>
                </label>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="smsMarketing"
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="smsMarketing" className="ml-3">
                  <div className="text-sm font-medium text-gray-900">SMS Notifications</div>
                  <div className="text-sm text-gray-600">
                    Get text messages about urgent campaigns
                  </div>
                </label>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="receiptNotifications"
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  defaultChecked
                />
                <label htmlFor="receiptNotifications" className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Receipt Notifications</div>
                  <div className="text-sm text-gray-600">
                    Receive email notifications when tax receipts are available
                  </div>
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update Preferences
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Data */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy & Data</h2>
            <div className="space-y-4">
              <div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Download My Data
                </button>
                <p className="text-sm text-gray-600 mt-1">
                  Request a copy of all your personal data (GDPR/CCPA)
                </p>
              </div>

              <div>
                <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                  Delete My Account
                </button>
                <p className="text-sm text-gray-600 mt-1">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
