# 🌤️ SkyGlider - Momentum Master

A momentum-based hill-riding game inspired by Dune and Tiny Wings where players control a gliding character over procedurally generated rolling hills.

## 🎮 Gameplay

Master the art of momentum control as you glide over endless rolling hills. The core mechanic revolves around perfectly timing when to increase gravity (dive) and when to glide for maximum airtime and speed.

### Core Features

- **🌄 Procedural Rolling Hills**: Smooth sine-wave terrain generated using multiple noise octaves for realistic hill shapes
- **🕹️ Momentum Control**: Hold SPACE/Click to increase gravity and sync with downhill slopes, release to launch off uphill slopes
- **⭐ Star Collection**: Collect golden stars scattered along the path for points and score multipliers
- **⚡ Power-up System**: Speed bursts, jump boosts, and magnet effects to enhance gameplay
- **🌅 Day-Night Cycle**: Dynamic lighting that transitions from day to night with animated sky gradients
- **🎥 Dynamic Camera**: Smooth camera tracking with momentum-based screen shake effects
- **🎨 Character Selection**: Choose between Bird, Alien, or Creature, each with unique animations

### Controls

- **SPACE** or **Click/Touch**: Hold to increase gravity (dive), release to glide
- **ESC**: Pause game (during play)

## 🏆 Progression & Challenge

- **Timer-Based Gameplay**: Race against time with 60-second rounds
- **Combo System**: Perfect landings build combo multipliers for higher scores
- **Momentum Physics**: Build momentum on downhill slopes, launch off uphill slopes
- **Progressive Difficulty**: Terrain becomes more challenging as you travel further

## 🎨 Features

### Visual Effects
- **Vibrant Parallax Backgrounds**: Multiple layered backgrounds with mountains, clouds, and hills
- **Particle Systems**: Golden trails, landing effects, combo sparkles, and collection particles
- **Squash/Stretch Animation**: Character deforms realistically during landing and launching
- **Dynamic Lighting**: Day-night cycle affects all visual elements
- **Screen Shake**: Momentum-based camera effects for perfect landings

### Audio System
- **Sound Effects**: Landing, gliding, star collection, combo, and power-up sounds
- **Background Music**: Ambient music that can be toggled on/off
- **Customizable Audio**: Full control over sound effects and music

### Physics Engine
- **Realistic Momentum**: Speed builds based on slope angle and timing
- **Gravity Manipulation**: Hold to increase gravity for syncing with slopes
- **Air Resistance**: Realistic drag affects gliding physics
- **Ground Interaction**: Terrain angle affects acceleration and landing quality
- **Perfect Landing Detection**: Rewards precise angle and speed matching

## 🛠️ Technical Implementation

### Game Architecture
- **Canvas-based rendering** with smooth 60fps gameplay
- **Procedural terrain generation** using sine waves and multiple noise octaves
- **Physics-based momentum system** with realistic acceleration and friction
- **Dynamic camera system** with smooth following and momentum-based effects

### Terrain Generation
- Uses mathematical sine functions for smooth rolling hills
- Multiple octaves create realistic terrain variation
- Generates terrain segments ahead of the player
- Optimized to only render visible terrain segments

### Character System
- Three unique characters: Bird, Alien, and Creature
- Each with distinct visual design and animations
- Squash/stretch physics for realistic deformation
- Trail effects that respond to momentum level

## 🚀 Getting Started

1. Open `index.html` in a web browser
2. Click "🚀 START GLIDING!" to begin
3. Hold SPACE or click to dive down hills
4. Release to launch off uphill slopes
5. Collect stars and power-ups while maintaining momentum
6. Try to travel as far as possible before time runs out!

## 🎯 Tips for High Scores

- **Perfect Your Timing**: Hold gravity on downhill slopes, release before uphill slopes
- **Build Combos**: Perfect landings create combo multipliers
- **Collect Everything**: Stars and power-ups boost your score significantly
- **Use Power-ups Wisely**: Speed boosts and jumps can help reach higher areas
- **Maintain Momentum**: Consistent rhythm is key to traveling far distances

## 🔧 Customization

The game includes several customizable options:
- **Sound Effects**: Toggle audio feedback
- **Background Music**: Control ambient audio
- **Graphics Quality**: Adjust particle effects and visual fidelity (Low/Medium/High)
- **Character Selection**: Choose between Bird, Alien, or Creature

## 📝 Development Notes

This game demonstrates several key programming concepts:
- **Procedural Generation**: Creating endless, varied terrain using mathematical functions
- **Physics Simulation**: Realistic momentum, gravity, and collision systems
- **Game State Management**: Smooth transitions between screens and game states
- **Local Storage**: Persistent high scores and settings
- **Canvas Animation**: Smooth 60fps rendering with particle effects
- **Responsive Design**: Touch controls for mobile devices

The codebase is designed to be:
- **Modular**: Easy to extend with new features
- **Performant**: Optimized for smooth gameplay across devices
- **Accessible**: Works on desktop and mobile browsers
- **Educational**: Well-commented code for learning purposes

## 🌟 Game Design Philosophy

SkyGlider captures the meditative flow of momentum-based games while providing:
- **Simple Controls**: One-button input that's easy to learn, hard to master
- **Satisfying Physics**: Realistic momentum that feels natural and responsive
- **Visual Polish**: Beautiful graphics with particle effects and smooth animations
- **Replayability**: Procedural terrain and score chasing encourage multiple plays
- **Accessibility**: Works on any device with a web browser

Experience the zen of perfect momentum control in SkyGlider!