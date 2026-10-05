import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Globe,
  Layers,
  Check,
  Copy,
  Info,
  ArrowRight,
  ShieldAlert,
  Flame,
  Activity,
  Server,
  Zap,
} from 'lucide-react';
import { api } from '../../api/client';

export default function WhatIfAnalysisView({
  scanData,
  onNavigateToCodebase,
  onNavigateToDebugger,
}) {
  const [proposedChange, setProposedChange] = useState(
    'Replace JWT authentication with OAuth'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [filterConfidence, setFilterConfidence] = useState('ALL'); // 'ALL' | 'Confirmed' | 'Likely' | 'Potential'
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'files' | 'apis' | 'services' | 'tests'
  const [copiedActions, setCopiedActions] = useState(false);

  const presets = [
    {
      title: 'Replace JWT with OAuth',
      prompt: 'Replace JWT authentication with OAuth',
      badge: 'Auth Architecture',
    },
    {
      title: 'Migrate SQLite to PostgreSQL',
      prompt: 'Migrate database from SQLite to PostgreSQL with connection pooling',
      badge: 'Database',
    },
    {
      title: 'Add Multi-Tenant Organization ID',
      prompt: 'Add multi-tenant organizationId filter to all User queries and sessions',
      badge: 'Data Model',
    },
    {
      title: 'Introduce Redis Caching',
      prompt: 'Introduce Redis caching layer in front of Database for user profiles',
      badge: 'Performance',
    },
  ];

  const handleSimulate = async (changeToRun) => {
    const textToSimulate = changeToRun || proposedChange;
    if (!textToSimulate.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.simulateWhatIf({
        proposedChange: textToSimulate.trim(),
        rootPath: scanData?.rootPath,
      });

      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error || 'Failed to simulate change.');
      }
    } catch (err) {
      console.error('What-If simulation error:', err);
      setError(err.message || 'Error communicating with simulation engine.');
    } finally {
      setLoading(false);
    }
  };

  // Initial simulation on mount
  useEffect(() => {
    if (scanData && !result) {
      handleSimulate();
    }
  }, [scanData]);

  const handleCopyActions = () => {
    if (!result?.recommendedActions) return;
    const text = result.recommendedActions.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedActions(true);
    setTimeout(() => setCopiedActions(false), 2000);
  };

  const getConfidenceBadge = (confidence) => {
    switch (confidence) {
      case 'Confirmed':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            Confirmed
          </span>
        );
      case 'Likely':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            Likely
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              color: 'var(--accent-purple)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            Potential
          </span>
        );
    }
  };

  const getRiskBadge = (risk) => {
    const r = (risk || 'HIGH').toUpperCase();
    const isCritical = r === 'CRITICAL';
    const isHigh = r === 'HIGH';
    const isMedium = r === 'MEDIUM';

    const bg = isCritical || isHigh ? 'rgba(244, 63, 94, 0.15)' : isMedium ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';
    const color = isCritical || isHigh ? 'var(--accent-rose)' : isMedium ? 'var(--accent-amber)' : 'var(--accent-emerald)';
    const border = isCritical || isHigh ? 'rgba(244, 63, 94, 0.4)' : isMedium ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)';

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '0.82rem',
          fontWeight: 800,
          backgroundColor: bg,
          border: `1px solid ${border}`,
          color,
          letterSpacing: '0.04em',
        }}
      >
        <Flame size={15} color={color} />
        RISK: {r}
      </span>
    );
  };

  const filteredFiles = (result?.affectedFiles || []).filter(
    (f) => filterConfidence === 'ALL' || f.confidence === filterConfidence
  );
  const filteredApis = (result?.affectedAPIs || []).filter(
    (a) => filterConfidence === 'ALL' || a.confidence === filterConfidence
  );
  const filteredComponents = (result?.affectedComponents || []).filter(
    (c) => filterConfidence === 'ALL' || c.confidence === filterConfidence
  );
  const filteredTests = (result?.affectedTests || []).filter(
    (t) => filterConfidence === 'ALL' || t.confidence === filterConfidence
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Simulation Scenario Configurator */}
      <div className="panel-container" style={{ background: 'var(--gradient-card)' }}>
        <div className="panel-header" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
              WHAT-IF ANALYSIS — PREDICTIVE CHANGE SIMULATION
            </span>
          </div>

          <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
            Read-Only Sandbox (No files modified)
          </span>
        </div>

        <div className="panel-body" style={{ padding: '20px' }}>
          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Quick Scenarios:
            </span>
            {presets.map((p) => (
              <button
                key={p.title}
                type="button"
                className="btn-secondary"
                style={{
                  height: '28px',
                  fontSize: '0.74rem',
                  padding: '0 10px',
                  backgroundColor: proposedChange === p.prompt ? 'rgba(0, 242, 254, 0.15)' : 'var(--bg-input)',
                  borderColor: proposedChange === p.prompt ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                  color: proposedChange === p.prompt ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                }}
                onClick={() => {
                  setProposedChange(p.prompt);
                  handleSimulate(p.prompt);
                }}
              >
                <Zap size={12} color="var(--accent-cyan)" />
                {p.title}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSimulate();
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Proposed Change:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="text-input"
                  value={proposedChange}
                  onChange={(e) => setProposedChange(e.target.value)}
                  placeholder="Describe proposed modification (e.g. 'I want to replace JWT authentication with OAuth.')"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '0.88rem',
                    fontFamily: 'var(--font-sans)',
                  }}
                  required
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Sparkles size={16} />
                  {loading ? 'Simulating...' : 'Simulate Impact'}
                </button>
              </div>
            </div>
          </form>

          {/* Important Disclaimer Notice */}
          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.78rem',
              color: 'var(--accent-amber)',
            }}
          >
            <Info size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>IMPORTANT:</strong> This is a prediction based on codebase digital twin analysis, not a confirmed result. Predictions are categorized as <strong>Confirmed</strong>, <strong>Likely</strong>, and <strong>Potential</strong>. DevTwin never modifies the actual project during What-If Analysis.
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Simulation Result Presentation */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Result Card */}
          <div className="panel-container" style={{ border: '1px solid var(--border-subtle)', background: 'var(--gradient-card)' }}>
            <div className="panel-header" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  WHAT-IF ANALYSIS RESULT
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                  Proposed Change: {result.proposedChange}
                </div>
              </div>

              <div>{getRiskBadge(result.risk)}</div>
            </div>

            <div className="panel-body" style={{ padding: '20px' }}>
              {/* Predicted Impact Stat Counters */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Predicted Impact:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      {result.predictedImpact?.files || result.affectedFiles?.length || 0}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Files Affected
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                      {result.predictedImpact?.apis || result.affectedAPIs?.length || 0}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      APIs Touched
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                      {result.predictedImpact?.services || result.affectedComponents?.length || 0}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Services &amp; Core
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                      {result.predictedImpact?.tests || result.affectedTests?.length || 0}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Tests Impacted
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Grid: Potential Issues & Recommended Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Potential Issues */}
                <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--accent-rose)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} color="var(--accent-rose)" />
                    Potential Issues:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(result.potentialProblems || []).map((problem, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                        <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>•</span>
                        <span>{problem.replace(/^[•\s*-]+/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Actions */}
                <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                      Recommended Actions:
                    </div>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCopyActions}
                      style={{ height: '24px', padding: '0 8px', fontSize: '0.72rem' }}
                    >
                      {copiedActions ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                      {copiedActions ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(result.recommendedActions || []).map((action, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                          {idx + 1}.
                        </span>
                        <span>{action.replace(/^\d+[\.\)]\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confidence Filter Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Confidence Level:
                  </span>
                  {['ALL', 'Confirmed', 'Likely', 'Potential'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFilterConfidence(lvl)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: filterConfidence === lvl ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                        backgroundColor: filterConfidence === lvl ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                        color: filterConfidence === lvl ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                {/* Sub Tab Switcher */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { id: 'summary', label: 'All Items' },
                    { id: 'files', label: `Files (${filteredFiles.length})` },
                    { id: 'apis', label: `APIs (${filteredApis.length})` },
                    { id: 'services', label: `Services (${filteredComponents.length})` },
                    { id: 'tests', label: `Tests (${filteredTests.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        border: 'none',
                        backgroundColor: activeTab === tab.id ? 'var(--bg-active)' : 'transparent',
                        color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 1. Files */}
                {(activeTab === 'summary' || activeTab === 'files') && (
                  <div>
                    {activeTab === 'summary' && (
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Affected Files:
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filteredFiles.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: 'var(--bg-input)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileCode size={15} color="var(--accent-cyan)" />
                            <div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#fff' }}>
                                {f.file}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {f.reason}
                              </div>
                            </div>
                          </div>

                          <div>{getConfidenceBadge(f.confidence)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. APIs */}
                {(activeTab === 'summary' || activeTab === 'apis') && filteredApis.length > 0 && (
                  <div style={{ marginTop: activeTab === 'summary' ? '12px' : 0 }}>
                    {activeTab === 'summary' && (
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Affected APIs:
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filteredApis.map((apiItem, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: 'var(--bg-input)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Globe size={15} color="var(--accent-blue)" />
                            <div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#fff' }}>
                                <span style={{ color: 'var(--accent-amber)', fontWeight: 700, marginRight: '6px' }}>
                                  {apiItem.method}
                                </span>
                                {apiItem.path}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {apiItem.impact}
                              </div>
                            </div>
                          </div>

                          <div>{getConfidenceBadge(apiItem.confidence)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Components */}
                {(activeTab === 'summary' || activeTab === 'services') && filteredComponents.length > 0 && (
                  <div style={{ marginTop: activeTab === 'summary' ? '12px' : 0 }}>
                    {activeTab === 'summary' && (
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Affected Components &amp; Services:
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filteredComponents.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: 'var(--bg-input)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Layers size={15} color="var(--accent-purple)" />
                            <div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#fff' }}>
                                {c.name}
                                <span className="badge badge-purple" style={{ marginLeft: '8px', fontSize: '0.68rem' }}>
                                  {c.type}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {c.impact}
                              </div>
                            </div>
                          </div>

                          <div>{getConfidenceBadge(c.confidence)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Tests */}
                {(activeTab === 'summary' || activeTab === 'tests') && filteredTests.length > 0 && (
                  <div style={{ marginTop: activeTab === 'summary' ? '12px' : 0 }}>
                    {activeTab === 'summary' && (
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Affected Tests:
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filteredTests.map((t, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: 'var(--bg-input)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CheckCircle2 size={15} color="var(--accent-emerald)" />
                            <div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#fff' }}>
                                {t.file}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {t.impact}
                              </div>
                            </div>
                          </div>

                          <div>{getConfidenceBadge(t.confidence)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
