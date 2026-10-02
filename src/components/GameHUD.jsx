import React, { useEffect, useRef, useState } from 'react';

export default function GameHUD({ score, best, onPause }) {
  const [bump, setBump] = useState(false);
  const lastScore = useRef(score);

  useEffect(() => {
    if (Math.floor(score / 10) !== Math.floor(lastScore.current / 10)) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 120);
      lastScore.current = score;
      return () => clearTimeout(t);
    }
    lastScore.current = score;
  }, [score]);

  return (
    <div className="hud">
      <div>
        <div className={`hud-score ${bump ? 'bump' : ''}`}>{score}</div>
        <div className="hud-best">BEST {best}</div>
      </div>
      <button className="neon-btn small hud-pause-btn secondary" onClick={onPause} aria-label="Pause">
        ⏸
      </button>
    </div>
  );
}
