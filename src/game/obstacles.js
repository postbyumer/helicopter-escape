import { WORLD, DIFFICULTY, COLORS } from './constants.js';

function lerp(a, b, t) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

// Types available at a given score, so the game introduces variety
// gradually instead of throwing everything at the player immediately.
function availableTypes(score) {
  return Object.entries(DIFFICULTY.newTypeScores)
    .filter(([, unlockScore]) => score >= unlockScore)
    .map(([type]) => type);
}

export class ObstacleManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.obstacles = [];
    this.spawnTimer = 0;
    this.time = 0;
    this.spawningPaused = false;
  }

  setSpawningPaused(paused) {
    this.spawningPaused = paused;
    if (paused) this.spawnTimer = 0; // don't dump a spawn the instant it resumes
  }

  difficultyAt(score) {
    const speed = lerp(DIFFICULTY.baseSpeed, DIFFICULTY.maxSpeed, score / DIFFICULTY.speedRampScore);
    const gapMin = lerp(DIFFICULTY.baseGapMin, DIFFICULTY.minGapMin, score / DIFFICULTY.gapRampScore);
    const gapMax = lerp(DIFFICULTY.baseGapMax, DIFFICULTY.minGapMax, score / DIFFICULTY.gapRampScore);
    const spawnInterval = lerp(
      DIFFICULTY.baseSpawnInterval,
      DIFFICULTY.minSpawnInterval,
      score / DIFFICULTY.spawnRampScore
    );
    return { speed, gapMin, gapMax, spawnInterval };
  }

  _spawn(score) {
    const { gapMin, gapMax } = this.difficultyAt(score);
    const gap = gapMin + Math.random() * (gapMax - gapMin);
    const types = availableTypes(score);
    const type = types[Math.floor(Math.random() * types.length)];

    const groundY = WORLD.height * 0.86;
    const skyTop = 40;
    const playField = groundY - skyTop;

    // Gap center kept away from the extreme edges so it's always reachable.
    const margin = gap / 2 + 30;
    const gapCenter = skyTop + margin + Math.random() * (playField - margin * 2);

    const base = {
      x: WORLD.width + 40,
      type,
      passed: false,
      width: type === 'laser' ? 14 : type === 'drone' ? 46 : 64
    };

    if (type === 'building' || type === 'pipe' || type === 'barrier') {
      base.gapTop = gapCenter - gap / 2;
      base.gapBottom = gapCenter + gap / 2;
      base.topHeight = base.gapTop - skyTop;
      base.bottomHeight = groundY - base.gapBottom;
      base.bottomY = base.gapBottom;
      if (type === 'barrier') {
        base.oscillate = true;
        base.phase = Math.random() * Math.PI * 2;
        base.amplitude = 18 + Math.random() * 22;
      }
    } else if (type === 'laser') {
      base.gapTop = gapCenter - gap / 2;
      base.gapBottom = gapCenter + gap / 2;
      base.phase = Math.random() * Math.PI * 2;
      base.pulse = true;
    } else if (type === 'drone') {
      base.y = gapCenter;
      base.phase = Math.random() * Math.PI * 2;
      base.amplitude = 40 + Math.random() * 50;
      base.height = 34;
    }

    this.obstacles.push(base);
  }

  update(dt, score, alive) {
    if (!alive) return;
    this.time += dt;
    const { speed, spawnInterval } = this.difficultyAt(score);

    this.spawnTimer += dt * 1000;
    if (!this.spawningPaused && this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this._spawn(score);
    }

    this.obstacles.forEach((o) => {
      o.x -= speed * dt;
      if (o.oscillate) {
        o.phase += dt * 1.6;
        const off = Math.sin(o.phase) * o.amplitude;
        o.gapTopAnim = o.gapTop + off;
        o.gapBottomAnim = o.gapBottom + off;
      }
      if (o.type === 'drone') {
        o.phase += dt * 2.2;
        o.y = o.y + Math.sin(o.phase) * o.amplitude * dt * 0.6;
      }
      if (o.pulse) {
        o.phase += dt * 4;
      }
    });

    this.obstacles = this.obstacles.filter((o) => o.x > -100);
    return speed;
  }

  // Returns array of {top, bottom, x, w} rects representing solid
  // regions for the current frame, for collision checks.
  getSolidRects() {
    const rects = [];
    this.obstacles.forEach((o) => {
      if (o.type === 'drone') {
        rects.push({ x: o.x - o.width / 2, y: o.y - o.height / 2, w: o.width, h: o.height, obstacle: o });
        return;
      }
      const top = o.gapTopAnim ?? o.gapTop;
      const bottom = o.gapBottomAnim ?? o.gapBottom;
      rects.push({ x: o.x - o.width / 2, y: 0, w: o.width, h: top, obstacle: o });
      rects.push({ x: o.x - o.width / 2, y: bottom, w: o.width, h: WORLD.height * 0.86 - bottom, obstacle: o });
    });
    return rects;
  }

  draw(ctx) {
    const groundY = WORLD.height * 0.86;
    this.obstacles.forEach((o) => {
      if (o.type === 'drone') {
        this._drawDrone(ctx, o);
        return;
      }
      const top = o.gapTopAnim ?? o.gapTop;
      const bottom = o.gapBottomAnim ?? o.gapBottom;
      const color = {
        building: COLORS.neonMagenta,
        pipe: COLORS.neonGreen,
        barrier: COLORS.neonAmber,
        laser: COLORS.neonCyan
      }[o.type];

      if (o.type === 'laser') {
        this._drawLaser(ctx, o, top, bottom, color);
        return;
      }

      ctx.save();
      ctx.fillStyle = '#141826';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;

      // Top segment
      ctx.fillRect(o.x - o.width / 2, 0, o.width, top);
      ctx.strokeRect(o.x - o.width / 2, 0, o.width, top);
      // Bottom segment
      ctx.fillRect(o.x - o.width / 2, bottom, o.width, groundY - bottom);
      ctx.strokeRect(o.x - o.width / 2, bottom, o.width, groundY - bottom);

      // Cap detail
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(o.x - o.width / 2 - 4, top - 8, o.width + 8, 8);
      ctx.fillRect(o.x - o.width / 2 - 4, bottom, o.width + 8, 8);
      ctx.restore();
    });
  }

  _drawLaser(ctx, o, top, bottom, color) {
    ctx.save();
    const pulse = 0.6 + Math.sin(o.phase) * 0.4;
    ctx.strokeStyle = color;
    ctx.lineWidth = o.width;
    ctx.globalAlpha = pulse;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(o.x, 0);
    ctx.lineTo(o.x, top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(o.x, bottom);
    ctx.lineTo(o.x, WORLD.height * 0.86);
    ctx.stroke();

    // Emitter nodes
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(o.x, top, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(o.x, bottom, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawDrone(ctx, o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.shadowColor = COLORS.neonMagenta;
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#1c1428';
    ctx.strokeStyle = COLORS.neonMagenta;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-o.width / 2, -o.height / 2, o.width, o.height, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.neonMagenta;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    // Small spinning props
    const spin = o.phase * 6;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      ctx.save();
      ctx.translate((sx * o.width) / 2, (sy * o.height) / 2);
      ctx.rotate(spin);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }
}
