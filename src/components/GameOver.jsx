import React, { useEffect, useState } from 'react';

export default function GameOver({ score, best, isRecord, onPlayAgain, onMainMenu }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let raf;
    const duration = 700;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.floor(eased * score));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="overlay-dim">
      <div className="glass-panel" style={{ padding: '36px 50px', textAlign: 'center', minWidth: 360 }}>
        <div className="gameover-title">GAME OVER</div>
        <div className="gameover-score">{displayScore}</div>
        <div style={{ color: 'var(--color-text-dim)', fontSize: 14, letterSpacing: 1 }}>
          BEST&nbsp;&nbsp;{best}
        </div>
        {isRecord && <div className="record-badge">🏆 NEW BEST!</div>}

        <div className="menu-stack">
          <button className="neon-btn" onClick={onPlayAgain}>PLAY AGAIN</button>
          <button className="neon-btn secondary" onClick={onMainMenu}>MAIN MENU</button>
        </div>
      </div>
    </div>
  );
}
