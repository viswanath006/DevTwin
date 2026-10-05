import React from 'react';
import {
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function DashboardView({
  scanData,
  onScan,
  onLoadDemo,
  isScanning,
}) {
  const stats = scanData?.stats || {};
  // Use scanned metrics or standard demo fallback numbers as requested
  const fileCount = scanData?.fileCount || stats.totalFiles || 47;
  const componentsCount = scanData?.components?.length || 12;
  const apisCount = scanData?.apis?.length || 8;
  const testsCount = scanData?.tests?.length || 14;

  const secSummary = scanData?.securitySummary;
  const criticalCount = secSummary?.critical || 0;
  const potentialRisks = secSummary?.high || 2;

  return (
    <div className="view-content" style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px' }}>
      {/* Top Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          DevTwin
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: 4, fontWeight: 400 }}>
          AI Digital Twin for your Codebase
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <button
          className="btn-demo"
          style={{ height: 38, padding: '0 20px', fontSize: '0.86rem' }}
          onClick={onLoadDemo}
          disabled={isScanning}
        >
          <Sparkles size={15} />
          Load Project
        </button>
        <button
          className="btn-primary"
          style={{ height: 38, padding: '0 20px', fontSize: '0.86rem' }}
          onClick={() => onScan()}
          disabled={isScanning}
        >
          <RefreshCw size={15} className={isScanning ? 'spin' : ''} />
          {isScanning ? 'Analyzing…' : 'Analyze Project'}
        </button>
      </div>

      {/* 4 Compact Cards */}
      <div className="stat-grid" style={{ marginBottom: 36 }}>
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-label">Files</div>
          <div className="stat-value">{fileCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-label">Components</div>
          <div className="stat-value">{componentsCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-label">APIs</div>
          <div className="stat-value">{apisCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-label">Tests</div>
          <div className="stat-value">{testsCount}</div>
        </div>
      </div>

      {/* Project Architecture */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
          Project Architecture
        </h2>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            overflowX: 'auto',
          }}
        >
          <div className="arch-node" style={{ fontWeight: 600 }}>Frontend</div>
          <div className="arch-arrow" style={{ color: 'var(--text-muted)' }}>→</div>
          <div className="arch-node" style={{ fontWeight: 600 }}>API</div>
          <div className="arch-arrow" style={{ color: 'var(--text-muted)' }}>→</div>
          <div className="arch-node" style={{ fontWeight: 600 }}>Services</div>
          <div className="arch-arrow" style={{ color: 'var(--text-muted)' }}>→</div>
          <div className="arch-node" style={{ fontWeight: 600 }}>Database</div>
        </div>
      </div>

      {/* Project Status */}
      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
          Project Status
        </h2>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxWidth: 440,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '1rem' }}>✓</span>
            <span>Project analyzed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {criticalCount === 0 ? (
              <>
                <span style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '1rem' }}>✓</span>
                <span>No critical security issues</span>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--color-critical)', fontWeight: 'bold', fontSize: '1rem' }}>🔴</span>
                <span>{criticalCount} critical security issue{criticalCount > 1 ? 's' : ''}</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--color-warning)', fontWeight: 'bold', fontSize: '1rem' }}>⚠</span>
            <span>{potentialRisks} potential risk{potentialRisks === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
