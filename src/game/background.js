import { WORLD, COLORS } from './constants.js';

// Four parallax layers: sun/sky, distant mountains, mid skyline,
// foreground clouds. Each scrolls at a different fraction of world
// speed to create depth. Themed as a dusk extraction mission - warm
// horizon light against a cooling purple sky, not a flat dark box.
export class Background {
  constructor() {
    this.skylineOffset = 0;
    this.mountainOffset = 0;
    this.buildings = this._makeSkyline();
    this.mountains = this._makeMountains();
    this.clouds = this._makeClouds();
    this.laserPalette = ['#ff3b5c', '#3b8cff', '#b23bff', COLORS.neonCyan, COLORS.neonGreen];
    this.lasers = this._makeLasers();
  }

  _makeSkyline() {
    const buildings = [];
    let x = 0;
    while (x < WORLD.width * 2.2) {
      const w = 60 + Math.random() * 90;
      const h = 80 + Math.random() * 180;
      // Window layout is decided once, here, and never touched again -
      // deciding it inside draw() would re-roll every single frame,
      // which is exactly what makes lights strobe instead of just sit lit.
      const windows = [];
      for (let i = 0; i < 3; i++) {
        if (Math.random() > 0.4) {
          windows.push({
            wx: 8 + (i % 3) * (w / 4),
            wy: 14 + (i * 22) % Math.max(20, h - 20)
          });
        }
      }
      buildings.push({ x, w, h, warm: Math.random() > 0.6, windows });
      x += w + 20 + Math.random() * 30;
    }
    return buildings;
  }

  _makeMountains() {
    const peaks = [];
    let x = 0;
    while (x < WORLD.width * 2.2) {
      const w = 140 + Math.random() * 160;
      const h = 60 + Math.random() * 90;
      peaks.push({ x, w, h });
      x += w * 0.7;
    }
    return peaks;
  }

  _makeClouds() {
    const clouds = [];
    for (let i = 0; i < 10; i++) {
      clouds.push({
        x: Math.random() * WORLD.width * 2,
        y: 20 + Math.random() * 140,
        scale: 0.5 + Math.random() * 1.1,
        speed: 0.15 + Math.random() * 0.15,
        warm: Math.random() > 0.5
      });
    }
    return clouds;
  }

  _newLaser(spawnOnscreen) {
    return {
      x: spawnOnscreen ? Math.random() * WORLD.width * 1.3 - WORLD.width * 0.15 : WORLD.width + 80 + Math.random() * 220,
      y: 20 + Math.random() * (WORLD.height * 0.5),
      angle: -0.32 + Math.random() * 0.64,
      length: 200 + Math.random() * 240,
      color: this.laserPalette[Math.floor(Math.random() * this.laserPalette.length)],
      age: spawnOnscreen ? Math.random() * 2.4 : 0,
      maxLife: 2.6 + Math.random() * 2.4,
      speedMul: 0.3 + Math.random() * 0.22
    };
  }

  _makeLasers() {
    const lasers = [];
    for (let i = 0; i < 6; i++) lasers.push(this._newLaser(true));
    return lasers;
  }

  update(dt, worldSpeed) {
    this.skylineOffset = (this.skylineOffset + worldSpeed * 0.22 * dt) % (WORLD.width * 2.2);
    this.mountainOffset = (this.mountainOffset + worldSpeed * 0.08 * dt) % (WORLD.width * 2.2);
    this.clouds.forEach((c) => {
      c.x -= worldSpeed * c.speed * dt;
      if (c.x < -160) {
        c.x = WORLD.width + Math.random() * 200;
        c.y = 20 + Math.random() * 140;
      }
    });
    // Lasers fade in and back out via a smooth sin() curve of their own
    // age, so a respawn always happens at alpha ~0 - no popping, no
    // hard cut, just a continuous cycle of beams sweeping through.
    this.lasers.forEach((l, i) => {
      l.age += dt;
      l.x -= worldSpeed * l.speedMul * dt;
      if (l.age >= l.maxLife || l.x < -500) {
        this.lasers[i] = this._newLaser(false);
      }
    });
  }

