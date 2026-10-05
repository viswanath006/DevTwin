import React, { useRef } from 'react';
import { RefreshCw, Upload, Sparkles } from 'lucide-react';

const HEADINGS = {
  dashboard: {
    title: (
      <>
        Why is <span className="serif-italic" style={{ color: '#F1F5F9', fontWeight: 400 }}>login</span> failing?
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
        Change Impact — Predict what <span className="serif-italic" style={{ color: '#C084FC', fontWeight: 400 }}>breaks</span> before shipping.
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
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, padding: '0 4px' }}>
      {/* Left: Project tag, Serif Headline, Subtitle */}
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
          {headingInfo.title}
        </h1>

        <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginTop: 6, fontWeight: 400 }}>
          {headingInfo.subtitle}
        </p>
      </div>

      {/* Right: Switcher Pills + Scan/Demo buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        {/* Navigation Pills */}
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            background: activeTab === 'dashboard' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'dashboard' ? '#0F172A' : '#CBD5E1',
            border: activeTab === 'dashboard' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            padding: '6px 18px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Twin
        </button>

        <button
          onClick={() => setActiveTab('debugger')}
          style={{
            background: activeTab === 'debugger' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'debugger' ? '#0F172A' : '#CBD5E1',
            border: activeTab === 'debugger' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
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
          onClick={() => setActiveTab('impact')}
          style={{
            background: activeTab === 'impact' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'impact' ? '#0F172A' : '#CBD5E1',
            border: activeTab === 'impact' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
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
          onClick={() => setActiveTab('security')}
          style={{
            background: activeTab === 'security' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'security' ? '#0F172A' : '#CBD5E1',
            border: activeTab === 'security' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            padding: '6px 18px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Security
        </button>

        {/* Runs locally badge */}
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

        {/* Scan & Demo Quick Actions */}
        <button
          onClick={() => onScan()}
          disabled={isScanning}
          title="Re-scan codebase"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#CBD5E1',
            borderRadius: 20,
            padding: '6px 12px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <RefreshCw size={12} className={isScanning ? 'spin' : ''} />
          {isScanning ? 'Scanning…' : 'Scan'}
        </button>

        <button
          onClick={() => onLoadDemo()}
          disabled={isScanning}
          title="Load built-in SaaS demo project"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 142, 83, 0.15) 100%)',
            border: '1px solid rgba(255, 107, 107, 0.4)',
            color: '#FF8E53',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
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
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94A3B8',
            borderRadius: 20,
            padding: '6px 10px',
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          <Upload size={12} />
        </button>
      </div>
    </div>
  );
}
