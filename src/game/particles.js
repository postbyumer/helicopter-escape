export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emitExhaust(x, y, intensity) {
    const count = 1 + Math.floor(intensity);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y: y + (Math.random() - 0.5) * 10,
        vx: -120 - Math.random() * 80,
        vy: (Math.random() - 0.5) * 60,
        life: 0.4 + Math.random() * 0.3,
        age: 0,
        size: 3 + Math.random() * 3,
        color: `rgba(61, 245, 255, ALPHA)`
      });
    }
  }

  emitDebris(x, y, count = 24) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 260;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life: 0.6 + Math.random() * 0.5,
        age: 0,
        size: 2 + Math.random() * 5,
        gravity: 500,
        color: Math.random() > 0.5
          ? 'rgba(255, 61, 203, ALPHA)'
          : 'rgba(255, 178, 61, ALPHA)'
      });
    }
  }

  emitConfetti(x, y, count = 60) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 140 + Math.random() * 260;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.2 + Math.random() * 0.8,
        age: 0,
        size: 3 + Math.random() * 4,
        gravity: 260,
        color: [
          'rgba(61, 245, 255, ALPHA)',
          'rgba(255, 61, 203, ALPHA)',
          'rgba(255, 178, 61, ALPHA)',
          'rgba(91, 255, 159, ALPHA)'
        ][i % 4]
      });
    }
  }

  update(dt) {
    this.particles.forEach((p) => {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
    });
    this.particles = this.particles.filter((p) => p.age < p.life);
  }

  draw(ctx) {
    this.particles.forEach((p) => {
      const t = 1 - p.age / p.life;
      ctx.fillStyle = p.color.replace('ALPHA', t.toFixed(2));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  clear() {
    this.particles = [];
  }
}
