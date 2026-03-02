'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import Link from 'next/link';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setChecking(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <html lang="en">
      <body>
        {!checking && user && (
          <nav className="w-full bg-slate-900 text-white px-6 py-4 flex justify-end gap-6">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/curiosity/add">Add</Link>
            <Link href="/curiosity/vault">Vault</Link>
          </nav>
        )}

        {children}
      </body>
    </html>
  );
}