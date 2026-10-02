import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';
import { sound } from './game/sound.js';

// Browsers require a user gesture before audio can play. Rather than
// making the player click a "click to enable sound" screen, we just
// silently resume the AudioContext on the very first interaction -
// the person's first menu click doubles as that gesture.
function unlockAudioOnce() {
  sound.resume();
  window.removeEventListener('pointerdown', unlockAudioOnce);
  window.removeEventListener('keydown', unlockAudioOnce);
}
window.addEventListener('pointerdown', unlockAudioOnce);
window.addEventListener('keydown', unlockAudioOnce);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
