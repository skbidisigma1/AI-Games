// Byte Miner: Core Collapse - Game Loop

class GameLoop {
    constructor() {
        this.isRunning = false;
        this.lastUpdate = Date.now();
        this.tickRate = 1000 / 20; // 20 FPS
        this.animationFrame = null;
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFpsUpdate = Date.now();
        this.currentFps = 0;
        
        // Update intervals
        this.saveInterval = 30000; // Save every 30 seconds
        this.lastSave = Date.now();
        
        this.achievementCheckInterval = 5000; // Check achievements every 5 seconds
        this.lastAchievementCheck = Date.now();
        
        this.unlockCheckInterval = 2000; // Check unlocks every 2 seconds
        this.lastUnlockCheck = Date.now();
    }

    start(gameState) {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.gameState = gameState;
        this.lastUpdate = Date.now();
        
        // Start the main loop
        this.loop();
        
        console.log('Game loop started');
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        console.log('Game loop stopped');
    }

    loop() {
        if (!this.isRunning) return;
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdate;
        
        // Update game logic
        this.update(deltaTime);
        
        // Update display
        this.updateUI();
        
        // Schedule next frame
        this.animationFrame = requestAnimationFrame(() => this.loop());
        
        this.lastUpdate = currentTime;
        this.updateFps();
    }

    update(deltaTime) {
        if (!this.gameState) return;
        
        // Cap delta time to prevent large jumps
        deltaTime = Math.min(deltaTime, 1000);
        
        // Update passive income
        this.updatePassiveIncome(deltaTime);
        
        // Update AI assistant
        this.updateAIAssistant(deltaTime);
        
        // Update quantum effects
        this.updateQuantumEffects(deltaTime);
        
        // Update temporary effects
        this.updateTemporaryEffects(deltaTime);
        
        // Periodic updates
        this.updatePeriodic(deltaTime);
        
        // Update statistics
        this.updateStatistics(deltaTime);
    }

    updatePassiveIncome(deltaTime) {
        const effects = Upgrades.calculateTotalEffect(this.gameState);
        const quantumEffects = Quantum.calculateQuantumEffects(this.gameState);
        const achievementBonus = Achievements.getAchievementBonus('passive', this.gameState);
        const globalBonus = Achievements.getAchievementBonus('all', this.gameState);
        
        // Calculate total passive income
        let passiveIncome = effects.passiveIncome;
        
        // Apply multipliers
        passiveIncome *= effects.passiveMultiplier;
        passiveIncome *= effects.globalMultiplier;
        passiveIncome *= quantumEffects.globalMultiplier;
        passiveIncome *= (1 + achievementBonus);
        passiveIncome *= (1 + globalBonus);
        
        // Add quantum passive income
        passiveIncome += quantumEffects.passiveIncome;
        
        // Apply time warp if active
        if (this.gameState.temporaryEffects?.timeWarp && Date.now() < this.gameState.temporaryEffects.timeWarp) {
            passiveIncome *= 2;
        }
        
        // Calculate bytes earned this tick
        const bytesEarned = (passiveIncome * deltaTime) / 1000;
        
        if (bytesEarned > 0) {
            this.gameState.bytes += bytesEarned;
            this.gameState.totalBytes += bytesEarned;
            this.gameState.stats.bytesEarned += bytesEarned;
            
            // Show passive income indicator occasionally (show actual passive rate)
            if (Math.random() < 0.05 && passiveIncome > 0) { // 5% chance per update
                this.showPassiveIncomeIndicator(passiveIncome);
            }
        }
    }

    updateAIAssistant(deltaTime) {
        if (!this.gameState.aiAssistant.active || !this.gameState.unlocks.aiAssistant) return;
        
        const quantumEffects = Quantum.calculateQuantumEffects(this.gameState);
        const clickRate = quantumEffects.aiClickRate || 1; // Default 1 click per second
        
        // Calculate clicks this tick
        const clicksThisTick = (clickRate * deltaTime) / 1000;
        this.gameState.aiAssistant.totalClicks += clicksThisTick;
        
        // Perform AI clicks
        if (clicksThisTick >= 1) {
            const fullClicks = Math.floor(clicksThisTick);
            for (let i = 0; i < fullClicks; i++) {
                this.performClick(true); // AI click
            }
        }
        
        // Update AI active time
        this.gameState.stats.aiActiveTime = (this.gameState.stats.aiActiveTime || 0) + deltaTime;
    }

    updateQuantumEffects(deltaTime) {
        if (Quantum.isUnlocked || this.gameState.unlocks.quantumLab) {
            Quantum.updateQuantumEvents(this.gameState, deltaTime);
            Quantum.checkQuantumUnlocks(this.gameState);
        }
    }

    updateTemporaryEffects(deltaTime) {
        // Update all temporary effects
        if (this.gameState.temporaryEffects) {
            const currentTime = Date.now();
            
            // Check for expired effects
            for (const effectName in this.gameState.temporaryEffects) {
                if (currentTime > this.gameState.temporaryEffects[effectName]) {
                    delete this.gameState.temporaryEffects[effectName];
                }
            }
        }
    }

