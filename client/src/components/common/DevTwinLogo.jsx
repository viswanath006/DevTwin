import React from 'react';

/**
 * DevTwin Brand Logo
 * Minimal geometric twin mark embodying software intelligence & digital twin concepts.
 * Visual Identity: Black + Charcoal + Crimson Red.
 */
export default function DevTwinLogo({
  size = 28,
  withText = false,
  subtitle = false,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`devtwin-brand-wrap ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size > 24 ? 12 : 8,
        textDecoration: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Geometric Digital Twin Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, display: 'block' }}
      >
        <defs>
          {/* Crimson Red Gradient */}
          <linearGradient id="dtRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>

          {/* Charcoal Facet Gradient */}
          <linearGradient id="dtDarkGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E2330" />
            <stop offset="100%" stopColor="#0F1219" />
          </linearGradient>

          <linearGradient id="dtDarkGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A3042" />
            <stop offset="100%" stopColor="#141722" />
          </linearGradient>

          {/* Crimson Core Glow */}
          <filter id="dtRedGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#EF4444" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Base Outer Squircle / Frame */}
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="10"
          fill="#0B0D13"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
        />

        {/* Left Twin Facet (Codebase Anchor) */}
        <path
          d="M13 11L20 7L20 17L13 21Z"
          fill="url(#dtDarkGrad2)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="0.8"
        />
        <path
          d="M13 21L20 17L20 27L13 31Z"
          fill="url(#dtDarkGrad1)"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="0.8"
        />

        {/* Right Twin Facet (Digital Twin Mirror) */}
        <path
          d="M27 11L20 7L20 17L27 21Z"
          fill="url(#dtDarkGrad1)"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="0.8"
        />
        <path
          d="M27 21L20 17L20 27L27 31Z"
          fill="url(#dtDarkGrad2)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="0.8"
        />

        {/* Central Laser Twin Core (Active Software Intelligence Heart) */}
        <polygon
          points="20,13 24,19 20,25 16,19"
          fill="url(#dtRedGrad)"
          filter="url(#dtRedGlow)"
        />

        {/* Subtle Apex Twin Dots */}
        <circle cx="20" cy="8" r="1.2" fill="#EF4444" opacity="0.9" />
        <circle cx="20" cy="30" r="1.2" fill="#EF4444" opacity="0.9" />
      </svg>

      {/* Typography if requested */}
      {withText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span
            style={{
              fontSize: size > 24 ? '1.15rem' : '0.96rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            Dev<span style={{ color: '#EF4444' }}>Twin</span>
          </span>

          {subtitle && (
            <span
              style={{
                fontSize: size > 24 ? '0.68rem' : '0.62rem',
                color: '#94A3B8',
                fontWeight: 500,
                letterSpacing: '0.01em',
                marginTop: 2,
              }}
            >
              AI Digital Twin for Software
            </span>
          )}
        </div>
      )}
    </div>
  );
}
