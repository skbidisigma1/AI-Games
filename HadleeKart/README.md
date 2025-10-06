# HadleeKart

A Three.js racing game featuring custom tracks, checkpoint-based lap tracking, item boxes, and advanced drift mechanics.

## Getting Started

Open `index.html` in a modern browser. No build step is required.

## Current Track

**Spungilious Speedway** - A custom-designed circuit track with checkpoints, item boxes, and trick ramps.

## Controls

- `W` / `ArrowUp` – Accelerate
- `S` / `ArrowDown` – Brake / Reverse
- `A` / `ArrowLeft` – Steer left
- `D` / `ArrowRight` – Steer right
- `Shift` – Hop into a drift and charge mini-turbos
- `E` – Use held item
- `R` – (Debug) Cycle a random item
- `T` – Respawn at last checkpoint

## Features

### Track System
- Custom GLB track loading with proper collision detection
- 12 checkpoints for lap validation (must pass through all to complete lap)
- 9 dropoff respawn points for falling off the track
- 15 item box locations with auto-respawn
- Trick ramps (detection implemented, trick mechanics coming soon)
- Separate collision for track surface, walls, and decorations

### Lap & Checkpoint System
- 3-lap races with checkpoint validation
- Only counts lap completion if all checkpoints are passed in order
- Lap time tracking with formatted display
- Smart respawn system: drops you at last checkpoint or dropoff point passed
- Automatic respawn when falling below track bounds

### Item Boxes
- Floating golden cubes at predefined locations
- 5-second respawn timer after collection
- Rotating and bobbing animation
- Automatic item distribution on collection

## Next Steps

- Swap the placeholder kart mesh with a proper model and add wheels.
- Introduce lap timing, checkpoints, and UI overlays.
- Layer in advanced collision volumes, AI racers, and richer drift tuning.
- Move assets into a bundler or module-aware setup when growth demands it.

## Item System (Prototype)

Implemented a single-slot item system with placeholder behavior for many competitive items. Because only one racer exists right now, offensive / defensive interactions are logged to the console instead of affecting opponents.

Current items:

 - Speed Boosts: Mushroom, Triple Mushroom (3 uses), Golden Mushroom (7.5s rapid-use window, each press grants a 2s 20% speed boost, slight internal cooldown)
 - Shells (Red / Green / Blue + Triple variants) – Placeholder: logs launch and consumes use (0.4s cooldown between launches)
 - Hazards: Banana / Triple Banana, Bob-omb – Placeholder drops (logged only)
 - Power Items: Star (10s invincibility + 20% speed), Boo (10s invincibility placeholder), Bullet Bill (+50% speed 2.5s placeholder), Shock (logs activation), Fire Flower (10 shots placeholder), Super Horn (logs blast and would destroy a Blue Shell)

Speed Effects:

 - All mushroom boosts = +20% speed (capped combined additive bonus currently at +60%).
 - Star adds +20%.
 - Bullet Bill adds +50% (placeholder autopilot not implemented yet).

Debugging:

 - Press `R` repeatedly to cycle through random items.
 - Press `E` to activate/consume the current item.

Future work:

 - Multi-racer support enabling actual projectile physics, targeting, hit reactions (spin-outs, slowdown, shrink).
 - Visual effects (models, particles, shaders) for each item state.
 - Proper stacking logic & diminishing returns for overlapping temporary speed buffs.
 - Add item acquisition system (item boxes / probability tables by position).

## Importing Custom Models

1. Export your kart or track as a glTF/GLB file (preferred) with real-world scale and Y-up orientation.
2. Add Three.js loaders (e.g., `GLTFLoader`) via an extra CDN script or a bundler.
3. Load assets asynchronously near startup, then replace the placeholder meshes with the loaded scene graph.
4. Normalize pivot points so the kart's origin is at the ground contact patch and the track's at `(0, 0, 0)` for easy placement.
5. Bake textures and materials where possible to minimize runtime shader setup and keep draw calls low.
