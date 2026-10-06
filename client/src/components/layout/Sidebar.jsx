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
  LogOut,
  User,
} from 'lucide-react';
import DevTwinLogo from '../common/DevTwinLogo';

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

export default function Sidebar({
  activeTab,
  setActiveTab,
  isConnected,
  onLoadDemo,
  currentUser,
  onLogout,
}) {
  return (
    <aside className="ref-rail">
      {/* DevTwin Geometric Logo Mark */}
      <div
        onClick={() => setActiveTab('dashboard')}
        title="DevTwin — AI Digital Twin for Software"
        style={{ cursor: 'pointer', transition: 'transform 0.2s ease', marginBottom: 4 }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <DevTwinLogo size={34} />
      </div>

      {/* Navigation Icons Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginTop: 4 }}>
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

      {/* Footer Controls: User Session, Demo & Status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
        {onLoadDemo && (
          <button
            className="ref-rail-btn"
            onClick={onLoadDemo}
            title="Load SaaS Demo Microservice"
            style={{ color: '#EF4444' }}
          >
            <Sparkles size={16} />
          </button>
        )}

        {/* User Account / Logout */}
        {currentUser && (
          <button
            className="ref-rail-btn"
            onClick={onLogout}
            title={`Logged in as ${currentUser.email} (${currentUser.role}). Click to Logout.`}
            style={{ color: '#94A3B8' }}
          >
            <LogOut size={15} />
          </button>
        )}

        {/* Server Connection Indicator */}
        <div
          title={isConnected ? 'Backend Server Online (Local AST Engine)' : 'Backend Server Offline'}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isConnected ? '#10B981' : '#EF4444',
            boxShadow: isConnected ? '0 0 10px #10B981' : '0 0 10px #EF4444',
            marginBottom: 4,
          }}
        />
      </div>
    </aside>
  );
}
