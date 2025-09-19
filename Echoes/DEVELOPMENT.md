# Development Guide - Echoes of the Forgotten Code

## Project Structure

```
Echoes/
├── index.html          # Main game page
├── game.js            # Core game logic and mechanics
├── styles.css         # Visual styling and animations
├── README.md          # Player documentation
├── DESIGN.md          # Game design document
├── DEVELOPMENT.md     # This development guide
├── audio/             # Audio assets (currently placeholder)
│   └── README.md      # Audio asset documentation
└── assets/            # Visual assets (currently placeholder)
    └── README.md      # Visual asset documentation
```

## Core Game Class: EchoesGame

### Key Properties
- `gameState`: Current state ('title', 'playing', 'paused')
- `player`: Player object with position, speed, and visual properties
- `world`: Contains data nodes, corrupted areas, and background grid
- `memoryFragments`: Player's collected memory count
- `codeIntegrity`: Current integrity level (0-100)
- `particles`: Array of visual effect particles

### Main Methods
- `init()`: Initialize game systems and event listeners
- `gameLoop()`: Main update/render loop
- `update()`: Update game state, player, particles
- `render()`: Draw all game elements to canvas

## Adding New Features

### Creating New Data Node Types

1. Add new type to `createWorld()` method:
```javascript
{ x: 400, y: 250, type: 'newtype', active: true, collected: false }
```

2. Add color mapping in `renderWorld()`:
```javascript
const colors = {
    memory: '#00aaff',
    code: '#ffaa00',
    logic: '#aa00ff',
    choice: '#ff00aa',
    newtype: '#00ffaa'  // Add new color
};
```

3. Handle interaction in `activateNode()`:
```javascript
case 'newtype':
    this.openNewTypeInterface();
    break;
```

### Creating New Puzzle Types

1. Create interface HTML in `index.html`:
```html
<div id="newPuzzleInterface" class="interface hidden">
    <div class="interface-header">
        <h3>NEW PUZZLE TYPE</h3>
        <button class="close-btn" onclick="closeInterface('newPuzzleInterface')">&times;</button>
    </div>
    <div id="puzzleContent"></div>
    <button id="solvePuzzle" class="cyber-button">SOLVE</button>
</div>
```

2. Add puzzle generation method:
```javascript
generateNewPuzzle() {
    const content = document.getElementById('puzzleContent');
    // Create puzzle elements
}
```

3. Add solve logic:
```javascript
solveNewPuzzle() {
    // Validation logic
    // Reward logic
    // Update game state
}
```

### Adding Visual Effects

1. Create particle types:
```javascript
addNewEffect() {
    this.particles.push({
        x: x,
        y: y,
        vx: velocityX,
        vy: velocityY,
        life: 1.0,
        opacity: 1.0,
        color: '#color',
        type: 'newtype'
    });
}
```

2. Handle rendering in `renderParticles()`:
```javascript
this.particles.forEach(particle => {
    if (particle.type === 'newtype') {
        // Custom rendering logic
    }
});
```

### Modifying Player Behavior

Player properties can be modified through:
- `this.player.speed`: Movement speed
- `this.player.color`: Visual appearance
- `this.player.glitchIntensity`: Corruption effect intensity

Example:
```javascript
// Speed boost from code interpretation
if (codeText.includes('velocity')) {
    this.player.speed += 1;
}

// Color change from moral choices
if (this.moralChoices.includes('dominion')) {
    this.player.color = '#ff8800';
}
```

## Extending Story Content

### Adding New Moral Choices

1. Add choice data to `generateMoralChoice()`:
```javascript
const choices = [
    // existing choices...
    {
        text: "New moral dilemma description...",
        options: [
            { text: "Option 1", effect: "effect1" },
            { text: "Option 2", effect: "effect2" },
            { text: "Option 3", effect: "effect3" }
        ]
    }
];
```

2. Handle effects in `makeChoice()`:
```javascript
switch (effect) {
    // existing cases...
    case 'effect1':
        // Modify game state
        this.showFeedback("Consequence message");
        break;
}
```

### Adding Code Fragments

Extend the `codeSnippets` array in `generateCodeFragment()`:
```javascript
const codeSnippets = [
    // existing snippets...
    `// New code fragment
function newConcept() {
    // Philosophical or technical concept
    return implementation();
}`
];
```

Add interpretation logic in `interpretCode()`:
```javascript
if (codeText.includes('newkeyword')) {
    // Game world modification
    this.showFeedback("New keyword effect message");
}
```

## Styling and Visual Customization

### CSS Custom Properties
Key CSS variables for easy customization:
- Colors: `#00ff88` (primary), `#ff0088` (danger), `#0088ff` (info)
- Fonts: 'Share Tech Mono', 'Orbitron'
- Effects: `glitch`, `corrupt`, `fadeInGlitch` animations

### Adding New Animations

1. Define CSS keyframes:
```css
@keyframes newEffect {
    0% { /* start state */ }
    50% { /* middle state */ }
    100% { /* end state */ }
}
```

2. Apply to elements:
```css
.new-element {
    animation: newEffect 2s infinite;
}
```

## Performance Considerations

### Canvas Optimization
- Use `requestAnimationFrame` for smooth animation
- Limit particle count for performance
- Use efficient collision detection algorithms

### Memory Management
- Clean up particles when they expire
- Remove event listeners when appropriate
- Limit array sizes for world objects

## Testing New Features

### Browser Testing
1. Open `index.html` in a web browser
2. Use browser developer tools for debugging
3. Test on different screen sizes

### Feature Testing Checklist
- [ ] Does the new feature integrate with existing UI?
- [ ] Are there any console errors?
- [ ] Does it work on mobile devices?
- [ ] Is the visual style consistent?
- [ ] Does it provide meaningful player feedback?

## Common Issues and Solutions

### Canvas Not Rendering
- Check if `gameCanvas` ID exists in HTML
- Verify canvas dimensions are set correctly
- Ensure game loop is running with `requestAnimationFrame`

### Interface Not Responding
- Check if event listeners are properly attached
- Verify element IDs match between HTML and JavaScript
- Ensure interfaces are not hidden by CSS

### Visual Effects Not Working
- Check particle array updates in game loop
- Verify rendering logic in `renderParticles()`
- Ensure particles have valid lifecycle properties

## Future Enhancement Ideas

### Technical Improvements
- Add WebGL support for advanced visual effects
- Implement procedural level generation
- Add local save/load system with encryption
- Create level editor for custom scenarios

### Gameplay Additions
- Multiplayer consciousness sharing
- Time-based challenges
- Resource management mechanics
- Achievement system

### Accessibility
- Screen reader support for UI elements
- Colorblind-friendly palette options
- Keyboard-only navigation mode
- Adjustable text size options

### Audio Integration
- Dynamic ambient sound generation
- Reactive audio based on player actions
- Voice narration for story elements
- Interactive sound design