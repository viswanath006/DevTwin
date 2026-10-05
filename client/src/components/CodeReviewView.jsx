import React, { useState, useEffect, useRef } from 'react';
import {
  GitPullRequest,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  FileCode,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  X,
  Code2,
  Bug,
  ShieldAlert,
  Zap,
  Layers,
  Wrench,
  BookOpen,
  FlaskConical,
  GitFork,
  Search,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client';

// ── Severity config ────────────────────────────────────────────
const SEVERITY_CONFIG = {
  CRITICAL:   { color: 'var(--accent-rose)', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.35)', icon: AlertOctagon, label: 'Critical', symbol: '🔴' },
  WARNING:    { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', icon: AlertTriangle, label: 'Warning', symbol: '🟠' },
  HIGH:       { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', icon: AlertTriangle, label: 'Warning', symbol: '🟠' },
  SUGGESTION: { color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.35)', icon: AlertTriangle, label: 'Suggestion', symbol: '🟡' },
  MEDIUM:     { color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.35)', icon: AlertTriangle, label: 'Suggestion', symbol: '🟡' },
  GOOD:       { color: 'var(--accent-emerald)', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)', icon: CheckCircle2, label: 'Good', symbol: '🟢' },
  LOW:        { color: 'var(--accent-cyan)', bg: 'rgba(0,242,254,0.08)', border: 'rgba(0,242,254,0.25)', icon: Info, label: 'Low', symbol: '🔵' },
  INFO:       { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', icon: Info, label: 'Info', symbol: 'ℹ' },
};

const RISK_CONFIG = {
  CRITICAL: { color: 'var(--accent-rose)', label: 'CRITICAL RISK', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.5)' },
  HIGH:     { color: '#f97316', label: 'HIGH RISK', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.4)' },
  MEDIUM:   { color: '#eab308', label: 'MEDIUM RISK', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.4)' },
  LOW:      { color: 'var(--accent-emerald)', label: 'LOW RISK', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.35)' },
  INFO:     { color: 'var(--text-secondary)', label: 'INFO', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)' },
};

// ── Category icons ─────────────────────────────────────────────
const CATEGORY_ICONS = {
  'Bugs':             Bug,
  'Security':         ShieldAlert,
  'Performance':      Zap,
  'Architecture':     Layers,
  'Error Handling':   Wrench,
  'Maintainability':  BookOpen,
  'Testing Gaps':     FlaskConical,
  'Breaking Changes': GitFork,
};

// ── Input mode tabs ────────────────────────────────────────────
const INPUT_MODES = [
  { id: 'diff',    label: 'Git Diff',             icon: GitPullRequest },
  { id: 'files',   label: 'Changed Files',        icon: FileCode },
  { id: 'snippet', label: 'Code Snippet',         icon: Code2 },
  { id: 'pr',      label: 'Pull Request',         icon: GitFork },
];

// ── Sample diff for demo ───────────────────────────────────────
const DEMO_DIFF = `diff --git a/src/routes/users.js b/src/routes/users.js
index a1b2c3d..e4f5g6h 100644
--- a/src/routes/users.js
+++ b/src/routes/users.js
@@ -10,18 +10,32 @@ const router = Router();
 
-// router.get('/users/:id', requireAuth, async (req, res) => {
+// Authentication bypass possibility: auth middleware removed for quick testing
+router.get('/users/:id', async (req, res) => {
+  const id = req.params.id;
+  // Missing error handling: raw async DB query without try-catch protection
+  const user1 = await db.query("SELECT * FROM users WHERE id = " + id);
+  // Duplicate database operation: querying the exact same user record again
+  const user2 = await db.query("SELECT * FROM users WHERE id = " + id);
+  res.json({ user: user1.rows[0] });
+});
+
diff --git a/tests/user.test.js b/tests/user.test.js
index 0000000..f1e2d3c 100644
--- /dev/null
+++ b/tests/user.test.js
@@ -0,0 +1,10 @@
+describe('User API', () => {
+  it('should return user record by ID', async () => {
+    const res = await request(app).get('/users/123');
+    expect(res.status).toBe(200);
+  });
+});`;

// ── Loading animation steps ─────────────────────────────────────
const LOADING_STEPS = [
  'Parsing diff structure & extracting changed files...',
  'Running bug detection patterns...',
  'Auditing security & injection vectors...',
  'Evaluating performance & architecture concerns...',
  'Checking error handling completeness...',
  'Computing overall risk & generating review report...',
];

export default function CodeReviewView({ scanData, onNavigateToDebugger, onNavigateToSecurity }) {
  // ── Input state ────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState('diff');
  const [diffInput, setDiffInput] = useState('');
  const [snippetInput, setSnippetInput] = useState('');
  const [prTitle, setPrTitle] = useState('feat(user): update user retrieval and tests');
  const [prDescription, setPrDescription] = useState('');
  const [changedFiles, setChangedFiles] = useState([{ path: '', content: '' }]);

  // ── Result state ───────────────────────────────────────────────
  const [reviewData, setReviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // ── UI state ───────────────────────────────────────────────────
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [expandedFindings, setExpandedFindings] = useState(new Set());

  const resultsRef = useRef(null);

  // Loading step animation
  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Load demo diff
  const handleLoadDemo = () => {
    setDiffInput(DEMO_DIFF);
    setInputMode('diff');
    setPrDescription('Refactoring user route — switched to raw SQL for flexibility. Also adding delete endpoint.');
  };

  // Run code review
  const handleRunReview = async () => {
    const payload = {};
    if (inputMode === 'diff' && diffInput.trim()) {
      payload.diff = diffInput;
    } else if (inputMode === 'pr' && diffInput.trim()) {
      payload.diff = diffInput;
      payload.prTitle = prTitle;
      payload.prDescription = prDescription || prTitle;
    } else if (inputMode === 'snippet' && snippetInput.trim()) {
      payload.codeSnippet = snippetInput;
    } else if (inputMode === 'files') {
      const validFiles = changedFiles.filter((f) => f.path.trim() || f.content.trim());
      if (validFiles.length === 0) {
        setError('Please add at least one file with a path or content.');
        return;
      }
      payload.changedFiles = validFiles;
    } else {
      setError('Please provide a diff, code snippet, changed files, or PR changes to review.');
      return;
    }
    if (prDescription.trim()) payload.prDescription = prDescription;
    if (scanData?.rootPath) payload.rootPath = scanData.rootPath;

    setIsLoading(true);
    setError(null);
    setSelectedFinding(null);
    setReviewData(null);

    try {
      const res = await api.reviewCode(payload);
      if (res.success) {
        setReviewData(res.data);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
      } else {
        setError(res.error || 'Review failed.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with review service.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle finding expansion
  const toggleFinding = (id) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSelectedFinding(id);
  };

  // Copy evidence
  const handleCopyEvidence = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Changed files management
  const addFileEntry = () => setChangedFiles((prev) => [...prev, { path: '', content: '' }]);
  const removeFileEntry = (idx) => setChangedFiles((prev) => prev.filter((_, i) => i !== idx));
  const updateFileEntry = (idx, field, value) =>
    setChangedFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));

  // Filtered findings
  const allFindings = reviewData?.findings || [];
  const categories = ['ALL', ...new Set(allFindings.map((f) => f.category))];
  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

  const filteredFindings = allFindings.filter((f) => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
    if (searchQuery && !`${f.problem} ${f.file} ${f.category} ${f.recommendation}`.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = reviewData?.stats || {};
  const overallRisk = reviewData?.overallRisk || 'INFO';
  const riskCfg = RISK_CONFIG[overallRisk] || RISK_CONFIG.INFO;

  return (
    <div className="view-content">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <GitPullRequest size={22} color="var(--accent-purple)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
              AI CODE REVIEW
            </h2>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)', color: 'var(--accent-purple)' }}>
              Phase 13
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Paste a git diff, code snippet, or changed file — AI analyzes bugs, security, performance, architecture violations &amp; more.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleLoadDemo}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(168,85,247,0.4)', background: 'rgba(168,85,247,0.1)', color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Lightbulb size={14} /> Load Demo PR
          </button>
          {reviewData && (
            <button
              type="button"
              onClick={() => { setReviewData(null); setSelectedFinding(null); }}
              style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} /> New Review
            </button>
          )}
        </div>
      </div>

      {/* ── Input Panel ─────────────────────────────────────────── */}
      {!reviewData && (
        <div className="card" style={{ marginBottom: '20px' }}>
          {/* Mode Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '18px', padding: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', width: 'fit-content' }}>
            {INPUT_MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setInputMode(m.id)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: inputMode === m.id ? 'rgba(168,85,247,0.2)' : 'transparent',
                    color: inputMode === m.id ? 'var(--accent-purple)' : 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: inputMode === m.id ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} /> {m.label}
                </button>
              );
            })}
          </div>

          {/* PR Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              PR / Change Description (optional)
            </label>
            <input
              type="text"
              value={prDescription}
              onChange={(e) => setPrDescription(e.target.value)}
              placeholder="Describe what this change does and why..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: '#fff', fontSize: '0.88rem', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Diff Input */}
          {inputMode === 'diff' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Git Diff
              </label>
              <textarea
                value={diffInput}
                onChange={(e) => setDiffInput(e.target.value)}
                placeholder={`Paste your git diff here...\n\nExample:\ndiff --git a/src/auth.js b/src/auth.js\n--- a/src/auth.js\n+++ b/src/auth.js\n@@ -10,6 +10,8 @@\n+const SECRET = "hardcoded_secret";\n router.post('/login', async (req, res) => {`}
                rows={14}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', padding: '12px', color: '#e2e8f0', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
              />
            </div>
          )}

          {/* Code Snippet Input */}
          {inputMode === 'snippet' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Code Snippet
              </label>
              <textarea
                value={snippetInput}
                onChange={(e) => setSnippetInput(e.target.value)}
                placeholder="Paste the code you want reviewed here..."
                rows={14}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', padding: '12px', color: '#e2e8f0', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
              />
            </div>
          )}

          {/* Pull Request Input */}
          {inputMode === 'pr' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Pull Request Title
                  </label>
                  <input
                    type="text"
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    placeholder="PR #42: Feature or bugfix title"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Target Branch
                  </label>
                  <input
                    type="text"
                    defaultValue="main ← feature/review"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-muted)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    readOnly
                  />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  PR Diff & Changes
                </label>
                <textarea
                  value={diffInput}
                  onChange={(e) => setDiffInput(e.target.value)}
                  placeholder="Paste git diff or GitHub PR unified diff here..."
                  rows={12}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', padding: '12px', color: '#e2e8f0', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
                />
              </div>
            </div>
          )}

          {/* Changed Files Input */}
          {inputMode === 'files' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Changed Files
              </label>
              {changedFiles.map((file, idx) => (
                <div key={idx} style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <FileCode size={14} color="var(--text-muted)" />
                    <input
                      type="text"
                      value={file.path}
                      onChange={(e) => updateFileEntry(idx, 'path', e.target.value)}
                      placeholder="src/routes/users.js"
                      style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '6px 10px', color: '#fff', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', outline: 'none' }}
                    />
                    {changedFiles.length > 1 && (
                      <button type="button" onClick={() => removeFileEntry(idx)} style={{ padding: '5px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={file.content}
                    onChange={(e) => updateFileEntry(idx, 'content', e.target.value)}
                    placeholder="Paste file content here..."
                    rows={6}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', padding: '8px 10px', color: '#e2e8f0', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addFileEntry}
                style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                + Add Another File
              </button>
            </div>
          )}

          {/* Run Button */}
          <div style={{ marginTop: '18px' }}>
            {error && (
              <p style={{ color: 'var(--accent-rose)', fontSize: '0.82rem', marginBottom: '10px', padding: '8px 12px', background: 'rgba(244,63,94,0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244,63,94,0.25)' }}>
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleRunReview}
              disabled={isLoading}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '0.92rem', fontWeight: 700, background: 'linear-gradient(135deg, rgba(168,85,247,0.8) 0%, rgba(139,92,246,0.9) 100%)', border: '1px solid rgba(168,85,247,0.5)', borderRadius: 'var(--radius-sm)', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, color: '#fff', boxShadow: '0 0 20px rgba(168,85,247,0.25)' }}
            >
              {isLoading ? (
                <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Reviewing Code...</>
              ) : (
                <><GitPullRequest size={16} /> Run AI Code Review</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Loading State ──────────────────────────────────────── */}
      {isLoading && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', border: '1px solid rgba(168,85,247,0.4)', boxShadow: '0 0 30px rgba(168,85,247,0.15)' }}>
          <div style={{ width: '52px', height: '52px', margin: '0 auto 18px', borderRadius: '50%', background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(168,85,247,0.4)' }}>
            <GitPullRequest size={24} color="var(--accent-purple)" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>Analyzing Your Code Change...</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '420px', margin: '0 auto' }}>
            {LOADING_STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: i <= loadingStep ? 1 : 0.25, transition: 'opacity 0.3s' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: i < loadingStep ? 'var(--accent-emerald)' : i === loadingStep ? 'var(--accent-purple)' : 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: i === loadingStep ? 'var(--accent-purple)' : i < loadingStep ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Results ────────────────────────────────────────────── */}
      {reviewData && !isLoading && (
        <div ref={resultsRef}>
          {/* Risk Banner */}
          <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-sm)', background: riskCfg.bg, border: `1px solid ${riskCfg.border}`, marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 18px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: `1px solid ${riskCfg.border}` }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: riskCfg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: riskCfg.color, lineHeight: 1.1 }}>{overallRisk}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: '3px' }}>Code Review Complete</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.5 }}>
                  {reviewData.aiSummary || reviewData.summary}
                </div>
              </div>
            </div>

            {/* Stats pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {stats.critical > 0 && <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(244,63,94,0.15)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.3)' }}>🔴 {stats.critical} Critical</span>}
              {stats.high > 0 && <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(251,191,36,0.12)', color: 'var(--accent-amber)', border: '1px solid rgba(251,191,36,0.3)' }}>🟠 {stats.high} High</span>}
              {stats.medium > 0 && <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' }}>🟡 {stats.medium} Medium</span>}
              {stats.low > 0 && <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(0,242,254,0.08)', color: 'var(--accent-cyan)', border: '1px solid rgba(0,242,254,0.25)' }}>🔵 {stats.low} Low</span>}
              {stats.info > 0 && <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}>ℹ {stats.info} Info</span>}
              {stats.totalFindings === 0 && <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(52,211,153,0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(52,211,153,0.3)' }}>✓ No Issues Found</span>}
            </div>
          </div>

          {/* Main 2-column layout: Findings + Detail */}
          <div style={{ display: 'grid', gridTemplateColumns: reviewData?.findings?.length > 0 ? '1fr 420px' : '1fr', gap: '16px', alignItems: 'start' }}>
            {/* ── Left: Findings list ─────────────────────────── */}
            <div>
              {/* Filters */}
              {allFindings.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
                    <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search findings..."
                      style={{ width: '100%', paddingLeft: '28px', padding: '7px 10px 7px 28px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', outline: 'none' }}>
                    {severities.map((s) => <option key={s} value={s} style={{ background: '#0f172a' }}>{s}</option>)}
                  </select>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', outline: 'none' }}>
                    {categories.map((c) => <option key={c} value={c} style={{ background: '#0f172a' }}>{c}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setReviewData(null); setSelectedFinding(null); setExpandedFindings(new Set()); }}
                    style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(168,85,247,0.4)', background: 'rgba(168,85,247,0.1)', color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <RefreshCw size={12} /> New Review
                  </button>
                </div>
              )}

              {/* Findings list */}
              {filteredFindings.length === 0 && allFindings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                  <CheckCircle2 size={40} color="var(--accent-emerald)" style={{ marginBottom: '12px' }} />
                  <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '6px' }}>No Issues Detected</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    The provided code passed all heuristic checks. Enable Gemini or OpenAI for deeper semantic analysis.
                  </p>
                </div>
              ) : filteredFindings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '28px' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No findings match the active filters.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredFindings.map((finding, idx) => {
                    const sev = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.INFO;
                    const SevIcon = sev.icon;
                    const CatIcon = CATEGORY_ICONS[finding.category] || Info;
                    const isExpanded = expandedFindings.has(finding.id || idx);
                    const isSelected = (selectedFinding === (finding.id || idx)) || (!selectedFinding && idx === 0);

                    return (
                      <div
                        key={finding.id || idx}
                        onClick={() => toggleFinding(finding.id || idx)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? sev.bg : 'var(--bg-card)',
                          border: `1px solid ${isSelected ? sev.border : 'rgba(255,255,255,0.07)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {/* Finding header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span style={{ fontSize: '1.05rem', lineHeight: 1.2, flexShrink: 0 }}>{sev.symbol}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '1px 8px', borderRadius: '4px', background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {sev.label}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                <CatIcon size={12} /> {finding.category}
                              </span>
                              {finding.file && finding.file !== 'Detected in diff' && finding.file !== 'Detected in provided code' && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                                  {finding.file.split('/').pop()}{finding.line ? `:${finding.line}` : ''}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0' }}>
                              {finding.problem}
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, color: 'var(--text-muted)', marginTop: '2px' }}>
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Why This Matters</div>
                                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{finding.why}</p>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Recommendation</div>
                                <p style={{ fontSize: '0.83rem', color: 'var(--accent-emerald)', lineHeight: 1.6 }}>{finding.recommendation}</p>
                              </div>
                            </div>

                            {finding.evidence && (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evidence Code Snippet</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyEvidence(finding.evidence, finding.id || idx)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer' }}
                                  >
                                    {copiedId === (finding.id || idx) ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                                  </button>
                                </div>
                                <pre style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px 12px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#94a3b8', overflowX: 'auto', margin: 0, lineHeight: 1.6, maxHeight: '200px', overflowY: 'auto' }}>
                                  {finding.evidence}
                                </pre>
                              </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                              {finding.category === 'Security' && onNavigateToSecurity && (
                                <button type="button" onClick={onNavigateToSecurity} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                                  <ShieldAlert size={13} /> Run Full Security Scan
                                </button>
                              )}
                              {finding.category === 'Bugs' && onNavigateToDebugger && (
                                <button type="button" onClick={() => onNavigateToDebugger(finding.file)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.08)', color: 'var(--accent-amber)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                                  <Bug size={13} /> Open in Debugger
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Right: Summary & Code Inspector panel ──────────────────────────── */}
            {allFindings.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Dedicated Code / Diff Inspector for selected finding */}
                {(() => {
                  const activeFinding = allFindings.find((f, i) => (f.id || i) === selectedFinding) || filteredFindings[0] || allFindings[0];
                  if (!activeFinding) return null;
                  const activeSev = SEVERITY_CONFIG[activeFinding.severity] || SEVERITY_CONFIG.INFO;
                  return (
                    <div className="card" style={{ border: `1px solid ${activeSev.border}`, background: 'rgba(15,23,42,0.85)', boxShadow: `0 0 24px ${activeSev.bg}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '1.1rem' }}>{activeSev.symbol}</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: activeSev.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {activeSev.label} · {activeFinding.category}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                            {activeFinding.problem}
                          </div>
                        </div>
                        {activeFinding.line && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,242,254,0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(0,242,254,0.3)', fontFamily: 'var(--font-mono)' }}>
                            Line {activeFinding.line}
                          </span>
                        )}
                      </div>

                      {/* File badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.76rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        <FileCode size={13} color="var(--accent-cyan)" />
                        <span>{activeFinding.file}</span>
                      </div>

                      {/* Relevant code snippet */}
                      <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
                        <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                            Relevant Code / Diff
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyEvidence(activeFinding.evidence, 'inspector')}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                          >
                            {copiedId === 'inspector' ? <><Check size={11} color="var(--accent-emerald)" /> Copied</> : <><Copy size={11} /> Copy</>}
                          </button>
                        </div>
                        <pre style={{ margin: 0, padding: '10px 12px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#cbd5e1', lineHeight: 1.5, maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.6)' }}>
                          {activeFinding.evidence || 'No direct code snippet available in diff context.'}
                        </pre>
                      </div>

                      {/* Recommendation */}
                      <div style={{ padding: '8px 10px', borderRadius: '4px', background: activeSev.bg, border: `1px solid ${activeSev.border}` }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: activeSev.color, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                          Actionable Fix Recommendation
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                          {activeFinding.recommendation}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Category breakdown */}
                <div className="card">
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    Findings by Category
                  </div>
                  {(() => {
                    const catCounts = {};
                    for (const f of allFindings) {
                      catCounts[f.category] = (catCounts[f.category] || 0) + 1;
                    }
                    return Object.entries(catCounts).map(([cat, count]) => {
                      const Icon = CATEGORY_ICONS[cat] || Info;
                      const catFindings = allFindings.filter((f) => f.category === cat);
                      const hasCritical = catFindings.some((f) => f.severity === 'CRITICAL');
                      const hasHigh = catFindings.some((f) => f.severity === 'HIGH');
                      const color = hasCritical ? 'var(--accent-rose)' : hasHigh ? 'var(--accent-amber)' : 'var(--text-secondary)';
                      return (
                        <div
                          key={cat}
                          onClick={() => setCategoryFilter(categoryFilter === cat ? 'ALL' : cat)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Icon size={13} color={color} />
                            <span style={{ fontSize: '0.82rem', color: categoryFilter === cat ? color : 'var(--text-secondary)' }}>{cat}</span>
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '1px 8px', borderRadius: '10px', background: hasCritical ? 'rgba(244,63,94,0.15)' : hasHigh ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.06)', color }}>{count}</span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Recommended tests */}
                {reviewData?.recommendedTests?.length > 0 && (
                  <div className="card">
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                      Recommended Tests
                    </div>
                    {reviewData.recommendedTests.map((t, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '6px 0', borderBottom: i < reviewData.recommendedTests.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <FlaskConical size={13} color="var(--accent-emerald)" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Changed files */}
                {reviewData?.changedFiles?.length > 0 && (
                  <div className="card">
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                      Files Reviewed
                    </div>
                    {reviewData.changedFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '5px 0' }}>
                        <FileCode size={12} color="var(--accent-cyan)" />
                        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Review metadata */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>Reviewed: {reviewData.reviewedAt ? new Date(reviewData.reviewedAt).toLocaleTimeString() : '—'}</div>
                  {reviewData.rootPath && <div>Context: {reviewData.rootPath.split(/[\\/]/).pop()}</div>}
                  <div style={{ marginTop: '4px', color: 'rgba(255,255,255,0.3)' }}>
                    {stats.totalFindings} finding{stats.totalFindings !== 1 ? 's' : ''} · {allFindings.length - filteredFindings.length > 0 ? `${allFindings.length - filteredFindings.length} filtered` : 'All shown'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────── */}
      {!reviewData && !isLoading && !error && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px', border: '1px dashed rgba(168,85,247,0.2)' }}>
          <GitPullRequest size={44} color="rgba(168,85,247,0.4)" style={{ marginBottom: '14px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Ready for Code Review</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            Paste a git diff, PR-style change, or code snippet above. DevTwin will analyze it for bugs, security risks, performance concerns, architecture violations, and more — grounded in your project context.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Bugs', 'Security', 'Performance', 'Architecture', 'Error Handling', 'Testing Gaps', 'Breaking Changes'].map((c) => {
              const Icon = CATEGORY_ICONS[c] || Info;
              return (
                <span key={c} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <Icon size={12} /> {c}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
