# Helicopter Escape 🚁 — Army Rescue Operation

A modern one-button arcade game. Your search-and-rescue helicopter
lifts off a rooftop helipad, then it's hold-to-rise / release-to-fall
through buildings, pipes, laser gates, barriers and drones for as
long as you can survive — while running live rescue operations along
the way. Built with React + Vite for the UI/game rendering and
Electron for the Windows desktop shell.

## Requirements

- Node.js 18+ and npm
- Windows (to produce the `.exe` installer via `electron-builder --win`;
  cross-building from macOS/Linux is possible but not covered here)

## Setup

```bash
npm install
```

## Run in development (hot reload, in an Electron window)

```bash
npm run dev:electron
```

Or just the web version in a browser tab, for quick iteration:

```bash
npm run dev
```

## Build the Windows installer

```bash
npm run electron:build
```

This runs the Vite production build, then packages it with
`electron-builder` using the config in `package.json`. The installer
(`.exe`, NSIS) is written to `release/`.

## Project structure

```
electron/            Electron main process + secure preload bridge
src/
  App.jsx             Top-level screen router (menu / how-to / settings / game)
  components/         React UI: menus, HUD, rescue banner, overlays, settings
  game/                Engine: takeoff cinematic, physics, obstacles,
                       rescue operations, background, particles, sound —
                       all framework-agnostic, canvas-rendered, and kept
                       out of React's render cycle for performance
    engine.js           Owns the state machine (takeoff → playing →
                         crashing → over) and the requestAnimationFrame loop
    helicopter.js        Physics + a detailed hand-drawn army SAR helicopter
    rescue.js             Milestone-triggered rescue operations (see below)
    sound.js               Fully synthesized audio via Web Audio API —
                            no external sound files, nothing to go missing
  hooks/               useSettings - persisted settings
  utils/               storage + collision helpers
build/                 Icon and installer resources for electron-builder
```

## Design notes

- **Gameplay runs on `<canvas>` via `requestAnimationFrame`**, with all
  fast-changing state (helicopter position, obstacles, particles) held
  in plain JS objects in `src/game/engine.js` — not React state — so
  there are zero React re-renders during actual gameplay. React only
  owns the menu/HUD/overlay chrome around it.
- **Takeoff cinematic**: every run starts parked on a rooftop helipad
  (marked with a painted "H"). The rotor spins up, the craft lifts off
  and climbs to cruise altitude on its own over about 1.6s
  (`TAKEOFF` in `constants.js`), then hands control to the player.
- **Rescue operations**: every 500 points (`RESCUE.interval`) a rig
  scrolls in from the right — a rooftop with a stranded civilian, a
  military bunker with a wounded soldier, a supply platform with a
  crate, or a life raft with a water-rescue survivor. These cycle
  through `RESCUE.variants` so each milestone looks different. They
  are never solid/collidable — reaching one pauses new obstacle
  spawns, drops a winch rope, animates the target climbing aboard,
  and awards a `RESCUE.bonusScore` bump plus a banner and confetti.
  All of this lives in `src/game/rescue.js`.
- Obstacle types, gap sizes, and spawn rate scale smoothly with score
  via `src/game/constants.js` → `DIFFICULTY`. New obstacle types unlock
  at score thresholds (see `newTypeScores`).
- Settings and high score persist to `localStorage` (or in-memory if
  storage is unavailable) — see `src/utils/storage.js`.
- **Audio needs no asset files at all.** `src/game/sound.js` synthesizes
  every effect live with the Web Audio API (click/hover blips, the
  crash noise burst, the record-score chime, a continuous pitch-shifting
  engine hum tied to whether you're holding lift, and an ambient menu
  pad) — so sound simply works the moment the app opens, with nothing
  to go missing or fail to load. Browsers require a user gesture before
  audio can play; that's handled invisibly on the first click/keypress
  in `src/main.jsx`.

## Customizing the icon

`build/icon.ico` ships with a simple placeholder neon icon so the
build works out of the box. Swap it for your own 256×256 (or
multi-size) `.ico` whenever you're ready.
