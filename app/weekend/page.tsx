'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserItems, toggleItemCompletion } from '@/lib/items';
import { useTheme } from '@/lib/theme';

interface Item {
  id: string; title: string; url?: string;
  contentType: string; energyLevel: string; engagementType: string;
  timeRequired: number; completed: boolean;
}
const TYPE_ICON: Record<string, string> = { article: '📄', video: '🎬', podcast: '🎧', book: '📚', course: '🎓', other: '🔗' };
const ENERGY_COLOR: Record<string, string> = { low: '#2d9e6b', medium: '#b05070', high: '#c1674a' };

// --- Sparkle canvas ---
function SparkleCanvas({ dark }: { dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    // Rose/pink sparkle palette
    const COLORS = dark
      ? ['rgba(232,120,154,0.7)', 'rgba(200,100,140,0.5)', 'rgba(245,190,210,0.6)', 'rgba(176,80,112,0.4)', 'rgba(255,210,225,0.5)']
      : ['rgba(176,80,112,0.4)', 'rgba(200,120,150,0.3)', 'rgba(240,160,190,0.5)', 'rgba(140,60,90,0.25)', 'rgba(255,180,210,0.4)'];

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2.5 + 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.03 + Math.random() * 0.04,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.twinkle += p.twinkleSpeed;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(p.twinkle));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        // Star shape
        for (let i = 0; i < 5; i++) {
          const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const ra = (i * 4 * Math.PI) / 5 + Math.PI / 10 - Math.PI / 2;
          if (i === 0) ctx.moveTo(p.x + p.r * Math.cos(a), p.y + p.r * Math.sin(a));
          else ctx.lineTo(p.x + p.r * Math.cos(a), p.y + p.r * Math.sin(a));
          ctx.lineTo(p.x + p.r * 0.4 * Math.cos(ra), p.y + p.r * 0.4 * Math.sin(ra));
        }
        ctx.closePath(); ctx.fill();
      });
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize); };
  }, [dark]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

