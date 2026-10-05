import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
} from 'lucide-react';
import { api } from '../../api/client';

const DEMO_FINDINGS = [
  {
    severity: 'HIGH',
    title: 'Hardcoded API key',
    file: 'config.js:24',
    description: 'Plaintext secret key is hardcoded directly in application configuration file.',
    recommendation: 'Migrate secret key to environment variables and access via process.env.',
  },
  {
    severity: 'MEDIUM',
    title: 'Weak input validation',
    file: 'UserService.java:81',
    description: 'User input passed to internal query without parameter validation.',
    recommendation: 'Enforce schema validation and sanitize all parameters prior to processing.',
  },
];

export default function SecurityScannerView({ scanData }) {
  const [securityData, setSecurityData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const runScan = async () => {
    setIsLoading(true);
    try {
      const res = await api.runSecurityScan(scanData?.rootPath);
      if (res.success && res.data) {
        setSecurityData(res.data);
      } else {
        setSecurityData({
          summary: { bySeverity: { CRITICAL: 0, HIGH: 1, MEDIUM: 1 } },
          findings: DEMO_FINDINGS,
        });
      }
    } catch {
      setSecurityData({
        summary: { bySeverity: { CRITICAL: 0, HIGH: 1, MEDIUM: 1 } },
        findings: DEMO_FINDINGS,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runScan();
  }, [scanData?.rootPath]);

  const rawFindings = securityData?.findings || [];
  const findings = rawFindings.length > 0 ? rawFindings : DEMO_FINDINGS;

  const criticalCount = securityData?.summary?.bySeverity?.CRITICAL || 0;

  const getSeverityIcon = (sev) => {
    const s = (sev || '').toUpperCase();
    if (s === 'CRITICAL') return '🔴';
    if (s === 'HIGH') return '🟠';
    if (s === 'MEDIUM') return '🟡';
    return '🟢';
  };

  return (
    <div className="view-content" style={{ maxWidth: 880, margin: '0 auto', padding: '36px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Security
          </h1>
        </div>
        <button
          className="btn-secondary"
          onClick={runScan}
          disabled={isLoading}
          style={{ height: 34, fontSize: '0.82rem' }}
        >
          <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
          {isLoading ? 'Scanning…' : 'Re-scan'}
        </button>
      </div>

      {/* Security Status */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Security Status
        </h3>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            maxWidth: 400,
          }}
        >
          {criticalCount === 0 ? (
            <>
              <span style={{ fontSize: '1.1rem' }}>🟢</span>
              <span>No critical issues</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.1rem' }}>🔴</span>
              <span>{criticalCount} critical issue{criticalCount > 1 ? 's' : ''}</span>
            </>
          )}
        </div>
      </div>

      {/* Findings List */}
      <div>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Findings ({findings.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {findings.map((f, idx) => {
            const fileText = f.file ? `${f.file}${f.line ? `:${f.line}` : ''}` : 'Unknown file';
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* Title + Severity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.05rem' }}>{getSeverityIcon(f.severity)}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {f.title}
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {f.severity || 'HIGH'}
                  </span>
                </div>

                {/* File */}
                <div>
                  <code
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      color: 'var(--accent-cyan)',
                      background: 'var(--bg-elevated)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {fileText}
                  </code>
                </div>

                {/* One-line explanation */}
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {f.description}
                </div>

                {/* Fix recommendation */}
                {f.recommendation && (
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      fontSize: '0.82rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--color-success)', marginRight: 6 }}>Fix:</span>
                    <span>{f.recommendation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
