// Byte Miner: Core Collapse - Upgrades System

class UpgradeManager {
    constructor() {
        this.upgrades = this.initializeUpgrades();
    }

    initializeUpgrades() {
        return {
            // Tier 1: Manual Boosters
            tier1: {
                autoMiner: {
                    name: 'Auto Miner',
                    baseCost: 50,
                    effect: '+1 byte/sec',
                    scaling: 1.5,
                    flavor: 'A rusty bot with a pickaxe and dreams.',
                    type: 'passive',
                    tier: 1,
                    unlocked: true
                },
                turboClicker: {
                    name: 'Turbo Clicker',
                    baseCost: 100,
                    effect: '+1 byte/click',
                    scaling: 2,
                    flavor: 'Your fingers are now legally weapons.',
                    type: 'click',
                    tier: 1,
                    unlocked: false // Unlocked by achievement
                },
                byteMagnet: {
                    name: 'Byte Magnet',
                    baseCost: 250,
                    effect: '+5% passive gain',
                    scaling: 1.8,
                    flavor: 'It hums with digital hunger.',
                    type: 'multiplier',
                    tier: 1,
                    unlocked: true
                },
                fingerUpgrade: {
                    name: 'Finger Upgrade',
                    baseCost: 500,
                    effect: '+2 byte/click',
                    scaling: 2,
                    flavor: 'Cybernetic fingertips installed.',
                    type: 'click',
                    tier: 1,
                    unlocked: true
                },
                clickstormProtocol: {
                    name: 'Clickstorm Protocol',
                    baseCost: 750,
                    effect: '+10% click power',
                    scaling: 2.2,
                    flavor: 'Unleash the storm.',
                    type: 'clickMultiplier',
                    tier: 1,
                    unlocked: true
                },
                manualOverride: {
                    name: 'Manual Override',
                    baseCost: 1000,
                    effect: '+25% manual income',
                    scaling: 2.5,
                    flavor: 'You take control.',
                    type: 'clickMultiplier',
                    tier: 1,
                    unlocked: true
                }
            },

            // Tier 2: Efficiency Enhancers
            tier2: {
                byteCompressor: {
                    name: 'Byte Compressor',
                    baseCost: 1000,
                    effect: '+10% all gains',
                    scaling: 2,
                    flavor: 'Crushes data into dense byte nuggets.',
                    type: 'globalMultiplier',
                    tier: 2,
                    unlocked: false
                },
                neuralNetBoost: {
                    name: 'Neural Net Boost',
                    baseCost: 5000,
                    effect: '+5 byte/sec',
                    scaling: 2.2,
                    flavor: 'It learns. It mines. It dreams.',
                    type: 'passive',
                    tier: 2,
                    unlocked: false
                },
                quantumExtractor: {
                    name: 'Quantum Extractor',
                    baseCost: 10000,
                    effect: '+25 byte/sec',
                    scaling: 2.5,
                    flavor: 'Rips bytes from alternate timelines.',
                    type: 'passive',
                    tier: 2,
                    unlocked: false
                },
                cacheCleaner: {
                    name: 'Cache Cleaner',
                    baseCost: 15000,
                    effect: '+15% passive gain',
                    scaling: 2.3,
                    flavor: 'Clears clutter for smoother mining.',
                    type: 'multiplier',
                    tier: 2,
                    unlocked: false
                },
                dataPipeline: {
                    name: 'Data Pipeline',
                    baseCost: 20000,
                    effect: '+50 byte/sec',
                    scaling: 2.6,
                    flavor: 'Streamlines byte flow.',
                    type: 'passive',
                    tier: 2,
                    unlocked: false
                },
                compressionMatrix: {
                    name: 'Compression Matrix',
                    baseCost: 25000,
                    effect: '+20% all gains',
                    scaling: 2.8,
                    flavor: 'Data folds into itself.',
                    type: 'globalMultiplier',
                    tier: 2,
                    unlocked: false
                }
            },

            // Tier 3: Exotic Tech
            tier3: {
                entropicDrill: {
                    name: 'Entropic Drill',
                    baseCost: 50000,
                    effect: '+10 byte/click',
                    scaling: 2.5,
                    flavor: 'It drills through entropy itself.',
                    type: 'click',
                    tier: 3,
                    unlocked: false
                },
                byteSingularity: {
                    name: 'Byte Singularity',
                    baseCost: 100000,
                    effect: '+100 byte/sec',
                    scaling: 3,
                    flavor: 'A byte so dense it warps reality.',
                    type: 'passive',
                    tier: 3,
                    unlocked: false
                },
                chronoMiner: {
                    name: 'Chrono Miner',
                    baseCost: 250000,
                    effect: '+1% per minute played',
                    scaling: 3.5,
                    flavor: 'Mines bytes from the future.',
                    type: 'timeMultiplier',
                    tier: 3,
                    unlocked: false
                },
                glitchHarvester: {
                    name: 'Glitch Harvester',
                    baseCost: 300000,
                    effect: '+5% all gains',
                    scaling: 3.2,
                    flavor: 'Harvests anomalies for profit.',
                    type: 'globalMultiplier',
                    tier: 3,
                    unlocked: false
                },
                temporalCache: {
                    name: 'Temporal Cache',
                    baseCost: 400000,
                    effect: '+2% per hour played',
                    scaling: 3.8,
                    flavor: 'Stores time itself.',
                    type: 'timeMultiplier',
                    tier: 3,
                    unlocked: false
                },
                dimensionalFork: {
                    name: 'Dimensional Fork',
                    baseCost: 500000,
                    effect: '+250 byte/sec',
                    scaling: 4,
                    flavor: 'Splits timelines for byte yield.',
                    type: 'passive',
                    tier: 3,
                    unlocked: false
                }
            },

            // Tier 4: Prestige Unlocks (Core Fragments)
            tier4: {
                coreStabilizer: {
                    name: 'Core Stabilizer',
                    baseCost: 10,
                    effect: '+10% all income',
                    scaling: 1,
                    flavor: 'Stabilizes the collapsing core.',
                    type: 'globalMultiplier',
                    tier: 4,
                    currency: 'fragments',
                    maxLevel: 5,
                    prestigeTier: 1,
                    unlocked: false
                },
                memoryEcho: {
                    name: 'Memory Echo',
                    baseCost: 25,
                    effect: 'Retain 1 upgrade post-reset',
                    scaling: 1,
                    flavor: 'Echoes of past runs linger.',
                    type: 'retention',
                    tier: 4,
                    currency: 'fragments',
                    maxLevel: 3,
                    prestigeTier: 1,
                    unlocked: false
                },
                fragmentFurnace: {
                    name: 'Fragment Furnace',
                    baseCost: 50,
                    effect: '+1 Fragment per 10M Bytes',
                    scaling: 1,
                    flavor: 'Burns bytes into fragments.',
                    type: 'fragmentBonus',
                    tier: 4,
                    currency: 'fragments',
                    maxLevel: 5,
                    prestigeTier: 1,
                    unlocked: false
                },
                byteMultithreader: {
                    name: 'Byte Multithreader',
                    baseCost: 100,
                    effect: '+1% per upgrade owned',
                    scaling: 1,
                    flavor: 'Threads reality for parallel mining.',
                    type: 'upgradeMultiplier',
                    tier: 4,
                    currency: 'fragments',
                    maxLevel: 5,
                    prestigeTier: 1,
                    unlocked: false
                },
                coreOverclock: {
                    name: 'Core Overclock',
                    baseCost: 150,
                    effect: '+50% click speed',
                    scaling: 1,
                    flavor: 'Pushes the core beyond safe limits.',
                    type: 'clickSpeed',
                    tier: 4,
                    currency: 'fragments',
                    maxLevel: 3,
                    prestigeTier: 2,
                    unlocked: false
                },
                memoryArchive: {
                    name: 'Memory Archive',
                    baseCost: 200,
                    effect: 'Retain 3 upgrades post-reset',
                    scaling: 1,
                    flavor: 'Preserves deeper memories.',
                    type: 'retention',
                    tier: 4,
                    currency: 'fragments',
                    maxLevel: 3,
                    prestigeTier: 2,
                    unlocked: false
                },
                fragmentReactor: {
                    name: 'Fragment Reactor',
                    baseCost: 300,
                    effect: '+2 Fragments per 10M Bytes',
                    scaling: 1,
                    flavor: 'Fuses collapse into power.',
                    type: 'fragmentBonus',
                    tier: 4,
                    currency: 'fragments',
                    maxLevel: 5,
                    prestigeTier: 2,
                    unlocked: false
                },
                byteHyperthreader: {
                    name: 'Byte Hyperthreader',
                    baseCost: 400,
                    effect: '+2% per upgrade owned',
                    scaling: 1,
                    flavor: 'Reality splits into byte streams.',
                    type: 'upgradeMultiplier',
                    tier: 4,
                    currency: 'fragments',
                    maxLevel: 5,
                    prestigeTier: 2,
                    unlocked: false
                },
                collapseNexus: {
                    name: 'Collapse Nexus',
                    baseCost: 500,
                    effect: 'Unlocks Quantum Tier early',
                    scaling: 1,
                    flavor: 'The center of all resets.',
                    type: 'unlock',
                    tier: 4,
                    currency: 'fragments',
                    maxLevel: 1,
                    prestigeTier: 3,
                    unlocked: false
                },
                aiMemoryCore: {
                    name: 'AI Memory Core',
                    baseCost: 600,
                    effect: 'Retain AI Assistant post-reset',
                    scaling: 1,
                    flavor: 'The mind persists.',
                    type: 'retention',
                    tier: 4,
                    currency: 'fragments',
                    maxLevel: 1,
                    prestigeTier: 3,
                    unlocked: false
                }
            },

            // Tier 5: Quantum Lab (Quantum Keys)
            tier5: {
                quantumForge: {
                    name: 'Quantum Forge',
                    baseCost: 1,
                    effect: 'Unlocks Quantum Tier',
                    scaling: 1,
                    flavor: 'Forges keys from collapsed cores.',
                    type: 'unlock',
                    tier: 5,
                    currency: 'quantumKeys',
                    unlocked: false
                },
                temporalLoop: {
                    name: 'Temporal Loop',
                    baseCost: 2,
                    effect: 'Doubles Chrono Miner effect',
                    scaling: 1,
                    flavor: 'Loops time for byte gain.',
                    type: 'upgradeBonus',
                    tier: 5,
                    currency: 'quantumKeys',
                    unlocked: false
                },
                entropyShield: {
                    name: 'Entropy Shield',
                    baseCost: 3,
                    effect: 'Prevents softcaps for 10 mins',
                    scaling: 1,
                    flavor: 'Shields against entropy decay.',
                    type: 'temporary',
                    tier: 5,
                    currency: 'quantumKeys',
                    unlocked: false
                },
                aiAwakening: {
                    name: 'AI Awakening',
                    baseCost: 5,
                    effect: 'Unlocks AI Assistant (auto-clicker)',
                    scaling: 1,
                    flavor: 'The Miner becomes the Mind.',
                    type: 'unlock',
                    tier: 5,
                    currency: 'quantumKeys',
                    unlocked: false
                },
                quantumEcho: {
                    name: 'Quantum Echo',
                    baseCost: 6,
                    effect: '+10% all Quantum effects',
                    scaling: 1,
                    flavor: 'Echoes ripple across dimensions.',
                    type: 'quantumMultiplier',
                    tier: 5,
                    currency: 'quantumKeys',
                    unlocked: false
                },
                realityStitcher: {
                    name: 'Reality Stitcher',
                    baseCost: 8,
                    effect: '+5% income per Quantum Key owned',
                    scaling: 1,
                    flavor: 'Weave the fabric of existence.',
                    type: 'keyMultiplier',
                    tier: 5,
                    currency: 'quantumKeys',
                    unlocked: false
                },
                singularityCore: {
                    name: 'Singularity Core',
                    baseCost: 10,
                    effect: '+500 byte/sec',
                    scaling: 1,
                    flavor: 'A core of infinite density.',
                    type: 'passive',
                    tier: 5,
                    currency: 'quantumKeys',
                    unlocked: false
                }
            }
        };
    }

