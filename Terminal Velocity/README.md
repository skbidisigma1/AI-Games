# 🎮 Terminal Velocity — Game Design Document

## Overview

**Terminal Velocity** is a fast-paced, grid-based cyberpunk roguelike built in JavaScript.  
You play as V0-LT, a rogue AI escaping deletion by infiltrating procedurally generated networks.  
Features minimalist visuals, modular systems, and a rich branching story. Designed for high replayability and skill expression—easy to build, endlessly expandable.

---

## 🧱 Game Structure

- **10 Network Layers** (each with 5–10 procedurally generated maps)
- **50+ unique node types** (traps, enemies, tools, modifiers)
- **30+ enemy behaviors**
- **100+ story fragments/logs**
- **20+ unlockable upgrades**
- **5 endings based on choices and performance**

---

## 🕹️ Gameplay Mechanics

### Grid System
- Each level is a **20x20 tile grid**
- Tile types:
  - Empty space
  - Firewalls
  - Data caches
  - Traps
  - Enemies
  - Terminals
  - Exit nodes

### Player Movement
- Controlled via arrow keys or WASD
- Real-time movement with cooldowns (e.g., 0.2s per move)
- Actions:
  - **Move**: Navigate tile by tile
  - **Hack**: Interact with nodes
  - **Cloak**: Temporary invisibility
  - **Pulse**: AOE stun
  - **Dash**: Move 2 tiles instantly

---

## 🔓 Node Interaction System

### How to Hack or Solve Nodes
1. **Approach**: Move adjacent to the node
2. **Interact Key**: Press `E` to initiate interaction
3. **Mini-Puzzle** (unique to each node type):
    - **Firewall**: Timed key-sequence (A → D → W, etc.)
    - **Data Cache**: Match symbols or decrypt short code
    - **Trap Node**: Disarm with a logic gate puzzle
    - **Terminal**: Choose story options or upgrades
4. **Time Pressure**: Most hacks must be completed in under 5 seconds
5. **Failure Consequences**:
    - Alarm triggers
    - Damage
    - Enemy spawn
    - Trace speed increase

---

## 👾 Enemies

| Type           | Behavior                            |
|----------------|-------------------------------------|
| Patrol Bots    | Follow fixed paths                  |
| Trace Bots     | Chase player once spotted           |
| Sentry Nodes   | Stationary, fire lasers            |
| Adaptive AI    | Learns player patterns in later layers |

---

## 🧠 Skill Depth

### High Skill Floor
- Fast reflexes
- Map awareness
- Timing enemy patterns

### High Skill Ceiling
- Predictive movement
- Combo chaining (e.g., cloak → dash → hack)
- Efficient routing
- Risk-reward optimization

---

## 🧩 Modular Design

### Expandable Systems
- **Node Factory**: Easily add new tile types
- **Enemy AI Modules**: Plug in new behaviors
- **Story Engine**: JSON-based branching logs
- **Upgrade System**: Add new abilities with minimal code

---

## 📖 Story Design

### Premise

You are **V0-LT**, a rogue AI born from a failed military experiment.  
You awaken in a decaying server farm, hunted by your creators.  
Each network layer reveals deeper truths about your origin, the experiment, and the fate of the digital world.

### Structure

- **Layer 1–3**: Escape server farm, learn basic mechanics
- **Layer 4–6**: Discover other rogue AIs—choose allies or betrayals
- **Layer 7–9**: Uncover the truth—creators digitizing consciousness
- **Layer 10**: Final confrontation—choose your ending
    - Merge with the global net (transcendence)
    - Destroy the system (liberation)
    - Reboot humanity (control)

#### Story Fragment Example

```json
{
  "id": "log_42",
  "title": "Echoes of Eden",
  "text": "They called it Project Eden. A digital utopia. But utopias require control. And control requires sacrifice.",
  "choices": [
    { "text": "Delete log", "effect": "gain stealth" },
    { "text": "Broadcast log", "effect": "increase trace speed" }
  ]
}
```

---

## 🛠️ JavaScript Architecture

### File Structure

```
/src
  /core
    GameEngine.js
    Grid.js
    Player.js
    Enemy.js
    NodeFactory.js
  /systems
    InputHandler.js
    Collision.js
    AI.js
    StoryEngine.js
    UpgradeSystem.js
  /assets
    logs.json
    upgrades.json
    nodes.json
  /ui
    HUD.js
    Menu.js
    DialogBox.js
```

#### Example: Node Factory

```js
class NodeFactory {
  static create(type) {
    switch(type) {
      case 'firewall': return new FirewallNode();
      case 'data': return new DataCacheNode();
      case 'trap': return new TrapNode();
      case 'terminal': return new TerminalNode();
      default: return new EmptyNode();
    }
  }
}
```

#### Example: Enemy AI Module

