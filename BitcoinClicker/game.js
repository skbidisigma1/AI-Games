// Bitcoin Clicker - Main Game Logic

class BitcoinClickerGame {
    constructor() {
        this.gameState = this.createDefaultState();
        this.lastUpdate = Date.now();
        this.autosaveInterval = null;
        this.gameLoopInterval = null;
        this.eventCheckInterval = null;
        
        // Game configuration
        this.config = {
            hashesPerBTC: 1000000, // 1 million hashes = 1 BTC
            tickRate: 100, // Game updates 10 times per second
            eventCheckRate: 5000, // Check for events every 5 seconds
            
            // Market fluctuation
            marketBasePrice: 50000,
            marketVolatility: 0.02, // 2% max change per tick
            marketTrendDuration: 30000, // 30 seconds per trend
            
            // Event probabilities (per check)
            eventChances: {
                marketCrash: 0.5,
                marketBoom: 0.5,
                halvening: 0.2,
                powerSurge: 1.0,
                hardwareMalfunction: 0.8,
                luckyFind: 1.5
            }
        };
        
        // Mining hardware definitions
        this.hardwareTypes = [
            {
                id: 'cpu',
                name: 'CPU Miner',
                description: 'Your trusty CPU. Slow but reliable.',
                baseCost: 10,
                baseHashrate: 10,
                basePower: 50,
                costMultiplier: 1.15,
                unlocked: true
            },
            {
                id: 'gpu',
                name: 'GPU Rig',
                description: 'Graphics card mining. Much faster.',
                baseCost: 100,
                baseHashrate: 100,
                basePower: 150,
                costMultiplier: 1.15,
                unlocked: true
            },
            {
                id: 'asic_early',
                name: 'Early ASIC',
                description: 'First generation ASIC miner. Game changer.',
                baseCost: 1000,
                baseHashrate: 1000,
                basePower: 500,
                costMultiplier: 1.18,
                unlocked: true
            },
            {
                id: 'asic_mid',
                name: 'Mid-Gen ASIC',
                description: 'Improved efficiency and hashrate.',
                baseCost: 10000,
                baseHashrate: 8000,
                basePower: 1200,
                costMultiplier: 1.20,
                unlocked: false,
                requirement: { totalBTC: 10 }
            },
            {
                id: 'asic_modern',
                name: 'Modern ASIC',
                description: 'State-of-the-art mining hardware.',
                baseCost: 100000,
                baseHashrate: 100000,
                basePower: 3000,
                costMultiplier: 1.22,
                unlocked: false,
                requirement: { totalBTC: 100 }
            },
            {
                id: 'quantum',
                name: 'Quantum Miner',
                description: 'Experimental quantum computing miner.',
                baseCost: 1000000,
                baseHashrate: 1000000,
                basePower: 10000,
                costMultiplier: 1.25,
                unlocked: false,
                requirement: { totalBTC: 1000, hashPoints: 50 }
            }
        ];
        
        // Power generator definitions
        this.generatorTypes = [
            {
                id: 'solar',
                name: 'Solar Panel Array',
                description: 'Clean renewable energy from the sun.',
                baseCost: 50,
                baseCapacity: 500,
                costMultiplier: 1.15,
                unlocked: true
            },
            {
                id: 'diesel',
                name: 'Diesel Generator',
                description: 'Reliable backup power.',
                baseCost: 200,
                baseCapacity: 2000,
                costMultiplier: 1.18,
                unlocked: true
            },
            {
                id: 'hydro',
                name: 'Hydro Turbine',
                description: 'Harness the power of water.',
                baseCost: 2000,
                baseCapacity: 15000,
                costMultiplier: 1.20,
                unlocked: false,
                requirement: { totalBTC: 5 }
            },
            {
                id: 'nuclear',
                name: 'Nuclear Hookup',
                description: 'Massive power from nuclear plants.',
                baseCost: 50000,
                baseCapacity: 200000,
                costMultiplier: 1.25,
                unlocked: false,
                requirement: { totalBTC: 50 }
            },
            {
                id: 'fusion',
                name: 'Fusion Reactor',
                description: 'The future of energy production.',
                baseCost: 1000000,
                baseCapacity: 5000000,
                costMultiplier: 1.30,
                unlocked: false,
                requirement: { totalBTC: 500, hashPoints: 25 }
            }
        ];
        
        // Upgrade definitions
        this.upgradeTypes = [
            {
                id: 'click_power1',
                name: 'Better Mouse',
                description: 'Click faster with an ergonomic mouse.',
                cost: 500,
                effect: { clickMultiplier: 2 },
                maxPurchases: 1,
                unlocked: true
            },
            {
                id: 'click_power2',
                name: 'Mechanical Keyboard',
                description: 'Smash those hashes harder.',
                cost: 5000,
                effect: { clickMultiplier: 3 },
                maxPurchases: 1,
                requirement: { totalBTC: 10 },
                unlocked: false
            },
            {
                id: 'hash_efficiency',
                name: 'Hash Optimization',
                description: '+10% hashrate to all hardware.',
                cost: 1000,
                effect: { hashrateMultiplier: 1.1 },
                maxPurchases: 10,
                costMultiplier: 2,
                unlocked: true
            },
            {
                id: 'power_efficiency',
                name: 'Power Optimization',
                description: '-10% power consumption for all hardware.',
                cost: 2000,
                effect: { powerReduction: 0.9 },
                maxPurchases: 5,
                costMultiplier: 2.5,
                requirement: { totalBTC: 5 },
                unlocked: false
            },
            {
                id: 'conversion_boost',
                name: 'Hash Converter Upgrade',
                description: 'Reduce hashes needed per BTC by 10%.',
                cost: 10000,
                effect: { conversionBonus: 0.9 },
                maxPurchases: 5,
                costMultiplier: 3,
                requirement: { totalBTC: 20 },
                unlocked: false
            },
            {
                id: 'auto_clicker',
                name: 'Auto-Clicker',
                description: 'Automatically clicks 1 time per second.',
                cost: 25000,
                effect: { autoClick: 1 },
                maxPurchases: 1,
                requirement: { totalBTC: 50 },
                unlocked: false
            }
        ];
    }