    purchaseUpgrade(upgradeId, gameState) {
        const upgrade = this.getUpgrade(upgradeId);
        if (!upgrade) return false;

        const level = gameState.upgrades[upgradeId] || 0;
        const cost = this.getUpgradeCost(upgradeId, level);
        const currency = upgrade.currency || 'bytes';

        // Check if affordable
        if (!this.canAffordUpgrade(upgradeId, gameState)) return false;

        // Check max level
        if (upgrade.maxLevel && level >= upgrade.maxLevel) return false;

        // Spend currency
        if (currency === 'bytes') {
            gameState.bytes -= cost;
        } else if (currency === 'fragments') {
            gameState.coreFragments -= cost;
        } else if (currency === 'quantumKeys') {
            gameState.quantumKeys -= cost;
        }

        // Increase level
        gameState.upgrades[upgradeId] = level + 1;
        gameState.stats.upgradesPurchased++;

        // Handle special upgrades
        this.handleSpecialUpgrade(upgradeId, gameState);

        return true;
    }

    getUpgrade(upgradeId) {
        for (const tier in this.upgrades) {
            if (this.upgrades[tier][upgradeId]) {
                return this.upgrades[tier][upgradeId];
            }
        }
        return null;
    }

    getUpgradeCost(upgradeId, level = 0) {
        const upgrade = this.getUpgrade(upgradeId);
        if (!upgrade) return Infinity;

        return Utils.calculateCost(upgrade.baseCost, level, upgrade.scaling);
    }