    updatePeriodic(deltaTime) {
        const currentTime = Date.now();
        
        // Auto-save
        if (currentTime - this.lastSave > this.saveInterval) {
            Storage.save(this.gameState);
            this.lastSave = currentTime;
        }
        
        // Achievement checking
        if (currentTime - this.lastAchievementCheck > this.achievementCheckInterval) {
            Achievements.checkAchievements(this.gameState);
            this.lastAchievementCheck = currentTime;
        }
        
        // Unlock checking
        if (currentTime - this.lastUnlockCheck > this.unlockCheckInterval) {
            Upgrades.checkTierUnlocks(this.gameState);
            this.lastUnlockCheck = currentTime;
        }
    }

    updateStatistics(deltaTime) {
        // Update play time
        this.gameState.stats.totalTimePlayed += deltaTime;
        
        // Check speed achievements
        this.checkSpeedAchievements();
    }

    checkSpeedAchievements() {
        const sessionTime = Date.now() - (this.gameState.stats.sessionStart || this.gameState.stats.startTime);
        
        // Speed Miner: 1M bytes in under 10 minutes
        if (!this.gameState.stats.speedMiner1M && 
            this.gameState.totalBytes >= 1000000 && 
            sessionTime < 10 * 60 * 1000) {
            this.gameState.stats.speedMiner1M = 1;
        }
        
        // Speed Demon: 10M bytes in under 5 minutes
        if (!this.gameState.stats.speedDemon10M && 
            this.gameState.totalBytes >= 10000000 && 
            sessionTime < 5 * 60 * 1000) {
            this.gameState.stats.speedDemon10M = 1;
        }
    }

    performClick(isAI = false) {
        if (!this.gameState) return;
        
        const effects = Upgrades.calculateTotalEffect(this.gameState);
        const quantumEffects = Quantum.calculateQuantumEffects(this.gameState);
        const achievementBonus = Achievements.getAchievementBonus('click', this.gameState);
        const globalBonus = Achievements.getAchievementBonus('all', this.gameState);
        
        // Calculate click power
        let clickPower = effects.clickPower;
        clickPower *= effects.clickMultiplier;
        clickPower *= effects.globalMultiplier;
        clickPower *= quantumEffects.globalMultiplier;
        clickPower *= (1 + achievementBonus);
        clickPower *= (1 + globalBonus);
        
        // Add quantum click power
        clickPower += quantumEffects.clickPower;
        
        // Award bytes
        this.gameState.bytes += clickPower;
        this.gameState.totalBytes += clickPower;
        this.gameState.totalClicks++;
        this.gameState.stats.bytesEarned += clickPower;
        
        if (!isAI) {
            // Create click effect for manual clicks
            this.createClickEffect(clickPower);
        }
        
        return clickPower;
    }

    createClickEffect(value) {
        // Create click effect relative to the click-effects container
        const container = document.getElementById('click-effects');
        if (!container) return;
        
        // Use relative positioning within the container
        const x = (Math.random() - 0.5) * 100; // Random spread around center
        const y = (Math.random() - 0.5) * 50;  // Random vertical spread
        
        Utils.createClickEffect(x, y, value);
    }

