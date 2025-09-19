/**
 * Entities.js - Entity management system for Ruleweaver
 * Handles creation, behavior, and lifecycle of all entities in the simulation
 */

class Entity {
    constructor(x, y, type, generation = 1) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.type = type; // 'herbivore', 'carnivore', 'resource', 'trader'
        this.generation = generation;
        
        // Genetics (can mutate) - Initialize first
        this.traits = {
            efficiency: 0.5 + Math.random() * 0.5, // Energy efficiency
            aggression: Math.random(), // Affects behavior
            sociability: Math.random(), // Affects trading/cooperation
            adaptability: Math.random(), // Affects mutation tolerance
            size: 0.8 + Math.random() * 0.4 // Affects collision and appearance
        };
        
        // Core properties
        this.energy = this.getInitialEnergy();
        this.maxEnergy = this.energy * 2;
        this.age = 0;
        this.maxAge = this.getMaxAge();
        this.reproductionThreshold = this.getReproductionThreshold();
        this.lastReproduction = 0;
        
        // Movement and behavior
        this.velocity = { x: 0, y: 0 };
        this.maxSpeed = this.getMaxSpeed();
        this.sightRange = this.getSightRange();
        
        // Visual properties
        this.color = this.getEntityColor();
        this.size = Math.max(3, Math.min(8, this.traits.size * 6));
        
