# Game Design Document - Dune

## Core Concept

**Genre**: Top-down arena shooter  
**Theme**: Desert warfare against incompetent AI  
**Target Audience**: Casual gamers looking for accessible action  
**Platform**: Web browsers (HTML5)  

## Design Philosophy

Create an entertaining shooter experience where the primary source of fun comes from the deliberately terrible AI opponents. The game should make players feel powerful and skilled while still providing engaging moment-to-moment gameplay.

## Gameplay Pillars

### 1. Accessible Action
- Simple controls that anyone can learn quickly
- Forgiving difficulty curve due to poor enemy AI
- Clear visual feedback for all actions

### 2. Comedic AI Failures
- Enemies that miss shots in entertaining ways
- Bots that get confused and move in wrong directions
- Unpredictable but clearly flawed behavior patterns

### 3. Fast-Paced Combat
- Quick movement and shooting mechanics
- Short rounds that encourage "just one more try"
- Immediate satisfaction from eliminating enemies

## Core Mechanics

### Player Mechanics

#### Movement System
- **Speed**: 4 pixels per frame (responsive but not overwhelming)
- **Control**: WASD or arrow keys for 8-directional movement
- **Boundaries**: Player constrained to arena bounds

#### Shooting System
- **Aiming**: Mouse cursor determines shot direction
- **Fire Rate**: 150ms cooldown between shots
- **Bullet Speed**: 8 pixels per frame (fast enough to feel responsive)
- **Ammunition**: Unlimited (removes resource management complexity)

#### Health System
- **Starting Health**: 100 HP
- **Damage Taken**: 15 HP per enemy bullet hit
- **Health Regeneration**: None (encourages health pack collection)
- **Death**: Triggers game over state

### Enemy AI Design

#### Intentional Flaws

**Poor Targeting**
- Target position updated every 2 seconds (instead of every frame)
- Random inaccuracy added to target coordinates (±100 pixel spread)
- Shooting angle calculated from actual player position but with large error margin

**Slow Reactions**
- 2-4 second delays between detecting player and shooting
- Inconsistent shoot timing (randomized cooldowns)
- Slow bullet speed (3 pixels per frame vs player's 8)

**Movement Issues**
- Uses outdated target positions for pathfinding
- 30% chance every 3 seconds to move randomly instead of toward target
- No collision avoidance with other enemies
- Sometimes overshoots target and has to correct

**Combat Deficiencies**
- Very wide shooting spread (±0.75 radians inaccuracy)
- Long reload times between shots
- Poor positioning relative to player and cover

#### Enemy Scaling
- **Wave 1**: 5 enemies with base stats
- **Each Wave**: +2-3 additional enemies (max 10)
- **Health Scaling**: +10 HP per wave
- **No Improvement**: AI remains consistently terrible regardless of wave

### Environmental Design

#### Arena Layout
- **Size**: 1000x700 pixel rectangular area
- **Style**: Open desert arena with sand texture
- **Color Palette**: Warm browns, tans, and sandy yellows
- **Obstacles**: None (keeps gameplay simple and movement clear)

#### Visual Effects
- **Sand Particles**: Subtle drifting particles for atmosphere
- **Bullet Trails**: Brief visual traces for shot feedback
- **Explosion Effects**: Particle bursts on enemy death
- **Health Indicators**: Bars above all characters

### Progression System

#### Score Mechanics
- **Enemy Kill**: 100 points base
- **Wave Completion**: Bonus based on wave number
- **Survival Time**: Small ongoing point trickle

#### Wave Progression
- Automatic progression when all enemies eliminated
- Brief celebration screen between waves
- Option to continue or return to menu

#### No Permanent Upgrades
- Each game starts fresh (maintains balance)
- Progress measured only in score and waves survived

## Technical Specifications

### Performance Targets
- **Frame Rate**: 60 FPS on mid-range devices
- **Load Time**: <2 seconds for game start
- **Memory Usage**: <50MB total
- **Browser Support**: All modern browsers

### Canvas Rendering
- **Resolution**: 1000x700 pixels
- **Rendering**: 2D context with basic shapes and colors
- **Optimization**: Object pooling for bullets and particles

### Input Handling
- **Keyboard**: Standard event listeners for movement
- **Mouse**: Real-time position tracking for aiming
- **Response Time**: <16ms input to visual feedback

## Audio Design

### Sound Effects (Planned)
- **Player Shooting**: Sharp, satisfying pop
- **Enemy Shooting**: Weaker, less impressive sound
- **Hit Feedback**: Clear impact sounds
- **Enemy Death**: Satisfying elimination sound
- **Health Pickup**: Positive collection chime

### Audio Implementation
- Web Audio API for low latency
- Compressed audio files for fast loading
- Optional mute functionality

## User Interface

### Title Screen
- **Large Title**: "DUNE" with desert styling
- **Instructions**: Clear control explanation
- **Start Button**: Prominent call-to-action

### HUD Elements
- **Health Bar**: Visual representation with numerical backup
- **Score Display**: Running total
- **Enemy Counter**: Remaining bots in wave
- **Ammo Indicator**: Shows unlimited status

### Menu Flow
- Title → Game → (Death/Victory) → Results → (Restart/Menu)
- Quick restart option for replay value
- Clear navigation between states

## Balancing Philosophy

### Player Empowerment
The game should make players feel skilled and powerful through:
- Responsive controls that work as expected
- Enemies that are beatable through basic skill
- Clear visual feedback for successful actions

### Engaging Challenge
Despite terrible AI, maintain engagement through:
- Multiple enemies creating crossfire situations
- Health management through damage and pickups
- Wave progression providing sense of advancement

### Comedic Timing
Enemy failures should be:
- Obvious enough to be funny
- Varied enough to avoid repetition
- Consistent with their "incompetent" character

## Accessibility Considerations

### Visual
- High contrast between player, enemies, and background
- Clear size differences between game elements
- Colorblind-friendly palette choices

### Motor
- No precision timing requirements
- Simple control scheme
- Forgiving hit detection

### Cognitive
- Clear game state communication
- Obvious cause-and-effect relationships
- Minimal UI complexity

## Success Metrics

### Player Engagement
- **Session Length**: Target 5-10 minutes average
- **Retry Rate**: Players starting new game after death
- **Wave Progression**: Average waves survived per session

### Fun Factor
- Observable player reactions to AI failures
- Desire to show game to others
- Repeated play sessions

### Technical Performance
- Consistent frame rate across target browsers
- No memory leaks during extended play
- Quick load times for immediate gratification

---

This design creates an accessible, entertaining shooter that derives its charm from deliberately flawed AI opponents while maintaining engaging gameplay through simple, responsive mechanics.