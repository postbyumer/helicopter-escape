import { WORLD, RESCUE, HELI, COLORS } from './constants.js';

const VARIANT_INFO = {
  civilian: { label: 'CIVILIAN RESCUE', sub: 'Survivor spotted on rooftop', color: COLORS.sarOrange },
  soldier: { label: 'SOLDIER EXTRACTION', sub: 'Wounded soldier requesting pickup', color: COLORS.neonGreen },
  crate: { label: 'SUPPLY DROP', sub: 'Winch the supply crate aboard', color: COLORS.neonAmber },
  survivor: { label: 'WATER RESCUE', sub: 'Survivor stranded on a life raft', color: COLORS.neonCyan }
};

/**
 * Every RESCUE.interval score points, a rig (building / bunker /
 * raft) carrying a person or crate scrolls in from the right just
 * like an obstacle, but is never solid - it's a breather + bonus
 * moment, not a hazard. When it reaches the helicopter, a winch rope
 * animates the target climbing/hoisting up to the aircraft, a score
 * bonus is awarded, and the rig continues on and despawns.
 */
export class RescueManager {
  constructor({ onEvent } = {}) {
    this.onEvent = onEvent;
    this.reset();
  }

  reset() {
    this.nextMilestone = RESCUE.interval;
    this.variantIndex = 0;
    this.state = 'idle'; // idle | incoming | winching | departing
    this.rig = null;
    this.winchTimer = 0;
  }

  isBusy() {
    return this.state !== 'idle';
  }

  _emit(phase, extra = {}) {
    const variant = this.rig?.variant;
    const info = variant ? VARIANT_INFO[variant] : null;
    this.onEvent?.({ phase, variant, label: info?.label, sub: info?.sub, ...extra });
  }

  update(dt, score, worldSpeed, helicopter) {
    if (this.state === 'idle') {
      if (score >= this.nextMilestone) {
        const variant = RESCUE.variants[this.variantIndex % RESCUE.variants.length];
        this.variantIndex += 1;
        this.nextMilestone += RESCUE.interval;

        const groundY = WORLD.height * 0.86;
        const isWater = variant === 'survivor';
        const platformHeight = isWater ? 26 : 120 + Math.random() * 90;
        this.rig = {
          variant,
          x: WORLD.width + 90,
          width: isWater ? 100 : 78,
          groundY,
          platformHeight,
          roofY: groundY - platformHeight,
          personProgress: 0, // 0 = at rig, 1 = reached helicopter
          bob: Math.random() * Math.PI * 2
        };
        this.state = 'incoming';
        this._emit('start');
      }
      return;
    }

    if (this.state === 'incoming') {
      this.rig.x -= worldSpeed * dt;
      this.rig.bob += dt * 2;
      const dx = this.rig.x - HELI.x;
      if (dx <= 26) {
        this.state = 'winching';
        this.winchTimer = 0;
        this._emit('winch');
      } else if (this.rig.x < -200) {
        // Missed entirely (shouldn't normally happen) - bail out cleanly.
        this.state = 'idle';
        this.rig = null;
      }
      return;
    }

    if (this.state === 'winching') {
      this.winchTimer += dt;
      const t = Math.min(1, this.winchTimer / RESCUE.winchDuration);
      this.rig.personProgress = t;
      // Rig drifts left gently even while winching, so it doesn't feel frozen.
      this.rig.x -= worldSpeed * 0.35 * dt;
      if (t >= 1) {
        this.state = 'departing';
        this._emit('complete', { bonus: RESCUE.bonusScore });
      }
      return;
    }

    if (this.state === 'departing') {
      this.rig.x -= worldSpeed * dt;
      if (this.rig.x < -200) {
        this.state = 'idle';
        this.rig = null;
        this._emit('idle');
      }
    }
  }

  draw(ctx, helicopter) {
    if (!this.rig) return;
    const { rig } = this;
    const isWinching = this.state === 'winching' || this.state === 'departing';

    if (rig.variant === 'survivor') {
      this._drawRaft(ctx, rig);
    } else if (rig.variant === 'crate') {
      this._drawCratePlatform(ctx, rig);
    } else {
      this._drawStructure(ctx, rig);
    }

    // Rope + person/crate, drawn once winching begins.
    if (isWinching || this.state === 'incoming') {
      this._drawTargetAndRope(ctx, rig, helicopter, isWinching);
    }
  }