    canAffordUpgrade(upgradeId, gameState) {
        const upgrade = this.getUpgrade(upgradeId);
        if (!upgrade || !upgrade.unlocked) return false;

        const level = gameState.upgrades[upgradeId] || 0;
        const cost = this.getUpgradeCost(upgradeId, level);
        const currency = upgrade.currency || 'bytes';

        // Check max level
        if (upgrade.maxLevel && level >= upgrade.maxLevel) return false;

        // Check currency
        if (currency === 'bytes') {
            return gameState.bytes >= cost;
        } else if (currency === 'fragments') {
            return gameState.coreFragments >= cost;
        } else if (currency === 'quantumKeys') {
            return gameState.quantumKeys >= cost;
        }

        return false;
    }

    handleSpecialUpgrade(upgradeId, gameState) {
        const upgrade = this.getUpgrade(upgradeId);

        switch (upgradeId) {
            case 'quantumForge':
                gameState.unlocks.quantumLab = true;
                gameState.unlocks.tier5 = true;
                break;
            case 'aiAwakening':
                gameState.unlocks.aiAssistant = true;
                gameState.aiAssistant.unlocked = true;
                break;
            case 'collapseNexus':
                gameState.unlocks.quantumLab = true;
                break;
        }
    }

    calculateTotalEffect(gameState) {
        const effects = {
            passiveIncome: 0,
            clickPower: 1,
            clickMultiplier: 1,
            passiveMultiplier: 1,
            globalMultiplier: 1,
            fragmentBonus: 0,
            upgradeMultiplier: 1,
            quantumMultiplier: 1,
            keyMultiplier: 1,
            timeMultiplier: 1
        };

        // Calculate effects from all owned upgrades
        for (const upgradeId in gameState.upgrades) {
            const level = gameState.upgrades[upgradeId];
            if (level <= 0) continue;

            const upgrade = this.getUpgrade(upgradeId);
            if (!upgrade) continue;

            const effectValue = this.calculateUpgradeEffect(upgradeId, level);

            switch (upgrade.type) {
                case 'passive':
                    effects.passiveIncome += effectValue;
                    break;
                case 'click':
                    effects.clickPower += effectValue;
                    break;
                case 'clickMultiplier':
                    effects.clickMultiplier *= (1 + effectValue / 100);
                    break;
                case 'multiplier':
                    effects.passiveMultiplier *= (1 + effectValue / 100);
                    break;
                case 'globalMultiplier':
                    effects.globalMultiplier *= (1 + effectValue / 100);
                    break;
                case 'fragmentBonus':
                    effects.fragmentBonus += effectValue;
                    break;
                case 'upgradeMultiplier':
                    const upgradeCount = Object.keys(gameState.upgrades).length;
                    effects.upgradeMultiplier *= (1 + (effectValue * upgradeCount) / 100);
                    break;
                case 'quantumMultiplier':
                    effects.quantumMultiplier *= (1 + effectValue / 100);
                    break;
                case 'keyMultiplier':
                    effects.keyMultiplier *= (1 + (effectValue * gameState.quantumKeys) / 100);
                    break;
                case 'timeMultiplier':
                    const timePlayed = gameState.stats.totalTimePlayed / 60000; // minutes
                    effects.timeMultiplier *= (1 + (effectValue * timePlayed) / 100);
                    break;
            }
        }

        return effects;
    }

