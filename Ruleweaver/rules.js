/**
 * Rules.js - Core rules system for Ruleweaver
 * Manages all the fundamental rules that govern the simulation
 */

class RulesEngine {
    constructor() {
        // Default rule values
        this.rules = {
            // Physics rules
            gravity: 1.0,           // Affects movement and falling
            energyDecay: 0.02,      // How quickly entities lose energy
            
            // Biology rules
            reproductionCost: 50,   // Energy cost to reproduce
            mutationChance: 0.05,   // Probability of trait mutation
            
            // Economy rules
            tradeEfficiency: 1.0,   // Multiplier for trading benefits
            resourceAbundance: 1.0, // Affects resource spawn rate and energy gain
            
            // Environment rules
            enablePredators: false, // Whether carnivores hunt
            enableWeather: false,   // Weather effects (future feature)
            
            // Advanced rules (computed)
            populationPressure: 1.0, // Affects reproduction based on crowding
            extinctionThreat: 0.0,   // Increases difficulty when population is low
        };
        
        // Rule change history for analysis
        this.ruleHistory = [];
        this.lastRuleChange = 0;
        
        // Rule effects cache
        this.effectsCache = new Map();
        
        this.initializeRuleListeners();
    }

    /**
     * Initialize UI listeners for rule changes
     */
    initializeRuleListeners() {
        // Physics rules
        this.bindSlider('gravitySlider', 'gravity', 'gravityValue');
        this.bindSlider('energyDecaySlider', 'energyDecay', 'energyDecayValue');
        
        // Biology rules
        this.bindSlider('reproductionCostSlider', 'reproductionCost', 'reproductionCostValue');
        this.bindSlider('mutationChanceSlider', 'mutationChance', 'mutationChanceValue');
        
        // Economy rules
        this.bindSlider('tradeEfficiencySlider', 'tradeEfficiency', 'tradeEfficiencyValue');
        this.bindSlider('resourceAbundanceSlider', 'resourceAbundance', 'resourceAbundanceValue');
        
        // Environment toggles
        this.bindToggle('enablePredatorsToggle', 'enablePredators');
        this.bindToggle('enableWeatherToggle', 'enableWeather');
    }

