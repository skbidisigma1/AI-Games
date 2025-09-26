// Byte Miner: Core Collapse - Main Game Controller

class ByteMinerGame {
    constructor() {
        this.gameState = null;
        this.initialized = false;
        this.currentTheme = 'terminal';
        this.activePanel = 'upgrades';
    }

    async init() {
        if (this.initialized) return;

        console.log('Initializing Byte Miner: Core Collapse...');

        try {
            // Load game state
            this.gameState = Storage.load();
            
        // Handle offline progress
        if (this.gameState.offlineTime) {
            GameLoopInstance.calculateOfflineProgress(this.gameState.offlineTime);
                delete this.gameState.offlineTime;
            }

            // Initialize UI
            this.initializeUI();
            
            // Apply saved theme
            this.applyTheme(this.gameState.settings.theme);
            
            // Start auto-save
            Storage.startAutoSave(this.gameState);
            
            // Start game loop
            GameLoopInstance.start(this.gameState);
            
            // Initialize quantum system if unlocked
            if (this.gameState.unlocks.quantumLab) {
                Quantum.isUnlocked = true;
            }
            
            this.initialized = true;
            console.log('Game initialized successfully!');
            
            // Show welcome message
            Utils.createNotification('Welcome to Byte Miner: Core Collapse!', 'success');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            Utils.createNotification('Failed to initialize game!', 'error');
        }
    }

    initializeUI() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize panels
        this.initializePanels();
        