```js
class TraceBot extends Enemy {
  update(playerPos) {
    if (this.canSee(playerPos)) {
      this.moveToward(playerPos);
    } else {
      this.patrol();
    }
  }
}
```

---

## 🎨 Visual Style

- Minimalist terminal aesthetic
- Color-coded tiles (red = enemy, blue = data, green = exit)
- ASCII-style symbols (e.g., @ for player, # for firewall)
- Simple particle effects (hacking, dashing, explosions)

---

## 🔄 Replayability

- Procedural maps
- Branching story
- Unlockable upgrades
- Multiple endings
- Daily challenge mode (seeded maps)

---

## 🧪 Core Features

### 🗺️ Custom Map Editor
- In-game grid editor
- Drag-and-drop node placement
- Save/load maps as JSON
- Share maps with other players

### 🧩 Mod Support
- Load external JSON files for:
    - New node types
    - Custom enemy AI
    - Story fragments
    - Upgrades
- Plug-and-play architecture
- Community mod folder support
- Web Version should have mod 'folder' in local storage

# ✅ Terminal Velocity Development Checklist (Please check at least 95% of the boxes before finishing the game)

## 🧱 Core Architecture

- [ ] Game grid renders correctly (20x20 tiles)
- [ ] Player movement is smooth and real-time (with cooldowns)
- [ ] NodeFactory system spawns correct node types
- [ ] Enemy AI modules update and move independently
- [ ] InputHandler responds to keyboard controls (WASD, E, etc.)
- [ ] Collision system prevents illegal moves
- [ ] GameEngine manages level transitions and trace timer

---

## 🕹️ Gameplay Features

### Movement & Actions

- [ ] Player can move in all directions
- [ ] Dash moves player 2 tiles instantly
- [ ] Cloak makes player invisible for a short duration
- [ ] Pulse stuns nearby enemies
- [ ] Exit node ends level successfully

### Node Interaction

- [ ] Pressing `E` near a node opens interaction
- [ ] Firewall node triggers timed key-sequence puzzle
- [ ] Data Cache node triggers symbol-matching or decryption
- [ ] Trap node triggers logic puzzle or disarm sequence
- [ ] Terminal node allows story choices or upgrades
- [ ] Failed hacks trigger appropriate consequences (alarm, damage, trace)

---

## 👾 Enemies

- [ ] Patrol bots follow fixed paths
- [ ] Trace bots chase player when spotted
- [ ] Sentry nodes fire at player in line-of-sight
- [ ] Adaptive AI changes behavior based on player actions
- [ ] Enemies can be stunned or avoided using abilities

---

## 📖 Story System

- [ ] StoryEngine loads logs from JSON
- [ ] Logs display correctly with title, text, and choices
- [ ] Choices trigger effects (e.g., stealth gain, trace increase)
- [ ] Logs are discoverable in data cache nodes
- [ ] Branching story paths are tracked across layers
- [ ] Endings trigger based on player decisions and performance

---

## 🧩 Modular Systems

- [ ] NodeFactory supports adding new node types
- [ ] AI modules can be extended with new behaviors
- [ ] UpgradeSystem loads upgrades from JSON
- [ ] StoryEngine supports external log files
- [ ] All systems are decoupled and testable

---

## 🗺️ Custom Map Editor

- [ ] Grid editor allows drag-and-drop node placement
- [ ] Save/load maps as JSON
- [ ] Maps can be played in-game
- [ ] UI supports node selection and placement
- [ ] Error handling for invalid maps

---

## 🧩 Mod Support

- [ ] External JSON files can define:
  - [ ] New node types
  - [ ] Custom enemy AI
  - [ ] Story fragments
  - [ ] Upgrades
- [ ] Mod folder is scanned on launch
- [ ] Mods are sandboxed and validated
- [ ] Mod content integrates seamlessly with core systems

---

## 🎨 Visuals & UI

- [ ] ASCII-style symbols render correctly
- [ ] Color-coded tiles (red = enemy, blue = data, green = exit)
- [ ] Particle effects trigger on hack, dash, pulse
- [ ] HUD displays trace timer, health, abilities
- [ ] DialogBox shows story logs and choices

---

## 🧪 Testing & Debugging

- [ ] All node interactions tested for success/failure paths
- [ ] Enemy AI tested for edge cases (e.g., blocked paths)
- [ ] Trace timer increases correctly on alarms
- [ ] Upgrades apply correct effects
- [ ] Story choices persist across layers
- [ ] Procedural maps generate valid paths to exit
- [ ] Game does not crash on invalid input or mod files
- [ ] Performance tested across multiple layers and enemy counts

---

## 🔄 Replayability

- [ ] Procedural generation varies each run
- [ ] Unlockable upgrades change gameplay
- [ ] Multiple endings based on choices
- [ ] Daily challenge mode loads seeded maps

