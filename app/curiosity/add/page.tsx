'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { addItem, type ContentType } from '@/lib/items';

const CONTENT_TYPE_OPTIONS: { value: ContentType; icon: string; label: string }[] = [
  { value: 'video',   icon: '▶',  label: 'Video'   },
  { value: 'article', icon: '📄', label: 'Article' },
  { value: 'podcast', icon: '🎙', label: 'Podcast' },
  { value: 'pdf',     icon: '📑', label: 'PDF'     },
  { value: 'movie',   icon: '🎬', label: 'Movie'   },
  { value: 'project', icon: '🔧', label: 'Project' },
  { value: 'other',   icon: '✦',  label: 'Other'   },
];

const ENERGY_OPTIONS = [
  { value: 'low',    label: 'Low',    color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)'  },
  { value: 'medium', label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)'  },
  { value: 'high',   label: 'High',   color: '#f87171', bg: 'rgba(248,113,113,0.12)',border: 'rgba(248,113,113,0.25)' },
];

const ENGAGEMENT_OPTIONS = [
  { value: 'passive', label: 'Passive', desc: 'Just watch / listen' },
  { value: 'active',  label: 'Active',  desc: 'Read & take notes'   },
  { value: 'deep',    label: 'Deep',    desc: 'Build / practice'    },
];

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
  const [aiTagged, setAiTagged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.replace('/login');
      else setUser(currentUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  if (!authChecked) return null;

  const resetForm = () => {
    setTitle(''); setLink(''); setTimeRequired(15);
    setEnergyLevel('medium'); setEngagementType('active');
    setContentType('other'); setAiTagged(false); setSuccess(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!user) { setError('You must be logged in.'); return; }
    setLoading(true);
    try {
      await addItem(user.uid, {
        title: title.trim(),
        link: link.trim() || undefined,
        timeRequired, energyLevel, engagementType, contentType,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoTag = async () => {
    if (!title.trim()) { setError('Please enter a title first.'); return; }
    setError(null); setAiLoading(true); setAiTagged(false);
    try {
      const response = await fetch('/api/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, link, userId: user?.uid }),
      });
      if (!response.ok) {
        const d = await response.json().catch(() => ({}));
        throw new Error(d.error || `Failed (${response.status})`);
      }
      const data = await response.json();
      if (data && typeof data === 'object') {
        if (typeof data.timeRequired === 'number') setTimeRequired(data.timeRequired);
        if (['low','medium','high'].includes(data.energyLevel)) setEnergyLevel(data.energyLevel);
        if (['passive','active','deep'].includes(data.engagementType)) setEngagementType(data.engagementType);
        const valid: ContentType[] = ['video','movie','pdf','podcast','project','article','other'];
        if (valid.includes(data.contentType)) setContentType(data.contentType);
        setAiTagged(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-tag.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .add-root {
          min-height: 100vh;
          background: #08090c;
          font-family: 'DM Sans', sans-serif;
          position: relative; overflow-x: hidden;
        }

        .orb { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
        .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #7c3aed, transparent); top: -150px; right: -100px; opacity: 0.1; }
        .orb-2 { width: 350px; height: 350px; background: radial-gradient(circle, #4f46e5, transparent); bottom: -80px; left: -80px; opacity: 0.08; }

        .add-root::before {
          content: ''; position: fixed; inset: 0;
          background-image: radial-gradient(circle, rgba(139,92,246,0.09) 1px, transparent 1px);
          background-size: 32px 32px; pointer-events: none; z-index: 0;
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
        .nav-links { display: flex; gap: 4px; }
        .nav-link {
          padding: 6px 13px; border-radius: 7px; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.38); cursor: pointer; border: none;
          background: transparent; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .nav-link:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.05); }
        .nav-link.active { color: #a78bfa; background: rgba(124,58,237,0.12); }

        /* Layout */
        .page-wrap {
          position: relative; z-index: 1;
          display: flex; align-items: flex-start; justify-content: center;
          gap: 32px; padding: 44px 32px;
          max-width: 960px; margin: 0 auto;
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        /* Form card */
        .form-card {
          flex: 1; max-width: 520px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 32px;
        }

        .page-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: rgba(255,255,255,0.9); letter-spacing: -0.3px; margin-bottom: 6px; }
        .page-subtitle { font-size: 13px; color: rgba(255,255,255,0.28); margin-bottom: 28px; }

        /* Fields */
        .field { margin-bottom: 20px; }
        .field-label { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.38); letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 8px; display: block; }

        .field-input {
          width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 11px; padding: 12px 14px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: rgba(255,255,255,0.85);
          outline: none; transition: all 0.2s;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input:focus { border-color: rgba(124,58,237,0.55); background: rgba(124,58,237,0.05); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }

        /* AI tag row */
        .ai-row { display: flex; gap: 10px; margin-bottom: 24px; align-items: center; }

        .btn-ai {
          flex: 1; padding: 11px 16px; border-radius: 11px;
          background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.35);
          color: #c4b5fd; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-ai:hover:not(:disabled) { background: rgba(124,58,237,0.3); border-color: rgba(124,58,237,0.5); }
        .btn-ai:disabled { opacity: 0.45; cursor: not-allowed; }

        .ai-badge {
          padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;
          background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.25);
          color: #34d399; display: flex; align-items: center; gap: 5px; white-space: nowrap;
          animation: fadeUp 0.3s ease both;
        }

        /* Divider */
        .divider { height: 1px; background: rgba(255,255,255,0.05); margin: 24px 0; }

        /* Segment controls */
        .segment { display: flex; gap: 6px; }
        .seg-btn {
          flex: 1; padding: 9px 10px; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.18s; text-align: center;
        }
        .seg-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); }

        /* Content type grid */
        .type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
        .type-btn {
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          padding: 10px 8px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03);
          cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif;
        }
        .type-btn:hover { background: rgba(255,255,255,0.06); }
        .type-btn.active { background: rgba(124,58,237,0.15); border-color: rgba(124,58,237,0.4); }
        .type-icon { font-size: 18px; }
        .type-label { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.4); }
        .type-btn.active .type-label { color: #c4b5fd; }

        /* Time slider */
        .time-row { display: flex; align-items: center; gap: 14px; }
        .time-slider { flex: 1; -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer; }
        .time-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #7c3aed; cursor: pointer; box-shadow: 0 0 0 3px rgba(124,58,237,0.25); }
        .time-val { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #a78bfa; min-width: 54px; text-align: right; }

        /* Submit */
        .btn-submit {
          width: 100%; padding: 14px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; margin-top: 8px;
          box-shadow: 0 4px 18px rgba(124,58,237,0.35);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(124,58,237,0.5); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Messages */
        .error-msg { margin-top: 14px; padding: 11px 14px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; font-size: 13px; color: #fca5a5; }

        /* Success overlay */
        .success-card {
          flex: 1; max-width: 520px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(52,211,153,0.2);
          border-radius: 20px; padding: 48px 32px; text-align: center;
          animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .success-icon { font-size: 48px; margin-bottom: 16px; filter: drop-shadow(0 0 20px rgba(52,211,153,0.5)); }
        .success-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: rgba(255,255,255,0.9); margin-bottom: 8px; }
        .success-sub { font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 28px; }
        .success-btns { display: flex; flex-direction: column; gap: 10px; }

        /* Preview card (right side) */
        .preview-card {
          width: 260px; flex-shrink: 0;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 24px; position: sticky; top: 44px;
          animation: fadeUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both;
        }
        .preview-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
        .preview-content-icon { font-size: 28px; margin-bottom: 10px; }
        .preview-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.85); margin-bottom: 12px; line-height: 1.4; min-height: 42px; }
        .preview-empty-title { font-size: 13px; color: rgba(255,255,255,0.18); font-style: italic; }
        .preview-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .preview-tag { padding: 3px 9px; border-radius: 5px; font-size: 11px; font-weight: 500; }
        .preview-time { font-size: 12px; color: rgba(255,255,255,0.3); display: flex; align-items: center; gap: 5px; margin-top: 8px; }
        .preview-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 14px 0; }
        .preview-hint { font-size: 11px; color: rgba(255,255,255,0.18); line-height: 1.5; }

        @media (max-width: 700px) {
          .preview-card { display: none; }
          .page-wrap { padding: 28px 16px; }
          .nav { padding: 16px 20px; }
          .type-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>

      <div className="add-root">
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        {/* Nav */}
        <nav className="nav">
          <div className="nav-brand" onClick={() => router.push('/dashboard')}>🧠 Curiosity Engine</div>
          <div className="nav-links">
            <button className="nav-link" onClick={() => router.push('/dashboard')}>Dashboard</button>
            <button className="nav-link active">Add</button>
            <button className="nav-link" onClick={() => router.push('/curiosity/vault')}>Vault</button>
          </div>
        </nav>

        <div className="page-wrap">
          {/* Form or Success */}
          {success ? (
            <div className="success-card">
              <div className="success-icon">✦</div>
              <div className="success-title">Curiosity saved!</div>
              <div className="success-sub">"{title}" has been added to your vault.</div>
              <div className="success-btns">
                <button className="btn-submit" onClick={resetForm}>Add another</button>
                <button
                  onClick={() => router.push('/curiosity/vault')}
                  style={{padding:'12px', borderRadius:'11px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', fontFamily:"'DM Sans',sans-serif", fontSize:'13px', fontWeight:600, cursor:'pointer'}}
                >
                  Go to Vault →
                </button>
              </div>
            </div>
          ) : (
            <div className="form-card">
              <div className="page-title">✦ Add Curiosity</div>
              <div className="page-subtitle">Capture what sparks you before it slips away.</div>

              <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="field">
                  <label className="field-label">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="field-input"
                    placeholder="What are you curious about?"
                    required
                  />
                </div>

                {/* Link */}
                <div className="field">
                  <label className="field-label">Link (optional)</label>
                  <input
                    type="url"
                    value={link}
                    onChange={e => setLink(e.target.value)}
                    className="field-input"
                    placeholder="https://..."
                  />
                </div>

                {/* AI Tag row */}
                <div className="ai-row">
                  <button type="button" onClick={handleAutoTag} disabled={aiLoading || !title.trim()} className="btn-ai">
                    {aiLoading ? (
                      <><div className="spinner" /> Tagging with AI...</>
                    ) : (
                      <>✦ Auto Tag with AI</>
                    )}
                  </button>
                  {aiTagged && (
                    <div className="ai-badge">✓ Tagged</div>
                  )}
                </div>

                <div className="divider" />

                {/* Content Type */}
                <div className="field">
                  <label className="field-label">Content Type</label>
                  <div className="type-grid">
                    {CONTENT_TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`type-btn ${contentType === opt.value ? 'active' : ''}`}
                        onClick={() => setContentType(opt.value)}
                      >
                        <span className="type-icon">{opt.icon}</span>
                        <span className="type-label">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energy Level */}
                <div className="field">
                  <label className="field-label">Energy Level</label>
                  <div className="segment">
                    {ENERGY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className="seg-btn"
                        style={energyLevel === opt.value ? { background: opt.bg, border: `1px solid ${opt.border}`, color: opt.color } : {}}
                        onClick={() => setEnergyLevel(opt.value as typeof energyLevel)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Engagement Type */}
                <div className="field">
                  <label className="field-label">Engagement Type</label>
                  <div className="segment">
                    {ENGAGEMENT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className="seg-btn"
                        style={engagementType === opt.value ? { background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.4)', color: '#c4b5fd' } : {}}
                        onClick={() => setEngagementType(opt.value as typeof engagementType)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Required */}
                <div className="field">
                  <label className="field-label">Time Required</label>
                  <div className="time-row">
                    <input
                      type="range"
                      min="5"
                      max="180"
                      step="5"
                      value={timeRequired}
                      onChange={e => setTimeRequired(Number(e.target.value))}
                      className="time-slider"
                    />
                    <div className="time-val">{timeRequired}m</div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-submit">
                  {loading ? <><div className="spinner" /> Saving...</> : '+ Save to Vault'}
                </button>
              </form>

              {error && <div className="error-msg" role="alert">{error}</div>}
            </div>
          )}

          {/* Live Preview */}
          {!success && (
            <div className="preview-card">
              <div className="preview-label">Preview</div>
              <div className="preview-content-icon">
                {CONTENT_TYPE_OPTIONS.find(o => o.value === contentType)?.icon || '✦'}
              </div>
              {title ? (
                <div className="preview-title">{title}</div>
              ) : (
                <div className="preview-title preview-empty-title">Your title appears here...</div>
              )}
              <div className="preview-tags">
                {(() => {
                  const e = ENERGY_OPTIONS.find(o => o.value === energyLevel)!;
                  return (
                    <span className="preview-tag" style={{ color: e.color, background: e.bg, border: `1px solid ${e.border}` }}>
                      {e.label} energy
                    </span>
                  );
                })()}
                <span className="preview-tag" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {engagementType}
                </span>
                <span className="preview-tag" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {CONTENT_TYPE_OPTIONS.find(o => o.value === contentType)?.label}
                </span>
              </div>
              <div className="preview-time">⏱ {timeRequired} min</div>
              {link && (
                <>
                  <div className="preview-divider" />
                  <div style={{ fontSize: 11, color: '#818cf8', wordBreak: 'break-all' }}>↗ {link}</div>
                </>
              )}
              <div className="preview-divider" />
              <div className="preview-hint">This is how your curiosity will appear in the Vault.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}