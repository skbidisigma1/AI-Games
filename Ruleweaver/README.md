# Ruleweaver - Reality Simulation Sandbox

A browser-based strategy sandbox game where players control a simulated world by modifying its fundamental rules. Shape reality and watch emergent behaviors unfold as you experiment with the laws that govern life, physics, and society.

## 🎮 Game Concept

Players act as architects of reality, wielding the power to modify universal rules that govern a living ecosystem. Every adjustment creates ripple effects throughout the simulation, leading to emergent behaviors, evolutionary pressures, and unexpected consequences.

## 🌟 Features

### Core Gameplay
- **2D Grid-based World**: Visual simulation with colored entities representing different life forms
- **Real-time Rule Modification**: Adjust fundamental rules on-the-fly and see immediate effects
- **Emergent Complexity**: Simple rule changes create complex, unpredictable behaviors
- **Multiple Entity Types**: Herbivores (green), Carnivores (red), Traders (orange), Resources (blue)

### Universal Rules You Can Control
- **Physics**: Gravity, Energy Decay
- **Biology**: Reproduction Cost, Mutation Chance  
- **Economy**: Trade Efficiency, Resource Abundance
- **Environment**: Predator/Prey dynamics, Weather systems

### Objectives & Goals
- Sustain large populations (100+ entities)
- Accumulate massive energy pools (10,000+ total energy)
- Prevent extinction for extended periods (500+ ticks)
- Guide evolution through multiple generations
- Maintain ecosystem balance with all entity types

### Advanced Features
- **Event Logging**: Track major events like reproduction, hunting, trading, extinctions
- **Save/Load System**: Preserve your experiments using LocalStorage
- **Statistics Tracking**: Monitor population, energy, age, and generation metrics
- **Responsive Design**: Works on desktop and mobile browsers

## 🎯 How to Play

1. **Start the Simulation**: Click the "▶ Play" button to begin
2. **Observe**: Watch entities move, interact, consume resources, and reproduce
3. **Experiment**: Adjust rule sliders to see how changes affect the ecosystem
4. **React**: Prevent extinctions or create new challenges by modifying rules
5. **Achieve**: Complete objectives to master the art of reality manipulation

### Controls
- **Play/Pause**: Space bar or ▶/⏸ button
- **Reset**: 🔄 button (resets to initial state)
- **Save**: 💾 button or Ctrl+S
- **Load**: 📁 button or Ctrl+L
- **Canvas Interaction**: Click entities for info, click empty space to spawn resources

## 🔬 Entity Types & Behaviors

### Herbivores (Green Circles)
- Consume blue resources for energy
- Reproduce when energy is sufficient
- Form the base of the food chain
- Affected by resource abundance and reproduction costs

### Carnivores (Red Circles)
- Hunt other entities when predation is enabled
- More aggressive and faster than herbivores
- Require more energy to survive and reproduce
- Success depends on aggression and size traits

### Traders (Orange Circles)
- Exchange energy with other entities
- Benefit from high trade efficiency settings
- Act as energy distributors in the ecosystem
- Social behavior affects trading success

### Resources (Blue Squares)
- Static energy sources that entities consume
- Spawn rate affected by resource abundance rule
- Essential for ecosystem sustainability
- Finite and must be managed carefully

## 🧬 Emergent Behaviors

The magic of Ruleweaver lies in its emergent complexity. Small rule changes can create:

- **Population Explosions**: Reducing reproduction costs leads to rapid growth
- **Extinction Events**: Enabling predators or reducing resources can cause collapse
- **Evolutionary Pressure**: High mutation rates create diverse populations
- **Economic Booms**: Efficient trading systems redistribute energy effectively
- **Ecosystem Collapse**: Unbalanced rules can destroy entire populations

## 💾 Technical Details

### File Structure
```
Ruleweaver/
├── index.html      # Main game interface
├── style.css       # Minimalist functional styling
├── game.js         # Core simulation engine and UI management
├── entities.js     # Entity behaviors and lifecycle management
├── rules.js        # Rule system and modification engine
├── objectives.js   # Goal tracking and achievement system
└── assets/         # Optional folder for future assets
```

### Browser Compatibility
- Modern browsers with Canvas and LocalStorage support
- Chrome, Firefox, Safari, Edge (recent versions)
- Mobile browsers supported

### Performance
- Optimized for 100+ entities with 60 FPS rendering
- 1-second simulation ticks for strategic pacing
- Efficient collision detection and behavior systems

## 🚀 Getting Started

1. Open `index.html` in any modern web browser
2. No installation or setup required
3. Start experimenting with the rules immediately
4. Save interesting configurations for later exploration

## 🎨 Design Philosophy

Ruleweaver embodies several key design principles:

- **Emergent Gameplay**: Complex behaviors emerge from simple rule interactions
- **Player Agency**: Every aspect of the world can be controlled and modified
- **Immediate Feedback**: Changes take effect instantly with clear visual results
- **Replayability**: Infinite combinations of rules create unique experiences
- **Accessibility**: Simple controls with deep strategic complexity

## 🔮 Future Enhancements

The modular codebase supports easy expansion:

- Additional entity types (plants, diseases, structures)
- Environmental hazards and seasonal changes
- Genetic algorithm visualization
- Advanced AI behaviors and learning
- Multiplayer rule manipulation
- Data export for scientific analysis

## 🏆 Mastery Tips

- Start with small rule adjustments to understand their effects
- Balance is key - extreme settings often lead to extinction
- Use the event log to understand what's happening
- Save successful configurations before experimenting further
- Try to achieve all objectives for the ultimate challenge

---

**Ruleweaver** - Where every player becomes a god of their own digital universe. Shape reality, guide evolution, and discover the delicate balance that sustains life itself.

*Ready for indie release with minimal polish needed.*