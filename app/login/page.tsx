'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      router.push('/dashboard');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to sign in with email.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    setError(null);
    setLoading(true);

    try {
      await signUpWithEmail(email, password);
      router.push('/dashboard');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to sign up with email.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to sign in with Google.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-4 text-gray-900">Login</h1>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleEmailSignUp}
              disabled={loading}
              className="w-1/2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? 'Opening Google...' : 'Continue with Google'}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