export default function WeekendPage() {
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'choose' | 'surprise' | 'bytime'>('choose');
  const [timeFilter, setTimeFilter] = useState(60);
  const [result, setResult] = useState<Item | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace('/login'); return; }
      try {
        const data = await getUserItems(u.uid);
        setItems((data as Item[]).filter(i => !i.completed));
      } catch (e) { console.error(e); }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const pickSurprise = useCallback(() => {
    if (!items.length) return;
    setResult(items[Math.floor(Math.random() * items.length)]);
    setDone(false);
  }, [items]);

  const pickByTime = useCallback(() => {
    const eligible = items.filter(i => i.timeRequired <= timeFilter);
    if (!eligible.length) return;
    setResult(eligible[Math.floor(Math.random() * eligible.length)]);
    setDone(false);
  }, [items, timeFilter]);

  const handleDone = async () => {
    if (!result) return;
    setDone(true);
    await toggleItemCompletion(result.id, true);
    setItems(prev => prev.filter(i => i.id !== result.id));
    setTimeout(() => { setResult(null); setMode('choose'); setDone(false); }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav className="ce-nav">
        <a href="/dashboard" className="ce-brand">Curiosity <em>Engine</em></a>
        <div className="ce-nav-links">
          <a href="/dashboard" className="ce-nav-link">Dashboard</a>
          <a href="/curiosity/vault" className="ce-nav-link">Vault</a>
          <a href="/curiosity/add" className="ce-nav-link">+ Add</a>
          <span className="ce-nav-link active">Weekend</span>
          <button className="ce-theme-btn" onClick={toggle}>{dark ? '☀️' : '🌙'}</button>
        </div>
      </nav>

      <div className="ce-page">
        {/* Hero with sparkles */}
        <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: '48px 36px', marginBottom: 36,
          background: dark ? 'linear-gradient(135deg, #2a1620 0%, #1e1018 100%)' : 'linear-gradient(135deg, #fde8ee 0%, #f8f0f8 100%)',
          border: '1px solid var(--rose-border)' }}>
          <SparkleCanvas dark={dark} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 34, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 10 }}>
              Weekend <em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>Mode</em>
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 15, maxWidth: 380, margin: '0 auto' }}>
              Stop scrolling. Pick one curiosity and actually explore it.
            </p>
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-3)' }}>{items.length} things waiting for you</div>
          </div>
        </div>

        {mode === 'choose' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button onClick={() => { setMode('surprise'); pickSurprise(); }} style={{
              padding: '28px 20px', borderRadius: 'var(--radius-lg)', border: '2px solid var(--rose-border)',
              background: 'var(--rose-light)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rose)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rose-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎲</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: 'var(--rose)', marginBottom: 8 }}>Surprise Me</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Pick anything from your vault at random</div>
            </button>
            <button onClick={() => setMode('bytime')} style={{
              padding: '28px 20px', borderRadius: 'var(--radius-lg)', border: '2px solid var(--blue-border)',
              background: 'var(--blue-light)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--blue-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏱</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: 'var(--blue)', marginBottom: 8 }}>By Time</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Tell me how long you have</div>
            </button>
          </div>
        )}

        {mode === 'bytime' && !result && (
          <div className="ce-card" style={{ padding: '32px' }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              How much time do you have?
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>I'll find something that fits.</p>
            <label className="ce-label">Up to — <span style={{ color: 'var(--rose)', fontWeight: 700 }}>{timeFilter} minutes</span></label>
            <input type="range" min={10} max={180} step={10} value={timeFilter}
              onChange={e => setTimeFilter(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--rose)', cursor: 'pointer', margin: '10px 0 6px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 24 }}>
              <span>10m</span><span>3hrs</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setMode('choose')} className="ce-btn ce-btn-secondary" style={{ width: 'auto', padding: '11px 18px' }}>← Back</button>
              <button onClick={pickByTime} className="ce-btn ce-btn-primary">Find something →</button>
            </div>
          </div>
        )}

        {/* Result card */}
        {result && (
          <div className="ce-card" style={{ padding: '28px', marginTop: mode !== 'choose' ? 0 : 24, borderLeft: `4px solid ${ENERGY_COLOR[result.energyLevel] || 'var(--rose)'}`, animation: 'ceUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>🎉</div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: 'var(--mint)' }}>Marked as done!</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>Today's pick ✨</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
                  <span style={{ fontSize: 28 }}>{TYPE_ICON[result.contentType] || '🔗'}</span>
                  <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{result.title}</h2>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: `${ENERGY_COLOR[result.energyLevel]}18`, color: ENERGY_COLOR[result.energyLevel], border: `1px solid ${ENERGY_COLOR[result.energyLevel]}40` }}>
                    {result.energyLevel} energy
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                    {result.engagementType}
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                    ⏱ {result.timeRequired}m
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {result.url && (
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="ce-btn ce-btn-primary" style={{ width: 'auto', padding: '11px 20px', textDecoration: 'none', fontSize: 14 }}>
                      Open it →
                    </a>
                  )}
                  <button onClick={handleDone} className="ce-btn" style={{ width: 'auto', padding: '11px 20px', background: 'var(--mint-light)', color: 'var(--mint)', border: '1px solid var(--mint-border)', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", borderRadius: 'var(--radius)' }}>
                    ✓ Mark done
                  </button>
                  <button onClick={mode === 'surprise' ? pickSurprise : pickByTime}
                    className="ce-btn ce-btn-secondary" style={{ width: 'auto', padding: '11px 18px', fontSize: 14 }}>
                    Try another
                  </button>
                  <button onClick={() => { setResult(null); setMode('choose'); }} className="ce-btn ce-btn-secondary" style={{ width: 'auto', padding: '11px 18px', fontSize: 14 }}>
                    ← Back
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}