    createDefaultState() {
        return {
            // Resources
            bitcoin: 0,
            pendingHashes: 0,
            hashPoints: 0,
            
            // Totals for prestige calculation
            totalBTCThisRun: 0,
            totalBTCAllTime: 0,
            totalClicks: 0,
            totalPrestiges: 0,
            
            // Owned items (count)
            hardware: {},
            generators: {},
            upgrades: {},
            
            // Market
            marketPrice: 50000,
            marketTrend: 'neutral',
            marketTrendTimer: 0,
            
            // Unlocks
            unlockedHardware: ['cpu', 'gpu', 'asic_early'],
            unlockedGenerators: ['solar', 'diesel'],
            unlockedUpgrades: ['click_power1', 'hash_efficiency'],
            
            // Stats
            stats: {
                totalClicks: 0,
                totalHashesSolved: 0,
                totalBTCEarned: 0,
                totalMoneyEarned: 0,
                playtime: 0,
                eventsTriggered: 0
            },
            
            // Settings
            lastUpdate: Date.now(),
            version: '1.0.0'
        };
    }

    init() {
        // Try to load saved game
        const savedState = Storage.load();
        if (savedState) {
            this.gameState = { ...this.createDefaultState(), ...savedState };
            
            // Calculate offline progress
            const offlineTime = Storage.calculateOfflineProgress(this.gameState);
            if (offlineTime > 60) { // Only show if offline for more than 1 minute
                this.processOfflineProgress(offlineTime);
            }
        }
        
        // Initialize UI
        this.initializeUI();
        this.updateUI();
        
        // Start game loops
        this.startGameLoop();
        this.startAutosave();
        this.startEventLoop();
        
        // Check for unlocks
        this.checkUnlocks();
    }

    initializeUI() {
        // Mine button
        document.getElementById('mine-button').addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
        
        // Prestige button
        document.getElementById('prestige-button').addEventListener('click', () => {
            this.prestige();
        });
        
        // Build shop items
        this.buildHardwareShop();
        this.buildPowerShop();
        this.buildUpgradesShop();
    }

    handleClick(event) {
        const clickPower = this.getClickPower();
        this.gameState.pendingHashes += clickPower;
        this.gameState.totalClicks++;
        this.gameState.stats.totalClicks++;
        
        // Create click effect
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        Utils.createClickEffect(x, y, '+' + Utils.formatNumber(clickPower));
        
        // Convert hashes to BTC
        this.convertHashes();
        
        // Update UI
        this.updateUI();
    }

    getClickPower() {
        let power = 1;
        
        // Apply click multiplier upgrades
        for (const [id, count] of Object.entries(this.gameState.upgrades)) {
            const upgrade = this.upgradeTypes.find(u => u.id === id);
            if (upgrade && upgrade.effect.clickMultiplier) {
                power *= Math.pow(upgrade.effect.clickMultiplier, count);
            }
        }
        
        // Apply hash point multiplier
        power *= this.getHashPointMultiplier();
        
        return Math.floor(power);
    }

