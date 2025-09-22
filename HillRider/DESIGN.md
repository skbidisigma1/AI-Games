# HillRider Design Document

## Game Overview

HillRider is a momentum-based hill-riding game where players control a vehicle over procedurally generated terrain. The core gameplay revolves around mastering the timing of acceleration and coasting to build momentum, achieve high speeds, and maintain control through challenging terrain.

## Core Mechanics

### Momentum System
- **Hold to Accelerate**: Players hold SPACE/click to build speed downhill
- **Release to Coast**: Releasing allows the vehicle to maintain momentum uphill
- **Momentum Building**: Proper timing on slopes builds momentum (0-100 scale)
- **Speed Bonus**: High momentum provides speed bonuses beyond base max speed
- **Visual Feedback**: Momentum bar and glow effects indicate current momentum level

### Physics Implementation
```javascript
// Simplified physics loop
if (isAccelerating && onGround && groundAngle > 0) {
    momentum = Math.min(momentum + 2, maxMomentum);
    velocityX += acceleration * (1 + groundAngle * 0.5);
} else {
    momentum = Math.max(momentum - 1, 0);
}

const momentumBoost = (momentum / maxMomentum) * 3;
velocityX = Math.min(velocityX + momentumBoost * 0.1, maxSpeed + momentumBoost);
```

### Terrain Generation
- **Procedural Hills**: Generated using multi-octave noise functions
- **Increasing Difficulty**: Amplitude and complexity increase with distance
- **Smooth Rendering**: Quadratic curves for natural hill shapes
- **Collision System**: Segment-based ground collision detection

```javascript
// Terrain generation algorithm
const noise1 = this.noise(x * frequency + seed);
const noise2 = this.noise(x * frequency * 2 + seed) * 0.5;
const noise3 = this.noise(x * frequency * 4 + seed) * 0.25;
const combinedNoise = noise1 + noise2 + noise3;
const y = baseHeight + combinedNoise * amplitude * difficultyFactor;
```

## Game Systems

### Scoring System
- **Distance Points**: 1 point per 10 units traveled
- **Momentum Bonus**: Extra points for maintaining high momentum (80+)
- **Coin Multiplier**: Coin value increases with current momentum level
- **Progression Tracking**: Distance traveled affects terrain difficulty

### Collectibles & Power-ups
- **Coins**: Basic collectibles worth 10 points (+ momentum multiplier)
- **Speed Boost**: Temporary +5 max speed for 5 seconds
- **Jump Boost**: Instant upward velocity if on ground
- **Magnet**: Attracts nearby coins for easier collection

### Camera System
- **Smooth Following**: Camera follows player with configurable smoothness
- **Momentum Shake**: Screen shake intensity based on current momentum
- **Dynamic Positioning**: Player positioned left-of-center for forward visibility
- **Predictive Framing**: Shows upcoming terrain for better planning

## Visual Design

### Art Style
- **Minimalist Aesthetic**: Clean, bold colors with smooth gradients
- **Sky Gradients**: Blue-to-green gradient suggesting outdoor environment
- **Terrain Rendering**: Solid green hills with darker borders and grass texture
- **Vehicle Design**: Simple blue rectangular vehicle with visible wheels

### Particle Effects
- **Coin Collection**: Golden sparkle particles with floating animation
- **Power-up Collection**: Colored particles matching power-up type
- **Player Trail**: Subtle blue trail showing recent movement path
- **Momentum Glow**: Orange glow effect around vehicle at high momentum

### UI Design
- **HUD Elements**: Score, distance, speed, and coins in top bar
- **Momentum Indicator**: Bottom-center bar with action hints
- **Screen Transitions**: Smooth fade transitions between game states
- **Responsive Layout**: Mobile-friendly touch controls and scaling

## Technical Architecture

### Game State Management
```javascript
// Game states
'title'    -> Main menu with animated background
'playing'  -> Active gameplay with physics simulation
'paused'   -> Paused gameplay with overlay menu
'gameOver' -> End screen with score and restart options
```

### Performance Optimizations
- **Terrain Culling**: Only render visible terrain segments
- **Particle Pooling**: Reuse particle objects to reduce garbage collection
- **Canvas Optimization**: Transform-based rendering for smooth 60fps
- **Dynamic Quality**: Adjustable particle counts based on performance settings

### Data Persistence
- **High Scores**: Local storage of top 5 scores with distance tracking
- **Settings**: Audio, graphics, and difficulty preferences saved locally
- **Progressive Enhancement**: Graceful degradation without local storage

## Audio Design

### Sound Effects (Placeholder Implementation)
- **Acceleration**: Engine sound during hold-to-accelerate
- **Coin Collection**: Pleasant chime sound with varying pitch
- **Power-up Collection**: Distinct sound for each power-up type
- **Crash/Game Over**: Low-impact sound to maintain positive feel

### Audio Architecture
```javascript
playSound(soundId) {
    if (!this.settings.sound) return;
    const audio = document.getElementById(soundId);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {}); // Graceful error handling
    }
}
```

## Difficulty Progression

### Dynamic Scaling
- **Terrain Amplitude**: Hills become steeper over distance
- **Frequency Changes**: More rapid elevation changes
- **Gap Increases**: Larger gaps requiring momentum management
- **Visual Feedback**: Subtle environmental changes indicating progression

### Balance Considerations
- **Learning Curve**: Easy start with gradual difficulty increase
- **Momentum Rewards**: High momentum provides significant advantages
- **Risk/Reward**: Aggressive riding for coins vs. safe conservative play
- **Recovery Mechanics**: Possible to recover from mistakes with good timing

## Future Enhancement Opportunities

### Gameplay Additions
- **Vehicle Upgrades**: Unlockable improvements to speed, handling, momentum
- **Multiple Vehicles**: Different vehicles with unique characteristics
- **Seasonal Themes**: Visual variations for different environments
- **Challenge Modes**: Time trials, coin collection goals, distance challenges

### Technical Improvements
- **WebGL Rendering**: Enhanced visual effects and performance
- **Procedural Music**: Dynamic audio that responds to gameplay
- **Multiplayer Ghost**: Race against recorded runs from other players
- **Achievement System**: Long-term progression goals and unlocks

### Accessibility Features
- **Colorblind Support**: Alternative visual indicators beyond color
- **Motor Accessibility**: Alternative control schemes for different abilities
- **Visual Clarity**: High contrast mode for better visibility
- **Audio Cues**: Sound-based feedback for visual elements

## Development Lessons

### What Worked Well
- **Simple Core Mechanic**: Hold/release creates immediate engagement
- **Visual Polish**: Smooth animations and particle effects enhance feel
- **Progressive Difficulty**: Natural learning curve keeps players engaged
- **Responsive Controls**: Immediate feedback makes timing feel satisfying

### Technical Challenges
- **Terrain Generation**: Balancing realism with playability in procedural hills
- **Physics Tuning**: Finding the right balance of momentum, friction, and gravity
- **Performance**: Maintaining 60fps with smooth terrain rendering
- **Mobile Optimization**: Touch controls that feel as responsive as keyboard/mouse

This design document serves as a reference for understanding HillRider's implementation and provides a foundation for future development and improvements.