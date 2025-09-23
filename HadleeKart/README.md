# HadleeKart - High-Speed Racing Adventure

A complete top-down 2D racing game built with HTML5 Canvas and vanilla JavaScript, featuring competitive AI, interactive power-ups, and smooth racing mechanics.

## 🎮 Game Features

### Core Racing Mechanics
- **Realistic Physics**: Acceleration, braking, turning, and drifting mechanics
- **8 Kart Racing**: Player vs 7 AI opponents with unique personalities
- **3-Lap Races**: Complete track navigation with lap counting
- **Position Tracking**: Real-time race position calculation
- **Minimap**: Live track overview with kart positions

### AI Opponents
- **7 Unique AI Personalities**: Aggressive, Cautious, Skilled, Risky, Defensive, Reckless, Balanced
- **Smart Pathfinding**: AI karts navigate the track intelligently
- **Competitive Behavior**: Overtaking, blocking, and strategic racing
- **Collision Avoidance**: Dynamic obstacle detection and response

### Power-Up System
- **🍄 Speed Boost Mushroom**: Temporary velocity increase (1.5x speed for 2 seconds)
- **🍌 Banana Peel**: Causes opponents to skid and slow down
- **🔴 Red Homing Shell**: Targets and slows the nearest opponent
- **⚡ Lightning Strike**: Affects all opponents except the player with screen flash

### Track Design
- **Beautiful Oval Circuit**: Professionally designed racing track
- **Visual Polish**: Lane markings, checkpoints, and start/finish line
- **Collision Detection**: Proper track boundaries and kart interactions
- **Camera System**: Smooth camera following with track boundaries

## 🎯 Controls

- **W/A/S/D or Arrow Keys**: Drive and steer
- **SHIFT**: Drift (with visual smoke effects)
- **SPACE**: Use collected power-up

## 🏗️ Technical Architecture

### Modular Design
The game is built with a clean, modular architecture for easy extension:

```
HadleeKartGame (Main orchestrator)
├── InputHandler (Keyboard input management)
├── PhysicsEngine (Movement and collision physics)
├── AISystem (AI behavior and pathfinding)
├── PowerUpSystem (Power-up logic and effects)
├── RenderingEngine (All visual rendering)
└── GameStateManager (State transitions)
```

### Key Classes
- **Kart**: Player and AI kart entities with physics properties
- **RacingTrack**: Track layout, checkpoints, and collision detection
- **PowerUp**: Base class for all interactive items
- **Particle**: Visual effect system for collisions and drifting
- **BananaPeel/HomingShell**: Specialized power-up implementations

### Performance Features
- **60 FPS Target**: Smooth animation and physics updates
- **Efficient Rendering**: Canvas optimization and camera culling
- **Particle Management**: Automatic cleanup of visual effects
- **Memory Management**: Proper object lifecycle handling

## 🎨 Visual Design

### Graphics Style
- **Top-Down Perspective**: Classic kart racing viewpoint
- **Vibrant Colors**: Each kart has a distinct color scheme
- **Professional UI**: Racing-themed HUD with real-time data
- **Particle Effects**: Drift smoke, collision sparks, power-up animations

### UI Elements
- **Racing HUD**: Position, lap, speed, and power-up display
- **Minimap**: Real-time track overview
- **Gradient Background**: Animated multi-color gradient
- **Responsive Design**: Works on different screen sizes

## 🚀 Getting Started

1. Open `index.html` in a modern web browser
2. Click "START RACING!" to begin
3. Use controls to race against AI opponents
4. Collect power-ups strategically
5. Complete 3 laps to win!

## 🔧 Customization

The modular architecture makes it easy to:
- Add new tracks by modifying `RacingTrack.generateTrackPoints()`
- Create new power-ups by extending the `PowerUp` class
- Adjust AI difficulty in `AISystem.personalityTypes`
- Modify physics parameters in `PhysicsEngine`
- Add visual effects through the `RenderingEngine`

## 🎵 Audio Support

The game includes audio placeholders for:
- Engine sounds (looping during gameplay)
- Power-up collection and usage effects
- Collision and drift sound effects
- Lightning strike audio

Audio files can be added to the `/audio` directory to enable sound effects.

## 🏆 Race Completion

The game tracks:
- Final race position (1st through 8th place)
- Best lap time during the race
- Complete race statistics
- Restart and menu options

## 📱 Browser Compatibility

- Chrome/Chromium: Full support
- Firefox: Full support  
- Safari: Full support
- Edge: Full support

Requires JavaScript enabled and HTML5 Canvas support.

---

**HadleeKart** - Experience the thrill of competitive kart racing with intelligent AI opponents and strategic power-up gameplay!