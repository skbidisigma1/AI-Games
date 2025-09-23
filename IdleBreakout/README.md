# Idle Breakout+ - Full Game Experience

🧱 **Idle Breakout+** is a comprehensive idle brick-breaking game where autonomous balls destroy bricks and earn coins passively. Strategic upgrading and optimization drive progression through increasingly challenging levels.

## 🎮 Game Features

### Core Gameplay
- **Autonomous Balls**: Balls operate independently with realistic physics
- **Strategic Upgrades**: Four distinct ball types with unique characteristics
- **Passive Income**: Earn coins continuously, even when offline
- **Level Progression**: Increasingly difficult brick layouts and HP scaling
- **Power-up System**: Temporary boosts for challenging situations

### Ball Types
1. **Basic Ball** - Reliable starter option
   - Balanced damage and speed
   - Affordable upgrade path
   
2. **Power Ball** - Heavy damage specialist
   - High damage output
   - Slower movement speed
   
3. **Speed Ball** - Fast-moving striker
   - Rapid brick destruction
   - Lower damage per hit
   
4. **Splash Ball** - Area damage expert
   - Damages nearby bricks
   - Devastating against clusters

### Power-ups
- **Double Damage** - 2x damage for 10 seconds
- **Speed Boost** - 1.5x speed for 15 seconds  
- **Multiball** - Spawn temporary extra balls

### Progression Systems
- **Ball Shop** - Purchase and upgrade different ball types
- **Prestige System** - Reset for permanent coin multipliers
- **Offline Earnings** - Continue earning when not playing (50% efficiency)
- **Achievement System** - Milestone rewards and progression tracking

## 🎯 How to Play

### Getting Started
1. Open `index.html` in a web browser
2. Click "START BREAKING!" to begin
3. Watch balls automatically destroy bricks
4. Earn coins from destroyed bricks
5. Spend coins on upgrades and new balls

### Strategy Tips
- **Early Game**: Focus on Basic Ball upgrades for steady progression
- **Mid Game**: Diversify with Power and Speed balls
- **Late Game**: Unlock Splash balls for area damage
- **Power-ups**: Use strategically on difficult levels
- **Prestige**: Reset when progress slows for permanent bonuses

### Controls
- **Mouse**: Navigate menus and purchase upgrades
- **Space**: Pause/unpause the game
- **Escape**: Toggle help screen
- **1-4 Keys**: Quick access to power-ups (when implemented)

## 🔧 Technical Features

### Performance Optimized
- Efficient collision detection
- Smooth 60 FPS gameplay
- Particle system with quality options
- Mobile-responsive design

### Save System
- Local storage for progress persistence
- Automatic saving every 30 seconds
- Cross-session offline earnings calculation

### Modular Architecture
- Data-driven configuration system
- Easily adjustable balance parameters
- Extensible class-based design

## 🎨 Visual Design

### Modern UI/UX
- Cyberpunk-inspired color scheme
- Smooth animations and transitions
- Responsive layout for all devices
- Particle effects for visual feedback

### Accessibility
- Clear visual hierarchy
- Intuitive navigation
- Mobile touch-friendly controls
- Comprehensive help system

## 📊 Game Balance

### Economic Design
- Exponential cost scaling prevents trivial progression
- Multiple upgrade paths encourage strategic choices
- Offline earnings cap prevents excessive accumulation
- Prestige system provides long-term goals

### Difficulty Scaling
- Brick HP increases by 20% per level
- Grid size expands with progression
- Boss bricks appear at higher levels
- Power-up costs scale with player power

## 🚀 Future Enhancements

### Extended Features (Post-MVP)
- **Boss Bricks**: Special mechanics like shields and regeneration
- **Daily Challenges**: Time-limited events with unique rewards
- **Achievement System**: Milestone tracking and bonus rewards
- **Cloud Save**: Cross-device progress synchronization
- **Themes**: Unlockable visual customizations

### Advanced Mechanics
- **Ball Synergies**: Combination effects between ball types
- **Automation Modules**: Auto-upgrade and auto-power-up systems
- **Brick Varieties**: Explosive, teleporting, and multiplying bricks
- **Leaderboards**: Social comparison features

## 🔨 Development Notes

### Architecture
The game follows a modular, class-based design:
- `Ball`: Autonomous physics and collision handling
- `Brick`: Destructible targets with HP systems
- `GameManager`: Level generation and progression logic
- `EconomyManager`: Currency, costs, and offline earnings
- `UIManager`: Interface updates and user interactions

### Configuration System
Game balance is controlled through the `CONFIG` object, allowing easy tuning of:
- Ball stats and upgrade costs
- Power-up effects and durations
- Level generation parameters
- Economic scaling factors

### Data Persistence
- Local storage saves all progress automatically
- Offline earnings calculated based on ball power
- Cross-session state restoration
- Prestige progress tracking

## 📁 File Structure

```
IdleBreakout/
├── index.html          # Main game page
├── styles.css          # Game styling
├── game.js            # Core game logic
├── README.md          # This file
├── DESIGN.md          # Detailed design document
└── audio/             # Sound effects (placeholder)
    ├── brick_break.mp3
    ├── upgrade.mp3
    ├── powerup.mp3
    └── level_complete.mp3
```

## 🎵 Audio

Audio files are referenced but not included. The game will function silently without them, or you can add appropriate sound effects:
- Brick destruction sounds
- Upgrade purchase confirmations  
- Power-up activation effects
- Level completion fanfares

## 🐛 Known Issues

- Audio files are placeholder references
- Particle effects may impact performance on older devices
- Mobile landscape mode may need UI adjustments

## 🏆 Credits

Created as part of the AI-Games repository, demonstrating:
- Idle game mechanics and progression systems
- Autonomous physics simulation
- Strategic upgrade paths
- Modern web game development practices

---

**Enjoy breaking bricks and optimizing your idle empire!** 🧱⚡💰