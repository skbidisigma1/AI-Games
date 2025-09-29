# 🎮 Echoes of Aether

## 🌀 Core Concept

A 2D side-scrolling action platformer where players explore a fragmented mythical realm.  
- Each run is procedurally generated.
- Collect Aether Coins to unlock movement abilities that persist across runs.
- Unlocking abilities allows deeper access into the world.

---

## 🗺️ World Design

### Mythical Theme
The world is inspired by mythologies from various cultures, abstracted into elemental zones:
- **Pyra Ruins** (Fire – Greek Hades)
- **Glacium Peaks** (Ice – Norse Jotunheim)
- **Zephyra Canopy** (Air – Egyptian gods)
- **Terran Depths** (Earth – Celtic underworld)

Each zone features:
- Unique enemies and hazards
- Movement ability tied to the theme
- Mini-boss guarding the ability upgrade

### Procedural Generation
Each run generates:
- Random layout of interconnected rooms
- Environmental puzzles requiring unlocked movement abilities
- Secret paths and coin caches

**Note:** Build rooms before (hardcoded), then assemble levels from those rooms to avoid poor random generation.

---

## 🧭 Progression System

### Aether Coins
- Earned by defeating enemies, finding secrets, and reaching deeper zones
- Used between runs to unlock movement abilities and passive upgrades

### Movement Abilities (Metroidvania Unlocks)

| Ability      | Zone      | Description                        |
|--------------|-----------|------------------------------------|
| Double Jump  | Zephyra   | Reach higher platforms             |
| Dash         | Pyra      | Cross large gaps or dodge attacks  |
| Wall Climb   | Glacium   | Scale vertical shafts              |
| Ground Smash | Terran    | Break weak floors, access hidden areas |

- Abilities persist across runs and open new paths in future attempts.

### Passive Upgrades (Optional)
- Coin Magnet
- Extra Health
- Longer Invincibility Frames
- Enemy Drop Boost

---

## 🧝 Characters & Lore

- **Protagonist:** Nyra, a soul-forged warrior awakened in the mythical void to restore balance.
- **Guide:** The Oracle, a mysterious voice offering cryptic hints.

**Lore Delivery:**
- Environmental storytelling (murals, statues)
- Fragmented scrolls found in hidden rooms
- Bosses speak in riddles before battle

---

## ⚔️ Combat & Enemies

### Combat Style
- Simple melee (light/heavy attacks)
- Ranged spells (limited use, recharge over time)
- Enemies telegraph attacks for dodge-based combat

### Enemy Types

| Name              | Description                               |
|-------------------|-------------------------------------------|
| Wisp Shades       | Fast, weak, swarm enemies                 |
| Titan Remnants    | Slow, tanky, mini-bosses                  |
| Elemental Spirits | Zone-themed, require specific movement to defeat |

---

## 🧩 Development-Simplifying Design

### Art Style
- Stylized pixel art with limited palette per zone
- Modular tilesets for procedural generation

### Code Architecture
- Room templates with plug-and-play hazards
- Ability gating via simple flags (e.g., “requires Dash”)
- Coin economy tied to distance/depth metric

### AI-Friendly Systems
- Dialogue and lore via JSON files
- Enemy behavior via state machines
- Procedural generation using seeded templates

---

## 🏁 Win Condition

- After unlocking all movement abilities, players access the Central Nexus.
- **Final Boss:** The Forgotten God, a fusion of all elemental powers.
- Victory unlocks “Ascended Mode” with tougher enemies and new coin rewards.
