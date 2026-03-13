'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserItems, toggleItemCompletion } from '@/lib/items';
import { useTheme } from '@/lib/theme';

interface Item {
  id: string; title: string; link?: string;
  contentType: string; energyLevel: string; engagementType: string;
  timeRequired: number; completed: boolean; aiTagged?: boolean;
}

const TYPE_ICON: Record<string, string> = { article: '📄', video: '🎬', podcast: '🎧', book: '📚', course: '🎓', other: '🔗' };
const ENERGY_COLOR: Record<string, string> = { low: 'var(--mint)', medium: 'var(--rose)', high: 'var(--terra)' };
const ENERGY_BG: Record<string, string> = { low: 'var(--mint-light)', medium: 'var(--rose-light)', high: 'var(--terra-light)' };

export default function VaultPage() {
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [energyFilter, setEnergyFilter] = useState<string>("all");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/login"); return; }
      setUserId(u.uid);
      try {
        const data = await getUserItems(u.uid);
        setItems(data as Item[]);
      } catch (e) { console.error(e); }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (filter === 'pending' && item.completed) return false;
      if (filter === 'done' && !item.completed) return false;
      if (energyFilter !== 'all' && item.energyLevel !== energyFilter) return false;
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, filter, energyFilter, search]);

  const pending = filtered.filter(i => !i.completed);
  const done = filtered.filter(i => i.completed);

  const handleToggle = async (id: string, current: boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, completed: !current } : i));
    try { await toggleItemCompletion(userId, id, !current); }
    catch (e) { setItems(prev => prev.map(i => i.id === id ? { ...i, completed: current } : i)); }
  };

  const ItemCard = ({ item }: { item: Item }) => (
    <div className="ce-card" style={{ padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'box-shadow 0.15s', opacity: item.completed ? 0.6 : 1 }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow)')}>
      {/* Checkbox */}
      <button onClick={() => handleToggle(item.id, item.completed)} style={{
        width: 20, height: 20, borderRadius: 6, border: '2px solid',
        borderColor: item.completed ? 'var(--mint)' : 'var(--border)',
        background: item.completed ? 'var(--mint)' : 'transparent',
        cursor: 'pointer', flexShrink: 0, marginTop: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {item.completed && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
      </button>

      <span style={{ fontSize: 20, flexShrink: 0 }}>{TYPE_ICON[item.contentType] || '🔗'}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6, textDecoration: item.completed ? 'line-through' : 'none' }}>
          {item.title}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: ENERGY_BG[item.energyLevel], color: ENERGY_COLOR[item.energyLevel] }}>
            {item.energyLevel}
          </span>
          <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500, background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            {item.engagementType}
          </span>
          <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500, background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            ⏱ {item.timeRequired}m
          </span>
          {item.aiTagged && <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--blue-light)', color: 'var(--blue)', border: '1px solid var(--blue-border)' }}>🤖 AI</span>}
        </div>
      </div>

      {item.link && (
        <a href={item.link} target="_blank" rel="noopener noreferrer" style={{
          padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
          fontSize: 12, fontWeight: 600, color: 'var(--rose)', textDecoration: 'none',
          background: 'var(--rose-light)', flexShrink: 0, transition: 'all 0.15s',
        }}>Open →</a>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav className="ce-nav">
        <a href="/dashboard" className="ce-brand">Curiosity <em>Engine</em></a>
        <div className="ce-nav-links">
          <a href="/dashboard" className="ce-nav-link">Dashboard</a>
          <span className="ce-nav-link active">Vault</span>
          <a href="/curiosity/add" className="ce-nav-link">+ Add</a>
          <a href="/weekend" className="ce-nav-link">Weekend</a>
          <button className="ce-theme-btn" onClick={toggle}>{dark ? '☀️' : '🌙'}</button>
        </div>
      </nav>

      <div className="ce-page">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>
              Your <em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>Vault</em>
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>{items.length} curiosities saved</p>
          </div>
          <a href="/curiosity/add" className="ce-btn ce-btn-primary" style={{ width: 'auto', padding: '10px 18px', textDecoration: 'none', fontSize: 13 }}>+ Add New</a>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <input className="ce-input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search..." style={{ flex: 1, minWidth: 180 }} />
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 3, gap: 2 }}>
            {(['all', 'pending', 'done'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
                fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: filter === f ? 'var(--rose)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-3)', transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}>{f}</button>
            ))}
          </div>
          <select value={energyFilter} onChange={e => setEnergyFilter(e.target.value)} style={{
            padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
            background: 'var(--bg-card)', color: 'var(--text-2)', fontFamily: "'DM Sans',sans-serif",
            fontSize: 12, cursor: 'pointer', outline: 'none',
          }}>
            <option value="all">All energy</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="ce-card" style={{ padding: '20px', opacity: 0.4, height: 72 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="ce-card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>Nothing here yet</div>
            <a href="/curiosity/add" style={{ color: 'var(--rose)', fontWeight: 600, textDecoration: 'none' }}>Add your first curiosity →</a>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                  Pending · {pending.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pending.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              </div>
            )}
            {done.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                  Completed · {done.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {done.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}