// All tunable game-feel numbers live here so the physics can be
// balanced without hunting through component code.

export const WORLD = {
  width: 960,
  height: 540
};

export const PHYSICS = {
  gravity: 1250,        // px/s^2 pulling the helicopter down
  liftForce: 2700,       // px/s^2 applied while the button is held
  maxUpSpeed: -460,       // terminal velocity while rising (negative = up)
  maxDownSpeed: 560,     // terminal velocity while falling
  tiltPerVelocity: 0.045, // how much velocity translates into visual tilt
  maxTiltUp: -22,
  maxTiltDown: 32
};

export const HELI = {
  x: 210,          // fixed horizontal screen position
  width: 104,
  height: 50,
  hitboxInsetX: 24, // shrink the hitbox vs the sprite for a fairer feel
  hitboxInsetY: 13
};

export const DIFFICULTY = {
  baseSpeed: 195,         // world scroll speed at score 0, px/s
  maxSpeed: 420,
  speedRampScore: 6500,   // score at which speed reaches maxSpeed
  baseGapMin: 240,
  baseGapMax: 310,
  minGapMin: 175,
  minGapMax: 220,
  gapRampScore: 7500,
  baseSpawnInterval: 1750, // ms between obstacle spawns at score 0
  minSpawnInterval: 1050,
  spawnRampScore: 7000,
  newTypeScores: {
    building: 0,
    pipe: 0,
    barrier: 1200,
    laser: 3000,
    drone: 4500
  }
};

export const SCORE = {
  perSecond: 12
};

export const OBSTACLE_TYPES = ['building', 'pipe', 'barrier', 'laser', 'drone'];

export const COLORS = {
  neonCyan: '#4df8ff',
  neonMagenta: '#ff2ec4',
  neonAmber: '#ffc23d',
  neonGreen: '#4dffb0',
  sarOrange: '#ff7a1f',   // search-and-rescue hi-vis orange - the heli's unit color
  oliveDark: '#2b3324',
  oliveMid: '#455233',
  bgDeep: '#1a1233',
  bgPanel: 'rgba(28, 20, 42, 0.72)'
};

export const STORAGE_KEYS = {
  settings: 'helicopter-escape:settings',
  best: 'helicopter-escape:best'
};

export const DEFAULT_SETTINGS = {
  musicOn: true,
  musicVolume: 0.6,
  sfxOn: true,
  sfxVolume: 0.8,
  screenShake: true,
  particles: true,
  graphicsQuality: 'high', // 'low' | 'medium' | 'high'
  fullscreen: false
};

// ---------------- Takeoff cinematic ----------------
// Every run begins parked on a rooftop helipad; the craft lifts off
// and climbs to cruise altitude before control fully hands to gameplay.
export const TAKEOFF = {
  duration: 1.6,          // seconds to climb from pad to cruise altitude
  padWidth: 130,
  padHeight: 150,          // height of the helipad building/tower
  spinUpTime: 0.5          // seconds of rotor spin-up before lifting off
};

// ---------------- Rescue operations ----------------
// Every RESCUE.interval score points, a stranded person appears on a
// structure; the helicopter must be nearby when the rope reaches them
// so they can be winched aboard. Variants cycle so each milestone
// looks and reads a little differently.
export const RESCUE = {
  interval: 500,
  bonusScore: 250,
  approachSpeedMultiplier: 1, // rescue rig scrolls at normal world speed
  winchDuration: 1.8,         // seconds for the person to climb the rope
  variants: ['civilian', 'soldier', 'crate', 'survivor']
};
