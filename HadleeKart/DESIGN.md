# HadleeKart Game Design Document

## 🎯 Game Vision

HadleeKart is a complete top-down 2D racing game that captures the excitement of classic kart racing games like Mario Kart, featuring competitive AI opponents, strategic power-ups, and smooth racing mechanics in a browser-based experience.

## 🎮 Core Gameplay

### Racing Mechanics
- **Vehicle Physics**: Realistic acceleration, braking, and turning with speed-dependent handling
- **Drift System**: SHIFT key enables drifting with visual smoke effects and improved cornering
- **Track Navigation**: Oval circuit with varying difficulty sections and strategic racing lines
- **Lap Racing**: 3-lap races with checkpoint-based lap detection system

### Victory Conditions
- Complete 3 laps before AI opponents
- Final position ranking (1st through 8th place)
- Best lap time tracking for personal records

## 🤖 AI System Design

### AI Personalities
Each of the 7 AI opponents has unique characteristics:

1. **Aggressive (Red Zone Racer)**
   - High aggression (0.8), excellent skill (0.9), moderate risk-taking (0.7)
   - Tends to take racing lines aggressively and push other karts

2. **Cautious (Safety First)**
   - Low aggression (0.3), good skill (0.8), low risk-taking (0.4)
   - Focuses on consistent lap times and avoiding collisions

3. **Skilled (The Pro)**
   - Moderate aggression (0.6), exceptional skill (0.95), balanced risk-taking (0.5)
   - Takes optimal racing lines and makes calculated moves

4. **Risky (Gambler)**
   - High aggression (0.7), moderate skill (0.6), high risk-taking (0.8)
   - Takes chances with risky overtakes and power-up usage

5. **Defensive (The Blocker)**
   - Low aggression (0.4), good skill (0.7), low risk-taking (0.3)
   - Focuses on maintaining position and blocking opponents

6. **Reckless (Wild Card)**
   - Maximum aggression (0.9), good skill (0.7), maximum risk-taking (0.9)
   - Unpredictable behavior with aggressive moves

7. **Balanced (All-Rounder)**
   - Moderate aggression (0.5), high skill (0.85), moderate risk-taking (0.6)
   - Well-rounded performance across all racing aspects

### AI Behavior Systems
- **Pathfinding**: Target-based navigation using track checkpoints
- **Obstacle Avoidance**: Lookahead collision detection with 80-pixel range
- **Dynamic Difficulty**: Personality-based decision making
- **Power-Up Usage**: Strategic item usage with 2% chance per frame when holding items

## 🎁 Power-Up System

### Power-Up Types and Mechanics

#### 🍄 Speed Boost Mushroom (40% spawn rate)
- **Effect**: 1.5x speed multiplier for 2 seconds
- **Strategy**: Best used on straightaways for maximum advantage
- **Visual**: Floating orange mushroom icon with animation

#### 🍌 Banana Peel (30% spawn rate)
- **Effect**: Deployed behind kart, causes opponents to skid and slow significantly
- **Strategy**: Use defensively or on tight corners
- **Lifetime**: 10 seconds before automatic cleanup
- **Visual**: Yellow banana with realistic collision detection

#### 🔴 Red Homing Shell (20% spawn rate)
- **Effect**: Targets nearest opponent with 6-speed homing projectile
- **Range**: 8-second lifetime with intelligent target tracking
- **Impact**: Reduces target speed to 30% temporarily
- **Visual**: Red shell with particle trail and homing behavior

#### ⚡ Lightning Strike (10% spawn rate - Rare)
- **Effect**: Affects ALL opponents except the caster
- **Visual**: Full-screen white flash effect with 0.3-second duration
- **Impact**: Reduces all opponent speeds to 30% for 3 seconds
- **Strategic**: Most powerful but requires timing

### Power-Up Distribution
- 15 power-ups spawn initially around the track
- Automatic respawn 5-10 seconds after collection
- Random placement with track-based positioning
- Only one power-up can be held at a time

## 🏁 Track Design

### Layout Specifications
- **Dimensions**: 2000x1400 pixel racing surface
- **Track Width**: 120 pixels with lane markings
- **Surface**: Multi-layered visual design with proper racing lines