        // Update all UI elements
        this.updateUI();
    }

    setupEventListeners() {
        // Mine button
        const mineButton = document.getElementById('mine-button');
        if (mineButton) {
            mineButton.addEventListener('click', (e) => {
                const clickPower = GameLoopInstance.performClick();
                
                // Add click animation
                mineButton.classList.add('clicked');
                setTimeout(() => mineButton.classList.remove('clicked'), 150);
                
                // Add screen shake for big clicks
                if (clickPower > 1000) {
                    document.body.classList.add('screen-shake');
                    setTimeout(() => document.body.classList.remove('screen-shake'), 500);
                }
            });
        }

        // Tab navigation
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                this.switchPanel(tabName);
            });
        });

        // Prestige button
        const prestigeButton = document.getElementById('prestige-button');
        if (prestigeButton) {
            prestigeButton.addEventListener('click', () => {
                if (Prestige.canPrestige(this.gameState)) {
                    this.showPrestigeConfirmation();
                }
            });
        }

        // Settings
        this.setupSettingsListeners();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Prevent context menu on mine button
        if (mineButton) {
            mineButton.addEventListener('contextmenu', (e) => e.preventDefault());
        }
    }

    setupSettingsListeners() {
        // Theme selector
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = this.gameState.settings.theme;
            themeSelect.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
                this.gameState.settings.theme = e.target.value;
            });
        }

        // Save/Load buttons
        const saveButton = document.getElementById('save-game');
        const loadButton = document.getElementById('load-game');
        const resetButton = document.getElementById('reset-game');
        const exportButton = document.getElementById('export-save');
        const importButton = document.getElementById('import-save');

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                Storage.save(this.gameState);
            });
        }

        if (loadButton) {
            loadButton.addEventListener('click', () => {
                this.gameState = Storage.load();
                this.updateUI();
                Utils.createNotification('Game loaded!', 'success');
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.showResetConfirmation();
            });
        }

        if (exportButton) {
            exportButton.addEventListener('click', () => {
                Storage.exportSave(this.gameState);
            });
        }

        if (importButton) {
            importButton.addEventListener('click', () => {
                this.showImportDialog();
            });
        }
    }

    initializePanels() {
        // Initialize upgrade panels
        this.initializeUpgradePanel();
        
        // Initialize achievement panel
        this.initializeAchievementPanel();
        
        // Initialize prestige panel
        this.initializePrestigePanel();
        
        // Initialize quantum panel
        this.initializeQuantumPanel();
    }

    initializeUpgradePanel() {
        // Create upgrade items for each tier
        for (let tier = 1; tier <= 5; tier++) {
            const upgrades = Upgrades.getUpgradesByTier(tier);
            const container = document.getElementById(`tier${tier}-upgrades`);
            
            if (!container) continue;
            
            for (const upgradeId in upgrades) {
                const upgrade = upgrades[upgradeId];
                const upgradeElement = this.createUpgradeElement(upgradeId, upgrade);
                container.appendChild(upgradeElement);
            }
        }
    }

    createUpgradeElement(upgradeId, upgrade) {
        const element = document.createElement('div');
        element.className = 'upgrade-item';
        element.setAttribute('data-upgrade-id', upgradeId);
        
        const level = this.gameState.upgrades[upgradeId] || 0;
        const cost = Upgrades.getUpgradeCost(upgradeId, level);
        const canAfford = Upgrades.canAffordUpgrade(upgradeId, this.gameState);
        
        element.innerHTML = `
            <div class="upgrade-info">
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-description">${upgrade.effect}</div>
                <div class="upgrade-flavor">${upgrade.flavor}</div>
            </div>
            <div class="upgrade-stats">
                <div class="upgrade-level">Level: ${level}</div>
                <div class="upgrade-effect">Next: +${this.calculateNextUpgradeEffect(upgradeId, level)}</div>
            </div>
            <button class="upgrade-button" ${!canAfford ? 'disabled' : ''}>
                ${this.formatUpgradeCost(upgradeId, cost)}
            </button>
        `;
        
        // Add event listener
        const button = element.querySelector('.upgrade-button');
        button.addEventListener('click', () => {
            this.purchaseUpgrade(upgradeId);
        });
        
        // Update visual state
        this.updateUpgradeElement(element, upgradeId);
        
        return element;
    }

    calculateNextUpgradeEffect(upgradeId, currentLevel) {
        const nextLevel = currentLevel + 1;
        const nextEffect = Upgrades.calculateUpgradeEffect(upgradeId, nextLevel);
        const currentEffect = Upgrades.calculateUpgradeEffect(upgradeId, currentLevel);
        const difference = nextEffect - currentEffect;
        
        const upgrade = Upgrades.getUpgrade(upgradeId);
        if (upgrade.effect.includes('%')) {
            return difference.toFixed(1) + '%';
        }
        return Utils.formatNumber(difference);
    }

    formatUpgradeCost(upgradeId, cost) {
        const upgrade = Upgrades.getUpgrade(upgradeId);
        const currency = upgrade.currency || 'bytes';
        
        let symbol = 'B';
        if (currency === 'fragments') symbol = 'F';
        if (currency === 'quantumKeys') symbol = 'Q';
        
        return Utils.formatNumber(cost) + ' ' + symbol;
    }

    purchaseUpgrade(upgradeId) {
        if (Upgrades.purchaseUpgrade(upgradeId, this.gameState)) {
            // Update UI
            this.updateUpgradeElement(document.querySelector(`[data-upgrade-id="${upgradeId}"]`), upgradeId);
            
            // Create purchase effect
            const element = document.querySelector(`[data-upgrade-id="${upgradeId}"]`);
            element.classList.add('upgrade-purchased');
            setTimeout(() => element.classList.remove('upgrade-purchased'), 500);
            
            Utils.createNotification(`Purchased: ${Upgrades.getUpgrade(upgradeId).name}`, 'success');
        } else {
            Utils.createNotification('Cannot afford upgrade!', 'warning');
        }
    }

    updateUpgradeElement(element, upgradeId) {
        if (!element) return;
        
        const upgrade = Upgrades.getUpgrade(upgradeId);
        const level = this.gameState.upgrades[upgradeId] || 0;
        const cost = Upgrades.getUpgradeCost(upgradeId, level);
        const canAfford = Upgrades.canAffordUpgrade(upgradeId, this.gameState);
        
        // Update level display
        const levelDisplay = element.querySelector('.upgrade-level');
        if (levelDisplay) {
            levelDisplay.textContent = `Level: ${level}`;
        }
        
        // Update effect display
        const effectDisplay = element.querySelector('.upgrade-effect');
        if (effectDisplay) {
            effectDisplay.textContent = `Next: +${this.calculateNextUpgradeEffect(upgradeId, level)}`;
        }
        
        // Update button
        const button = element.querySelector('.upgrade-button');
        if (button) {
            button.disabled = !canAfford;
            button.textContent = this.formatUpgradeCost(upgradeId, cost);
        }
        
        // Update visual state
        element.classList.toggle('affordable', canAfford);
        element.classList.toggle('locked', !upgrade.unlocked);
        
        // Hide if locked
        element.style.display = upgrade.unlocked ? 'grid' : 'none';
    }

    initializeAchievementPanel() {
        const container = document.getElementById('achievement-list');
        if (!container) return;
        
        for (const achievementId in Achievements.achievements) {
            const achievement = Achievements.achievements[achievementId];
            const achievementElement = this.createAchievementElement(achievementId, achievement);
            container.appendChild(achievementElement);
        }
    }

    createAchievementElement(achievementId, achievement) {
        const element = document.createElement('div');
        element.className = 'achievement-item';
        element.setAttribute('data-achievement-id', achievementId);
        
        const isUnlocked = this.gameState.achievements[achievementId] || false;
        const progress = Achievements.getAchievementProgress(achievementId, this.gameState);
        const progressPercent = Math.min((progress / achievement.target) * 100, 100);
        
        element.innerHTML = `
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-description">${achievement.description}</div>
            <div class="achievement-reward">Reward: ${achievement.reward}</div>
            <div class="achievement-flavor">${achievement.flavor}</div>
            <div class="achievement-progress">
                Progress: ${Utils.formatNumber(progress)}/${Utils.formatNumber(achievement.target)} (${progressPercent.toFixed(1)}%)
            </div>
        `;
        
        if (isUnlocked) {
            element.classList.add('unlocked');
        }
        
        return element;
    }

    initializePrestigePanel() {
        // Prestige upgrades are handled similar to regular upgrades
        const container = document.getElementById('tier4-upgrades');
        if (!container) return;
        
        const prestigeUpgrades = Upgrades.getUpgradesByTier(4);
        for (const upgradeId in prestigeUpgrades) {
            const upgrade = prestigeUpgrades[upgradeId];
            const upgradeElement = this.createUpgradeElement(upgradeId, upgrade);
            container.appendChild(upgradeElement);
        }
    }

    initializeQuantumPanel() {
        const container = document.getElementById('tier5-upgrades');
        if (!container) return;
        
        const quantumUpgrades = Upgrades.getUpgradesByTier(5);
        for (const upgradeId in quantumUpgrades) {
            const upgrade = quantumUpgrades[upgradeId];
            const upgradeElement = this.createUpgradeElement(upgradeId, upgrade);
            container.appendChild(upgradeElement);
        }
    }

    switchPanel(panelName) {
        // Hide all panels
        const panels = document.querySelectorAll('.panel');
        panels.forEach(panel => panel.classList.remove('active'));
        
        // Remove active class from all tabs
        const tabs = document.querySelectorAll('.tab-button');
        tabs.forEach(tab => tab.classList.remove('active'));
        
        // Show selected panel
        const targetPanel = document.getElementById(`${panelName}-panel`);
        const targetTab = document.querySelector(`[data-tab="${panelName}"]`);
        
        if (targetPanel) targetPanel.classList.add('active');
        if (targetTab) targetTab.classList.add('active');
        
        this.activePanel = panelName;
        
        // Update panel content
        this.updatePanelContent(panelName);
    }

    updatePanelContent(panelName) {
        switch (panelName) {
            case 'upgrades':
                this.updateUpgradePanel();
                break;
            case 'achievements':
                this.updateAchievementPanel();
                break;
            case 'prestige':
                this.updatePrestigePanel();
                break;
            case 'quantum':
                this.updateQuantumPanel();
                break;
        }
    }

    updateUpgradePanel() {
        // Update all upgrade elements
        const upgradeElements = document.querySelectorAll('.upgrade-item');
        upgradeElements.forEach(element => {
            const upgradeId = element.getAttribute('data-upgrade-id');
            this.updateUpgradeElement(element, upgradeId);
        });
    }

    updateAchievementPanel() {
        const achievementElements = document.querySelectorAll('.achievement-item');
        achievementElements.forEach(element => {
            const achievementId = element.getAttribute('data-achievement-id');
            const achievement = Achievements.achievements[achievementId];
            const isUnlocked = this.gameState.achievements[achievementId] || false;
            const progress = Achievements.getAchievementProgress(achievementId, this.gameState);
            const progressPercent = Math.min((progress / achievement.target) * 100, 100);
            
            const progressDisplay = element.querySelector('.achievement-progress');
            if (progressDisplay) {
                progressDisplay.textContent = `Progress: ${Utils.formatNumber(progress)}/${Utils.formatNumber(achievement.target)} (${progressPercent.toFixed(1)}%)`;
            }
            
            element.classList.toggle('unlocked', isUnlocked);
        });
    }

    updatePrestigePanel() {
        this.updateUpgradePanel(); // Prestige upgrades use same system
    }

    updateQuantumPanel() {
        // Update quantum status
        const quantumStatus = document.getElementById('quantum-unlocked');
        if (quantumStatus) {
            quantumStatus.textContent = (this.gameState.unlocks.quantumLab || Quantum.isUnlocked) ? 'Active' : 'Locked';
        }
        
        this.updateUpgradePanel(); // Quantum upgrades use same system
    }

    updateUI() {
        // Update main counters and stats (handled by GameLoop)
        
        // Update current panel
        this.updatePanelContent(this.activePanel);
        
        // Update tier visibility
        this.updateTierVisibility();
    }

    updateTierVisibility() {
        // Show/hide tiers based on unlocks
        const tier2Section = document.getElementById('tier2');
        const tier3Section = document.getElementById('tier3');
        const tier4Section = document.getElementById('tier4');
        const tier5Section = document.getElementById('tier5');
        
        if (tier2Section) tier2Section.style.display = this.gameState.unlocks.tier2 ? 'block' : 'none';
        if (tier3Section) tier3Section.style.display = this.gameState.unlocks.tier3 ? 'block' : 'none';
        if (tier4Section) tier4Section.style.display = this.gameState.unlocks.tier4 ? 'block' : 'none';
        if (tier5Section) tier5Section.style.display = this.gameState.unlocks.tier5 ? 'block' : 'none';
    }

    applyTheme(themeName) {
        document.body.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;
        
        // Update theme in game state
        if (this.gameState) {
            this.gameState.settings.theme = themeName;
        }
    }

    handleKeyboardShortcuts(e) {
        // Space bar to click
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            GameLoopInstance.performClick();
        }
        
        // Number keys for tab switching
        if (e.code >= 'Digit1' && e.code <= 'Digit5') {
            const tabIndex = parseInt(e.code.replace('Digit', '')) - 1;
            const tabs = ['upgrades', 'achievements', 'prestige', 'quantum', 'settings'];
            if (tabs[tabIndex]) {
                this.switchPanel(tabs[tabIndex]);
            }
        }
        
        // P for prestige
        if (e.code === 'KeyP' && Prestige.canPrestige(this.gameState)) {
            this.showPrestigeConfirmation();
        }
    }

    showPrestigeConfirmation() {
        const fragments = Prestige.calculateFragmentsGained(this.gameState);
        const confirmation = confirm(
            `Are you sure you want to perform Core Collapse?\n\n` +
            `You will gain ${fragments} Core Fragments.\n` +
            `All progress except prestige upgrades will be reset.`
        );
        
        if (confirmation) {
            Prestige.doPrestige(this.gameState);
            this.updateUI();
        }
    }

    showResetConfirmation() {
        const confirmation = confirm(
            'Are you sure you want to reset your game?\n\n' +
            'ALL progress will be lost and cannot be recovered!'
        );
        
        if (confirmation) {
            Storage.clearAllData();
            location.reload();
        }
    }

    showImportDialog() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt';
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const importedData = Storage.importSave(e.target.result);
                if (importedData) {
                    this.gameState = importedData;
                    this.updateUI();
                }
            };
            reader.readAsText(file);
        };
        
        fileInput.click();
    }

    // Game state methods
    getGameState() {
        return this.gameState;
    }

    // Debug methods
    addBytes(amount) {
        if (this.gameState) {
            this.gameState.bytes += amount;
            this.gameState.totalBytes += amount;
        }
    }

    addFragments(amount) {
        if (this.gameState) {
            this.gameState.coreFragments += amount;
        }
    }

    addQuantumKeys(amount) {
        if (this.gameState) {
            this.gameState.quantumKeys += amount;
        }
    }
}

