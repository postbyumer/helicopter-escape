import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../game/constants.js';
import { loadJSON, saveJSON } from '../utils/storage.js';
import { sound } from '../game/sound.js';

export function useSettings() {
  const [settings, setSettings] = useState(() =>
    loadJSON(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  );

  useEffect(() => {
    saveJSON(STORAGE_KEYS.settings, settings);
    sound.configure({
      sfxOn: settings.sfxOn,
      sfxVolume: settings.sfxVolume,
      musicOn: settings.musicOn,
      musicVolume: settings.musicVolume
    });
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSetting, resetSettings };
}
