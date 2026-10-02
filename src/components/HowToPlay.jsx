import React from 'react';

export default function HowToPlay({ onBack }) {
  return (
    <div className="screen">
      <div className="glass-panel" style={{ padding: '34px 42px', maxWidth: 520 }}>
        <div className="panel-title">HOW TO PLAY</div>
        <div className="howto-list">
          <div className="howto-item">
            <div className="howto-icon">🛫</div>
            Every mission starts with a rooftop takeoff - your bird lifts off the helipad automatically.
          </div>
          <div className="howto-item">
            <div className="howto-icon">🖱️</div>
            Hold the left mouse button (or Space) to rise. Release to fall.
          </div>
          <div className="howto-item">
            <div className="howto-icon">🚧</div>
            Weave through buildings, pipes, lasers, barriers, and drones.
          </div>
          <div className="howto-item">
            <div className="howto-icon">🧍</div>
            Every 500 points triggers a rescue operation - fly close and winch civilians, soldiers, supply crates, and raft survivors aboard for bonus points.
          </div>
          <div className="howto-item">
            <div className="howto-icon">⚡</div>
            The longer you survive, the faster and tighter it gets.
          </div>
          <div className="howto-item">
            <div className="howto-icon">⏸️</div>
            Press P or Esc anytime to pause.
          </div>
          <div className="howto-item">
            <div className="howto-icon">🏆</div>
            Beat your best score and crash trying again.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="neon-btn" onClick={onBack}>BACK</button>
        </div>
      </div>
    </div>
  );
}
