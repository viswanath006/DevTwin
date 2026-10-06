import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Key, Mail, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import DevTwinLogo from './DevTwinLogo';

const DEMO_EMAIL = 'developer@devtwin.ai';
const DEMO_PASSWORD = 'demo123';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const handleUseDemoAccount = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
    setAutoFilled(true);

    // Provide instant feedback and proceed
    setLoading(true);
    setTimeout(() => {
      const userSession = {
        email: DEMO_EMAIL,
        role: 'Developer',
        name: 'Demo Developer',
        isDemoAccount: true,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('devtwin_auth', JSON.stringify(userSession));
      setLoading(false);
      onLoginSuccess(userSession);
    }, 450);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    if (email.toLowerCase().trim() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setLoading(true);
      setTimeout(() => {
        const userSession = {
          email: DEMO_EMAIL,
          role: 'Developer',
          name: 'Demo Developer',
          isDemoAccount: true,
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem('devtwin_auth', JSON.stringify(userSession));
        setLoading(false);
        onLoginSuccess(userSession);
      }, 350);
    } else {
      setError('Invalid credentials. Use demo account: developer@devtwin.ai / demo123');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        background: '#08090C',
        backgroundImage:
          'radial-gradient(circle at 50% 15%, rgba(239, 68, 68, 0.12) 0%, transparent 55%), radial-gradient(circle at 85% 80%, rgba(220, 38, 38, 0.08) 0%, transparent 40%)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Background Grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <div
        className="card-enter"
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'rgba(17, 19, 25, 0.88)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 32px rgba(239, 68, 68, 0.15)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          zIndex: 1,
          position: 'relative',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', marginBottom: 12 }}>
            <DevTwinLogo size={44} withText={true} subtitle={true} />
          </div>
          <p style={{ fontSize: '0.86rem', color: '#94A3B8', marginTop: 8 }}>
            Sign in to access your codebase intelligence twin.
          </p>
        </div>

        {/* Highlighted Demo Account Card for Hackathon Judges */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.05) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 14,
            padding: '16px 18px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Sparkles size={13} />
              Demo Account (Judges)
            </span>
            <span
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#F87171',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: '0.68rem',
                fontWeight: 700,
              }}
            >
              Role: Developer
            </span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.76rem',
              color: '#CBD5E1',
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            <div>Email: <strong style={{ color: '#FFFFFF' }}>{DEMO_EMAIL}</strong></div>
            <div>Password: <strong style={{ color: '#FFFFFF' }}>{DEMO_PASSWORD}</strong></div>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleUseDemoAccount}
            disabled={loading}
            style={{
              width: '100%',
              height: 38,
              fontSize: '0.84rem',
              fontWeight: 700,
              gap: 8,
            }}
          >
            <Sparkles size={15} />
            {loading && autoFilled ? 'Logging in as Developer…' : 'Use Demo Account (1-Click)'}
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 22,
            color: '#64748B',
            fontSize: '0.74rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
          <span>or sign in manually</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#94A3B8',
                marginBottom: 6,
                letterSpacing: '0.02em',
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@devtwin.ai"
                className="input-box"
                style={{
                  width: '100%',
                  paddingLeft: 34,
                  height: 38,
                  fontSize: '0.82rem',
                }}
              />
              <Mail
                size={15}
                color="#64748B"
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#94A3B8',
                marginBottom: 6,
                letterSpacing: '0.02em',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="input-box"
                style={{
                  width: '100%',
                  paddingLeft: 34,
                  height: 38,
                  fontSize: '0.82rem',
                }}
              />
              <Lock
                size={15}
                color="#64748B"
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.75rem',
                color: '#F87171',
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-secondary"
            disabled={loading}
            style={{
              width: '100%',
              height: 40,
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#FFFFFF',
              marginTop: 4,
            }}
          >
            {loading ? 'Authenticating…' : 'Sign In as Developer'}
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Security / Privacy assurance */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: '0.72rem',
            color: '#64748B',
          }}
        >
          <ShieldCheck size={14} color="#10B981" />
          <span>Local-first sandbox · Zero cloud token exposure</span>
        </div>
      </div>
    </div>
  );
}
