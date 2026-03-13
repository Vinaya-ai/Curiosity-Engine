'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserItems, toggleItemCompletion } from '@/lib/items';
import { selectWeekendItem } from '@/lib/weekend';

type SelectedItem = {
  id: string;
  title: string;
  link?: string;
  energyLevel?: string;
  contentType?: string;
  timeRequired?: number;
};

const CONTENT_ICONS: Record<string, string> = {
  video: '▶', article: '📄', podcast: '🎙', pdf: '📑',
  movie: '🎬', project: '🔧', other: '✦',
};

const ENERGY_COLORS: Record<string, string> = {
  low: '#34d399', medium: '#fbbf24', high: '#f87171',
};
const ENERGY_BG: Record<string, string> = {
  low: 'rgba(52,211,153,0.12)', medium: 'rgba(251,191,36,0.12)', high: 'rgba(248,113,113,0.12)',
};
const ENERGY_BORDER: Record<string, string> = {
  low: 'rgba(52,211,153,0.25)', medium: 'rgba(251,191,36,0.25)', high: 'rgba(248,113,113,0.25)',
};

export default function WeekendPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [availableTime, setAvailableTime] = useState<string>('30');
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else router.push('/login');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Sparkle canvas animation
  useEffect(() => {
    if (!sparkle) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: {
      x: number; y: number; vx: number; vy: number;
      alpha: number; size: number; color: string; rotation: number; vr: number;
    }[] = [];

    const colors = ['#a78bfa', '#c4b5fd', '#7c3aed', '#fbbf24', '#34d399', '#fff'];

    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        alpha: 1,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
      });
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.alpha -= 0.013;
        p.rotation += p.vr;
        if (p.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // Draw star shape
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          const a = (j / 4) * Math.PI * 2;
          const r = j % 2 === 0 ? p.size : p.size * 0.4;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      if (frame < 120) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSparkle(false);
        setRevealed(true);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [sparkle]);

  const triggerReveal = (item: SelectedItem) => {
    setSelectedItem(item);
    setRevealed(false);
    setSparkle(true);
    // Reveal after sparkle finishes (~2s)
    setTimeout(() => setRevealed(true), 2100);
  };

  const handleSurprise = async () => {
    if (!user) return;
    setError(null); setPicking(true); setDone(false);
    try {
      const items = await getUserItems(user.uid);
      const incomplete = items.filter((i: any) => !i.completed);
      if (incomplete.length === 0) { setError('Nothing available right now.'); return; }
      const pick = incomplete[Math.floor(Math.random() * incomplete.length)];
      triggerReveal({ id: pick.id, title: pick.title ?? 'Untitled', link: pick.link, energyLevel: pick.energyLevel, contentType: pick.contentType, timeRequired: pick.timeRequired });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items.');
    } finally {
      setPicking(false);
    }
  };

  const handlePick = async () => {
    if (!user) return;
    const minutes = Number(availableTime);
    if (!minutes || minutes <= 0) { setError('Please enter a valid time.'); return; }
    setError(null); setPicking(true); setDone(false);
    try {
      const items = await getUserItems(user.uid);
      const picked = selectWeekendItem(items, minutes);
      if (picked) {
        triggerReveal({ id: picked.id, title: picked.title ?? 'Untitled', link: picked.link, energyLevel: picked.energyLevel, contentType: picked.contentType, timeRequired: picked.timeRequired });
      } else {
        setError(`Nothing fits in ${availableTime} minutes.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items.');
    } finally {
      setPicking(false);
    }
  };

  const handleMarkDone = async () => {
    if (!user || !selectedItem) return;
    try {
      await toggleItemCompletion(user.uid, selectedItem.id, true);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item.');
    }
  };

  const handlePickAnother = () => {
    setSelectedItem(null); setRevealed(false); setSparkle(false); setDone(false); setError(null);
  };

  if (loading) {
    return (
      <>
        <style>{`.wr{min-height:100vh;background:#08090c;display:flex;align-items:center;justify-content:center}.pulse{width:40px;height:40px;border-radius:50%;background:rgba(124,58,237,.4);animation:pulse 1.2s ease-in-out infinite}@keyframes pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.3);opacity:1}}`}</style>
        <div className="wr"><div className="pulse" /></div>
      </>
    );
  }
  if (!user) return null;

  const energy = (selectedItem?.energyLevel || 'medium').toLowerCase();
  const contentType = (selectedItem?.contentType || 'other').toLowerCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .wk-root {
          min-height: 100vh; background: #08090c;
          font-family: 'DM Sans', sans-serif;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
        }

        .orb { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; }
        .orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #7c3aed, transparent); top: -200px; right: -120px; opacity: 0.12; }
        .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #4f46e5, transparent); bottom: -100px; left: -100px; opacity: 0.09; }
        .orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, #a855f7, transparent); top: 40%; left: 40%; opacity: 0.06; }

        .wk-root::before {
          content: ''; position: fixed; inset: 0;
          background-image: radial-gradient(circle, rgba(139,92,246,0.09) 1px, transparent 1px);
          background-size: 32px 32px; pointer-events: none; z-index: 0;
        }

        .nav {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 32px; border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
        }
        .nav-brand {
          font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800;
          background: linear-gradient(135deg, #e2d9f3, #a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          cursor: pointer;
        }
        .nav-links { display: flex; gap: 4px; }
        .nav-link { padding: 6px 13px; border-radius: 7px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.38); cursor: pointer; border: none; background: transparent; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .nav-link:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.05); }

        /* Full screen center */
        .center {
          position: relative; z-index: 1;
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 40px 24px;
        }

        /* Canvas overlay */
        .sparkle-canvas {
          position: fixed; inset: 0; z-index: 50;
          pointer-events: none; width: 100%; height: 100%;
        }

        /* Action screen */
        .action-wrap { text-align: center; max-width: 420px; width: 100%; }

        .wk-eyebrow { font-size: 12px; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }

        .wk-title {
          font-family: 'Syne', sans-serif; font-size: 38px; font-weight: 800;
          color: rgba(255,255,255,0.92); letter-spacing: -0.8px; margin-bottom: 8px;
          line-height: 1.1;
        }
        .wk-title span {
          background: linear-gradient(135deg, #c4b5fd, #7c3aed);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .wk-sub { font-size: 14px; color: rgba(255,255,255,0.28); margin-bottom: 44px; }

        /* Mode cards */
        .mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }

        .mode-card {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 24px 20px; cursor: pointer;
          transition: all 0.2s; text-align: left; position: relative; overflow: hidden;
        }
        .mode-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(124,58,237,0.25); transform: translateY(-2px); }

        .mode-card-icon { font-size: 28px; margin-bottom: 12px; display: block; }
        .mode-card-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.85); margin-bottom: 5px; }
        .mode-card-desc { font-size: 12px; color: rgba(255,255,255,0.3); line-height: 1.4; }

        .mode-card.surprise { border-color: rgba(167,139,250,0.2); }
        .mode-card.surprise:hover { border-color: rgba(167,139,250,0.45); background: rgba(124,58,237,0.08); }
        .mode-card.surprise .mode-card-title { color: #c4b5fd; }

        .mode-card.timed { border-color: rgba(251,191,36,0.15); }
        .mode-card.timed:hover { border-color: rgba(251,191,36,0.35); background: rgba(251,191,36,0.05); }
        .mode-card.timed .mode-card-title { color: #fbbf24; }

        /* Time input row */
        .time-input-row {
          display: flex; gap: 10px; margin-top: 14px; align-items: center;
        }
        .time-input {
          flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 11px 14px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: rgba(255,255,255,0.85);
          outline: none; transition: all 0.2s; text-align: center;
        }
        .time-input:focus { border-color: rgba(251,191,36,0.5); box-shadow: 0 0 0 3px rgba(251,191,36,0.1); }
        .time-input::placeholder { color: rgba(255,255,255,0.2); }

        .btn-pick-timed {
          padding: 11px 20px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, rgba(251,191,36,0.9), rgba(245,158,11,0.9));
          color: #1a1200; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .btn-pick-timed:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(251,191,36,0.3); }
        .btn-pick-timed:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Picking state */
        .picking-state { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .picking-rings { position: relative; width: 80px; height: 80px; }
        .ring {
          position: absolute; border-radius: 50%; border: 2px solid transparent;
          animation: spin 1.5s linear infinite;
        }
        .ring-1 { inset: 0; border-top-color: #7c3aed; }
        .ring-2 { inset: 10px; border-top-color: #a78bfa; animation-delay: -0.5s; animation-duration: 1s; }
        .ring-3 { inset: 20px; border-top-color: #c4b5fd; animation-delay: -0.3s; animation-duration: 0.75s; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .picking-text { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.7); }
        .picking-sub { font-size: 13px; color: rgba(255,255,255,0.25); }

        /* Result card */
        .result-wrap { max-width: 480px; width: 100%; }

        .result-eyebrow { font-size: 12px; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; text-align: center; margin-bottom: 12px; }
        .result-headline {
          font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800;
          color: rgba(255,255,255,0.9); text-align: center; margin-bottom: 28px; letter-spacing: -0.4px;
        }

        .result-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 28px;
          box-shadow: 0 0 0 1px rgba(124,58,237,0.08), 0 20px 50px rgba(0,0,0,0.4);
          animation: revealCard 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes revealCard {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .result-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
        .result-icon-wrap {
          width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
          background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.25);
          display: flex; align-items: center; justify-content: center; font-size: 22px;
        }
        .result-title {
          font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700;
          color: rgba(255,255,255,0.9); line-height: 1.35; margin-bottom: 10px;
        }
        .result-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .result-tag { padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 500; }
        .result-time { font-size: 12px; color: rgba(255,255,255,0.28); margin-top: 6px; }

        .result-link {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 14px; border-radius: 11px;
          background: rgba(129,140,248,0.08); border: 1px solid rgba(129,140,248,0.18);
          color: #818cf8; font-size: 13px; text-decoration: none; margin-bottom: 20px;
          transition: all 0.2s;
        }
        .result-link:hover { background: rgba(129,140,248,0.15); }

        .result-actions { display: flex; flex-direction: column; gap: 10px; }

        .btn-done {
          width: 100%; padding: 14px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #059669, #10b981);
          color: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(16,185,129,0.3);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-done:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(16,185,129,0.45); }

        .btn-another {
          width: 100%; padding: 13px; border-radius: 12px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.55); font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-another:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); }

        /* Done state */
        .done-banner {
          padding: 14px; border-radius: 12px;
          background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.25);
          color: #34d399; font-size: 14px; font-weight: 600; text-align: center;
          animation: fadeUp 0.4s ease both;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .error-msg {
          margin-top: 16px; padding: 11px 14px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; font-size: 13px; color: #fca5a5; text-align: center;
        }

        @media (max-width: 480px) {
          .mode-grid { grid-template-columns: 1fr; }
          .wk-title { font-size: 28px; }
          .nav { padding: 16px 20px; }
        }
      `}</style>

      <div className="wk-root">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

        {/* Sparkle canvas */}
        <canvas ref={canvasRef} className="sparkle-canvas" style={{ display: sparkle ? 'block' : 'none' }} />

        {/* Nav */}
        <nav className="nav">
          <div className="nav-brand" onClick={() => router.push('/dashboard')}>🧠 Curiosity Engine</div>
          <div className="nav-links">
            <button className="nav-link" onClick={() => router.push('/dashboard')}>Dashboard</button>
            <button className="nav-link" onClick={() => router.push('/curiosity/add')}>Add</button>
            <button className="nav-link" onClick={() => router.push('/curiosity/vault')}>Vault</button>
          </div>
        </nav>

        <div className="center">
          {/* Picking spinner */}
          {picking ? (
            <div className="picking-state">
              <div className="picking-rings">
                <div className="ring ring-1" /><div className="ring ring-2" /><div className="ring ring-3" />
              </div>
              <div className="picking-text">Finding your pick...</div>
              <div className="picking-sub">Scanning your vault</div>
            </div>

          /* Sparkle / pre-reveal */
          ) : sparkle ? (
            <div className="picking-state">
              <div style={{ fontSize: 48, filter: 'drop-shadow(0 0 24px rgba(167,139,250,0.8))' }}>✦</div>
              <div className="picking-text" style={{ color: '#c4b5fd' }}>Something is emerging...</div>
            </div>

          /* Result revealed */
          ) : selectedItem && revealed ? (
            <div className="result-wrap">
              <div className="result-eyebrow">Your pick ✦</div>
              <div className="result-headline">Here's what calls to you.</div>

              <div className="result-card">
                <div className="result-top">
                  <div className="result-icon-wrap">
                    {CONTENT_ICONS[contentType] || '✦'}
                  </div>
                  <div>
                    <div className="result-title">{selectedItem.title}</div>
                    <div className="result-tags">
                      {selectedItem.energyLevel && (
                        <span className="result-tag" style={{ color: ENERGY_COLORS[energy], background: ENERGY_BG[energy], border: `1px solid ${ENERGY_BORDER[energy]}` }}>
                          {energy} energy
                        </span>
                      )}
                      {selectedItem.contentType && (
                        <span className="result-tag" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {contentType}
                        </span>
                      )}
                    </div>
                    {selectedItem.timeRequired && (
                      <div className="result-time">⏱ {selectedItem.timeRequired} min</div>
                    )}
                  </div>
                </div>

                {selectedItem.link && (
                  <a href={selectedItem.link} target="_blank" rel="noopener noreferrer" className="result-link">
                    <span>↗</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedItem.link}
                    </span>
                  </a>
                )}

                <div className="result-actions">
                  {done ? (
                    <>
                      <div className="done-banner">✓ Marked as done — nice work!</div>
                      <button className="btn-another" onClick={handlePickAnother}>Pick another →</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-done" onClick={handleMarkDone}>✓ Mark as Done</button>
                      <button className="btn-another" onClick={handlePickAnother}>Pick something else</button>
                    </>
                  )}
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}
            </div>

          /* Action screen */
          ) : (
            <div className="action-wrap">
              <div className="wk-eyebrow">Weekend Mode</div>
              <div className="wk-title">What will you <span>explore</span> today?</div>
              <div className="wk-sub">Pick a mode and let your vault decide.</div>

              <div className="mode-grid">
                {/* Surprise card */}
                <div className="mode-card surprise" onClick={handleSurprise} style={{ cursor: picking ? 'not-allowed' : 'pointer', opacity: picking ? 0.6 : 1 }}>
                  <span className="mode-card-icon">✦</span>
                  <div className="mode-card-title">Surprise Me</div>
                  <div className="mode-card-desc">Let the engine pick randomly from your vault.</div>
                </div>

                {/* Timed card */}
                <div className="mode-card timed">
                  <span className="mode-card-icon">⏱</span>
                  <div className="mode-card-title">By Time</div>
                  <div className="mode-card-desc">Pick based on how much time you have.</div>
                </div>
              </div>

              {/* Time input */}
              <div className="time-input-row">
                <input
                  type="number"
                  min="1"
                  value={availableTime}
                  onChange={e => setAvailableTime(e.target.value)}
                  className="time-input"
                  placeholder="Minutes available"
                />
                <button className="btn-pick-timed" onClick={handlePick} disabled={picking}>
                  Pick for me →
                </button>
              </div>

              {error && <div className="error-msg">{error}</div>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}