        // State tracking
        this.target = null;
        this.mood = 'neutral'; // 'hungry', 'content', 'aggressive', 'fearful'
        this.isReproducing = false;
        this.isDead = false;
    }

    /**
     * Get initial energy based on entity type
     */
    getInitialEnergy() {
        const baseEnergy = {
            herbivore: 80,
            carnivore: 100,
            resource: 0, // Resources don't have energy
            trader: 120
        };
        return baseEnergy[this.type] || 50;
    }

    /**
     * Get maximum age based on entity type
     */
    getMaxAge() {
        const baseAge = {
            herbivore: 200,
            carnivore: 150,
            resource: 1000, // Resources last much longer
            trader: 300
        };
        return baseAge[this.type] * (0.8 + Math.random() * 0.4);
    }

    /**
     * Get reproduction threshold based on type and traits
     */
    getReproductionThreshold() {
        const baseThreshold = {
            herbivore: 60,
            carnivore: 80,
            resource: 0, // Resources don't reproduce normally
            trader: 100
        };
        return baseThreshold[this.type] * this.traits.efficiency;
    }

    /**
     * Get maximum movement speed based on type
     */
    getMaxSpeed() {
        const baseSpeed = {
            herbivore: 1.5,
            carnivore: 2.0,
            resource: 0, // Resources don't move
            trader: 1.8
        };
        return baseSpeed[this.type] * (0.8 + this.traits.efficiency * 0.4);
    }

    /**
     * Get sight range for finding targets
     */
    getSightRange() {
        const baseRange = {
            herbivore: 40,
            carnivore: 60,
            resource: 0,
            trader: 80
        };
        return baseRange[this.type];
    }

    /**
     * Get entity color based on type and traits
     */
    getEntityColor() {
        const baseColors = {
            herbivore: { r: 76, g: 175, b: 80 },   // Green
            carnivore: { r: 244, g: 67, b: 54 },   // Red
            resource: { r: 33, g: 150, b: 243 },   // Blue
            trader: { r: 255, g: 152, b: 0 }       // Orange
        };
        
        const base = baseColors[this.type] || { r: 128, g: 128, b: 128 };
        
        // Modify color based on traits
        const variation = 0.2;
        const r = Math.max(0, Math.min(255, base.r + (this.traits.aggression - 0.5) * variation * 255));
        const g = Math.max(0, Math.min(255, base.g + (this.traits.efficiency - 0.5) * variation * 255));
        const b = Math.max(0, Math.min(255, base.b + (this.traits.sociability - 0.5) * variation * 255));
        
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }

    /**
     * Update entity each simulation tick
     */
    update(world, rules) {
        if (this.isDead) return;

        this.age++;
        this.applyEnergyDecay(rules);
        this.updateMood();
        
        if (this.type !== 'resource') {
            this.findTarget(world);
            this.moveTowardTarget(world, rules);
            this.performActions(world, rules);
        }
        
        this.checkSurvival();
    }

    /**
     * Apply energy decay based on current rules
     */
    applyEnergyDecay(rules) {
        if (this.type === 'resource') return;
        
        const baseDecay = rules.energyDecay;
        const sizeModifier = this.traits.size; // Larger entities consume more energy
        const ageModifier = 1 + (this.age / this.maxAge) * 0.5; // Older entities less efficient
        
        this.energy -= baseDecay * sizeModifier * ageModifier * 100;
        this.energy = Math.max(0, this.energy);
    }

    /**
     * Update mood based on current state
     */
    updateMood() {
        const energyRatio = this.energy / this.maxEnergy;
        
        if (energyRatio < 0.3) {
            this.mood = 'hungry';
        } else if (energyRatio > 0.8) {
            this.mood = 'content';
        } else if (this.traits.aggression > 0.7 && this.type === 'carnivore') {
            this.mood = 'aggressive';
        } else {
            this.mood = 'neutral';
        }
    }

    /**
     * Find a target to move toward
     */
    findTarget(world) {
        const entities = world.entities;
        const inRange = entities.filter(entity => 
            entity !== this && 
            !entity.isDead && 
            this.distanceTo(entity) <= this.sightRange
        );

        if (inRange.length === 0) {
            this.target = null;
            return;
        }

        // Priority based on type and mood
        switch (this.type) {
            case 'herbivore':
                this.target = this.findNearestResource(inRange) || this.findMate(inRange);
                break;
            case 'carnivore':
                if (this.mood === 'hungry') {
                    this.target = this.findPrey(inRange);
                } else {
                    this.target = this.findMate(inRange);
                }
                break;
            case 'trader':
                this.target = this.findTradingPartner(inRange) || this.findMate(inRange);
                break;
        }
    }

    /**
     * Find nearest resource entity
     */
    findNearestResource(entities) {
        const resources = entities.filter(e => e.type === 'resource');
        if (resources.length === 0) return null;
        
        return resources.reduce((nearest, resource) => {
            const distToResource = this.distanceTo(resource);
            const distToNearest = nearest ? this.distanceTo(nearest) : Infinity;
            return distToResource < distToNearest ? resource : nearest;
        }, null);
    }

    /**
     * Find suitable prey for carnivores
     */
    findPrey(entities) {
        const prey = entities.filter(e => 
            (e.type === 'herbivore' || e.type === 'trader') && 
            e.traits.size <= this.traits.size * 1.2
        );
        
        return prey.reduce((nearest, entity) => {
            const distToEntity = this.distanceTo(entity);
            const distToNearest = nearest ? this.distanceTo(nearest) : Infinity;
            return distToEntity < distToNearest ? entity : nearest;
        }, null);
    }

    /**
     * Find potential mate of same type
     */
    findMate(entities) {
        if (this.energy < this.reproductionThreshold || 
            this.age - this.lastReproduction < 50) return null;
            
        const potentialMates = entities.filter(e => 
            e.type === this.type && 
            e.energy >= e.reproductionThreshold &&
            e.age - e.lastReproduction >= 50 &&
            !e.isReproducing
        );
        
        return potentialMates.reduce((nearest, entity) => {
            const distToEntity = this.distanceTo(entity);
            const distToNearest = nearest ? this.distanceTo(nearest) : Infinity;
            return distToEntity < distToNearest ? entity : nearest;
        }, null);
    }

    /**
     * Find trading partner for traders
     */
    findTradingPartner(entities) {
        const partners = entities.filter(e => 
            e.type !== 'resource' && 
            e.type !== this.type &&
            e.traits.sociability > 0.3
        );
        
        return partners.reduce((nearest, entity) => {
            const distToEntity = this.distanceTo(entity);
            const distToNearest = nearest ? this.distanceTo(nearest) : Infinity;
            return distToEntity < distToNearest ? entity : nearest;
        }, null);
    }

    /**
     * Move toward current target
     */
    moveTowardTarget(world, rules) {
        if (!this.target || this.maxSpeed === 0) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Normalize direction and apply speed
            const moveX = (dx / distance) * this.maxSpeed;
            const moveY = (dy / distance) * this.maxSpeed;
            
            // Apply gravity effect
            const gravityEffect = rules.gravity * 0.1;
            
            this.velocity.x = moveX;
            this.velocity.y = moveY + gravityEffect;
            
            // Update position with boundary checking
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            
            // Keep within world bounds
            this.x = Math.max(this.size, Math.min(world.width - this.size, this.x));
            this.y = Math.max(this.size, Math.min(world.height - this.size, this.y));
        }
    }

    /**
     * Perform actions when near target
     */
    performActions(world, rules) {
        if (!this.target) return;

        const distance = this.distanceTo(this.target);
        const interactionRange = this.size + this.target.size + 2;

        if (distance <= interactionRange) {
            switch (this.type) {
                case 'herbivore':
                    if (this.target.type === 'resource') {
                        this.consumeResource(this.target, world, rules);
                    } else if (this.target.type === 'herbivore') {
                        this.reproduce(this.target, world, rules);
                    }
                    break;
                case 'carnivore':
                    if (this.target.type === 'herbivore' || this.target.type === 'trader') {
                        this.hunt(this.target, world, rules);
                    } else if (this.target.type === 'carnivore') {
                        this.reproduce(this.target, world, rules);
                    }
                    break;
                case 'trader':
                    if (this.target.type !== 'resource' && this.target.type !== 'trader') {
                        this.trade(this.target, world, rules);
                    } else if (this.target.type === 'trader') {
                        this.reproduce(this.target, world, rules);
                    }
                    break;
            }
        }
    }

    /**
     * Consume a resource entity
     */
    consumeResource(resource, world, rules) {
        const energyGain = 30 * this.traits.efficiency * rules.resourceAbundance;
        this.energy = Math.min(this.maxEnergy, this.energy + energyGain);
        
        // Remove consumed resource
        const index = world.entities.indexOf(resource);
        if (index > -1) {
            world.entities.splice(index, 1);
            if (window.game) {
                window.game.logEvent(`${this.type} consumed resource, gained ${energyGain.toFixed(1)} energy`);
            }
        }
    }

    /**
     * Hunt another entity (carnivores)
     */
    hunt(prey, world, rules) {
        const huntSuccess = this.traits.aggression * this.traits.size > prey.traits.size * prey.traits.adaptability;
        
        if (huntSuccess) {
            const energyGain = prey.energy * 0.6 * this.traits.efficiency;
            this.energy = Math.min(this.maxEnergy, this.energy + energyGain);
            
            prey.isDead = true;
            if (window.game) {
                window.game.logEvent(`${this.type} hunted ${prey.type}, gained ${energyGain.toFixed(1)} energy`, 'important');
            }
        } else {
            // Failed hunt, both entities lose energy
            this.energy -= 10;
            prey.energy -= 5;
            if (window.game) {
                window.game.logEvent(`${this.type} failed to hunt ${prey.type}`);
            }
        }
    }

    /**
     * Trade with another entity
     */
    trade(partner, world, rules) {
        if (partner.traits.sociability < 0.3) return;
        
        const tradeValue = 15 * rules.tradeEfficiency;
        const energyTransfer = Math.min(tradeValue, this.energy * 0.1);
        
        if (energyTransfer > 5) {
            this.energy -= energyTransfer;
            partner.energy = Math.min(partner.maxEnergy, partner.energy + energyTransfer * 1.2);
            
            if (window.game) {
                window.game.logEvent(`${this.type} traded with ${partner.type}, transferred ${energyTransfer.toFixed(1)} energy`);
            }
        }
    }

    /**
     * Reproduce with another entity of same type
     */
    reproduce(mate, world, rules) {
        if (mate.isReproducing || this.isReproducing) return;
        
        const reproductionCost = rules.reproductionCost;
        
        if (this.energy >= reproductionCost && mate.energy >= reproductionCost) {
            // Create offspring
            const offspring = this.createOffspring(mate, world, rules);
            world.entities.push(offspring);
            
            // Pay reproduction cost
            this.energy -= reproductionCost;
            mate.energy -= reproductionCost;
            
            // Update reproduction timers
            this.lastReproduction = this.age;
            mate.lastReproduction = mate.age;
            this.isReproducing = true;
            mate.isReproducing = true;
            
            // Reset reproduction flag after cooldown
            setTimeout(() => {
                this.isReproducing = false;
                mate.isReproducing = false;
            }, 100);
            
            if (window.game) {
                window.game.logEvent(`${this.type} reproduced, offspring created (gen ${offspring.generation})`, 'success');
            }
        }
    }

    /**
     * Create offspring from two parents
     */
    createOffspring(mate, world, rules) {
        // Position near parents
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;
        const childX = Math.max(10, Math.min(world.width - 10, (this.x + mate.x) / 2 + offsetX));
        const childY = Math.max(10, Math.min(world.height - 10, (this.y + mate.y) / 2 + offsetY));
        
        const offspring = new Entity(childX, childY, this.type, Math.max(this.generation, mate.generation) + 1);
        
        // Inherit and mutate traits
        for (const trait in this.traits) {
            const parentValue = (this.traits[trait] + mate.traits[trait]) / 2;
            const mutationAmount = (Math.random() - 0.5) * rules.mutationChance * 2;
            offspring.traits[trait] = Math.max(0, Math.min(1, parentValue + mutationAmount));
        }
        
        // Update visual properties
        offspring.color = offspring.getEntityColor();
        offspring.size = Math.max(3, Math.min(8, offspring.traits.size * 6));
        
        return offspring;
    }

    /**
     * Check if entity should die
     */
    checkSurvival() {
        if (this.energy <= 0 || this.age >= this.maxAge) {
            this.isDead = true;
        }
    }

    /**
     * Calculate distance to another entity
     */
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Render entity on canvas
     */
    render(ctx) {
        if (this.isDead) return;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        if (this.type === 'resource') {
            // Resources are squares
            ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        } else {
            // Living entities are circles
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add energy indicator
            const energyRatio = this.energy / this.maxEnergy;
            const barWidth = this.size * 2;
            const barHeight = 2;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 5, barWidth, barHeight);
            
            ctx.fillStyle = energyRatio > 0.5 ? '#4CAF50' : energyRatio > 0.25 ? '#FFC107' : '#F44336';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 5, barWidth * energyRatio, barHeight);
        }
    }
}

