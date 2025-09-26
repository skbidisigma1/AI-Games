/**
 * Geometry Crash - A rhythm-based platformer inspired by Geometry Dash
 */

class GeometryCrashGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'title'; // 'title', 'playing', 'gameOver', 'complete'
        this.currentMode = 'cube'; // 'cube', 'ship', 'ball'
        
        // Game settings
        this.GAME_SPEED = 5; // Forward movement speed
        this.GRAVITY = 0.8;
        this.JUMP_FORCE = -16;
        this.SHIP_THRUST = 0.7;
        this.SHIP_DRAG = 0.95;
        
        // Player object
        this.player = {
            x: 100,
            y: 300,
            width: 24,
            height: 24,
            vx: 0,
            vy: 0,
            onGround: false,
            mode: 'cube',
            rotation: 0,
            gravityFlipped: false
        };
        
        // Game state
        this.camera = { x: 0, y: 0 };
        this.progress = 0; // 0-100%
        this.attempts = 1;
        this.bestProgress = 0;
        this.levelLength = 6000; // Total level length in pixels
        this.particles = [];
        this.backgroundMusic = null;
        this.keys = {};
        this.mouseDown = false;
        
        // Level data - will be populated with obstacles, platforms, and mode changes
        this.levelData = [];
        this.modePortals = [];
        
        // Initialize
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateLevel();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Mouse and touch events
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.handleInput();
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.mouseDown = false;
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mouseDown = true;
            this.handleInput();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mouseDown = false;
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // UI event listeners
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('restartGame').addEventListener('click', () => this.restartGame());
        document.getElementById('backToMenu').addEventListener('click', () => this.backToMenu());
        document.getElementById('playAgain').addEventListener('click', () => this.restartGame());
        document.getElementById('backToMenuComplete').addEventListener('click', () => this.backToMenu());
        document.getElementById('uploadMusic').addEventListener('click', () => this.uploadMusic());
        
        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMode = btn.dataset.mode;
            });
        });
        
        // Music upload
        document.getElementById('musicUpload').addEventListener('change', (e) => {
            this.handleMusicUpload(e);
        });
    }
    
    handleInput() {
        if (this.gameState !== 'playing') return;
        
        this.playSound('clickSound');
        
        switch (this.player.mode) {
            case 'cube':
                if (this.player.onGround) {
                    this.player.vy = this.player.gravityFlipped ? this.JUMP_FORCE : -this.JUMP_FORCE;
                    this.player.onGround = false;
                }
                break;
                
            case 'ship':
                // Ship mode - continuous thrust when held
                if (this.mouseDown || this.keys['Space']) {
                    this.player.vy -= this.SHIP_THRUST * (this.player.gravityFlipped ? -1 : 1);
                }
                break;
                
            case 'ball':
                // Ball mode - flip gravity on each click
                this.player.gravityFlipped = !this.player.gravityFlipped;
                this.player.vy = 0; // Reset velocity when flipping
                break;
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.resetPlayer();
        this.camera.x = 0;
        this.progress = 0;
        this.updateUI();
        
        // Hide title screen, show game screen
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        
        // Start background music
        this.playBackgroundMusic();
    }
    
    restartGame() {
        this.attempts++;
        this.gameState = 'playing';
        this.resetPlayer();
        this.camera.x = 0;
        this.progress = 0;
        this.particles = [];
        
        // Hide dialogs
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('levelComplete').classList.add('hidden');
        
        this.updateUI();
        this.playBackgroundMusic();
    }
    
    backToMenu() {
        this.gameState = 'title';
        this.resetPlayer();
        this.camera.x = 0;
        this.progress = 0;
        this.attempts = 1;
        this.bestProgress = 0;
        this.particles = [];
        
        // Show title screen, hide game screen
        document.getElementById('titleScreen').classList.add('active');
        document.getElementById('gameScreen').classList.remove('active');
        
        // Hide dialogs
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('levelComplete').classList.add('hidden');
        
        // Stop music
        this.stopBackgroundMusic();
    }
    
    resetPlayer() {
        this.player.x = 100;
        this.player.y = 300;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.onGround = false;
        this.player.rotation = 0;
        this.player.gravityFlipped = false;
        this.player.mode = this.currentMode;
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update camera to follow player
        this.camera.x = this.player.x - 200;
        
        // Update progress
        this.progress = Math.min(100, (this.camera.x / (this.levelLength - this.canvas.width)) * 100);
        this.updateUI();
        
        // Update player physics
        this.updatePlayer();
        
        // Update particles
        this.updateParticles();
        
        // Check collisions
        this.checkCollisions();
        
        // Check mode portals
        this.checkModePortals();
        
        // Check level completion
        if (this.progress >= 100) {
            this.levelComplete();
        }
    }
    
    updatePlayer() {
        // Move forward automatically
        this.player.x += this.GAME_SPEED;
        
        // Handle ship mode continuous thrust
        if (this.player.mode === 'ship' && (this.mouseDown || this.keys['Space'])) {
            this.player.vy -= this.SHIP_THRUST * (this.player.gravityFlipped ? -1 : 1);
        }
        
        // Apply gravity
        const gravityDirection = this.player.gravityFlipped ? -1 : 1;
        this.player.vy += this.GRAVITY * gravityDirection;
        
        // Apply ship drag
        if (this.player.mode === 'ship') {
            this.player.vy *= this.SHIP_DRAG;
        }
        
        // Update position
        this.player.y += this.player.vy;
        
        // Update rotation for visual effect
        if (this.player.mode === 'cube' && !this.player.onGround) {
            this.player.rotation += 0.15;
        } else if (this.player.mode === 'ball') {
            this.player.rotation += 0.2;
        } else if (this.player.mode === 'ship') {
            // Ship tilts based on vertical velocity
            this.player.rotation = this.player.vy * 0.02;
        }
        
        // Check boundaries
        if (this.player.y > this.canvas.height + 100 || this.player.y < -100) {
            this.playerDeath();
        }
        
        // Ground collision (simple floor)
        if (this.player.y > this.canvas.height - 100 - this.player.height) {
            if (!this.player.gravityFlipped) {
                this.player.y = this.canvas.height - 100 - this.player.height;
                this.player.vy = 0;
                this.player.onGround = true;
                this.player.rotation = 0;
            }
        }
        
        // Ceiling collision
        if (this.player.y < 50) {
            if (this.player.gravityFlipped) {
                this.player.y = 50;
                this.player.vy = 0;
                this.player.onGround = true;
                this.player.rotation = 0;
            }
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
    }
    
    checkCollisions() {
        const playerRect = {
            x: this.player.x,
            y: this.player.y,
            width: this.player.width,
            height: this.player.height
        };
        
        // Check collision with level obstacles
        for (let obstacle of this.levelData) {
            if (this.isColliding(playerRect, obstacle)) {
                this.playerDeath();
                return;
            }
        }
    }
    
    checkModePortals() {
        const playerRect = {
            x: this.player.x,
            y: this.player.y,
            width: this.player.width,
            height: this.player.height
        };
        
        for (let portal of this.modePortals) {
            if (!portal.used && this.isColliding(playerRect, portal)) {
                this.player.mode = portal.mode;
                portal.used = true;
                this.createParticles(portal.x + portal.width/2, portal.y + portal.height/2, portal.color, 20);
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    playerDeath() {
        this.gameState = 'gameOver';
        this.bestProgress = Math.max(this.bestProgress, this.progress);
        
        // Create death particles
        this.createParticles(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#ff4444', 30);
        
        // Show game over dialog
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('bestProgress').textContent = Math.floor(this.bestProgress) + '%';
        
        this.playSound('deathSound');
        this.stopBackgroundMusic();
    }
    
    levelComplete() {
        this.gameState = 'complete';
        
        // Show completion dialog
        document.getElementById('levelComplete').classList.remove('hidden');
        document.getElementById('finalAttempts').textContent = this.attempts;
        
        this.playSound('completeSound');
        this.stopBackgroundMusic();
    }
    
    createParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: color,
                life: 60,
                maxLife: 60,
                alpha: 1,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    generateLevel() {
        this.levelData = [];
        this.modePortals = [];
        
        // Generate obstacles throughout the level
        for (let x = 300; x < this.levelLength; x += 50) {
            // Random spike generation
            if (Math.random() < 0.3) {
                this.levelData.push({
                    x: x,
                    y: this.canvas.height - 100 - 30,
                    width: 20,
                    height: 30,
                    type: 'spike'
                });
            }
            
            // Random platform generation
            if (Math.random() < 0.2) {
                const platformY = 200 + Math.random() * 200;
                this.levelData.push({
                    x: x,
                    y: platformY,
                    width: 100,
                    height: 20,
                    type: 'platform'
                });
                
                // Add spike on platform sometimes
                if (Math.random() < 0.4) {
                    this.levelData.push({
                        x: x + 40,
                        y: platformY - 30,
                        width: 20,
                        height: 30,
                        type: 'spike'
                    });
                }
            }
            
            // Ceiling spikes
            if (Math.random() < 0.15) {
                this.levelData.push({
                    x: x,
                    y: 50,
                    width: 20,
                    height: 30,
                    type: 'spike'
                });
            }
        }
        
        // Add mode portals at specific points
        this.modePortals.push({
            x: 800,
            y: 250,
            width: 40,
            height: 60,
            mode: 'ship',
            color: '#44aaff',
            used: false
        });
        
        this.modePortals.push({
            x: 2000,
            y: 250,
            width: 40,
            height: 60,
            mode: 'ball',
            color: '#ffaa44',
            used: false
        });
        
        this.modePortals.push({
            x: 3500,
            y: 250,
            width: 40,
            height: 60,
            mode: 'cube',
            color: '#44ff44',
            used: false
        });
        
        this.modePortals.push({
            x: 4500,
            y: 250,
            width: 40,
            height: 60,
            mode: 'ship',
            color: '#44aaff',
            used: false
        });
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        if (this.gameState === 'playing' || this.gameState === 'gameOver' || this.gameState === 'complete') {
            // Draw level elements
            this.drawLevel();
            
            // Draw mode portals
            this.drawModePortals();
            
            // Draw player
            this.drawPlayer();
            
            // Draw particles
            this.drawParticles();
        }
    }
    
    drawBackground() {
        // Draw ground
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(-this.camera.x, this.canvas.height - 100, this.levelLength + 200, 100);
        
        // Draw ceiling
        this.ctx.fillStyle = '#4169E1';
        this.ctx.fillRect(-this.camera.x, 0, this.levelLength + 200, 50);
        
        // Draw grid lines for visual effect
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.levelLength; x += 100) {
            const screenX = x - this.camera.x;
            if (screenX > -50 && screenX < this.canvas.width + 50) {
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, 0);
                this.ctx.lineTo(screenX, this.canvas.height);
                this.ctx.stroke();
            }
        }
    }
    
    drawLevel() {
        this.ctx.fillStyle = '#ff4444';
        
        for (let obstacle of this.levelData) {
            const screenX = obstacle.x - this.camera.x;
            
            // Only draw if on screen
            if (screenX > -obstacle.width && screenX < this.canvas.width) {
                if (obstacle.type === 'spike') {
                    this.drawSpike(screenX, obstacle.y, obstacle.width, obstacle.height);
                } else if (obstacle.type === 'platform') {
                    this.ctx.fillStyle = '#666666';
                    this.ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
                    this.ctx.fillStyle = '#ff4444';
                }
            }
        }
    }
    
    drawSpike(x, y, width, height) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + height);
        this.ctx.lineTo(x + width/2, y);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawModePortals() {
        for (let portal of this.modePortals) {
            const screenX = portal.x - this.camera.x;
            
            // Only draw if on screen and not used
            if (!portal.used && screenX > -portal.width && screenX < this.canvas.width) {
                this.ctx.fillStyle = portal.color;
                this.ctx.fillRect(screenX, portal.y, portal.width, portal.height);
                
                // Draw mode icon
                this.ctx.fillStyle = 'white';
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                const icon = portal.mode === 'cube' ? '🟦' : portal.mode === 'ship' ? '🚀' : '⚽';
                this.ctx.fillText(icon, screenX + portal.width/2, portal.y + portal.height/2 + 7);
            }
        }
    }
    
    drawPlayer() {
        const screenX = this.player.x - this.camera.x;
        
        this.ctx.save();
        this.ctx.translate(screenX + this.player.width/2, this.player.y + this.player.height/2);
        
        if (this.player.gravityFlipped) {
            this.ctx.scale(1, -1);
        }
        
        this.ctx.rotate(this.player.rotation);
        
        // Draw based on mode
        switch (this.player.mode) {
            case 'cube':
                this.ctx.fillStyle = '#44ff44';
                this.ctx.fillRect(-this.player.width/2, -this.player.height/2, this.player.width, this.player.height);
                break;
                
            case 'ship':
                this.ctx.fillStyle = '#44aaff';
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.width/2, 0);
                this.ctx.lineTo(-this.player.width/2, -this.player.height/2);
                this.ctx.lineTo(-this.player.width/4, 0);
                this.ctx.lineTo(-this.player.width/2, this.player.height/2);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'ball':
                this.ctx.fillStyle = '#ffaa44';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, this.player.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                break;
        }
        
        this.ctx.restore();
    }
    
    drawParticles() {
        for (let particle of this.particles) {
            const screenX = particle.x - this.camera.x;
            
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(screenX, particle.y, particle.size, particle.size);
            this.ctx.restore();
        }
    }
    
    updateUI() {
        document.getElementById('progressPercent').textContent = Math.floor(this.progress) + '%';
        document.getElementById('progressFill').style.width = this.progress + '%';
        document.getElementById('currentMode').textContent = this.player.mode.toUpperCase();
        document.getElementById('attemptCount').textContent = this.attempts;
    }
    
    // Audio methods
    playSound(soundId) {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {}); // Ignore autoplay restrictions
        }
    }
    
    playBackgroundMusic() {
        const music = document.getElementById('backgroundMusic');
        if (music) {
            music.currentTime = 0;
            music.play().catch(() => {}); // Ignore autoplay restrictions
        }
    }
    
    stopBackgroundMusic() {
        const music = document.getElementById('backgroundMusic');
        if (music) {
            music.pause();
        }
    }
    
    uploadMusic() {
        document.getElementById('musicUpload').click();
    }
    
    handleMusicUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const music = document.getElementById('backgroundMusic');
            music.src = url;
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new GeometryCrashGame();
});