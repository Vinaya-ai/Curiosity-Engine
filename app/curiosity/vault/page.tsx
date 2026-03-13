'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserItems, toggleItemCompletion, type Item } from '@/lib/items';

const CONTENT_ICONS: Record<string, string> = {
  video: '▶',
  article: '📄',
  podcast: '🎙',
  book: '📚',
  project: '🔧',
  other: '✦',
};

const ENERGY_COLORS: Record<string, string> = {
  low: '#34d399',
  medium: '#fbbf24',
  high: '#f87171',
};

const ENERGY_BG: Record<string, string> = {
  low: 'rgba(52,211,153,0.12)',
  medium: 'rgba(251,191,36,0.12)',
  high: 'rgba(248,113,113,0.12)',
};

type FilterType = 'all' | 'pending' | 'done';

export default function VaultPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [energyFilter, setEnergyFilter] = useState<string>('all');

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
      setError(err instanceof Error ? err.message : 'Failed to fetch items.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompletion = async (itemId: string, currentCompleted: boolean) => {
    if (!user) return;
    const newCompleted = !currentCompleted;
    try {
      await toggleItemCompletion(user.uid, itemId, newCompleted);
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, completed: newCompleted } : item
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item.');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesStatus =
      filter === 'all' ? true :
      filter === 'pending' ? !item.completed :
      item.completed;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesEnergy = energyFilter === 'all' || (item.energyLevel || '').toLowerCase() === energyFilter;
    return matchesStatus && matchesSearch && matchesEnergy;
  });

  const pending = items.filter(i => !i.completed);
  const done = items.filter(i => i.completed);

  if (loading) {
    return (
      <>
        <style>{`
          .vault-root { min-height: 100vh; background: #08090c; display: flex; align-items: center; justify-content: center; }
          .pulse { width: 40px; height: 40px; border-radius: 50%; background: rgba(124,58,237,0.4); animation: pulse 1.2s ease-in-out infinite; }
          @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.3);opacity:1} }
        `}</style>
        <div className="vault-root"><div className="pulse" /></div>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .vault-root {
          min-height: 100vh;
          background: #08090c;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .orb {
          position: fixed; border-radius: 50%;
          filter: blur(80px); pointer-events: none; z-index: 0;
        }
        .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #7c3aed, transparent); top: -150px; right: -100px; opacity: 0.1; }
        .orb-2 { width: 350px; height: 350px; background: radial-gradient(circle, #4f46e5, transparent); bottom: -80px; left: -80px; opacity: 0.08; }

        .vault-root::before {
          content: '';
          position: fixed; inset: 0;
          background-image: radial-gradient(circle, rgba(139,92,246,0.09) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none; z-index: 0;
        }

        /* Nav */
        .nav {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
        }
        .nav-brand {
          font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800;
          background: linear-gradient(135deg, #e2d9f3, #a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          cursor: pointer;
        }
        .nav-links { display: flex; gap: 4px; align-items: center; }
        .nav-link {
          padding: 6px 13px; border-radius: 7px; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.38); cursor: pointer; transition: all 0.2s;
          border: none; background: transparent; font-family: 'DM Sans', sans-serif;
        }
        .nav-link:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.05); }
        .nav-link.active { color: #a78bfa; background: rgba(124,58,237,0.12); }

        /* Main */
        .main {
          position: relative; z-index: 1;
          max-width: 860px; margin: 0 auto;
          padding: 44px 32px;
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* Header row */
        .page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; gap: 16px; }
        .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: rgba(255,255,255,0.9); letter-spacing: -0.4px; }
        .page-subtitle { font-size: 13px; color: rgba(255,255,255,0.3); margin-top: 4px; }

        .add-btn {
          padding: 10px 18px; border-radius: 10px;
          background: linear-gradient(135deg, rgba(124,58,237,0.9), rgba(99,102,241,0.9));
          color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          border: none; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 7px; flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(124,58,237,0.3);
        }
        .add-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.45); }

        /* Filters */
        .filters-row { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }

        .search-box {
          flex: 1; min-width: 180px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 10px 14px;
          font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.8);
          outline: none; transition: all 0.2s;
        }
        .search-box::placeholder { color: rgba(255,255,255,0.22); }
        .search-box:focus { border-color: rgba(124,58,237,0.5); background: rgba(124,58,237,0.06); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }

        .filter-group { display: flex; gap: 4px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 3px; }
        .filter-btn {
          padding: 7px 13px; border-radius: 7px; font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; border: none;
          background: transparent; color: rgba(255,255,255,0.35);
          font-family: 'DM Sans', sans-serif;
        }
        .filter-btn.active { background: rgba(124,58,237,0.8); color: #fff; box-shadow: 0 2px 8px rgba(124,58,237,0.35); }

        .energy-select {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 10px 12px; font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: rgba(255,255,255,0.55); outline: none; cursor: pointer;
        }
        .energy-select option { background: #1a1a2e; }

        /* Stats strip */
        .stats-strip { display: flex; gap: 20px; margin-bottom: 28px; }
        .stat-pill {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 14px; border-radius: 8px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          font-size: 12px; color: rgba(255,255,255,0.45);
        }
        .stat-pill-num { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; }

        /* Items */
        .items-section { margin-bottom: 32px; }
        .section-label {
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3);
          letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .section-label::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.05); }

        .item-card {
          display: flex; align-items: flex-start; gap: 14px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px; padding: 16px 18px; margin-bottom: 10px;
          transition: all 0.2s; cursor: default;
          animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .item-card:hover { background: rgba(255,255,255,0.04); border-color: rgba(124,58,237,0.18); }
        .item-card.completed { opacity: 0.5; }
        .item-card.completed:hover { opacity: 0.7; }

        /* Custom checkbox */
        .check-wrap { position: relative; width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px; }
        .check-wrap input { position: absolute; opacity: 0; width: 0; height: 0; }
        .check-box {
          width: 20px; height: 20px; border-radius: 6px;
          border: 1.5px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.04);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; cursor: pointer;
        }
        .check-box.checked { background: rgba(124,58,237,0.8); border-color: rgba(124,58,237,0.8); }
        .check-mark { color: #fff; font-size: 11px; font-weight: 700; opacity: 0; transition: opacity 0.15s; }
        .check-box.checked .check-mark { opacity: 1; }

        .content-icon {
          width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
          background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.18);
          display: flex; align-items: center; justify-content: center; font-size: 15px;
        }

        .item-body { flex: 1; min-width: 0; }
        .item-title {
          font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85);
          margin-bottom: 5px; transition: color 0.2s;
        }
        .item-title.done { color: rgba(255,255,255,0.3); text-decoration: line-through; }

        .item-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .meta-tag {
          padding: 3px 9px; border-radius: 5px; font-size: 11px; font-weight: 500;
        }
        .item-link {
          font-size: 11px; color: #818cf8; text-decoration: none; display: flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 5px; background: rgba(129,140,248,0.1); border: 1px solid rgba(129,140,248,0.15);
          transition: all 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;
        }
        .item-link:hover { background: rgba(129,140,248,0.2); }

        .time-tag {
          font-size: 11px; color: rgba(255,255,255,0.3);
          display: flex; align-items: center; gap: 3px;
        }

        /* Empty state */
        .empty {
          text-align: center; padding: 60px 20px;
          color: rgba(255,255,255,0.2); font-size: 14px;
        }
        .empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.3; }

        /* Error */
        .error-msg {
          margin-bottom: 16px; padding: 12px 16px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; font-size: 13px; color: #fca5a5;
        }

        @media (max-width: 600px) {
          .main { padding: 28px 16px; }
          .nav { padding: 16px 20px; }
          .page-header { flex-direction: column; align-items: flex-start; }
          .filters-row { gap: 8px; }
        }
      `}</style>

      <div className="vault-root">
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        {/* Nav */}
        <nav className="nav">
          <div className="nav-brand" onClick={() => router.push('/dashboard')}>🧠 Curiosity Engine</div>
          <div className="nav-links">
            <button className="nav-link" onClick={() => router.push('/dashboard')}>Dashboard</button>
            <button className="nav-link" onClick={() => router.push('/curiosity/add')}>Add</button>
            <button className="nav-link active">Vault</button>
          </div>
        </nav>

        <main className="main">
          {/* Header */}
          <div className="page-header">
            <div>
              <div className="page-title">🗄 Vault</div>
              <div className="page-subtitle">Everything you've saved to explore.</div>
            </div>
            <button className="add-btn" onClick={() => router.push('/curiosity/add')}>
              + Add Curiosity
            </button>
          </div>

          {error && <div className="error-msg" role="alert">{error}</div>}

          {/* Stats strip */}
          <div className="stats-strip">
            <div className="stat-pill">
              <span className="stat-pill-num" style={{color: '#a78bfa'}}>{items.length}</span>
              <span>total</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-num" style={{color: '#fbbf24'}}>{pending.length}</span>
              <span>pending</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-num" style={{color: '#34d399'}}>{done.length}</span>
              <span>done</span>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-row">
            <input
              className="search-box"
              type="text"
              placeholder="Search your vault..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="filter-group">
              {(['all', 'pending', 'done'] as FilterType[]).map(f => (
                <button
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <select
              className="energy-select"
              value={energyFilter}
              onChange={e => setEnergyFilter(e.target.value)}
            >
              <option value="all">All energy</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Items */}
          {filteredItems.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🧠</div>
              <div>{items.length === 0 ? 'Your vault is empty.' : 'No items match your filters.'}</div>
              {items.length === 0 && (
                <div style={{marginTop: 8, fontSize: 13}}>
                  <span style={{color: '#a78bfa', cursor: 'pointer'}} onClick={() => router.push('/curiosity/add')}>
                    Add your first curiosity →
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Pending section */}
              {filteredItems.filter(i => !i.completed).length > 0 && (
                <div className="items-section">
                  {filter === 'all' && <div className="section-label">Pending</div>}
                  {filteredItems.filter(i => !i.completed).map((item, idx) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      idx={idx}
                      onToggle={handleToggleCompletion}
                    />
                  ))}
                </div>
              )}

              {/* Done section */}
              {filteredItems.filter(i => i.completed).length > 0 && (
                <div className="items-section">
                  {filter === 'all' && <div className="section-label">Completed</div>}
                  {filteredItems.filter(i => i.completed).map((item, idx) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      idx={idx}
                      onToggle={handleToggleCompletion}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

function ItemCard({
  item,
  idx,
  onToggle,
}: {
  item: Item;
  idx: number;
  onToggle: (id: string, completed: boolean) => void;
}) {
  const energy = (item.energyLevel || 'medium').toLowerCase();
  const contentType = (item.contentType || 'other').toLowerCase();
  const icon = CONTENT_ICONS[contentType] || '✦';
  const energyColor = ENERGY_COLORS[energy] || '#fbbf24';
  const energyBg = ENERGY_BG[energy] || 'rgba(251,191,36,0.12)';

  return (
    <div
      className={`item-card ${item.completed ? 'completed' : ''}`}
      style={{ animationDelay: `${idx * 0.04}s` }}
    >
      {/* Checkbox */}
      <div className="check-wrap" onClick={() => onToggle(item.id, item.completed)}>
        <div className={`check-box ${item.completed ? 'checked' : ''}`}>
          <span className="check-mark">✓</span>
        </div>
      </div>

      {/* Content icon */}
      <div className="content-icon">{icon}</div>

      {/* Body */}
      <div className="item-body">
        <div className={`item-title ${item.completed ? 'done' : ''}`}>{item.title}</div>
        <div className="item-meta">
          {/* Energy badge */}
          <span
            className="meta-tag"
            style={{ color: energyColor, background: energyBg, border: `1px solid ${energyColor}22` }}
          >
            {energy} energy
          </span>

          {/* Content type */}
          <span className="meta-tag" style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {contentType}
          </span>

          {/* Time */}
          {item.timeRequired && (
            <span className="time-tag">⏱ {item.timeRequired}m</span>
          )}

          {/* Link */}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="item-link"
              onClick={e => e.stopPropagation()}
            >
              ↗ Open link
            </a>
          )}
        </div>
      </div>
    </div>
  );
}