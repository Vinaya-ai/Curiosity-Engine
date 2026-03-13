'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

export default function LoginPage() {
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { if (u) router.replace('/dashboard'); });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      if (mode === 'signin') await signInWithEmail(email, password);
      else await signUpWithEmail(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(null); setLoading(true);
    try { await signInWithGoogle(); router.push('/dashboard'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>

      {/* Theme toggle */}
      <button className="ce-theme-btn" onClick={toggle} style={{ position:'fixed', top:16, right:16 }}>
        {dark ? '☀️' : '🌙'}
      </button>

      {/* Card */}
      <div className="ce-card" style={{ width:'100%', maxWidth:400, padding:'40px 36px' }}>

        {/* Brand */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🧠</div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:700, color:'var(--text)', letterSpacing:'-0.4px', marginBottom:6 }}>
            Curiosity <em style={{ fontStyle:'italic', color:'var(--rose)' }}>Engine</em>
          </div>
          <div style={{ fontSize:13, color:'var(--text-3)' }}>Don't lose what sparks you.</div>
        </div>

        {/* Mode toggle */}
        <div style={{ display:'flex', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:3, marginBottom:24 }}>
          {(['signin','signup'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex:1, padding:'8px', borderRadius:'var(--radius-sm)', border:'none',
              fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, cursor:'pointer',
              transition:'all 0.15s',
              background: mode === m ? 'var(--rose)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--text-3)',
              boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
            }}>
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:16 }}>
            <label className="ce-label">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="ce-input" placeholder="you@example.com" required />
          </div>
          <div style={{ marginBottom:8 }}>
            <label className="ce-label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="ce-input" placeholder="••••••••" required />
          </div>

          <button type="submit" disabled={loading} className="ce-btn ce-btn-primary" style={{ marginTop:20 }}>
            {loading && <div className="ce-spinner" />}
            {loading ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
          <div className="ce-divider" style={{ flex:1, margin:0 }} />
          <span style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>or</span>
          <div className="ce-divider" style={{ flex:1, margin:0 }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading} className="ce-btn ce-btn-secondary" style={{ gap:10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {error && <div className="ce-error" role="alert">{error}</div>}
      </div>
    </div>
  );
}