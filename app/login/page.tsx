'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) router.replace('/dashboard');
    });
    return () => unsubscribe();
  }, [router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = mode === 'signin' ? handleEmailSignIn : handleEmailSignUp;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: #08090c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        /* Animated background orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          animation: drift 12s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #7c3aed, #4f46e5);
          top: -100px; right: -80px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 380px; height: 380px;
          background: radial-gradient(circle, #a855f7, #6366f1);
          bottom: -80px; left: -60px;
          animation-delay: -4s;
        }
        .orb-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, #c084fc, #818cf8);
          top: 40%; left: 30%;
          animation-delay: -8s;
          opacity: 0.08;
        }

        @keyframes drift {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, 20px) scale(1.05); }
        }

        /* Dot grid pattern */
        .login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(139, 92, 246, 0.12) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        /* Card */
        .card {
          position: relative;
          width: 100%;
          max-width: 440px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 48px 40px;
          backdrop-filter: blur(20px);
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          box-shadow:
            0 0 0 1px rgba(139, 92, 246, 0.1),
            0 24px 60px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Brand */
        .brand {
          text-align: center;
          margin-bottom: 36px;
          animation: fadeUp 0.6s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .brand-icon {
          font-size: 40px;
          display: block;
          margin-bottom: 12px;
          filter: drop-shadow(0 0 20px rgba(167, 139, 250, 0.5));
        }

        .brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #e2d9f3 0%, #a78bfa 50%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .brand-tagline {
          margin-top: 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.3px;
          font-weight: 300;
        }

        /* Mode toggle */
        .mode-toggle {
          display: flex;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 28px;
          animation: fadeUp 0.6s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .mode-btn {
          flex: 1;
          padding: 9px;
          border: none;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: rgba(255,255,255,0.4);
        }

        .mode-btn.active {
          background: rgba(124, 58, 237, 0.8);
          color: #fff;
          box-shadow: 0 2px 12px rgba(124, 58, 237, 0.4);
        }

        /* Form */
        .form-group {
          margin-bottom: 16px;
          animation: fadeUp 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          margin-bottom: 8px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .form-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 13px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.9);
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input::placeholder { color: rgba(255,255,255,0.2); }

        .form-input:focus {
          border-color: rgba(124, 58, 237, 0.6);
          background: rgba(124, 58, 237, 0.06);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
        }

        /* Primary button */
        .btn-primary {
          width: 100%;
          margin-top: 8px;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          animation: fadeUp 0.6s 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
          letter-spacing: 0.2px;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.35);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(124, 58, 237, 0.5);
        }

        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
          animation: fadeUp 0.6s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }

        .divider-text {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        /* Google button */
        .btn-google {
          width: 100%;
          padding: 13px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.8);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          animation: fadeUp 0.6s 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .btn-google:hover:not(:disabled) {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
        }

        .btn-google:disabled { opacity: 0.55; cursor: not-allowed; }

        .google-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        /* Error */
        .error-msg {
          margin-top: 16px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          font-size: 13px;
          color: #fca5a5;
          text-align: center;
          animation: fadeUp 0.3s ease both;
        }

        /* Loading spinner */
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-root">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="card">
          {/* Brand */}
          <div className="brand">
            <span className="brand-icon">🧠</span>
            <div className="brand-name">Curiosity Engine</div>
            <div className="brand-tagline">Don't lose what sparks you.</div>
          </div>

          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => setMode('signin')}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`mode-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
              type="button"
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <span className="spinner" />}
              {loading
                ? mode === 'signin' ? 'Signing in...' : 'Creating account...'
                : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="btn-google"
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Opening Google...' : 'Continue with Google'}
          </button>

          {error && (
            <div className="error-msg" role="alert">{error}</div>
          )}
        </div>
      </div>
    </>
  );
}