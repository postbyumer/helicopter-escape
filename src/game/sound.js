// Every sound in this game is synthesized live with the Web Audio API -
// there are no .mp3/.wav files to go missing, fail to load, or bloat
// the installer. This guarantees audio works the moment the app opens.
//
// Browsers require a user gesture before audio can play, so the
// AudioContext is created immediately but only *resumed* on the first
// click/keydown anywhere in the app (wired up in main.jsx).

class SoundManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.sfxOn = true;
    this.sfxVolume = 0.8;
    this.musicOn = true;
    this.musicVolume = 0.5;

    this._hum = null;       // continuous helicopter engine hum node graph
    this._music = null;     // continuous ambient pad node graph
    this._initedGraph = false;
  }

  // Lazily create the AudioContext + gain graph. Safe to call many
  // times. Must run after a user gesture on most browsers, which is
  // handled by the one-time listener installed from main.jsx.
  _ensureContext() {
    if (this.ctx) return true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxOn ? this.sfxVolume : 0;
      this.sfxGain.connect(this.master);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicOn ? this.musicVolume * 0.4 : 0;
      this.musicGain.connect(this.master);

      this._initedGraph = true;
      return true;
    } catch {
      return false;
    }
  }

  resume() {
    if (!this._ensureContext()) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  configure({ sfxOn, sfxVolume, musicOn, musicVolume }) {
    this.sfxOn = sfxOn;
    this.sfxVolume = sfxVolume;
    this.musicOn = musicOn;
    this.musicVolume = musicVolume;
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(sfxOn ? sfxVolume : 0, this._now(), 0.05);
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(musicOn ? musicVolume * 0.4 : 0, this._now(), 0.3);
    }
    if (!musicOn) this.stopMusic();
  }

  _now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  // ---------------- One-shot SFX, all synthesized ----------------

  play(name) {
    if (!this._ensureContext() || !this.sfxOn) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    try {
      switch (name) {
        case 'click': return this._blip(680, 880, 0.07, 'square', 0.5);
        case 'hover': return this._blip(500, 560, 0.04, 'sine', 0.22);
        case 'pause': return this._blip(440, 300, 0.12, 'triangle', 0.4);
        case 'countdown': return this._blip(500, 500, 0.09, 'square', 0.4);
        case 'go': return this._sweep(260, 900, 0.35, 'sawtooth', 0.5);
        case 'collision': return this._crash();
        case 'gameover': return this._sweep(500, 90, 0.55, 'sawtooth', 0.45);
        case 'record': return this._chime();
        case 'thrust': return this._blip(220, 260, 0.08, 'sawtooth', 0.25);
        default: return;
      }
    } catch {
      // Never let a synthesis error interrupt gameplay.
    }
  }

  _blip(freqFrom, freqTo, duration, type, vol) {
    const t0 = this._now();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqTo), t0 + duration);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  _sweep(freqFrom, freqTo, duration, type, vol) {
    this._blip(freqFrom, freqTo, duration, type, vol);
  }

  _crash() {
    const t0 = this._now();
    // Filtered white noise burst for the impact...
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t0);
    filter.frequency.exponentialRampToValueAtTime(120, t0 + 0.35);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t0);

    // ...plus a low thud underneath for weight.
    this._blip(160, 40, 0.3, 'sine', 0.6);
  }

  _chime() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C-E-G-C arpeggio
    notes.forEach((f, i) => {
      const t0 = this._now() + i * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t0);
      osc.stop(t0 + 0.45);
    });
  }

  // ---------------- Continuous helicopter engine hum ----------------
  // Started when a run begins, stopped on game over / exit. Pitch,
  // volume, and a subtle mechanical vibration all respond to a single
  // 0-1 intensity value the caller computes from lift + speed, so the
  // engine note swells naturally rather than just flipping on/off.

  startEngineHum() {
    if (!this._ensureContext() || this._hum) return;
    const t0 = this._now();
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.value = 70;
    osc2.frequency.value = 71.5; // slight detune for a thicker engine growl

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.0001;

    // A slow, subtle rotor-blade-pass flutter riding on top of the main
    // volume - this is what reads as "mechanical vibration" rather than
    // a clean synthesized tone.
    const vibLFO = this.ctx.createOscillator();
    vibLFO.type = 'sine';
    vibLFO.frequency.value = 21;
    const vibDepth = this.ctx.createGain();
    vibDepth.gain.value = 0.006;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    vibLFO.connect(vibDepth);
    vibDepth.connect(gain.gain);

    osc1.start(t0);
    osc2.start(t0);
    vibLFO.start(t0);
    gain.gain.exponentialRampToValueAtTime(0.045, t0 + 0.3);

    this._hum = { osc1, osc2, filter, gain, vibLFO, vibDepth };
  }

  // intensity: 0 (idle/parked) to 1 (climbing hard / at top speed).
  // Accepts a boolean for backward compatibility (true -> 1, false -> 0.2).
  setEngineHum(intensity) {
    if (!this._hum || !this.ctx) return;
    const level = typeof intensity === 'boolean' ? (intensity ? 1 : 0.2) : Math.max(0, Math.min(1, intensity));
    const t = this._now();
    const lerp = (a, b) => a + (b - a) * level;
    const targetFreq = lerp(72, 134);
    const targetFilter = lerp(460, 1450);
    const targetGain = this.sfxOn ? lerp(0.032, 0.115) : 0.0001;
    const targetVibDepth = lerp(0.005, 0.016);
    this._hum.osc1.frequency.setTargetAtTime(targetFreq, t, 0.12);
    this._hum.osc2.frequency.setTargetAtTime(targetFreq * 1.02, t, 0.12);
    this._hum.filter.frequency.setTargetAtTime(targetFilter, t, 0.15);
    this._hum.gain.gain.setTargetAtTime(targetGain, t, 0.1);
    this._hum.vibDepth.gain.setTargetAtTime(targetVibDepth, t, 0.2);
  }

  stopEngineHum() {
    if (!this._hum) return;
    const { osc1, osc2, gain, vibLFO } = this._hum;
    const t0 = this._now();
    gain.gain.setTargetAtTime(0.0001, t0, 0.08);
    try {
      osc1.stop(t0 + 0.3);
      osc2.stop(t0 + 0.3);
      vibLFO.stop(t0 + 0.3);
    } catch {
      // already stopped
    }
    this._hum = null;
  }

  // ---------------- Ambient background pad (the "Music" setting) ----------------

  startMusic() {
    if (!this._ensureContext() || this._music || !this.musicOn) return;
    const t0 = this._now();
    const notes = [130.81, 164.81, 196.0]; // soft C-E-G pad
    const oscs = notes.map((f) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      return osc;
    });
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.0001;

    oscs.forEach((o) => { o.connect(filter); });
    filter.connect(gain);
    gain.connect(this.musicGain);
    oscs.forEach((o) => o.start(t0));
    gain.gain.exponentialRampToValueAtTime(0.3, t0 + 1.2);

    // Slow LFO drifting the filter for a gentle evolving pad.
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(t0);

    this._music = { oscs, filter, gain, lfo, lfoGain };
  }

  stopMusic() {
    if (!this._music) return;
    const { oscs, gain, lfo } = this._music;
    const t0 = this._now();
    gain.gain.setTargetAtTime(0.0001, t0, 0.4);
    setTimeout(() => {
      try {
        oscs.forEach((o) => o.stop());
        lfo.stop();
      } catch {
        // already stopped
      }
    }, 700);
    this._music = null;
  }
}

export const sound = new SoundManager();
