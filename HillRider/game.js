class HillRiderGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'title'; // 'title', 'playing', 'paused', 'gameOver'
        this.score = 0;
        this.distance = 0;
        this.coins = 0;
        this.startTime = 0;
        
        // Settings
        this.settings = {
            sound: true,
            music: true,
            quality: 'medium',
            difficulty: 'normal'
        };
        
        // Game objects
        this.player = null;
        this.terrain = null;
        this.camera = null;
        this.collectibles = [];
        this.powerups = [];
        this.particles = [];
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false };
        this.isAccelerating = false;
        
        // High scores
        this.highScores = this.loadHighScores();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.updateHighScoresDisplay();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Title screen buttons
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('showHighScores').addEventListener('click', () => this.showHighScores());
        document.getElementById('showSettings').addEventListener('click', () => this.showSettings());
        
        // Game over buttons
        document.getElementById('restartGame').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenu').addEventListener('click', () => this.showTitle());
        
        // Pause menu buttons
        document.getElementById('resumeGame').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartFromPause').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenuFromPause').addEventListener('click', () => this.showTitle());
        
        // High scores buttons
        document.getElementById('clearHighScores').addEventListener('click', () => this.clearHighScores());
        document.getElementById('backFromHighScores').addEventListener('click', () => this.showTitle());
        
        // Settings buttons
        document.getElementById('backFromSettings').addEventListener('click', () => this.showTitle());
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.settings.sound = e.target.checked;
            this.saveSettings();
        });
        document.getElementById('musicToggle').addEventListener('change', (e) => {
            this.settings.music = e.target.checked;
            this.saveSettings();
        });
        document.getElementById('qualitySelect').addEventListener('change', (e) => {
            this.settings.quality = e.target.value;
            this.saveSettings();
        });
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            this.settings.difficulty = e.target.value;
            this.saveSettings();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (this.gameState === 'playing') {
                if (e.key === ' ' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.startAccelerating();
                }
                if (e.key === 'Escape') {
                    this.pauseGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            
            if (this.gameState === 'playing') {
                if (e.key === ' ' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.stopAccelerating();
                }
            }
        });
        
        // Mouse/touch controls
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameState === 'playing') {
                this.startAccelerating();
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (this.gameState === 'playing') {
                this.stopAccelerating();
            }
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.startAccelerating();
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.stopAccelerating();
            }
        });
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    startAccelerating() {
        this.isAccelerating = true;
        document.getElementById('actionHint').textContent = 'RELEASE TO COAST';
        this.playSound('accelerateSound');
    }
    
    stopAccelerating() {
        this.isAccelerating = false;
        document.getElementById('actionHint').textContent = 'HOLD TO ACCELERATE';
        this.stopSound('accelerateSound');
    }
    
    createPlayer() {
        // Start player on a hill for momentum building
        const startX = 100;
        const startY = this.canvas.height * 0.4; // Start higher up on a hill
        
        this.player = {
            x: startX,
            y: startY,
            radius: 15, // Changed to radius for circular player
            velocityX: 0,
            velocityY: 0,
            maxSpeed: 20,
            acceleration: 0.5,
            friction: 0.995, // Reduced friction for better momentum
            gravity: 0.6, // Increased gravity for better physics
            momentum: 0,
            maxMomentum: 100,
            onGround: false,
            angle: 0,
            trail: [],
            color: '#3498db'
        };
    }
    
    createTerrain() {
        this.terrain = {
            points: [],
            segments: [],
            width: 100, // Reduced distance between points for smoother collision
            amplitude: 120, // Hill height variation
            frequency: 0.015, // Hill frequency
            offset: 0,
            seed: Math.random() * 1000
        };
        
        this.generateTerrain();
    }
    
    generateTerrain() {
        const startX = -200; // Start before player position
        const endX = startX + this.canvas.width * 4; // Generate more terrain
        const baseHeight = this.canvas.height * 0.6;
        
        // Clear existing points
        this.terrain.points = [];
        
        // Generate terrain starting with a downhill slope for momentum
        for (let x = startX; x <= endX; x += this.terrain.width) {
            let y;
            
            if (x < 200) {
                // Create initial downhill slope for momentum building
                const slopeProgress = (x - startX) / (200 - startX);
                const startHeight = this.canvas.height * 0.3; // Start high
                const endHeight = this.canvas.height * 0.7; // End lower
                y = startHeight + (endHeight - startHeight) * slopeProgress;
                
                // Add small variations
                const noise = this.noise(x * this.terrain.frequency + this.terrain.seed) * 30;
                y += noise;
            } else {
                // Normal procedural terrain generation
                const difficultyFactor = Math.min((x - 200) / 5000, 2);
                const currentAmplitude = this.terrain.amplitude * (1 + difficultyFactor);
                
                // Use multiple noise octaves for realistic terrain
                const noise1 = this.noise(x * this.terrain.frequency + this.terrain.seed);
                const noise2 = this.noise(x * this.terrain.frequency * 2 + this.terrain.seed) * 0.5;
                const noise3 = this.noise(x * this.terrain.frequency * 4 + this.terrain.seed) * 0.25;
                
                const combinedNoise = noise1 + noise2 + noise3;
                y = baseHeight + combinedNoise * currentAmplitude;
            }
            
            this.terrain.points.push({ x, y });
        }
        
        // Create segments for collision detection
        this.updateTerrainSegments();
    }
    
    updateTerrainSegments() {
        this.terrain.segments = [];
        for (let i = 0; i < this.terrain.points.length - 1; i++) {
            this.terrain.segments.push({
                x1: this.terrain.points[i].x,
                y1: this.terrain.points[i].y,
                x2: this.terrain.points[i + 1].x,
                y2: this.terrain.points[i + 1].y
            });
        }
    }
    
    // Simple noise function for terrain generation
    noise(x) {
        const intX = Math.floor(x);
        const fracX = x - intX;
        
        const a = this.random(intX);
        const b = this.random(intX + 1);
        
        // Smooth interpolation
        const u = fracX * fracX * (3.0 - 2.0 * fracX);
        return a * (1 - u) + b * u;
    }
    
    // Deterministic random function
    random(x) {
        x = Math.sin(x) * 43758.5453;
        return (x - Math.floor(x)) * 2 - 1; // Return value between -1 and 1
    }
    
    createCamera() {
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            smoothness: 0.1,
            offsetX: this.canvas.width * 0.3, // Keep player left of center
            offsetY: this.canvas.height * 0.5,
            shake: 0,
            shakeDecay: 0.9
        };
    }
    
    spawnCollectibles() {
        // Remove coins that are far behind
        this.collectibles = this.collectibles.filter(coin => 
            coin.x > this.camera.x - this.canvas.width
        );
        
        // Spawn new coins ahead of the player
        const spawnDistance = this.player.x + this.canvas.width * 2;
        const lastCoin = this.collectibles.length > 0 ? 
            this.collectibles[this.collectibles.length - 1] : { x: this.player.x };
        
        if (spawnDistance > lastCoin.x + 300) {
            const groundY = this.getGroundHeight(spawnDistance);
            this.collectibles.push({
                x: spawnDistance,
                y: groundY - 50 - Math.random() * 100,
                width: 20,
                height: 20,
                collected: false,
                value: 10,
                bobOffset: Math.random() * Math.PI * 2,
                sparkleTimer: 0
            });
        }
    }
    
    spawnPowerups() {
        // Remove powerups that are far behind
        this.powerups = this.powerups.filter(powerup => 
            powerup.x > this.camera.x - this.canvas.width
        );
        
        // Occasionally spawn powerups
        if (Math.random() < 0.001 && this.powerups.length < 3) {
            const spawnDistance = this.player.x + this.canvas.width * 1.5;
            const groundY = this.getGroundHeight(spawnDistance);
            
            const types = ['speed', 'jump', 'magnet'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            this.powerups.push({
                x: spawnDistance,
                y: groundY - 80,
                width: 25,
                height: 25,
                type: type,
                duration: 5000, // 5 seconds
                collected: false,
                pulseTimer: 0
            });
        }
    }
    
    getGroundHeight(x) {
        // Find the terrain segment containing this x position
        for (let segment of this.terrain.segments) {
            if (x >= segment.x1 && x <= segment.x2) {
                // Linear interpolation
                const ratio = (x - segment.x1) / (segment.x2 - segment.x1);
                return segment.y1 + (segment.y2 - segment.y1) * ratio;
            }
        }
        return this.canvas.height * 0.7; // Default ground height
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.distance = 0;
        this.coins = 0;
        this.startTime = Date.now();
        
        this.createPlayer();
        this.createTerrain();
        this.createCamera();
        this.collectibles = [];
        this.powerups = [];
        this.particles = [];
        
        this.showGameScreen();
        this.updateHUD();
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseMenu').classList.remove('hidden');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseMenu').classList.add('hidden');
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.stopAccelerating();
        
        // Check for high score
        const isHighScore = this.checkHighScore(this.score, this.distance);
        
        // Update UI
        document.getElementById('finalScore').textContent = `Final Score: ${this.score}`;
        document.getElementById('finalDistance').textContent = `Distance: ${Math.floor(this.distance)}m`;
        document.getElementById('coinsCollected').textContent = `Coins: ${this.coins}`;
        
        if (isHighScore) {
            document.getElementById('highScoreMessage').classList.remove('hidden');
        } else {
            document.getElementById('highScoreMessage').classList.add('hidden');
        }
        
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    showTitle() {
        this.gameState = 'title';
        this.hideAllScreens();
        document.getElementById('titleScreen').classList.add('active');
    }
    
    showGameScreen() {
        this.hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
    }
    
    showHighScores() {
        this.hideAllScreens();
        document.getElementById('highScoresScreen').classList.add('active');
    }
    
    showSettings() {
        this.hideAllScreens();
        document.getElementById('settingsScreen').classList.add('active');
    }
    
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.querySelectorAll('.dialog').forEach(dialog => {
            dialog.classList.add('hidden');
        });
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.updateCamera();
        this.updateTerrain();
        this.updateCollectibles();
        this.updatePowerups();
        this.updateParticles();
        this.createMomentumParticles(); // Add momentum particles
        this.checkCollisions();
        this.updateScore();
        this.updateHUD();
    }
    
    updatePlayer() {
        // Apply momentum-based physics
        if (this.isAccelerating && this.player.onGround) {
            // Build momentum when accelerating downhill
            const groundAngle = this.getGroundAngle(this.player.x);
            if (groundAngle > 0.1) { // Downhill (adjusted threshold)
                this.player.momentum = Math.min(this.player.momentum + 3, this.player.maxMomentum);
                // More acceleration on steeper slopes
                this.player.velocityX += this.player.acceleration * (1 + groundAngle * 2);
            } else if (groundAngle > -0.1) { // Flat ground
                this.player.momentum = Math.min(this.player.momentum + 1, this.player.maxMomentum);
                this.player.velocityX += this.player.acceleration * 0.5;
            }
            // Less momentum gain going uphill
        } else {
            // Lose momentum gradually when not accelerating
            this.player.momentum = Math.max(this.player.momentum - 0.5, 0);
        }
        
        // Apply momentum boost to speed
        const momentumBoost = (this.player.momentum / this.player.maxMomentum) * 8;
        const targetSpeed = this.player.maxSpeed + momentumBoost;
        
        // Apply friction
        this.player.velocityX *= this.player.friction;
        
        // Apply gravity
        this.player.velocityY += this.player.gravity;
        
        // Update position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Improved ground collision for circular player
        const groundY = this.getGroundHeight(this.player.x);
        if (this.player.y + this.player.radius > groundY) {
            this.player.y = groundY - this.player.radius;
            
            // Bounce and momentum handling
            if (this.player.velocityY > 2) {
                // Bounce on hard landing
                this.player.velocityY = -this.player.velocityY * 0.3;
            } else {
                this.player.velocityY = 0;
            }
            
            this.player.onGround = true;
            
            // Adjust velocity based on ground slope for better physics
            const groundAngle = this.getGroundAngle(this.player.x);
            this.player.angle = groundAngle * 0.7;
            
            // Apply slope physics
            if (Math.abs(groundAngle) > 0.1) {
                this.player.velocityX += Math.sin(groundAngle) * 0.3;
            }
            
        } else {
            this.player.onGround = false;
            // Air physics - angle follows velocity
            this.player.angle = Math.atan2(this.player.velocityY, this.player.velocityX) * 0.5;
        }
        
        // Update trail with circular player center
        this.player.trail.push({ x: this.player.x, y: this.player.y });
        if (this.player.trail.length > 15) {
            this.player.trail.shift();
        }
        
        // Check if player fell off the world
        if (this.player.y > this.canvas.height + 200) {
            this.gameOver();
        }
    }
    
    getGroundAngle(x) {
        const groundY1 = this.getGroundHeight(x - 5);
        const groundY2 = this.getGroundHeight(x + 5);
        return Math.atan2(groundY2 - groundY1, 10);
    }
    
    updateCamera() {
        // Follow player with smooth movement
        this.camera.targetX = this.player.x - this.camera.offsetX;
        this.camera.targetY = this.player.y - this.camera.offsetY;
        
        // Add camera shake on high momentum
        if (this.player.momentum > 50) {
            this.camera.shake = (this.player.momentum - 50) / 50 * 5;
        }
        this.camera.shake *= this.camera.shakeDecay;
        
        // Smooth camera movement
        this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothness;
        this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothness;
        
        // Apply shake
        if (this.camera.shake > 0.1) {
            this.camera.x += (Math.random() - 0.5) * this.camera.shake;
            this.camera.y += (Math.random() - 0.5) * this.camera.shake;
        }
    }
    
    updateTerrain() {
        // Generate more terrain as player progresses
        const playerX = this.player.x;
        const lastPoint = this.terrain.points[this.terrain.points.length - 1];
        
        if (lastPoint && playerX + this.canvas.width * 2 > lastPoint.x) {
            // Need to generate more terrain ahead
            const startX = lastPoint.x;
            const endX = playerX + this.canvas.width * 4;
            const baseHeight = this.canvas.height * 0.6;
            
            for (let x = startX + this.terrain.width; x <= endX; x += this.terrain.width) {
                // Normal procedural terrain generation
                const difficultyFactor = Math.min((x - 200) / 5000, 2);
                const currentAmplitude = this.terrain.amplitude * (1 + difficultyFactor);
                
                // Use multiple noise octaves for realistic terrain
                const noise1 = this.noise(x * this.terrain.frequency + this.terrain.seed);
                const noise2 = this.noise(x * this.terrain.frequency * 2 + this.terrain.seed) * 0.5;
                const noise3 = this.noise(x * this.terrain.frequency * 4 + this.terrain.seed) * 0.25;
                
                const combinedNoise = noise1 + noise2 + noise3;
                const y = baseHeight + combinedNoise * currentAmplitude;
                
                this.terrain.points.push({ x, y });
            }
            
            // Update segments
            this.updateTerrainSegments();
        }
        
        // Clean up old terrain points that are far behind
        const minX = playerX - this.canvas.width * 2;
        this.terrain.points = this.terrain.points.filter(point => point.x > minX);
        this.updateTerrainSegments();
    }
    
    updateCollectibles() {
        this.spawnCollectibles();
        
        this.collectibles.forEach(coin => {
            if (!coin.collected) {
                coin.sparkleTimer += 0.1;
                // Gentle bobbing motion
                coin.bobOffset += 0.1;
            }
        });
    }
    
    updatePowerups() {
        this.spawnPowerups();
        
        this.powerups.forEach(powerup => {
            if (!powerup.collected) {
                powerup.pulseTimer += 0.15;
            }
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.life--;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravity
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
    }
    
    checkCollisions() {
        // Coin collection
        this.collectibles.forEach(coin => {
            if (!coin.collected && this.isColliding(this.player, coin)) {
                coin.collected = true;
                this.coins += 1;
                this.score += coin.value * (1 + Math.floor(this.player.momentum / 20));
                this.createParticles(coin.x, coin.y, '#f1c40f', 8);
                this.playSound('coinSound');
            }
        });
        
        // Powerup collection
        this.powerups.forEach(powerup => {
            if (!powerup.collected && this.isColliding(this.player, powerup)) {
                powerup.collected = true;
                this.applyPowerup(powerup.type);
                this.createParticles(powerup.x, powerup.y, '#e74c3c', 12);
                this.playSound('powerupSound');
            }
        });
    }
    
    isColliding(obj1, obj2) {
        // For circular player (obj1) and rectangular collectibles (obj2)
        if (obj1.radius) {
            // Circle to rectangle collision
            const closestX = Math.max(obj2.x, Math.min(obj1.x, obj2.x + obj2.width));
            const closestY = Math.max(obj2.y, Math.min(obj1.y, obj2.y + obj2.height));
            
            const distanceX = obj1.x - closestX;
            const distanceY = obj1.y - closestY;
            const distanceSquared = distanceX * distanceX + distanceY * distanceY;
            
            return distanceSquared < obj1.radius * obj1.radius;
        } else {
            // Original rectangle collision as fallback
            return obj1.x < obj2.x + obj2.width &&
                   obj1.x + obj1.width > obj2.x &&
                   obj1.y < obj2.y + obj2.height &&
                   obj1.y + obj1.height > obj2.y;
        }
    }
    
    applyPowerup(type) {
        switch (type) {
            case 'speed':
                this.player.maxSpeed += 5;
                setTimeout(() => { this.player.maxSpeed -= 5; }, 5000);
                break;
            case 'jump':
                if (this.player.onGround) {
                    this.player.velocityY = -15;
                }
                break;
            case 'magnet':
                // Attract nearby coins
                this.collectibles.forEach(coin => {
                    if (!coin.collected) {
                        const dx = this.player.x - coin.x;
                        const dy = this.player.y - coin.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < 200) {
                            coin.x += dx * 0.1;
                            coin.y += dy * 0.1;
                        }
                    }
                });
                break;
        }
    }
    
    createParticles(x, y, color, count = 6) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 3,
                life: 30 + Math.random() * 40,
                maxLife: 30 + Math.random() * 40,
                color: color,
                alpha: 1,
                size: 2 + Math.random() * 4
            });
        }
    }
    
    createMomentumParticles() {
        // Create particles when player has high momentum
        if (this.player.momentum > 60 && this.player.onGround && Math.random() < 0.3) {
            const particleX = this.player.x - this.player.radius + Math.random() * this.player.radius * 2;
            const particleY = this.player.y + this.player.radius;
            
            this.particles.push({
                x: particleX,
                y: particleY,
                vx: -this.player.velocityX * 0.5 + (Math.random() - 0.5) * 3,
                vy: -Math.random() * 2,
                life: 20,
                maxLife: 20,
                color: '#f39c12',
                alpha: 0.8,
                size: 2 + Math.random() * 2
            });
        }
    }
    
    updateScore() {
        // Distance-based scoring
        const newDistance = this.player.x / 10;
        if (newDistance > this.distance) {
            this.score += Math.floor(newDistance - this.distance);
            this.distance = newDistance;
        }
        
        // Momentum bonus
        if (this.player.momentum > 80) {
            this.score += 1;
        }
    }
    
    updateHUD() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('distanceValue').textContent = Math.floor(this.distance);
        document.getElementById('speedValue').textContent = Math.floor(this.player.velocityX * 10) / 10;
        document.getElementById('coinsValue').textContent = this.coins;
        
        // Update momentum bar with better visual feedback
        const momentumPercent = (this.player.momentum / this.player.maxMomentum) * 100;
        const momentumFill = document.getElementById('momentumFill');
        momentumFill.style.width = momentumPercent + '%';
        
        // Change momentum bar color based on level
        if (momentumPercent > 80) {
            momentumFill.style.backgroundColor = '#e74c3c'; // Red for high momentum
            momentumFill.style.boxShadow = '0 0 10px #e74c3c';
        } else if (momentumPercent > 50) {
            momentumFill.style.backgroundColor = '#f39c12'; // Orange for medium momentum
            momentumFill.style.boxShadow = '0 0 8px #f39c12';
        } else if (momentumPercent > 20) {
            momentumFill.style.backgroundColor = '#f1c40f'; // Yellow for low momentum
            momentumFill.style.boxShadow = '0 0 5px #f1c40f';
        } else {
            momentumFill.style.backgroundColor = '#95a5a6'; // Gray for no momentum
            momentumFill.style.boxShadow = 'none';
        }
    }
    
    // High Score System
    loadHighScores() {
        const saved = localStorage.getItem('hillrider-highscores');
        return saved ? JSON.parse(saved) : [
            { score: 0, distance: 0 },
            { score: 0, distance: 0 },
            { score: 0, distance: 0 },
            { score: 0, distance: 0 },
            { score: 0, distance: 0 }
        ];
    }
    
    saveHighScores() {
        localStorage.setItem('hillrider-highscores', JSON.stringify(this.highScores));
    }
    
    checkHighScore(score, distance) {
        for (let i = 0; i < this.highScores.length; i++) {
            if (score > this.highScores[i].score) {
                this.highScores.splice(i, 0, { score, distance: Math.floor(distance) });
                this.highScores = this.highScores.slice(0, 5);
                this.saveHighScores();
                this.updateHighScoresDisplay();
                return true;
            }
        }
        return false;
    }
    
    updateHighScoresDisplay() {
        const entries = document.querySelectorAll('.high-score-entry');
        this.highScores.forEach((entry, index) => {
            if (entries[index]) {
                entries[index].querySelector('.score').textContent = entry.score;
                entries[index].querySelector('.distance').textContent = entry.distance + 'm';
            }
        });
    }
    
    clearHighScores() {
        this.highScores = [
            { score: 0, distance: 0 },
            { score: 0, distance: 0 },
            { score: 0, distance: 0 },
            { score: 0, distance: 0 },
            { score: 0, distance: 0 }
        ];
        this.saveHighScores();
        this.updateHighScoresDisplay();
    }
    
    // Settings System
    loadSettings() {
        const saved = localStorage.getItem('hillrider-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        
        // Apply settings to UI
        document.getElementById('soundToggle').checked = this.settings.sound;
        document.getElementById('musicToggle').checked = this.settings.music;
        document.getElementById('qualitySelect').value = this.settings.quality;
        document.getElementById('difficultySelect').value = this.settings.difficulty;
    }
    
    saveSettings() {
        localStorage.setItem('hillrider-settings', JSON.stringify(this.settings));
    }
    
    // Audio System
    playSound(soundId) {
        if (!this.settings.sound) return;
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {}); // Ignore audio errors
        }
    }
    
    stopSound(soundId) {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.pause();
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing' || this.gameState === 'paused' || this.gameState === 'gameOver') {
            this.renderGame();
        } else {
            this.renderTitleBackground();
        }
    }
    
    renderTitleBackground() {
        // Simple animated background for title screen
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(1, '#98fb98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Animated hills
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.beginPath();
        const time = Date.now() * 0.001;
        this.ctx.moveTo(0, this.canvas.height);
        for (let x = 0; x <= this.canvas.width; x += 20) {
            const y = this.canvas.height * 0.6 + Math.sin(x * 0.01 + time) * 50;
            this.ctx.lineTo(x, y);
        }
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    renderGame() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(0.7, '#b8d8eb');
        gradient.addColorStop(1, '#98fb98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.renderTerrain();
        this.renderCollectibles();
        this.renderPowerups();
        this.renderPlayer();
        this.renderParticles();
        
        // Restore context
        this.ctx.restore();
    }
    
    renderTerrain() {
        // Render terrain as smooth curve
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.strokeStyle = '#27ae60';
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.terrain.points[0]?.x || 0, this.canvas.height + this.camera.y);
        
        // Draw to first point
        if (this.terrain.points.length > 0) {
            this.ctx.lineTo(this.terrain.points[0].x, this.terrain.points[0].y);
        }
        
        // Draw smooth curve through all points
        for (let i = 0; i < this.terrain.points.length - 1; i++) {
            const current = this.terrain.points[i];
            const next = this.terrain.points[i + 1];
            
            if (next.x < this.camera.x - 100 || current.x > this.camera.x + this.canvas.width + 100) {
                continue; // Skip offscreen points
            }
            
            // Use quadratic curve for smoothness
            const midX = (current.x + next.x) / 2;
            const midY = (current.y + next.y) / 2;
            this.ctx.quadraticCurveTo(current.x, current.y, midX, midY);
        }
        
        // Close the path to bottom of screen
        const lastPoint = this.terrain.points[this.terrain.points.length - 1];
        if (lastPoint) {
            this.ctx.lineTo(lastPoint.x, lastPoint.y);
            this.ctx.lineTo(lastPoint.x, this.canvas.height + this.camera.y);
            this.ctx.lineTo(this.terrain.points[0]?.x || 0, this.canvas.height + this.camera.y);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Add grass texture
        this.ctx.fillStyle = '#27ae60';
        for (let i = 0; i < this.terrain.points.length - 1; i++) {
            const point = this.terrain.points[i];
            if (point.x < this.camera.x - 100 || point.x > this.camera.x + this.canvas.width + 100) {
                continue;
            }
            
            // Small grass blades
            for (let j = 0; j < 3; j++) {
                const grassX = point.x + j * 20 + Math.sin(Date.now() * 0.001 + j) * 5;
                const grassY = point.y - Math.random() * 10;
                
                this.ctx.beginPath();
                this.ctx.moveTo(grassX, grassY);
                this.ctx.lineTo(grassX, grassY - 8);
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
    }
    
    renderPlayer() {
        this.ctx.save();
        
        // Draw player trail
        if (this.player.trail.length > 1) {
            this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.4)';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.trail[0].x, this.player.trail[0].y);
            for (let i = 1; i < this.player.trail.length; i++) {
                const alpha = i / this.player.trail.length;
                this.ctx.lineTo(this.player.trail[i].x, this.player.trail[i].y);
            }
            this.ctx.stroke();
        }
        
        // Position and rotate player
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle);
        
        // Momentum glow effect
        if (this.player.momentum > 20) {
            const glowIntensity = (this.player.momentum - 20) / 80;
            const glowSize = 5 + glowIntensity * 20;
            
            this.ctx.shadowColor = '#f39c12';
            this.ctx.shadowBlur = glowSize;
            this.ctx.fillStyle = `rgba(243, 156, 18, ${glowIntensity * 0.4})`;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.player.radius + 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
        
        // Player body (circular)
        this.ctx.fillStyle = this.player.color;
        this.ctx.strokeStyle = '#2980b9';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Player face/direction indicator
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(this.player.radius * 0.3, -this.player.radius * 0.2, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.player.radius * 0.3, this.player.radius * 0.2, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Smile
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.player.radius * 0.2, 0, 4, 0, Math.PI);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    renderCollectibles() {
        this.collectibles.forEach(coin => {
            if (coin.collected) return;
            
            this.ctx.save();
            this.ctx.translate(coin.x + coin.width/2, coin.y + coin.height/2 + Math.sin(coin.bobOffset) * 3);
            this.ctx.rotate(coin.sparkleTimer);
            
            // Coin body
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.strokeStyle = '#f39c12';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Coin shine
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(-3, -3, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Sparkle effect
            const sparkleSize = 2 + Math.sin(coin.sparkleTimer * 2) * 1;
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(-sparkleSize/2, -coin.width/2 - 10, sparkleSize, sparkleSize);
            this.ctx.fillRect(coin.width/2 + 5, -sparkleSize/2, sparkleSize, sparkleSize);
            
            this.ctx.restore();
        });
    }
    
    renderPowerups() {
        this.powerups.forEach(powerup => {
            if (powerup.collected) return;
            
            this.ctx.save();
            
            const pulse = 1 + Math.sin(powerup.pulseTimer) * 0.2;
            this.ctx.translate(powerup.x + powerup.width/2, powerup.y + powerup.height/2);
            this.ctx.scale(pulse, pulse);
            
            // Powerup glow
            this.ctx.shadowColor = '#e74c3c';
            this.ctx.shadowBlur = 10;
            
            // Powerup body
            let color = '#e74c3c';
            let symbol = '⚡';
            
            switch (powerup.type) {
                case 'speed':
                    color = '#e74c3c';
                    symbol = '⚡';
                    break;
                case 'jump':
                    color = '#3498db';
                    symbol = '⬆';
                    break;
                case 'magnet':
                    color = '#9b59b6';
                    symbol = '🧲';
                    break;
            }
            
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.fillRect(-powerup.width/2, -powerup.height/2, powerup.width, powerup.height);
            this.ctx.strokeRect(-powerup.width/2, -powerup.height/2, powerup.width, powerup.height);
            
            // Symbol
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(symbol, 0, 0);
            
            this.ctx.shadowBlur = 0;
            this.ctx.restore();
        });
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size || 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new HillRiderGame();
});