/**
 * Objectives.js - Objective tracking and goal management for Ruleweaver
 * Monitors simulation progress and provides player goals
 */

class ObjectiveManager {
    constructor() {
        this.objectives = [];
        this.completedObjectives = [];
        this.objectiveHistory = [];
        this.currentScore = 0;
        
        this.initializeDefaultObjectives();
        this.setupUIListeners();
    }

    /**
     * Initialize the default set of objectives
     */
    initializeDefaultObjectives() {
        this.objectives = [
            {
                id: 'population_sustain',
                type: 'population',
                title: 'Sustain 100+ entities',
                description: 'Maintain a stable population of at least 100 living entities',
                target: 100,
                current: 0,
                condition: 'greater_equal',
                duration: 50, // Must maintain for 50 ticks
                durationCounter: 0,
                completed: false,
                points: 1000,
                category: 'survival'
            },
            {
                id: 'energy_accumulate',
                type: 'energy',
                title: 'Reach 10,000 total energy',
                description: 'Accumulate a total energy pool of 10,000 across all entities',
                target: 10000,
                current: 0,
                condition: 'greater_equal',
                completed: false,
                points: 1500,
                category: 'prosperity'
            },
            {
                id: 'survival_marathon',
                type: 'survival',
                title: 'Prevent extinction for 500 ticks',
                description: 'Keep at least one entity alive for 500 consecutive simulation ticks',
                target: 500,
                current: 0,
                condition: 'greater_equal',
                completed: false,
                points: 2000,
                category: 'endurance'
            },
            {
                id: 'evolution_diversity',
                type: 'evolution',
                title: 'Reach generation 10',
                description: 'Guide evolution to produce entities of the 10th generation',
                target: 10,
                current: 0,
                condition: 'greater_equal',
                completed: false,
                points: 1200,
                category: 'evolution'
            },
            {
                id: 'ecosystem_balance',
                type: 'balance',
                title: 'Maintain ecosystem balance',
                description: 'Keep all entity types alive simultaneously for 100 ticks',
                target: 100,
                current: 0,
                condition: 'special',
                completed: false,
                points: 2500,
                category: 'harmony'
            }
        ];
    }

    /**
     * Setup UI event listeners
     */
    setupUIListeners() {
        // Future: Add buttons for creating custom objectives
    }

    /**
     * Update all objectives with current world state
     */
    update(world, stats, tick) {
        let anyCompleted = false;

        this.objectives.forEach(objective => {
            if (objective.completed) return;

            const previousCurrent = objective.current;
            this.updateObjectiveProgress(objective, world, stats, tick);

            // Check for completion
            if (this.checkObjectiveCompletion(objective)) {
                this.completeObjective(objective, tick);
                anyCompleted = true;
            }

            // Update UI if value changed
            if (objective.current !== previousCurrent) {
                this.updateObjectiveUI(objective);
            }
        });

        // Generate new objectives if some were completed
        if (anyCompleted) {
            this.generateNewObjectives(world, stats, tick);
        }
    }

    /**
     * Update progress for a specific objective
     */
    updateObjectiveProgress(objective, world, stats, tick) {
        switch (objective.type) {
            case 'population':
                objective.current = stats.population;
                
                // Handle duration objectives
                if (objective.duration) {
                    if (objective.current >= objective.target) {
                        objective.durationCounter++;
                    } else {
                        objective.durationCounter = 0;
                    }
                }
                break;

            case 'energy':
                objective.current = stats.totalEnergy;
                break;

            case 'survival':
                if (stats.population > 0) {
                    objective.current++;
                } else {
                    objective.current = 0; // Reset if extinction occurs
                }
                break;

            case 'evolution':
                objective.current = stats.generations;
                break;

            case 'balance':
                // Special case: check if all entity types are present
                const hasHerbivore = stats.byType.herbivore > 0;
                const hasCarnivore = stats.byType.carnivore > 0;
                const hasTrader = stats.byType.trader > 0;
                const hasResource = stats.byType.resource > 0;

                if (hasHerbivore && hasCarnivore && hasTrader && hasResource) {
                    objective.current++;
                } else {
                    objective.current = 0;
                }
                break;
        }
    }

    /**
     * Check if an objective is completed
     */
    checkObjectiveCompletion(objective) {
        switch (objective.condition) {
            case 'greater_equal':
                if (objective.duration) {
                    return objective.durationCounter >= objective.duration;
                } else {
                    return objective.current >= objective.target;
                }

            case 'equal':
                return objective.current === objective.target;

            case 'special':
                return objective.current >= objective.target;

            default:
                return false;
        }
    }

    /**
     * Complete an objective
     */
    completeObjective(objective, tick) {
        objective.completed = true;
        objective.completedAt = tick;
        
        this.completedObjectives.push({ ...objective });
        this.currentScore += objective.points;
        
        // Log completion
        if (window.game) {
            window.game.logEvent(
                `🎯 OBJECTIVE COMPLETED: ${objective.title} (+${objective.points} points)`, 
                'success'
            );
        }

        // Update UI
        this.updateObjectiveUI(objective);
        this.updateScoreDisplay();

        // Track in history
        this.objectiveHistory.push({
            type: 'completed',
            objective: objective.id,
            tick: tick,
            score: objective.points
        });
    }

