'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useTheme } from '@/lib/theme';

interface Stats { total: number; completed: number; pending: number; }
interface Item { id: string; title: string; contentType: string; energyLevel: string; completed: boolean; }

const ENERGY_COLOR: Record<string, string> = { low: 'var(--mint)', medium: 'var(--rose)', high: 'var(--terra)' };
const TYPE_ICON: Record<string, string> = { article: '📄', video: '🎬', podcast: '🎧', pdf: '📑', project: '🛠', movie: '🎥', other: '🔗' };

export default function DashboardPage() {
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, pending: 0 });
  const [recent, setRecent] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

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
      } catch (e) { 
        console.error(e); }
        setFetchError('Unable to load your data. Please check your login or try again.');
      });
    return () => unsub();
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="ce-nav">
        <a href="/dashboard" className="ce-brand">Curiosity <em>Engine</em></a>
        {/* Desktop links */}
        <div className="ce-nav-links ce-nav-mobile-hide">
          <span className="ce-nav-link active">Dashboard</span>
          <a href="/curiosity/vault" className="ce-nav-link">Vault</a>
          <a href="/curiosity/add" className="ce-nav-link">+ Add</a>
          <a href="/weekend" className="ce-nav-link">Weekend</a>
          <button className="ce-theme-btn" onClick={toggle}>{dark ? '☀️' : '🌙'}</button>
          <button className="ce-nav-link" onClick={() => signOut(auth).then(() => router.push('/login'))} style={{ color: 'var(--text-3)' }}>Out</button>
        </div>
        {/* Mobile icons */}
        <div className="ce-nav-hamburger">
          <button className="ce-theme-btn" onClick={toggle}>{dark ? '☀️' : '🌙'}</button>
          <button className="ce-theme-btn" onClick={() => setMenuOpen(o => !o)}>☰</button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[['Dashboard','/dashboard'],['Vault','/curiosity/vault'],['+ Add','/curiosity/add'],['Weekend','/weekend']].map(([label, href]) => (
            <a key={href} href={href} className="ce-nav-link" style={{ display: 'block', padding: '10px 12px' }} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <button className="ce-nav-link" onClick={() => signOut(auth).then(() => router.push('/login'))} style={{ textAlign: 'left', color: 'var(--text-3)', padding: '10px 12px' }}>Sign Out</button>
        </div>
      )}

      <div className="ce-page">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Welcome back</div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(26px, 6vw, 34px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
          Hey, <em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>{user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'}</em> 👋
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, marginTop: 8 }}>Here's what's waiting for you.</p>
        </div>

        {/* Stats — stays 3-col even on mobile, just smaller */}
        <div className="ce-grid-3" style={{ marginBottom: 32 }}>
          {[
            { label: 'Total',   value: stats.total,     color: 'var(--blue)' },
            { label: 'Pending', value: stats.pending,   color: 'var(--rose)' },
            { label: 'Done',    value: stats.completed, color: 'var(--mint)' },
          ].map(s => (
            <div key={s.label} className="ce-card" style={{ padding: 'clamp(14px,3vw,22px) clamp(12px,3vw,20px)', borderTop: `3px solid ${s.color}` }}>
              <div className="ce-stat-num" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</div>
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
            
            ) : fetchError ? (
              <div className="ce-error">{fetchError}<div>
            ) : recent.length === 0 ? (
              <div className="ce-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>
                Nothing yet. <a href="/curiosity/add" style={{ color: 'var(--rose)', fontWeight: 600 }}>Add your first →</a>
              </div>
            ) : recent.map(item => (
              <div key={item.id} className="ce-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{TYPE_ICON[item.contentType] || '🔗'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{item.contentType}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ENERGY_COLOR[item.energyLevel] || 'var(--border)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions — 2-col desktop, 1-col mobile */}
        <div className="ce-grid-2 ce-quick-actions">
          <a href="/curiosity/add" style={{ textDecoration: 'none' }}>
            <div className="ce-card" style={{ padding: '20px', cursor: 'pointer', borderLeft: '3px solid var(--rose)' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>✨</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Add Curiosity</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Capture something new</div>
            </div>
          </a>
          <a href="/weekend" style={{ textDecoration: 'none' }}>
            <div className="ce-card" style={{ padding: '20px', cursor: 'pointer', borderLeft: '3px solid var(--blue)' }}>
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