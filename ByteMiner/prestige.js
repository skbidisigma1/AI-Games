// Byte Miner: Core Collapse - Prestige System

class PrestigeManager {
    constructor() {
        this.baseRequirement = 1000000; // 1M bytes for first prestige
        this.scaling = 2.5; // Each prestige requirement scales by 2.5x
    }

    canPrestige(gameState) {
        const requirement = this.getPrestigeRequirement(gameState.prestigeCount);
        return gameState.totalBytes >= requirement;
    }

    getPrestigeRequirement(prestigeCount) {
        return Math.floor(this.baseRequirement * Math.pow(this.scaling, prestigeCount));
    }

    calculateFragmentsGained(gameState) {
        return Utils.calculateCoreFragments(gameState.totalBytes);
    }

    doPrestige(gameState) {
        if (!this.canPrestige(gameState)) return false;

        // Calculate fragments gained
        const fragmentsGained = this.calculateFragmentsGained(gameState);
        
        if (fragmentsGained <= 0) {
            Utils.createNotification('Not enough bytes for meaningful prestige!', 'warning');
            return false;
        }

        // Store pre-prestige stats
        const prePrestigeBytes = gameState.totalBytes;
        const prePrestigeTime = Date.now();
        
        // Award fragments
        gameState.coreFragments += fragmentsGained;
        gameState.prestigeCount++;
        
        // Check for quantum key rewards
        this.checkQuantumKeyRewards(gameState, fragmentsGained);
        
        // Reset progress
        this.resetProgress(gameState);
        
        // Apply prestige bonuses
        this.applyPrestigeBonuses(gameState);
        
        // Update statistics
        gameState.stats.fragmentsThisRun = 0;
        gameState.stats.lastPrestigeTime = prePrestigeTime;
        gameState.stats.lastPrestigeBytes = prePrestigeBytes;
        
        // Unlock tier 4 on first prestige
        if (gameState.prestigeCount === 1) {
            Upgrades.unlockTier(4, gameState);
        }
        
        // Show prestige notification
        Utils.createNotification(
            `Core Collapsed! +${fragmentsGained} Core Fragments`,
            'success',
            4000
        );
        
        // Create prestige effect
        this.createPrestigeEffect();
        
        // Check achievements
        Achievements.checkAchievements(gameState);
        
        console.log(`Prestige ${gameState.prestigeCount}: ${fragmentsGained} fragments gained`);
        
        return true;
    }

    resetProgress(gameState) {
        // Store values to preserve
        const preservedUpgrades = this.getPreservedUpgrades(gameState);
        const preservedStats = {
            startTime: gameState.stats.startTime,
            totalTimePlayed: gameState.stats.totalTimePlayed,
            achievementsUnlocked: gameState.stats.achievementsUnlocked,
            upgradesPurchased: gameState.stats.upgradesPurchased,
            offlineEarnings: gameState.stats.offlineEarnings,
            dailyGoalsCompleted: gameState.stats.dailyGoalsCompleted,
            bugsReported: gameState.stats.bugsReported,
            loreDiscovered: gameState.stats.loreDiscovered,
            zonesUnlocked: gameState.stats.zonesUnlocked,
            quantumKeysSpent: gameState.stats.quantumKeysSpent,
            aiActiveTime: gameState.stats.aiActiveTime,
            speedMiner1M: gameState.stats.speedMiner1M,
            speedDemon10M: gameState.stats.speedDemon10M
        };
        
        // Reset main progress
        gameState.bytes = 0;
        gameState.totalBytes = 0;
        gameState.totalClicks = 0;
        
        // Reset upgrades (except preserved ones)
        gameState.upgrades = preservedUpgrades;
        
        // Restore preserved stats
        Object.assign(gameState.stats, preservedStats);
        
        // Reset AI assistant if not preserved
        if (!this.shouldPreserveAI(gameState)) {
            gameState.aiAssistant.active = false;
            gameState.aiAssistant.clickRate = 0;
        }
        
        // Reset some unlocks
        this.resetUnlocks(gameState);
    }

