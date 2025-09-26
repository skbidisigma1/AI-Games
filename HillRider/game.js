class HillRiderGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'title'; // 'title', 'playing', 'paused', 'gameOver'
        this.score = 0;
        this.distance = 0;
        this.coins = 0;
        this.stars = 0;
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
        
        // Background layers for parallax
        this.backgroundLayers = {
            stars: [],
            clouds: [],
            mountains: []
        };
        
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
            color: '#3498db',
            // Combo system
            combo: 0,
            maxCombo: 0,
            perfectLandings: 0,
            airTime: 0,
            lastLandingTime: 0,
            wasOnGround: false
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
    
    createBackgroundLayers() {
        // Create stars for night sky
        for (let i = 0; i < 100; i++) {
            this.backgroundLayers.stars.push({
                x: Math.random() * this.canvas.width * 3,
                y: Math.random() * this.canvas.height * 0.6,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                alpha: Math.random() * 0.8 + 0.2
            });
        }
        
        // Create clouds
        for (let i = 0; i < 15; i++) {
            this.backgroundLayers.clouds.push({
                x: Math.random() * this.canvas.width * 3,
                y: Math.random() * this.canvas.height * 0.4 + 50,
                size: Math.random() * 80 + 40,
                speed: Math.random() * 0.3 + 0.1,
                alpha: Math.random() * 0.3 + 0.1
            });
        }
        
        // Create mountain silhouettes
        for (let i = 0; i < 8; i++) {
            this.backgroundLayers.mountains.push({
                x: i * 200,
                baseHeight: this.canvas.height * 0.7,
                peaks: Array.from({length: 5}, () => ({
                    height: Math.random() * 150 + 50,
                    width: Math.random() * 100 + 80
                }))
            });
        }
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
            
            // Randomly spawn either coin or star (stars are rarer and worth more)
            const isStar = Math.random() < 0.2; // 20% chance for star
            
            this.collectibles.push({
                x: spawnDistance,
                y: groundY - 50 - Math.random() * 100,
                width: 20,
                height: 20,
                collected: false,
                type: isStar ? 'star' : 'coin',
                value: isStar ? 25 : 10,
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
        this.stars = 0;
        this.startTime = Date.now();
        
        this.createPlayer();
        this.createTerrain();
        this.createCamera();
        this.createBackgroundLayers();
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
            
            // Combo system - check for landing quality
            if (!this.player.wasOnGround) {
                const currentTime = Date.now();
                const landingVelocity = Math.abs(this.player.velocityY);
                const groundAngle = this.getGroundAngle(this.player.x);
                const landingAngle = Math.abs(Math.atan2(this.player.velocityY, this.player.velocityX));
                
                // Perfect landing conditions: moderate speed, good angle alignment
                const isPerfectLanding = landingVelocity > 3 && landingVelocity < 8 && 
                                      Math.abs(landingAngle - Math.abs(groundAngle)) < 0.5 &&
                                      this.player.airTime > 30; // Must have been airborne for reasonable time
                
                if (isPerfectLanding) {
                    this.player.combo++;
                    this.player.perfectLandings++;
                    this.player.maxCombo = Math.max(this.player.maxCombo, this.player.combo);
                    
                    // Combo bonus to momentum and score
                    this.player.momentum = Math.min(this.player.momentum + 15 + this.player.combo * 2, this.player.maxMomentum);
                    this.score += 50 + this.player.combo * 25;
                    
                    // Create special effect particles
                    this.createComboParticles(this.player.x, this.player.y);
                    
                    // Screen glow effect for perfect landings
                    this.camera.shake = Math.min(this.camera.shake + 3, 10);
                    
                    // Play perfect landing sound (higher pitch for higher combos)
                    this.playSound('coinSound'); // Using coin sound as perfect landing sound
                } else {
                    // Break combo on poor landing
                    if (this.player.combo > 0) {
                        this.player.combo = Math.max(0, this.player.combo - 1);
                    }
                    
                    // Play regular landing sound for hard impacts
                    if (landingVelocity > 6) {
                        this.playSound('crashSound');
                    }
                }
                
                this.player.lastLandingTime = currentTime;
                this.player.airTime = 0;
            }
            
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
            // Track air time for combo system
            this.player.airTime++;
        }
        
        // Update wasOnGround for combo detection
        this.player.wasOnGround = this.player.onGround;
        
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
        this.collectibles.forEach(item => {
            if (!item.collected && this.isColliding(this.player, item)) {
                item.collected = true;
                
                if (item.type === 'star') {
                    this.stars += 1;
                    this.score += item.value * (1 + Math.floor(this.player.momentum / 15)); // Better bonus for stars
                    this.createParticles(item.x, item.y, '#fff', 12); // More particles for stars
                } else {
                    this.coins += 1;
                    this.score += item.value * (1 + Math.floor(this.player.momentum / 20));
                    this.createParticles(item.x, item.y, '#f1c40f', 8);
                }
                
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
    
    createComboParticles(x, y) {
        // Create special golden particles for combo landings
        const particleCount = 8 + this.player.combo * 2;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15 - 5,
                life: 60 + Math.random() * 40,
                maxLife: 60 + Math.random() * 40,
                color: `hsl(${45 + Math.random() * 15}, 100%, ${60 + Math.random() * 20}%)`, // Golden colors
                alpha: 1,
                size: 3 + Math.random() * 4,
                sparkle: true
            });
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
        document.getElementById('starsValue').textContent = this.stars;
        document.getElementById('comboValue').textContent = this.player.combo;
        
        // Highlight combo when active
        const comboElement = document.getElementById('comboInfo');
        if (this.player.combo > 0) {
            comboElement.style.color = '#f39c12';
            comboElement.style.textShadow = '0 0 10px #f39c12';
        } else {
            comboElement.style.color = '';
            comboElement.style.textShadow = '';
        }
        
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
        // Calculate day-night cycle based on distance traveled
        const dayProgress = (this.distance / 1000) % 2; // Cycle every 1000m
        const isNight = dayProgress > 1;
        const fadeProgress = isNight ? (dayProgress - 1) : (1 - dayProgress);
        
        // Dynamic sky gradient based on time of day
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        if (isNight) {
            // Night sky colors
            gradient.addColorStop(0, `rgba(25, 25, 112, ${0.8 + fadeProgress * 0.2})`); // Midnight blue
            gradient.addColorStop(0.3, `rgba(72, 61, 139, ${0.6 + fadeProgress * 0.3})`); // Dark slate blue
            gradient.addColorStop(0.7, `rgba(106, 90, 205, ${0.4 + fadeProgress * 0.4})`); // Slate blue
            gradient.addColorStop(1, `rgba(135, 206, 235, ${0.2 + fadeProgress * 0.3})`); // Sky blue
        } else {
            // Day sky colors
            gradient.addColorStop(0, `rgba(135, 206, 235, ${0.8 + fadeProgress * 0.2})`); // Sky blue
            gradient.addColorStop(0.7, `rgba(184, 216, 235, ${0.6 + fadeProgress * 0.3})`); // Light blue
            gradient.addColorStop(1, `rgba(152, 251, 152, ${0.4 + fadeProgress * 0.4})`); // Pale green
        }
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render parallax background layers
        this.renderBackgroundLayers(isNight, fadeProgress);
        
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
    
    renderBackgroundLayers(isNight, fadeProgress) {
        // Render stars (only visible at night)
        if (isNight) {
            this.ctx.save();
            this.ctx.globalAlpha = fadeProgress * 0.8;
            
            this.backgroundLayers.stars.forEach(star => {
                // Parallax effect - stars move very slowly
                const parallaxX = star.x - this.camera.x * 0.1;
                const parallaxY = star.y - this.camera.y * 0.05;
                
                if (parallaxX > -50 && parallaxX < this.canvas.width + 50) {
                    star.twinkle += 0.1;
                    const twinkleAlpha = (Math.sin(star.twinkle) + 1) * 0.5;
                    
                    this.ctx.globalAlpha = fadeProgress * star.alpha * twinkleAlpha;
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(parallaxX, parallaxY, star.size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            });
            this.ctx.restore();
        }
        
        // Render mountains (far background)
        this.ctx.save();
        this.ctx.globalAlpha = 0.6;
        
        this.backgroundLayers.mountains.forEach(mountain => {
            // Strong parallax effect - mountains move slowly
            const parallaxX = mountain.x - this.camera.x * 0.3;
            
            if (parallaxX > -300 && parallaxX < this.canvas.width + 300) {
                this.ctx.fillStyle = isNight ? '#2c3e50' : '#34495e';
                this.ctx.beginPath();
                this.ctx.moveTo(parallaxX, mountain.baseHeight);
                
                let currentX = parallaxX;
                mountain.peaks.forEach(peak => {
                    const peakX = currentX + peak.width / 2;
                    const peakY = mountain.baseHeight - peak.height;
                    this.ctx.lineTo(peakX, peakY);
                    currentX += peak.width;
                    this.ctx.lineTo(currentX, mountain.baseHeight);
                });
                
                this.ctx.lineTo(parallaxX + 200, this.canvas.height);
                this.ctx.lineTo(parallaxX, this.canvas.height);
                this.ctx.closePath();
                this.ctx.fill();
            }
        });
        this.ctx.restore();
        
        // Render clouds
        this.ctx.save();
        
        this.backgroundLayers.clouds.forEach(cloud => {
            // Medium parallax effect
            const parallaxX = cloud.x - this.camera.x * 0.5;
            const parallaxY = cloud.y - this.camera.y * 0.2;
            
            // Animate cloud movement
            cloud.x += cloud.speed;
            if (cloud.x > this.camera.x + this.canvas.width + 200) {
                cloud.x = this.camera.x - 200;
            }
            
            if (parallaxX > -cloud.size && parallaxX < this.canvas.width + cloud.size) {
                this.ctx.globalAlpha = cloud.alpha * (isNight ? 0.3 : 0.7);
                this.ctx.fillStyle = isNight ? '#6c7b7f' : '#ffffff';
                
                // Draw fluffy cloud shape
                this.ctx.beginPath();
                this.ctx.arc(parallaxX, parallaxY, cloud.size * 0.5, 0, Math.PI * 2);
                this.ctx.arc(parallaxX + cloud.size * 0.3, parallaxY, cloud.size * 0.4, 0, Math.PI * 2);
                this.ctx.arc(parallaxX - cloud.size * 0.3, parallaxY, cloud.size * 0.4, 0, Math.PI * 2);
                this.ctx.arc(parallaxX, parallaxY - cloud.size * 0.2, cloud.size * 0.6, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        this.ctx.restore();
    }
    
    renderTerrain() {
        // Create dynamic terrain gradient based on day/night
        const dayProgress = (this.distance / 1000) % 2;
        const isNight = dayProgress > 1;
        
        // Enhanced terrain gradient
        const topY = this.terrain.points.length > 0 ? Math.min(...this.terrain.points.map(p => p.y)) : this.canvas.height * 0.5;
        const bottomY = this.canvas.height + this.camera.y;
        
        const terrainGradient = this.ctx.createLinearGradient(0, topY, 0, bottomY);
        if (isNight) {
            terrainGradient.addColorStop(0, '#2d5a2d'); // Dark green
            terrainGradient.addColorStop(0.3, '#1e3a1e'); // Darker green
            terrainGradient.addColorStop(1, '#0f1f0f'); // Very dark green
        } else {
            terrainGradient.addColorStop(0, '#2ecc71'); // Bright green
            terrainGradient.addColorStop(0.3, '#27ae60'); // Medium green  
            terrainGradient.addColorStop(1, '#1e8449'); // Dark green
        }
        
        this.ctx.fillStyle = terrainGradient;
        this.ctx.strokeStyle = isNight ? '#1a4a1a' : '#27ae60';
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
        
        // Enhanced grass texture with better styling
        this.ctx.fillStyle = isNight ? '#1a4a1a' : '#27ae60';
        const grassCount = isNight ? 2 : 3; // Fewer grass blades at night
        
        for (let i = 0; i < this.terrain.points.length - 1; i++) {
            const point = this.terrain.points[i];
            if (point.x < this.camera.x - 100 || point.x > this.camera.x + this.canvas.width + 100) {
                continue;
            }
            
            // Enhanced grass blades with swaying animation
            for (let j = 0; j < grassCount; j++) {
                const swayTime = Date.now() * 0.002 + point.x * 0.001;
                const sway = Math.sin(swayTime + j) * 2;
                const grassX = point.x + j * 25 + sway;
                const grassHeight = 6 + Math.random() * 8;
                const grassY = point.y - Math.random() * 5;
                
                this.ctx.beginPath();
                this.ctx.moveTo(grassX, grassY);
                this.ctx.lineTo(grassX + sway * 0.5, grassY - grassHeight);
                this.ctx.lineWidth = 1 + Math.random();
                this.ctx.stroke();
            }
        }
    }
    
    renderPlayer() {
        this.ctx.save();
        
        // Enhanced trail with speed-based effects
        if (this.player.trail.length > 1) {
            const speedIntensity = Math.min(this.player.velocityX / this.player.maxSpeed, 1);
            const momentumIntensity = this.player.momentum / this.player.maxMomentum;
            
            // Speed boost trail - glowing effect when moving fast
            if (speedIntensity > 0.6) {
                this.ctx.strokeStyle = `rgba(243, 156, 18, ${speedIntensity * 0.8})`;
                this.ctx.lineWidth = 8;
                this.ctx.shadowColor = '#f39c12';
                this.ctx.shadowBlur = 15;
                this.ctx.beginPath();
                this.ctx.moveTo(this.player.trail[0].x, this.player.trail[0].y);
                for (let i = 1; i < this.player.trail.length; i++) {
                    this.ctx.lineTo(this.player.trail[i].x, this.player.trail[i].y);
                }
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
            
            // Normal trail
            this.ctx.strokeStyle = `rgba(52, 152, 219, ${0.4 + momentumIntensity * 0.4})`;
            this.ctx.lineWidth = 4 + momentumIntensity * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.trail[0].x, this.player.trail[0].y);
            for (let i = 1; i < this.player.trail.length; i++) {
                const alpha = i / this.player.trail.length;
                this.ctx.globalAlpha = alpha * (0.5 + momentumIntensity * 0.5);
                this.ctx.lineTo(this.player.trail[i].x, this.player.trail[i].y);
            }
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
        
        // Position player
        this.ctx.translate(this.player.x, this.player.y);
        
        // Squash and stretch effects based on velocity and ground contact
        let scaleX = 1;
        let scaleY = 1;
        
        if (this.player.onGround) {
            // Landing squash effect
            const impactForce = Math.abs(this.player.velocityY) / 10;
            if (impactForce > 0.5) {
                scaleX = 1 + impactForce * 0.3;
                scaleY = 1 - impactForce * 0.2;
            }
            
            // Speed stretch when moving fast on ground
            const speedStretch = Math.min(this.player.velocityX / this.player.maxSpeed, 1) * 0.2;
            scaleX += speedStretch;
            scaleY -= speedStretch * 0.5;
        } else {
            // Air stretch based on velocity direction
            const airStretch = Math.abs(this.player.velocityY) / 15;
            if (this.player.velocityY < 0) { // Going up
                scaleX -= airStretch * 0.2;
                scaleY += airStretch * 0.3;
            } else { // Falling down
                scaleX += airStretch * 0.1;
                scaleY -= airStretch * 0.1;
            }
        }
        
        // Apply squash/stretch
        this.ctx.scale(scaleX, scaleY);
        
        // Rotate based on movement
        this.ctx.rotate(this.player.angle);
        
        // Enhanced momentum glow effect
        if (this.player.momentum > 20) {
            const glowIntensity = (this.player.momentum - 20) / 80;
            const glowSize = 5 + glowIntensity * 25;
            const pulseEffect = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
            
            this.ctx.strokeStyle = `rgba(243, 156, 18, ${glowIntensity * 0.8 * pulseEffect})`;
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = '#f39c12';
            this.ctx.shadowBlur = glowSize * pulseEffect;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.player.radius + 5 + glowIntensity * 8, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
        
        // Player body (circular) with momentum-based color intensity
        const momentumColor = this.player.momentum / this.player.maxMomentum;
        const baseBlue = 52 + momentumColor * 50;
        const baseGreen = 152 + momentumColor * 50;
        this.ctx.fillStyle = `rgb(${baseBlue}, ${baseGreen}, 219)`;
        this.ctx.strokeStyle = `rgb(${Math.max(41, baseBlue - 20)}, ${Math.max(128, baseGreen - 30)}, 185)`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Enhanced player face with expressions based on momentum
        const eyeSize = 3 + momentumColor * 2;
        const eyeSpacing = this.player.radius * 0.4;
        
        // Eyes - get bigger and more excited with momentum
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(eyeSpacing, -this.player.radius * 0.2, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(eyeSpacing, this.player.radius * 0.2, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pupils that look in direction of movement  
        const pupilOffset = Math.sign(this.player.velocityX) * 1;
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(eyeSpacing + pupilOffset, -this.player.radius * 0.2, 1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(eyeSpacing + pupilOffset, this.player.radius * 0.2, 1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Smile that gets bigger with momentum
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        const smileRadius = 4 + momentumColor * 3;
        const smileAngle = Math.PI * (0.5 + momentumColor * 0.3);
        this.ctx.arc(this.player.radius * 0.2, 0, smileRadius, 0, smileAngle);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    renderCollectibles() {
        this.collectibles.forEach(item => {
            if (item.collected) return;
            
            this.ctx.save();
            this.ctx.translate(item.x + item.width/2, item.y + item.height/2 + Math.sin(item.bobOffset) * 3);
            this.ctx.rotate(item.sparkleTimer);
            
            if (item.type === 'star') {
                // Render star collectible
                this.ctx.fillStyle = '#fff';
                this.ctx.strokeStyle = '#f1c40f';
                this.ctx.lineWidth = 2;
                this.ctx.shadowColor = '#f1c40f';
                this.ctx.shadowBlur = 10;
                
                // Draw star shape
                const spikes = 5;
                const outerRadius = item.width / 2;
                const innerRadius = outerRadius * 0.4;
                
                this.ctx.beginPath();
                this.ctx.moveTo(0, -outerRadius);
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / spikes;
                    this.ctx.lineTo(
                        Math.cos(angle - Math.PI / 2) * radius,
                        Math.sin(angle - Math.PI / 2) * radius
                    );
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            } else {
                // Render coin collectible
                this.ctx.fillStyle = '#f1c40f';
                this.ctx.strokeStyle = '#f39c12';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, item.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Coin shine
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(-3, -3, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Sparkle effect for both types
            const sparkleSize = 2 + Math.sin(item.sparkleTimer * 2) * 1;
            this.ctx.fillStyle = '#fff';
            this.ctx.shadowBlur = 0;
            this.ctx.fillRect(-sparkleSize/2, -item.width/2 - 10, sparkleSize, sparkleSize);
            this.ctx.fillRect(item.width/2 + 5, -sparkleSize/2, sparkleSize, sparkleSize);
            
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
            
            // Special rendering for sparkle particles (combo effects)
            if (particle.sparkle) {
                // Rotate sparkle particles
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(Date.now() * 0.01 + particle.x * 0.001);
                this.ctx.translate(-particle.x, -particle.y);
                
                // Add sparkle glow
                this.ctx.shadowColor = particle.color;
                this.ctx.shadowBlur = particle.size * 2;
            }
            
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            
            if (particle.sparkle) {
                // Draw star shape for sparkle particles
                const spikes = 5;
                const outerRadius = particle.size;
                const innerRadius = outerRadius * 0.4;
                
                this.ctx.moveTo(particle.x, particle.y - outerRadius);
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / spikes;
                    this.ctx.lineTo(
                        particle.x + Math.cos(angle - Math.PI / 2) * radius,
                        particle.y + Math.sin(angle - Math.PI / 2) * radius
                    );
                }
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // Regular circular particles
                this.ctx.arc(particle.x, particle.y, particle.size || 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.shadowBlur = 0;
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