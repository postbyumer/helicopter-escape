import React, { useCallback, useEffect, useState } from 'react';
import MainMenu from './components/MainMenu.jsx';
import HowToPlay from './components/HowToPlay.jsx';
import Settings from './components/Settings.jsx';
import GameScreen from './components/GameScreen.jsx';
import { useSettings } from './hooks/useSettings.js';
import { loadNumber, saveNumber } from './utils/storage.js';
import { STORAGE_KEYS } from './game/constants.js';
import { sound } from './game/sound.js';

// screen: 'menu' | 'howto' | 'settings' | 'game'
export default function App() {
  const [screen, setScreen] = useState('menu');
  const { settings, updateSetting, resetSettings } = useSettings();
  const [best, setBest] = useState(() => loadNumber(STORAGE_KEYS.best, 0));

  // Ambient pad plays in the menus (a "ready room" feel) and steps
  // aside for the helicopter's own engine hum once a run is in flight.
  useEffect(() => {
    if (screen !== 'game' && settings.musicOn) {
      sound.startMusic();
    } else {
      sound.stopMusic();
    }
  }, [screen, settings.musicOn]);

  const goMenu = useCallback(() => {
    sound.play('click');
    setScreen('menu');
  }, []);

  const handleNewBest = useCallback((value) => {
    setBest(value);
    saveNumber(STORAGE_KEYS.best, value);
  }, []);

  const handleResetHighScore = useCallback(() => {
    setBest(0);
    saveNumber(STORAGE_KEYS.best, 0);
  }, []);

  return (
    <div className="app-shell">
      {screen === 'menu' && (
        <MainMenu
          best={best}
          onPlay={() => { sound.play('click'); setScreen('game'); }}
          onHowTo={() => { sound.play('click'); setScreen('howto'); }}
          onSettings={() => { sound.play('click'); setScreen('settings'); }}
        />
      )}

      {screen === 'howto' && <HowToPlay onBack={goMenu} />}

      {screen === 'settings' && (
        <Settings
          settings={settings}
          updateSetting={updateSetting}
          onResetSettings={resetSettings}
          onResetHighScore={handleResetHighScore}
          onBack={goMenu}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          settings={settings}
          updateSetting={updateSetting}
          onResetSettings={resetSettings}
          onResetHighScore={handleResetHighScore}
          best={best}
          onNewBest={handleNewBest}
          onExitToMenu={goMenu}
        />
      )}
    </div>
  );
}
