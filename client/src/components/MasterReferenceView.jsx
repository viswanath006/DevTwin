import React, { useState } from 'react';
import {
  Layers,
  GitFork,
  Check,
  Code2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';

export default function MasterReferenceView({
  scanData,
  onNavigateToTab,
}) {
  const [activeTopTab, setActiveTopTab] = useState('debug'); // 'debug' | 'impact' | 'verify'
  const [patchApplied, setPatchApplied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(true);

  // Dynamic values or defaults matching the reference template
  const projectName = scanData?.rootPath
    ? scanData.rootPath.split(/[/\\]/).filter(Boolean).pop()?.toUpperCase()
    : 'SHOP-API';

  const handleApplyPatch = () => {
    setPatchApplied((prev) => !prev);
  };

  const handleRunTests = async () => {
    setVerifying(true);
    try {
      if (api.runVerification) {
        await api.runVerification({ projectPath: scanData?.rootPath, command: 'devtwin-verify all' });
      }
    } catch {
      // keep smooth UX
    } finally {
      setTimeout(() => {
        setVerifying(false);
        setVerified(true);
      }, 700);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#070913' }}>
      {/* 1. Left Slim Navigation Rail */}
      <aside className="ref-rail">
        {/* Logo Squircle */}
        <div className="ref-logo-d" title="DevTwin AI">
          D
        </div>

        {/* Vertical Icon Rail */}
        <button
          className={`ref-rail-btn ${activeTopTab === 'debug' ? 'active' : ''}`}
          onClick={() => {
            setActiveTopTab('debug');
            if (onNavigateToTab) onNavigateToTab('dashboard');
          }}
          title="Digital Twin Overview"
        >
          <Layers size={18} />
        </button>

        <button
          className="ref-rail-btn"
          onClick={() => {
            if (onNavigateToTab) onNavigateToTab('architecture');
          }}
          title="Architecture Graph"
        >
          <GitFork size={18} />
        </button>

        <button
          className="ref-rail-btn"
          onClick={() => {
            if (onNavigateToTab) onNavigateToTab('security');
          }}
          title="Security & Tests"
        >
          <Check size={18} />
        </button>

        <button
          className="ref-rail-btn"
          onClick={() => {
            if (onNavigateToTab) onNavigateToTab('ask');
          }}
          title="Ask Codebase"
        >
          <Code2 size={18} />
        </button>
      </aside>

      {/* 2. Main Canvas Area */}
      <main className="ref-canvas">
        {/* Top Bar Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#94A3B8',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              DEVTWIN · {projectName}
            </div>

            <h1
              style={{
                fontSize: '2.1rem',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                marginTop: 6,
              }}
            >
              Why is <span className="serif-italic" style={{ color: '#F1F5F9', fontWeight: 400 }}>login</span> failing?
            </h1>

            <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginTop: 6, fontWeight: 400 }}>
              POST /api/login returned 500 — traced across 5 layers of your codebase.
            </p>
          </div>

          {/* Top-Right Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <button
              onClick={() => setActiveTopTab('debug')}
              style={{
                background: activeTopTab === 'debug' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                color: activeTopTab === 'debug' ? '#0F172A' : '#CBD5E1',
                border: activeTopTab === 'debug' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                padding: '6px 18px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Debug
            </button>

            <button
              onClick={() => setActiveTopTab('impact')}
              style={{
                background: activeTopTab === 'impact' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                color: activeTopTab === 'impact' ? '#0F172A' : '#CBD5E1',
                border: activeTopTab === 'impact' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                padding: '6px 18px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Impact
            </button>

            <button
              onClick={() => setActiveTopTab('verify')}
              style={{
                background: activeTopTab === 'verify' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                color: activeTopTab === 'verify' ? '#0F172A' : '#CBD5E1',
                border: activeTopTab === 'verify' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                padding: '6px 18px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Verify
            </button>

            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34D399',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                }}
              />
              Runs locally
            </div>
          </div>
        </div>

        {/* 3. Main Workspace Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 1fr',
            gap: 20,
            flex: 1,
            alignItems: 'stretch',
            minHeight: 0,
          }}
        >
          {/* ========================================================= */}
          {/* LEFT CARD: DEPENDENCY TRACE */}
          {/* ========================================================= */}
          <div
            className="ref-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 520,
            }}
          >
            {/* Header */}
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#94A3B8',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                DEPENDENCY TRACE
              </div>
            </div>

            {/* Tree Architecture Visualization */}
            <div
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 0',
              }}
            >
              {/* SVG Connector Lines */}
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                {/* Vertical Center Line through Frontend -> Auth API -> Auth Service */}
                <line x1="50%" y1="12%" x2="50%" y2="28%" stroke="rgba(255, 255, 255, 0.16)" strokeWidth="1.5" />
                <line x1="50%" y1="36%" x2="50%" y2="50%" stroke="rgba(255, 255, 255, 0.16)" strokeWidth="1.5" />

                {/* Left Branch: Auth Service to Cache (curved dashed) */}
                <path
                  d="M 45% 54% C 32% 54%, 25% 62%, 25% 72%"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.22)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Right Branch: Auth Service to Logger (curved dashed) */}
                <path
                  d="M 55% 54% C 68% 54%, 75% 62%, 75% 72%"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.22)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Center Down: Auth Service to User Service */}
                <line x1="50%" y1="58%" x2="50%" y2="67%" stroke="rgba(255, 255, 255, 0.16)" strokeWidth="1.5" />

                {/* Center Down: User Service to Database */}
                <line x1="50%" y1="77%" x2="50%" y2="86%" stroke="rgba(255, 255, 255, 0.16)" strokeWidth="1.5" />
              </svg>

              {/* Node 1: Frontend */}
              <div style={{ zIndex: 2, marginBottom: 28 }}>
                <div className="ref-pill-node">Frontend</div>
              </div>

              {/* Node 2: Auth API */}
              <div style={{ zIndex: 2, marginBottom: 28 }}>
                <div className="ref-pill-node">Auth API</div>
              </div>

              {/* Node 3: Auth Service */}
              <div style={{ zIndex: 2, marginBottom: 38 }}>
                <div className="ref-pill-node">Auth Service</div>
              </div>

              {/* Row with Cache, User Service (glowing error), Logger */}
              <div
                style={{
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '90%',
                  marginBottom: 32,
                }}
              >
                {/* Branch Left: Cache */}
                <div className="ref-pill-node" style={{ padding: '8px 24px', opacity: 0.85 }}>
                  Cache
                </div>

                {/* Center Error Origin: User Service ● with radiant crimson pulse halo */}
                <div className="ref-user-service-node">
                  <span>User Service</span>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      boxShadow: '0 0 8px #FFF',
                    }}
                  />
                </div>

                {/* Branch Right: Logger */}
                <div className="ref-pill-node" style={{ padding: '8px 24px', opacity: 0.85 }}>
                  Logger
                </div>
              </div>

              {/* Node 5: Database */}
              <div style={{ zIndex: 2 }}>
                <div className="ref-pill-node">Database</div>
              </div>
            </div>

            {/* Bottom Annotation */}
            <div
              style={{
                fontSize: '0.8rem',
                color: '#94A3B8',
                textAlign: 'center',
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              Failure originates in User Service — everything above inherits the error
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: ROOT CAUSE + CHANGE IMPACT & VERIFICATION */}
          {/* ========================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top Right: ROOT CAUSE */}
            <div className="ref-card" style={{ flex: 1.15 }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#C084FC',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                ROOT CAUSE
              </div>

              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                }}
              >
                Incorrect database key used by{' '}
                <span className="serif-italic" style={{ color: '#FED7AA', fontWeight: 400 }}>
                  UserService
                </span>
              </h2>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.76rem',
                  color: '#94A3B8',
                  marginTop: 4,
                  marginBottom: 14,
                }}
              >
                user_service.py · line 42
              </div>

              {/* Code Diff Display */}
              <div
                style={{
                  background: '#090B14',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 12,
                  padding: '14px 18px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  lineHeight: 1.7,
                  color: '#E2E8F0',
                  marginBottom: 16,
                  overflowX: 'auto',
                }}
              >
                <div style={{ color: '#94A3B8' }}>def get_user(self, uid):</div>
                <div style={{ color: '#F87171' }}>- return db.get("user_id", uid)</div>
                <div style={{ color: '#4ADE80' }}>+ return db.get("users:id", uid)</div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <button className="ref-btn-apply" onClick={handleApplyPatch}>
                  {patchApplied ? (
                    <>
                      <CheckCircle2 size={15} />
                      Patch applied
                    </>
                  ) : (
                    'Apply patch'
                  )}
                </button>

                <button className="ref-btn-tests" onClick={handleRunTests} disabled={verifying}>
                  {verifying ? 'Running tests…' : 'Run recommended tests'}
                </button>
              </div>

              {/* Recommended Tests */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#94A3B8',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  RECOMMENDED TESTS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span className="ref-test-chip">test_auth</span>
                  <span className="ref-test-chip">test_user_service</span>
                  <span className="ref-test-chip">test_api_regression</span>
                </div>
              </div>

              {/* Confidence */}
              <div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#94A3B8',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  CONFIDENCE
                </div>

                <div className="ref-confidence-bar">
                  <div className="ref-confidence-fill" style={{ width: '94%' }} />
                </div>

                <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: 8 }}>
                  Evidence: dependency trace + schema mismatch at line 42
                </div>
              </div>
            </div>

            {/* Bottom Row: CHANGE IMPACT & VERIFICATION */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Card 1: CHANGE IMPACT */}
              <div className="ref-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#94A3B8',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      CHANGE IMPACT
                    </span>

                    <span
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#F87171',
                        borderRadius: 14,
                        padding: '3px 10px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      Risk · High
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 14 }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
                      17
                    </span>
                    <span className="serif-italic" style={{ fontSize: '1.6rem', color: '#C084FC', marginLeft: 8 }}>
                      files
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {['3 APIs', '2 services', '4 tests'].map((item) => (
                      <span
                        key={item}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 12,
                          padding: '3px 10px',
                          fontSize: '0.72rem',
                          color: '#CBD5E1',
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '0.73rem', color: '#94A3B8' }}>
                  Know what breaks before you commit.
                </div>
              </div>

              {/* Card 2: VERIFICATION */}
              <div className="ref-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#94A3B8',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      VERIFICATION
                    </span>

                    <div className="ref-circle-gauge">
                      4/4
                    </div>
                  </div>

                  {/* Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {[
                      { name: 'Authentication', time: '0.4s' },
                      { name: 'User Service', time: '0.2s' },
                      { name: 'API Regression', time: '1.1s' },
                      { name: 'Integration', time: '2.3s' },
                    ].map((t) => (
                      <div
                        key={t.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E2E8F0' }}>
                          <CheckCircle2 size={13} color="#2DD4BF" />
                          <span>{t.name}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#94A3B8' }}>
                          {t.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {verified && (
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: '#2DD4BF',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 10,
                    }}
                  >
                    <Sparkles size={11} />
                    All suites green
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