  _drawStructure(ctx, rig) {
    const isMilitary = rig.variant === 'soldier';
    const color = isMilitary ? COLORS.oliveMid : 'rgba(30,34,50,0.95)';
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = VARIANT_INFO[rig.variant].color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.95;
    ctx.fillRect(rig.x - rig.width / 2, rig.roofY, rig.width, rig.groundY - rig.roofY);
    ctx.strokeRect(rig.x - rig.width / 2, rig.roofY, rig.width, rig.groundY - rig.roofY);

    // Window/detail lines
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    for (let y = rig.roofY + 16; y < rig.groundY - 10; y += 22) {
      ctx.beginPath();
      ctx.moveTo(rig.x - rig.width / 2 + 6, y);
      ctx.lineTo(rig.x + rig.width / 2 - 6, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Rooftop platform cap + landing markings
    ctx.fillStyle = VARIANT_INFO[rig.variant].color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(rig.x - rig.width / 2 - 4, rig.roofY - 6, rig.width + 8, 6);
    ctx.globalAlpha = 1;

    if (isMilitary) {
      // Small antenna mast for the "bunker" feel
      ctx.strokeStyle = 'rgba(200,255,220,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rig.x + rig.width / 2 - 8, rig.roofY - 6);
      ctx.lineTo(rig.x + rig.width / 2 - 8, rig.roofY - 26);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawCratePlatform(ctx, rig) {
    ctx.save();
    ctx.fillStyle = 'rgba(30,34,50,0.95)';
    ctx.strokeStyle = VARIANT_INFO.crate.color;
    ctx.lineWidth = 2;
    ctx.fillRect(rig.x - rig.width / 2, rig.roofY, rig.width, rig.groundY - rig.roofY);
    ctx.strokeRect(rig.x - rig.width / 2, rig.roofY, rig.width, rig.groundY - rig.roofY);
    // Pallet cap
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(rig.x - rig.width / 2 - 6, rig.roofY - 8, rig.width + 12, 8);
    ctx.restore();
  }

  _drawRaft(ctx, rig) {
    ctx.save();
    // Water hint beneath
    const waterY = rig.groundY;
    ctx.fillStyle = 'rgba(30, 90, 130, 0.35)';
    ctx.fillRect(rig.x - 140, waterY, 280, WORLD.height - waterY + 40);
    ctx.strokeStyle = 'rgba(120, 210, 255, 0.4)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const yy = waterY + 8 + i * 9 + Math.sin(rig.bob + i) * 2;
      ctx.moveTo(rig.x - 130, yy);
      ctx.lineTo(rig.x + 130, yy);
      ctx.stroke();
    }
    // Raft
    const raftY = rig.roofY + Math.sin(rig.bob) * 3;
    ctx.fillStyle = '#c98a3f';
    ctx.strokeStyle = COLORS.neonCyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(rig.x - rig.width / 2, raftY, rig.width, 14, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawTargetAndRope(ctx, rig, helicopter, isWinching) {
    const startX = rig.x;
    const startY = rig.roofY - (rig.variant === 'survivor' ? 4 : 6);
    const endX = helicopter.x;
    const endY = helicopter.y + 14;

    const t = isWinching ? rig.personProgress : 0;
    const targetX = startX + (endX - startX) * t;
    const targetY = startY + (endY - startY) * t;

    // Rope
    ctx.save();
    ctx.strokeStyle = 'rgba(220, 220, 210, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(targetX, targetY - (rig.variant === 'crate' ? 6 : 10));
    ctx.stroke();
    ctx.restore();

    if (rig.variant === 'crate') {
      this._drawCrate(ctx, targetX, targetY, t);
    } else {
      this._drawPerson(ctx, targetX, targetY, rig.variant, t, rig.bob);
    }
  }

  _drawPerson(ctx, x, y, variant, t, bob) {
    const shirt = variant === 'soldier' ? COLORS.oliveMid : variant === 'survivor' ? '#e8a23f' : COLORS.sarOrange;
    const wave = Math.sin(bob * 3) * 0.3;
    ctx.save();
    ctx.translate(x, y);
    // Arms raised while climbing (t>0), waving while waiting (t===0)
    const armAngle = t > 0 ? -2.1 : -1.6 + wave;
    ctx.strokeStyle = '#e8b98a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(Math.cos(armAngle) * 8, -6 + Math.sin(armAngle) * 8);
    ctx.stroke();
    // Body
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.roundRect(-3.5, -6, 7, 10, 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.fillStyle = '#e8b98a';
    ctx.arc(0, -9, 3.2, 0, Math.PI * 2);
    ctx.fill();
    // Legs (tuck up slightly while being hoisted)
    ctx.strokeStyle = '#33384a';
    ctx.lineWidth = 2;
    const legBend = t > 0.1 ? 0.5 : 0;
    ctx.beginPath();
    ctx.moveTo(-1.5, 4);
    ctx.lineTo(-2.5, 9 - legBend * 4);
    ctx.moveTo(1.5, 4);
    ctx.lineTo(2.5, 9 - legBend * 4);
    ctx.stroke();
    ctx.restore();
  }

  _drawCrate(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 6) * 0.06);
    ctx.fillStyle = '#6b4f2c';
    ctx.strokeStyle = COLORS.neonAmber;
    ctx.lineWidth = 1.5;
    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeRect(-8, -8, 16, 16);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
    ctx.moveTo(0, -8); ctx.lineTo(0, 8);
    ctx.stroke();
    ctx.restore();
  }
}

export { VARIANT_INFO };
