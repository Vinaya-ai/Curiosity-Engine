'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { signOutUser } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    setError(null);
    setLoading(true);

    try {
      await signOutUser();
      router.push('/login');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to sign out.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
  </div>
  );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
        Dashboard
      </h1>

      <p className="text-sm text-gray-500 mt-2 mb-8">
        You are logged in.
      </p>
        <button
        type="button"
        onClick={() => router.push('/weekend')}
        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-3 text-sm font-medium text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
        Weekend Plan
        </button>


        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60"
        >
          {loading ? 'Signing out...' : 'Sign Out'}
          </button>

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
