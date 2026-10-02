import { WORLD, SCORE, HELI, TAKEOFF, DIFFICULTY, COLORS } from './constants.js';
import { Helicopter } from './helicopter.js';
import { ObstacleManager } from './obstacles.js';
import { Background } from './background.js';
import { ParticleSystem } from './particles.js';
import { RescueManager } from './rescue.js';
import { rectsOverlap } from '../utils/collision.js';
import { sound } from './sound.js';

const CRASH_FREEZE_DURATION = 0.55; // seconds of dramatic freeze before Game Over shows

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Engine keeps ALL fast-changing gameplay state out of React. React only
 * re-renders for score/HUD/state-machine changes, which are throttled and
 * explicit via callbacks - the actual per-frame simulation and drawing
 * happen entirely here, driven by requestAnimationFrame.
 */
export class Engine {
  constructor(canvas, { onScore, onPhaseChange, onBest, onRescue, settings }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScore = onScore;
    this.onPhaseChange = onPhaseChange;
    this.onBest = onBest;
    this.onRescue = onRescue;
    this.settings = settings;

    this.helicopter = new Helicopter();
    this.obstacles = new ObstacleManager();
    this.background = new Background();
    this.particles = new ParticleSystem();
    this.rescue = new RescueManager({ onEvent: (s) => this._onRescueEvent(s) });

    this.phase = 'idle'; // idle | takeoff | playing | crashing | over
    this.score = 0;
    this.best = 0;
    this.isHeld = false;
    this.shakeTime = 0;
    this.shakeMagnitude = 0;
    this.crashTimer = 0;
    this.currentSpeed = 0;
    this.takeoffTimer = 0;
    this.padX = HELI.x;

    this._raf = null;
    this._lastTime = 0;
    this._boundLoop = this._loop.bind(this);
  }

  setSettings(settings) {
    this.settings = settings;
  }

  setHeld(held) {
    if (this.phase !== 'playing') return;
    this.isHeld = held;
  }

  setBest(best) {
    this.best = best;
  }

  // Combines lift state and current world speed into one 0-1 value the
  // engine hum uses for pitch/volume/vibration - so the rotor note
  // swells both when rising AND when the game's gotten faster overall,
  // not just as a flat on/off switch.
  _humIntensity(isHeld) {
    const speedFactor = Math.max(0, Math.min(1, this.currentSpeed / DIFFICULTY.maxSpeed));
    return isHeld ? 0.72 + 0.28 * speedFactor : 0.16 + 0.18 * speedFactor;
  }

  start() {
    this.helicopter.reset();
    const padY = WORLD.height * 0.86 - TAKEOFF.padHeight;
    this.helicopter.y = padY - HELI.height * 0.3;
    this.padY = padY;
    this.padX = HELI.x;

    this.obstacles.reset();
    this.obstacles.setSpawningPaused(true);
    this.particles.clear();
    this.rescue.reset();

    this.score = 0;
    this.currentSpeed = 0;
    this.takeoffTimer = 0;
    this.phase = 'takeoff';
    this.isHeld = true; // visual: rotor spins up and lifts off on its own
    this.onScore?.(0);
    this.onPhaseChange?.('takeoff');
    this.onRescue?.(null);

    sound.startEngineHum();
    sound.setEngineHum(1);

    this._lastTime = performance.now();
    if (!this._raf) this._raf = requestAnimationFrame(this._boundLoop);
  }

  stop() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  pause() {
    this.isHeld = false;
    sound.setEngineHum(0.12);
    this.stop();
  }

  resume() {
    if (this._raf) return;
    this._lastTime = performance.now();
    this._raf = requestAnimationFrame(this._boundLoop);
  }

  triggerShake(magnitude, duration) {
    if (!this.settings.screenShake) return;
    this.shakeMagnitude = magnitude;
    this.shakeTime = duration;
  }

  _onRescueEvent(status) {
    if (status.phase === 'complete') {
      this.score += status.bonus;
      if (this.settings.particles) {
        this.particles.emitConfetti(HELI.x + 20, this.helicopter.y, 34);
      }
      sound.play('record');
    } else if (status.phase === 'start') {
      sound.play('countdown');
    }
    this.onRescue?.(status.phase === 'idle' ? null : status);
  }

  _loop(now) {
    const dtRaw = (now - this._lastTime) / 1000;
    this._lastTime = now;
    // Clamp dt to avoid huge jumps if the tab was backgrounded.
    const dt = Math.min(dtRaw, 1 / 30);

    this._update(dt);
    this._draw();

    this._raf = requestAnimationFrame(this._boundLoop);
  }

