/**
 * SignInButton Component
 *
 * Triggers the NextAuth.js sign-in flow.
 * Supports multiple authentication providers.
 */

'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

interface SignInButtonProps {
  provider?: 'google' | 'github' | 'email';
  callbackUrl?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SignInButton({
  provider = 'google',
  callbackUrl = '/',
  className = '',
  children,
}: SignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error('Sign-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? 'Signing in...' : children || 'Sign In'}
    </button>
  );
}

/**
 * SignInWithEmail Component
 *
 * Provides an email input for magic link authentication.
 */
interface SignInWithEmailProps {
  callbackUrl?: string;
  className?: string;
}

export function SignInWithEmail({
  callbackUrl = '/',
  className = '',
}: SignInWithEmailProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('email', {
        email,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 rounded ${className}`}>
        <h3 className="font-semibold text-green-900">Check your email</h3>
        <p className="text-sm text-green-700 mt-1">
          We've sent you a sign-in link. Please check your email and click the link to continue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="you@example.com"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Sign in with Email'}
        </button>
      </div>
    </form>
  );
}
