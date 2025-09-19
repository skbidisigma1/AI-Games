# BounceBlox Game Design Document

## 🎯 Core Concept

BounceBlox is a cheerful platforming game focused on experimentation and precise movement. The player controls a cube character through single-screen levels using minimal controls, with the twist being color-coded blocks that react differently to interaction.

## 🎮 Game Mechanics

### Player Character
- **Appearance**: Cheerful cube with simple facial features (eyes and smile)
- **Movement**: Left/right movement with momentum and friction
- **Physics**: Gravity-based jumping with satisfying "bounce" feel
- **Size**: 30x30 pixels for precise platforming

### Block Types & Color Coding

1. **Blue Blocks (Solid)**
   - Standard platforms
   - Reliable and predictable
   - Form the backbone of level structure

2. **Red Blocks (Crumble)**
   - Disappear after being stepped on (100ms delay)
   - Create urgency and timing challenges
   - Visual indicator: dashed border

3. **Green Blocks (Launch)**
   - Boost player velocity upward when landed on
   - Enable reaching higher platforms
   - Visual indicator: inner green rectangle

4. **Purple Blocks (Gravity)**
   - Reverse gravity for 5 seconds when touched
   - Add puzzle elements and new movement possibilities
   - Visual indicator: purple overlay effect on screen

### Level Design Principles

- **Single Screen**: All gameplay visible at once for strategic planning
- **Progressive Complexity**: Each level introduces or combines mechanics
- **Multiple Solutions**: Often multiple paths to collect all stars
- **Readable Layout**: Clear visual hierarchy and block placement

## 🎨 Visual Design

### Art Style
- **Cheerful & Colorful**: Bright, welcoming color palette
- **Minimalist**: Clean shapes and clear visual communication
- **Gradient Backgrounds**: Soft blue-to-purple gradient creates depth
- **Rounded Corners**: Friendly, approachable aesthetic

### Color Palette
- **Player**: `#ff6b6b` (warm red)
- **Solid Blocks**: `#4ecdc4` (turquoise)
- **Crumble Blocks**: `#ff6b6b` (red)
- **Launch Blocks**: `#96ceb4` (green)
- **Gravity Blocks**: `#b968c7` (purple)
- **Stars**: `#ffeb3b` (golden yellow)
- **Background**: Linear gradient from `#e3f2fd` to `#f3e5f5`

### UI Design
- **Fredoka One Font**: Playful, rounded font for titles
- **Nunito Font**: Clean, readable font for body text
- **Gradient Buttons**: Eye-catching call-to-action elements
- **HUD**: Minimal overlay showing level, stars, and objective

## 🔧 Technical Implementation

### Game Loop Architecture
```javascript
gameLoop() {
    update();    // Physics, input, collisions
    render();    // Draw all game elements
    requestAnimationFrame(gameLoop);
}
```

### Physics System
- **Gravity**: 0.5 pixels/frame² downward acceleration
- **Friction**: 0.85 multiplier for horizontal momentum
- **Jump Force**: -12 pixels/frame initial velocity
- **Move Speed**: 5 pixels/frame maximum horizontal velocity

### Collision Detection
- AABB (Axis-Aligned Bounding Box) collision detection
- Determines collision side for proper physics response
- Separate handling for different block types

### Particle System
- 8 particles generated per special block interaction
- 30-frame lifespan with alpha fade-out
- Random velocity vectors for natural dispersion

## 🎵 Audio Design (Placeholder)

Planned audio categories:
- **Jump Sound**: Light, bouncy effect
- **Collect Sound**: Cheerful chime for star collection
- **Bounce Sound**: Impact sound for special block interactions
- **Complete Sound**: Triumphant fanfare for level completion

## 📱 Responsive Design

### Desktop (800x600)
- Full canvas size with comfortable viewing
- Keyboard controls optimized for desktop play

### Mobile Considerations
- Touch controls could be added in future versions
- Current design maintains playability on tablets
- Responsive CSS ensures proper scaling

## 🎪 Level Progression

### Level 1: Introduction
- **Objective**: Learn basic mechanics
- **Blocks**: Solid, Crumble, Launch
- **Stars**: 3 stars in accessible locations
- **Challenge**: Basic platforming and timing

### Level 2: Gravity Puzzle
- **Objective**: Master gravity reversal
- **Blocks**: All types including Gravity blocks
- **Stars**: 4 stars requiring gravity mechanics
- **Challenge**: Spatial reasoning with reversed gravity

### Level 3: Master Challenge
- **Objective**: Combine all learned skills
- **Blocks**: Complex layout with all block types
- **Stars**: 5 stars in challenging positions
- **Challenge**: Precision platforming and puzzle solving

## 🚀 Future Enhancement Ideas

- **More Levels**: Additional challenges and mechanics
- **Speed Run Mode**: Timer and leaderboards
- **Level Editor**: Player-created content
- **New Block Types**: Ice blocks, moving platforms, etc.
- **Sound Effects**: Full audio implementation
- **Mobile Controls**: Touch-friendly interface
- **Multiplayer**: Co-op or competitive modes

## 🎨 Design Philosophy

BounceBlox follows these core principles:

1. **Accessibility**: Easy to learn, hard to master
2. **Experimentation**: Encourage trying different approaches
3. **Immediate Feedback**: Visual and audio responses to actions
4. **Bite-sized Fun**: Perfect for short gaming sessions
5. **Cheerful Tone**: Positive, uplifting gaming experience

The game aims to capture the joy of discovery and the satisfaction of precise platforming in a package that's welcoming to players of all skill levels.