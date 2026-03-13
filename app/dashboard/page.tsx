'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useTheme } from '@/lib/theme';

interface Stats { total: number; completed: number; pending: number; }
interface Item { id: string; title: string; contentType: string; energyLevel: string; completed: boolean; createdAt: any; }

const ENERGY_COLOR: Record<string, string> = {
  low: 'var(--mint)', medium: 'var(--rose)', high: 'var(--terra)',
};
const TYPE_ICON: Record<string, string> = {
  article: '📄', video: '🎬', podcast: '🎧', book: '📚', course: '🎓', other: '🔗',
};

export default function DashboardPage() {
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, pending: 0 });
  const [recent, setRecent] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace('/login'); return; }
      setUser(u);
      try {
        const snap = await getDocs(collection(db, 'users', u.uid, 'items'));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Item[];
        const completed = items.filter(i => i.completed).length;
        setStats({ total: items.length, completed, pending: items.length - completed });
        setRecent(items.slice(0, 4));
      } catch (e) { console.error(e); }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="ce-nav">
        <span className="ce-brand">Curiosity <em>Engine</em></span>
        <div className="ce-nav-links">
          <span className="ce-nav-link active">Dashboard</span>
          <a href="/curiosity/vault" className="ce-nav-link">Vault</a>
          <a href="/curiosity/add" className="ce-nav-link">+ Add</a>
          <a href="/weekend" className="ce-nav-link">Weekend</a>
          <button className="ce-theme-btn" onClick={toggle}>{dark ? '☀️' : '🌙'}</button>
          <button className="ce-nav-link" onClick={() => signOut(auth).then(() => router.push('/login'))} style={{ color: 'var(--text-3)' }}>Out</button>
        </div>
      </nav>

      <div className="ce-page">
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Welcome back</div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 34, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
            Hey, <em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>{firstName}</em> 👋
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, marginTop: 8 }}>Here's what's waiting for your curiosity.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Total', value: stats.total, color: 'var(--blue)', bg: 'var(--blue-light)' },
            { label: 'Pending', value: stats.pending, color: 'var(--rose)', bg: 'var(--rose-light)' },
            { label: 'Done', value: stats.completed, color: 'var(--mint)', bg: 'var(--mint-light)' },
          ].map(s => (
            <div key={s.label} className="ce-card" style={{ padding: '22px 20px', borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 32, fontFamily: "'Fraunces',serif", fontWeight: 700, color: s.color, lineHeight: 1 }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Recently Added</h2>
            <a href="/curiosity/vault" style={{ fontSize: 13, color: 'var(--rose)', fontWeight: 600, textDecoration: 'none' }}>View all →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="ce-card" style={{ padding: '16px 18px', opacity: 0.5 }}>
                  <div style={{ height: 14, background: 'var(--border)', borderRadius: 6, width: '60%' }} />
                </div>
              ))
            ) : recent.length === 0 ? (
              <div className="ce-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>
                Nothing yet. <a href="/curiosity/add" style={{ color: 'var(--rose)', fontWeight: 600 }}>Add your first curiosity →</a>
              </div>
            ) : recent.map(item => (
              <div key={item.id} className="ce-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 20 }}>{TYPE_ICON[item.contentType] || '🔗'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{item.contentType}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ENERGY_COLOR[item.energyLevel] || 'var(--border)', flexShrink: 0 }} />
                {item.completed && <span style={{ fontSize: 11, color: 'var(--mint)', fontWeight: 600 }}>Done</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <a href="/curiosity/add" style={{ textDecoration: 'none' }}>
            <div className="ce-card" style={{ padding: '20px', cursor: 'pointer', transition: 'box-shadow 0.15s', borderLeft: '3px solid var(--rose)' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow)')}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>✨</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Add Curiosity</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Capture something new</div>
            </div>
          </a>
          <a href="/weekend" style={{ textDecoration: 'none' }}>
            <div className="ce-card" style={{ padding: '20px', cursor: 'pointer', transition: 'box-shadow 0.15s', borderLeft: '3px solid var(--blue)' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow)')}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>🎲</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Weekend Mode</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Pick something to explore</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}