import React from 'react';

export default function PauseMenu({ onResume, onRestart, onMainMenu, onSettings }) {
  return (
    <div className="overlay-dim">
      <div className="glass-panel" style={{ padding: '34px 46px', textAlign: 'center' }}>
        <div className="panel-title">PAUSED</div>
        <div className="menu-stack" style={{ marginTop: 0 }}>
          <button className="neon-btn" onClick={onResume}>RESUME</button>
          <button className="neon-btn secondary" onClick={onRestart}>RESTART</button>
          <button className="neon-btn secondary" onClick={onSettings}>SETTINGS</button>
          <button className="neon-btn secondary magenta" onClick={onMainMenu}>MAIN MENU</button>
        </div>
      </div>
    </div>
  );
}
