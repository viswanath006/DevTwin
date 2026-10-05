import React from 'react';
import {
  Layers,
  Bug,
  Zap,
  ShieldAlert,
  GitFork,
  Activity,
  MessageSquareCode,
  GitPullRequest,
  GitMerge,
  Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Digital Twin Overview', icon: Layers },
  { id: 'debugger',     label: 'AI Debugger',           icon: Bug },
  { id: 'impact',       label: 'Change Impact',         icon: Zap },
  { id: 'security',     label: 'Security Scanner',      icon: ShieldAlert },
  { id: 'architecture', label: 'Architecture Drift',    icon: GitFork },
  { id: 'whatif',       label: 'What-If Analysis',      icon: Activity },
  { id: 'ask',          label: 'Ask Codebase',          icon: MessageSquareCode },
  { id: 'review',       label: 'Code Review',           icon: GitPullRequest },
  { id: 'git',          label: 'Git Intelligence',      icon: GitMerge },
];

export default function Sidebar({ activeTab, setActiveTab, isConnected, onLoadDemo }) {
  return (
    <aside className="ref-rail">
      {/* DevTwin "D" Logo Squircle */}
      <div
        className="ref-logo-d"
        onClick={() => setActiveTab('dashboard')}
        title="DevTwin — AI Digital Twin for Codebase"
        style={{ cursor: 'pointer' }}
      >
        D
      </div>

      {/* Navigation Icons Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              className={`ref-rail-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
              title={label}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>

      {/* Footer Controls: Demo & Status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
        {onLoadDemo && (
          <button
            className="ref-rail-btn"
            onClick={onLoadDemo}
            title="Load SaaS Demo Microservice"
            style={{ color: '#FF8E53' }}
          >
            <Sparkles size={16} />
          </button>
        )}

        <div
          title={isConnected ? 'Backend Server Online' : 'Backend Server Offline'}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isConnected ? '#10B981' : '#F43F5E',
            boxShadow: isConnected ? '0 0 10px #10B981' : '0 0 10px #F43F5E',
            marginBottom: 4,
          }}
        />
      </div>
    </aside>
  );
}
