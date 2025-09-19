// Data Stream - Neural Pattern Recognition Game

class DataStreamGame {
    constructor() {
        this.gameState = 'title'; // title, playing, paused, gameOver
        this.score = 0;
        this.level = 1;
        this.integrity = 100;
        this.patternsCompleted = 0;
        
        this.currentPattern = [];
        this.userInput = [];
        this.patternLength = 3;
        this.timeLimit = 5000; // milliseconds
        this.patternTimer = null;
        
        this.colors = ['color-1', 'color-2', 'color-3', 'color-4'];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateHUD();
    }
    
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('showHelp').addEventListener('click', () => {
            this.showHelp();
        });
        
        document.getElementById('startFromHelp').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('backToTitle').addEventListener('click', () => {
            this.showTitle();
        });
        
        document.getElementById('playAgain').addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });
        
        document.getElementById('backToMenu').addEventListener('click', () => {
            this.resetGame();
            this.showTitle();
        });
        
        // Game controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.toggleHelp();
            }
            
            if (this.gameState === 'playing') {
                if (e.key === ' ') {
                    e.preventDefault();
                    this.togglePause();
                }
                
                // Number keys for quick input
                if (['1', '2', '3', '4'].includes(e.key)) {
                    e.preventDefault();
                    this.inputPattern(parseInt(e.key));
                }
            }
        });
        
        // Pattern button clicks
        document.querySelectorAll('.pattern-button').forEach(button => {
            button.addEventListener('click', () => {
                if (this.gameState === 'playing') {
                    const value = parseInt(button.dataset.value);
                    this.inputPattern(value);
                    
                    // Visual feedback
                    button.classList.add('clicked');
                    setTimeout(() => button.classList.remove('clicked'), 300);
                }
            });
        });
    }
    
    showTitle() {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('titleScreen').classList.add('active');
        this.gameState = 'title';
    }
    
    showHelp() {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('helpScreen').classList.add('active');
    }
    
    toggleHelp() {
        if (this.gameState === 'playing') {
            const helpScreen = document.getElementById('helpScreen');
            const gameScreen = document.getElementById('gameScreen');
            
            if (helpScreen.classList.contains('active')) {
                helpScreen.classList.remove('active');
                gameScreen.classList.add('active');
            } else {
                gameScreen.classList.remove('active');
                helpScreen.classList.add('active');
            }
        }
    }
    
    startGame() {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('gameScreen').classList.add('active');
        document.getElementById('gameOver').classList.add('hidden');
        
        this.gameState = 'playing';
        this.generatePattern();
    }
    
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.integrity = 100;
        this.patternsCompleted = 0;
        this.patternLength = 3;
        this.timeLimit = 5000;
        this.currentPattern = [];
        this.userInput = [];
        
        if (this.patternTimer) {
            clearTimeout(this.patternTimer);
        }
        
        this.updateHUD();
        this.clearDisplays();
    }
    
    generatePattern() {
        this.currentPattern = [];
        this.userInput = [];
        
        // Generate random pattern
        for (let i = 0; i < this.patternLength; i++) {
            this.currentPattern.push(Math.floor(Math.random() * 4) + 1);
        }
        
        this.displayPattern();
        this.startPatternTimer();
        this.updateFeedback('Match the pattern sequence!');
    }
    
    displayPattern() {
        const patternContainer = document.getElementById('currentPattern');
        patternContainer.innerHTML = '';
        
        this.currentPattern.forEach((value, index) => {
            setTimeout(() => {
                const element = document.createElement('div');
                element.className = `pattern-element ${this.colors[value - 1]}`;
                element.textContent = value;
                patternContainer.appendChild(element);
            }, index * 300);
        });
        
        // Clear user input display
        document.getElementById('userInput').innerHTML = '';
    }
    
    startPatternTimer() {
        const progressBar = document.getElementById('patternProgress');
        progressBar.style.setProperty('--progress', '100%');
        
        // Animate progress bar
        let timeLeft = this.timeLimit;
        const interval = 50;
        
        const timer = setInterval(() => {
            timeLeft -= interval;
            const progress = (timeLeft / this.timeLimit) * 100;
            progressBar.style.setProperty('--progress', `${Math.max(0, progress)}%`);
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                this.timeUp();
            }
        }, interval);
        
        this.patternTimer = timer;
    }
    
    inputPattern(value) {
        if (this.gameState !== 'playing' || this.userInput.length >= this.currentPattern.length) {
            return;
        }
        
        this.userInput.push(value);
        this.updateUserInputDisplay();
        
        // Check if pattern is complete
        if (this.userInput.length === this.currentPattern.length) {
            this.checkPattern();
        }
    }
    
    updateUserInputDisplay() {
        const inputContainer = document.getElementById('userInput');
        inputContainer.innerHTML = '';
        
        this.userInput.forEach(value => {
            const element = document.createElement('div');
            element.className = `pattern-element ${this.colors[value - 1]}`;
            element.textContent = value;
            inputContainer.appendChild(element);
        });
    }
    
    checkPattern() {
        if (this.patternTimer) {
            clearTimeout(this.patternTimer);
        }
        
        const isCorrect = this.arraysEqual(this.currentPattern, this.userInput);
        
        if (isCorrect) {
            this.patternSuccess();
        } else {
            this.patternFailure();
        }
    }
    
    arraysEqual(a, b) {
        return a.length === b.length && a.every((val, index) => val === b[index]);
    }
    
    patternSuccess() {
        this.patternsCompleted++;
        
        // Calculate score
        const baseScore = 100;
        const levelBonus = this.level * 10;
        const timeBonus = Math.max(0, Math.floor((this.timeLimit - (5000 - this.getTimeLeft())) / 100));
        const totalScore = baseScore + levelBonus + timeBonus;
        
        this.score += totalScore;
        
        // Restore some integrity
        this.integrity = Math.min(100, this.integrity + 5);
        
        this.updateFeedback(`Perfect! +${totalScore} points`, 'success');
        this.updateHUD();
        
        // Level progression
        if (this.patternsCompleted % 5 === 0) {
            this.levelUp();
        }
        
        // Next pattern after delay
        setTimeout(() => {
            if (this.gameState === 'playing') {
                this.generatePattern();
            }
        }, 1500);
    }
    
    patternFailure() {
        this.integrity -= 20;
        this.updateFeedback('Pattern mismatch! Neural integrity decreased.', 'error');
        this.updateHUD();
        
        if (this.integrity <= 0) {
            this.gameOver();
        } else {
            // Try again after delay
            setTimeout(() => {
                if (this.gameState === 'playing') {
                    this.generatePattern();
                }
            }, 2000);
        }
    }
    
    timeUp() {
        this.patternFailure();
    }
    
    levelUp() {
        this.level++;
        this.patternLength = Math.min(8, 3 + Math.floor(this.level / 3));
        this.timeLimit = Math.max(3000, 5000 - (this.level - 1) * 200);
        
        this.updateFeedback(`Level ${this.level}! Pattern complexity increased.`, 'success');
        this.updateHUD();
    }
    
    getTimeLeft() {
        const progressBar = document.getElementById('patternProgress');
        const progress = parseFloat(progressBar.style.getPropertyValue('--progress') || '100');
        return (progress / 100) * this.timeLimit;
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            if (this.patternTimer) {
                clearTimeout(this.patternTimer);
            }
            this.updateFeedback('Game Paused - Press SPACE to continue');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.startPatternTimer();
            this.updateFeedback('Match the pattern sequence!');
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        if (this.patternTimer) {
            clearTimeout(this.patternTimer);
        }
        
        // Update final stats
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('patternsCompleted').textContent = this.patternsCompleted;
        
        // Show game over modal
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        
        const integrityFill = document.getElementById('integrityFill');
        integrityFill.style.width = `${this.integrity}%`;
        
        // Change integrity bar color based on level
        if (this.integrity > 60) {
            integrityFill.style.background = 'linear-gradient(90deg, #00ff88, #88ffaa)';
        } else if (this.integrity > 30) {
            integrityFill.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc44)';
        } else {
            integrityFill.style.background = 'linear-gradient(90deg, #ff0088, #ff4488)';
        }
    }
    
    updateFeedback(message, type = '') {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = type;
    }
    
    clearDisplays() {
        document.getElementById('currentPattern').innerHTML = '';
        document.getElementById('userInput').innerHTML = '';
        document.getElementById('patternProgress').style.setProperty('--progress', '0%');
        this.updateFeedback('');
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new DataStreamGame();
    window.game = game; // Make game accessible globally for debugging
});