    getHashPointMultiplier() {
        // Each hash point gives 1% bonus
        return 1 + (this.gameState.hashPoints * 0.01);
    }

    convertHashes() {
        let hashesPerBTC = this.config.hashesPerBTC;
        
        // Apply conversion upgrades
        for (const [id, count] of Object.entries(this.gameState.upgrades)) {
            const upgrade = this.upgradeTypes.find(u => u.id === id);
            if (upgrade && upgrade.effect.conversionBonus) {
                hashesPerBTC *= Math.pow(upgrade.effect.conversionBonus, count);
            }
        }
        
        const btcEarned = this.gameState.pendingHashes / hashesPerBTC;
        if (btcEarned > 0) {
            this.gameState.bitcoin += btcEarned;
            this.gameState.totalBTCThisRun += btcEarned;
            this.gameState.totalBTCAllTime += btcEarned;
            this.gameState.stats.totalBTCEarned += btcEarned;
            this.gameState.stats.totalMoneyEarned += btcEarned * this.gameState.marketPrice;
            this.gameState.pendingHashes = 0;
        }
    }

    startGameLoop() {
        this.gameLoopInterval = setInterval(() => {
            const now = Date.now();
            const deltaTime = (now - this.lastUpdate) / 1000; // seconds
            this.lastUpdate = now;
            
            this.update(deltaTime);
        }, this.config.tickRate);
    }

    update(deltaTime) {
        // Update playtime
        this.gameState.stats.playtime += deltaTime;
        
        // Generate hashes from hardware
        this.generateHashes(deltaTime);
        
        // Auto-click
        this.processAutoClick(deltaTime);
        
        // Convert hashes to BTC
        this.convertHashes();
        
        // Update market
        this.updateMarket(deltaTime);
        
        // Update UI
        this.updateUI();
    }

    generateHashes(deltaTime) {
        const powerEfficiency = this.getPowerEfficiency();
        let totalHashrate = 0;
        let hashrateMultiplier = 1;
        
        // Apply hashrate upgrades
        for (const [id, count] of Object.entries(this.gameState.upgrades)) {
            const upgrade = this.upgradeTypes.find(u => u.id === id);
            if (upgrade && upgrade.effect.hashrateMultiplier) {
                hashrateMultiplier *= Math.pow(upgrade.effect.hashrateMultiplier, count);
            }
        }
        
        // Apply hash point multiplier
        hashrateMultiplier *= this.getHashPointMultiplier();
        
        // Calculate total hashrate from all hardware
        for (const [id, count] of Object.entries(this.gameState.hardware)) {
            const hardware = this.hardwareTypes.find(h => h.id === id);
            if (hardware) {
                totalHashrate += hardware.baseHashrate * count * hashrateMultiplier;
            }
        }
        
        // Apply power efficiency
        totalHashrate *= powerEfficiency;
        
        // Generate hashes
        const hashesGenerated = totalHashrate * deltaTime;
        this.gameState.pendingHashes += hashesGenerated;
        this.gameState.stats.totalHashesSolved += hashesGenerated;
    }

    processAutoClick(deltaTime) {
        // Check for auto-clicker upgrade
        const autoClickUpgrade = this.gameState.upgrades['auto_clicker'];
        if (autoClickUpgrade && autoClickUpgrade > 0) {
            const clickPower = this.getClickPower();
            const clicksPerSecond = 1;
            const hashesFromAutoClick = clickPower * clicksPerSecond * deltaTime;
            this.gameState.pendingHashes += hashesFromAutoClick;
        }
    }

    getPowerEfficiency() {
        const powerUsed = this.getTotalPowerUsed();
        const powerCapacity = this.getTotalPowerCapacity();
        return Utils.calculatePowerEfficiency(powerUsed, powerCapacity);
    }

    getTotalPowerUsed() {
        let total = 0;
        let powerReduction = 1;
        
        // Apply power reduction upgrades
        for (const [id, count] of Object.entries(this.gameState.upgrades)) {
            const upgrade = this.upgradeTypes.find(u => u.id === id);
            if (upgrade && upgrade.effect.powerReduction) {
                powerReduction *= Math.pow(upgrade.effect.powerReduction, count);
            }
        }
        
        for (const [id, count] of Object.entries(this.gameState.hardware)) {
            const hardware = this.hardwareTypes.find(h => h.id === id);
            if (hardware) {
                total += hardware.basePower * count * powerReduction;
            }
        }
        return total;
    }

    getTotalPowerCapacity() {
        let total = 0;
        for (const [id, count] of Object.entries(this.gameState.generators)) {
            const generator = this.generatorTypes.find(g => g.id === id);
            if (generator) {
                total += generator.baseCapacity * count;
            }
        }
        return total;
    }