/**
 * EntityManager - Manages all entities in the simulation
 */
class EntityManager {
    constructor() {
        this.entities = [];
        this.nextResourceSpawn = 0;
    }

    /**
     * Initialize world with starting entities
     */
    initializeWorld(width, height) {
        this.entities = [];
        
        // Create initial population
        this.spawnInitialEntities(width, height);
    }

    /**
     * Spawn initial entities for the simulation
     */
    spawnInitialEntities(width, height) {
        // Spawn herbivores
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * (width - 20) + 10;
            const y = Math.random() * (height - 20) + 10;
            this.entities.push(new Entity(x, y, 'herbivore'));
        }
        
        // Spawn carnivores
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * (width - 20) + 10;
            const y = Math.random() * (height - 20) + 10;
            this.entities.push(new Entity(x, y, 'carnivore'));
        }
        
        // Spawn traders
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * (width - 20) + 10;
            const y = Math.random() * (height - 20) + 10;
            this.entities.push(new Entity(x, y, 'trader'));
        }
        
        // Spawn initial resources
        this.spawnResources(width, height, 20);
    }

    /**
     * Spawn resource entities
     */
    spawnResources(width, height, count) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * (width - 20) + 10;
            const y = Math.random() * (height - 20) + 10;
            this.entities.push(new Entity(x, y, 'resource'));
        }
    }

    /**
     * Update all entities
     */
    update(world, rules) {
        // Update all entities
        this.entities.forEach(entity => {
            entity.update(world, rules);
        });
        
        // Remove dead entities
        this.entities = this.entities.filter(entity => !entity.isDead);
        
        // Spawn new resources periodically
        this.nextResourceSpawn--;
        if (this.nextResourceSpawn <= 0) {
            const resourceCount = this.entities.filter(e => e.type === 'resource').length;
            if (resourceCount < 30) {
                this.spawnResources(world.width, world.height, Math.floor(5 * rules.resourceAbundance));
            }
            this.nextResourceSpawn = 30; // Spawn every 30 ticks
        }
    }

    /**
     * Render all entities
     */
    render(ctx) {
        this.entities.forEach(entity => {
            entity.render(ctx);
        });
    }

    /**
     * Get statistics about current entities
     */
    getStatistics() {
        const alive = this.entities.filter(e => !e.isDead && e.type !== 'resource');
        const totalEnergy = alive.reduce((sum, e) => sum + e.energy, 0);
        const averageAge = alive.length > 0 ? alive.reduce((sum, e) => sum + e.age, 0) / alive.length : 0;
        const maxGeneration = alive.length > 0 ? Math.max(...alive.map(e => e.generation)) : 0;
        
        return {
            population: alive.length,
            totalEnergy: Math.floor(totalEnergy),
            averageAge: Math.floor(averageAge),
            generations: maxGeneration,
            byType: {
                herbivore: this.entities.filter(e => e.type === 'herbivore' && !e.isDead).length,
                carnivore: this.entities.filter(e => e.type === 'carnivore' && !e.isDead).length,
                trader: this.entities.filter(e => e.type === 'trader' && !e.isDead).length,
                resource: this.entities.filter(e => e.type === 'resource').length
            }
        };
    }
}