import React, { useState, useEffect } from 'react';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  ArrowDown,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Sliders,
  Database,
  Server,
  FileCode,
  ExternalLink,
  Plus,
  Trash2,
  HelpCircle,
  Activity,
  Workflow,
  Check,
} from 'lucide-react';
import { api } from '../api/client';

export default function ArchitectureView({
  scanData,
  onNavigateToCodebase,
  onNavigateToDebugger,
  onNavigateToImpact,
  onLoadDemo,
}) {
  const [activeTab, setActiveTab] = useState('drift'); // 'drift' | 'model' | 'rules'
  const [driftReport, setDriftReport] = useState(null);
  const [loadingDrift, setLoadingDrift] = useState(false);
  const [driftError, setDriftError] = useState(null);
  const [customRules, setCustomRules] = useState([]);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: 'Custom Constraint',
    sourceLayer: 'Controller',
    forbiddenTarget: 'Database',
    expectedRelationship: 'Controller\n↓\nService\n↓\nRepository\n↓\nDatabase',
    severity: 'HIGH',
    recommendation: 'Decouple presentation from persistence via domain service layers.',
  });

  const [aiArchitectureOverride, setAiArchitectureOverride] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch or evaluate architecture drift
  const fetchDriftReport = async (rulesToApply) => {
    if (!scanData?.rootPath) return;
    setLoadingDrift(true);
    setDriftError(null);
    try {
      const res = await api.getArchitectureDrift({
        rootPath: scanData.rootPath,
        rules: rulesToApply || customRules.length > 0 ? customRules : undefined,
      });
      if (res.success) {
        setDriftReport(res.data);
      } else {
        setDriftError(res.error || 'Failed to detect architecture drift.');
      }
    } catch (err) {
      console.error('Architecture drift error:', err);
      setDriftError(err.message || 'Error communicating with architecture engine.');
    } finally {
      setLoadingDrift(false);
    }
  };

  // Fetch default architecture rules
  const fetchRules = async () => {
    try {
      const res = await api.getArchitectureRules();
      if (res.success) {
        setCustomRules(res.data);
      }
    } catch (err) {
      console.warn('Failed to load rules:', err);
    }
  };

  // Initial load when scanData changes
  useEffect(() => {
    if (scanData) {
      fetchRules();
      fetchDriftReport();
    }
  }, [scanData]);

  // Handle re-synthesizing AI Architecture
  const handleRefreshAIArchitecture = async () => {
    if (!scanData) return;
    setAiLoading(true);
    try {
      const res = await api.getAIArchitecture(scanData);
      if (res.success) {
        setAiArchitectureOverride(res.data);
      }
    } catch (err) {
      alert(`AI Architecture analysis failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleToggleRule = async (ruleId) => {
    const updated = customRules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    setCustomRules(updated);
    try {
      await api.updateArchitectureRules({ rules: updated });
      fetchDriftReport(updated);
    } catch (err) {
      console.error('Failed to update rules:', err);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    const created = {
      ...newRule,
      id: `rule-custom-${Date.now()}`,
      actualRelationship: `${newRule.sourceLayer}\n↓\n${newRule.forbiddenTarget}`,
      enabled: true,
    };
    const updated = [...customRules, created];
    setCustomRules(updated);
    setShowAddRuleModal(false);
    try {
      await api.updateArchitectureRules({ rules: updated });
      fetchDriftReport(updated);
    } catch (err) {
      console.error('Failed to add rule:', err);
    }
  };

  const handleResetRules = async () => {
    try {
      const res = await api.updateArchitectureRules({ reset: true });
      if (res.success) {
        setCustomRules(res.data);
        fetchDriftReport(res.data);
      }
    } catch (err) {
      console.error('Failed to reset rules:', err);
    }
  };

  // Active AI architecture model
  const aiArch = aiArchitectureOverride || scanData?.aiArchitecture;
  const architectureLayers = scanData?.architecture || [];

  if (!scanData) {
    return (
      <div className="view-content" style={{ padding: '32px' }}>
        <div className="panel-container" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <Layers size={48} color="var(--accent-cyan)" style={{ marginBottom: '16px', opacity: 0.8 }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
            No Active Codebase Scanned
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 24px auto', fontSize: '0.9rem' }}>
            Scan a local repository or launch the built-in SaaS demo project to inspect architectural layers, visual dependencies, and drift violations.
          </p>
          {onLoadDemo && (
            <button
              className="btn-primary"
              onClick={onLoadDemo}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600 }}
            >
              <Sparkles size={16} /> Load Demo Project
            </button>
          )}
        </div>
      </div>
    );
  }

  const hasDrift = driftReport?.hasDrift;
  const totalDrifts = driftReport?.totalDrifts || 0;
  const driftsList = driftReport?.detectedDrifts || [];

  return (
    <div className="view-content" style={{ padding: '24px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <Layers size={22} color="var(--accent-cyan)" />
              Architecture &amp; Drift Intelligence
            </h1>
            {hasDrift ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: 'var(--accent-rose)',
                  letterSpacing: '0.03em',
                  boxShadow: '0 0 12px rgba(244, 63, 94, 0.25)',
                }}
              >
                <AlertTriangle size={14} /> ⚠ ARCHITECTURE DRIFT DETECTED ({totalDrifts})
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: 'var(--accent-emerald)',
                }}
              >
                <CheckCircle2 size={14} /> ARCHITECTURALLY COMPLIANT
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '4px' }}>
            Continuous AST architectural conformance monitoring. Detects forbidden layer bypasses and circular dependencies against expected contracts.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveTab('drift')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'drift' ? 'var(--bg-active)' : 'transparent',
                color: activeTab === 'drift' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <AlertTriangle size={14} />
              Drift Detection {totalDrifts > 0 && `(${totalDrifts})`}
            </button>

            <button
              onClick={() => setActiveTab('model')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'model' ? 'var(--bg-active)' : 'transparent',
                color: activeTab === 'model' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <Workflow size={14} />
              Architecture Model &amp; Layers
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'rules' ? 'var(--bg-active)' : 'transparent',
                color: activeTab === 'rules' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <Sliders size={14} />
              Rules ({customRules.filter((r) => r.enabled !== false).length})
            </button>
          </div>

          <button
            className="btn-secondary"
            onClick={() => fetchDriftReport()}
            disabled={loadingDrift}
            style={{ height: '36px', padding: '0 12px', fontSize: '0.78rem' }}
            title="Re-evaluate architectural drift"
          >
            <RefreshCw size={14} className={loadingDrift ? 'spin' : ''} />
            {loadingDrift ? 'Evaluating...' : 'Re-scan'}
          </button>
        </div>
      </div>

      {driftError && (
        <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.85rem' }}>
          {driftError}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ARCHITECTURE DRIFT DETECTION (Phase 16 Core View)                   */}
      {/* ========================================================================= */}
      {activeTab === 'drift' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Comparative Flow: EXPECTED ARCHITECTURE vs ACTUAL DEPENDENCY */}
          <div className="panel-container" style={{ background: 'linear-gradient(180deg, rgba(19, 24, 37, 0.95) 0%, rgba(10, 13, 20, 0.95) 100%)' }}>
            <div className="panel-header" style={{ borderBottom: '1px solid var(--border-subtle)', padding: '12px 20px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Workflow size={16} color="var(--accent-cyan)" />
                Architecture Conformance Comparison
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Integrity Score: <strong style={{ color: driftReport?.driftScore > 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{driftReport?.driftScore || 100}/100</strong>
                </span>
              </div>
            </div>

            <div className="panel-body" style={{ padding: '24px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* 1. EXPECTED ARCHITECTURE */}
                <div
                  style={{
                    backgroundColor: 'rgba(14, 18, 27, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="var(--accent-cyan)" />
                    EXPECTED ARCHITECTURE
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '280px' }}>
                    {['Controller', 'Service', 'Repository', 'Database'].map((layer, idx) => (
                      <React.Fragment key={layer}>
                        <div
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: '#fff',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          {layer === 'Controller' && <Server size={14} color="var(--accent-cyan)" />}
                          {layer === 'Service' && <Activity size={14} color="var(--accent-blue)" />}
                          {layer === 'Repository' && <Layers size={14} color="var(--accent-purple)" />}
                          {layer === 'Database' && <Database size={14} color="var(--accent-emerald)" />}
                          {layer}
                        </div>
                        {idx < 3 && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '18px' }}>
                            <ArrowDown size={18} color="var(--accent-cyan)" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Standard N-tier layered separation of concerns
                  </div>
                </div>

                {/* 2. ACTUAL DEPENDENCY (SHOWS DRIFT) */}
                <div
                  style={{
                    backgroundColor: hasDrift ? 'rgba(244, 63, 94, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                    border: hasDrift ? '1px solid rgba(244, 63, 94, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: hasDrift ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {hasDrift ? <AlertTriangle size={16} color="var(--accent-rose)" /> : <CheckCircle2 size={16} color="var(--accent-emerald)" />}
                    ACTUAL DEPENDENCY
                  </div>

                  {hasDrift ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '280px' }}>
                      <div
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--accent-cyan)',
                          borderRadius: 'var(--radius-sm)',
                          textAlign: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#fff',
                        }}
                      >
                        Controller
                      </div>

                      {/* Direct Violation Edge */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 0',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: 'var(--accent-rose)',
                            backgroundColor: 'rgba(244, 63, 94, 0.15)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            marginBottom: '4px',
                            border: '1px dashed var(--accent-rose)',
                            animation: 'pulse 2s infinite',
                          }}
                        >
                          ⚠ DIRECT CALL (BYPASS)
                        </div>
                        <ArrowDown size={22} color="var(--accent-rose)" strokeWidth={2.5} />
                      </div>

                      <div
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--accent-rose)',
                          borderRadius: 'var(--radius-sm)',
                          textAlign: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: 'var(--accent-rose)',
                          boxShadow: '0 0 12px rgba(244, 63, 94, 0.2)',
                        }}
                      >
                        Database
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--accent-emerald)', textAlign: 'center' }}>
                      <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ marginBottom: '12px' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No Architectural Drift</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        All dependencies respect strict top-down layer contracts
                      </div>
                    </div>
                  )}

                  {hasDrift && (
                    <div
                      style={{
                        marginTop: '16px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--accent-rose)',
                        backgroundColor: 'rgba(244, 63, 94, 0.1)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'center',
                      }}
                    >
                      ⚠ ARCHITECTURE DRIFT DETECTED: Controller bypasses Service and Repository
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Detected Drift Cards */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color={hasDrift ? 'var(--accent-rose)' : 'var(--accent-emerald)'} />
                Detected Architecture Drifts ({driftsList.length})
              </h2>
              {hasDrift && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Grounded in AST import statements and method invocations
                </span>
              )}
            </div>

            {driftsList.length === 0 ? (
              <div
                className="panel-container"
                style={{
                  padding: '36px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '6px' }}>
                  Zero Architecture Violations Detected
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '540px', margin: '0 auto' }}>
                  The active codebase adheres strictly to all active architectural boundaries. Controllers access Services, Services access Repositories, and Repositories access Databases.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {driftsList.map((drift) => (
                  <div
                    key={drift.id}
                    className="panel-container"
                    style={{
                      borderLeft: '4px solid var(--accent-rose)',
                      background: 'linear-gradient(180deg, rgba(25, 33, 50, 0.7) 0%, rgba(19, 24, 37, 0.95) 100%)',
                    }}
                  >
                    <div className="panel-header" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={17} color="var(--accent-rose)" />
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                          {drift.ruleName}
                        </span>
                        <span
                          className={`badge ${
                            drift.severity === 'CRITICAL'
                              ? 'badge-rose'
                              : drift.severity === 'HIGH'
                              ? 'badge-rose'
                              : 'badge-amber'
                          }`}
                        >
                          {drift.severity} SEVERITY
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {onNavigateToDebugger && (
                          <button
                            className="btn-secondary"
                            style={{ height: '28px', padding: '0 10px', fontSize: '0.74rem' }}
                            onClick={() => onNavigateToDebugger(drift.sourceComponent)}
                          >
                            Debug in Context
                          </button>
                        )}
                        {onNavigateToImpact && (
                          <button
                            className="btn-secondary"
                            style={{ height: '28px', padding: '0 10px', fontSize: '0.74rem', color: 'var(--accent-amber)' }}
                            onClick={() => onNavigateToImpact(drift.sourceComponent)}
                          >
                            Analyze Blast Radius
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="panel-body" style={{ padding: '16px 18px' }}>
                      {/* Attributes Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            Source Component
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                            {drift.sourceComponent}
                          </div>
                          <span className="badge badge-blue" style={{ fontSize: '0.68rem', marginTop: '4px' }}>
                            {drift.sourceLayer} Layer
                          </span>
                        </div>

                        <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            Target Component
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-rose)', wordBreak: 'break-all' }}>
                            {drift.targetComponent}
                          </div>
                          <span className="badge badge-purple" style={{ fontSize: '0.68rem', marginTop: '4px' }}>
                            {drift.targetLayer} Layer
                          </span>
                        </div>

                        <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            Expected Relationship
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                            {drift.expectedRelationship.replace(/\n/g, ' ')}
                          </div>
                        </div>

                        <div style={{ backgroundColor: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            Actual Relationship
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                            {drift.actualRelationship.replace(/\n/g, ' ')} (Direct Bypass)
                          </div>
                        </div>
                      </div>

                      {/* Evidence Box */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                          Project Evidence:
                        </div>
                        <div
                          style={{
                            backgroundColor: 'var(--bg-code)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px 14px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '4px' }}>
                            // Located in {drift.evidence.sourceFile} at Line {drift.evidence.line}
                          </div>
                          <div style={{ color: 'var(--accent-cyan)' }}>
                            {drift.evidence.statement}
                          </div>
                          {drift.evidence.usage && (
                            <div style={{ color: 'var(--accent-amber)', marginTop: '4px' }}>
                              // Direct Call: {drift.evidence.usage}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recommendation Box */}
                      <div
                        style={{
                          backgroundColor: 'rgba(59, 130, 246, 0.08)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                        }}
                      >
                        <CheckCircle2 size={16} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '2px' }}>
                            Architectural Recommendation
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                            {drift.recommendation}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visual Dependency Graph (Layers & Drift Edges) */}
          <div className="panel-container">
            <div className="panel-header" style={{ padding: '12px 18px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Workflow size={16} color="var(--accent-cyan)" />
                Visual Layer Dependency Graph
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Green = Compliant Flow | Red Dashed = Drift Violation Edge
              </span>
            </div>

            <div className="panel-body" style={{ padding: '24px 18px', overflowX: 'auto' }}>
              <div style={{ minWidth: '700px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Horizontal Flow Stages */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {[
                    { title: 'Presentation Layer', sub: 'Controllers & Routes', icon: Server, color: 'var(--accent-cyan)' },
                    { title: 'Business Logic Layer', sub: 'Domain Services', icon: Activity, color: 'var(--accent-blue)' },
                    { title: 'Data Access Layer', sub: 'Repositories & DAOs', icon: Layers, color: 'var(--accent-purple)' },
                    { title: 'Persistence Layer', sub: 'Database & Connection', icon: Database, color: 'var(--accent-emerald)' },
                  ].map((col) => {
                    const Icon = col.icon;
                    return (
                      <div
                        key={col.title}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: `1px solid var(--border-strong)`,
                          borderRadius: 'var(--radius-md)',
                          padding: '14px',
                          textAlign: 'center',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: '8px' }}>
                          <Icon size={18} color={col.color} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#fff' }}>{col.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{col.sub}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Edges Status Card */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Active Inter-Layer Edges:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Controller → Service</span>
                      <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>✓ COMPLIANT (Dispatches)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Service → Repository</span>
                      <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>✓ COMPLIANT (Queries DAO)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Repository → Database</span>
                      <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>✓ COMPLIANT (Connection Pool)</span>
                    </div>

                    {hasDrift && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'rgba(244, 63, 94, 0.12)',
                          border: '1px solid rgba(244, 63, 94, 0.35)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-rose)' }}>
                          ⚠ Controller → Database (Direct Bypass)
                        </span>
                        <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>
                          VIOLATION DETECTED
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SYSTEM ARCHITECTURE MODEL & FLOW (Preserves Existing Flow View)   */}
      {/* ========================================================================= */}
      {activeTab === 'model' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* AI Architecture Overview Banner */}
          <div className="panel-container" style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)' }}>
            <div className="panel-header" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={18} color="var(--accent-cyan)" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                  AI Architecture Flow &amp; Twin Intelligence
                </span>
                {aiArch?.architectureType && (
                  <span className="badge badge-purple">{aiArch.architectureType}</span>
                )}
              </div>

              <button
                className="btn-secondary"
                onClick={handleRefreshAIArchitecture}
                disabled={aiLoading}
                style={{ height: '32px', padding: '0 12px', fontSize: '0.78rem' }}
              >
                <RefreshCw size={13} className={aiLoading ? 'spin' : ''} />
                {aiLoading ? 'Synthesizing...' : 'Refresh AI Model'}
              </button>
            </div>

            <div className="panel-body" style={{ padding: '20px' }}>
              {aiArch ? (
                <div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '16px' }}>
                    <strong style={{ color: 'var(--accent-cyan)' }}>Synthesis: </strong>
                    {aiArch.architecture}
                  </div>

                  {/* Flow Diagram Nodes */}
                  {aiArch.flowGraph && (
                    <div className="flow-diagram">
                      {aiArch.flowGraph.nodes?.map((node, i) => (
                        <React.Fragment key={node.id}>
                          <div className={`flow-step-node ${node.status || 'detected'}`}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                Tier {i + 1}
                              </span>
                              <span className={`badge ${node.status === 'detected' ? 'badge-cyan' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                                {node.status || 'Active'}
                              </span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: '2px' }}>
                              {node.label}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {node.subtext}
                            </div>
                          </div>

                          {i < (aiArch.flowGraph.nodes.length - 1) && (
                            <div className="flow-arrow-connector">
                              <div className="arrow-line"></div>
                              <ArrowRight size={14} color="var(--accent-cyan)" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  Click "Refresh AI Model" to generate grounded architecture intelligence.
                </div>
              )}
            </div>
          </div>

          {/* Layer Cards Breakdown */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="var(--accent-blue)" />
              Codebase Layer Allocation ({architectureLayers.length} Layers)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {architectureLayers.map((arch, idx) => (
                <div key={idx} className="panel-container" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-cyan)' }}>
                      {arch.layer}
                    </span>
                    <span className="badge badge-blue">{arch.fileCount} files</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {arch.sampleFiles?.map((file, fIdx) => (
                      <div
                        key={fIdx}
                        style={{
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                        onClick={() => onNavigateToCodebase && onNavigateToCodebase(file)}
                        title="View in codebase explorer"
                      >
                        <FileCode size={13} color="var(--text-muted)" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RULES CONFIGURATION (Allows Manual Rule Definition)               */}
      {/* ========================================================================= */}
      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel-container">
            <div className="panel-header" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                  Architectural Rule Constraints
                </span>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
                  Define which architectural layers are permitted to import or depend on one another.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  onClick={handleResetRules}
                  style={{ height: '32px', padding: '0 12px', fontSize: '0.76rem' }}
                >
                  Reset Defaults
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setShowAddRuleModal(true)}
                  style={{ height: '32px', padding: '0 12px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Custom Rule
                </button>
              </div>
            </div>

            <div className="panel-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {customRules.map((rule) => (
                  <div
                    key={rule.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      opacity: rule.enabled !== false ? 1 : 0.6,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                          {rule.name}
                        </span>
                        <span
                          className={`badge ${
                            rule.severity === 'CRITICAL'
                              ? 'badge-rose'
                              : rule.severity === 'HIGH'
                              ? 'badge-rose'
                              : 'badge-amber'
                          }`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {rule.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Forbidden: <strong style={{ color: 'var(--accent-cyan)' }}>{rule.sourceLayer}</strong> cannot import <strong style={{ color: 'var(--accent-rose)' }}>{rule.forbiddenTarget}</strong>
                      </div>
                      {rule.description && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {rule.description}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        className={`btn-secondary ${rule.enabled !== false ? 'active' : ''}`}
                        onClick={() => handleToggleRule(rule.id)}
                        style={{
                          height: '28px',
                          padding: '0 12px',
                          fontSize: '0.74rem',
                          backgroundColor: rule.enabled !== false ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                          color: rule.enabled !== false ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        }}
                      >
                        {rule.enabled !== false ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add Rule Modal */}
          {showAddRuleModal && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  width: '100%',
                  maxWidth: '500px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                  Define Simple Architecture Rule
                </h3>

                <form onSubmit={handleAddRule}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Rule Name
                    </label>
                    <input
                      type="text"
                      className="text-input"
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      style={{ width: '100%' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Source Layer
                      </label>
                      <select
                        className="text-input"
                        value={newRule.sourceLayer}
                        onChange={(e) => setNewRule({ ...newRule, sourceLayer: e.target.value })}
                        style={{ width: '100%' }}
                      >
                        <option value="Controller">Controller</option>
                        <option value="Service">Service</option>
                        <option value="Repository">Repository</option>
                        <option value="Database">Database</option>
                        <option value="UI">UI / Frontend</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Forbidden Target Layer
                      </label>
                      <select
                        className="text-input"
                        value={newRule.forbiddenTarget}
                        onChange={(e) => setNewRule({ ...newRule, forbiddenTarget: e.target.value })}
                        style={{ width: '100%' }}
                      >
                        <option value="Database">Database</option>
                        <option value="Repository">Repository</option>
                        <option value="Service">Service</option>
                        <option value="Controller">Controller</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Severity
                    </label>
                    <select
                      className="text-input"
                      value={newRule.severity}
                      onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Refactoring Recommendation
                    </label>
                    <input
                      type="text"
                      className="text-input"
                      value={newRule.recommendation}
                      onChange={(e) => setNewRule({ ...newRule, recommendation: e.target.value })}
                      style={{ width: '100%' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowAddRuleModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save &amp; Evaluate
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