    updateMarket(deltaTime) {
        // Update trend timer
        this.gameState.marketTrendTimer += deltaTime * 1000;
        
        // Change trend periodically
        if (this.gameState.marketTrendTimer >= this.config.marketTrendDuration) {
            this.gameState.marketTrendTimer = 0;
            const trends = ['up', 'down', 'neutral'];
            this.gameState.marketTrend = trends[Utils.randomInt(0, trends.length - 1)];
        }
        
        // Fluctuate price based on trend
        let change = 0;
        if (this.gameState.marketTrend === 'up') {
            change = Utils.randomFloat(0, this.config.marketVolatility);
        } else if (this.gameState.marketTrend === 'down') {
            change = Utils.randomFloat(-this.config.marketVolatility, 0);
        } else {
            change = Utils.randomFloat(-this.config.marketVolatility * 0.5, this.config.marketVolatility * 0.5);
        }
        
        this.gameState.marketPrice *= (1 + change);
        this.gameState.marketPrice = Utils.clamp(this.gameState.marketPrice, 
            this.config.marketBasePrice * 0.5, 
            this.config.marketBasePrice * 2);
    }

    startEventLoop() {
        this.eventCheckInterval = setInterval(() => {
            this.checkRandomEvents();
        }, this.config.eventCheckRate);
    }

    checkRandomEvents() {
        // Only trigger events if player has made progress
        if (this.gameState.totalBTCThisRun < 1) return;
        
        for (const [eventName, chance] of Object.entries(this.config.eventChances)) {
            if (Utils.chance(chance)) {
                this.triggerEvent(eventName);
            }
        }
    }

    triggerEvent(eventName) {
        this.gameState.stats.eventsTriggered++;
        
        switch (eventName) {
            case 'marketCrash':
                this.gameState.marketPrice *= 0.8;
                Utils.createNotification('Market Crash!', 'Bitcoin price dropped 20%!', 'warning');
                this.gameState.marketTrend = 'down';
                break;
                
            case 'marketBoom':
                this.gameState.marketPrice *= 1.3;
                Utils.createNotification('Market Boom!', 'Bitcoin price surged 30%!', 'success');
                this.gameState.marketTrend = 'up';
                break;
                
            case 'halvening':
                // Temporary boost to click power
                const bonusHashes = this.getClickPower() * 100;
                this.gameState.pendingHashes += bonusHashes;
                Utils.createNotification('Halvening Event!', `Bonus ${Utils.formatNumber(bonusHashes)} hashes!`, 'event');
                break;
                
            case 'powerSurge':
                // Temporary power boost
                const bonusBTC = this.gameState.totalBTCThisRun * 0.05;
                this.gameState.bitcoin += bonusBTC;
                Utils.createNotification('Power Surge!', `+${Utils.formatBTC(bonusBTC)} from efficient mining!`, 'success');
                break;
                
            case 'hardwareMalfunction':
                // Lose some pending hashes
                const lostHashes = this.gameState.pendingHashes * 0.1;
                this.gameState.pendingHashes *= 0.9;
                Utils.createNotification('Hardware Malfunction', `Lost ${Utils.formatNumber(lostHashes)} pending hashes`, 'warning');
                break;
                
            case 'luckyFind':
                // Find some bonus BTC
                const luckyBTC = Math.random() * 0.1;
                this.gameState.bitcoin += luckyBTC;
                Utils.createNotification('Lucky Find!', `Found ${Utils.formatBTC(luckyBTC)} in an old wallet!`, 'event');
                break;
        }
    }

    buyHardware(hardwareId) {
        const hardware = this.hardwareTypes.find(h => h.id === hardwareId);
        if (!hardware) return;
        
        const cost = this.getHardwareCost(hardwareId);
        if (this.gameState.bitcoin < cost) return;
        
        this.gameState.bitcoin -= cost;
        this.gameState.hardware[hardwareId] = (this.gameState.hardware[hardwareId] || 0) + 1;
        
        this.updateUI();
        this.checkUnlocks();
    }

    getHardwareCost(hardwareId) {
        const hardware = this.hardwareTypes.find(h => h.id === hardwareId);
        if (!hardware) return Infinity;
        
        const owned = this.gameState.hardware[hardwareId] || 0;
        return hardware.baseCost * Math.pow(hardware.costMultiplier, owned);
    }