  _update(dt) {
    if (this.phase === 'takeoff') {
      this._updateTakeoff(dt);
    } else if (this.phase === 'playing') {
      this.helicopter.update(dt, this.isHeld, true);
      sound.setEngineHum(this._humIntensity(this.isHeld));
      if (this.isHeld && this.settings.particles) {
        this.particles.emitExhaust(
          this.helicopter.x - HELI.width / 2,
          this.helicopter.y,
          2
        );
      }
      const speed = this.obstacles.update(dt, this.score, true);
      this.currentSpeed = speed ?? this.currentSpeed;
      this.background.update(dt, this.currentSpeed);

      this.score += SCORE.perSecond * dt * (this.currentSpeed / 260);

      this.obstacles.setSpawningPaused(this.rescue.isBusy());
      this.rescue.update(dt, this.score, this.currentSpeed, this.helicopter);

      this.onScore?.(Math.floor(this.score));
      this._checkCollision();
    } else if (this.phase === 'crashing') {
      this.helicopter.update(dt, false, false);
      this.background.update(dt, this.currentSpeed * 0.3);
      this.crashTimer += dt;
      if (this.crashTimer >= CRASH_FREEZE_DURATION) {
        this.phase = 'over';
        sound.stopEngineHum();
        const isRecord = Math.floor(this.score) > this.best;
        if (isRecord) {
          this.best = Math.floor(this.score);
          this.onBest?.(this.best);
          if (this.settings.particles) {
            this.particles.emitConfetti(WORLD.width / 2, WORLD.height * 0.35, 70);
          }
          sound.play('record');
        }
        sound.play('gameover');
        this.onPhaseChange?.('over', { score: Math.floor(this.score), best: this.best, isRecord });
      }
    } else if (this.phase === 'over') {
      this.background.update(dt, 40);
    } else {
      this.background.update(dt, 60);
    }

    if (this.settings.particles) this.particles.update(dt);
    if (this.shakeTime > 0) this.shakeTime -= dt;
  }

  _updateTakeoff(dt) {
    this.takeoffTimer += dt;
    // Rotor keeps spinning throughout, independent of the y-tween below.
    this.helicopter.rotorAngle += dt * 34;
    this.helicopter.tailRotorAngle += dt * 60;
    this.helicopter.bobPhase += dt * 3;

    if (this.takeoffTimer < TAKEOFF.spinUpTime) {
      // Spinning up on the pad, not yet climbing.
      this.background.update(dt, 0);
      return;
    }

    const climbT = Math.min(
      1,
      (this.takeoffTimer - TAKEOFF.spinUpTime) / (TAKEOFF.duration - TAKEOFF.spinUpTime)
    );
    const eased = easeOutCubic(climbT);
    const cruiseY = WORLD.height / 2;
    const startY = this.padY - HELI.height * 0.3;
    this.helicopter.y = startY + (cruiseY - startY) * eased;
    this.helicopter.tilt = -6 * Math.sin(eased * Math.PI); // gentle nose-up-then-level

    this.currentSpeed = DIFFICULTY.baseSpeed * eased;
    this.background.update(dt, this.currentSpeed);
    this.padX -= this.currentSpeed * dt;

    if (this.settings.particles && climbT > 0.05) {
      this.particles.emitExhaust(this.helicopter.x - HELI.width / 2, this.helicopter.y, 2);
    }

    if (climbT >= 1) {
      this.phase = 'playing';
      this.isHeld = false;
      this.obstacles.setSpawningPaused(false);
      sound.setEngineHum(this._humIntensity(false));
      this.onPhaseChange?.('playing');
    }
  }

  _checkCollision() {
    const hb = this.helicopter.getHitbox();
    const rects = this.obstacles.getSolidRects();
    for (const r of rects) {
      if (rectsOverlap(hb, r)) {
        this._crash();
        return;
      }
    }
    // Ground / ceiling collision
    if (hb.y + hb.h >= WORLD.height * 0.86 || hb.y <= 0) {
      this._crash();
    }
  }

  _crash() {
    if (this.phase !== 'playing') return;
    this.phase = 'crashing';
    this.crashTimer = 0;
    this.helicopter.vy = 0;
    sound.play('collision');
    this.triggerShake(14, 0.4);
    if (this.settings.particles) {
      this.particles.emitDebris(this.helicopter.x, this.helicopter.y, 28);
    }
    this.onPhaseChange?.('crashing');
  }