    /**
     * Bind a slider to a rule with automatic value display
     */
    bindSlider(sliderId, ruleName, valueDisplayId) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueDisplayId);
        
        if (slider && valueDisplay) {
            // Set initial value
            slider.value = this.rules[ruleName];
            valueDisplay.textContent = this.formatRuleValue(this.rules[ruleName]);
            
            // Listen for changes
            slider.addEventListener('input', (e) => {
                const newValue = parseFloat(e.target.value);
                this.updateRule(ruleName, newValue);
                valueDisplay.textContent = this.formatRuleValue(newValue);
            });
        }
    }

    /**
     * Bind a toggle to a rule
     */
    bindToggle(toggleId, ruleName) {
        const toggle = document.getElementById(toggleId);
        
        if (toggle) {
            // Set initial value
            toggle.checked = this.rules[ruleName];
            
            // Listen for changes
            toggle.addEventListener('change', (e) => {
                this.updateRule(ruleName, e.target.checked);
            });
        }
    }

    /**
     * Format rule value for display
     */
    formatRuleValue(value) {
        if (typeof value === 'boolean') {
            return value ? 'On' : 'Off';
        } else if (typeof value === 'number') {
            return value < 1 ? value.toFixed(3) : value.toFixed(1);
        }
        return value.toString();
    }

    /**
     * Update a rule value and record the change
     */
    updateRule(ruleName, newValue) {
        const oldValue = this.rules[ruleName];
        this.rules[ruleName] = newValue;
        
        // Record rule change
        this.ruleHistory.push({
            timestamp: Date.now(),
            rule: ruleName,
            oldValue: oldValue,
            newValue: newValue,
            tick: this.lastRuleChange
        });
        
        // Clear effects cache for this rule
        this.effectsCache.delete(ruleName);
        
        // Trigger rule change event
        this.onRuleChanged(ruleName, oldValue, newValue);
    }

    /**
     * Handle rule change events
     */
    onRuleChanged(ruleName, oldValue, newValue) {
        // Calculate rule effects
        this.updateDerivedRules();
        
        // Log significant changes
        if (Math.abs(newValue - oldValue) > 0.1 || typeof newValue === 'boolean') {
            const changeDescription = this.describeRuleChange(ruleName, oldValue, newValue);
            if (window.game) {
                window.game.logEvent(`Rule changed: ${changeDescription}`, 'important');
            }
        }
    }

    /**
     * Update derived rules based on current values
     */
    updateDerivedRules() {
        // Calculate population pressure based on current entity count
        if (window.game && window.game.entityManager) {
            const stats = window.game.entityManager.getStatistics();
            const idealPopulation = 30;
            this.rules.populationPressure = Math.max(0.5, Math.min(2.0, stats.population / idealPopulation));
            
            // Calculate extinction threat
            const livingEntities = stats.population;
            if (livingEntities < 5) {
                this.rules.extinctionThreat = (5 - livingEntities) / 5;
            } else {
                this.rules.extinctionThreat = 0;
            }
        }
    }

    /**
     * Describe a rule change in human terms
     */
    describeRuleChange(ruleName, oldValue, newValue) {
        const descriptions = {
            gravity: {
                name: 'Gravity',
                increase: 'increased physical forces',
                decrease: 'reduced physical constraints'
            },
            energyDecay: {
                name: 'Energy Decay',
                increase: 'accelerated entropy',
                decrease: 'improved energy conservation'
            },
            reproductionCost: {
                name: 'Reproduction Cost',
                increase: 'made reproduction harder',
                decrease: 'made reproduction easier'
            },
            mutationChance: {
                name: 'Mutation Rate',
                increase: 'increased genetic diversity',
                decrease: 'stabilized genetics'
            },
            tradeEfficiency: {
                name: 'Trade Efficiency',
                increase: 'improved cooperation benefits',
                decrease: 'reduced trading advantages'
            },
            resourceAbundance: {
                name: 'Resource Abundance',
                increase: 'enriched the environment',
                decrease: 'created scarcity'
            },
            enablePredators: {
                name: 'Predation',
                true: 'enabled natural selection',
                false: 'created peaceful coexistence'
            },
            enableWeather: {
                name: 'Weather Systems',
                true: 'added environmental challenges',
                false: 'stabilized conditions'
            }
        };

        const desc = descriptions[ruleName];
        if (!desc) return `${ruleName}: ${oldValue} → ${newValue}`;

        if (typeof newValue === 'boolean') {
            return `${desc.name}: ${desc[newValue.toString()]}`;
        } else {
            const direction = newValue > oldValue ? 'increase' : 'decrease';
            return `${desc.name}: ${desc[direction]}`;
        }
    }

    /**
     * Get rule effects for analysis
     */
    getRuleEffects(ruleName) {
        if (this.effectsCache.has(ruleName)) {
            return this.effectsCache.get(ruleName);
        }

        const effects = this.calculateRuleEffects(ruleName);
        this.effectsCache.set(ruleName, effects);
        return effects;
    }

    /**
     * Calculate the effects of a specific rule
     */
    calculateRuleEffects(ruleName) {
        const currentValue = this.rules[ruleName];
        const effects = {
            direct: [],
            indirect: [],
            severity: 'low'
        };

        switch (ruleName) {
            case 'gravity':
                effects.direct.push('Movement patterns');
                effects.indirect.push('Energy expenditure', 'Migration behavior');
                effects.severity = currentValue > 1.5 ? 'high' : 'medium';
                break;

            case 'energyDecay':
                effects.direct.push('Entity lifespan', 'Activity levels');
                effects.indirect.push('Population dynamics', 'Evolution pressure');
                effects.severity = currentValue > 0.05 ? 'high' : 'medium';
                break;

            case 'reproductionCost':
                effects.direct.push('Birth rate', 'Population growth');
                effects.indirect.push('Genetic diversity', 'Age distribution');
                effects.severity = currentValue > 80 ? 'high' : 'medium';
                break;

            case 'mutationChance':
                effects.direct.push('Genetic variation', 'Adaptation speed');
                effects.indirect.push('Species resilience', 'Trait distribution');
                effects.severity = currentValue > 0.1 ? 'high' : 'low';
                break;

            case 'tradeEfficiency':
                effects.direct.push('Cooperation behavior', 'Energy transfer');
                effects.indirect.push('Social structures', 'Symbiosis');
                effects.severity = Math.abs(currentValue - 1.0) > 0.5 ? 'medium' : 'low';
                break;

            case 'resourceAbundance':
                effects.direct.push('Food availability', 'Competition intensity');
                effects.indirect.push('Territorial behavior', 'Population limits');
                effects.severity = currentValue < 0.5 || currentValue > 2.0 ? 'high' : 'medium';
                break;

            case 'enablePredators':
                effects.direct.push('Predation pressure', 'Fear responses');
                effects.indirect.push('Evolutionary arms race', 'Ecosystem balance');
                effects.severity = 'high';
                break;

            case 'enableWeather':
                effects.direct.push('Environmental variability');
                effects.indirect.push('Adaptation pressure', 'Migration patterns');
                effects.severity = 'medium';
                break;
        }

        return effects;
    }

    /**
     * Apply rule modifications to entity behavior
     */
    applyRuleModifications(entity, world) {
        // Gravity effects on movement
        if (this.rules.gravity !== 1.0) {
            entity.velocity.y += (this.rules.gravity - 1.0) * 0.5;
        }

        // Energy decay modifications
        if (this.rules.energyDecay !== 0.02) {
            const decayModifier = this.rules.energyDecay / 0.02;
            entity.energy -= (entity.energy * 0.001 * decayModifier);
        }

        // Population pressure effects
        if (this.rules.populationPressure > 1.5) {
            // Increase stress in crowded conditions
            entity.traits.aggression = Math.min(1.0, entity.traits.aggression + 0.01);
            entity.reproductionThreshold *= 1.2;
        } else if (this.rules.populationPressure < 0.7) {
            // Reduce reproduction threshold in sparse populations
            entity.reproductionThreshold *= 0.9;
        }

        // Extinction threat responses
        if (this.rules.extinctionThreat > 0.5) {
            // Emergency reproduction mode
            entity.reproductionThreshold *= 0.7;
            entity.maxSpeed *= 1.1; // Increased activity
        }

        // Predator effects
        if (!this.rules.enablePredators && entity.type === 'carnivore') {
            // Convert hunting behavior to scavenging
            entity.traits.aggression *= 0.5;
        }
    }

    /**
     * Get current rule configuration
     */
    getCurrentRules() {
        return { ...this.rules };
    }

    /**
     * Set rules from saved configuration
     */
    setRules(rulesConfig) {
        for (const [ruleName, value] of Object.entries(rulesConfig)) {
            if (this.rules.hasOwnProperty(ruleName)) {
                this.rules[ruleName] = value;
            }
        }
        
        // Update UI elements
        this.updateUIFromRules();
        this.updateDerivedRules();
    }

    /**
     * Update UI elements to reflect current rules
     */
    updateUIFromRules() {
        // Update sliders
        const sliderMappings = {
            gravitySlider: 'gravity',
            energyDecaySlider: 'energyDecay',
            reproductionCostSlider: 'reproductionCost',
            mutationChanceSlider: 'mutationChance',
            tradeEfficiencySlider: 'tradeEfficiency',
            resourceAbundanceSlider: 'resourceAbundance'
        };

        for (const [sliderId, ruleName] of Object.entries(sliderMappings)) {
            const slider = document.getElementById(sliderId);
            const valueDisplay = document.getElementById(sliderId.replace('Slider', 'Value'));
            
            if (slider) {
                slider.value = this.rules[ruleName];
            }
            if (valueDisplay) {
                valueDisplay.textContent = this.formatRuleValue(this.rules[ruleName]);
            }
        }

        // Update toggles
        const toggleMappings = {
            enablePredatorsToggle: 'enablePredators',
            enableWeatherToggle: 'enableWeather'
        };

        for (const [toggleId, ruleName] of Object.entries(toggleMappings)) {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.checked = this.rules[ruleName];
            }
        }
    }

    /**
     * Reset all rules to default values
     */
    resetToDefaults() {
        const defaults = {
            gravity: 1.0,
            energyDecay: 0.02,
            reproductionCost: 50,
            mutationChance: 0.05,
            tradeEfficiency: 1.0,
            resourceAbundance: 1.0,
            enablePredators: false,
            enableWeather: false
        };

        this.setRules(defaults);
        
        if (window.game) {
            window.game.logEvent('Rules reset to default values', 'important');
        }
    }

    /**
     * Apply weather effects (if enabled)
     */
    applyWeatherEffects(world) {
        if (!this.rules.enableWeather) return;

        // Simple weather simulation
        const weatherIntensity = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
        
        if (weatherIntensity > 0.8) {
            // Storm effects - increase energy decay
            this.rules.energyDecay *= 1.2;
            
            if (Math.random() < 0.01) {
                world.logEvent('Storm intensifies - entities seek shelter', 'important');
            }
        } else if (weatherIntensity < 0.2) {
            // Calm weather - reduce energy decay
            this.rules.energyDecay *= 0.9;
        }
    }

    /**
     * Analyze rule effectiveness
     */
    analyzeRuleEffectiveness() {
        if (this.ruleHistory.length < 2) return null;

        const recentChanges = this.ruleHistory.slice(-10);
        const analysis = {
            mostChanged: null,
            impactScore: 0,
            recommendation: 'Continue experimenting with different rule combinations'
        };

        // Find most frequently changed rule
        const changeFrequency = {};
        recentChanges.forEach(change => {
            changeFrequency[change.rule] = (changeFrequency[change.rule] || 0) + 1;
        });

        const mostChangedRule = Object.keys(changeFrequency).reduce((a, b) => 
            changeFrequency[a] > changeFrequency[b] ? a : b
        );

        analysis.mostChanged = mostChangedRule;
        analysis.impactScore = changeFrequency[mostChangedRule];

        // Generate recommendations based on patterns
        if (analysis.impactScore > 3) {
            analysis.recommendation = `Consider stabilizing ${mostChangedRule} to observe long-term effects`;
        }

        return analysis;
    }

    /**
     * Export rules for saving
     */
    exportRules() {
        return {
            rules: this.getCurrentRules(),
            history: this.ruleHistory.slice(-50), // Keep last 50 changes
            timestamp: Date.now()
        };
    }

    /**
     * Import rules from save data
     */
    importRules(saveData) {
        if (saveData.rules) {
            this.setRules(saveData.rules);
        }
        
        if (saveData.history) {
            this.ruleHistory = saveData.history;
        }
        
        if (window.game) {
            window.game.logEvent('Rules loaded from save data', 'success');
        }
    }
}