    /**
     * Generate new objectives based on current world state
     */
    generateNewObjectives(world, stats, tick) {
        const activeObjectives = this.objectives.filter(obj => !obj.completed);
        
        // Only generate if we have fewer than 5 active objectives
        if (activeObjectives.length >= 5) return;

        const newObjectives = this.createDynamicObjectives(stats, tick);
        
        newObjectives.forEach(newObj => {
            // Check if similar objective already exists
            const exists = this.objectives.some(existing => 
                existing.type === newObj.type && !existing.completed
            );
            
            if (!exists) {
                this.objectives.push(newObj);
                this.updateObjectiveUI(newObj);
                
                if (window.game) {
                    window.game.logEvent(`📋 New objective: ${newObj.title}`, 'important');
                }
            }
        });
    }

    /**
     * Create dynamic objectives based on current game state
     */
    createDynamicObjectives(stats, tick) {
        const objectives = [];
        const difficulty = Math.floor(tick / 1000) + 1; // Increase difficulty over time

        // Population-based objectives
        if (stats.population > 50) {
            objectives.push({
                id: `population_grow_${tick}`,
                type: 'population',
                title: `Reach ${stats.population + 50} entities`,
                description: `Grow the population to ${stats.population + 50} living entities`,
                target: stats.population + 50,
                current: stats.population,
                condition: 'greater_equal',
                completed: false,
                points: 500 * difficulty,
                category: 'growth'
            });
        }

        // Energy objectives
        if (stats.totalEnergy > 5000) {
            const energyTarget = Math.ceil(stats.totalEnergy * 1.5 / 1000) * 1000;
            objectives.push({
                id: `energy_boost_${tick}`,
                type: 'energy',
                title: `Reach ${energyTarget} total energy`,
                description: `Accumulate ${energyTarget} units of total energy`,
                target: energyTarget,
                current: stats.totalEnergy,
                condition: 'greater_equal',
                completed: false,
                points: 300 * difficulty,
                category: 'efficiency'
            });
        }

        // Evolution objectives
        if (stats.generations >= 3) {
            objectives.push({
                id: `evolution_advance_${tick}`,
                type: 'evolution',
                title: `Reach generation ${stats.generations + 5}`,
                description: `Guide evolution to generation ${stats.generations + 5}`,
                target: stats.generations + 5,
                current: stats.generations,
                condition: 'greater_equal',
                completed: false,
                points: 400 * difficulty,
                category: 'evolution'
            });
        }

        // Specialized objectives based on entity types
        if (stats.byType.carnivore === 0 && stats.byType.herbivore > 10) {
            objectives.push({
                id: `peaceful_world_${tick}`,
                type: 'special',
                title: 'Maintain peaceful world for 200 ticks',
                description: 'Keep a world with no carnivores for 200 ticks',
                target: 200,
                current: 0,
                condition: 'special',
                completed: false,
                points: 1500,
                category: 'peace'
            });
        }

        return objectives;
    }

    /**
     * Update objective display in UI
     */
    updateObjectiveUI(objective) {
        const objectiveElement = document.querySelector(`[data-type="${objective.type}"]`);
        if (!objectiveElement) {
            // Create new objective element if it doesn't exist
            this.createObjectiveElement(objective);
            return;
        }

        const textElement = objectiveElement.querySelector('.objective-text');
        const statusElement = objectiveElement.querySelector('.objective-status');

        if (textElement) {
            textElement.textContent = objective.title;
        }

        if (statusElement) {
            if (objective.duration && !objective.completed) {
                statusElement.textContent = `${objective.durationCounter}/${objective.duration}`;
            } else {
                statusElement.textContent = `${objective.current}/${objective.target}`;
            }
        }

        // Update completion status
        if (objective.completed) {
            objectiveElement.classList.add('completed');
            if (statusElement) {
                statusElement.textContent = '✓ COMPLETED';
            }
        }
    }

    /**
     * Create a new objective element in the UI
     */
    createObjectiveElement(objective) {
        const objectivesList = document.getElementById('objectivesList');
        if (!objectivesList) return;

        const objectiveDiv = document.createElement('div');
        objectiveDiv.className = 'objective';
        objectiveDiv.setAttribute('data-type', objective.type);

        const textSpan = document.createElement('span');
        textSpan.className = 'objective-text';
        textSpan.textContent = objective.title;

        const statusSpan = document.createElement('span');
        statusSpan.className = 'objective-status';
        statusSpan.textContent = `${objective.current}/${objective.target}`;

        objectiveDiv.appendChild(textSpan);
        objectiveDiv.appendChild(statusSpan);
        objectivesList.appendChild(objectiveDiv);
    }

    /**
     * Update score display
     */
    updateScoreDisplay() {
        // Future: Add score display to UI
        console.log(`Current Score: ${this.currentScore}`);
    }

    /**
     * Get objectives for a specific category
     */
    getObjectivesByCategory(category) {
        return this.objectives.filter(obj => obj.category === category);
    }