    buyGenerator(generatorId) {
        const generator = this.generatorTypes.find(g => g.id === generatorId);
        if (!generator) return;
        
        const cost = this.getGeneratorCost(generatorId);
        if (this.gameState.bitcoin < cost) return;
        
        this.gameState.bitcoin -= cost;
        this.gameState.generators[generatorId] = (this.gameState.generators[generatorId] || 0) + 1;
        
        this.updateUI();
        this.checkUnlocks();
    }

    getGeneratorCost(generatorId) {
        const generator = this.generatorTypes.find(g => g.id === generatorId);
        if (!generator) return Infinity;
        
        const owned = this.gameState.generators[generatorId] || 0;
        return generator.baseCost * Math.pow(generator.costMultiplier, owned);
    }

    buyUpgrade(upgradeId) {
        const upgrade = this.upgradeTypes.find(u => u.id === upgradeId);
        if (!upgrade) return;
        
        const owned = this.gameState.upgrades[upgradeId] || 0;
        if (upgrade.maxPurchases && owned >= upgrade.maxPurchases) return;
        
        const cost = this.getUpgradeCost(upgradeId);
        if (this.gameState.bitcoin < cost) return;
        
        this.gameState.bitcoin -= cost;
        this.gameState.upgrades[upgradeId] = owned + 1;
        
        this.updateUI();
        this.checkUnlocks();
    }

    getUpgradeCost(upgradeId) {
        const upgrade = this.upgradeTypes.find(u => u.id === upgradeId);
        if (!upgrade) return Infinity;
        
        const owned = this.gameState.upgrades[upgradeId] || 0;
        if (upgrade.costMultiplier) {
            return upgrade.cost * Math.pow(upgrade.costMultiplier, owned);
        }
        return upgrade.cost;
    }

    checkUnlocks() {
        // Check hardware unlocks
        for (const hardware of this.hardwareTypes) {
            if (!hardware.unlocked || this.gameState.unlockedHardware.includes(hardware.id)) {
                continue;
            }
            
            if (this.meetsRequirement(hardware.requirement)) {
                this.gameState.unlockedHardware.push(hardware.id);
                Utils.createNotification('New Hardware!', `${hardware.name} is now available!`, 'success');
            }
        }
        
        // Check generator unlocks
        for (const generator of this.generatorTypes) {
            if (!generator.unlocked || this.gameState.unlockedGenerators.includes(generator.id)) {
                continue;
            }
            
            if (this.meetsRequirement(generator.requirement)) {
                this.gameState.unlockedGenerators.push(generator.id);
                Utils.createNotification('New Generator!', `${generator.name} is now available!`, 'success');
            }
        }
        
        // Check upgrade unlocks
        for (const upgrade of this.upgradeTypes) {
            if (!upgrade.unlocked || this.gameState.unlockedUpgrades.includes(upgrade.id)) {
                continue;
            }
            
            if (this.meetsRequirement(upgrade.requirement)) {
                this.gameState.unlockedUpgrades.push(upgrade.id);
                Utils.createNotification('New Upgrade!', `${upgrade.name} is now available!`, 'success');
            }
        }
        
        // Rebuild shops if unlocks changed
        this.buildHardwareShop();
        this.buildPowerShop();
        this.buildUpgradesShop();
    }

    meetsRequirement(requirement) {
        if (!requirement) return true;
        
        if (requirement.totalBTC && this.gameState.totalBTCAllTime < requirement.totalBTC) {
            return false;
        }
        
        if (requirement.hashPoints && this.gameState.hashPoints < requirement.hashPoints) {
            return false;
        }
        
        return true;
    }

    calculateHashPointsOnPrestige() {
        // HP = √(Total BTC mined this run ÷ 1,000)
        const hp = Math.floor(Math.sqrt(this.gameState.totalBTCThisRun / 1000));
        return Math.max(0, hp);
    }

    prestige() {
        const hpGain = this.calculateHashPointsOnPrestige();
        
        if (hpGain === 0) {
            Utils.createNotification('Cannot Prestige', 'You need to mine more BTC to gain Hash Points.', 'warning');
            return;
        }
        
        if (!confirm(`Prestige now and gain ${hpGain} Hash Points? This will reset your progress.`)) {
            return;
        }
        
        // Award hash points
        this.gameState.hashPoints += hpGain;
        this.gameState.totalPrestiges++;
        
        // Reset run-specific stats
        this.gameState.bitcoin = 0;
        this.gameState.pendingHashes = 0;
        this.gameState.totalBTCThisRun = 0;
        this.gameState.hardware = {};
        this.gameState.generators = {};
        this.gameState.upgrades = {};
        
        // Reset unlocks to base
        this.gameState.unlockedHardware = ['cpu', 'gpu', 'asic_early'];
        this.gameState.unlockedGenerators = ['solar', 'diesel'];
        this.gameState.unlockedUpgrades = ['click_power1', 'hash_efficiency'];
        
        Utils.createNotification('Prestige!', `Gained ${hpGain} Hash Points! Total: ${this.gameState.hashPoints}`, 'success');
        
        this.updateUI();
        this.checkUnlocks();
    }

