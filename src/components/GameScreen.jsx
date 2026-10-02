import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Engine } from '../game/engine.js';
import { WORLD } from '../game/constants.js';
import GameHUD from './GameHUD.jsx';
import Countdown from './Countdown.jsx';
import PauseMenu from './PauseMenu.jsx';
import GameOver from './GameOver.jsx';
import Settings from './Settings.jsx';
import RescueBanner from './RescueBanner.jsx';
import { sound } from '../game/sound.js';

// uiPhase drives which overlay is shown. The Engine's own internal
// phase (playing/crashing/over) is authoritative for gameplay; this is
// just the screen-level state machine wrapped around it.
export default function GameScreen({
  settings,
  updateSetting,
  onResetSettings,
  onResetHighScore,
  best,
  onNewBest,
  onExitToMenu
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [uiPhase, setUiPhase] = useState('countdown'); // countdown | playing | paused | over | settings
  const [score, setScore] = useState(0);
  const [overData, setOverData] = useState({ score: 0, best, isRecord: false });
  const [rescueStatus, setRescueStatus] = useState(null);

  // Create engine once the canvas exists.
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = WORLD.width;
    canvas.height = WORLD.height;

    const engine = new Engine(canvas, {
      settings,
      onScore: setScore,
      onBest: onNewBest,
      onRescue: setRescueStatus,
      onPhaseChange: (phase, data) => {
        if (phase === 'over') {
          setOverData(data);
          setUiPhase('over');
        }
      }
    });
    engine.setBest(best);
    engineRef.current = engine;

    return () => engine.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep engine settings in sync live.
  useEffect(() => {
    engineRef.current?.setSettings(settings);
  }, [settings]);

  const startRun = useCallback(() => {
    engineRef.current?.start();
    setUiPhase('playing');
  }, []);

  const restart = useCallback(() => {
    setRescueStatus(null);
    setUiPhase('countdown');
  }, []);

  // Input: mouse/touch hold + spacebar hold + pause keys.
  useEffect(() => {
    const setHeld = (held) => engineRef.current?.setHeld(held);

    const onPointerDown = (e) => {
      if (uiPhase !== 'playing') return;
      e.preventDefault();
      setHeld(true);
    };
    const onPointerUp = () => setHeld(false);

    const onKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (uiPhase === 'playing') setHeld(true);
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        setUiPhase((prev) => {
          if (prev === 'playing') { engineRef.current?.pause(); sound.play('pause'); return 'paused'; }
          if (prev === 'paused') { engineRef.current?.resume(); return 'playing'; }
          return prev;
        });
      }
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') setHeld(false);
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      canvas.removeEventListener('mousedown', onPointerDown);
      canvas.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [uiPhase]);

  const handleResume = () => { engineRef.current?.resume(); setUiPhase('playing'); };
  const handleRestartFromPause = () => { engineRef.current?.stop(); restart(); };
  const handleExit = () => { engineRef.current?.stop(); onExitToMenu(); };

  return (
    <div className="screen" style={{ padding: 0 }}>
      <div className="game-canvas-wrap">
        <canvas ref={canvasRef} className="game-canvas" />

        {(uiPhase === 'playing' || uiPhase === 'paused') && (
          <GameHUD
            score={score}
            best={Math.max(best, overData.best || 0)}
            onPause={() => { engineRef.current?.pause(); sound.play('pause'); setUiPhase('paused'); }}
          />
        )}

        {uiPhase === 'playing' && <RescueBanner status={rescueStatus} />}

        {uiPhase === 'countdown' && <Countdown onComplete={startRun} />}

        {uiPhase === 'paused' && (
          <PauseMenu
            onResume={handleResume}
            onRestart={handleRestartFromPause}
            onMainMenu={handleExit}
            onSettings={() => setUiPhase('settings')}
          />
        )}

        {uiPhase === 'settings' && (
          <div className="overlay-dim">
            <Settings
              embedded
              settings={settings}
              updateSetting={updateSetting}
              onResetSettings={onResetSettings}
              onResetHighScore={onResetHighScore}
              onBack={() => setUiPhase('paused')}
            />
          </div>
        )}

        {uiPhase === 'over' && (
          <GameOver
            score={overData.score}
            best={Math.max(best, overData.best || overData.score)}
            isRecord={overData.isRecord}
            onPlayAgain={restart}
            onMainMenu={handleExit}
          />
        )}
      </div>
    </div>
  );
}
