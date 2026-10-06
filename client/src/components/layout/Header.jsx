import React, { useRef } from 'react';
import { RefreshCw, Upload, Sparkles, User, LogOut } from 'lucide-react';
import DevTwinLogo from '../common/DevTwinLogo';

const HEADINGS = {
  dashboard: {
    title: (
      <>
        Why is <span className="serif-italic" style={{ color: '#F87171', fontWeight: 400 }}>login</span> failing?
      </>
    ),
    subtitle: 'POST /api/login returned 500 — traced across 5 layers of your codebase.',
  },
  debugger: {
    title: (
      <>
        AI Debugger — Find the <span className="serif-italic" style={{ color: '#FED7AA', fontWeight: 400 }}>root cause</span> & verify.
      </>
    ),
    subtitle: 'Trace error propagation across AST dependency graphs and generate verified patches.',
  },
  impact: {
    title: (
      <>
        Change Impact — Predict what <span className="serif-italic" style={{ color: '#F87171', fontWeight: 400 }}>breaks</span> before shipping.
      </>
    ),
    subtitle: 'AST blast-radius analysis across APIs, services, and regression suites.',
  },
  security: {
    title: (
      <>
        Security Scanner — Codebase <span className="serif-italic" style={{ color: '#67E8F9', fontWeight: 400 }}>vulnerability</span> audit.
      </>
    ),
    subtitle: 'OWASP Top 10, hardcoded secrets, injection vectors, and broken access control.',
  },
  architecture: {
    title: (
      <>
        Architecture Drift — Expected vs. <span className="serif-italic" style={{ color: '#FDE047', fontWeight: 400 }}>actual</span> topology.
      </>
    ),
    subtitle: 'Detect architectural contract violations, bypassing layers, and unauthorized coupling.',
  },
  whatif: {
    title: (
      <>
        What-If Analysis — Speculative <span className="serif-italic" style={{ color: '#A78BFA', fontWeight: 400 }}>architecture</span> simulation.
      </>
    ),
    subtitle: 'Simulate auth migrations, database transitions, and caching layers before committing.',
  },
  ask: {
    title: (
      <>
        Ask Codebase — Natural language <span className="serif-italic" style={{ color: '#6EE7B7', fontWeight: 400 }}>codebase</span> intelligence.
      </>
    ),
    subtitle: 'Grounded Q&A with AST context, symbol resolution, and file citations.',
  },
  review: {
    title: (
      <>
        Code Review — Grounded <span className="serif-italic" style={{ color: '#93C5FD', fontWeight: 400 }}>pull request</span> auditor.
      </>
    ),
    subtitle: 'Automated code quality, security, and performance reviews with fix suggestions.',
  },
  git: {
    title: (
      <>
        Git Intelligence — Commit churn & <span className="serif-italic" style={{ color: '#FCA5A5', fontWeight: 400 }}>hotspot</span> analysis.
      </>
    ),
    subtitle: 'Identify fragile components, ownership distribution, and change frequency.',
  },
  verification: {
    title: (
      <>
        Test Verification — Sandboxed <span className="serif-italic" style={{ color: '#34D399', fontWeight: 400 }}>assertion</span> runner.
      </>
    ),
    subtitle: 'Strict anti-hallucination verification engine proving code correctness.',
  },
};

export default function Header({
  activeTab,
  setActiveTab,
  repoPath,
  onScan,
  onFolderUpload,
  onLoadDemo,
  isScanning,
  stats,
  currentUser,
  onLogout,
}) {
  const fileInputRef = useRef(null);

  const projectName = repoPath
    ? repoPath.split(/[/\\]/).filter(Boolean).pop()?.toUpperCase()
    : 'SHOP-API';

  const headingInfo = HEADINGS[activeTab] || HEADINGS.dashboard;

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = [];
    let projName = 'uploaded-project';
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = file.webkitRelativePath || file.name;
      if (!projName && relPath.includes('/')) projName = relPath.split('/')[0];
      if (file.size < 1024 * 1024) {
        try {
          const content = await file.text();
          fileArray.push({ path: relPath, content });
        } catch {}
      }
    }
    if (fileArray.length > 0) onFolderUpload(projName, fileArray);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 20,
        padding: '0 4px',
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      {/* Left: Project tag, Headline, Subtitle */}
      <div>
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#EF4444',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <DevTwinLogo size={16} />
          <span>DEVTWIN · {projectName}</span>
        </div>

        <h1
          style={{
            fontSize: '2.05rem',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            marginTop: 4,
          }}
        >
          {headingInfo.title}
        </h1>

        <p style={{ fontSize: '0.86rem', color: '#94A3B8', marginTop: 4, fontWeight: 400 }}>
          {headingInfo.subtitle}
        </p>
      </div>

      {/* Right: Switcher Pills + User Status + Scan/Demo buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
        {/* Navigation Pills */}
        {[
          { id: 'dashboard', label: 'Twin' },
          { id: 'debugger', label: 'Debug' },
          { id: 'impact', label: 'Impact' },
          { id: 'security', label: 'Security' },
          { id: 'verification', label: 'Verify' },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(14px) saturate(180%)',
                WebkitBackdropFilter: 'blur(14px) saturate(180%)',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                border: isActive ? '1px solid rgba(255, 120, 120, 0.45)' : '1px solid rgba(255, 255, 255, 0.09)',
                boxShadow: isActive
                  ? 'inset 0 1px 1px rgba(255, 255, 255, 0.4), 0 4px 14px rgba(239, 68, 68, 0.35)'
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 6px rgba(0, 0, 0, 0.25)',
                borderRadius: 20,
                padding: '6px 16px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {item.label}
            </button>
          );
        })}

        {/* Demo Developer User Badge */}
        {currentUser && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              borderRadius: 20,
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.74rem',
              color: '#F87171',
            }}
          >
            <User size={12} />
            <span>Developer</span>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign out of demo account"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: 2,
                }}
              >
                <LogOut size={12} />
              </button>
            )}
          </div>
        )}

        {/* Runs locally badge */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            color: '#34D399',
            borderRadius: 20,
            padding: '5px 12px',
            fontSize: '0.74rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 8px #10B981',
            }}
          />
          Runs locally
        </div>

        {/* Scan & Demo Quick Actions */}
        <button
          onClick={() => onScan()}
          disabled={isScanning}
          title="Re-scan codebase"
          className="btn-secondary"
          style={{ height: 32, padding: '0 12px', fontSize: '0.76rem', borderRadius: 20 }}
        >
          <RefreshCw size={12} className={isScanning ? 'spin' : ''} />
          {isScanning ? 'Scanning…' : 'Scan'}
        </button>

        <button
          onClick={() => onLoadDemo()}
          disabled={isScanning}
          title="Load built-in SaaS demo project"
          className="btn-primary"
          style={{ height: 32, padding: '0 14px', fontSize: '0.76rem', borderRadius: 20 }}
        >
          <Sparkles size={12} />
          Demo
        </button>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          title="Upload project folder"
          className="btn-secondary"
          style={{ height: 32, width: 34, padding: 0, borderRadius: 20, justifyContent: 'center' }}
        >
          <Upload size={12} />
        </button>
      </div>
    </div>
  );
}
