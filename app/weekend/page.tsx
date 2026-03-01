'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserItems, toggleItemCompletion } from '@/lib/items';
import { selectWeekendItem } from '@/lib/weekend';

type SelectedItem = {
  id: string;
  title: string;
  link?: string;
};

export default function WeekendPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [availableTime, setAvailableTime] = useState<string>('30');
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Surprise mode
  const handleSurprise = async () => {
    if (!user) return;

    setError(null);
    setPicking(true);

    try {
      const items = await getUserItems(user.uid);
      const incompleteItems = items.filter(
        (item: any) => item.completed === false
      );

      if (incompleteItems.length === 0) {
        setError('Nothing available right now.');
        return;
      }

      const randomItem =
        incompleteItems[Math.floor(Math.random() * incompleteItems.length)];

      setSelectedItem({
        id: randomItem.id,
        title: randomItem.title ?? 'Untitled',
        link: randomItem.link ?? undefined,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch items.';
      setError(message);
    } finally {
      setPicking(false);
    }
  };

  // Time mode
  const handlePick = async () => {
    if (!user) return;

    const minutes = Number(availableTime);
    if (!minutes || minutes <= 0) {
      setError('Please enter a valid time.');
      return;
    }

    setError(null);
    setPicking(true);

    try {
      const items = await getUserItems(user.uid);
      const picked = selectWeekendItem(items, minutes);

      if (picked) {
        setSelectedItem({
          id: picked.id,
          title: picked.title ?? 'Untitled',
          link: picked.link ?? undefined,
        });
      } else {
        setError(`Nothing fits in ${availableTime} minutes.`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch items.';
      setError(message);
    } finally {
      setPicking(false);
    }
  };

  const handleMarkDone = async () => {
    if (!user || !selectedItem) return;

    try {
      await toggleItemCompletion(user.uid, selectedItem.id, true);
      setSelectedItem(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update item.';
      setError(message);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="text-sm text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg">

        {!selectedItem ? (
          <>
            {/* ACTION SCREEN */}

            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight text-center">
              Weekend Plans
            </h1>

            <p className="text-sm text-gray-500 mt-3 mb-10 text-center">
              Let’s see what fits today.
            </p>

            <div className="flex justify-center gap-6 text-2xl text-gray-400 mb-8">
              <span>🎙️</span>
              <span>📺</span>
              <span>🎬</span>
              <span>📚</span>
              <span>🛠️</span>
            </div>

            <button
              type="button"
              onClick={handleSurprise}
              disabled={picking}
              className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-medium text-white hover:bg-purple-700 hover:-translate-y-0.5 transition-all duration-200 mb-6 disabled:opacity-50"
            >
              {picking ? 'Picking...' : 'Surprise Me'}
            </button>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="availableTime"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Available time (minutes)
                </label>
                <input
                  id="availableTime"
                  type="number"
                  min="1"
                  value={availableTime}
                  onChange={(e) => setAvailableTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handlePick}
                disabled={picking}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
              >
                {picking ? 'Picking...' : 'Pick Something'}
              </button>
            </div>

            {error && (
              <p className="mt-6 text-sm text-red-600 text-center">
                {error}
              </p>
            )}
          </>
        ) : (
          <>
            {/* RESULT SCREEN */}

            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight text-center">
              Your Pick
            </h1>

            <div className="mt-10 p-6 border border-gray-200 rounded-2xl bg-gray-50 text-center">
              <p className="text-lg font-medium text-gray-900">
                {selectedItem.title}
              </p>

              {selectedItem.link && (
                <a
                  href={selectedItem.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-3 block"
                >
                  Open link
                </a>
              )}

              <button
                type="button"
                onClick={handleMarkDone}
                className="mt-6 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50" 
              >
                Mark as Done
              </button>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
              >
                Choose something else
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}