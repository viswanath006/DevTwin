import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  Terminal,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';

export default function TestVerificationView({ scanData, initialTestFile, onVerificationComplete }) {
  const [frameworks, setFrameworks] = useState([]);
  const [selectedFramework, setSelectedFramework] = useState(null);
  const [command, setCommand] = useState('devtwin-verify all');
  const [selectedTestFile, setSelectedTestFile] = useState(initialTestFile || '');
  const [running, setRunning] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'terminal' | 'generated'
  const [generatedCode, setGeneratedCode] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Fetch detected test frameworks
  useEffect(() => {
    async function loadFrameworks() {
      try {
        const res = await api.getTestFrameworks(scanData?.rootPath);
        if (res.success && res.data?.frameworks) {
          setFrameworks(res.data.frameworks);
          if (res.data.frameworks.length > 0) {
            setSelectedFramework(res.data.frameworks[0]);
            setCommand(res.data.frameworks[0].command || 'devtwin-verify all');
          }
        }
      } catch (err) {
        console.warn('Could not load test frameworks:', err);
      }
    }
    loadFrameworks();
  }, [scanData?.rootPath]);

  // Presets for demo
  const presets = [
    {
      id: 'demo-verified',
      title: '⚡ Demo SaaS: Fix Verified (devtwin-verify all)',
      badge: 'Verified Fix',
      command: 'devtwin-verify all',
      file: 'tests/run_demo_tests.js',
      description: 'Executes Authentication, User Service, and API regression guards (3/3 PASSED)',
    },
    {
      id: 'demo-defect',
      title: '⚠️ Demo SaaS: Database Key Defect (1/3 FAILED)',
      badge: 'Defect Failure',
      command: 'devtwin-verify demo-fail',
      file: 'tests/user.test.js',
      description: 'Demonstrates strict non-verification before fix: fails with DatabaseValidationError in userRepository.js',
    },
    {
      id: 'full-regression',
      title: '⚡ Full Regression Suite (devtwin-verify all)',
      badge: 'All Guards',
      command: 'devtwin-verify all',
      file: '',
      description: 'Executes Authentication, User Service, and API regression guards (3/3 PASSED)',
    },
    {
      id: 'python-payments',
      title: '⚡ Python Payments Test (pytest test_payments.py)',
      badge: 'pytest',
      command: 'python -m pytest tests/test_payments.py',
      file: 'tests/test_payments.py',
      description: 'Executes real pytest on payment processor validation suite',
    },
    {
      id: 'python-calculator',
      title: '⚠️ Python Defect Test (pytest test_calculator.py)',
      badge: 'Failing Test',
      command: 'python -m pytest tests/test_calculator.py',
      file: 'tests/test_calculator.py',
      description: 'Fails with ZeroDivisionError — demonstrates strict non-verification of broken fixes',
    },
    {
      id: 'maven-tests',
      title: '⚡ Maven JUnit Suite (mvn test)',
      badge: 'Maven',
      command: 'mvn test',
      file: 'src/test/java/com/demo/UserTest.java',
      description: 'Executes Spring Boot / JUnit test assertions for User entity',
    },
  ];

  const handleApplyPreset = (p) => {
    setCommand(p.command);
    setSelectedTestFile(p.file);
    handleExecute(p.command, p.file);
  };

  const handleSelectFramework = (fw) => {
    setSelectedFramework(fw);
    setCommand(fw.command || 'devtwin-verify all');
    if (fw.testFiles && fw.testFiles.length > 0) {
      setSelectedTestFile(fw.testFiles[0]);
    }
  };

  const handleExecute = async (cmdToRun = command, fileToRun = selectedTestFile) => {
    setRunning(true);
    setTestResult(null);

    try {
      const res = await api.runVerification({
        projectPath: scanData?.rootPath,
        command: cmdToRun,
        testFile: fileToRun || undefined,
      });

      if (res.success) {
        setTestResult(res.data);
        if (onVerificationComplete) {
          onVerificationComplete(res.data);
        }
      } else {
        setTestResult({
          status: 'failed',
          isVerified: false,
          summary: 'EXECUTION ERROR',
          totalTests: 1,
          passedTests: 0,
          failedTests: 1,
          tests: [{ name: 'Command runner', status: 'failed', message: res.error }],
          output: res.error,
        });
      }
    } catch (err) {
      setTestResult({
        status: 'failed',
        isVerified: false,
        summary: 'EXECUTION REJECTED',
        totalTests: 1,
        passedTests: 0,
        failedTests: 1,
        tests: [{ name: 'Verification Engine', status: 'failed', message: err.message }],
        output: err.message,
      });
    } finally {
      setRunning(false);
    }
  };

  const handleGenerateTests = async () => {
    if (!selectedTestFile && (!scanData?.stats?.fileList || scanData.stats.fileList.length === 0)) return;
    const target = selectedTestFile || scanData.stats.fileList[0].relativePath;
    setGenerating(true);

    try {
      const res = await api.generateTests({
        targetFile: target,
        rootPath: scanData?.rootPath,
      });
      if (res.success) {
        setGeneratedCode(res.data);
        setActiveTab('generated');
      }
    } catch (err) {
      alert(`Test generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyOutput = () => {
    if (!testResult?.output) return;
    navigator.clipboard.writeText(testResult.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="view-content" style={{ padding: '18px 24px', overflowY: 'auto' }}>
      {/* Top Presets Bar for Demo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        <span
          style={{
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            fontWeight: 700,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Sparkles size={13} color="var(--accent-cyan)" />
          Verification Scenarios:
        </span>
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className="btn-secondary"
            style={{
              height: '30px',
              fontSize: '0.74rem',
              padding: '0 10px',
              whiteSpace: 'nowrap',
              background: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
            }}
            onClick={() => handleApplyPreset(p)}
          >
            <Play size={12} color="var(--accent-emerald)" />
            {p.title}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left: Test Execution Sandbox Controls */}
        <div className="panel-container">
          <div className="panel-header">
            <span style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              Safe Verification Controls
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--accent-emerald)',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 600,
              }}
            >
              🔒 Sandboxed
            </span>
          </div>

          <div className="panel-body">
            {/* Detected Frameworks Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Detected Test Frameworks
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {frameworks.map((fw) => (
                  <button
                    key={fw.id}
                    type="button"
                    className={`framework-chip ${selectedFramework?.id === fw.id ? 'active' : ''}`}
                    onClick={() => handleSelectFramework(fw)}
                  >
                    <Terminal size={12} color="var(--accent-cyan)" />
                    <span>{fw.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Test File Selector */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Test Target File
              </label>
              <select
                className="input-box"
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
                value={selectedTestFile}
                onChange={(e) => {
                  setSelectedTestFile(e.target.value);
                  if (e.target.value.endsWith('.py')) {
                    setCommand(`python -m pytest ${e.target.value}`);
                  }
                }}
              >
                <option value="">-- All Test Suites (Full Regression) --</option>
                {selectedFramework?.testFiles?.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
                {scanData?.tests?.map((t) => (
                  <option key={t.file} value={t.file}>
                    {t.file}
                  </option>
                ))}
              </select>
            </div>

            {/* Whitelisted Command Input */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Safe Execution Command
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                  ✓ Whitelist Guard
                </span>
              </div>
              <input
                type="text"
                className="input-box"
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g. python -m pytest tests/test_payments.py"
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Permitted: <code style={{ color: 'var(--accent-cyan)' }}>pytest</code>,{' '}
                <code style={{ color: 'var(--accent-cyan)' }}>npm test</code>,{' '}
                <code style={{ color: 'var(--accent-cyan)' }}>mvn test</code>,{' '}
                <code style={{ color: 'var(--accent-cyan)' }}>gradle test</code>. Arbitrary commands are blocked.
              </p>
            </div>

            {/* Run Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  height: '42px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  gap: '8px',
                }}
                disabled={running}
                onClick={() => handleExecute()}
              >
                {running ? (
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Play size={16} />
                )}
                {running ? 'Running tests...' : 'Run Verification'}
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', height: '34px', fontSize: '0.78rem' }}
                onClick={handleGenerateTests}
                disabled={generating}
              >
                <Sparkles size={14} color="var(--accent-cyan)" />
                {generating ? 'Synthesizing...' : 'Generate New Test Spec'}
              </button>
            </div>

            {/* Safety Notice */}
            <div
              style={{
                marginTop: '18px',
                background: 'rgba(0, 242, 254, 0.04)',
                border: '1px solid rgba(0, 242, 254, 0.15)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '0.74rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={13} />
                Safety Guarantee
              </div>
              DevTwin executes verification processes inside a constrained subshell with timeouts and strict command filtering. It never modifies your repository files automatically.
            </div>
          </div>
        </div>

        {/* Right: VERIFY FIX Results Display */}
        <div>
          {/* Header Banner */}
          <div className="verify-fix-banner">
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                PROCESS VERIFICATION HARNESS
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                VERIFY FIX
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Command: {command}
              </div>
            </div>

            {/* Result Badge */}
            {testResult && (
              <div className={`verify-badge ${testResult.isVerified ? 'passed' : 'failed'}`}>
                {testResult.isVerified ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {testResult.isVerified ? `VERIFIED (${testResult.summary})` : `FAILED (${testResult.summary})`}
              </div>
            )}
          </div>

          {/* Running State with Test Running Glow Animation */}
          {running && (
            <div
              className="panel-container test-running-box"
              style={{
                padding: '40px 24px',
                textAlign: 'center',
                background: 'var(--bg-card)',
                border: '1px solid var(--accent-cyan)',
              }}
            >
              <RefreshCw
                size={36}
                color="var(--accent-cyan)"
                style={{ animation: 'spin 1.2s linear infinite', marginBottom: '14px' }}
              />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>
                Running tests...
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                Executing controlled child process with stdio capture and assertion parsing...
              </p>
            </div>
          )}

          {/* No Run State */}
          {!running && !testResult && (
            <div
              className="panel-container"
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <ShieldCheck size={48} style={{ opacity: 0.25, marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Verification Engine Ready
              </h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                Click <strong>"Run Verification"</strong> or choose a test scenario preset from above to validate contract guards, unit tests, and API regressions.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleApplyPreset(presets[0])}
                style={{ fontSize: '0.8rem', margin: '0 auto' }}
              >
                <Play size={14} />
                Run Full Regression Check (3/3)
              </button>
            </div>
          )}

          {/* Verification Results State */}
          {!running && testResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Individual Tests List (Exact Prompt Format: ✓ test, ✓ test, ✓ test, 3/3 PASSED) */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    EXECUTION ASSERTIONS
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    Duration: {testResult.durationMs}ms
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {testResult.tests?.map((t, idx) => (
                    <div
                      key={idx}
                      className={`verify-test-card ${t.status === 'passed' ? 'passed' : 'failed'}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {t.status === 'passed' ? (
                          <CheckCircle2 size={16} color="var(--accent-emerald)" />
                        ) : (
                          <XCircle size={16} color="var(--accent-rose)" />
                        )}
                        <span
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            color: t.status === 'passed' ? 'var(--text-primary)' : 'var(--accent-rose)',
                          }}
                        >
                          {t.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: t.status === 'passed' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                        }}
                      >
                        {t.status === 'passed' ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Summary Banner (e.g. 3/3 PASSED or 1/2 FAILED) */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-sm)',
                    background: testResult.isVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                    border: `1px solid ${testResult.isVerified ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {testResult.isVerified ? (
                      <CheckCircle2 size={20} color="var(--accent-emerald)" />
                    ) : (
                      <AlertTriangle size={20} color="var(--accent-rose)" />
                    )}
                    <div>
                      <div
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: testResult.isVerified ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                        }}
                      >
                        {testResult.summary}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {testResult.isVerified
                          ? 'All test assertions satisfied. Fix is officially verified.'
                          : 'Test assertions failed. Fix is NOT verified.'}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: testResult.isVerified ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                    }}
                  >
                    {testResult.passedTests}/{testResult.totalTests} Checks
                  </span>
                </div>

                {/* Important Guard notice when failed */}
                {!testResult.isVerified && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      background: 'rgba(244, 63, 94, 0.08)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      fontSize: '0.78rem',
                      color: 'var(--accent-rose)',
                    }}
                  >
                    ⚠️ <strong>Anti-Hallucination Policy:</strong> DevTwin does not claim code is fixed while automated test assertions fail. Check the stack trace below to refine the patch.
                  </div>
                )}
              </div>

              {/* stdout / stderr Captured Output Console */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--bg-sidebar)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={14} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Process Output (stdout / stderr)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ height: '24px', fontSize: '0.7rem', padding: '0 8px' }}
                    onClick={handleCopyOutput}
                  >
                    {copied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy Output'}
                  </button>
                </div>

                <div className="verify-terminal">
                  {testResult.output || testResult.stdout || testResult.stderr || 'No console output returned.'}
                </div>
              </div>

              {/* Generated Test Spec (if user generated one) */}
              {generatedCode && activeTab === 'generated' && (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: 'var(--bg-sidebar)',
                    }}
                  >
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Generated Spec: {generatedCode.framework}
                    </span>
                  </div>
                  <pre
                    style={{
                      background: '#07090e',
                      padding: '14px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      overflowX: 'auto',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {generatedCode.testCode}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