    showPassiveIncomeIndicator(value) {
        // Show passive income near the byte counter
        const counter = document.getElementById('byte-counter');
        if (!counter) return;
        
        const rect = counter.getBoundingClientRect();
        const x = rect.right + 10;
        const y = rect.top + rect.height / 2;
        
        const indicator = document.createElement('div');
        indicator.className = 'passive-income-indicator';
        indicator.textContent = '+' + Utils.formatNumber(value);
        indicator.style.left = x + 'px';
        indicator.style.top = y + 'px';
        indicator.style.position = 'fixed';
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                document.body.removeChild(indicator);
            }
        }, 2000);
    }

    updateUI() {
        if (!this.gameState) return;
        
        // Update main counters
        this.updateMainCounters();
        
        // Update stats display
        this.updateStatsDisplay();
        
        // Update prestige info
        this.updatePrestigeDisplay();
        
        // Update AI assistant display
        this.updateAIDisplay();
        
        // Update upgrade panel to reflect affordability changes
        if (window.game) {
            window.game.updateUpgradePanel();
        }
    }

    updateMainCounters() {
        const bytesDisplay = document.getElementById('bytes-display');
        const fragmentsDisplay = document.getElementById('fragments-display');
        const quantumKeysDisplay = document.getElementById('quantum-keys-display');
        
        if (bytesDisplay) {
            bytesDisplay.textContent = Utils.formatNumber(this.gameState.bytes);
        }
        
        if (fragmentsDisplay) {
            fragmentsDisplay.textContent = Utils.formatNumber(this.gameState.coreFragments);
        }
        
        if (quantumKeysDisplay) {
            quantumKeysDisplay.textContent = Utils.formatNumber(this.gameState.quantumKeys);
        }
    }

    updateStatsDisplay() {
        const effects = Upgrades.calculateTotalEffect(this.gameState);
        const quantumEffects = Quantum.calculateQuantumEffects(this.gameState);
        
        // Calculate total passive rate
        let passiveRate = effects.passiveIncome;
        passiveRate *= effects.passiveMultiplier;
        passiveRate *= effects.globalMultiplier;
        passiveRate *= quantumEffects.globalMultiplier;
        passiveRate += quantumEffects.passiveIncome;
        
        // Calculate total click power
        let clickPower = effects.clickPower;
        clickPower *= effects.clickMultiplier;
        clickPower *= effects.globalMultiplier;
        clickPower *= quantumEffects.globalMultiplier;
        clickPower += quantumEffects.clickPower;
        
        const passiveRateDisplay = document.getElementById('passive-rate');
        const clickPowerDisplay = document.getElementById('click-power');
        
        if (passiveRateDisplay) {
            passiveRateDisplay.textContent = Utils.formatBytesPerSecond(passiveRate);
        }
        
        if (clickPowerDisplay) {
            clickPowerDisplay.textContent = Utils.formatNumber(clickPower);
        }
    }

    updatePrestigeDisplay() {
        const nextCollapseDisplay = document.getElementById('next-collapse');
        const fragmentsOnCollapseDisplay = document.getElementById('fragments-on-collapse');
        const prestigeButton = document.getElementById('prestige-button');
        
        if (nextCollapseDisplay) {
            const requirement = Prestige.getPrestigeRequirement(this.gameState.prestigeCount);
            nextCollapseDisplay.textContent = Utils.formatNumber(requirement);
        }
        
        if (fragmentsOnCollapseDisplay) {
            const fragments = Prestige.calculateFragmentsGained(this.gameState);
            fragmentsOnCollapseDisplay.textContent = Utils.formatNumber(fragments);
        }
        
        if (prestigeButton) {
            const canPrestige = Prestige.canPrestige(this.gameState);
            prestigeButton.disabled = !canPrestige;
            prestigeButton.textContent = canPrestige ? 'Core Collapse' : 'Not Ready';
        }
    }

    updateAIDisplay() {
        const aiAssistant = document.getElementById('ai-assistant');
        const aiRate = document.getElementById('ai-rate');
        
        if (aiAssistant && aiRate) {
            const isActive = this.gameState.aiAssistant.active && this.gameState.unlocks.aiAssistant;
            
            if (isActive) {
                aiAssistant.classList.remove('hidden');
                const quantumEffects = Quantum.calculateQuantumEffects(this.gameState);
                aiRate.textContent = (quantumEffects.aiClickRate || 1).toFixed(1);
            } else {
                aiAssistant.classList.add('hidden');
            }
        }
    }

    updateFps() {
        this.frameCount++;
        const currentTime = Date.now();
        
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }

    getFps() {
        return this.currentFps;
    }

    // Performance optimization
    setTickRate(fps) {
        this.tickRate = 1000 / fps;
    }

    // Handle offline progress
    calculateOfflineProgress(offlineTime) {
        if (offlineTime < 60000) return; // Less than 1 minute, no offline progress
        
        // Calculate what would have been earned offline
        const effects = Upgrades.calculateTotalEffect(this.gameState);
        const quantumEffects = Quantum.calculateQuantumEffects(this.gameState);
        
        let passiveIncome = effects.passiveIncome;
        passiveIncome *= effects.passiveMultiplier;
        passiveIncome *= effects.globalMultiplier;
        passiveIncome *= quantumEffects.globalMultiplier;
        passiveIncome += quantumEffects.passiveIncome;
        
        // Cap offline time to 24 hours
        const cappedOfflineTime = Math.min(offlineTime, 24 * 60 * 60 * 1000);
        const offlineEarnings = (passiveIncome * cappedOfflineTime) / 1000;
        
        if (offlineEarnings > 0) {
            this.gameState.bytes += offlineEarnings;
            this.gameState.totalBytes += offlineEarnings;
            this.gameState.stats.offlineEarnings += offlineEarnings;
            
            // Show offline earnings popup
            this.showOfflineEarningsPopup(offlineEarnings, cappedOfflineTime);
        }
    }

    showOfflineEarningsPopup(earnings, timeAway) {
        const popup = document.createElement('div');
        popup.className = 'offline-earnings-popup';
        popup.innerHTML = `
            <div class="offline-content">
                <h2>Welcome Back!</h2>
                <p>You were away for ${Utils.formatTime(timeAway)}</p>
                <p>You earned <strong>${Utils.formatNumber(earnings)} Bytes</strong> while offline!</p>
                <button onclick="this.parentElement.parentElement.remove()">Collect</button>
            </div>
        `;
        
        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        document.body.appendChild(popup);
    }
}

// Initialize game loop
const GameLoopInstance = new GameLoop();

// Export for other modules
window.GameLoop = GameLoopInstance;