'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserItems, toggleItemCompletion, type Item } from '@/lib/items';

export default function VaultPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchItems(currentUser.uid);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchItems = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const userItems = await getUserItems(userId);
      setItems(userItems);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch items.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompletion = async (itemId: string, currentCompleted: boolean) => {
    if (!user) return;

    const newCompleted = !currentCompleted;

    try {
      await toggleItemCompletion(user.uid, itemId, newCompleted);
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, completed: newCompleted } : item
        )
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update item.';
      setError(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-4 text-gray-900">Vault</h1>

        {error && (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-gray-600">No items yet</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="border border-gray-200 rounded p-3 hover:bg-gray-50 flex items-start gap-3"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleCompletion(item.id, item.completed)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className={`font-medium ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {item.title}
                  </div>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {item.link}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
