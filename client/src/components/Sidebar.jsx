import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Bug,
  Zap,
  ShieldAlert,
  MoreHorizontal,
  GitPullRequest,
  MessageSquareCode,
  GitMerge,
  Layers,
  Activity,
  Server,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const PRIMARY_NAV = [
  { id: 'dashboard',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'debugger',   label: 'Debugger',  icon: Bug              },
  { id: 'impact',     label: 'Impact',    icon: Zap              },
  { id: 'security',   label: 'Security',  icon: ShieldAlert      },
];

const MORE_NAV = [
  { id: 'review',       label: 'Code Review',        icon: GitPullRequest    },
  { id: 'ask',          label: 'Ask Codebase',       icon: MessageSquareCode },
  { id: 'git',          label: 'Git Intelligence',   icon: GitMerge          },
  { id: 'architecture', label: 'Architecture Drift', icon: Layers            },
  { id: 'whatif',       label: 'What-If Analysis',   icon: Activity          },
];

export default function Sidebar({ activeTab, setActiveTab, health, isConnected, onLoadDemo }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // Close "More" menu when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [moreOpen]);

  const isMoreActive = MORE_NAV.some((n) => n.id === activeTab);

  const handleNav = (id) => {
    setActiveTab(id);
    setMoreOpen(false);
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Sparkles size={16} color="#fff" />
        </div>
        <div>
          <div className="brand-name">DevTwin</div>
          <div className="brand-sub">AI Digital Twin</div>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="sidebar-section">
        <span className="sidebar-section-label">Main</span>
        <nav className="sidebar-nav">
          {PRIMARY_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => handleNav(id)}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-divider" />

      {/* More Section */}
      <div className="sidebar-section" style={{ flex: 1 }}>
        <span className="sidebar-section-label">More</span>
        <div style={{ position: 'relative' }} ref={moreRef}>
          {/* More button — shows active if any secondary page is active */}
          <button
            className={`sidebar-more-btn ${moreOpen ? 'open' : ''} ${isMoreActive ? 'active' : ''}`}
            onClick={() => setMoreOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.83rem',
              fontWeight: 500,
              color: isMoreActive ? 'var(--accent-primary)' : moreOpen ? 'var(--text-primary)' : 'var(--text-muted)',
              background: isMoreActive
                ? 'rgba(99,102,241,0.08)'
                : moreOpen
                ? 'rgba(255,255,255,0.04)'
                : 'transparent',
              border: isMoreActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <MoreHorizontal size={16} />
            <span style={{ flex: 1 }}>
              {isMoreActive
                ? MORE_NAV.find((n) => n.id === activeTab)?.label || 'More'
                : 'More features'}
            </span>
            <ChevronRight
              size={14}
              style={{
                transition: 'transform 0.15s',
                transform: moreOpen ? 'rotate(90deg)' : 'none',
                color: 'var(--text-muted)',
              }}
            />
          </button>

          {/* Dropdown */}
          {moreOpen && (
            <div className="more-menu fade-in">
              {MORE_NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`more-menu-item ${activeTab === id ? 'active' : ''}`}
                  onClick={() => handleNav(id)}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {onLoadDemo && (
          <button
            onClick={onLoadDemo}
            className="btn-demo"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8, height: 30, fontSize: '0.75rem' }}
          >
            <Sparkles size={13} />
            Load Demo
          </button>
        )}
        <div className="server-status">
          <div className={`status-dot ${isConnected ? 'online' : 'offline'} ${isConnected ? 'pulse' : ''}`} />
          <span style={{ color: 'var(--text-secondary)', flex: 1 }}>Server</span>
          <span style={{ color: isConnected ? 'var(--color-success)' : 'var(--color-critical)', fontWeight: 600, fontSize: '0.68rem' }}>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 2px', marginTop: 4 }}>
          <Server size={12} color="var(--text-muted)" />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            AI: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{health?.aiProvider || 'Mock'}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
