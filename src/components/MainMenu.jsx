import React, { useMemo } from 'react';
import { sound } from '../game/sound.js';
import HeliIcon from './HeliIcon.jsx';

function useFloatingParticles(count = 18) {
  return useMemo(() => (
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 10,
      cool: Math.random() > 0.55
    }))
  ), [count]);
}

function useClouds(count = 5) {
  return useMemo(() => (
    Array.from({ length: count }, (_, i) => ({
      id: i,
      top: 10 + Math.random() * 60,
      duration: 22 + Math.random() * 20,
      delay: -Math.random() * 30,
      scale: 0.7 + Math.random() * 1.2
    }))
  ), [count]);
}

export default function MainMenu({ best, onPlay, onHowTo, onSettings }) {
  const particles = useFloatingParticles();
  const clouds = useClouds();

  const hoverSound = () => sound.play('hover');

  return (
    <div className="screen">
      <div className="menu-backdrop">
        {clouds.map((c) => (
          <div
            key={c.id}
            className="menu-cloud"
            style={{
              top: `${c.top}%`,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
              transform: `scale(${c.scale})`
            }}
          />
        ))}
        {particles.map((p) => (
          <div
            key={p.id}
            className={`floating-particle ${p.cool ? 'cool' : ''}`}
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              bottom: 0,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
        <div className="menu-heli" aria-hidden="true">
          <HeliIcon size={110} />
        </div>
      </div>

      <div className="title-text">HELICOPTER ESCAPE 🚁</div>
      <div className="subtitle-text">Army Rescue Operation — Hold. Fly. Save Lives.</div>

      {best > 0 && (
        <div style={{ marginTop: 14, color: 'var(--color-amber)', fontSize: 14, letterSpacing: 1, zIndex: 1 }}>
          BEST&nbsp;&nbsp;{best}
        </div>
      )}

      <div className="menu-stack">
        <button className="neon-btn" onMouseEnter={hoverSound} onClick={onPlay}>PLAY</button>
        <button className="neon-btn secondary" onMouseEnter={hoverSound} onClick={onHowTo}>HOW TO PLAY</button>
        <button className="neon-btn secondary" onMouseEnter={hoverSound} onClick={onSettings}>SETTINGS</button>
        <button
          className="neon-btn secondary magenta"
          onMouseEnter={hoverSound}
          onClick={() => window.close && window.close()}
        >
          EXIT
        </button>
      </div>
    </div>
  );
}
