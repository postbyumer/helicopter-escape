import { PHYSICS, HELI, WORLD } from './constants.js';

// The mini-helicopter's own palette - a friendly, glossy orange body
// rather than a military/neon paint job. Shared shape logic here is
// mirrored by the inline SVG in MainMenu.jsx so the menu icon and the
// in-flight sprite genuinely match, not just "look similar".
const HELI_COLORS = {
  bodyLight: '#ff9a4d',
  bodyMid: '#ff7a1f',
  bodyDark: '#e05f10',
  glass: '#2a2f3a',
  glassHighlight: 'rgba(255,255,255,0.55)',
  rotor: '#dfe3ea',
  rotorTip: '#aeb4c2',
  skid: '#2a2f3a',
  tailLight: '#ff4d4d'
};

export class Helicopter {
  constructor() {
    this.reset();
  }

  reset() {
    this.y = WORLD.height / 2;
    this.vy = 0;
    this.tilt = 0;
    this.rotorAngle = 0;
    this.tailRotorAngle = 0;
    this.bobPhase = 0;
    this.alive = true;
    this.crashSpin = 0;
  }

  get x() {
    return HELI.x;
  }

  getHitbox() {
    const ix = HELI.hitboxInsetX;
    const iy = HELI.hitboxInsetY;
    return {
      x: HELI.x - HELI.width / 2 + ix,
      y: this.y - HELI.height / 2 + iy,
      w: HELI.width - ix * 2,
      h: HELI.height - iy * 2
    };
  }

  update(dt, isHeld, alive = true) {
    this.rotorAngle += dt * (isHeld ? 32 : 19);
    this.tailRotorAngle += dt * (isHeld ? 55 : 36);
    this.bobPhase += dt * 3;

    if (!alive) {
      // Crash: tumble and drop.
      this.crashSpin += dt * 6;
      this.vy = Math.min(this.vy + PHYSICS.gravity * 1.4 * dt, PHYSICS.maxDownSpeed * 1.6);
      this.y += this.vy * dt;
      this.tilt = Math.min(this.tilt + dt * 220, 90);
      return;
    }

    const accel = isHeld ? -PHYSICS.liftForce : PHYSICS.gravity;
    this.vy += accel * dt;
    this.vy = Math.max(PHYSICS.maxUpSpeed, Math.min(PHYSICS.maxDownSpeed, this.vy));
    this.y += this.vy * dt;

    // Keep within the playfield with a soft clamp.
    const minY = HELI.height;
    const maxY = WORLD.height * 0.86 - HELI.height / 2;
    if (this.y < minY) { this.y = minY; this.vy = Math.max(this.vy, 0); }
    if (this.y > maxY) { this.y = maxY; this.vy = Math.min(this.vy, 0); }

    const targetTilt = Math.max(
      PHYSICS.maxTiltUp,
      Math.min(PHYSICS.maxTiltDown, this.vy * PHYSICS.tiltPerVelocity)
    );
    this.tilt += (targetTilt - this.tilt) * Math.min(1, dt * 8);
  }

