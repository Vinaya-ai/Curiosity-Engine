'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { addItem, type ContentType } from '@/lib/items';

export default function AddCuriosityPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [timeRequired, setTimeRequired] = useState<number>(15);
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [engagementType, setEngagementType] = useState<'passive' | 'active' | 'deep'>('active');
  const [contentType, setContentType] = useState<ContentType>('other');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace('/login');
      } else {
        setUser(currentUser);
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [router]);

  if (!authChecked) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!user) {
      setError('You must be logged in to add an item.');
      return;
    }

    setLoading(true);

    try {
      await addItem(user.uid, {
        title: title.trim(),
        link: link.trim() || undefined,
        timeRequired,
        energyLevel,
        engagementType,
        contentType,
      });

      setTitle('');
      setLink('');
      setTimeRequired(15);
      setEnergyLevel('medium');
      setEngagementType('active');
      setContentType('other');
      setSuccess('Item added.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add item.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoTag = async () => {
    if (!title.trim()) {
      setError('Please enter a title first.');
      return;
    }

    setError(null);
    setAiLoading(true);

    try {
      const response = await fetch('/api/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          link,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to get AI tags (${response.status})`
        );
      }

      const data = await response.json();

      if (data && typeof data === 'object') {
        if (typeof data.timeRequired === 'number') {
          setTimeRequired(data.timeRequired);
        }

        if (
          data.energyLevel === 'low' ||
          data.energyLevel === 'medium' ||
          data.energyLevel === 'high'
        ) {
          setEnergyLevel(data.energyLevel);
        }

        if (
          data.engagementType === 'passive' ||
          data.engagementType === 'active' ||
          data.engagementType === 'deep'
        ) {
          setEngagementType(data.engagementType);
        }

        const validContentTypes: ContentType[] = [
          'video',
          'movie',
          'pdf',
          'podcast',
          'project',
          'article',
          'other',
        ];

        if (data.contentType && validContentTypes.includes(data.contentType)) {
          setContentType(data.contentType);
        }
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to auto-tag item.';
      setError(message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-4 text-gray-900">
          Add Curiosity
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link (optional)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleAutoTag}
            disabled={aiLoading || !title.trim()}
            className="w-full rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {aiLoading ? 'Tagging with AI...' : 'Auto Tag with AI'}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Adding...' : 'Add Item'}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        {success && (
          <p className="mt-3 text-sm text-green-600">{success}</p>
        )}
      </div>
    </div>
  );
}