    getPreservedUpgrades(gameState) {
        const preserved = {};
        const memoryEchoLevel = gameState.upgrades['memoryEcho'] || 0;
        const memoryArchiveLevel = gameState.upgrades['memoryArchive'] || 0;
        
        let preserveCount = 0;
        if (memoryEchoLevel > 0) preserveCount += memoryEchoLevel;
        if (memoryArchiveLevel > 0) preserveCount += memoryArchiveLevel * 3;
        
        if (preserveCount > 0) {
            // Preserve highest level upgrades
            const sortedUpgrades = Object.entries(gameState.upgrades)
                .filter(([id, level]) => level > 0 && id !== 'memoryEcho' && id !== 'memoryArchive')
                .sort(([, a], [, b]) => b - a)
                .slice(0, preserveCount);
            
            for (const [upgradeId, level] of sortedUpgrades) {
                preserved[upgradeId] = level;
            }
        }
        
        // Always preserve prestige upgrades
        for (const upgradeId in gameState.upgrades) {
            const upgrade = Upgrades.getUpgrade(upgradeId);
            if (upgrade && upgrade.tier === 4) {
                preserved[upgradeId] = gameState.upgrades[upgradeId];
            }
        }
        
        return preserved;
    }

    shouldPreserveAI(gameState) {
        return (gameState.upgrades['aiMemoryCore'] || 0) > 0;
    }

    resetUnlocks(gameState) {
        // Keep major tier unlocks
        // Reset specific upgrade unlocks that should be re-earned
        gameState.unlocks.tier2 = gameState.totalBytes >= 10000;
        gameState.unlocks.tier3 = gameState.totalBytes >= 1000000;
    }

    applyPrestigeBonuses(gameState) {
        // Apply fragment-based bonuses from prestige upgrades
        const effects = this.calculatePrestigeEffects(gameState);
        
        // These effects are applied during game calculations, not here
        // This method exists for future expansion
    }

    calculatePrestigeEffects(gameState) {
        const effects = {
            globalMultiplier: 1,
            fragmentBonus: 0,
            upgradeMultiplier: 1,
            clickSpeed: 1
        };
        
        // Core Stabilizer
        const coreStabilizerLevel = gameState.upgrades['coreStabilizer'] || 0;
        if (coreStabilizerLevel > 0) {
            effects.globalMultiplier *= Math.pow(1.1, coreStabilizerLevel);
        }
        
        // Fragment Furnace & Reactor
        const fragmentFurnaceLevel = gameState.upgrades['fragmentFurnace'] || 0;
        const fragmentReactorLevel = gameState.upgrades['fragmentReactor'] || 0;
        effects.fragmentBonus += fragmentFurnaceLevel + fragmentReactorLevel * 2;
        
        // Byte Multithreader & Hyperthreader
        const multithreaderLevel = gameState.upgrades['byteMultithreader'] || 0;
        const hyperthreaderLevel = gameState.upgrades['byteHyperthreader'] || 0;
        const upgradeCount = Upgrades.getOwnedUpgradeCount(gameState);
        effects.upgradeMultiplier *= Math.pow(1.01, multithreaderLevel * upgradeCount);
        effects.upgradeMultiplier *= Math.pow(1.02, hyperthreaderLevel * upgradeCount);
        
        // Core Overclock
        const coreOverclockLevel = gameState.upgrades['coreOverclock'] || 0;
        if (coreOverclockLevel > 0) {
            effects.clickSpeed *= Math.pow(1.5, coreOverclockLevel);
        }
        
        return effects;
    }

    checkQuantumKeyRewards(gameState, fragmentsGained) {
        // Award quantum keys based on prestige milestones
        let keysAwarded = 0;
        
        // First quantum key at 10th prestige
        if (gameState.prestigeCount === 10 && !gameState.stats.firstQuantumKey) {
            keysAwarded += 1;
            gameState.stats.firstQuantumKey = true;
        }
        
        // Additional keys for major milestones
        if (gameState.prestigeCount % 25 === 0 && gameState.prestigeCount >= 25) {
            keysAwarded += Math.floor(gameState.prestigeCount / 25);
        }
        
        // Keys from fragment milestones
        const totalFragments = gameState.coreFragments;
        if (totalFragments >= 1000 && !gameState.stats.fragment1000Key) {
            keysAwarded += 2;
            gameState.stats.fragment1000Key = true;
        }
        
        if (keysAwarded > 0) {
            gameState.quantumKeys += keysAwarded;
            Utils.createNotification(
                `+${keysAwarded} Quantum Key${keysAwarded > 1 ? 's' : ''} awarded!`,
                'success',
                3000
            );
        }
    }

