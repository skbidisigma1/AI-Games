# 🌄 HillRider - Momentum Master

A simple, addictive hill-riding game where players master momentum control over procedurally generated terrain.

## 🎮 Gameplay

Control a vehicle as it rides over endless hills using momentum-based physics. The core mechanic revolves around perfectly timing when to accelerate downhill and when to coast for maximum airtime and speed.

### Core Features

- **🌄 Procedural Hills**: Terrain is randomly generated with increasing difficulty—steeper slopes, sharper valleys, and more dramatic elevation changes as you progress
- **🕹️ Momentum Control**: Hold SPACE/Click to accelerate downhill, release to coast uphill. Timing is key to maintaining speed and rhythm
- **💰 Coin Collection**: Coins are placed along the path to reward skillful riding and encourage exploration
- **⚡ Momentum Power-ups**: Scattered boosts give players sudden bursts of speed or temporary gravity-defying effects
- **🎥 Dynamic Camera**: Smooth camera tracking that adjusts to player speed and terrain changes, with momentum-based screen shake

### Controls

- **SPACE** or **Click/Touch**: Hold to accelerate, release to coast
- **ESC**: Pause game (during play)

## 🏆 Progression & Challenge

- **⛰️ Increasing Difficulty**: Terrain becomes more extreme the longer you survive
- **🎯 Score System**: Earn points for distance traveled, coins collected, and maintaining high momentum
- **📱 Local High Scores**: Track personal bests and encourage replayability

## 🎨 Features

### User Interface
- **🏠 Home Screen**: Clean navigation with Start Game, High Scores, and Settings
- **📊 Real-time HUD**: Score, distance, speed, and coin counter
- **⚡ Momentum Indicator**: Visual feedback for current momentum level
- **🏆 High Score System**: Local storage of top 5 scores

### Visual Design
- **🎨 Minimalist Graphics**: Clean, bold colors with smooth animations
- **✨ Particle Effects**: Coin collection sparkles and momentum trail effects
- **🌈 Dynamic Backgrounds**: Gradient sky that responds to gameplay
- **💫 Momentum Glow**: Visual feedback when building high momentum

### Technical Features
- **💾 Local Storage**: High scores and settings persist between sessions
- **⚙️ Settings System**: Sound, music, graphics quality, and difficulty options
- **📱 Responsive Design**: Optimized for both desktop and mobile platforms
- **🎵 Audio System**: Sound effects for acceleration, collection, and power-ups

## 🛠️ Technical Implementation

### Game Architecture
- **Canvas-based rendering** with smooth 60fps gameplay
- **Procedural terrain generation** using multiple noise octaves
- **Physics-based momentum system** with realistic acceleration and friction
- **Dynamic camera system** with smooth following and momentum-based effects

### Terrain Generation
- Uses mathematical noise functions for realistic hill shapes
- Generates terrain segments ahead of the player
- Increases difficulty progressively based on distance traveled
- Optimized to only render visible terrain segments

### Momentum Physics
- **Downhill Acceleration**: Building speed when holding accelerate on slopes
- **Momentum Conservation**: Coasting maintains speed based on momentum
- **Air Control**: Limited control during jumps for realistic physics
- **Ground Interaction**: Terrain angle affects acceleration efficiency

## 🚀 Getting Started

1. Open `index.html` in a web browser
2. Click "🚀 START RIDING!" to begin
3. Hold SPACE or click to accelerate downhill
4. Release to coast and maintain momentum
5. Collect coins and power-ups for higher scores
6. Try to beat your high score!

## 🎯 Tips for High Scores

1. **Master the Rhythm**: Learn when to accelerate and when to coast
2. **Build Momentum Downhill**: Hold acceleration on steep descents
3. **Coast Uphill**: Release on climbs to maintain speed efficiently
4. **Collect Everything**: Coins provide score multipliers based on momentum
5. **Use Power-ups Wisely**: Speed boosts are most effective when timed right
6. **Stay Airborne**: Long jumps with high momentum provide bonus points

## 🔧 Customization

The game includes several customizable options:
- **Sound Effects**: Toggle audio feedback
- **Background Music**: Control ambient audio
- **Graphics Quality**: Adjust particle effects and visual fidelity
- **Difficulty**: Change terrain generation complexity

## 📝 Development Notes

This game demonstrates several key programming concepts:
- **Procedural Generation**: Creating endless, varied terrain
- **Physics Simulation**: Realistic momentum and gravity systems
- **Game State Management**: Smooth transitions between screens
- **Local Storage**: Persistent data management
- **Canvas Animation**: Smooth 60fps rendering with optimizations

The codebase is designed to be:
- **Modular**: Easy to extend with new features
- **Performant**: Optimized for smooth gameplay
- **Accessible**: Works across different devices and browsers
- **Educational**: Well-commented code for learning purposes