  draw(ctx, isHeld, alive = true) {
    const w = HELI.width;
    const h = HELI.height;
    const bob = alive ? Math.sin(this.bobPhase) * 2 : 0;
    const tiltDeg = alive ? this.tilt : this.tilt + this.crashSpin * 40;
    const tiltRad = (tiltDeg * Math.PI) / 180;

    ctx.save();
    ctx.translate(this.x, this.y + bob);

    // A soft atmospheric halo behind the whole craft, blending the
    // scene's own dusk tones (warm sun-gold plus cool violet) so the
    // helicopter reads as flying IN this environment rather than
    // sitting pasted on top of it as a flat sticker.
    if (alive) {
      ctx.save();
      const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, w * 0.55);
      halo.addColorStop(0, 'rgba(255, 200, 140, 0.16)');
      halo.addColorStop(0.55, 'rgba(150, 110, 200, 0.08)');
      halo.addColorStop(1, 'rgba(150, 110, 200, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // The fuselage follows the craft's pitch...
    ctx.save();
    ctx.rotate(tiltRad);
    this._drawBody(ctx, w, h, isHeld, alive);
    ctx.restore();

    // ...but the main rotor is completely decoupled from body pitch -
    // real rotor discs stay level regardless of how the fuselage is
    // pitched beneath them, so the blade angle here comes ONLY from
    // rotorAngle (the spin), never from tilt. The hub's anchor point
    // still tracks the tilted mast so it stays visually attached.
    if (alive) {
      const hubLocalX = 0;
      const hubLocalY = -h * 0.62;
      const hubX = hubLocalX * Math.cos(tiltRad) - hubLocalY * Math.sin(tiltRad);
      const hubY = hubLocalX * Math.sin(tiltRad) + hubLocalY * Math.cos(tiltRad);
      ctx.save();
      ctx.translate(hubX, hubY);
      this._drawMainRotor(ctx, w, isHeld);
      ctx.restore();
    }

    ctx.restore();
  }

  _drawBody(ctx, w, h, isHeld, alive) {
    // ---- Tail boom + tiny tail rotor ----
    const tailTipX = -w * 0.56;
    const tailBaseX = -w * 0.1;
    ctx.save();
    ctx.fillStyle = HELI_COLORS.bodyMid;
    ctx.strokeStyle = HELI_COLORS.bodyDark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tailBaseX, -h * 0.1);
    ctx.quadraticCurveTo(-w * 0.35, -h * 0.16, tailTipX, -h * 0.06);
    ctx.lineTo(tailTipX, h * 0.02);
    ctx.quadraticCurveTo(-w * 0.35, h * 0.1, tailBaseX, h * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Small tail fin
    ctx.fillStyle = HELI_COLORS.bodyDark;
    ctx.beginPath();
    ctx.moveTo(tailTipX + 4, -h * 0.28);
    ctx.lineTo(tailTipX - 2, -h * 0.02);
    ctx.lineTo(tailTipX + 8, -h * 0.02);
    ctx.closePath();
    ctx.fill();

    // Tail rotor - small spinning blade
    if (alive) {
      ctx.save();
      ctx.translate(tailTipX - 1, -h * 0.02);
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = HELI_COLORS.rotorTip;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.globalAlpha = 0.15;
      ctx.stroke();
      ctx.rotate(this.tailRotorAngle);
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = HELI_COLORS.rotor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(0, 7);
      ctx.stroke();
      ctx.restore();
    }

    // Tail light
    ctx.beginPath();
    ctx.arc(tailTipX + 2, -h * 0.02, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = HELI_COLORS.tailLight;
    ctx.fill();
    ctx.restore();

    // ---- Skids ----
    ctx.save();
    ctx.strokeStyle = HELI_COLORS.skid;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-w * 0.22, h * 0.34);
    ctx.lineTo(-w * 0.28, h * 0.46);
    ctx.moveTo(w * 0.22, h * 0.36);
    ctx.lineTo(w * 0.16, h * 0.46);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-w * 0.34, h * 0.46);
    ctx.lineTo(w * 0.28, h * 0.46);
    ctx.stroke();
    ctx.restore();

    // ---- Main body - a glossy, rounded orange blob ----
    ctx.save();
    const bodyGrad = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.4);
    bodyGrad.addColorStop(0, HELI_COLORS.bodyLight);
    bodyGrad.addColorStop(0.55, HELI_COLORS.bodyMid);
    bodyGrad.addColorStop(1, HELI_COLORS.bodyDark);

