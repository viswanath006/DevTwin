import React, { useState, useEffect, useRef } from 'react';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Loader2,
  FileCode,
  Users,
  Flame,
  ShieldAlert,
  Zap,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Code2,
  Calendar,
  Hash,
  ArrowUpRight,
  Clock,
  Tag,
  TrendingUp,
  Activity,
  Layers,
  Search,
  X,
} from 'lucide-react';
import { api } from '../../api/client';

// ── Risk config ─────────────────────────────────────────────────────────────
const RISK_CONFIG = {
  HIGH:     { color: 'var(--accent-rose)',    bg: 'rgba(244,63,94,0.12)',    border: 'rgba(244,63,94,0.4)',    label: 'HIGH RISK',   symbol: '🔴', icon: AlertOctagon },
  MEDIUM:   { color: '#f97316',               bg: 'rgba(249,115,22,0.12)',   border: 'rgba(249,115,22,0.4)',   label: 'MEDIUM RISK', symbol: '🟠', icon: AlertTriangle },
  LOW:      { color: 'var(--accent-emerald)', bg: 'rgba(52,211,153,0.10)',   border: 'rgba(52,211,153,0.35)',  label: 'LOW RISK',    symbol: '🟢', icon: CheckCircle2 },
  CRITICAL: { color: 'var(--accent-rose)',    bg: 'rgba(244,63,94,0.15)',    border: 'rgba(244,63,94,0.5)',    label: 'CRITICAL',    symbol: '🔴', icon: AlertOctagon },
  UNKNOWN:  { color: 'var(--text-muted)',     bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)',  label: 'UNKNOWN',     symbol: 'ℹ',  icon: Info },
};

const TAG_COLORS = {
  auth:      { bg: 'rgba(244,63,94,0.18)',    color: '#f43f5e',    label: 'auth' },
  api:       { bg: 'rgba(59,130,246,0.18)',   color: '#60a5fa',    label: 'api' },
  service:   { bg: 'rgba(139,92,246,0.18)',   color: '#a78bfa',    label: 'service' },
  tests:     { bg: 'rgba(52,211,153,0.18)',   color: '#34d399',    label: 'tests' },
  database:  { bg: 'rgba(234,179,8,0.18)',    color: '#eab308',    label: 'database' },
  config:    { bg: 'rgba(249,115,22,0.18)',   color: '#f97316',    label: 'config' },
  ui:        { bg: 'rgba(0,242,254,0.14)',    color: 'var(--accent-cyan)', label: 'ui' },
  bugfix:    { bg: 'rgba(244,63,94,0.14)',    color: '#fb7185',    label: 'bugfix' },
  feature:   { bg: 'rgba(52,211,153,0.14)',   color: '#6ee7b7',    label: 'feature' },
  refactor:  { bg: 'rgba(139,92,246,0.14)',   color: '#c4b5fd',    label: 'refactor' },
  general:   { bg: 'rgba(255,255,255,0.06)',  color: 'var(--text-secondary)', label: 'general' },
};

function RiskBadge({ risk, size = 'sm' }) {
  const cfg = RISK_CONFIG[risk] || RISK_CONFIG.UNKNOWN;
  const Icon = cfg.icon;
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      gap:            '4px',
      padding:        size === 'sm' ? '2px 8px' : '4px 12px',
      borderRadius:   '20px',
      background:     cfg.bg,
      border:         `1px solid ${cfg.border}`,
      color:          cfg.color,
      fontSize:       size === 'sm' ? '0.68rem' : '0.78rem',
      fontWeight:     700,
      letterSpacing:  '0.04em',
      whiteSpace:     'nowrap',
    }}>
      <Icon size={size === 'sm' ? 11 : 13} />
      {cfg.label}
    </span>
  );
}

