import React from 'react';

const ICONS = { civilian: '🧍', soldier: '🎖️', crate: '📦', survivor: '🛟' };

export default function RescueBanner({ status }) {
  if (!status) return null;

  const isComplete = status.phase === 'complete';
  const isWinch = status.phase === 'winch';

  return (
    <div className="rescue-banner" key={status.variant + status.phase}>
      <span className="rescue-icon">{ICONS[status.variant] || '🚁'}</span>
      <div>
        <div className="rescue-title">
          {isComplete ? `${status.label} COMPLETE` : status.label}
        </div>
        <div className="rescue-sub">
          {isComplete ? `+${status.bonus} BONUS` : isWinch ? 'Winching survivor aboard...' : status.sub}
        </div>
      </div>
    </div>
  );
}
