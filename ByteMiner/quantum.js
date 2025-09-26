// Byte Miner: Core Collapse - Quantum System

class QuantumManager {
    constructor() {
        this.isUnlocked = false;
        this.temporaryEffects = new Map();
    }

    unlock(gameState) {
        if (this.isUnlocked) return;
        
        this.isUnlocked = true;
        gameState.unlocks.quantumLab = true;
        gameState.unlocks.tier5 = true;
        
        // Unlock all quantum upgrades
        for (const upgradeId in Upgrades.upgrades.tier5) {
            Upgrades.upgrades.tier5[upgradeId].unlocked = true;
        }
        
        Utils.createNotification('Quantum Lab Unlocked!', 'success', 4000);
        this.createQuantumUnlockEffect();
    }

    createQuantumUnlockEffect() {
        // Create sparkle effects around the screen
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'quantum-sparkle';
                sparkle.style.left = Math.random() * window.innerWidth + 'px';
                sparkle.style.top = Math.random() * window.innerHeight + 'px';
                document.body.appendChild(sparkle);
                
                setTimeout(() => {
                    if (document.body.contains(sparkle)) {
                        document.body.removeChild(sparkle);
                    }
                }, 2000);
            }, i * 100);
        }
    }

    purchaseQuantumUpgrade(upgradeId, gameState) {
        const upgrade = Upgrades.getUpgrade(upgradeId);
        if (!upgrade || upgrade.tier !== 5) return false;

        const level = gameState.upgrades[upgradeId] || 0;
        const cost = Upgrades.getUpgradeCost(upgradeId, level);

        if (gameState.quantumKeys < cost) return false;

        // Special handling for quantum upgrades
        if (!this.handleSpecialQuantumUpgrade(upgradeId, gameState)) {
            return false;
        }

        // Spend quantum keys
        gameState.quantumKeys -= cost;
        gameState.stats.quantumKeysSpent = (gameState.stats.quantumKeysSpent || 0) + cost;

        // Increase level (most quantum upgrades are one-time purchases)
        gameState.upgrades[upgradeId] = level + 1;

        Utils.createNotification(`Quantum upgrade purchased: ${upgrade.name}`, 'success');
        this.createQuantumPurchaseEffect();

        return true;
    }

    handleSpecialQuantumUpgrade(upgradeId, gameState) {
        switch (upgradeId) {
            case 'quantumForge':
                // Already handled by unlock system
                break;
                
            case 'temporalLoop':
                // Double chrono miner effects
                this.enhanceChronoMiner(gameState);
                break;
                
            case 'entropyShield':
                // Prevent softcaps for 10 minutes
                this.activateEntropyShield(gameState);
                break;
                
            case 'aiAwakening':
                // Unlock AI Assistant
                gameState.unlocks.aiAssistant = true;
                gameState.aiAssistant.unlocked = true;
                gameState.aiAssistant.active = true;
                gameState.aiAssistant.clickRate = 1; // 1 click per second
                break;
                
            case 'quantumEcho':
                // Boost all quantum effects
                this.enhanceQuantumEffects(gameState);
                break;
                
            case 'realityStitcher':
                // Passive income boost based on quantum keys
                break;
                
            case 'singularityCore':
                // Massive passive income boost
                break;
                
            default:
                return true;
        }
        
        return true;
    }

    enhanceChronoMiner(gameState) {
        // Mark chrono miner as enhanced
        gameState.quantumEnhancements = gameState.quantumEnhancements || {};
        gameState.quantumEnhancements.chronoMiner = true;
        
        Utils.createNotification('Chrono Miner enhanced by Temporal Loop!', 'success');
    }

    activateEntropyShield(gameState) {
        const duration = 10 * 60 * 1000; // 10 minutes
        const endTime = Date.now() + duration;
        
        this.temporaryEffects.set('entropyShield', {
            endTime: endTime,
            active: true
        });
        
        gameState.temporaryEffects = gameState.temporaryEffects || {};
        gameState.temporaryEffects.entropyShield = endTime;
        
        Utils.createNotification('Entropy Shield activated for 10 minutes!', 'success');
        this.createShieldEffect();
    }

    enhanceQuantumEffects(gameState) {
        gameState.quantumEnhancements = gameState.quantumEnhancements || {};
        gameState.quantumEnhancements.quantumEcho = true;
        
        Utils.createNotification('All quantum effects enhanced by 10%!', 'success');
    }

    createQuantumPurchaseEffect() {
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            color: #9400d3;
            text-shadow: 0 0 20px #9400d3;
            z-index: 999;
            pointer-events: none;
            animation: quantumPulse 1s ease-out forwards;
        `;
        effect.textContent = '⚛️ QUANTUM ENHANCED ⚛️';
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            if (document.body.contains(effect)) {
                document.body.removeChild(effect);
            }
        }, 1000);
    }

    createShieldEffect() {
        const shield = document.createElement('div');
        shield.id = 'entropy-shield';
        shield.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 1;
            background: radial-gradient(circle, transparent 60%, rgba(148, 0, 211, 0.1) 100%);
            animation: shieldPulse 2s ease-in-out infinite;
        `;
        
        document.body.appendChild(shield);
    }

    updateTemporaryEffects(gameState) {
        const currentTime = Date.now();
        
        // Update entropy shield
        if (gameState.temporaryEffects?.entropyShield) {
            if (currentTime > gameState.temporaryEffects.entropyShield) {
                // Shield expired
                delete gameState.temporaryEffects.entropyShield;
                this.temporaryEffects.delete('entropyShield');
                
                const shield = document.getElementById('entropy-shield');
                if (shield) {
                    document.body.removeChild(shield);
                }
                
                Utils.createNotification('Entropy Shield expired', 'warning');
            }
        }
        
        // Update other temporary effects...
    }

    calculateQuantumEffects(gameState) {
        const effects = {
            globalMultiplier: 1,
            passiveIncome: 0,
            clickPower: 0,
            quantumMultiplier: 1,
            aiEnabled: false,
            aiClickRate: 0,
            shieldActive: false
        };
        
        // Quantum Echo enhancement
        const quantumEchoBonus = gameState.quantumEnhancements?.quantumEcho ? 1.1 : 1;
        
        // Reality Stitcher
        const realityStitcherLevel = gameState.upgrades['realityStitcher'] || 0;
        if (realityStitcherLevel > 0) {
            const keyBonus = gameState.quantumKeys * 0.05 * realityStitcherLevel;
            effects.globalMultiplier *= (1 + keyBonus) * quantumEchoBonus;
        }
        
        // Singularity Core
        const singularityCoreLevel = gameState.upgrades['singularityCore'] || 0;
        if (singularityCoreLevel > 0) {
            effects.passiveIncome += 500 * singularityCoreLevel * quantumEchoBonus;
        }
        
        // AI Awakening
        if (gameState.upgrades['aiAwakening'] > 0) {
            effects.aiEnabled = true;
            effects.aiClickRate = 1 * quantumEchoBonus;
        }
        
        // Entropy Shield
        if (gameState.temporaryEffects?.entropyShield && Date.now() < gameState.temporaryEffects.entropyShield) {
            effects.shieldActive = true;
        }
        
        // Temporal Loop (enhances chrono miner)
        if (gameState.quantumEnhancements?.chronoMiner) {
            // This is handled in the upgrade calculations
        }
        
        return effects;
    }

    getQuantumKeyGenerationRate(gameState) {
        // Quantum keys are earned through special milestones and events
        let rate = 0;
        
        // Base rate from prestige milestones
        if (gameState.prestigeCount >= 10) {
            rate += 0.001; // Very slow passive generation after 10th prestige
        }
        
        // Bonus from achievements
        const achievementBonus = Achievements.getAchievementBonus('quantumKeys', gameState);
        rate *= (1 + achievementBonus);
        
        return rate;
    }

    generateQuantumKeys(gameState, deltaTime) {
        const rate = this.getQuantumKeyGenerationRate(gameState);
        if (rate <= 0) return;
        
        const keysGenerated = rate * (deltaTime / 1000);
        
        // Only award full keys
        if (keysGenerated >= 1) {
            const fullKeys = Math.floor(keysGenerated);
            gameState.quantumKeys += fullKeys;
            
            if (fullKeys > 0) {
                Utils.createNotification(`+${fullKeys} Quantum Key${fullKeys > 1 ? 's' : ''}!`, 'success');
            }
        }
    }

    checkQuantumUnlocks(gameState) {
        // Check if quantum lab should be unlocked
        if (!this.isUnlocked && !gameState.unlocks.quantumLab) {
            // Unlock conditions:
            // 1. Have quantum forge upgrade
            // 2. Or have collapse nexus upgrade
            // 3. Or reach extreme byte milestone
            
            const hasQuantumForge = gameState.upgrades['quantumForge'] > 0;
            const hasCollapseNexus = gameState.upgrades['collapseNexus'] > 0;
            const extremeBytes = gameState.totalBytes >= 1e15; // 1 Petabyte
            
            if (hasQuantumForge || hasCollapseNexus || extremeBytes) {
                this.unlock(gameState);
            }
        }
    }

    getQuantumStats(gameState) {
        const effects = this.calculateQuantumEffects(gameState);
        
        return {
            unlocked: this.isUnlocked || gameState.unlocks.quantumLab,
            quantumKeys: gameState.quantumKeys,
            quantumKeysSpent: gameState.stats.quantumKeysSpent || 0,
            effects: effects,
            temporaryEffects: {
                entropyShield: gameState.temporaryEffects?.entropyShield || null
            },
            enhancements: gameState.quantumEnhancements || {}
        };
    }

    // Special quantum events
    triggerQuantumFluctuation(gameState) {
        // Random quantum event that can happen rarely
        const events = [
            'keyBonus',      // Bonus quantum keys
            'timeWarp',      // Temporary time acceleration
            'glitchReward',  // Random upgrade levels
            'fragmentRain'   // Extra core fragments
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        
        switch (event) {
            case 'keyBonus':
                const bonusKeys = Math.ceil(Math.random() * 3);
                gameState.quantumKeys += bonusKeys;
                Utils.createNotification(`Quantum Fluctuation: +${bonusKeys} Quantum Keys!`, 'success');
                break;
                
            case 'timeWarp':
                // 2x income for 5 minutes
                this.activateTimeWarp(gameState);
                break;
                
            case 'glitchReward':
                // Random upgrade gets +1 level
                this.applyGlitchReward(gameState);
                break;
                
            case 'fragmentRain':
                const bonusFragments = Math.ceil(Math.random() * 10);
                gameState.coreFragments += bonusFragments;
                Utils.createNotification(`Quantum Fluctuation: +${bonusFragments} Core Fragments!`, 'success');
                break;
        }
        
        this.createQuantumFluctuationEffect();
    }

    activateTimeWarp(gameState) {
        const duration = 5 * 60 * 1000; // 5 minutes
        const endTime = Date.now() + duration;
        
        gameState.temporaryEffects = gameState.temporaryEffects || {};
        gameState.temporaryEffects.timeWarp = endTime;
        
        Utils.createNotification('Time Warp activated: 2x income for 5 minutes!', 'success');
    }

    applyGlitchReward(gameState) {
        const ownedUpgrades = Object.keys(gameState.upgrades).filter(id => gameState.upgrades[id] > 0);
        
        if (ownedUpgrades.length > 0) {
            const randomUpgrade = ownedUpgrades[Math.floor(Math.random() * ownedUpgrades.length)];
            gameState.upgrades[randomUpgrade]++;
            
            const upgrade = Upgrades.getUpgrade(randomUpgrade);
            Utils.createNotification(`Glitch Reward: ${upgrade.name} +1 level!`, 'success');
        }
    }

    createQuantumFluctuationEffect() {
        // Create a screen-wide quantum effect
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, 
                transparent 0%, 
                rgba(148, 0, 211, 0.1) 25%, 
                transparent 50%, 
                rgba(148, 0, 211, 0.1) 75%, 
                transparent 100%);
            pointer-events: none;
            z-index: 999;
            animation: quantumFluctuation 2s ease-in-out;
        `;
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            if (document.body.contains(effect)) {
                document.body.removeChild(effect);
            }
        }, 2000);
    }

    // Check for quantum events
    updateQuantumEvents(gameState, deltaTime) {
        // Very rare quantum fluctuations
        if (this.isUnlocked && Math.random() < 0.0001) { // 0.01% chance per update
            this.triggerQuantumFluctuation(gameState);
        }
        
        // Generate quantum keys passively
        this.generateQuantumKeys(gameState, deltaTime);
        
        // Update temporary effects
        this.updateTemporaryEffects(gameState);
    }
}

// Add quantum effect animations to CSS
const quantumStyle = document.createElement('style');
quantumStyle.textContent = `
    @keyframes quantumPulse {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
    }
    
    @keyframes shieldPulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
    }
    
    @keyframes quantumFluctuation {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
    }
`;
document.head.appendChild(quantumStyle);

// Initialize quantum manager
const Quantum = new QuantumManager();

// Export for other modules
window.Quantum = Quantum;