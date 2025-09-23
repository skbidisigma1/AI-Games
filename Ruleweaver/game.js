/**
 * Game.js - Main game engine for Ruleweaver
 * Manages the simulation loop, UI interactions, and coordinate all systems
 */

class RuleweaverGame {
    constructor() {
        // Core game state
        this.isRunning = false;
        this.isPaused = true;
        this.currentTick = 0;
        this.lastUpdateTime = 0;
        this.tickInterval = 1000; // 1 second per tick
        
        // Canvas and rendering
        this.canvas = document.getElementById('worldCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.world = {
            width: this.canvas.width,
            height: this.canvas.height,
            entities: []
        };
        
        // Game systems
        this.entityManager = new EntityManager();
        this.rulesEngine = new RulesEngine();
        this.objectiveManager = new ObjectiveManager();
        
        // Event log
        this.eventLog = [];
        this.maxLogEntries = 100;
        
        // Save/load state
        this.saveSlots = 3;
        this.currentSaveSlot = 1;
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.currentFPS = 0;
        
        this.initialize();
    }

    /**
     * Initialize the game
     */
    initialize() {
        this.setupEventListeners();
        this.initializeWorld();
        this.startGameLoop();
        this.updateUI();
        
        this.logEvent('Ruleweaver initialized. Welcome to reality simulation!', 'success');
        console.log('Ruleweaver game initialized');
    }