    calculateUpgradeEffect(upgradeId, level) {
        const upgrade = this.getUpgrade(upgradeId);
        if (!upgrade) return 0;

        const baseEffect = this.parseEffectValue(upgrade.effect);
        return Utils.calculateEffect(baseEffect, level, upgrade.scaling);
    }

    parseEffectValue(effectString) {
        if (effectString.includes('%')) {
            return parseFloat(effectString.replace(/[^\d.]/g, ''));
        }
        if (effectString.includes('/')) {
            return parseFloat(effectString.replace(/[^\d.]/g, ''));
        }
        return parseFloat(effectString.replace(/[^\d.]/g, '')) || 0;
    }

    unlockTier(tier, gameState) {
        const tierKey = `tier${tier}`;
        if (gameState.unlocks[tierKey]) return;

        gameState.unlocks[tierKey] = true;

        // Unlock all upgrades in the tier
        if (this.upgrades[tierKey]) {
            for (const upgradeId in this.upgrades[tierKey]) {
                this.upgrades[tierKey][upgradeId].unlocked = true;
            }
        }

        Utils.createNotification(`Tier ${tier} unlocked!`, 'success');
    }

    checkTierUnlocks(gameState) {
        // Tier 2: Unlocked with 10K total bytes
        if (!gameState.unlocks.tier2 && gameState.totalBytes >= 10000) {
            this.unlockTier(2, gameState);
        }

        // Tier 3: Unlocked with 1M total bytes
        if (!gameState.unlocks.tier3 && gameState.totalBytes >= 1000000) {
            this.unlockTier(3, gameState);
        }

        // Tier 4: Unlocked with first prestige
        if (!gameState.unlocks.tier4 && gameState.prestigeCount > 0) {
            this.unlockTier(4, gameState);
        }
    }

    getUpgradesByTier(tier) {
        return this.upgrades[`tier${tier}`] || {};
    }

    getAllUpgrades() {
        const allUpgrades = {};
        for (const tier in this.upgrades) {
            Object.assign(allUpgrades, this.upgrades[tier]);
        }
        return allUpgrades;
    }

    getOwnedUpgradeCount(gameState) {
        return Object.keys(gameState.upgrades).filter(id => gameState.upgrades[id] > 0).length;
    }

    getTotalUpgradeLevel(gameState) {
        return Object.values(gameState.upgrades).reduce((sum, level) => sum + level, 0);
    }
}

// Initialize upgrade manager
const Upgrades = new UpgradeManager();

// Export for other modules
window.Upgrades = Upgrades;