function TagChip({ tag }) {
  const cfg = TAG_COLORS[tag] || TAG_COLORS.general;
  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '3px',
      padding:      '2px 7px',
      borderRadius: '10px',
      background:   cfg.bg,
      color:        cfg.color,
      fontSize:     '0.65rem',
      fontWeight:   600,
    }}>
      <Tag size={9} />
      {cfg.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color, subText }) {
  return (
    <div style={{
      background:    'var(--glass-bg)',
      border:        '1px solid var(--glass-border)',
      borderRadius:  'var(--radius-md)',
      padding:       '18px 20px',
      display:       'flex',
      flexDirection: 'column',
      gap:           '6px',
      flex:          1,
      minWidth:      '130px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: color || 'var(--accent-cyan)' }}>
        <Icon size={16} />
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: color || 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {subText && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{subText}</div>}
    </div>
  );
}

function CommitCard({ commit, onSelect, isSelected, onAnalyze, isAnalyzing }) {
  const risk = RISK_CONFIG[commit.risk] || RISK_CONFIG.LOW;
  const RiskIcon = risk.icon;
  const timeAgo = formatTimeAgo(commit.date);

  return (
    <div
      onClick={() => onSelect(commit)}
      style={{
        background:     isSelected ? 'rgba(0,242,254,0.06)' : 'var(--glass-bg)',
        border:         `1px solid ${isSelected ? 'rgba(0,242,254,0.35)' : 'var(--glass-border)'}`,
        borderRadius:   'var(--radius-md)',
        padding:        '14px 16px',
        cursor:         'pointer',
        transition:     'all 0.2s ease',
        position:       'relative',
        overflow:       'hidden',
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(0,242,254,0.2)'; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
        background: risk.color, borderRadius: '4px 0 0 4px',
      }} />

      <div style={{ paddingLeft: '8px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontFamily: 'monospace',
            fontSize: '0.72rem',
            color: 'var(--accent-cyan)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
          }}>
            {commit.shortHash}
          </div>
          <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
            {commit.message}
          </span>
          <RiskBadge risk={commit.risk} />
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Users size={11} />
            {commit.author}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Clock size={11} />
            {timeAgo}
          </span>
          {commit.filesChanged > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <FileCode size={11} />
              {commit.filesChanged} file{commit.filesChanged !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Tags */}
        {commit.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {commit.tags.map((tag) => <TagChip key={tag} tag={tag} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function CommitDetail({ commit, analysis, isAnalyzing, onAnalyze }) {
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText(commit.hash || commit.shortHash).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Commit header */}
      <div style={{
        background: 'var(--glass-bg)',
        border:     '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)',
        padding:    '18px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.4 }}>
              {commit.message}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={copyHash} style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px', padding: '3px 8px', cursor: 'pointer',
                fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-cyan)',
              }}>
                <Hash size={11} />
                {commit.shortHash}
                {copied ? <Check size={11} /> : <Copy size={11} />}
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={11} /> {commit.author}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} /> {formatDate(commit.date)}
              </span>
            </div>
          </div>
          <RiskBadge risk={commit.risk} size="lg" />
        </div>

        {/* File list */}
        {commit.changedFiles?.length > 0 && (
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Changed Files ({commit.changedFiles.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
              {commit.changedFiles.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                  <FileCode size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--text-secondary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.file}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}>+{f.additions}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--accent-rose)', whiteSpace: 'nowrap' }}>-{f.deletions}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analyze button */}
        <div style={{ marginTop: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => onAnalyze(commit)}
            disabled={isAnalyzing}
            style={{
              display:     'flex',
              alignItems:  'center',
              gap:         '7px',
              padding:     '8px 18px',
              borderRadius: 'var(--radius-sm)',
              background:  isAnalyzing ? 'rgba(0,242,254,0.08)' : 'linear-gradient(135deg, rgba(0,242,254,0.2) 0%, rgba(59,130,246,0.2) 100%)',
              border:      '1px solid rgba(0,242,254,0.4)',
              color:       isAnalyzing ? 'var(--text-muted)' : 'var(--accent-cyan)',
              fontSize:    '0.82rem',
              fontWeight:  700,
              cursor:      isAnalyzing ? 'not-allowed' : 'pointer',
              transition:  'all 0.2s ease',
            }}
          >
            {isAnalyzing
              ? <><Loader2 size={14} className="spin" /> Analyzing…</>
              : <><Zap size={14} /> AI Analyze Commit</>
            }
          </button>

          {commit.changedFiles?.length > 0 && (
            <button
              onClick={() => setShowDiff((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Code2 size={13} />
              {showDiff ? 'Hide' : 'Show'} Diff
              {showDiff ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Diff viewer */}
      {showDiff && analysis?.diff && (
        <DiffViewer diff={analysis.diff} />
      )}

      {/* AI Analysis Result */}
      {analysis?.aiAnalysis && (
        <AIAnalysisPanel analysis={analysis.aiAnalysis} commit={commit} />
      )}
    </div>
  );
}

function DiffViewer({ diff }) {
  const lines = (diff || '').split('\n');
  return (
    <div style={{
      background:   '#0a0e1a',
      border:       '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-md)',
      overflow:     'hidden',
    }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '0.72rem', color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
      }}>
        <Code2 size={13} /> Commit Diff
      </div>
      <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '12px 0' }}>
        {lines.map((line, i) => {
          const isAdd    = line.startsWith('+') && !line.startsWith('+++');
          const isDel    = line.startsWith('-') && !line.startsWith('---');
          const isHeader = line.startsWith('@@') || line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('+++') || line.startsWith('---');
          return (
            <div key={i} style={{
              padding:    '1px 16px',
              fontFamily: 'monospace',
              fontSize:   '0.75rem',
              lineHeight: 1.6,
              background: isAdd ? 'rgba(52,211,153,0.08)' : isDel ? 'rgba(244,63,94,0.08)' : 'transparent',
              color:      isAdd ? '#34d399' : isDel ? '#f87171' : isHeader ? '#60a5fa' : 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              wordBreak:  'break-all',
            }}>
              {line || ' '}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AIAnalysisPanel({ analysis, commit }) {
  const risk = RISK_CONFIG[analysis.risk || commit?.risk] || RISK_CONFIG.LOW;

  const statItems = [
    { label: 'APIs Affected',       value: analysis.apisAffected       ?? '—', color: '#60a5fa' },
    { label: 'Services Affected',   value: analysis.servicesAffected   ?? '—', color: '#a78bfa' },
    { label: 'Tests Affected',      value: analysis.testsAffected      ?? '—', color: '#34d399' },
    { label: 'Components Affected', value: analysis.componentsAffected ?? '—', color: 'var(--accent-cyan)' },
  ];

  return (
    <div style={{
      background:   'var(--glass-bg)',
      border:       `1px solid ${risk.border}`,
      borderRadius: 'var(--radius-md)',
      overflow:     'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding:      '14px 20px',
        background:   risk.bg,
        borderBottom: `1px solid ${risk.border}`,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={16} style={{ color: risk.color }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            COMMIT ANALYSIS
          </span>
        </div>
        <RiskBadge risk={analysis.risk || commit?.risk} size="lg" />
      </div>

      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Summary */}
        {analysis.summary && (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {analysis.summary}
          </p>
        )}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {statItems.map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Concerns */}
        {analysis.concerns?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '8px' }}>
              Potential Concerns
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {analysis.concerns.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  padding: '8px 12px', background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.2)', borderRadius: '8px',
                  fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5,
                }}>
                  <AlertTriangle size={13} style={{ color: '#f97316', flexShrink: 0, marginTop: '2px' }} />
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '8px' }}>
              Recommendations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {analysis.recommendations.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  padding: '8px 12px', background: 'rgba(52,211,153,0.07)',
                  border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px',
                  fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5,
                }}>
                  <CheckCircle2 size={13} style={{ color: '#34d399', flexShrink: 0, marginTop: '2px' }} />
                  {r}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Utilities ────────────────────────────────────────────────────────────────
function formatTimeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function GitIntelligenceView({ scanData }) {
  const [gitData,        setGitData]        = useState(null);
  const [isLoading,      setIsLoading]      = useState(false);
  const [error,          setError]          = useState(null);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [commitAnalysis, setCommitAnalysis] = useState(null);
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [analyzeError,   setAnalyzeError]   = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [filterRisk,     setFilterRisk]     = useState('ALL');

  const detailRef = useRef(null);

  const rootPath = scanData?.rootPath || null;

  const loadGitInfo = async () => {
    setIsLoading(true);
    setError(null);
    setGitData(null);
    setSelectedCommit(null);
    setCommitAnalysis(null);
    try {
      const res = await api.getGitInfo(rootPath);
      if (res.success) {
        setGitData(res.data);
        if (res.data.commits?.length > 0) {
          setSelectedCommit(res.data.commits[0]);
        }
      } else {
        setError(res.error || 'Failed to load git information.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeCommit = async (commit) => {
    if (!commit?.hash) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    setCommitAnalysis(null);
    try {
      const res = await api.analyzeGitCommit({ hash: commit.hash, rootPath });
      if (res.success) {
        setCommitAnalysis(res.data);
        setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else {
        setAnalyzeError(res.error || 'AI analysis failed.');
      }
    } catch (err) {
      setAnalyzeError(err.message || 'Error during commit analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    loadGitInfo();
  }, [rootPath]);

  // Filter commits
  const filteredCommits = (gitData?.commits || []).filter((c) => {
    const matchSearch = !searchQuery ||
      c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortHash.includes(searchQuery);
    const matchRisk = filterRisk === 'ALL' || c.risk === filterRisk;
    return matchSearch && matchRisk;
  });

  // ── "Not a git repo" state ──────────────────────────────────────────────
  if (!isLoading && gitData && !gitData.isGitRepo) {
    return (
      <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <SectionHeader onRefresh={loadGitInfo} isLoading={isLoading} />
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '20px', padding: '60px 40px',
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '16px',
            background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GitBranch size={28} style={{ color: '#f97316' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Not a Git Repository
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.7 }}>
              {gitData.reason}
            </div>
          </div>
          <div style={{
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
            borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--accent-cyan)',
          }}>
            cd {gitData.rootPath || 'your-project'} && git init
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SectionHeader
        onRefresh={loadGitInfo}
        isLoading={isLoading}
        branch={gitData?.branch}
        allBranches={gitData?.allBranches}
      />

      {/* Error State */}
      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: 'var(--radius-md)',
          background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '0.85rem', color: 'var(--accent-rose)',
        }}>
          <AlertOctagon size={16} />
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
              height: '80px', borderRadius: 'var(--radius-md)',
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {gitData?.isGitRepo && !isLoading && (
        <>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <StatCard icon={GitCommit}   label="Total Commits"    value={gitData.totalCommits}                color="var(--accent-cyan)" />
            <StatCard icon={AlertOctagon} label="High Risk"       value={gitData.stats?.riskCounts?.HIGH ?? 0} color="var(--accent-rose)" subText="commits need review" />
            <StatCard icon={AlertTriangle} label="Medium Risk"    value={gitData.stats?.riskCounts?.MEDIUM ?? 0} color="#f97316" />
            <StatCard icon={CheckCircle2} label="Low Risk"        value={gitData.stats?.riskCounts?.LOW ?? 0}  color="var(--accent-emerald)" />
            <StatCard icon={Users}        label="Contributors"    value={gitData.stats?.topAuthors?.length ?? 0} />
          </div>

          {/* Working Status */}
          <WorkingStatusPanel status={gitData.workingStatus} />

          {/* Hot Files + Top Authors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <HotFilesPanel files={gitData.stats?.hotFiles} />
            <TopAuthorsPanel authors={gitData.stats?.topAuthors} />
          </div>

          {/* Main layout: commit list + detail */}
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '16px', alignItems: 'flex-start' }}>
            {/* Commit list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Search + Filter */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search commits…"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-sm)', padding: '8px 10px 8px 30px',
                      color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none',
                    }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                      <X size={12} />
                    </button>
                  )}
                </div>
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  style={{
                    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                    color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer', outline: 'none',
                  }}
                >
                  <option value="ALL">All Risk</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {filteredCommits.length} commit{filteredCommits.length !== 1 ? 's' : ''}
                {gitData.totalCommits > 10 && ' (top 10 with file detail)'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredCommits.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No commits match your filter.
                  </div>
                ) : (
                  filteredCommits.map((c) => (
                    <CommitCard
                      key={c.hash}
                      commit={c}
                      isSelected={selectedCommit?.hash === c.hash}
                      onSelect={(commit) => {
                        setSelectedCommit(commit);
                        setCommitAnalysis(null);
                        setAnalyzeError(null);
                      }}
                      onAnalyze={handleAnalyzeCommit}
                      isAnalyzing={isAnalyzing && selectedCommit?.hash === c.hash}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Detail panel */}
            <div ref={detailRef}>
              {selectedCommit ? (
                <CommitDetail
                  commit={selectedCommit}
                  analysis={commitAnalysis?.hash === selectedCommit.hash ? commitAnalysis : null}
                  isAnalyzing={isAnalyzing}
                  onAnalyze={handleAnalyzeCommit}
                />
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '60px 40px', textAlign: 'center',
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-muted)', fontSize: '0.85rem',
                }}>
                  <GitCommit size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  Select a commit to inspect its details
                </div>
              )}

              {analyzeError && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                  fontSize: '0.82rem', color: 'var(--accent-rose)',
                }}>
                  {analyzeError}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-panels ───────────────────────────────────────────────────────────────
function SectionHeader({ onRefresh, isLoading, branch, allBranches }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0,242,254,0.25) 0%, rgba(59,130,246,0.25) 100%)',
            border: '1px solid rgba(0,242,254,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GitBranch size={18} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          Git Intelligence
        </h2>
        <p style={{ margin: '4px 0 0 46px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Real-time commit risk analysis — no fabrication, only real repository data
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {branch && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '7px 12px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
            fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-emerald)',
          }}>
            <GitBranch size={13} />
            {branch}
          </div>
        )}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.3)',
            color: 'var(--accent-cyan)', fontSize: '0.82rem', fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          {isLoading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

function WorkingStatusPanel({ status }) {
  if (!status) return null;
  const { modified = [], staged = [], untracked = [], conflicted = [] } = status;
  const total = modified.length + staged.length + untracked.length + conflicted.length;
  if (total === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 18px', borderRadius: 'var(--radius-md)',
        background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
        fontSize: '0.82rem', color: 'var(--accent-emerald)',
      }}>
        <CheckCircle2 size={15} />
        Working tree clean — no uncommitted changes
      </div>
    );
  }
  return (
    <div style={{
      background: 'var(--glass-bg)', border: '1px solid rgba(234,179,8,0.3)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 16px', background: 'rgba(234,179,8,0.08)', borderBottom: '1px solid rgba(234,179,8,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={14} style={{ color: '#eab308' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Working Tree Status — {total} uncommitted change{total !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {staged.length > 0 && (
          <StatusGroup label="Staged" files={staged} color="#34d399" />
        )}
        {modified.length > 0 && (
          <StatusGroup label="Modified" files={modified} color="#f97316" />
        )}
        {untracked.length > 0 && (
          <StatusGroup label="Untracked" files={untracked} color="var(--text-muted)" />
        )}
        {conflicted.length > 0 && (
          <StatusGroup label="Conflicted" files={conflicted} color="var(--accent-rose)" />
        )}
      </div>
    </div>
  );
}

function StatusGroup({ label, files, color }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
        {label} ({files.length})
      </div>
      {files.slice(0, 4).map((f, i) => (
        <div key={i} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: 1.8 }}>
          {f}
        </div>
      ))}
      {files.length > 4 && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>+{files.length - 4} more</div>}
    </div>
  );
}

function HotFilesPanel({ files = [] }) {
  return (
    <div style={{
      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Flame size={14} style={{ color: '#f97316' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hot Files</span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>most changed</span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        {files.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>No file change data available</div>
        ) : (
          files.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: i < files.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 700, width: '20px', textAlign: 'center' }}>{f.changes}×</span>
              <FileCode size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.file}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                {f.language}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TopAuthorsPanel({ authors = [] }) {
  const max = Math.max(...authors.map((a) => a.commits), 1);
  return (
    <div style={{
      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={14} style={{ color: 'var(--accent-cyan)' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top Contributors</span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        {authors.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>No author data available</div>
        ) : (
          authors.map((a, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{a.name}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>{a.commits}</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(a.commits / max) * 100}%`,
                  background: 'linear-gradient(90deg, var(--accent-cyan), rgba(59,130,246,0.8))',
                  borderRadius: '4px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