  _drawHelipad(ctx) {
    const w = TAKEOFF.padWidth;
    const groundY = WORLD.height * 0.86;
    const roofY = this.padY;
    const cx = this.padX;
    const t = this.takeoffTimer;

    ctx.save();

    // ---- Support tower the pad sits on ----
    const towerGrad = ctx.createLinearGradient(0, roofY, 0, groundY);
    towerGrad.addColorStop(0, '#3a3f4a');
    towerGrad.addColorStop(1, '#1c1e24');
    ctx.fillStyle = towerGrad;
    ctx.strokeStyle = 'rgba(77,248,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(cx - w / 2, roofY, w, groundY - roofY);
    ctx.strokeRect(cx - w / 2, roofY, w, groundY - roofY);

    // A few steady (non-flickering) lit windows down the tower face
    ctx.fillStyle = 'rgba(255, 195, 120, 0.5)';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        if ((row + col) % 2 === 0) {
          ctx.fillRect(cx - w / 2 + 14 + col * 20, roofY + 20 + row * 26, 8, 10);
        }
      }
    }

    // Diagonal support struts under the pad's overhang for an
    // "elevated platform" read rather than a plain building top.
    ctx.strokeStyle = 'rgba(140,150,170,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 - 10, roofY + 14);
    ctx.lineTo(cx - w / 2, roofY + 30);
    ctx.moveTo(cx + w / 2 + 10, roofY + 14);
    ctx.lineTo(cx + w / 2, roofY + 30);
    ctx.stroke();

    // ---- The pad deck itself, drawn as a flattened ellipse for a
    // touch of perspective, sitting proud of the tower roofline ----
    const padRY = roofY - 6;
    const padW = w * 0.62;
    const padH = 16;

    ctx.fillStyle = '#4a4f58';
    ctx.beginPath();
    ctx.ellipse(cx, padRY, padW / 2 + 10, padH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,22,28,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Yellow/black hazard rim
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, padRY, padW / 2 + 10, padH, 0, 0, Math.PI * 2);
    ctx.clip();
    const stripeCount = 14;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#e8c53f' : '#1a1a1a';
      const sx = cx - padW / 2 - 10 + (i * (padW + 20)) / stripeCount;
      ctx.fillRect(sx, padRY + padH - 4, (padW + 20) / stripeCount + 1, 4);
    }
    ctx.restore();

    // Concrete deck top + orange ring + H marking
    ctx.fillStyle = '#5a5f68';
    ctx.beginPath();
    ctx.ellipse(cx, padRY, padW / 2, padH * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.sarOrange;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLORS.sarOrange;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(cx, padRY, padW / 2 - 10, (padH * 0.7) - 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.sarOrange;
    ctx.font = 'bold 24px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', cx, padRY - 1);

    // Perimeter rim lights - a slow, gentle, CONTINUOUS glow pulse
    // driven by elapsed time, not per-frame randomness, so they read
    // as steady runway lighting instead of strobing.
    const lightCount = 10;
    for (let i = 0; i < lightCount; i++) {
      const a = (i / lightCount) * Math.PI * 2;
      const lx = cx + Math.cos(a) * (padW / 2 + 4);
      const ly = padRY + Math.sin(a) * (padH + 2);
      const pulse = 0.55 + 0.25 * Math.sin(t * 1.6 + i * 0.7);
      ctx.fillStyle = `rgba(255, 214, 140, ${pulse.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(lx, ly, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- Small control shack + steady beacon light beside the pad ----
    const shackX = cx - padW / 2 - 26;
    ctx.fillStyle = '#2a2e36';
    ctx.strokeStyle = 'rgba(77,248,255,0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(shackX - 10, roofY - 30, 20, 24);
    ctx.strokeRect(shackX - 10, roofY - 30, 20, 24);
    ctx.strokeStyle = 'rgba(140,150,170,0.6)';
    ctx.beginPath();
    ctx.moveTo(shackX, roofY - 30);
    ctx.lineTo(shackX, roofY - 42);
    ctx.stroke();
    const beaconPulse = 0.6 + 0.3 * Math.sin(t * 2.2);
    ctx.fillStyle = `rgba(255, 80, 80, ${beaconPulse.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(shackX, roofY - 44, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _draw() {
    const ctx = this.ctx;
    ctx.save();

    if (this.shakeTime > 0) {
      const s = this.shakeMagnitude * (this.shakeTime > 0 ? 1 : 0);
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }

    ctx.clearRect(-30, -30, WORLD.width + 60, WORLD.height + 60);
    this.background.draw(ctx);

    if (this.phase === 'takeoff') {
      this._drawHelipad(ctx);
    }
    if (this.phase === 'playing') {
      this.obstacles.draw(ctx);
      this.rescue.draw(ctx, this.helicopter);
    }
    if (this.settings.particles) this.particles.draw(ctx);

    const alive = this.phase === 'playing' || this.phase === 'takeoff';
    this.helicopter.draw(ctx, this.isHeld, alive || this.phase === 'crashing');

    // Flash overlay right at the moment of crash.
    if (this.phase === 'crashing' && this.crashTimer < 0.12) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - this.crashTimer / 0.12)})`;
      ctx.fillRect(-30, -30, WORLD.width + 60, WORLD.height + 60);
    }

    ctx.restore();
  }
}