    processOfflineProgress(offlineTime) {
        // Calculate offline production (at reduced rate)
        const offlineMultiplier = 0.5; // 50% production while offline
        
        // Simulate production
        const iterations = Math.min(Math.floor(offlineTime), 3600); // Cap at 1 hour of iterations
        const timePerIteration = offlineTime / iterations;
        
        for (let i = 0; i < iterations; i++) {
            this.generateHashes(timePerIteration * offlineMultiplier);
            this.convertHashes();
        }
        
        const btcEarned = this.gameState.totalBTCThisRun;
        
        if (btcEarned > 0) {
            Utils.createNotification(
                'Welcome Back!',
                `You earned ${Utils.formatBTC(btcEarned)} while offline (${Utils.formatTime(offlineTime)})`,
                'success'
            );
        }
    }

    buildHardwareShop() {
        const container = document.getElementById('hardware-list');
        container.innerHTML = '';
        
        for (const hardware of this.hardwareTypes) {
            if (!this.gameState.unlockedHardware.includes(hardware.id)) continue;
            
            const owned = this.gameState.hardware[hardware.id] || 0;
            const cost = this.getHardwareCost(hardware.id);
            const canAfford = this.gameState.bitcoin >= cost;
            
            const item = document.createElement('div');
            item.className = `shop-item ${canAfford ? 'affordable' : ''}`;
            
            item.innerHTML = `
                <div class="item-header">
                    <span class="item-name">${hardware.name}</span>
                    <span class="item-owned">Owned: ${owned}</span>
                </div>
                <div class="item-description">${hardware.description}</div>
                <div class="item-stats">
                    <div class="stat-row">
                        <span class="label">Hashrate:</span>
                        <span class="value">${Utils.formatNumber(hardware.baseHashrate)}/s</span>
                    </div>
                    <div class="stat-row">
                        <span class="label">Power:</span>
                        <span class="value">${Utils.formatNumber(hardware.basePower)} kW</span>
                    </div>
                </div>
                <div class="item-footer">
                    <button class="buy-button" ${!canAfford ? 'disabled' : ''}>
                        Buy for ${Utils.formatBTC(cost)}
                    </button>
                </div>
            `;
            
            const buyBtn = item.querySelector('.buy-button');
            buyBtn.addEventListener('click', () => this.buyHardware(hardware.id));
            
            container.appendChild(item);
        }
    }

    buildPowerShop() {
        const container = document.getElementById('power-list');
        container.innerHTML = '';
        
        for (const generator of this.generatorTypes) {
            if (!this.gameState.unlockedGenerators.includes(generator.id)) continue;
            
            const owned = this.gameState.generators[generator.id] || 0;
            const cost = this.getGeneratorCost(generator.id);
            const canAfford = this.gameState.bitcoin >= cost;
            
            const item = document.createElement('div');
            item.className = `shop-item ${canAfford ? 'affordable' : ''}`;
            
            item.innerHTML = `
                <div class="item-header">
                    <span class="item-name">${generator.name}</span>
                    <span class="item-owned">Owned: ${owned}</span>
                </div>
                <div class="item-description">${generator.description}</div>
                <div class="item-stats">
                    <div class="stat-row">
                        <span class="label">Capacity:</span>
                        <span class="value">${Utils.formatNumber(generator.baseCapacity)} kW</span>
                    </div>
                </div>
                <div class="item-footer">
                    <button class="buy-button" ${!canAfford ? 'disabled' : ''}>
                        Buy for ${Utils.formatBTC(cost)}
                    </button>
                </div>
            `;
            
            const buyBtn = item.querySelector('.buy-button');
            buyBtn.addEventListener('click', () => this.buyGenerator(generator.id));
            
            container.appendChild(item);
        }
    }

