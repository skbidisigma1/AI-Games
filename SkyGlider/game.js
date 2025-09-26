// SkyGlider - Momentum Master Game
class SkyGliderGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.distance = 0;
        this.starsCollected = 0;
        this.bestCombo = 0;
        this.gameTime = 60; // 60 seconds game time
        this.timeLeft = this.gameTime;
        
        // Input handling
        this.keys = {};
        this.isPressed = false;
        this.mousePressed = false;
        
        // Physics constants
        this.GRAVITY = 0.4;
        this.BOOSTED_GRAVITY = 1.2;
        this.AIR_RESISTANCE = 0.998;
        this.GROUND_FRICTION = 0.92;
        this.MAX_SPEED = 25;
        
        // Day/Night cycle
        this.dayNightCycle = 0; // 0 = day, 1 = night
        this.dayNightSpeed = 0.001;
        
        // Settings
        this.settings = {
            sound: true,
            music: true,
            quality: 'medium',
            character: 'bird'
        };
        
        // High scores
        this.highScores = this.loadHighScores();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createPlayer();
        this.createTerrain();
        this.createParallaxLayers();
        this.collectibles = [];
        this.powerUps = [];
        this.particles = [];
        this.camera = { x: 0, y: 0, targetX: 0, targetY: 0, shake: 0 };
        
        this.loadSettings();
        this.updateHighScoresDisplay();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code.toLowerCase()] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.isPressed = true;
            }
            if (e.code === 'Escape' && this.gameState === 'playing') {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code.toLowerCase()] = false;
            if (e.code === 'Space') {
                this.isPressed = false;
            }
        });
        
        // Mouse/Touch events
        this.canvas.addEventListener('mousedown', (e) => {
            this.mousePressed = true;
            this.isPressed = true;
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.mousePressed = false;
            this.isPressed = false;
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isPressed = true;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isPressed = false;
        });
        
        // UI Button events
        this.setupUIEvents();
    }
    
    setupUIEvents() {
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('showHighScores').addEventListener('click', () => this.showScreen('highScoresScreen'));
        document.getElementById('showSettings').addEventListener('click', () => this.showScreen('settingsScreen'));
        document.getElementById('restartGame').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenu').addEventListener('click', () => this.showScreen('titleScreen'));
        document.getElementById('resumeGame').addEventListener('click', () => this.togglePause());
        document.getElementById('restartFromPause').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenuFromPause').addEventListener('click', () => this.showScreen('titleScreen'));
        document.getElementById('backFromHighScores').addEventListener('click', () => this.showScreen('titleScreen'));
        document.getElementById('clearHighScores').addEventListener('click', () => this.clearHighScores());
        document.getElementById('backFromSettings').addEventListener('click', () => this.showScreen('titleScreen'));
        
        // Settings events
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
        document.getElementById('characterSelect').addEventListener('change', (e) => {
            this.settings.character = e.target.value;
            this.saveSettings();
        });
    }
    
    createPlayer() {
        this.player = {
            x: 200,
            y: 300,
            vx: 8, // Initial forward velocity
            vy: 0,
            width: 24,
            height: 18,
            radius: 12,
            momentum: 0,
            maxMomentum: 100,
            onGround: false,
            airTime: 0,
            combo: 0,
            perfectLandings: 0,
            trail: [],
            squashStretch: { scaleX: 1, scaleY: 1 },
            angle: 0,
            glowIntensity: 0,
            lastGroundY: 0,
            landingQuality: 0
        };
    }
    
    createTerrain() {
        this.terrain = {
            points: [],
            segments: [],
            amplitude: 150,
            frequency: 0.008,
            octaves: 3,
            seed: Math.random() * 1000
        };
        
        this.generateTerrain();
    }
    
    generateTerrain() {
        const startX = -500;
        const endX = startX + this.canvas.width * 8;
        const baseHeight = this.canvas.height * 0.75;
        
        this.terrain.points = [];
        
        for (let x = startX; x <= endX; x += 20) {
            let y = baseHeight;
            
            // Multi-octave noise for realistic rolling hills
            for (let octave = 0; octave < this.terrain.octaves; octave++) {
                const freq = this.terrain.frequency * Math.pow(2, octave);
                const amp = this.terrain.amplitude / Math.pow(2, octave);
                y += Math.sin((x + this.terrain.seed) * freq) * amp;
            }
            
            // Add some variation based on distance for difficulty progression
            const distanceVariation = Math.sin(x * 0.001) * 50 * (x / 2000);
            y += distanceVariation;
            
            this.terrain.points.push({ x, y });
        }
        
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
    
    createParallaxLayers() {
        this.parallaxLayers = [
            { speed: 0.1, y: 50, color: '#FFB6C1', type: 'clouds' },
            { speed: 0.3, y: 150, color: '#DDA0DD', type: 'mountains' },
            { speed: 0.5, y: 250, color: '#98FB98', type: 'hills' },
            { speed: 0.7, y: 350, color: '#F0E68C', type: 'grass' }
        ];
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.distance = 0;
        this.starsCollected = 0;
        this.timeLeft = this.gameTime;
        this.dayNightCycle = 0;
        this.createPlayer();
        this.collectibles = [];
        this.powerUps = [];
        this.particles = [];
        this.camera = { x: 0, y: 0, targetX: 0, targetY: 0, shake: 0 };
        this.generateCollectibles();
        this.showScreen('gameScreen');
        this.playSound('backgroundMusic', true);
    }
    
    generateCollectibles() {
        this.collectibles = [];
        
        // Generate stars along the terrain
        for (let i = 0; i < 50; i++) {
            const x = 300 + i * 200 + Math.random() * 100;
            const terrainY = this.getGroundHeight(x);
            const y = terrainY - 100 - Math.random() * 150;
            
            this.collectibles.push({
                type: 'star',
                x: x,
                y: y,
                width: 20,
                height: 20,
                collected: false,
                sparkleTimer: Math.random() * Math.PI * 2,
                value: 10
            });
        }
        
        // Generate power-ups
        for (let i = 0; i < 10; i++) {
            const x = 500 + i * 400 + Math.random() * 200;
            const terrainY = this.getGroundHeight(x);
            const y = terrainY - 80 - Math.random() * 100;
            
            const powerUpTypes = ['speed', 'jump', 'magnet'];
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            this.collectibles.push({
                type: 'powerup',
                powerType: type,
                x: x,
                y: y,
                width: 25,
                height: 25,
                collected: false,
                sparkleTimer: Math.random() * Math.PI * 2,
                duration: 300, // 5 seconds at 60fps
                value: 25
            });
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.updateCamera();
        this.updateCollectibles();
        this.updateParticles();
        this.updateDayNight();
        this.updateTimer();
        this.updateUI();
        
        // Generate new terrain ahead of player
        this.updateTerrain();
    }
    
    updatePlayer() {
        const player = this.player;
        
        // Apply gravity (normal or boosted)
        const currentGravity = this.isPressed ? this.BOOSTED_GRAVITY : this.GRAVITY;
        player.vy += currentGravity;
        
        // Air resistance
        player.vx *= this.AIR_RESISTANCE;
        player.vy *= this.AIR_RESISTANCE;
        
        // Maintain forward momentum
        const baseSpeed = 8 + (player.momentum / player.maxMomentum) * 12;
        if (player.vx < baseSpeed) {
            player.vx += 0.1;
        }
        
        // Update position
        player.x += player.vx;
        player.y += player.vy;
        
        // Ground collision and momentum physics
        this.handleGroundCollision();
        
        // Update trail
        this.updatePlayerTrail();
        
        // Update squash/stretch animation
        this.updateSquashStretch();
        
        // Update angle based on velocity
        player.angle = Math.atan2(player.vy, player.vx);
        
        // Update distance
        this.distance = Math.max(0, Math.floor((player.x - 200) / 10));
        
        // Update score
        this.score += Math.floor(player.vx / 2);
        if (player.momentum > 80) {
            this.score += 2; // Bonus for high momentum
        }
    }
    
    handleGroundCollision() {
        const player = this.player;
        const groundY = this.getGroundHeight(player.x);
        
        if (player.y + player.radius > groundY) {
            player.y = groundY - player.radius;
            
            if (!player.onGround) {
                // Landing logic
                this.handleLanding();
            }
            
            player.onGround = true;
            player.airTime = 0;
            
            // Ground physics
            if (this.isPressed) {
                // Build momentum when pressing on downhill slopes
                const groundAngle = this.getGroundAngle(player.x);
                if (groundAngle > 0.1) { // Downhill
                    player.momentum = Math.min(player.momentum + 4, player.maxMomentum);
                    player.vx += 0.3 * groundAngle;
                    player.glowIntensity = Math.min(player.glowIntensity + 0.1, 1);
                    
                    // Create particles
                    this.createMomentumParticles();
                }
            }
            
            // Ground friction
            player.vx *= this.GROUND_FRICTION;
            player.vy = Math.max(player.vy * -0.3, -5); // Bounce with damping
            
        } else {
            if (player.onGround) {
                // Just left ground
                const groundAngle = this.getGroundAngle(player.x);
                if (!this.isPressed && groundAngle < -0.1) { // Launching uphill
                    const launchBoost = Math.min(player.momentum / 20, 8);
                    player.vy -= launchBoost;
                    player.momentum = Math.max(player.momentum - 10, 0);
                    
                    this.createLaunchParticles();
                    this.playSound('glideSound');
                }
            }
            
            player.onGround = false;
            player.airTime++;
            player.glowIntensity = Math.max(player.glowIntensity - 0.05, 0);
        }
        
        // Lose momentum gradually when not on ground or not pressing
        if (!player.onGround || !this.isPressed) {
            player.momentum = Math.max(player.momentum - 0.5, 0);
        }
    }
    
    handleLanding() {
        const player = this.player;
        const landingSpeed = Math.abs(player.vy);
        const groundAngle = this.getGroundAngle(player.x);
        const velocityAngle = Math.atan2(player.vy, player.vx);
        
        // Calculate landing quality
        const angleAlignment = 1 - Math.abs(velocityAngle - groundAngle) / Math.PI;
        const speedFactor = Math.min(landingSpeed / 10, 1);
        player.landingQuality = angleAlignment * speedFactor;
        
        // Perfect landing detection
        if (player.landingQuality > 0.7 && player.airTime > 30) {
            player.combo++;
            this.bestCombo = Math.max(this.bestCombo, player.combo);
            player.momentum = Math.min(player.momentum + 20, player.maxMomentum);
            this.score += 50 * player.combo;
            
            this.createComboParticles();
            this.playSound('comboSound');
            this.camera.shake = 8;
        } else if (player.landingQuality < 0.3) {
            player.combo = 0;
        }
        
        this.playSound('landingSound');
    }
    
    updatePlayerTrail() {
        const player = this.player;
        
        // Add new trail point
        player.trail.push({
            x: player.x,
            y: player.y,
            alpha: 1,
            momentum: player.momentum / player.maxMomentum
        });
        
        // Limit trail length
        const maxTrailLength = this.settings.quality === 'high' ? 15 : 
                              this.settings.quality === 'medium' ? 10 : 5;
        
        if (player.trail.length > maxTrailLength) {
            player.trail.shift();
        }
        
        // Fade trail
        for (let i = 0; i < player.trail.length; i++) {
            player.trail[i].alpha = i / player.trail.length;
        }
    }
    
    updateSquashStretch() {
        const player = this.player;
        const targetScaleX = 1 + Math.abs(player.vx) / 50;
        const targetScaleY = 1 + Math.abs(player.vy) / 50;
        
        player.squashStretch.scaleX += (targetScaleX - player.squashStretch.scaleX) * 0.1;
        player.squashStretch.scaleY += (targetScaleY - player.squashStretch.scaleY) * 0.1;
    }
    
    updateCamera() {
        const player = this.player;
        
        // Camera follows player with momentum-based offset
        this.camera.targetX = player.x - this.canvas.width * 0.3;
        this.camera.targetY = player.y - this.canvas.height * 0.5;
        
        // Smooth camera movement
        this.camera.x += (this.camera.targetX - this.camera.x) * 0.1;
        this.camera.y += (this.camera.targetY - this.camera.y) * 0.05;
        
        // Camera shake
        if (this.camera.shake > 0) {
            this.camera.x += (Math.random() - 0.5) * this.camera.shake;
            this.camera.y += (Math.random() - 0.5) * this.camera.shake;
            this.camera.shake *= 0.9;
        }
    }
    
    updateCollectibles() {
        this.collectibles.forEach(item => {
            if (item.collected) return;
            
            item.sparkleTimer += 0.2;
            
            // Check collision with player
            const dx = item.x - this.player.x;
            const dy = item.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < item.width) {
                item.collected = true;
                
                if (item.type === 'star') {
                    this.starsCollected++;
                    this.score += item.value * (1 + this.player.combo);
                    this.playSound('starSound');
                } else if (item.type === 'powerup') {
                    this.activatePowerUp(item.powerType);
                    this.score += item.value;
                    this.playSound('powerupSound');
                }
                
                this.createCollectionParticles(item.x, item.y, item.type);
            }
        });
    }
    
    activatePowerUp(type) {
        const player = this.player;
        
        switch (type) {
            case 'speed':
                player.vx += 10;
                this.camera.shake = 5;
                break;
            case 'jump':
                if (player.onGround) {
                    player.vy -= 15;
                    player.onGround = false;
                }
                break;
            case 'magnet':
                // Attract nearby collectibles
                this.collectibles.forEach(item => {
                    if (!item.collected && item.type === 'star') {
                        const dx = item.x - player.x;
                        const dy = item.y - player.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < 200) {
                            item.x += (player.x - item.x) * 0.1;
                            item.y += (player.y - item.y) * 0.1;
                        }
                    }
                });
                break;
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity || 0.1;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateDayNight() {
        this.dayNightCycle += this.dayNightSpeed;
        if (this.dayNightCycle > 1) {
            this.dayNightCycle = 0;
        }
    }
    
    updateTimer() {
        this.timeLeft -= 1/60; // Assuming 60 FPS
        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }
    
    updateTerrain() {
        const playerX = this.player.x;
        const lastPoint = this.terrain.points[this.terrain.points.length - 1];
        
        if (lastPoint.x < playerX + this.canvas.width * 2) {
            // Generate more terrain
            const baseHeight = this.canvas.height * 0.75;
            
            for (let x = lastPoint.x + 20; x <= lastPoint.x + 1000; x += 20) {
                let y = baseHeight;
                
                for (let octave = 0; octave < this.terrain.octaves; octave++) {
                    const freq = this.terrain.frequency * Math.pow(2, octave);
                    const amp = this.terrain.amplitude / Math.pow(2, octave);
                    y += Math.sin((x + this.terrain.seed) * freq) * amp;
                }
                
                const distanceVariation = Math.sin(x * 0.001) * 50 * (x / 2000);
                y += distanceVariation;
                
                this.terrain.points.push({ x, y });
            }
            
            this.updateTerrainSegments();
        }
        
        // Clean up old terrain points
        const minX = playerX - this.canvas.width;
        this.terrain.points = this.terrain.points.filter(point => point.x > minX);
        this.updateTerrainSegments();
    }
    
    updateUI() {
        document.getElementById('scoreValue').textContent = Math.floor(this.score);
        document.getElementById('distanceValue').textContent = this.distance;
        document.getElementById('speedValue').textContent = Math.floor(this.player.vx);
        document.getElementById('starsValue').textContent = this.starsCollected;
        document.getElementById('comboValue').textContent = this.player.combo;
        document.getElementById('timeValue').textContent = Math.ceil(this.timeLeft);
        
        // Update momentum bar
        const momentumPercent = (this.player.momentum / this.player.maxMomentum) * 100;
        document.getElementById('momentumFill').style.width = momentumPercent + '%';
        
        // Update action hint
        const hint = this.isPressed ? 'DIVING' : 'HOLD TO DIVE';
        document.getElementById('actionHint').textContent = hint;
        
        // Update day/night indicator
        const timeOfDay = this.dayNightCycle < 0.5 ? 'DAY' : 'NIGHT';
        document.getElementById('timeOfDay').textContent = timeOfDay;
        document.getElementById('dayNightFill').style.width = (this.dayNightCycle * 100) + '%';
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing') {
            this.renderBackground();
            this.renderParallax();
            this.renderTerrain();
            this.renderCollectibles();
            this.renderPlayer();
            this.renderParticles();
        }
    }
    
    renderBackground() {
        const ctx = this.ctx;
        
        // Sky gradient based on day/night cycle
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        
        if (this.dayNightCycle < 0.5) {
            // Day colors
            const t = this.dayNightCycle * 2;
            gradient.addColorStop(0, `hsl(200, 70%, ${80 - t * 20}%)`);
            gradient.addColorStop(0.6, `hsl(220, 60%, ${90 - t * 30}%)`);
            gradient.addColorStop(1, `hsl(60, 80%, ${85 - t * 15}%)`);
        } else {
            // Night colors
            const t = (this.dayNightCycle - 0.5) * 2;
            gradient.addColorStop(0, `hsl(240, 60%, ${20 + t * 10}%)`);
            gradient.addColorStop(0.6, `hsl(260, 70%, ${15 + t * 15}%)`);
            gradient.addColorStop(1, `hsl(280, 50%, ${25 + t * 10}%)`);
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Stars at night
        if (this.dayNightCycle > 0.6) {
            this.renderStars();
        }
    }
    
    renderStars() {
        const ctx = this.ctx;
        ctx.fillStyle = `rgba(255, 255, 255, ${(this.dayNightCycle - 0.6) * 2.5})`;
        
        for (let i = 0; i < 50; i++) {
            const x = (i * 137 + this.camera.x * 0.1) % this.canvas.width;
            const y = (i * 73) % (this.canvas.height * 0.5);
            const size = 1 + (i % 3) * 0.5;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderParallax() {
        const ctx = this.ctx;
        
        this.parallaxLayers.forEach((layer, index) => {
            const offsetX = this.camera.x * layer.speed;
            const alpha = this.dayNightCycle < 0.5 ? 0.6 - this.dayNightCycle * 0.4 : 0.4 + (this.dayNightCycle - 0.5) * 0.2;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = layer.color;
            
            // Simple wave-like shapes for parallax layers
            ctx.beginPath();
            ctx.moveTo(-offsetX, layer.y);
            
            for (let x = -offsetX; x < this.canvas.width - offsetX + 200; x += 100) {
                const waveHeight = 30 + index * 20;
                const y = layer.y + Math.sin((x + offsetX) * 0.01) * waveHeight;
                ctx.lineTo(x, y);
            }
            
            ctx.lineTo(this.canvas.width, this.canvas.height);
            ctx.lineTo(-offsetX, this.canvas.height);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    }
    
    renderTerrain() {
        const ctx = this.ctx;
        
        // Terrain gradient
        const gradient = ctx.createLinearGradient(0, this.canvas.height * 0.6, 0, this.canvas.height);
        gradient.addColorStop(0, '#90EE90');
        gradient.addColorStop(0.5, '#DEB887');
        gradient.addColorStop(1, '#8B4513');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        
        let firstPoint = true;
        this.terrain.points.forEach(point => {
            const screenX = point.x - this.camera.x;
            const screenY = point.y - this.camera.y;
            
            if (screenX > -100 && screenX < this.canvas.width + 100) {
                if (firstPoint) {
                    ctx.moveTo(screenX, screenY);
                    firstPoint = false;
                } else {
                    ctx.lineTo(screenX, screenY);
                }
            }
        });
        
        // Close the path to fill the terrain
        ctx.lineTo(this.canvas.width, this.canvas.height);
        ctx.lineTo(0, this.canvas.height);
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
    }
    
    renderCollectibles() {
        const ctx = this.ctx;
        
        this.collectibles.forEach(item => {
            if (item.collected) return;
            
            const screenX = item.x - this.camera.x;
            const screenY = item.y - this.camera.y;
            
            if (screenX < -50 || screenX > this.canvas.width + 50) return;
            
            ctx.save();
            ctx.translate(screenX, screenY);
            
            if (item.type === 'star') {
                this.renderStar(ctx, item.sparkleTimer);
            } else if (item.type === 'powerup') {
                this.renderPowerUp(ctx, item.powerType, item.sparkleTimer);
            }
            
            ctx.restore();
        });
    }
    
    renderStar(ctx, sparkleTimer) {
        const size = 10 + Math.sin(sparkleTimer) * 2;
        
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const outerRadius = size;
            const innerRadius = size * 0.5;
            
            const outerX = Math.cos(angle) * outerRadius;
            const outerY = Math.sin(angle) * outerRadius;
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * innerRadius;
            const innerY = Math.sin(innerAngle) * innerRadius;
            
            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
        
        // Sparkle effect
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(Math.sin(sparkleTimer * 2) * size * 0.7, Math.cos(sparkleTimer * 1.5) * size * 0.7, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderPowerUp(ctx, type, sparkleTimer) {
        const size = 12 + Math.sin(sparkleTimer) * 3;
        
        let color = '#FF6B6B';
        let symbol = '⚡';
        
        switch (type) {
            case 'speed':
                color = '#FF6B6B';
                symbol = '🚀';
                break;
            case 'jump':
                color = '#4ECDC4';
                symbol = '⬆️';
                break;
            case 'magnet':
                color = '#9B59B6';
                symbol = '🧲';
                break;
        }
        
        ctx.fillStyle = color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(-size, -size, size * 2, size * 2, 5);
        ctx.fill();
        ctx.stroke();
        
        // Symbol
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(symbol, 0, 0);
    }
    
    renderPlayer() {
        const ctx = this.ctx;
        const player = this.player;
        
        const screenX = player.x - this.camera.x;
        const screenY = player.y - this.camera.y;
        
        // Render trail
        if (player.trail.length > 1) {
            ctx.strokeStyle = `rgba(255, 215, 0, 0.6)`;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            for (let i = 0; i < player.trail.length; i++) {
                const point = player.trail[i];
                const trailScreenX = point.x - this.camera.x;
                const trailScreenY = point.y - this.camera.y;
                
                ctx.globalAlpha = point.alpha * point.momentum;
                if (i === 0) {
                    ctx.moveTo(trailScreenX, trailScreenY);
                } else {
                    ctx.lineTo(trailScreenX, trailScreenY);
                }
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(player.angle * 0.3); // Subtle rotation
        ctx.scale(player.squashStretch.scaleX, player.squashStretch.scaleY);
        
        // Glow effect for high momentum
        if (player.glowIntensity > 0) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 20 * player.glowIntensity;
        }
        
        // Render character based on selected type
        this.renderCharacter(ctx);
        
        ctx.restore();
    }
    
    renderCharacter(ctx) {
        const characterType = this.settings.character;
        
        switch (characterType) {
            case 'bird':
                this.renderBird(ctx);
                break;
            case 'alien':
                this.renderAlien(ctx);
                break;
            case 'creature':
                this.renderCreature(ctx);
                break;
        }
    }
    
    renderBird(ctx) {
        // Body
        ctx.fillStyle = '#4ECDC4';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing
        ctx.fillStyle = '#45B7B8';
        ctx.beginPath();
        ctx.ellipse(-5, -2, 8, 4, Math.sin(Date.now() * 0.01) * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(15, -2);
        ctx.lineTo(15, 2);
        ctx.closePath();
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(3, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(4, -3, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderAlien(ctx) {
        // Head
        ctx.fillStyle = '#9B59B6';
        ctx.beginPath();
        ctx.ellipse(0, -2, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = '#8E44AD';
        ctx.beginPath();
        ctx.ellipse(0, 5, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(-3, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(3, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Antennae
        ctx.strokeStyle = '#9B59B6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-3, -12);
        ctx.lineTo(-5, -18);
        ctx.moveTo(3, -12);
        ctx.lineTo(5, -18);
        ctx.stroke();
        
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(-5, -18, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -18, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderCreature(ctx) {
        // Body
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Spikes
        ctx.fillStyle = '#E55555';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-8 + i * 8, -6);
            ctx.lineTo(-4 + i * 8, -12);
            ctx.lineTo(0 + i * 8, -6);
            ctx.closePath();
            ctx.fill();
        }
        
        // Face
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-3, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-3, 0, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, 0, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 2, 3, 0, Math.PI);
        ctx.stroke();
    }
    
    renderParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach(particle => {
            const screenX = particle.x - this.camera.x;
            const screenY = particle.y - this.camera.y;
            
            if (screenX < -50 || screenX > this.canvas.width + 50) return;
            
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            
            if (particle.sparkle) {
                // Sparkle particle
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(particle.rotation || 0);
                ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
                ctx.restore();
            } else {
                // Regular particle
                ctx.beginPath();
                ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }
    
    // Particle creation methods
    createMomentumParticles() {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: this.player.x + (Math.random() - 0.5) * 20,
                y: this.player.y + this.player.radius + Math.random() * 10,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3,
                size: 2 + Math.random() * 3,
                color: `hsl(${45 + Math.random() * 30}, 100%, 60%)`,
                alpha: 1,
                life: 30 + Math.random() * 20,
                maxLife: 30 + Math.random() * 20,
                gravity: 0.1
            });
        }
    }
    
    createLaunchParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.player.x + (Math.random() - 0.5) * 30,
                y: this.player.y + this.player.radius,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * 6 + 2,
                size: 3 + Math.random() * 4,
                color: `hsl(${200 + Math.random() * 40}, 80%, 70%)`,
                alpha: 1,
                life: 40 + Math.random() * 30,
                maxLife: 40 + Math.random() * 30,
                gravity: 0.1
            });
        }
    }
    
    createComboParticles() {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: this.player.x + (Math.random() - 0.5) * 40,
                y: this.player.y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12 - 3,
                size: 4 + Math.random() * 3,
                color: `hsl(${45 + Math.random() * 15}, 100%, ${60 + Math.random() * 20}%)`,
                alpha: 1,
                life: 50 + Math.random() * 30,
                maxLife: 50 + Math.random() * 30,
                gravity: 0.05,
                sparkle: true,
                rotation: Math.random() * Math.PI * 2
            });
        }
    }
    
    createCollectionParticles(x, y, type) {
        const color = type === 'star' ? '#FFD700' : '#FF6B6B';
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                size: 2 + Math.random() * 3,
                color: color,
                alpha: 1,
                life: 30 + Math.random() * 20,
                maxLife: 30 + Math.random() * 20,
                gravity: 0.1,
                sparkle: type === 'star'
            });
        }
    }
    
    // Utility methods
    getGroundHeight(x) {
        // Find the terrain segment containing this x position
        for (let segment of this.terrain.segments) {
            if (x >= segment.x1 && x <= segment.x2) {
                // Linear interpolation between segment points
                const t = (x - segment.x1) / (segment.x2 - segment.x1);
                return segment.y1 + (segment.y2 - segment.y1) * t;
            }
        }
        
        // Default ground height if no segment found
        return this.canvas.height * 0.75;
    }
    
    getGroundAngle(x) {
        const segment = this.terrain.segments.find(seg => x >= seg.x1 && x <= seg.x2);
        if (segment) {
            return Math.atan2(segment.y2 - segment.y1, segment.x2 - segment.x1);
        }
        return 0;
    }
    
    // Game state methods
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseMenu').classList.remove('hidden');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseMenu').classList.add('hidden');
        }
    }
    
    endGame() {
        this.gameState = 'gameOver';
        
        // Update final scores
        document.getElementById('finalScore').textContent = `Final Score: ${Math.floor(this.score)}`;
        document.getElementById('finalDistance').textContent = `Distance: ${this.distance}m`;
        document.getElementById('starsCollected').textContent = `Stars: ${this.starsCollected}`;
        document.getElementById('bestCombo').textContent = `Best Combo: ${this.bestCombo}x`;
        
        // Check for high score
        const isHighScore = this.checkHighScore(this.score);
        if (isHighScore) {
            document.getElementById('highScoreMessage').classList.remove('hidden');
        } else {
            document.getElementById('highScoreMessage').classList.add('hidden');
        }
        
        document.getElementById('gameOver').classList.remove('hidden');
        this.stopSound('backgroundMusic');
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Hide all dialogs
        document.querySelectorAll('.dialog').forEach(dialog => {
            dialog.classList.add('hidden');
        });
        
        // Show target screen
        document.getElementById(screenId).classList.add('active');
        
        if (screenId === 'titleScreen') {
            this.gameState = 'menu';
            this.stopSound('backgroundMusic');
        }
    }
    
    // High Score Management
    checkHighScore(score) {
        const newScore = {
            score: Math.floor(score),
            distance: this.distance,
            date: new Date().toLocaleDateString()
        };
        
        this.highScores.push(newScore);
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 5);
        
        this.saveHighScores();
        this.updateHighScoresDisplay();
        
        return this.highScores[0].score === newScore.score;
    }
    
    updateHighScoresDisplay() {
        const entries = document.querySelectorAll('.high-score-entry');
        
        entries.forEach((entry, index) => {
            const score = this.highScores[index] || { score: 0, distance: 0 };
            entry.querySelector('.score').textContent = score.score;
            entry.querySelector('.distance').textContent = score.distance + 'm';
        });
    }
    
    clearHighScores() {
        this.highScores = [];
        this.saveHighScores();
        this.updateHighScoresDisplay();
    }
    
    loadHighScores() {
        try {
            const saved = localStorage.getItem('skyglider_highscores');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveHighScores() {
        try {
            localStorage.setItem('skyglider_highscores', JSON.stringify(this.highScores));
        } catch (e) {
            console.log('Could not save high scores');
        }
    }
    
    // Settings Management
    loadSettings() {
        try {
            const saved = localStorage.getItem('skyglider_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.log('Could not load settings');
        }
        
        // Update UI
        document.getElementById('soundToggle').checked = this.settings.sound;
        document.getElementById('musicToggle').checked = this.settings.music;
        document.getElementById('qualitySelect').value = this.settings.quality;
        document.getElementById('characterSelect').value = this.settings.character;
    }
    
    saveSettings() {
        try {
            localStorage.setItem('skyglider_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.log('Could not save settings');
        }
    }
    
    // Audio Methods
    playSound(soundId, loop = false) {
        if (!this.settings.sound && soundId !== 'backgroundMusic') return;
        if (!this.settings.music && soundId === 'backgroundMusic') return;
        
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.loop = loop;
            audio.currentTime = 0;
            audio.play().catch(() => {}); // Ignore audio play errors
        }
    }
    
    stopSound(soundId) {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
    
    // Game Loop
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new SkyGliderGame();
});

// Add CanvasRenderingContext2D.roundRect if not supported
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}