    ctx.beginPath();
    ctx.moveTo(-w * 0.14, -h * 0.02);
    ctx.bezierCurveTo(-w * 0.16, -h * 0.4, w * 0.06, -h * 0.48, w * 0.22, -h * 0.42);
    ctx.bezierCurveTo(w * 0.38, -h * 0.36, w * 0.44, -h * 0.14, w * 0.4, h * 0.08);
    ctx.bezierCurveTo(w * 0.36, h * 0.3, w * 0.14, h * 0.4, -w * 0.08, h * 0.36);
    ctx.bezierCurveTo(-w * 0.24, h * 0.32, -w * 0.22, h * 0.1, -w * 0.14, -h * 0.02);
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = HELI_COLORS.bodyDark;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Soft top gloss highlight, tinted warm gold like it's catching
    // the sunset rather than a flat white studio light - this is what
    // actually sells "lit by this scene" instead of "pasted on top".
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#ffe2b0';
    ctx.beginPath();
    ctx.ellipse(-w * 0.02, -h * 0.28, w * 0.16, h * 0.1, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // A cool violet ambient-bounce tint along the underside, echoing
    // the sky's color temperature so the shadow side isn't just flat
    // dark orange.
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#5a4a8a';
    ctx.beginPath();
    ctx.ellipse(w * 0.05, h * 0.24, w * 0.22, h * 0.14, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // ---- Cockpit bubble window ----
    ctx.save();
    const glassCx = w * 0.16;
    const glassCy = -h * 0.06;
    ctx.beginPath();
    ctx.ellipse(glassCx, glassCy, w * 0.17, h * 0.24, -0.05, 0, Math.PI * 2);
    ctx.fillStyle = HELI_COLORS.glass;
    ctx.fill();
    ctx.strokeStyle = HELI_COLORS.bodyDark;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // Glossy highlight streak on the window
    ctx.save();
    ctx.clip();
    ctx.fillStyle = HELI_COLORS.glassHighlight;
    ctx.beginPath();
    ctx.ellipse(glassCx - 4, glassCy - h * 0.1, 3.5, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // ---- Rotor mast ----
    ctx.save();
    ctx.strokeStyle = '#8a8f9c';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.42);
    ctx.lineTo(0, -h * 0.62);
    ctx.stroke();
    ctx.restore();
  }

  _drawMainRotor(ctx, w, isHeld) {
    const bladeLen = w * 0.62; // half-span; full span ~= 1.24x body width

    // Soft, wide spin-blur disc - always reads as "a fan" at a glance,
    // and (correctly) never rotates itself, since a horizontal disc
    // viewed edge-on always looks like a flat horizontal shape.
    ctx.save();
    ctx.globalAlpha = isHeld ? 0.28 : 0.16;
    ctx.fillStyle = HELI_COLORS.rotor;
    ctx.beginPath();
    ctx.ellipse(0, 0, bladeLen + 3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#6b7180';
    ctx.fill();
    ctx.restore();

    // The rotor spins around a VERTICAL axis, and we're looking at it
    // from the side - so the blade must never visually rotate to a
    // diagonal or vertical screen angle (that would look like a
    // windmill facing the camera, which is a different rotor entirely).
    // What actually changes, from a side view, is apparent LENGTH: the
    // blade foreshortens toward the hub as it swings toward/away from
    // the viewer, and extends back out as it swings edge-on. Both
    // blades (180 degrees apart) always stay collinear on that same
    // horizontal line, so they're drawn as one symmetric bar whose
    // half-length is bladeLen * cos(rotorAngle).
    const drawProjectedBlade = (phase, alpha, thickness) => {
      const half = bladeLen * Math.cos(phase);
      if (Math.abs(half) < 1) return; // edge-on instant - nothing to draw
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = isHeld ? HELI_COLORS.rotor : HELI_COLORS.rotorTip;
      ctx.beginPath();
      ctx.moveTo(-half, -thickness);
      ctx.lineTo(half, -thickness * 0.4);
      ctx.lineTo(half, thickness * 0.4);
      ctx.lineTo(-half, thickness);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Trailing ghost phases for a cheap always-visible motion blur -
    // still every one of them is a purely horizontal bar.
    drawProjectedBlade(this.rotorAngle - 0.5, 0.12, 2.4);
    drawProjectedBlade(this.rotorAngle - 0.28, 0.18, 2.8);
    // Crisp leading blade on top.
    drawProjectedBlade(this.rotorAngle, 1, 2.2);
  }
}

export { HELI_COLORS };