  draw(ctx) {
    // Dusk sky - deep violet up top, warming to amber/magenta at the
    // horizon like a mission flown at golden hour.
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD.height * 0.86);
    sky.addColorStop(0, '#1a1233');
    sky.addColorStop(0.38, '#3a1f4d');
    sky.addColorStop(0.62, '#7a2f5e');
    sky.addColorStop(0.8, '#c85a3f');
    sky.addColorStop(1, '#f2a24a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // Glowing sun sitting low on the horizon
    const sunX = WORLD.width * 0.74;
    const sunY = WORLD.height * 0.56;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 220);
    sunGlow.addColorStop(0, 'rgba(255, 214, 140, 0.9)');
    sunGlow.addColorStop(0.25, 'rgba(255, 170, 90, 0.35)');
    sunGlow.addColorStop(1, 'rgba(255, 170, 90, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.save();
    ctx.fillStyle = '#ffe9c2';
    ctx.shadowColor = '#ffcf8a';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Distant mountain silhouettes
    ctx.save();
    ctx.fillStyle = 'rgba(58, 32, 62, 0.75)';
    const mountainBaseY = WORLD.height * 0.68;
    [0, 1].forEach((rep) => {
      const offsetX = rep * (WORLD.width * 2.2) - this.mountainOffset;
      this.mountains.forEach((m) => {
        const mx = m.x + offsetX;
        if (mx > -260 && mx < WORLD.width + 260) {
          ctx.beginPath();
          ctx.moveTo(mx, mountainBaseY);
          ctx.lineTo(mx + m.w / 2, mountainBaseY - m.h);
          ctx.lineTo(mx + m.w, mountainBaseY);
          ctx.closePath();
          ctx.fill();
        }
      });
    });
    ctx.restore();

    // Clouds - warm peach or cool violet, catching the sunset light
    ctx.save();
    this.clouds.forEach((c) => {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = c.warm ? 'rgba(255, 200, 160, 0.9)' : 'rgba(170, 150, 230, 0.7)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 55 * c.scale, 16 * c.scale, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Skyline silhouette, drawn twice for seamless wraparound. A few
    // buildings carry warm-lit windows for variety and life.
    ctx.save();
    const baseY = WORLD.height * 0.7;
    [0, 1].forEach((rep) => {
      const offsetX = rep * (WORLD.width * 2.2) - this.skylineOffset;
      this.buildings.forEach((b) => {
        const bx = b.x + offsetX;
        if (bx > -150 && bx < WORLD.width + 150) {
          ctx.fillStyle = b.warm ? 'rgba(70, 38, 46, 0.9)' : 'rgba(32, 24, 48, 0.9)';
          ctx.fillRect(bx, baseY - b.h, b.w, b.h);
          // Lit windows - a fixed pattern chosen once in _makeSkyline,
          // so they glow steadily instead of flickering every frame.
          ctx.fillStyle = 'rgba(255, 200, 120, 0.55)';
          b.windows.forEach((win) => {
            ctx.fillRect(bx + win.wx, baseY - b.h + win.wy, 5, 7);
          });
        }
      });
    });
    ctx.restore();

    // RGB laser flashes sweeping over the skyline - clipped to the
    // upper sky so they never wash out the obstacle lane below, and
    // drawn here (before the ground band) so gameplay always renders
    // on top of them.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, WORLD.width, WORLD.height * 0.78);
    ctx.clip();
    this.lasers.forEach((l) => {
      const t = Math.min(1, l.age / l.maxLife);
      const alpha = Math.sin(t * Math.PI) * 0.55;
      if (alpha <= 0.01) return;
      const ex = l.x + Math.cos(l.angle) * l.length;
      const ey = l.y + Math.sin(l.angle) * l.length;
      ctx.save();
      ctx.globalAlpha = alpha * 0.35;
      ctx.strokeStyle = l.color;
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 20;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.6;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();

    // Ground band with a warm glowing horizon edge
    ctx.save();
    ctx.strokeStyle = COLORS.sarOrange;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.sarOrange;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(0, WORLD.height * 0.86);
    ctx.lineTo(WORLD.width, WORLD.height * 0.86);
    ctx.stroke();
    ctx.restore();

    const ground = ctx.createLinearGradient(0, WORLD.height * 0.86, 0, WORLD.height);
    ground.addColorStop(0, 'rgba(40, 22, 20, 0.96)');
    ground.addColorStop(1, 'rgba(14, 9, 12, 0.98)');
    ctx.fillStyle = ground;
    ctx.fillRect(0, WORLD.height * 0.86, WORLD.width, WORLD.height * 0.14);
  }
}
