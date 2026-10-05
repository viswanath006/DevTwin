import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  FlaskConical,
  Package,
  FileCode2,
  ChevronRight,
  ExternalLink,
  X,
  Sparkles,
  Bug,
  Activity,
} from 'lucide-react';
import { api } from '../api/client';

export default function CodebaseHealthCard({
  scanData,
  setActiveTab,
  onNavigateToDebugger,
  onNavigateToVerification,
}) {
  const [healthScore, setHealthScore] = useState(scanData?.healthScore || null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with scanData.healthScore or fetch from backend if absent
  useEffect(() => {
    if (scanData?.healthScore) {
      setHealthScore(scanData.healthScore);
    } else if (scanData?.rootPath) {
      setIsLoading(true);
      api
        .getCodebaseHealthScore()
        .then((res) => {
          if (res?.success) setHealthScore(res.data);
        })
        .catch((err) => {
          console.warn('[CodebaseHealthCard fetch error]:', err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [scanData]);

  if (!healthScore && !isLoading) {
    return null;
  }

  const score = healthScore?.score ?? 85;
  const grade = healthScore?.grade || 'B';
  const statusText = healthScore?.statusText || 'GOOD';
  const categories = healthScore?.categories || {};
  const topReasons = healthScore?.topReasons || [];

  // Determine circular dial color class
  let dialClass = 'health-good';
  if (score >= 90) dialClass = 'health-excellent';
  else if (score >= 80) dialClass = 'health-good';
  else if (score >= 65) dialClass = 'health-needs-attention';
  else dialClass = 'health-critical';

  const categoryOrder = ['security', 'testing', 'architecture', 'dependencies', 'codeQuality'];
  const categoryIcons = {
    security: ShieldAlert,
    testing: FlaskConical,
    architecture: Layers,
    dependencies: Package,
    codeQuality: FileCode2,
  };

  const selectedCategory = selectedCategoryKey ? categories[selectedCategoryKey] : null;

  return (
    <div className="codebase-health-wrapper">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.06em', color: '#fff', textTransform: 'uppercase' }}>
              CODEBASE HEALTH
            </h3>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                color: 'var(--accent-cyan)',
              }}
            >
              Phase 12 Unified Index
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Composite integrity score calculated from real AST parsing, security audits, test harnesses, and architecture.
          </p>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Updated automatically on repository rescan
        </div>
      </div>

      {/* Main 3-Column Layout: Visual Dial, 5 Categories, Top 3 Reasons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr 1fr',
          gap: '24px',
          alignItems: 'stretch',
        }}
      >
        {/* 1. VISUAL HEALTH INDICATOR & SCORE DIAL */}
        <div className="health-dial-box">
          <div className={`health-dial-circle ${dialClass}`}>
            <span style={{ fontSize: '2.1rem', fontWeight: 900, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
              / 100
            </span>
            <span
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'var(--bg-main)',
                border: '2px solid currentColor',
                borderRadius: '12px',
                padding: '1px 8px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {grade}
            </span>
          </div>

          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color:
                score >= 90
                  ? 'var(--accent-emerald)'
                  : score >= 80
                  ? 'var(--accent-cyan)'
                  : score >= 65
                  ? 'var(--accent-amber)'
                  : 'var(--accent-rose)',
              marginTop: '12px',
              textAlign: 'center',
            }}
          >
            {statusText}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center' }}>
            Health Assessment
          </div>
        </div>

        {/* 2. 5 CORE HEALTH CATEGORIES (CLICKABLE) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
            Category Integrity (Click to inspect findings):
          </div>

          {categoryOrder.map((key) => {
            const cat = categories[key];
            if (!cat) return null;
            const Icon = categoryIcons[key] || Activity;
            const isGood = cat.icon === 'check' || cat.deduction === 0;
            const isCritical = cat.icon === 'critical' || cat.status === 'Critical' || cat.status === 'Failing';

            return (
              <div
                key={key}
                className={`health-category-item ${selectedCategoryKey === key ? 'active' : ''}`}
                onClick={() => setSelectedCategoryKey(key)}
                title={`Click to inspect ${cat.name} details and underlying findings`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      color: isGood
                        ? 'var(--accent-emerald)'
                        : isCritical
                        ? 'var(--accent-rose)'
                        : 'var(--accent-amber)',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                    }}
                  >
                    {isGood ? '✓' : '⚠'}
                  </span>
                  <Icon size={15} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                    {cat.name}:
                  </span>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: isGood
                        ? 'var(--accent-emerald)'
                        : isCritical
                        ? 'var(--accent-rose)'
                        : 'var(--accent-amber)',
                      fontWeight: isGood ? 500 : 700,
                    }}
                  >
                    {cat.label.replace(/^[✓⚠ℹ]\s*[A-Za-z\s]+:\s*/, '')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {cat.deduction > 0 && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--accent-rose)',
                        background: 'rgba(244, 63, 94, 0.15)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      -{cat.deduction}
                    </span>
                  )}
                  <ChevronRight size={13} color="var(--text-muted)" />
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. TOP 3 REASONS AFFECTING THE SCORE */}
        <div className="health-reasons-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={12} color="var(--accent-cyan)" />
            Top 3 Factors Driving Score:
          </div>

          <div>
            {topReasons.map((reason, idx) => {
              const isGood = reason.severity === 'GOOD';
              const isCrit = reason.severity === 'CRITICAL';
              return (
                <div
                  key={idx}
                  className={`health-reason-pill ${isCrit ? 'critical' : isGood ? 'good' : 'warning'}`}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      color: isGood
                        ? 'var(--accent-emerald)'
                        : isCrit
                        ? 'var(--accent-rose)'
                        : 'var(--accent-amber)',
                      flexShrink: 0,
                    }}
                  >
                    {reason.icon}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.78rem' }}>{reason.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* INTERACTIVE CATEGORY FINDINGS MODAL / DRAWER */}
      {selectedCategory && (
        <div className="health-modal-overlay" onClick={() => setSelectedCategoryKey(null)}>
          <div className="health-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div
              className="panel-header"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                  {selectedCategory.name} Integrity Findings
                </span>
                <span
                  className={`badge ${
                    selectedCategory.status === 'Good'
                      ? 'badge-emerald'
                      : selectedCategory.status === 'Critical' || selectedCategory.status === 'Failing'
                      ? 'badge-rose'
                      : 'badge-amber'
                  }`}
                  style={{ fontSize: '0.72rem' }}
                >
                  {selectedCategory.status}
                </span>
                {selectedCategory.deduction > 0 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                    (-{selectedCategory.deduction} pts)
                  </span>
                )}
              </div>

              <button
                className="btn-secondary"
                style={{ height: '28px', padding: '0 8px' }}
                onClick={() => setSelectedCategoryKey(null)}
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="panel-body" style={{ padding: '20px', overflowY: 'auto', maxHeight: '55vh' }}>
              {/* Category-Specific Findings */}

              {/* 1. SECURITY FINDINGS */}
              {selectedCategoryKey === 'security' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Identified {selectedCategory.details.critical} Critical, {selectedCategory.details.high} High, {selectedCategory.details.medium} Medium issues.
                    </div>
                    {setActiveTab && (
                      <button
                        className="btn-primary"
                        style={{ height: '30px', fontSize: '0.75rem', gap: '6px' }}
                        onClick={() => {
                          setSelectedCategoryKey(null);
                          setActiveTab('security');
                        }}
                      >
                        <ShieldAlert size={13} />
                        View in AI Security Scanner
                      </button>
                    )}
                  </div>

                  {selectedCategory.details.findings.length === 0 ? (
                    <div style={{ color: 'var(--accent-emerald)', padding: '20px', textAlign: 'center' }}>
                      ✓ Zero vulnerabilities detected across 10 security vectors.
                    </div>
                  ) : (
                    selectedCategory.details.findings.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 14px',
                          marginBottom: '8px',
                          borderLeft: `3px solid ${f.severity === 'CRITICAL' ? 'var(--accent-rose)' : 'var(--accent-amber)'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{f.title}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                            {f.file}:{f.line}
                          </span>
                        </div>
                        {f.evidence && (
                          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '4px' }}>
                            {f.evidence}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 2. TESTING FINDINGS */}
              {selectedCategoryKey === 'testing' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {selectedCategory.details.suitesCount} test suites, {selectedCategory.details.assertionsCount} total assertions.
                    </div>
                    {setActiveTab && (
                      <button
                        className="btn-primary"
                        style={{ height: '30px', fontSize: '0.75rem', gap: '6px' }}
                        onClick={() => {
                          setSelectedCategoryKey(null);
                          setActiveTab('verification');
                        }}
                      >
                        <FlaskConical size={13} />
                        Open Test & Verification
                      </button>
                    )}
                  </div>

                  {/* Explicit Non-Fabrication Notice for Line Coverage */}
                  <div
                    style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.8rem',
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    <Info size={16} />
                    <span>
                      <strong>Coverage Status:</strong> {selectedCategory.details.coverageNote}
                    </span>
                  </div>

                  {selectedCategory.details.tests.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 14px',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                          {t.file}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Framework: {t.framework || 'Detected test runner'}
                        </div>
                      </div>
                      <span className="badge badge-purple">{t.assertions} assertions</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. ARCHITECTURE FINDINGS */}
              {selectedCategoryKey === 'architecture' && (
                <div>
                  <div style={{ marginBottom: '14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Architecture Pattern: <strong style={{ color: '#fff' }}>{selectedCategory.details.architectureType}</strong>
                  </div>

                  {selectedCategory.details.risks.length === 0 ? (
                    <div style={{ color: 'var(--accent-emerald)', padding: '20px', textAlign: 'center' }}>
                      ✓ Clean architectural layers and decoupled services.
                    </div>
                  ) : (
                    selectedCategory.details.risks.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '12px 14px',
                          marginBottom: '8px',
                          borderLeft: '3px solid var(--accent-amber)',
                        }}
                      >
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '4px' }}>
                          {r.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          {r.description}
                        </div>
                        {r.recommendation && (
                          <div style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
                            Remediation: {r.recommendation}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 4. DEPENDENCY FINDINGS */}
              {selectedCategoryKey === 'dependencies' && (
                <div>
                  <div style={{ marginBottom: '14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Audited <strong style={{ color: '#fff' }}>{selectedCategory.details.totalDependencies} packages</strong> across manifests ({selectedCategory.details.manifestsFound.join(', ')}).
                  </div>

                  {selectedCategory.details.vulnerablePackages.length === 0 ? (
                    <div style={{ color: 'var(--accent-emerald)', padding: '20px', textAlign: 'center' }}>
                      ✓ Zero known CVEs or vulnerable dependencies detected.
                    </div>
                  ) : (
                    selectedCategory.details.vulnerablePackages.map((v, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '12px 14px',
                          marginBottom: '8px',
                          borderLeft: '3px solid var(--accent-rose)',
                        }}
                      >
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-rose)' }}>{v.title}</div>
                        <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', margin: '4px 0' }}>
                          {v.file} | {v.evidence}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>{v.recommendation}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 5. CODE QUALITY FINDINGS */}
              {selectedCategoryKey === 'codeQuality' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div className="card" style={{ padding: '10px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Files</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{selectedCategory.details.totalFiles}</div>
                    </div>
                    <div className="card" style={{ padding: '10px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Lines</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{selectedCategory.details.totalLines?.toLocaleString()}</div>
                    </div>
                    <div className="card" style={{ padding: '10px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg Lines/File</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{selectedCategory.details.avgLinesPerFile}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      marginBottom: '10px',
                    }}
                  >
                    ℹ <strong>Duplication Analysis:</strong> {selectedCategory.details.duplicationNote}
                  </div>

                  {selectedCategory.details.signals.length === 0 ? (
                    <div style={{ color: 'var(--accent-emerald)', padding: '12px', textAlign: 'center' }}>
                      ✓ High modularity and healthy file size distribution.
                    </div>
                  ) : (
                    selectedCategory.details.signals.map((sig, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 14px',
                          marginBottom: '8px',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        • {sig}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