    /**
     * Get completion statistics
     */
    getCompletionStats() {
        const total = this.objectives.length;
        const completed = this.completedObjectives.length;
        const inProgress = this.objectives.filter(obj => !obj.completed).length;

        return {
            total,
            completed,
            inProgress,
            completionRate: total > 0 ? (completed / total) * 100 : 0,
            totalScore: this.currentScore
        };
    }

    /**
     * Get achievement summary
     */
    getAchievementSummary() {
        const categories = {};
        
        this.completedObjectives.forEach(obj => {
            if (!categories[obj.category]) {
                categories[obj.category] = {
                    count: 0,
                    points: 0,
                    objectives: []
                };
            }
            
            categories[obj.category].count++;
            categories[obj.category].points += obj.points;
            categories[obj.category].objectives.push(obj.title);
        });

        return {
            categories,
            totalAchievements: this.completedObjectives.length,
            totalPoints: this.currentScore,
            averagePointsPerAchievement: this.completedObjectives.length > 0 ? 
                this.currentScore / this.completedObjectives.length : 0
        };
    }

    /**
     * Create emergency objectives when simulation is struggling
     */
    createEmergencyObjectives(stats, tick) {
        const emergencyObjectives = [];

        // Population crisis
        if (stats.population < 5) {
            emergencyObjectives.push({
                id: `emergency_population_${tick}`,
                type: 'population',
                title: 'EMERGENCY: Prevent extinction!',
                description: 'Increase population to at least 10 entities to avoid total collapse',
                target: 10,
                current: stats.population,
                condition: 'greater_equal',
                completed: false,
                points: 3000,
                category: 'emergency',
                emergency: true
            });
        }

        // Energy crisis
        if (stats.totalEnergy < 100) {
            emergencyObjectives.push({
                id: `emergency_energy_${tick}`,
                type: 'energy',
                title: 'EMERGENCY: Energy crisis!',
                description: 'Restore total energy to at least 500 to stabilize the ecosystem',
                target: 500,
                current: stats.totalEnergy,
                condition: 'greater_equal',
                completed: false,
                points: 2000,
                category: 'emergency',
                emergency: true
            });
        }

        return emergencyObjectives;
    }

    /**
     * Export objectives for saving
     */
    exportObjectives() {
        return {
            objectives: this.objectives,
            completedObjectives: this.completedObjectives,
            objectiveHistory: this.objectiveHistory,
            currentScore: this.currentScore,
            timestamp: Date.now()
        };
    }

    /**
     * Import objectives from save data
     */
    importObjectives(saveData) {
        if (saveData.objectives) {
            this.objectives = saveData.objectives;
        }
        
        if (saveData.completedObjectives) {
            this.completedObjectives = saveData.completedObjectives;
        }
        
        if (saveData.objectiveHistory) {
            this.objectiveHistory = saveData.objectiveHistory;
        }
        
        if (saveData.currentScore !== undefined) {
            this.currentScore = saveData.currentScore;
        }

        // Update UI for all objectives
        this.objectives.forEach(objective => {
            this.updateObjectiveUI(objective);
        });

        this.updateScoreDisplay();
        
        if (window.game) {
            window.game.logEvent('Objectives loaded from save data', 'success');
        }
    }

    /**
     * Reset all objectives to initial state
     */
    reset() {
        this.objectives = [];
        this.completedObjectives = [];
        this.objectiveHistory = [];
        this.currentScore = 0;
        
        this.initializeDefaultObjectives();
        
        // Clear UI
        const objectivesList = document.getElementById('objectivesList');
        if (objectivesList) {
            objectivesList.innerHTML = '';
            this.objectives.forEach(objective => {
                this.createObjectiveElement(objective);
            });
        }
        
        this.updateScoreDisplay();
    }

    /**
     * Get recommendations based on current objectives
     */
    getRecommendations(stats, rules) {
        const recommendations = [];
        const activeObjectives = this.objectives.filter(obj => !obj.completed);

        activeObjectives.forEach(objective => {
            switch (objective.type) {
                case 'population':
                    if (objective.current < objective.target * 0.5) {
                        recommendations.push({
                            text: `To increase population, try reducing reproduction cost or energy decay`,
                            priority: 'high',
                            rules: ['reproductionCost', 'energyDecay']
                        });
                    }
                    break;

                case 'energy':
                    if (objective.current < objective.target * 0.3) {
                        recommendations.push({
                            text: `To boost energy, increase resource abundance or reduce energy decay`,
                            priority: 'medium',
                            rules: ['resourceAbundance', 'energyDecay']
                        });
                    }
                    break;

                case 'survival':
                    if (stats.population < 10) {
                        recommendations.push({
                            text: `Population is critically low - disable predators and increase resources`,
                            priority: 'critical',
                            rules: ['enablePredators', 'resourceAbundance', 'reproductionCost']
                        });
                    }
                    break;

                case 'evolution':
                    if (rules.mutationChance < 0.02) {
                        recommendations.push({
                            text: `To accelerate evolution, increase mutation chance`,
                            priority: 'low',
                            rules: ['mutationChance']
                        });
                    }
                    break;
            }
        });

        return recommendations;
    }
}