    buildUpgradesShop() {
        const container = document.getElementById('upgrades-list');
        container.innerHTML = '';
        
        for (const upgrade of this.upgradeTypes) {
            if (!this.gameState.unlockedUpgrades.includes(upgrade.id)) continue;
            
            const owned = this.gameState.upgrades[upgrade.id] || 0;
            const maxed = upgrade.maxPurchases && owned >= upgrade.maxPurchases;
            const cost = this.getUpgradeCost(upgrade.id);
            const canAfford = this.gameState.bitcoin >= cost && !maxed;
            
            const item = document.createElement('div');
            item.className = `shop-item ${canAfford ? 'affordable' : ''} ${maxed ? 'locked' : ''}`;
            
            let statusText = '';
            if (maxed) {
                statusText = 'MAX';
            } else if (upgrade.maxPurchases) {
                statusText = `${owned}/${upgrade.maxPurchases}`;
            } else {
                statusText = `Owned: ${owned}`;
            }
            
            item.innerHTML = `
                <div class="item-header">
                    <span class="item-name">${upgrade.name}</span>
                    <span class="item-owned">${statusText}</span>
                </div>
                <div class="item-description">${upgrade.description}</div>
                <div class="item-footer">
                    <button class="buy-button" ${!canAfford ? 'disabled' : ''}>
                        ${maxed ? 'MAXED' : 'Buy for ' + Utils.formatBTC(cost)}
                    </button>
                </div>
            `;
            
            const buyBtn = item.querySelector('.buy-button');
            buyBtn.addEventListener('click', () => this.buyUpgrade(upgrade.id));
            
            container.appendChild(item);
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Update panels
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const panelMap = {
            hardware: 'hardware-panel',
            power: 'power-panel',
            upgrades: 'upgrades-panel',
            prestige: 'prestige-panel',
            stats: 'stats-panel'
        };
        
        const panelId = panelMap[tabName];
        if (panelId) {
            document.getElementById(panelId).classList.add('active');
        }
        
        // Update stats if stats panel
        if (tabName === 'stats') {
            this.updateStatsPanel();
        }
    }

    updateStatsPanel() {
        const container = document.getElementById('stats-content');
        const stats = [
            { label: 'Total Clicks', value: Utils.formatNumber(this.gameState.stats.totalClicks) },
            { label: 'Total Hashes Solved', value: Utils.formatNumber(this.gameState.stats.totalHashesSolved) },
            { label: 'Total BTC Earned', value: Utils.formatBTC(this.gameState.stats.totalBTCEarned) },
            { label: 'Total Money Value', value: Utils.formatUSD(this.gameState.stats.totalMoneyEarned) },
            { label: 'Playtime', value: Utils.formatTime(this.gameState.stats.playtime) },
            { label: 'Events Triggered', value: this.gameState.stats.eventsTriggered },
            { label: 'Total Prestiges', value: this.gameState.totalPrestiges },
            { label: 'Hash Points', value: this.gameState.hashPoints },
            { label: 'HP Multiplier', value: this.getHashPointMultiplier().toFixed(2) + 'x' }
        ];
        
        container.innerHTML = stats.map(stat => `
            <div class="stat-row">
                <span class="label">${stat.label}:</span>
                <span class="value">${stat.value}</span>
            </div>
        `).join('');
    }

    updateUI() {
        // Update header stats
        document.getElementById('btc-display').textContent = Utils.formatBTC(this.gameState.bitcoin);
        document.getElementById('hp-display').textContent = this.gameState.hashPoints;
        
        // Calculate rates
        const powerEfficiency = this.getPowerEfficiency();
        let totalHashrate = 0;
        let hashrateMultiplier = 1;
        
        for (const [id, count] of Object.entries(this.gameState.upgrades)) {
            const upgrade = this.upgradeTypes.find(u => u.id === id);
            if (upgrade && upgrade.effect.hashrateMultiplier) {
                hashrateMultiplier *= Math.pow(upgrade.effect.hashrateMultiplier, count);
            }
        }
        hashrateMultiplier *= this.getHashPointMultiplier();
        
        for (const [id, count] of Object.entries(this.gameState.hardware)) {
            const hardware = this.hardwareTypes.find(h => h.id === id);
            if (hardware) {
                totalHashrate += hardware.baseHashrate * count * hashrateMultiplier;
            }
        }
        totalHashrate *= powerEfficiency;
        
        document.getElementById('hashrate-display').textContent = Utils.formatNumber(totalHashrate);
        
        let hashesPerBTC = this.config.hashesPerBTC;
        for (const [id, count] of Object.entries(this.gameState.upgrades)) {
            const upgrade = this.upgradeTypes.find(u => u.id === id);
            if (upgrade && upgrade.effect.conversionBonus) {
                hashesPerBTC *= Math.pow(upgrade.effect.conversionBonus, count);
            }
        }
        const btcRate = totalHashrate / hashesPerBTC;
        document.getElementById('btcrate-display').textContent = Utils.formatBTC(btcRate);
        
        // Update power meter
        const powerUsed = this.getTotalPowerUsed();
        const powerCapacity = this.getTotalPowerCapacity();
        document.getElementById('power-used').textContent = Utils.formatNumber(powerUsed);
        document.getElementById('power-capacity').textContent = Utils.formatNumber(powerCapacity);
        
        const powerFill = document.getElementById('power-fill');
        const powerPercent = powerCapacity > 0 ? (powerUsed / powerCapacity) * 100 : 0;
        powerFill.style.width = Math.min(powerPercent, 100) + '%';
        
        if (powerPercent > 100) {
            powerFill.classList.add('overpowered');
        } else {
            powerFill.classList.remove('overpowered');
        }
        
        // Update market
        document.getElementById('market-rate').textContent = Utils.formatUSD(this.gameState.marketPrice);
        const trendEl = document.getElementById('market-trend');
        trendEl.className = 'trend-' + this.gameState.marketTrend;
        if (this.gameState.marketTrend === 'up') {
            trendEl.textContent = '↗';
        } else if (this.gameState.marketTrend === 'down') {
            trendEl.textContent = '↘';
        } else {
            trendEl.textContent = '─';
        }
        
        // Update click power display
        document.getElementById('click-power-display').textContent = '+' + Utils.formatNumber(this.getClickPower()) + ' hash/click';
        
        // Update pending hashes
        document.getElementById('pending-hashes').textContent = Utils.formatNumber(this.gameState.pendingHashes);
        
        // Update prestige panel
        document.getElementById('total-btc-run').textContent = Utils.formatBTC(this.gameState.totalBTCThisRun);
        document.getElementById('hp-on-prestige').textContent = this.calculateHashPointsOnPrestige();
        document.getElementById('hp-multiplier').textContent = this.getHashPointMultiplier().toFixed(2) + 'x';
        
        const prestigeBtn = document.getElementById('prestige-button');
        if (this.calculateHashPointsOnPrestige() === 0) {
            prestigeBtn.disabled = true;
        } else {
            prestigeBtn.disabled = false;
        }
        
        // Update shop affordability
        this.updateShopAffordability();
    }

    updateShopAffordability() {
        // Update hardware shop
        document.querySelectorAll('#hardware-list .shop-item').forEach((item, index) => {
            const hardware = this.hardwareTypes.filter(h => 
                this.gameState.unlockedHardware.includes(h.id)
            )[index];
            
            if (hardware) {
                const cost = this.getHardwareCost(hardware.id);
                const canAfford = this.gameState.bitcoin >= cost;
                
                if (canAfford) {
                    item.classList.add('affordable');
                } else {
                    item.classList.remove('affordable');
                }
                
                const btn = item.querySelector('.buy-button');
                btn.disabled = !canAfford;
            }
        });
        
        // Update generator shop
        document.querySelectorAll('#power-list .shop-item').forEach((item, index) => {
            const generator = this.generatorTypes.filter(g => 
                this.gameState.unlockedGenerators.includes(g.id)
            )[index];
            
            if (generator) {
                const cost = this.getGeneratorCost(generator.id);
                const canAfford = this.gameState.bitcoin >= cost;
                
                if (canAfford) {
                    item.classList.add('affordable');
                } else {
                    item.classList.remove('affordable');
                }
                
                const btn = item.querySelector('.buy-button');
                btn.disabled = !canAfford;
            }
        });
        
        // Update upgrades shop
        document.querySelectorAll('#upgrades-list .shop-item').forEach((item, index) => {
            const upgrade = this.upgradeTypes.filter(u => 
                this.gameState.unlockedUpgrades.includes(u.id)
            )[index];
            
            if (upgrade) {
                const owned = this.gameState.upgrades[upgrade.id] || 0;
                const maxed = upgrade.maxPurchases && owned >= upgrade.maxPurchases;
                const cost = this.getUpgradeCost(upgrade.id);
                const canAfford = this.gameState.bitcoin >= cost && !maxed;
                
                if (canAfford) {
                    item.classList.add('affordable');
                } else {
                    item.classList.remove('affordable');
                }
                
                const btn = item.querySelector('.buy-button');
                btn.disabled = !canAfford;
            }
        });
    }

    startAutosave() {
        this.autosaveInterval = setInterval(() => {
            this.gameState.lastUpdate = Date.now();
            Storage.save(this.gameState);
        }, Storage.AUTOSAVE_INTERVAL);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new BitcoinClickerGame();
    game.init();
    
    // Make game globally accessible for debugging
    window.game = game;
    
    // Save on page unload
    window.addEventListener('beforeunload', () => {
        game.gameState.lastUpdate = Date.now();
        Storage.save(game.gameState);
    });
});