    createPrestigeEffect() {
        // Create visual effect for prestige
        const effect = document.createElement('div');
        effect.className = 'prestige-effect';
        effect.innerHTML = '⚡ CORE COLLAPSE ⚡';
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            font-weight: bold;
            color: #ff4444;
            text-shadow: 0 0 20px #ff4444;
            z-index: 1000;
            pointer-events: none;
            animation: prestigeEffect 3s ease-out forwards;
        `;
        
        document.body.appendChild(effect);
        
        // Add screen shake
        document.body.classList.add('screen-shake');
        
        setTimeout(() => {
            document.body.removeChild(effect);
            document.body.classList.remove('screen-shake');
        }, 3000);
    }

    getPrestigeStats(gameState) {
        return {
            currentPrestige: gameState.prestigeCount,
            nextRequirement: this.getPrestigeRequirement(gameState.prestigeCount),
            canPrestige: this.canPrestige(gameState),
            fragmentsOnPrestige: this.calculateFragmentsGained(gameState),
            totalFragments: gameState.coreFragments,
            fragmentsSpent: gameState.stats.fragmentsSpent || 0,
            prestigeProgress: Math.min(gameState.totalBytes / this.getPrestigeRequirement(gameState.prestigeCount), 1)
        };
    }

    calculateOptimalPrestigeTime(gameState) {
        // Calculate when it's optimal to prestige based on current income rate
        const currentFragments = this.calculateFragmentsGained(gameState);
        const nextRequirement = this.getPrestigeRequirement(gameState.prestigeCount);
        const bytesNeeded = nextRequirement - gameState.totalBytes;
        
        // Estimate time to next prestige milestone
        const effects = Upgrades.calculateTotalEffect(gameState);
        const currentIncome = effects.passiveIncome * effects.passiveMultiplier * effects.globalMultiplier;
        
        if (currentIncome <= 0) return Infinity;
        
        const timeToNext = bytesNeeded / currentIncome; // in seconds
        
        // Recommend prestige if it would take more than 30 minutes for next significant gain
        const recommendPrestige = timeToNext > 1800 && currentFragments > 0;
        
        return {
            timeToNext: timeToNext,
            recommendPrestige: recommendPrestige,
            efficiency: currentFragments / Math.max(timeToNext / 60, 1) // fragments per minute
        };
    }

    getPrestigeEfficiency(gameState) {
        const currentTime = Date.now();
        const startTime = gameState.stats.lastPrestigeTime || gameState.stats.startTime;
        const timeSpent = (currentTime - startTime) / 1000; // seconds
        
        const fragmentsGained = this.calculateFragmentsGained(gameState);
        
        return {
            fragmentsPerSecond: fragmentsGained / Math.max(timeSpent, 1),
            fragmentsPerMinute: (fragmentsGained / Math.max(timeSpent, 1)) * 60,
            timeThisRun: timeSpent
        };
    }

    // Calculate total prestige power
    calculatePrestigePower(gameState) {
        let power = 1;
        
        // Base prestige power from count
        power *= Math.pow(1.1, gameState.prestigeCount);
        
        // Power from core fragments
        power *= Math.pow(1.05, gameState.coreFragments);
        
        // Power from prestige upgrades
        const effects = this.calculatePrestigeEffects(gameState);
        power *= effects.globalMultiplier;
        
        return power;
    }

    // Import/export prestige data
    exportPrestigeData(gameState) {
        return {
            prestigeCount: gameState.prestigeCount,
            coreFragments: gameState.coreFragments,
            quantumKeys: gameState.quantumKeys,
            prestigeUpgrades: this.getPrestigeUpgrades(gameState),
            quantumUpgrades: this.getQuantumUpgrades(gameState)
        };
    }

    getPrestigeUpgrades(gameState) {
        const prestigeUpgrades = {};
        for (const upgradeId in gameState.upgrades) {
            const upgrade = Upgrades.getUpgrade(upgradeId);
            if (upgrade && upgrade.tier === 4) {
                prestigeUpgrades[upgradeId] = gameState.upgrades[upgradeId];
            }
        }
        return prestigeUpgrades;
    }

    getQuantumUpgrades(gameState) {
        const quantumUpgrades = {};
        for (const upgradeId in gameState.upgrades) {
            const upgrade = Upgrades.getUpgrade(upgradeId);
            if (upgrade && upgrade.tier === 5) {
                quantumUpgrades[upgradeId] = gameState.upgrades[upgradeId];
            }
        }
        return quantumUpgrades;
    }
}

// Add prestige effect animation to CSS
const prestigeStyle = document.createElement('style');
prestigeStyle.textContent = `
    @keyframes prestigeEffect {
        0% { 
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        20% { 
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
        }
        80% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% { 
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
        }
    }
`;
document.head.appendChild(prestigeStyle);

// Initialize prestige manager
const Prestige = new PrestigeManager();

// Export for other modules
window.Prestige = Prestige;