    /**
     * Setup all event listeners for UI interactions
     */
    setupEventListeners() {
        // Simulation controls
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetSimulation();
        });
        
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveGame();
        });
        
        document.getElementById('loadBtn').addEventListener('click', () => {
            this.loadGame();
        });

        // Canvas interaction
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            this.autoSave();
        });

        // Auto-save every 30 seconds
        setInterval(() => {
            if (this.isRunning) {
                this.autoSave();
            }
        }, 30000);
    }

    /**
     * Initialize the simulation world
     */
    initializeWorld() {
        this.world.entities = [];
        this.entityManager.initializeWorld(this.world.width, this.world.height);
        this.world.entities = this.entityManager.entities;
        
        this.currentTick = 0;
        this.eventLog = [];
        
        // Reset objectives
        this.objectiveManager.reset();
        
        this.logEvent('World initialized with starting population');
    }

    /**
     * Main game loop
     */
    startGameLoop() {
        const gameLoop = (currentTime) => {
            // Initialize lastUpdateTime if it's 0
            if (this.lastUpdateTime === 0) {
                this.lastUpdateTime = currentTime;
            }
            
            // Calculate delta time
            const deltaTime = currentTime - this.lastUpdateTime;
            
            // Update FPS counter
            this.updateFPS(currentTime);
            
            // Update simulation if not paused and enough time has passed
            if (!this.isPaused && deltaTime >= this.tickInterval) {
                this.updateSimulation();
                this.lastUpdateTime = currentTime;
            }
            
            // Always render
            this.render();
            
            // Continue loop
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }

    /**
     * Update the simulation by one tick
     */
    updateSimulation() {
        this.currentTick++;
        
        // Update rules engine (apply weather, population pressure, etc.)
        this.rulesEngine.updateDerivedRules();
        if (this.rulesEngine.rules.enableWeather) {
            this.rulesEngine.applyWeatherEffects(this.world);
        }
        
        // Update entities
        this.entityManager.update(this.world, this.rulesEngine.getCurrentRules());
        
        // Apply rule modifications to entities
        this.world.entities.forEach(entity => {
            this.rulesEngine.applyRuleModifications(entity, this.world);
        });
        
        // Update objectives
        const stats = this.entityManager.getStatistics();
        this.objectiveManager.update(this.world, stats, this.currentTick);
        
        // Check for extinction
        if (stats.population === 0) {
            this.handleExtinction();
        }
        
        // Log significant events periodically
        if (this.currentTick % 100 === 0) {
            this.logPeriodicStats(stats);
        }
        
        // Update UI
        this.updateUI();
    }

    /**
     * Handle extinction event
     */
    handleExtinction() {
        this.logEvent('EXTINCTION EVENT: All entities have perished!', 'critical');
        
        // Pause simulation
        this.isPaused = true;
        this.updatePlayPauseButton();
        
        // Show extinction message
        setTimeout(() => {
            const restart = confirm('Extinction event occurred! All entities have died. Would you like to restart with new entities?');
            if (restart) {
                this.respawnEntities();
            }
        }, 1000);
    }

    /**
     * Respawn entities after extinction
     */
    respawnEntities() {
        // Clear dead entities
        this.world.entities = this.world.entities.filter(e => e.type === 'resource');
        
        // Add new starting population
        this.entityManager.spawnInitialEntities(this.world.width, this.world.height);
        this.world.entities = this.entityManager.entities;
        
        this.logEvent('Emergency respawn: New entities introduced to prevent total collapse', 'important');
        
        // Resume simulation
        this.isPaused = false;
        this.updatePlayPauseButton();
    }

    /**
     * Render the simulation
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.world.width, this.world.height);
        
        // Draw grid
        this.drawGrid();
        
        // Render entities
        this.entityManager.render(this.ctx);
        
        // Draw UI overlays
        this.drawOverlays();
    }

    /**
     * Draw background grid
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(64, 64, 64, 0.3)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        
        // Vertical lines
        for (let x = 0; x <= this.world.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.world.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.world.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.world.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw overlay information
     */
    drawOverlays() {
        // Draw simulation status
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 60);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Courier New';
        this.ctx.fillText(`Tick: ${this.currentTick}`, 20, 30);
        this.ctx.fillText(`FPS: ${this.currentFPS}`, 20, 45);
        this.ctx.fillText(`Status: ${this.isPaused ? 'PAUSED' : 'RUNNING'}`, 20, 60);
        
        // Draw entity count overlay
        const stats = this.entityManager.getStatistics();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.world.width - 150, 10, 140, 80);
        
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillText(`Herbivores: ${stats.byType.herbivore}`, this.world.width - 140, 30);
        this.ctx.fillStyle = '#F44336';
        this.ctx.fillText(`Carnivores: ${stats.byType.carnivore}`, this.world.width - 140, 45);
        this.ctx.fillStyle = '#FF9800';
        this.ctx.fillText(`Traders: ${stats.byType.trader}`, this.world.width - 140, 60);
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillText(`Resources: ${stats.byType.resource}`, this.world.width - 140, 75);
    }

    /**
     * Update UI elements
     */
    updateUI() {
        // Update tick counter
        document.getElementById('tickCounter').textContent = `Tick: ${this.currentTick}`;
        
        // Update statistics
        const stats = this.entityManager.getStatistics();
        document.getElementById('populationStat').textContent = stats.population;
        document.getElementById('totalEnergyStat').textContent = stats.totalEnergy;
        document.getElementById('averageAgeStat').textContent = stats.averageAge;
        document.getElementById('generationsStat').textContent = stats.generations;
    }

    /**
     * Update FPS counter
     */
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.currentFPS = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
    }

    /**
     * Toggle play/pause state
     */
    togglePlayPause() {
        this.isPaused = !this.isPaused;
        this.updatePlayPauseButton();
        
        if (this.isPaused) {
            this.logEvent('Simulation paused');
        } else {
            this.logEvent('Simulation resumed');
        }
    }

    /**
     * Update play/pause button text
     */
    updatePlayPauseButton() {
        const btn = document.getElementById('playPauseBtn');
        btn.textContent = this.isPaused ? '▶ Play' : '⏸ Pause';
    }

    /**
     * Reset the simulation
     */
    resetSimulation() {
        const confirm = window.confirm('Are you sure you want to reset the simulation? All progress will be lost.');
        if (!confirm) return;
        
        this.isPaused = true;
        this.updatePlayPauseButton();
        
        this.initializeWorld();
        this.rulesEngine.resetToDefaults();
        
        this.logEvent('Simulation reset to initial state', 'important');
    }

    /**
     * Handle canvas click events
     */
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Find clicked entity
        const clickedEntity = this.world.entities.find(entity => {
            const dx = x - entity.x;
            const dy = y - entity.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= entity.size + 5;
        });
        
        if (clickedEntity) {
            this.showEntityInfo(clickedEntity, x, y);
        } else {
            // Spawn new resource at click location
            this.spawnResourceAtLocation(x, y);
        }
    }

    /**
     * Show information about an entity
     */
    showEntityInfo(entity, x, y) {
        const info = `
Type: ${entity.type}
Generation: ${entity.generation}
Age: ${entity.age}/${entity.maxAge}
Energy: ${Math.floor(entity.energy)}/${Math.floor(entity.maxEnergy)}
Efficiency: ${entity.traits.efficiency.toFixed(2)}
Aggression: ${entity.traits.aggression.toFixed(2)}
Size: ${entity.traits.size.toFixed(2)}`;
        
        this.logEvent(`Entity inspected: ${entity.type} (Gen ${entity.generation})`);
        console.log('Entity Info:', info);
        
        // You could implement a popup tooltip here
    }

    /**
     * Spawn a resource at the clicked location
     */
    spawnResourceAtLocation(x, y) {
        if (x < 10 || x > this.world.width - 10 || y < 10 || y > this.world.height - 10) {
            return; // Don't spawn too close to edges
        }
        
        const resource = new Entity(x, y, 'resource');
        this.world.entities.push(resource);
        this.entityManager.entities = this.world.entities;
        
        this.logEvent(`Resource spawned at (${Math.floor(x)}, ${Math.floor(y)})`);
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(event) {
        switch (event.key.toLowerCase()) {
            case ' ':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'r':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.resetSimulation();
                }
                break;
            case 's':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.saveGame();
                }
                break;
            case 'l':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.loadGame();
                }
                break;
        }
    }

    /**
     * Log periodic statistics
     */
    logPeriodicStats(stats) {
        if (this.currentTick % 500 === 0) {
            this.logEvent(
                `Population: ${stats.population}, Energy: ${stats.totalEnergy}, Generation: ${stats.generations}`,
                'important'
            );
        }
    }

    /**
     * Add an entry to the event log
     */
    logEvent(message, type = 'normal') {
        const logEntry = {
            tick: this.currentTick,
            message: message,
            type: type,
            timestamp: Date.now()
        };
        
        this.eventLog.unshift(logEntry);
        
        // Limit log size
        if (this.eventLog.length > this.maxLogEntries) {
            this.eventLog = this.eventLog.slice(0, this.maxLogEntries);
        }
        
        // Update UI
        this.updateEventLogUI(logEntry);
    }

    /**
     * Update the event log UI
     */
    updateEventLogUI(newEntry) {
        const logContainer = document.getElementById('logEntries');
        if (!logContainer) return;
        
        // Create new log entry element
        const entryDiv = document.createElement('div');
        entryDiv.className = `log-entry ${newEntry.type}`;
        entryDiv.textContent = `[${newEntry.tick}] ${newEntry.message}`;
        
        // Insert at top
        logContainer.insertBefore(entryDiv, logContainer.firstChild);
        
        // Remove excess entries
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.lastChild);
        }
        
        // Auto-scroll to show new entry
        logContainer.scrollTop = 0;
    }

    /**
     * Save the game state
     */
    saveGame(slot = this.currentSaveSlot) {
        try {
            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                tick: this.currentTick,
                world: {
                    width: this.world.width,
                    height: this.world.height,
                    entities: this.world.entities.map(entity => ({
                        id: entity.id,
                        x: entity.x,
                        y: entity.y,
                        type: entity.type,
                        generation: entity.generation,
                        energy: entity.energy,
                        age: entity.age,
                        traits: entity.traits,
                        lastReproduction: entity.lastReproduction
                    }))
                },
                rules: this.rulesEngine.exportRules(),
                objectives: this.objectiveManager.exportObjectives(),
                eventLog: this.eventLog.slice(0, 20) // Save recent events
            };
            
            localStorage.setItem(`ruleweaver_save_${slot}`, JSON.stringify(saveData));
            
            this.logEvent(`Game saved to slot ${slot}`, 'success');
            console.log('Game saved successfully');
            
        } catch (error) {
            this.logEvent('Failed to save game: ' + error.message, 'critical');
            console.error('Save error:', error);
        }
    }

    /**
     * Load the game state
     */
    loadGame(slot = this.currentSaveSlot) {
        try {
            const saveDataString = localStorage.getItem(`ruleweaver_save_${slot}`);
            if (!saveDataString) {
                this.logEvent(`No save data found in slot ${slot}`, 'important');
                return false;
            }
            
            const saveData = JSON.parse(saveDataString);
            
            // Pause simulation during loading
            this.isPaused = true;
            this.updatePlayPauseButton();
            
            // Restore world state
            this.currentTick = saveData.tick || 0;
            this.world.width = saveData.world.width;
            this.world.height = saveData.world.height;
            
            // Restore entities
            this.world.entities = [];
            this.entityManager.entities = [];
            
            if (saveData.world.entities) {
                saveData.world.entities.forEach(entityData => {
                    const entity = new Entity(entityData.x, entityData.y, entityData.type, entityData.generation);
                    entity.id = entityData.id;
                    entity.energy = entityData.energy;
                    entity.age = entityData.age;
                    entity.traits = entityData.traits;
                    entity.lastReproduction = entityData.lastReproduction || 0;
                    entity.color = entity.getEntityColor();
                    entity.size = Math.max(3, Math.min(8, entity.traits.size * 6));
                    
                    this.world.entities.push(entity);
                    this.entityManager.entities.push(entity);
                });
            }
            
            // Restore rules
            if (saveData.rules) {
                this.rulesEngine.importRules(saveData.rules);
            }
            
            // Restore objectives
            if (saveData.objectives) {
                this.objectiveManager.importObjectives(saveData.objectives);
            }
            
            // Restore recent event log
            if (saveData.eventLog) {
                this.eventLog = saveData.eventLog;
                this.updateEventLogDisplay();
            }
            
            this.updateUI();
            this.logEvent(`Game loaded from slot ${slot}`, 'success');
            console.log('Game loaded successfully');
            
            return true;
            
        } catch (error) {
            this.logEvent('Failed to load game: ' + error.message, 'critical');
            console.error('Load error:', error);
            return false;
        }
    }

    /**
     * Auto-save the game
     */
    autoSave() {
        this.saveGame(0); // Use slot 0 for auto-save
    }

    /**
     * Update the event log display
     */
    updateEventLogDisplay() {
        const logContainer = document.getElementById('logEntries');
        if (!logContainer) return;
        
        logContainer.innerHTML = '';
        
        this.eventLog.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = `log-entry ${entry.type}`;
            entryDiv.textContent = `[${entry.tick}] ${entry.message}`;
            logContainer.appendChild(entryDiv);
        });
    }

    /**
     * Get game statistics for analysis
     */
    getGameStats() {
        const entityStats = this.entityManager.getStatistics();
        const objectiveStats = this.objectiveManager.getCompletionStats();
        const rules = this.rulesEngine.getCurrentRules();
        
        return {
            simulation: {
                tick: this.currentTick,
                isRunning: !this.isPaused,
                uptime: this.currentTick * this.tickInterval / 1000 // seconds
            },
            entities: entityStats,
            objectives: objectiveStats,
            rules: rules,
            performance: {
                fps: this.currentFPS,
                eventLogSize: this.eventLog.length
            }
        };
    }
}

// Global game instance
let game;

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        game = new RuleweaverGame();
        window.game = game; // Make available globally for debugging
        console.log('Ruleweaver initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Ruleweaver:', error);
        document.body.innerHTML = '<h1>Failed to load Ruleweaver</h1><p>Check console for details.</p>';
    }
});

// Export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RuleweaverGame;
}