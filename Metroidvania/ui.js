/**
 * UI Manager for Lost Citadel - Handles all user interface interactions
 */

class UIManager {
    constructor(game) {
        this.game = game;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Title screen buttons
        const startButton = document.getElementById('startGame');
        const loadButton = document.getElementById('loadGame');
        const showControlsButton = document.getElementById('showControls');
        const backFromControlsButton = document.getElementById('backFromControls');

        // Main menu buttons
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.startNewGame();
            });
        }

        if (loadButton) {
            loadButton.addEventListener('click', () => {
                this.loadGame();
            });
        }

        if (showControlsButton) {
            showControlsButton.addEventListener('click', () => {
                this.showControls();
            });
        }

        if (backFromControlsButton) {
            backFromControlsButton.addEventListener('click', () => {
                this.backToTitle();
            });
        }

        // Game control buttons
        const resumeButton = document.getElementById('resumeGame');
        const saveButton = document.getElementById('saveGame');
        const mainMenuButton = document.getElementById('mainMenu');
        const respawnButton = document.getElementById('respawn');
        const returnToMenuButton = document.getElementById('returnToMenu');
        const backToTitleButton = document.getElementById('backToTitle');

        if (resumeButton) {
            resumeButton.addEventListener('click', () => {
                this.resumeGame();
            });
        }

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveGame();
            });
        }

        if (mainMenuButton) {
            mainMenuButton.addEventListener('click', () => {
                this.backToTitle();
            });
        }

        if (respawnButton) {
            respawnButton.addEventListener('click', () => {
                this.respawn();
            });
        }

        if (returnToMenuButton) {
            returnToMenuButton.addEventListener('click', () => {
                this.backToTitle();
            });
        }

        if (backToTitleButton) {
            backToTitleButton.addEventListener('click', () => {
                this.backToTitle();
            });
        }
    }

    startNewGame() {
        console.log('Starting new game...');
        this.hideAllScreens();
        this.showScreen('gameScreen');
        this.game.state.setState('playing');
        // Initialize game components if they exist
        if (this.game.startNewGame) {
            this.game.startNewGame();
        }
    }

    loadGame() {
        console.log('Loading game...');
        if (this.game.saveManager && this.game.saveManager.exists()) {
            this.game.loadGame();
            this.hideAllScreens();
            this.showScreen('gameScreen');
            this.game.state.setState('playing');
        } else {
            alert('No saved game found!');
        }
    }

    showControls() {
        console.log('Showing controls...');
        this.hideAllScreens();
        this.showScreen('controlsScreen');
    }

    backToTitle() {
        console.log('Returning to title screen...');
        this.hideAllScreens();
        this.showScreen('titleScreen');
        this.game.state.setState('title');
        // Reset game state if needed
        if (this.game.returnToTitle) {
            this.game.returnToTitle();
        }
    }

    resumeGame() {
        console.log('Resuming game...');
        this.hideDialog('pauseMenu');
        this.game.state.setState('playing');
    }

    saveGame() {
        console.log('Saving game...');
        if (this.game.saveGame) {
            this.game.saveGame();
        }
        alert('Game saved!');
    }

    respawn() {
        console.log('Respawning player...');
        this.hideDialog('deathScreen');
        if (this.game.player && this.game.world) {
            // Reset player to last safe position
            this.game.player.respawn();
            this.game.state.setState('playing');
        }
    }

    hideAllScreens() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
    }

    showScreen(screenId) {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    }

    hideDialog(dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.classList.add('hidden');
        }
    }

    showDialog(dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.classList.remove('hidden');
        }
    }

    // Update UI elements based on game state
    updateHUD() {
        if (!this.game.player) return;

        // Update health bar
        const healthFill = document.getElementById('healthFill');
        if (healthFill && this.game.player.health !== undefined) {
            const healthPercent = (this.game.player.health / this.game.player.maxHealth) * 100;
            healthFill.style.width = `${healthPercent}%`;
        }

        // Update energy bar
        const energyFill = document.getElementById('energyFill');
        if (energyFill && this.game.player.energy !== undefined) {
            const energyPercent = (this.game.player.energy / this.game.player.maxEnergy) * 100;
            energyFill.style.width = `${energyPercent}%`;
        }

        // Update ability icons
        if (this.game.player.abilities) {
            const wallJumpIcon = document.getElementById('wallJumpIcon');
            const dashIcon = document.getElementById('dashIcon');
            const doubleJumpIcon = document.getElementById('doubleJumpIcon');

            if (wallJumpIcon) {
                wallJumpIcon.style.opacity = this.game.player.abilities.wallJump ? '1' : '0.3';
            }
            if (dashIcon) {
                dashIcon.style.opacity = this.game.player.abilities.dash ? '1' : '0.3';
            }
            if (doubleJumpIcon) {
                doubleJumpIcon.style.opacity = this.game.player.abilities.doubleJump ? '1' : '0.3';
            }
        }
    }

    // Show pause menu
    showPauseMenu() {
        this.showDialog('pauseMenu');
        this.game.state.setState('paused');
    }

    // Show death screen
    showDeathScreen() {
        this.showDialog('deathScreen');
        this.game.state.setState('dead');
    }

    // Show victory screen
    showVictoryScreen(stats = {}) {
        this.showDialog('victoryScreen');
        this.game.state.setState('victory');
        
        // Update victory stats if provided
        if (stats.completionTime) {
            const timeElement = document.getElementById('completionTime');
            if (timeElement) timeElement.textContent = stats.completionTime;
        }
        if (stats.areasExplored) {
            const areasElement = document.getElementById('areasExplored');
            if (areasElement) areasElement.textContent = stats.areasExplored;
        }
        if (stats.secretsFound) {
            const secretsElement = document.getElementById('secretsFound');
            if (secretsElement) secretsElement.textContent = stats.secretsFound;
        }
    }
}

// Make UIManager available globally
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}