import React, { useState } from 'react';

/**
 * BackgroundVideo Component
 * Subtle developer/code-related background video only on the dashboard hero area.
 * Includes a dark obsidian overlay for optimal legibility and static fallback.
 */
export default function BackgroundVideo() {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className="dashboard-bg-video-wrap"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '380px',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        userSelect: 'none',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {!hasError && (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/assets/code-bg-poster.jpg"
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.38,
            filter: 'contrast(1.15) brightness(0.85)',
            transform: 'scale(1.02)',
          }}
        >
          <source src="/assets/code-bg.mp4" type="video/mp4" />
        </video>
      )}

      {/* Dark Ambient Overlay (ensures content remains 100% readable) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(8, 9, 12, 0.5) 0%, rgba(8, 9, 12, 0.88) 60%, #08090C 100%), radial-gradient(circle at 50% 20%, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