### Track Features
- **Oval Base**: Classic oval circuit foundation
- **Variation Curves**: Mathematical variation for interesting turns
  - Top-right section: Sine wave variation (±50 pixels)
  - Bottom-left section: Cosine wave variation (±40 pixels)
- **Visual Elements**: 
  - Lane markings with dashed white lines
  - Colored checkpoint circles for navigation
  - Start/finish line with distinctive white marking

### Checkpoint System
- 8 strategically placed checkpoints around the track
- 80-pixel radius detection zones
- Sequential progression required for lap completion
- Visual indicators with color coding (red for start/finish, orange for others)

## 🎨 Visual Design Philosophy

### Art Style
- **Clean Vector Aesthetic**: Simple, readable shapes for fast gameplay
- **High Contrast**: Clear distinction between track, karts, and power-ups
- **Color Psychology**: Each kart color chosen for maximum visibility and distinction

### UI Design Principles
- **Racing-Focused HUD**: Essential information without clutter
- **Real-Time Feedback**: Immediate response to player actions
- **Accessibility**: Clear typography and color choices
- **Responsive Layout**: Adapts to different screen sizes

### Visual Effects
- **Drift Smoke**: Multi-particle system for drifting feedback
- **Collision Sparks**: 8-particle burst system for impact feedback
- **Power-Up Animations**: Floating and rotation effects for collectibles
- **Lightning Flash**: Full-screen effect for ultimate power-up

## 🔧 Technical Architecture

### Core Engine Design
```
Game Loop (60 FPS)
├── Input Processing
├── Physics Update
├── AI Decision Making
├── Collision Detection
├── Particle Systems
├── Camera Management
└── Rendering Pipeline
```

### Physics Engine Specifications
- **Maximum Speed**: 8 units (configurable)
- **Acceleration**: 0.3 units per frame
- **Deceleration**: 0.95 friction multiplier
- **Turn Speed**: 0.08 radians (speed-dependent)
- **Drift Factor**: 0.85 momentum retention

### Memory Management
- **Particle Cleanup**: Automatic removal when life expires
- **Power-Up Recycling**: Efficient respawn system
- **Collision Optimization**: Spatial partitioning for large numbers of objects

### Extensibility Features
- **Modular Classes**: Easy addition of new power-ups, tracks, or AI behaviors
- **Configuration Objects**: Adjustable parameters without code changes
- **Event System**: Hooks for adding new gameplay mechanics
- **Asset Pipeline**: Support for audio and additional graphics

## 📊 Performance Targets

### Frame Rate
- **Target**: 60 FPS constant
- **Minimum**: 30 FPS on lower-end devices
- **Optimization**: Efficient rendering and physics calculations

### Browser Support
- **Primary**: Chrome, Firefox, Safari, Edge
- **Requirements**: HTML5 Canvas, ES6 JavaScript support
- **Fallbacks**: Graceful degradation for older browsers

## 🎵 Audio Design (Implementation Ready)

### Sound Categories
- **Engine Audio**: Looping engine sound with speed-based pitch variation
- **Impact Effects**: Collision sounds for kart-to-kart and track impacts  
- **Power-Up Audio**: Distinct sounds for collection and usage of each item type
- **Environmental**: Drift sounds and ambient track atmosphere
- **UI Feedback**: Menu navigation and race completion fanfares

### Audio Implementation
- HTML5 Audio elements with JavaScript control
- Volume balancing for gameplay clarity
- Cross-browser compatibility testing
- Optional audio disable for accessibility

## 🚀 Future Enhancement Opportunities

### Immediate Extensions
- Additional track designs with different layouts
- More power-up types (shields, speed traps, etc.)
- Time trial mode with ghost racing
- Local multiplayer support

### Advanced Features
- Track editor for user-generated content
- Online leaderboards and time sharing
- Weather effects and dynamic track conditions
- Customizable kart appearance and performance tuning

### Technical Improvements
- WebGL rendering for enhanced visual effects
- Advanced AI machine learning for adaptive difficulty
- Mobile touch controls optimization
- Progressive Web App (PWA) capabilities

---

HadleeKart represents a complete, production-ready racing game that balances accessibility with depth, providing immediate fun while offering room for strategic mastery.