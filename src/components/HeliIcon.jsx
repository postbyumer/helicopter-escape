import React from 'react';

// This mirrors src/game/helicopter.js's HELI_COLORS and silhouette as
// closely as SVG allows, so the menu icon and the in-flight sprite are
// the same helicopter, not two different designs.
export default function HeliIcon({ size = 96, className = '', animated = true }) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 0.58}
      viewBox="0 0 140 82"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heliBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff9a4d" />
          <stop offset="55%" stopColor="#ff7a1f" />
          <stop offset="100%" stopColor="#e05f10" />
        </linearGradient>
      </defs>

      {/* Skids */}
      <g stroke="#2a2f3a" strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M48 58 L42 70" />
        <path d="M94 59 L88 70" />
        <path d="M36 70 L100 70" strokeWidth="3.2" />
      </g>

      {/* Tail boom + fin */}
      <path
        d="M52 40 Q30 34 14 38 L14 44 Q30 48 52 46 Z"
        fill="#ff7a1f"
        stroke="#e05f10"
        strokeWidth="1.6"
      />
      <path d="M18 24 L14 40 L24 40 Z" fill="#e05f10" />
      <circle cx="12" cy="41" r="1.8" fill="#ff4d4d" />

      {/* Tail rotor */}
      {animated && (
        <g style={{ transformOrigin: '13px 41px', animation: 'tailrotor-spin 0.4s linear infinite' }}>
          <line x1="13" y1="34" x2="13" y2="48" stroke="#dfe3ea" strokeWidth="1.6" />
        </g>
      )}
      <circle cx="13" cy="41" r="7" fill="none" stroke="#aeb4c2" strokeWidth="1.4" opacity="0.25" />

      {/* Body */}
      <path
        d="M58 40 C 56 24 72 16 86 18 C 100 20 106 32 104 44
           C 102 56 90 62 76 60 C 64 58 60 50 58 40 Z"
        fill="url(#heliBodyGrad)"
        stroke="#e05f10"
        strokeWidth="1.8"
      />
      {/* Gloss highlight */}
      <ellipse cx="70" cy="26" rx="12" ry="6" fill="#ffffff" opacity="0.32" transform="rotate(-18 70 26)" />

      {/* Cockpit glass */}
      <ellipse cx="82" cy="38" rx="15" ry="19" fill="#2a2f3a" stroke="#e05f10" strokeWidth="1.4" />
      <ellipse cx="77" cy="30" rx="3" ry="6" fill="#ffffff" opacity="0.55" transform="rotate(-25 77 30)" />

      {/* Rotor mast */}
      <line x1="70" y1="18" x2="70" y2="8" stroke="#8a8f9c" strokeWidth="3" strokeLinecap="round" />

      {/* Main rotor - spins as a rigid bar, always reading level at rest */}
      <g style={animated ? { transformOrigin: '70px 7px', animation: 'rotor-spin 0.6s linear infinite' } : undefined}>
        <ellipse cx="70" cy="7" rx="62" ry="2.4" fill="#dfe3ea" opacity="0.18" />
        <rect x="10" y="5.5" width="120" height="3" rx="1.5" fill="#dfe3ea" />
        <circle cx="70" cy="7" r="4" fill="#6b7180" />
      </g>
    </svg>
  );
}
