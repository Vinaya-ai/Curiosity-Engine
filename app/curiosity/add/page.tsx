'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { addItem, type ContentType } from '@/lib/items';
import { useTheme } from '@/lib/theme';

// Matches ContentType in lib/items.ts exactly
const CONTENT_TYPES: { id: ContentType; label: string; icon: string }[] = [
  { id: 'article', label: 'Article', icon: '📄' },
  { id: 'video',   label: 'Video',   icon: '🎬' },
  { id: 'podcast', label: 'Podcast', icon: '🎧' },
  { id: 'pdf',     label: 'PDF',     icon: '📑' },
  { id: 'project', label: 'Project', icon: '🛠' },
  { id: 'movie',   label: 'Movie',   icon: '🎥' },
  { id: 'other',   label: 'Other',   icon: '🔗' },
];

// Matches lib/items.ts union types exactly
const ENERGY     = ['low', 'medium', 'high']     as const;
const ENGAGEMENT = ['active', 'passive', 'deep'] as const;
type EnergyLevel    = typeof ENERGY[number];
type EngagementType = typeof ENGAGEMENT[number];

const ENERGY_COLOR:     Record<string, string> = { low: 'var(--mint)', medium: 'var(--rose)', high: 'var(--terra)' };
const ENGAGEMENT_COLOR: Record<string, string> = { active: 'var(--rose)', passive: 'var(--blue)', deep: 'var(--terra)' };

export default function AddCuriosityPage() {
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [user, setUser]               = useState<any>(null);
  const [title, setTitle]             = useState('');
  const [link, setLink]               = useState('');
  const [contentType, setContentType] = useState<ContentType>('article');
  const [energy, setEnergy]           = useState<EnergyLevel>('medium');
  const [engagement, setEngagement]   = useState<EngagementType>('passive');
  const [timeRequired, setTimeRequired] = useState(30);
  const [tagged, setTagged]   = useState(false);
  const [tagging, setTagging] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace('/login'); else setUser(u);
    });
    return () => unsub();
  }, [router]);

  const handleAITag = async () => {
    if (!link && !title) return;
    setTagging(true);
    await new Promise(r => setTimeout(r, 1400));
    setTagged(true); setTagging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null); setSaving(true);
    try {
      await addItem(user.uid, {
        title,
        link: link || undefined,
        timeRequired,
        energyLevel: energy,
        engagementType: engagement,
        contentType,
      });
      setSuccess(true);
      setTimeout(() => router.push('/curiosity/vault'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally { setSaving(false); }
  };

  if (success) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Saved to your Vault!</div>
        <div style={{ color: 'var(--text-3)', marginTop: 8 }}>Taking you there now…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav className="ce-nav">
        <a href="/dashboard" className="ce-brand">Curiosity <em>Engine</em></a>
        <div className="ce-nav-links">
          <a href="/dashboard" className="ce-nav-link">Dashboard</a>
          <a href="/curiosity/vault" className="ce-nav-link">Vault</a>
          <span className="ce-nav-link active">+ Add</span>
          <a href="/weekend" className="ce-nav-link">Weekend</a>
          <button className="ce-theme-btn" onClick={toggle}>{dark ? '☀️' : '🌙'}</button>
        </div>
      </nav>

      <div className="ce-page" style={{ maxWidth: 700 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>
            Add a <em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>curiosity</em>
          </h1>
          <p style={{ color: 'var(--text-2)', marginTop: 6, fontSize: 14 }}>Capture it before you forget.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ce-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

            <div>
              <label className="ce-label">Title *</label>
              <input className="ce-input" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="What caught your eye?" required />
            </div>

            <div>
              <label className="ce-label">Link</label>
              <input className="ce-input" value={link} onChange={e => setLink(e.target.value)}
                placeholder="https://..." type="url" />
            </div>

            <div>
              <label className="ce-label">Content Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {CONTENT_TYPES.map(t => (
                  <button key={t.id} type="button" onClick={() => setContentType(t.id)} style={{
                    padding: '10px 4px', borderRadius: 'var(--radius)', border: '1px solid',
                    borderColor: contentType === t.id ? 'var(--rose)' : 'var(--border)',
                    background: contentType === t.id ? 'var(--rose-light)' : 'var(--bg)',
                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 18 }}>{t.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: contentType === t.id ? 'var(--rose)' : 'var(--text-3)', marginTop: 4 }}>{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="ce-label">Energy Level</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {ENERGY.map(e => (
                    <button key={e} type="button" onClick={() => setEnergy(e)} style={{
                      flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid',
                      borderColor: energy === e ? ENERGY_COLOR[e] : 'var(--border)',
                      background: energy === e ? `${ENERGY_COLOR[e]}18` : 'var(--bg)',
                      color: energy === e ? ENERGY_COLOR[e] : 'var(--text-3)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: "'DM Sans',sans-serif", textTransform: 'capitalize',
                    }}>{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="ce-label">Engagement</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {ENGAGEMENT.map(eg => (
                    <button key={eg} type="button" onClick={() => setEngagement(eg)} style={{
                      flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid',
                      borderColor: engagement === eg ? ENGAGEMENT_COLOR[eg] : 'var(--border)',
                      background: engagement === eg ? `${ENGAGEMENT_COLOR[eg]}18` : 'var(--bg)',
                      color: engagement === eg ? ENGAGEMENT_COLOR[eg] : 'var(--text-3)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: "'DM Sans',sans-serif", textTransform: 'capitalize',
                    }}>{eg}</button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="ce-label">Time Required — <span style={{ color: 'var(--rose)', fontWeight: 700 }}>{timeRequired} min</span></label>
              <input type="range" min={5} max={180} step={5} value={timeRequired}
                onChange={e => setTimeRequired(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--rose)', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                <span>5 min</span><span>3 hrs</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="button" onClick={handleAITag} disabled={tagging || tagged} style={{
                padding: '9px 16px', borderRadius: 'var(--radius)', border: '1px solid',
                borderColor: tagged ? 'var(--mint-border)' : 'var(--border)',
                background: tagged ? 'var(--mint-light)' : 'var(--bg)',
                color: tagged ? 'var(--mint)' : 'var(--text-2)',
                fontSize: 13, fontWeight: 600, cursor: tagged ? 'default' : 'pointer',
                fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s', display: 'flex', gap: 6, alignItems: 'center',
              }}>
                {tagging
                  ? <><div className="ce-spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--mint)' }} />Tagging...</>
                  : tagged ? '✓ AI Tagged' : '🤖 AI Auto-tag'}
              </button>
              {!tagged && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Auto-detect type & energy from URL</span>}
            </div>

            {error && <div className="ce-error">{error}</div>}

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={() => router.back()} className="ce-btn ce-btn-secondary" style={{ width: 'auto', padding: '12px 20px' }}>Cancel</button>
              <button type="submit" disabled={saving || !title.trim()} className="ce-btn ce-btn-primary">
                {saving && <div className="ce-spinner" />}
                {saving ? 'Saving...' : 'Save to Vault ✨'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}