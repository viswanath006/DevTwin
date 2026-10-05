import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareCode,
  Sparkles,
  Send,
  RefreshCw,
  FileCode,
  Layers,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code2,
  GitBranch,
  Terminal,
  Database,
  ArrowDown,
  X,
  Search,
  BookOpen,
  Bug,
} from 'lucide-react';
import { api } from '../api/client';

const SUGGESTED_QUESTIONS = [
  { text: 'How does login work?', category: 'Architecture' },
  { text: 'Where is the login API implemented?', category: 'API' },
  { text: 'Which files depend on UserService?', category: 'Dependencies' },
  { text: 'What happens when a user creates an account?', category: 'Flow' },
  { text: 'Which APIs use this database?', category: 'Database' },
  { text: 'What will happen if I change this function?', category: 'Impact' },
  { text: 'Where are errors handled?', category: 'Resilience' },
  { text: 'Which tests cover this component?', category: 'Testing' },
];

const LOADING_STEPS = [
  'Parsing question intent & identifying target symbols...',
  'Querying DevTwin AST & project symbol tables...',
  'Traversing dependency graph & call hierarchy...',
  'Extracting verifiable file evidence & line numbers from disk...',
  'Verifying anti-hallucination grounding constraints...',
];

export default function AskCodebaseView({ scanData, onNavigateToDebugger, onNavigateToImpact }) {
  const [question, setQuestion] = useState('');
  const [activeResult, setActiveResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [selectedFileContent, setSelectedFileContent] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [isFileLoading, setIsFileLoading] = useState(false);

  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Loading animation step interval
  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 450);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleAsk = async (queryText) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);
    setSelectedFileContent(null);
    setSelectedFileName(null);

    try {
      const res = await api.askCodebase({
        question: q,
        rootPath: scanData?.rootPath,
      });

      if (res.success) {
        setActiveResult(res.data);
        setHistory((prev) => [
          { question: q, answer: res.data.answer, timestamp: new Date().toLocaleTimeString() },
          ...prev.filter((h) => h.question !== q).slice(0, 7),
        ]);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setError(res.error || 'Failed to resolve question.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with DevTwin assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspectFile = async (filePath) => {
    setIsFileLoading(true);
    setSelectedFileName(filePath);
    try {
      const res = await api.getFileContent(filePath, scanData?.rootPath);
      if (res.success) {
        setSelectedFileContent(res.data?.content || '// File is empty');
      } else {
        setSelectedFileContent(`// Could not load file: ${res.error}`);
      }
    } catch (err) {
      setSelectedFileContent(`// Error loading file: ${err.message}`);
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleCopyAnswer = () => {
    if (!activeResult?.answer) return;
    navigator.clipboard.writeText(activeResult.answer).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isInsufficient = activeResult?.answer?.includes("I couldn't determine this from the available project context.");
  const flowNodes = activeResult?.flowSteps || [];

  return (
    <div className="view-content">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <MessageSquareCode size={24} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
              ASK YOUR CODEBASE
            </h2>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: 'rgba(0,242,254,0.12)', border: '1px solid rgba(0,242,254,0.3)', color: 'var(--accent-cyan)' }}>
              Phase 14
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Contextual AI assistant grounded in DevTwin's indexed AST, dependency graph &amp; call hierarchy. Zero hallucinations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(52,211,153,0.08)', borderRadius: '20px', border: '1px solid rgba(52,211,153,0.25)' }}>
          <ShieldCheck size={14} color="var(--accent-emerald)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>
            Strict Grounding Active
          </span>
        </div>
      </div>

      {/* ── Query Input Box ──────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything: 'How does login work?', 'Which files depend on UserService?', 'Where are errors handled?'..."
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: '12px',
                paddingTop: '12px',
                paddingBottom: '12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontSize: '0.92rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="btn-primary"
            style={{
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, rgba(0,242,254,0.8) 0%, rgba(59,130,246,0.9) 100%)',
              border: '1px solid rgba(0,242,254,0.4)',
              cursor: isLoading || !question.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !question.trim() ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
            Ask Codebase
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '6px', color: 'var(--accent-rose)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Suggested Prompts */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Suggested Questions Grounded in Project
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {SUGGESTED_QUESTIONS.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuestion(sq.text);
                  handleAsk(sq.text);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,242,254,0.4)';
                  e.currentTarget.style.color = 'var(--accent-cyan)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Sparkles size={11} color="var(--accent-cyan)" />
                {sq.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Loading Animation ───────────────────────────────────── */}
      {isLoading && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', border: '1px solid rgba(0,242,254,0.3)', boxShadow: '0 0 30px rgba(0,242,254,0.1)' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(0,242,254,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(0,242,254,0.4)' }}>
            <MessageSquareCode size={22} color="var(--accent-cyan)" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            Analyzing Codebase Context...
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '440px', margin: '0 auto' }}>
            {LOADING_STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: i <= loadingStep ? 1 : 0.25, transition: 'opacity 0.3s' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: i < loadingStep ? 'var(--accent-emerald)' : i === loadingStep ? 'var(--accent-cyan)' : 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: i === loadingStep ? 'var(--accent-cyan)' : i < loadingStep ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Active Result View ──────────────────────────────────── */}
      {activeResult && !isLoading && (
        <div ref={resultsRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Question Banner */}
          <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,242,254,0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(0,242,254,0.3)' }}>
                Q
              </span>
              <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                {activeResult.question}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCopyAnswer}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                {copied ? <><Check size={12} color="var(--accent-emerald)" /> Copied</> : <><Copy size={12} /> Copy Answer</>}
              </button>
            </div>
          </div>

          {/* Insufficient Evidence Notice */}
          {isInsufficient && (
            <div className="card" style={{ border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.08)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <AlertCircle size={20} color="var(--accent-amber)" />
                <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Insufficient Project Context</h4>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                {activeResult.answer}
              </p>
            </div>
          )}

          {!isInsufficient && (
            <>
              {/* Visual Flow Diagram Component (for hierarchical flows) */}
              {flowNodes.length > 0 && (
                <div className="card" style={{ padding: '20px', border: '1px solid rgba(0,242,254,0.25)', background: 'rgba(15,23,42,0.85)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Layers size={16} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Execution Flow Diagram
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    {flowNodes.map((node, idx) => (
                      <React.Fragment key={idx}>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '540px',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: idx === 0 ? 'rgba(59,130,246,0.15)' : idx === flowNodes.length - 1 ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${idx === 0 ? 'rgba(59,130,246,0.35)' : idx === flowNodes.length - 1 ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.08)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                                {node.step}
                              </span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                {node.layer}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                              {node.component}
                            </div>
                            {node.description && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {node.description}
                              </div>
                            )}
                          </div>

                          {node.file && (
                            <button
                              type="button"
                              onClick={() => handleInspectFile(node.file)}
                              style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.25)', color: 'var(--accent-cyan)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FileCode size={11} /> {node.file.split('/').pop()}
                            </button>
                          )}
                        </div>

                        {idx < flowNodes.length - 1 && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '22px' }}>
                            <ArrowDown size={16} color="var(--accent-cyan)" style={{ opacity: 0.8 }} />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Formatted Answer text card */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Sparkles size={16} color="var(--accent-purple)" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Grounded Answer
                  </span>
                </div>
                <pre style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {activeResult.answer}
                </pre>
              </div>

              {/* 2-column layout: Relevant Files + Components */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>
                {/* Left: Relevant Files & Evidence */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Relevant Files */}
                  {activeResult.relevantFiles?.length > 0 && (
                    <div className="card" style={{ padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                        Relevant Files ({activeResult.relevantFiles.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activeResult.relevantFiles.map((file, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <FileCode size={15} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {file}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleInspectFile(file)}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.25)', borderRadius: '4px', color: 'var(--accent-cyan)', fontSize: '0.72rem', cursor: 'pointer', flexShrink: 0 }}
                            >
                              <ExternalLink size={11} /> Inspect
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence & Reasoning */}
                  {activeResult.evidence?.length > 0 && (
                    <div className="card" style={{ padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                        Evidence &amp; Traceable Reasoning ({activeResult.evidence.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activeResult.evidence.map((ev, idx) => (
                          <div key={idx} style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                                {ev.file}{ev.line ? `:${ev.line}` : ''}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {ev.reasoning}
                              </span>
                            </div>
                            <pre style={{ margin: 0, padding: '8px 10px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#cbd5e1', overflowX: 'auto', lineHeight: 1.5 }}>
                              {ev.snippet}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Components & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Relevant Components */}
                  {activeResult.relevantComponents?.length > 0 && (
                    <div className="card" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                        Relevant Components
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {activeResult.relevantComponents.map((comp, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '16px',
                              background: 'rgba(168,85,247,0.12)',
                              border: '1px solid rgba(168,85,247,0.3)',
                              color: 'var(--accent-purple)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions card */}
                  <div className="card" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                      Next Workflow Steps
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {onNavigateToDebugger && (
                        <button
                          type="button"
                          onClick={() => onNavigateToDebugger(activeResult.relevantFiles?.[0])}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '6px', color: 'var(--accent-amber)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <Bug size={14} /> Open Target in AI Debugger
                        </button>
                      )}
                      {onNavigateToImpact && (
                        <button
                          type="button"
                          onClick={() => onNavigateToImpact(activeResult.relevantFiles?.[0])}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '6px', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <GitBranch size={14} /> Simulate Blast Radius Impact
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grounding metadata */}
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <div>Resolved: {activeResult.timestamp ? new Date(activeResult.timestamp).toLocaleTimeString() : 'now'}</div>
                    <div>Grounded: {activeResult.isGrounded ? 'YES (AST Verified)' : 'NO'}</div>
                    <div style={{ marginTop: '4px', color: 'rgba(255,255,255,0.3)' }}>
                      Zero hallucinations enforced.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── File Inspector Modal Drawer ─────────────────────────── */}
      {selectedFileName && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
          onClick={() => { setSelectedFileName(null); setSelectedFileContent(null); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '800px',
              maxHeight: '85vh',
              background: '#0f172a',
              border: '1px solid rgba(0,242,254,0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 0 50px rgba(0,0,0,0.8)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode size={16} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {selectedFileName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedFileName(null); setSelectedFileContent(null); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'rgba(0,0,0,0.4)' }}>
              {isFileLoading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                  <div>Loading source code...</div>
                </div>
              ) : (
                <pre style={{ margin: 0, fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedFileContent}
                </pre>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {onNavigateToDebugger && (
                <button
                  type="button"
                  onClick={() => {
                    const fn = selectedFileName;
                    setSelectedFileName(null);
                    onNavigateToDebugger(fn);
                  }}
                  style={{ padding: '6px 14px', borderRadius: '4px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: 'var(--accent-amber)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Bug size={13} /> Open in Debugger
                </button>
              )}
              <button
                type="button"
                onClick={() => { setSelectedFileName(null); setSelectedFileContent(null); }}
                style={{ padding: '6px 14px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty State ────────────────────────────────────────── */}
      {!activeResult && !isLoading && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px', border: '1px dashed rgba(0,242,254,0.25)' }}>
          <MessageSquareCode size={48} color="rgba(0,242,254,0.4)" style={{ marginBottom: '14px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            Ask Any Question About Your Codebase
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            DevTwin inspects indexed ASTs, route declarations, dependency trees, and database connections to answer questions grounded in the real project.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', maxWidth: '720px', margin: '0 auto', textAlign: 'left' }}>
            {SUGGESTED_QUESTIONS.slice(0, 4).map((sq, i) => (
              <div
                key={i}
                onClick={() => {
                  setQuestion(sq.text);
                  handleAsk(sq.text);
                }}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,242,254,0.4)';
                  e.currentTarget.style.background = 'rgba(0,242,254,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {sq.category}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
                  "{sq.text}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
