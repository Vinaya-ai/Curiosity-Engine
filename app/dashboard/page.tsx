'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { signOutUser } from '@/lib/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    recentItems: [] as { title: string; contentType?: string; energyLevel?: string }[],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch curiosity stats from Firestore
        try {
          const q = query(
            collection(db, 'curiosities'),
            where('userId', '==', currentUser.uid)
          );
          const snapshot = await getDocs(q);
          const items = snapshot.docs.map(doc => doc.data());
          const completed = items.filter(i => i.completed).length;
          const recent = items
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
            .slice(0, 3);
          setStats({
            total: items.length,
            completed,
            pending: items.length - completed,
            recentItems: recent as typeof stats.recentItems,
          });
        } catch {
          // Stats unavailable — show zeros gracefully
        }
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
      setError(err instanceof Error ? err.message : 'Failed to sign out.');
      setLoading(false);
    }
  };

  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Explorer';

  const contentTypeIcon: Record<string, string> = {
    video: '▶',
    article: '📄',
    podcast: '🎙',
    book: '📚',
    project: '🔧',
    other: '✦',
  };

  const energyColor: Record<string, string> = {
    low: '#34d399',
    medium: '#fbbf24',
    high: '#f87171',
  };

  if (loading) {
    return (
      <>
        <style>{`
          .dash-root { min-height: 100vh; background: #08090c; display: flex; align-items: center; justify-content: center; }
          .pulse { width: 40px; height: 40px; border-radius: 50%; background: rgba(124,58,237,0.4); animation: pulse 1.2s ease-in-out infinite; }
          @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.3);opacity:1} }
        `}</style>
        <div className="dash-root"><div className="pulse" /></div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .dash-root {
          min-height: 100vh;
          background: #08090c;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #7c3aed, transparent); top: -150px; right: -100px; opacity: 0.12; }
        .orb-2 { width: 350px; height: 350px; background: radial-gradient(circle, #4f46e5, transparent); bottom: -80px; left: -80px; opacity: 0.1; }

        .dash-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, rgba(139,92,246,0.1) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          z-index: 0;
        }

        /* Nav */
        .nav {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
        }

        .nav-brand {
          font-family: 'Syne', sans-serif;
          font-size: 17px;
          font-weight: 800;
          background: linear-gradient(135deg, #e2d9f3, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links { display: flex; gap: 6px; align-items: center; }

        .nav-link {
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
        }
        .nav-link:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.05); }
        .nav-link.active { color: #a78bfa; background: rgba(124,58,237,0.12); }

        .nav-signout {
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.07);
          background: transparent;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-signout:hover { color: #f87171; border-color: rgba(248,113,113,0.25); background: rgba(248,113,113,0.06); }

        /* Main content */
        .main {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
          padding: 48px 32px;
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Greeting */
        .greeting { margin-bottom: 40px; }
        .greeting-sub { font-size: 13px; color: rgba(255,255,255,0.3); margin-bottom: 6px; letter-spacing: 0.5px; }
        .greeting-name {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: rgba(255,255,255,0.9);
          letter-spacing: -0.5px;
        }
        .greeting-name span {
          background: linear-gradient(135deg, #c4b5fd, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Stats grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s;
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.1s; }
        .stat-card:nth-child(3) { animation-delay: 0.15s; }
        .stat-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(124,58,237,0.2); }

        .stat-label { font-size: 12px; color: rgba(255,255,255,0.35); letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 10px; }
        .stat-value { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; color: rgba(255,255,255,0.9); }
        .stat-value.purple { color: #a78bfa; }
        .stat-value.green { color: #34d399; }
        .stat-value.amber { color: #fbbf24; }

        /* Bottom grid */
        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
        }

        /* Recent items */
        .section-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 24px;
          animation: fadeUp 0.5s 0.2s cubic-bezier(0.16,1,0.3,1) both;
        }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .recent-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .recent-item:last-child { border-bottom: none; padding-bottom: 0; }

        .recent-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          background: rgba(124,58,237,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
          border: 1px solid rgba(124,58,237,0.2);
        }

        .recent-title { font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 500; }
        .recent-meta { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 2px; }

        .energy-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-left: auto;
        }

        .empty-state {
          text-align: center;
          padding: 28px 0;
          color: rgba(255,255,255,0.2);
          font-size: 13px;
        }
        .empty-icon { font-size: 28px; margin-bottom: 10px; opacity: 0.4; }

        /* Actions */
        .actions-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: fadeUp 0.5s 0.25s cubic-bezier(0.16,1,0.3,1) both;
        }

        .action-btn {
          width: 100%;
          padding: 13px 16px;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 10px;
          letter-spacing: 0.1px;
        }

        .action-btn-primary {
          background: linear-gradient(135deg, rgba(124,58,237,0.9), rgba(99,102,241,0.9));
          color: #fff;
          box-shadow: 0 4px 16px rgba(124,58,237,0.3);
        }
        .action-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(124,58,237,0.45); }

        .action-btn-secondary {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .action-btn-secondary:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }

        .action-btn-weekend {
          background: rgba(251,191,36,0.1);
          color: #fbbf24;
          border: 1px solid rgba(251,191,36,0.2);
        }
        .action-btn-weekend:hover { background: rgba(251,191,36,0.16); }

        .action-icon { font-size: 16px; }
        .action-label { flex: 1; }
        .action-arrow { opacity: 0.4; font-size: 12px; margin-left: auto; }

        /* Error */
        .error-msg {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          font-size: 13px;
          color: #fca5a5;
        }

        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .bottom-grid { grid-template-columns: 1fr; }
          .main { padding: 32px 20px; }
          .nav { padding: 16px 20px; }
        }
      `}</style>

      <div className="dash-root">
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        {/* Nav */}
        <nav className="nav">
          <div className="nav-brand">🧠 Curiosity Engine</div>
          <div className="nav-links">
            <span className="nav-link active">Dashboard</span>
            <span className="nav-link" onClick={() => router.push('/curiosity/add')} style={{cursor:'pointer'}}>Add</span>
            <span className="nav-link" onClick={() => router.push('/curiosity/vault')} style={{cursor:'pointer'}}>Vault</span>
            <button className="nav-signout" onClick={handleSignOut} disabled={loading}>
              Sign out
            </button>
          </div>
        </nav>

        {/* Main */}
        <main className="main">
          {/* Greeting */}
          <div className="greeting">
            <div className="greeting-sub">Welcome back</div>
            <div className="greeting-name">
              Hello, <span>{firstName}</span> ✦
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Saved</div>
              <div className="stat-value purple">{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Completed</div>
              <div className="stat-value green">{stats.completed}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending</div>
              <div className="stat-value amber">{stats.pending}</div>
            </div>
          </div>

          {/* Bottom */}
          <div className="bottom-grid">
            {/* Recent Items */}
            <div className="section-card">
              <div className="section-title">Recently Added</div>
              {stats.recentItems.length > 0 ? (
                stats.recentItems.map((item, i) => (
                  <div className="recent-item" key={i}>
                    <div className="recent-icon">
                      {contentTypeIcon[item.contentType?.toLowerCase() || 'other'] || '✦'}
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div className="recent-title" style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{item.title}</div>
                      <div className="recent-meta">{item.contentType || 'Other'} · {item.energyLevel || 'Medium'} energy</div>
                    </div>
                    <div
                      className="energy-dot"
                      style={{background: energyColor[item.energyLevel?.toLowerCase() || 'medium'] || '#fbbf24'}}
                    />
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🧠</div>
                  <div>Nothing saved yet.</div>
                  <div style={{marginTop: 6, fontSize: 12}}>Add your first curiosity →</div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="actions-card">
              <div className="section-title">Quick Actions</div>
              <button className="action-btn action-btn-primary" onClick={() => router.push('/curiosity/add')}>
                <span className="action-icon">+</span>
                <span className="action-label">Add Curiosity</span>
                <span className="action-arrow">›</span>
              </button>
              <button className="action-btn action-btn-weekend" onClick={() => router.push('/weekend')}>
                <span className="action-icon">✦</span>
                <span className="action-label">Weekend Mode</span>
                <span className="action-arrow">›</span>
              </button>
              <button className="action-btn action-btn-secondary" onClick={() => router.push('/curiosity/vault')}>
                <span className="action-icon">🗄</span>
                <span className="action-label">Open Vault</span>
                <span className="action-arrow">›</span>
              </button>
            </div>
          </div>

          {error && <div className="error-msg" role="alert">{error}</div>}
        </main>
      </div>
    </>
  );
}