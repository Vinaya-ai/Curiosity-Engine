'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        router.replace('/dashboard');
      }
    });
  
    return () => unsubscribe();
  }, [router]);
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
    <div className="min-h-screen flex items-center justify-center px-6 bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">

        {/* Brand Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
            🧠 Curiosity Engine
          </h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            A structured way to manage your curiosity.
          </p>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleEmailSignUp}
              disabled={loading}
              className="w-1/2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-1/2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 transition"
          >
            {loading ? 'Opening Google...' : 'Continue with Google'}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}