// Add click animation style
const clickStyle = document.createElement('style');
clickStyle.textContent = `
    .clicked {
        transform: scale(0.95) !important;
        transition: transform 0.1s ease !important;
    }
    
    .offline-earnings-popup {
        font-family: 'JetBrains Mono', monospace;
    }
    
    .offline-content {
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: 8px;
        padding: 30px;
        text-align: center;
        max-width: 400px;
    }
    
    .offline-content h2 {
        color: var(--text-primary);
        margin-bottom: 15px;
    }
    
    .offline-content p {
        color: var(--text-secondary);
        margin-bottom: 10px;
    }
    
    .offline-content button {
        font-family: inherit;
        font-size: 1.2rem;
        padding: 15px 30px;
        background: var(--button-bg);
        color: var(--text-primary);
        border: 2px solid var(--border);
        border-radius: 6px;
        cursor: pointer;
        margin-top: 15px;
        transition: all 0.2s ease;
    }
    
    .offline-content button:hover {
        background: var(--button-hover);
        box-shadow: 0 0 10px rgba(0, 255, 65, 0.2);
    }
`;
document.head.appendChild(clickStyle);

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.game = new ByteMinerGame();
    await window.game.init();
});

// Handle page visibility for pause/resume
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause some effects
        console.log('Game paused');
    } else {
        // Page is visible, resume
        console.log('Game resumed');
    }
});

// Export for debugging
window.ByteMinerGame = ByteMinerGame;