# Dune - Desert Arena Shooter

*A top-down action shooter where you face off against hilariously incompetent AI bots in a desert arena*

## 🎮 Gameplay

Survive as long as possible in the desert arena against waves of terrible AI bots. These enemies are intentionally designed to be awful at combat - they have poor aim, slow reactions, get confused easily, and make questionable tactical decisions.

### Features

- **Top-down shooter mechanics** - Classic arena-style combat
- **Intentionally terrible AI bots** - Enemies with poor aim, slow reactions, and confused behavior
- **Wave-based progression** - Each wave brings more (equally incompetent) enemies
- **Health system** - Take damage from enemy fire, collect health packs to recover
- **Desert arena setting** - Fight in sandy environments with appropriate visuals
- **Simple controls** - WASD movement, mouse aim, click to shoot

### Controls

- **Movement**: WASD or Arrow Keys
- **Aim**: Mouse cursor
- **Shoot**: Left click (hold for continuous fire)
- **Pause**: ESC (future feature)

### Gameplay Elements

#### Player
- **Health**: 100 HP, decreases when hit by enemy bullets
- **Shooting**: Unlimited ammo with cooldown between shots
- **Movement**: Fast, responsive movement in all directions

#### Enemies (Horrible Bots)
- **Poor AI**: Enemies have intentionally bad pathfinding and targeting
- **Slow reactions**: Long delays between spotting player and shooting
- **Terrible aim**: Bullets often miss by wide margins
- **Confusion**: Bots occasionally move in wrong directions
- **Inconsistent behavior**: Unpredictable movement patterns

#### Items
- **Health Packs**: Restore 30 HP when collected
- **Score**: Earn points for defeating enemies

## 🚀 Getting Started

### Running the Game

1. Open `index.html` in any modern web browser
2. Click "ENTER THE ARENA" to start
3. Use WASD to move, mouse to aim, click to shoot
4. Survive waves of incompetent enemies

### Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

No plugins or additional software required.

## 🎨 Visual Design

The game features a desert/sand theme with:
- Warm brown and tan color palette
- Sand particle effects
- Desert-inspired UI elements
- Clear visual feedback for game events

## 🔧 Technical Details

### File Structure

```
Dune/
├── index.html          # Main game page
├── game.js            # Core game logic and mechanics
├── styles.css         # Visual styling and animations
├── README.md          # This documentation
├── DESIGN.md          # Game design document
├── audio/             # Audio assets (placeholder)
│   └── README.md      # Audio asset documentation
└── assets/            # Visual assets (placeholder)
    └── README.md      # Visual asset documentation
```

### Key Technologies

- **HTML5 Canvas** - Game rendering
- **Vanilla JavaScript** - Game logic
- **CSS3** - UI styling and animations
- **Web Audio API** - Sound effects (when implemented)

## 🎯 Game Balance

The game is deliberately unbalanced in the player's favor due to the terrible AI:

### Enemy Weaknesses
- **Aim inaccuracy**: Bullets miss frequently
- **Slow shooting**: Long cooldowns between shots
- **Poor pathfinding**: Often take inefficient routes
- **Confusion mechanics**: Sometimes move randomly
- **Slow bullet speed**: Easy to dodge enemy projectiles

### Player Advantages
- **Fast movement**: Quick response to input
- **Accurate shooting**: Bullets go where you aim
- **Fast fire rate**: Much shorter cooldown than enemies
- **Smart targeting**: Mouse-based precise aiming

## 🏆 Scoring

- **Enemy elimination**: 100 points per bot
- **Wave completion**: Bonus points for clearing waves
- **Survival time**: Additional score based on time survived

## 🔮 Future Enhancements

Potential improvements that could be added:

- Sound effects and background music
- Different enemy types with varying levels of incompetence
- Power-ups and weapon upgrades
- Larger arena with obstacles
- Local high score tracking
- Different difficulty modes (even worse AI vs slightly less terrible AI)

## 🤖 The Horrible AI System

The enemy AI is specifically designed to be entertainingly bad:

### Targeting Issues
- Updates target position infrequently
- Adds random inaccuracy to aim
- Sometimes targets where player was, not where they are

### Movement Problems
- Uses outdated target positions
- Occasionally moves in completely wrong direction
- No collision avoidance with other enemies

### Combat Deficiencies
- Very slow reaction times
- Inconsistent shooting intervals
- Poor bullet speed and accuracy

This creates a fun, accessible experience where players can feel powerful while still having engaging combat encounters.

---

*Part of the AI-Games collection exploring themes of artificial intelligence and digital consciousness. In this case, the theme is "artificial stupidity" and the entertainment value of deliberately flawed AI opponents.*