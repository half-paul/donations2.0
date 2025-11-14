/**
 * SignOutButton Component
 *
 * Triggers the NextAuth.js sign-out flow with optional confirmation.
 */

'use client';

import { signOut } from 'next-auth/react';
import { useState } from 'react';

interface SignOutButtonProps {
  callbackUrl?: string;
  showConfirmation?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function SignOutButton({
  callbackUrl = '/',
  showConfirmation = false,
  className = '',
  children,
}: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSignOut = async () => {
    if (showConfirmation && !showModal) {
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      await signOut({ callbackUrl });
    } catch (error) {
      console.error('Sign-out error:', error);
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <button
        onClick={handleSignOut}
        disabled={loading}
        className={`px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? 'Signing out...' : children || 'Sign Out'}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Confirm Sign Out</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
