import React from 'react';
import { sound } from '../game/sound.js';

function Toggle({ on, onChange }) {
  return (
    <button
      className={`toggle ${on ? 'on' : ''}`}
      onClick={() => { sound.play('click'); onChange(!on); }}
      aria-pressed={on}
    >
      <span className="toggle-knob" />
    </button>
  );
}

export default function Settings({
  settings,
  updateSetting,
  onResetSettings,
  onResetHighScore,
  onBack,
  embedded = false
}) {
  const toggleFullscreen = async () => {
    const next = !settings.fullscreen;
    updateSetting('fullscreen', next);
    if (window.desktop?.toggleFullscreen) {
      await window.desktop.toggleFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      if (next) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen?.().catch(() => {});
    }
  };

  const content = (
    <div className="glass-panel" style={{ padding: '30px 38px', width: 440 }}>
      <div className="panel-title">SETTINGS</div>

      <div className="settings-row">
        <span className="settings-label">Sound Effects</span>
        <Toggle on={settings.sfxOn} onChange={(v) => updateSetting('sfxOn', v)} />
      </div>
      <div className="settings-row">
        <span className="settings-label">SFX Volume</span>
        <input
          type="range" min="0" max="1" step="0.05"
          value={settings.sfxVolume}
          onChange={(e) => updateSetting('sfxVolume', Number(e.target.value))}
        />
      </div>
      <div className="settings-row">
        <span className="settings-label">Music</span>
        <Toggle on={settings.musicOn} onChange={(v) => updateSetting('musicOn', v)} />
      </div>
      <div className="settings-row">
        <span className="settings-label">Music Volume</span>
        <input
          type="range" min="0" max="1" step="0.05"
          value={settings.musicVolume}
          onChange={(e) => updateSetting('musicVolume', Number(e.target.value))}
        />
      </div>
      <div className="settings-row">
        <span className="settings-label">Screen Shake</span>
        <Toggle on={settings.screenShake} onChange={(v) => updateSetting('screenShake', v)} />
      </div>
      <div className="settings-row">
        <span className="settings-label">Particle Effects</span>
        <Toggle on={settings.particles} onChange={(v) => updateSetting('particles', v)} />
      </div>
      <div className="settings-row">
        <span className="settings-label">Graphics Quality</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {['low', 'medium', 'high'].map((q) => (
            <button
              key={q}
              className={`neon-btn small ${settings.graphicsQuality === q ? '' : 'secondary'}`}
              onClick={() => updateSetting('graphicsQuality', q)}
            >
              {q.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="settings-row">
        <span className="settings-label">Fullscreen</span>
        <Toggle on={settings.fullscreen} onChange={toggleFullscreen} />
      </div>
      <div className="settings-row">
        <span className="settings-label">Reset High Score</span>
        <button className="neon-btn small secondary magenta" onClick={onResetHighScore}>
          RESET
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 22 }}>
        <button className="neon-btn secondary" onClick={onResetSettings}>DEFAULTS</button>
        <button className="neon-btn" onClick={onBack}>BACK</button>
      </div>
    </div>
  );

  if (embedded) return content;
  return <div className="screen">{content}</div>;
}
