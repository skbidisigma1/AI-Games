// HadleeKart - Complete 2D Racing Game
// Modular architecture for extensibility and maintainability

/**
 * Main Game Class - Orchestrates all game systems
 */
class HadleeKartGame {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        
        // Game state
        this.gameState = 'title'; // 'title', 'trackSelection', 'racing', 'paused', 'complete'
        this.selectedTrack = 'classic';
        this.currentLap = 1;
        this.totalLaps = 3;
        this.raceTime = 0;
        this.bestLapTime = Infinity;
        this.lapTimes = [];
        
        // Game systems
        this.renderer = new RenderingEngine(this.ctx, this.minimapCtx);
        this.inputHandler = new InputHandler();
        this.physics = new PhysicsEngine();
        this.aiSystem = new AISystem();
        this.powerUpSystem = new PowerUpSystem();
        this.gameStateManager = new GameStateManager();
        
        // Game objects
        this.track = null;
        this.playerKart = null;
        this.aiKarts = [];
        this.powerUps = [];
        this.particles = [];
        
        // Camera with zoom scale for closer view
        this.camera = { x: 0, y: 0, scale: 1.5 };
        
        this.init();
    }
    
    /**
     * Initialize game systems and setup
     */
    init() {
        this.setupEventListeners();
        this.createTrack();
        this.createKarts();
        this.gameLoop();
    }
    
    /**
     * Setup all event listeners for UI and controls
     */
    setupEventListeners() {
        // Start race button (now opens track selection)
        document.getElementById('startRace').addEventListener('click', () => {
            this.showTrackSelection();
        });
        
        // Back to title button
        document.getElementById('backToTitle').addEventListener('click', () => {
            this.backToTitle();
        });
        
        // Track selection buttons
        document.querySelectorAll('.track-button').forEach((button, index) => {
            button.addEventListener('click', () => {
                const trackOption = button.closest('.track-option');
                const trackType = trackOption.getAttribute('data-track');
                this.selectTrack(trackType);
            });
        });
        
        // Restart race button
        document.getElementById('restartRace').addEventListener('click', () => {
            this.restartRace();
        });
        
        // Back to menu button
        document.getElementById('backToMenu').addEventListener('click', () => {
            this.backToMenu();
        });
        
        // Input handling
        this.inputHandler.setupEventListeners();
        
        // Initialize track previews
        this.initializeTrackPreviews();
    }
    
    /**
     * Create the racing track with checkpoints and visual elements
     */
    createTrack() {
        this.track = new RacingTrack(this.selectedTrack);
    }
    
    /**
     * Show track selection screen
     */
    showTrackSelection() {
        this.gameState = 'trackSelection';
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('trackSelection').classList.add('active');
    }
    
    /**
     * Go back to title screen
     */
    backToTitle() {
        this.gameState = 'title';
        document.getElementById('trackSelection').classList.remove('active');
        document.getElementById('titleScreen').classList.add('active');
    }
    
    /**
     * Select a track and start the race
     */
    selectTrack(trackType) {
        this.selectedTrack = trackType;
        this.createTrack();
        this.createKarts();
        this.startRace();
    }
    
    /**
     * Initialize track preview canvases
     */
    initializeTrackPreviews() {
        const trackTypes = ['classic', 'figure8', 'mountain', 'city'];
        
        trackTypes.forEach(trackType => {
            const canvas = document.querySelector(`[data-track="${trackType}"] .track-canvas`);
            const ctx = canvas.getContext('2d');
            
            // Create a mini track for preview
            const previewTrack = new RacingTrack(trackType);
            this.renderTrackPreview(ctx, previewTrack, canvas.width, canvas.height);
        });
    }
    
    /**
     * Render a small preview of the track
     */
    renderTrackPreview(ctx, track, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        // Calculate scale to fit track in canvas
        const scaleX = width / track.width;
        const scaleY = height / track.height;
        const scale = Math.min(scaleX, scaleY) * 0.8;
        
        const offsetX = (width - track.width * scale) / 2;
        const offsetY = (height - track.height * scale) / 2;
        
        // Draw track background
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, 0, width, height);
        
        // Draw track path
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 8 * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        track.trackPoints.forEach((point, index) => {
            const x = point.x * scale + offsetX;
            const y = point.y * scale + offsetY;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.stroke();
        
        // Draw start/finish line
        if (track.trackPoints.length > 0) {
            const start = track.trackPoints[0];
            const next = track.trackPoints[1];
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            
            const angle = Math.atan2(next.y - start.y, next.x - start.x) + Math.PI/2;
            const lineLength = 20 * scale;
            
            const startX = start.x * scale + offsetX;
            const startY = start.y * scale + offsetY;
            
            ctx.beginPath();
            ctx.moveTo(
                startX - Math.cos(angle) * lineLength,
                startY - Math.sin(angle) * lineLength
            );
            ctx.lineTo(
                startX + Math.cos(angle) * lineLength,
                startY + Math.sin(angle) * lineLength
            );
            ctx.stroke();
        }
    }
    
    /**
     * Create player kart and 7 AI karts
     */
    createKarts() {
        // Create player kart
        const startPos = this.track.getStartPosition(0);
        this.playerKart = new Kart(startPos.x, startPos.y, '#e74c3c', true);
        
        // Create AI karts
        this.aiKarts = [];
        const kartColors = ['#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
        
        for (let i = 0; i < 7; i++) {
            const pos = this.track.getStartPosition(i + 1);
            const aiKart = new Kart(pos.x, pos.y, kartColors[i], false);
            aiKart.aiPersonality = this.aiSystem.generatePersonality();
            this.aiKarts.push(aiKart);
        }
    }
    
    /**
     * Start the race
     */
    startRace() {
        this.gameState = 'racing';
        this.raceTime = 0;
        this.currentLap = 1;
        
        // Reset all karts
        this.playerKart.reset();
        this.aiKarts.forEach(kart => kart.reset());
        
        // Generate initial power-ups
        this.powerUpSystem.generatePowerUps(this.track);
        
        // Switch UI from track selection to game
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('trackSelection').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        
        // Reset camera position
        this.camera.x = 0;
        this.camera.y = 0;
        
        this.updateHUD();
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Update all game systems
     */
    update() {
        if (this.gameState !== 'racing') return;
        
        const deltaTime = 1 / 60; // Assuming 60 FPS
        this.raceTime += deltaTime;
        
        // Update player kart
        this.updatePlayerKart(deltaTime);
        
        // Update AI karts
        this.updateAIKarts(deltaTime);
        
        // Update power-ups
        this.powerUpSystem.update(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update camera
        this.updateCamera();
        
        // Check lap completion
        this.checkLapCompletion();
        
        // Update HUD
        this.updateHUD();
    }
    
    /**
     * Update player kart based on input
     */
    updatePlayerKart(deltaTime) {
        const input = this.inputHandler.getInputState();
        this.physics.updateKart(this.playerKart, input, deltaTime);
        
        // Handle power-up usage
        if (input.usePowerUp && this.playerKart.powerUp) {
            this.powerUpSystem.usePowerUp(this.playerKart, this.getAllKarts());
        }
    }
    
    /**
     * Update all AI karts
     */
    updateAIKarts(deltaTime) {
        this.aiKarts.forEach(kart => {
            const aiInput = this.aiSystem.getAIInput(kart, this.track, this.getAllKarts());
            this.physics.updateKart(kart, aiInput, deltaTime);
            
            // AI power-up usage
            if (kart.powerUp && Math.random() < 0.02) { // 2% chance per frame
                this.powerUpSystem.usePowerUp(kart, this.getAllKarts());
            }
        });
    }
    
    /**
     * Update particle effects
     */
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return !particle.isDead();
        });
    }
    
    /**
     * Check all types of collisions
     */
    checkCollisions() {
        const allKarts = this.getAllKarts();
        
        // Kart-to-kart collisions
        for (let i = 0; i < allKarts.length; i++) {
            for (let j = i + 1; j < allKarts.length; j++) {
                if (this.physics.checkKartCollision(allKarts[i], allKarts[j])) {
                    this.physics.resolveKartCollision(allKarts[i], allKarts[j]);
                    this.createCollisionParticles(allKarts[i], allKarts[j]);
                }
            }
        }
        
        // Kart-to-track collisions
        allKarts.forEach(kart => {
            if (this.track.checkCollision(kart)) {
                this.physics.resolveTrackCollision(kart, this.track);
            }
        });
        
        // Power-up collisions
        this.powerUpSystem.checkCollisions(allKarts, this.track);
        
        // Oil slick collisions
        if (window.oilSlicks) {
            window.oilSlicks = window.oilSlicks.filter(oilSlick => {
                if (!oilSlick.active) return false;
                
                // Update oil slick
                oilSlick.update(1/60);
                
                // Check collision with all karts
                allKarts.forEach(kart => {
                    if (oilSlick.checkCollision(kart)) {
                        this.createCollisionParticles(kart, { x: oilSlick.x, y: oilSlick.y });
                    }
                });
                
                return oilSlick.active;
            });
        }
    }
    
    /**
     * Update camera to follow player
     */
    updateCamera() {
        // Calculate viewport size based on zoom
        const viewportWidth = this.canvas.width / this.camera.scale;
        const viewportHeight = this.canvas.height / this.camera.scale;
        
        const targetX = this.playerKart.x - viewportWidth / 2;
        const targetY = this.playerKart.y - viewportHeight / 2;
        
        // More responsive camera following for better control feel
        this.camera.x += (targetX - this.camera.x) * 0.15;
        this.camera.y += (targetY - this.camera.y) * 0.15;
        
        // Keep camera within track bounds considering zoom
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.track.width - viewportWidth));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.track.height - viewportHeight));
    }
    
    /**
     * Check if any kart has completed a lap
     */
    checkLapCompletion() {
        const allKarts = this.getAllKarts();
        
        allKarts.forEach(kart => {
            if (this.track.checkLapCompletion(kart)) {
                const lapTime = kart.raceTime - (kart.lastLapTime || 0);
                kart.completeLap();
                kart.lastLapTime = kart.raceTime;
                
                if (kart.isPlayer) {
                    this.currentLap = kart.lapsCompleted + 1;
                    
                    // Show lap notification for player
                    this.showLapNotification(lapTime);
                    
                    // Update best lap time
                    if (lapTime < this.bestLapTime) {
                        this.bestLapTime = lapTime;
                    }
                    
                    if (kart.lapsCompleted >= this.totalLaps) {
                        this.completeRace();
                    }
                }
            }
        });
    }
    
    /**
     * Show lap completion notification
     */
    showLapNotification(lapTime) {
        const notification = document.getElementById('lapNotification');
        const timeElement = document.getElementById('lapNotificationTime');
        
        timeElement.textContent = `Lap Time: ${this.formatTime(lapTime)}`;
        
        notification.classList.remove('hidden');
        
        // Hide after animation completes
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
    
    /**
     * Complete the race
     */
    completeRace() {
        this.gameState = 'complete';
        
        // Calculate final position
        const allKarts = this.getAllKarts();
        allKarts.sort((a, b) => {
            if (b.lapsCompleted !== a.lapsCompleted) {
                return b.lapsCompleted - a.lapsCompleted;
            }
            return a.raceTime - b.raceTime;
        });
        
        const finalPosition = allKarts.findIndex(kart => kart.isPlayer) + 1;
        
        // Update UI
        document.getElementById('finalPosition').textContent = this.getOrdinalNumber(finalPosition);
        document.getElementById('bestLapTime').textContent = this.formatTime(this.bestLapTime);
        document.getElementById('raceComplete').classList.remove('hidden');
    }
    
    /**
     * Render all game elements
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.minimapCtx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // Set camera transform with zoom
        this.ctx.save();
        this.ctx.scale(this.camera.scale, this.camera.scale);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render game elements
        this.renderer.renderTrack(this.track);
        this.renderer.renderPowerUps(this.powerUpSystem.powerUps);
        this.renderer.renderOilSlicks(window.oilSlicks || []);
        this.renderer.renderKarts(this.getAllKarts());
        this.renderer.renderParticles(this.particles);
        
        this.ctx.restore();
        
        // Render minimap
        this.renderer.renderMinimap(this.track, this.getAllKarts(), this.camera);
    }
    
    /**
     * Update HUD elements
     */
    updateHUD() {
        if (this.gameState !== 'racing') return;
        
        // Update position
        const allKarts = this.getAllKarts();
        const sortedKarts = [...allKarts].sort((a, b) => {
            if (b.lapsCompleted !== a.lapsCompleted) {
                return b.lapsCompleted - a.lapsCompleted;
            }
            return this.track.getDistanceAlongTrack(b) - this.track.getDistanceAlongTrack(a);
        });
        
        const position = sortedKarts.findIndex(kart => kart.isPlayer) + 1;
        document.getElementById('currentPosition').textContent = position;
        
        // Update lap
        document.getElementById('currentLap').textContent = this.currentLap;
        
        // Update speed (convert to mph for display)
        const speed = Math.round(this.playerKart.speed * 10);
        document.getElementById('currentSpeed').textContent = speed;
        
        // Update power-up display
        const powerUpIcon = document.getElementById('powerUpIcon');
        if (this.playerKart.powerUp) {
            powerUpIcon.textContent = this.playerKart.powerUp.name;
            powerUpIcon.className = `powerup-${this.playerKart.powerUp.type}`;
        } else {
            powerUpIcon.textContent = 'NONE';
            powerUpIcon.className = 'powerup-empty';
        }
    }
    
    /**
     * Create collision particles between two karts
     */
    createCollisionParticles(kart1, kart2) {
        const midX = (kart1.x + kart2.x) / 2;
        const midY = (kart1.y + kart2.y) / 2;
        
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(
                midX, midY,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                '#ff6b6b', 1.0
            ));
        }
    }
    
    /**
     * Get all karts (player + AI)
     */
    getAllKarts() {
        return [this.playerKart, ...this.aiKarts];
    }
    
    /**
     * Restart the race
     */
    restartRace() {
        document.getElementById('raceComplete').classList.add('hidden');
        this.startRace();
    }
    
    /**
     * Go back to main menu
     */
    backToMenu() {
        this.gameState = 'title';
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('titleScreen').classList.add('active');
        document.getElementById('raceComplete').classList.add('hidden');
    }
    
    /**
     * Utility function to get ordinal numbers (1st, 2nd, 3rd, etc.)
     */
    getOrdinalNumber(num) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const value = num % 100;
        return num + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
    }
    
    /**
     * Format time in MM:SS.ms format
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
}

/**
 * Input Handler - Manages keyboard input for player controls
 */
class InputHandler {
    constructor() {
        this.keys = {};
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    getInputState() {
        return {
            accelerate: this.keys['w'] || this.keys['arrowup'],
            brake: this.keys['s'] || this.keys['arrowdown'],
            turnLeft: this.keys['a'] || this.keys['arrowleft'],
            turnRight: this.keys['d'] || this.keys['arrowright'],
            drift: this.keys['shift'],
            usePowerUp: this.keys[' '] // spacebar
        };
    }
}

/**
 * Physics Engine - Handles all physics calculations for karts
 */
class PhysicsEngine {
    constructor() {
        this.maxSpeed = 5; // Reduced from 8 for better control
        this.acceleration = 0.25; // Reduced from 0.3 for smoother acceleration
        this.deceleration = 0.95;
        this.turnSpeed = 0.08;
        this.driftFactor = 0.85;
    }
    
    updateKart(kart, input, deltaTime) {
        // Handle acceleration and braking
        if (input.accelerate) {
            kart.speed += this.acceleration * deltaTime * 60;
        } else if (input.brake) {
            kart.speed -= this.acceleration * 1.5 * deltaTime * 60;
        } else {
            kart.speed *= this.deceleration;
        }
        
        // Clamp speed
        kart.speed = Math.max(-this.maxSpeed * 0.5, Math.min(this.maxSpeed, kart.speed));
        
        // Handle turning (only when moving)
        if (Math.abs(kart.speed) > 0.1) {
            if (input.turnLeft) {
                kart.angle -= this.turnSpeed * (kart.speed / this.maxSpeed);
            }
            if (input.turnRight) {
                kart.angle += this.turnSpeed * (kart.speed / this.maxSpeed);
            }
        }
        
        // Handle drifting
        if (input.drift && Math.abs(kart.speed) > 2) {
            kart.isDrifting = true;
            kart.driftAngle += (input.turnLeft ? -1 : input.turnRight ? 1 : 0) * 0.05;
            kart.driftAngle *= this.driftFactor;
        } else {
            kart.isDrifting = false;
            kart.driftAngle *= 0.9; // Gradually reduce drift
        }
        
        // Calculate movement
        const moveAngle = kart.angle + kart.driftAngle;
        kart.vx = Math.cos(moveAngle) * kart.speed;
        kart.vy = Math.sin(moveAngle) * kart.speed;
        
        // Update position
        kart.x += kart.vx * deltaTime * 60;
        kart.y += kart.vy * deltaTime * 60;
        
        // Update kart state
        kart.raceTime += deltaTime;
    }
    
    checkKartCollision(kart1, kart2) {
        const dx = kart1.x - kart2.x;
        const dy = kart1.y - kart2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (kart1.radius + kart2.radius);
    }
    
    resolveKartCollision(kart1, kart2) {
        const dx = kart1.x - kart2.x;
        const dy = kart1.y - kart2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return; // Prevent division by zero
        
        // Normalize collision vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Separate karts
        const overlap = (kart1.radius + kart2.radius) - distance;
        kart1.x += nx * overlap * 0.5;
        kart1.y += ny * overlap * 0.5;
        kart2.x -= nx * overlap * 0.5;
        kart2.y -= ny * overlap * 0.5;
        
        // Exchange some velocity
        const relativeVelocity = (kart1.vx - kart2.vx) * nx + (kart1.vy - kart2.vy) * ny;
        if (relativeVelocity > 0) return; // Objects moving apart
        
        const impulse = 2 * relativeVelocity / 2; // Assuming equal mass
        kart1.vx -= impulse * nx;
        kart1.vy -= impulse * ny;
        kart2.vx += impulse * nx;
        kart2.vy += impulse * ny;
        
        // Reduce speed on collision
        kart1.speed *= 0.8;
        kart2.speed *= 0.8;
    }
    
    resolveTrackCollision(kart, track) {
        // Simple bounce off track boundaries
        if (kart.x < kart.radius) {
            kart.x = kart.radius;
            kart.vx = Math.abs(kart.vx);
            kart.speed *= 0.5;
        }
        if (kart.x > track.width - kart.radius) {
            kart.x = track.width - kart.radius;
            kart.vx = -Math.abs(kart.vx);
            kart.speed *= 0.5;
        }
        if (kart.y < kart.radius) {
            kart.y = kart.radius;
            kart.vy = Math.abs(kart.vy);
            kart.speed *= 0.5;
        }
        if (kart.y > track.height - kart.radius) {
            kart.y = track.height - kart.radius;
            kart.vy = -Math.abs(kart.vy);
            kart.speed *= 0.5;
        }
    }
}

/**
 * Kart Class - Represents a racing kart (player or AI)
 */
class Kart {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isPlayer = isPlayer;
        
        // Physics properties
        this.speed = 0;
        this.angle = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 12;
        
        // Drift properties
        this.isDrifting = false;
        this.driftAngle = 0;
        
        // Race properties
        this.lapsCompleted = 0;
        this.raceTime = 0;
        this.lastCheckpoint = 0;
        
        // Power-up
        this.powerUp = null;
        
        // AI properties
        this.aiPersonality = null;
        
        // Store initial position for reset
        this.initialX = x;
        this.initialY = y;
    }
    
    reset() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.speed = 0;
        this.angle = 0;
        this.vx = 0;
        this.vy = 0;
        this.isDrifting = false;
        this.driftAngle = 0;
        this.lapsCompleted = 0;
        this.raceTime = 0;
        this.lastCheckpoint = 0;
        this.powerUp = null;
    }
    
    completeLap() {
        this.lapsCompleted++;
        this.lastCheckpoint = 0;
    }
}

/**
 * Racing Track Class - Defines the track layout and collision detection
 */
class RacingTrack {
    constructor(trackType = 'classic') {
        this.trackType = trackType;
        this.width = 2000;
        this.height = 1400;
        
        // Track path points based on selected type
        this.trackPoints = this.generateTrackPoints(trackType);
        this.trackWidth = 120;
        
        // Checkpoints for lap detection
        this.checkpoints = this.generateCheckpoints();
        
        // Start positions
        this.startPositions = this.generateStartPositions();
    }
    
    generateTrackPoints(trackType = 'classic') {
        const points = [];
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        switch (trackType) {
            case 'classic':
                return this.generateClassicOval(centerX, centerY);
            case 'figure8':
                return this.generateFigure8(centerX, centerY);
            case 'mountain':
                return this.generateMountainCircuit(centerX, centerY);
            case 'city':
                return this.generateCityStreets(centerX, centerY);
            default:
                return this.generateClassicOval(centerX, centerY);
        }
    }
    
    generateClassicOval(centerX, centerY) {
        const points = [];
        const radiusX = 600;
        const radiusY = 400;
        
        // Create an oval track with some interesting curves
        for (let i = 0; i < 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            let x = centerX + Math.cos(angle) * radiusX;
            let y = centerY + Math.sin(angle) * radiusY;
            
            // Add some variation to make it more interesting
            if (i >= 16 && i <= 24) { // Top right curve
                x += Math.sin(angle * 3) * 50;
            } else if (i >= 40 && i <= 48) { // Bottom left curve
                y += Math.cos(angle * 2) * 40;
            }
            
            points.push({ x, y });
        }
        
        return points;
    }
    
    generateFigure8(centerX, centerY) {
        const points = [];
        const radius = 350;
        
        // First loop (top)
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY - 200 + Math.sin(angle) * radius * 0.7;
            points.push({ x, y });
        }
        
        // Second loop (bottom)
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            const x = centerX - Math.cos(angle) * radius;
            const y = centerY + 200 + Math.sin(angle) * radius * 0.7;
            points.push({ x, y });
        }
        
        return points;
    }
    
    generateMountainCircuit(centerX, centerY) {
        const points = [];
        const segments = [
            // Straight section
            { type: 'straight', startX: centerX - 400, startY: centerY + 300, endX: centerX + 400, endY: centerY + 300, points: 16 },
            // Tight hairpin
            { type: 'hairpin', centerX: centerX + 400, centerY: centerY + 150, radius: 150, points: 20 },
            // Mountain climb
            { type: 'spiral', centerX: centerX + 200, centerY: centerY - 100, radius: 200, points: 16 },
            // Fast descent
            { type: 'curve', centerX: centerX - 200, centerY: centerY - 200, radius: 250, points: 12 }
        ];
        
        segments.forEach(segment => {
            for (let i = 0; i < segment.points; i++) {
                const t = i / segment.points;
                let x, y;
                
                switch (segment.type) {
                    case 'straight':
                        x = segment.startX + (segment.endX - segment.startX) * t;
                        y = segment.startY + (segment.endY - segment.startY) * t;
                        break;
                    case 'hairpin':
                        const angle = Math.PI * (1 + t);
                        x = segment.centerX + Math.cos(angle) * segment.radius;
                        y = segment.centerY + Math.sin(angle) * segment.radius;
                        break;
                    case 'spiral':
                        const spiralAngle = t * Math.PI * 1.5;
                        x = segment.centerX + Math.cos(spiralAngle) * (segment.radius * (1 - t * 0.3));
                        y = segment.centerY + Math.sin(spiralAngle) * (segment.radius * (1 - t * 0.3));
                        break;
                    case 'curve':
                        const curveAngle = t * Math.PI;
                        x = segment.centerX + Math.cos(curveAngle) * segment.radius;
                        y = segment.centerY + Math.sin(curveAngle) * segment.radius;
                        break;
                }
                
                points.push({ x, y });
            }
        });
        
        return points;
    }
    
    generateCityStreets(centerX, centerY) {
        const points = [];
        const blockSize = 200;
        
        // Create a street circuit through city blocks
        const waypoints = [
            { x: centerX - blockSize * 2, y: centerY + blockSize },
            { x: centerX + blockSize * 2, y: centerY + blockSize },
            { x: centerX + blockSize * 2, y: centerY - blockSize * 0.5 },
            { x: centerX + blockSize, y: centerY - blockSize * 0.5 },
            { x: centerX + blockSize, y: centerY - blockSize * 1.5 },
            { x: centerX - blockSize, y: centerY - blockSize * 1.5 },
            { x: centerX - blockSize, y: centerY },
            { x: centerX - blockSize * 2, y: centerY }
        ];
        
        // Connect waypoints with smooth curves
        for (let i = 0; i < waypoints.length; i++) {
            const start = waypoints[i];
            const end = waypoints[(i + 1) % waypoints.length];
            
            // Add intermediate points for smooth curves
            for (let j = 0; j < 8; j++) {
                const t = j / 8;
                const x = start.x + (end.x - start.x) * t;
                const y = start.y + (end.y - start.y) * t;
                
                // Add some curve to corners
                if (j < 4) {
                    const curve = Math.sin(t * Math.PI) * 30;
                    points.push({ x: x + curve, y: y + curve });
                } else {
                    points.push({ x, y });
                }
            }
        }
        
        return points;
    }
    
    generateCheckpoints() {
        const checkpoints = [];
        const numCheckpoints = 8;
        
        for (let i = 0; i < numCheckpoints; i++) {
            const pointIndex = Math.floor((i / numCheckpoints) * this.trackPoints.length);
            const point = this.trackPoints[pointIndex];
            checkpoints.push({
                x: point.x,
                y: point.y,
                radius: 80,
                id: i
            });
        }
        
        return checkpoints;
    }
    
    generateStartPositions() {
        const positions = [];
        const startPoint = this.trackPoints[0];
        const angle = Math.atan2(
            this.trackPoints[1].y - startPoint.y,
            this.trackPoints[1].x - startPoint.x
        );
        
        // Arrange karts in a grid formation
        for (let i = 0; i < 8; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            
            const offsetX = Math.cos(angle - Math.PI / 2) * (col * 40 - 20);
            const offsetY = Math.sin(angle - Math.PI / 2) * (col * 40 - 20);
            const backOffset = row * 50;
            
            positions.push({
                x: startPoint.x + offsetX - Math.cos(angle) * backOffset,
                y: startPoint.y + offsetY - Math.sin(angle) * backOffset
            });
        }
        
        return positions;
    }
    
    getStartPosition(kartIndex) {
        return this.startPositions[kartIndex] || this.startPositions[0];
    }
    
    checkCollision(kart) {
        // Simple track boundary collision (can be enhanced with proper track collision)
        return kart.x < 50 || kart.x > this.width - 50 || 
               kart.y < 50 || kart.y > this.height - 50;
    }
    
    checkLapCompletion(kart) {
        // Check if kart has passed through all checkpoints in order
        const nextCheckpoint = kart.lastCheckpoint;
        const checkpoint = this.checkpoints[nextCheckpoint];
        
        if (checkpoint) {
            const dx = kart.x - checkpoint.x;
            const dy = kart.y - checkpoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < checkpoint.radius) {
                kart.lastCheckpoint = (nextCheckpoint + 1) % this.checkpoints.length;
                
                // If completed all checkpoints, lap is complete
                return kart.lastCheckpoint === 0 && nextCheckpoint === this.checkpoints.length - 1;
            }
        }
        
        return false;
    }
    
    getDistanceAlongTrack(kart) {
        // Calculate how far along the track the kart is (for position calculation)
        const checkpointProgress = kart.lastCheckpoint / this.checkpoints.length;
        return kart.lapsCompleted + checkpointProgress;
    }
}

/**
 * AI System - Controls AI kart behavior and pathfinding
 */
class AISystem {
    constructor() {
        this.personalityTypes = [
            { aggression: 0.8, skill: 0.9, riskTaking: 0.7, name: 'Aggressive' },
            { aggression: 0.3, skill: 0.8, riskTaking: 0.4, name: 'Cautious' },
            { aggression: 0.6, skill: 0.95, riskTaking: 0.5, name: 'Skilled' },
            { aggression: 0.7, skill: 0.6, riskTaking: 0.8, name: 'Risky' },
            { aggression: 0.4, skill: 0.7, riskTaking: 0.3, name: 'Defensive' },
            { aggression: 0.9, skill: 0.7, riskTaking: 0.9, name: 'Reckless' },
            { aggression: 0.5, skill: 0.85, riskTaking: 0.6, name: 'Balanced' }
        ];
    }
    
    generatePersonality() {
        return this.personalityTypes[Math.floor(Math.random() * this.personalityTypes.length)];
    }
    
    getAIInput(kart, track, allKarts) {
        const input = {
            accelerate: false,
            brake: false,
            turnLeft: false,
            turnRight: false,
            drift: false,
            usePowerUp: false
        };
        
        // Find target point on track
        const targetPoint = this.getTargetPoint(kart, track);
        
        // Calculate angle to target
        const dx = targetPoint.x - kart.x;
        const dy = targetPoint.y - kart.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Calculate angle difference
        let angleDiff = targetAngle - kart.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Steering logic
        const turnThreshold = 0.1 * kart.aiPersonality.skill;
        if (angleDiff > turnThreshold) {
            input.turnRight = true;
        } else if (angleDiff < -turnThreshold) {
            input.turnLeft = true;
        }
        
        // Speed control
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
        const shouldBrake = Math.abs(angleDiff) > 0.5 || this.checkForObstacles(kart, allKarts);
        
        if (shouldBrake) {
            input.brake = true;
        } else {
            input.accelerate = true;
        }
        
        // Drifting (based on personality)
        if (Math.abs(angleDiff) > 0.3 && kart.speed > 3 && Math.random() < kart.aiPersonality.riskTaking * 0.1) {
            input.drift = true;
        }
        
        return input;
    }
    
    getTargetPoint(kart, track) {
        // Get next checkpoint as target
        const nextCheckpoint = track.checkpoints[kart.lastCheckpoint];
        if (nextCheckpoint) {
            return { x: nextCheckpoint.x, y: nextCheckpoint.y };
        }
        
        // Fallback to first checkpoint
        return { x: track.checkpoints[0].x, y: track.checkpoints[0].y };
    }
    
    checkForObstacles(kart, allKarts) {
        // Check if there's another kart too close ahead
        const lookaheadDistance = 80;
        const futureX = kart.x + Math.cos(kart.angle) * lookaheadDistance;
        const futureY = kart.y + Math.sin(kart.angle) * lookaheadDistance;
        
        for (const otherKart of allKarts) {
            if (otherKart === kart) continue;
            
            const dx = otherKart.x - futureX;
            const dy = otherKart.y - futureY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 40) {
                return true;
            }
        }
        
        return false;
    }
}

/**
 * Power-Up System - Manages all power-ups in the game
 */
class PowerUpSystem {
    constructor() {
        this.powerUps = [];
        this.powerUpTypes = [
            { type: 'mushroom', name: '🍄', spawnRate: 0.25 },
            { type: 'banana', name: '🍌', spawnRate: 0.20 },
            { type: 'shell', name: '🔴', spawnRate: 0.15 },
            { type: 'lightning', name: '⚡', spawnRate: 0.05 },
            { type: 'oil', name: '🛢️', spawnRate: 0.15 },
            { type: 'shield', name: '🛡️', spawnRate: 0.10 },
            { type: 'teleporter', name: '🌀', spawnRate: 0.05 },
            { type: 'star', name: '⭐', spawnRate: 0.05 }
        ];
    }
    
    generatePowerUps(track) {
        this.powerUps = [];
        
        // Generate power-ups around the track
        for (let i = 0; i < 15; i++) {
            const randomPoint = track.trackPoints[Math.floor(Math.random() * track.trackPoints.length)];
            const powerUpType = this.getRandomPowerUpType();
            
            this.powerUps.push(new PowerUp(
                randomPoint.x + (Math.random() - 0.5) * 100,
                randomPoint.y + (Math.random() - 0.5) * 100,
                powerUpType
            ));
        }
    }
    
    getRandomPowerUpType() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const type of this.powerUpTypes) {
            cumulative += type.spawnRate;
            if (rand < cumulative) {
                return type;
            }
        }
        
        return this.powerUpTypes[0]; // Fallback
    }
    
    update(deltaTime) {
        this.powerUps.forEach(powerUp => {
            powerUp.update(deltaTime);
        });
    }
    
    checkCollisions(allKarts, track) {
        allKarts.forEach(kart => {
            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const powerUp = this.powerUps[i];
                
                if (powerUp.active && this.checkKartPowerUpCollision(kart, powerUp)) {
                    if (!kart.powerUp) { // Only pick up if no power-up held
                        kart.powerUp = powerUp.type;
                        this.powerUps.splice(i, 1);
                        
                        // Respawn power-up elsewhere after delay
                        setTimeout(() => {
                            this.respawnPowerUp(track);
                        }, 5000 + Math.random() * 5000);
                    }
                }
            }
        });
    }
    
    checkKartPowerUpCollision(kart, powerUp) {
        const dx = kart.x - powerUp.x;
        const dy = kart.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (kart.radius + powerUp.radius);
    }
    
    usePowerUp(kart, allKarts) {
        if (!kart.powerUp) return;
        
        const powerUpType = kart.powerUp.type;
        kart.powerUp = null;
        
        switch (powerUpType) {
            case 'mushroom':
                this.applySpeedBoost(kart);
                break;
            case 'banana':
                this.deployBanana(kart);
                break;
            case 'shell':
                this.fireHomingShell(kart, allKarts);
                break;
            case 'lightning':
                this.castLightning(kart, allKarts);
                break;
            case 'oil':
                this.deployOilSlick(kart);
                break;
            case 'shield':
                this.activateShield(kart);
                break;
            case 'teleporter':
                this.teleportAhead(kart, allKarts);
                break;
            case 'star':
                this.activateSuperStar(kart);
                break;
        }
    }
    
    applySpeedBoost(kart) {
        kart.speed *= 1.5;
        // Speed boost lasts for 2 seconds
        setTimeout(() => {
            if (kart.speed > 8) kart.speed = Math.min(kart.speed, 8);
        }, 2000);
    }
    
    deployBanana(kart) {
        // Create banana peel behind the kart
        const bananaX = kart.x - Math.cos(kart.angle) * 30;
        const bananaY = kart.y - Math.sin(kart.angle) * 30;
        
        this.powerUps.push(new BananaPeel(bananaX, bananaY));
    }
    
    fireHomingShell(kart, allKarts) {
        // Find nearest opponent
        let nearestKart = null;
        let nearestDistance = Infinity;
        
        allKarts.forEach(otherKart => {
            if (otherKart !== kart) {
                const dx = otherKart.x - kart.x;
                const dy = otherKart.y - kart.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestKart = otherKart;
                }
            }
        });
        
        if (nearestKart) {
            // Create homing shell
            this.powerUps.push(new HomingShell(kart.x, kart.y, nearestKart));
        }
    }
    
    castLightning(caster, allKarts) {
        // Create lightning flash effect
        const flash = document.createElement('div');
        flash.className = 'lightning-flash';
        document.body.appendChild(flash);
        
        setTimeout(() => {
            document.body.removeChild(flash);
        }, 300);
        
        // Affect all other karts
        allKarts.forEach(kart => {
            if (kart !== caster) {
                kart.speed *= 0.3; // Slow down significantly
                // Effect lasts 3 seconds
                setTimeout(() => {
                    // Recovery is gradual
                }, 3000);
            }
        });
    }
    
    deployOilSlick(kart) {
        // Create oil slick behind the kart
        const oilSlick = new OilSlick(
            kart.x - Math.cos(kart.angle) * 30,
            kart.y - Math.sin(kart.angle) * 30
        );
        
        // Add to a global oil slicks array that would be checked for collisions
        if (!window.oilSlicks) window.oilSlicks = [];
        window.oilSlicks.push(oilSlick);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            const index = window.oilSlicks.indexOf(oilSlick);
            if (index > -1) window.oilSlicks.splice(index, 1);
        }, 15000);
    }
    
    activateShield(kart) {
        kart.hasShield = true;
        kart.shieldTime = 8000; // 8 seconds of protection
        
        // Remove shield after duration
        setTimeout(() => {
            kart.hasShield = false;
            kart.shieldTime = 0;
        }, 8000);
    }
    
    teleportAhead(kart, allKarts) {
        // Find kart ahead of current kart
        const sortedKarts = [...allKarts].sort((a, b) => {
            const aProgress = a.lapsCompleted + (a.lastCheckpoint / 8);
            const bProgress = b.lapsCompleted + (b.lastCheckpoint / 8);
            return bProgress - aProgress;
        });
        
        const currentIndex = sortedKarts.indexOf(kart);
        if (currentIndex > 0) {
            const targetKart = sortedKarts[currentIndex - 1];
            // Teleport slightly behind the target kart
            kart.x = targetKart.x - Math.cos(targetKart.angle) * 50;
            kart.y = targetKart.y - Math.sin(targetKart.angle) * 50;
        }
    }
    
    activateSuperStar(kart) {
        kart.superStar = true;
        kart.originalMaxSpeed = kart.speed;
        kart.speed *= 2; // Double speed
        kart.invulnerable = true; // Can't be affected by other power-ups
        
        // Effect lasts 5 seconds
        setTimeout(() => {
            kart.superStar = false;
            kart.invulnerable = false;
            kart.speed = Math.min(kart.speed, kart.originalMaxSpeed || 5);
        }, 5000);
    }
    
    respawnPowerUp(track) {
        const randomPoint = track.trackPoints[Math.floor(Math.random() * track.trackPoints.length)];
        const powerUpType = this.getRandomPowerUpType();
        
        this.powerUps.push(new PowerUp(
            randomPoint.x + (Math.random() - 0.5) * 100,
            randomPoint.y + (Math.random() - 0.5) * 100,
            powerUpType
        ));
    }
}

/**
 * Power-Up Base Class
 */
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 15;
        this.active = true;
        this.animationTime = 0;
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
    }
}

/**
 * Banana Peel Class - Special power-up that causes skidding
 */
class BananaPeel extends PowerUp {
    constructor(x, y) {
        super(x, y, { type: 'banana', name: '🍌' });
        this.lifetime = 10; // Disappears after 10 seconds
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }
}

/**
 * Homing Shell Class - Projectile that targets opponents
 */
class HomingShell extends PowerUp {
    constructor(x, y, target) {
        super(x, y, { type: 'shell', name: '🔴' });
        this.target = target;
        this.speed = 6;
        this.vx = 0;
        this.vy = 0;
        this.lifetime = 8; // Disappears after 8 seconds
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.target && this.active) {
            // Home in on target
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                this.vx = (dx / distance) * this.speed;
                this.vy = (dy / distance) * this.speed;
                
                this.x += this.vx * deltaTime * 60;
                this.y += this.vy * deltaTime * 60;
                
                // Check collision with target
                if (distance < this.radius + this.target.radius) {
                    this.hitTarget();
                }
            }
        }
        
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }
    
    hitTarget() {
        if (this.target) {
        }
    }
}

/**
 * Oil Slick Class - Causes karts to skid and lose control
 */
class OilSlick {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.active = true;
        this.lifetime = 15000; // 15 seconds
        this.animationTime = 0;
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        this.lifetime -= deltaTime * 1000;
        
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }
    
    checkCollision(kart) {
        if (!this.active || kart.hasShield || kart.invulnerable) return false;
        
        const dx = kart.x - this.x;
        const dy = kart.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.radius + kart.radius) {
            // Apply slippery effect
            kart.speed *= 0.5;
            kart.angle += (Math.random() - 0.5) * 0.5; // Random skid
            return true;
        }
        return false;
    }
}

/**
 * Particle Class - For visual effects
 */
class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.alpha = 1;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime;
        this.alpha = this.life / this.maxLife;
        
        // Add gravity
        this.vy += 200 * deltaTime;
        
        // Air resistance
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    
    isDead() {
        return this.life <= 0;
    }
}

/**
 * Rendering Engine - Handles all visual rendering
 */
class RenderingEngine {
    constructor(ctx, minimapCtx) {
        this.ctx = ctx;
        this.minimapCtx = minimapCtx;
    }
    
    renderTrack(track) {
        const ctx = this.ctx;
        
        // Draw track surface
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, 0, track.width, track.height);
        
        // Draw track path
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = track.trackWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        track.trackPoints.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.closePath();
        ctx.stroke();
        
        // Draw track inner surface
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = track.trackWidth - 20;
        ctx.stroke();
        
        // Draw lane markings
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw checkpoints (for debugging - can be removed)
        track.checkpoints.forEach((checkpoint, index) => {
            ctx.beginPath();
            ctx.arc(checkpoint.x, checkpoint.y, checkpoint.radius, 0, Math.PI * 2);
            ctx.strokeStyle = index === 0 ? '#e74c3c' : '#f39c12';
            ctx.lineWidth = 3;
            ctx.stroke();
        });
        
        // Draw start/finish line
        const startPoint = track.trackPoints[0];
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(startPoint.x - 50, startPoint.y);
        ctx.lineTo(startPoint.x + 50, startPoint.y);
        ctx.stroke();
    }
    
    renderKarts(karts) {
        const ctx = this.ctx;
        
        karts.forEach(kart => {
            ctx.save();
            ctx.translate(kart.x, kart.y);
            ctx.rotate(kart.angle);
            
            // Draw kart shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(-kart.radius + 2, -kart.radius/2 + 2, kart.radius * 2, kart.radius);
            
            // Draw kart body
            ctx.fillStyle = kart.color;
            ctx.fillRect(-kart.radius, -kart.radius/2, kart.radius * 2, kart.radius);
            
            // Draw kart details
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(kart.radius - 4, -kart.radius/3, 6, kart.radius/1.5);
            
            // Draw drift smoke
            if (kart.isDrifting && kart.speed > 2) {
                for (let i = 0; i < 3; i++) {
                    ctx.fillStyle = `rgba(200, 200, 200, ${0.3 - i * 0.1})`;
                    ctx.beginPath();
                    ctx.arc(-kart.radius - i * 8, 0, 4 + i * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            ctx.restore();
            
            // Draw shield effect (after restore to avoid rotation)
            if (kart.hasShield) {
                ctx.save();
                ctx.translate(kart.x, kart.y);
                
                const time = Date.now() * 0.01;
                ctx.strokeStyle = `rgba(52, 152, 219, ${0.7 + Math.sin(time) * 0.3})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, kart.radius + 8, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.restore();
            }
            
            // Draw super star effect
            if (kart.superStar) {
                ctx.save();
                ctx.translate(kart.x, kart.y);
                
                const time = Date.now() * 0.02;
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2 + time;
                    const x = Math.cos(angle) * (kart.radius + 15);
                    const y = Math.sin(angle) * (kart.radius + 15);
                    
                    ctx.fillStyle = `rgba(241, 196, 15, ${0.8 + Math.sin(time + i) * 0.2})`;
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('⭐', x, y);
                }
                
                ctx.restore();
            }
        });
    }
    
    renderPowerUps(powerUps) {
        const ctx = this.ctx;
        
        powerUps.forEach(powerUp => {
            if (!powerUp.active) return;
            
            ctx.save();
            ctx.translate(powerUp.x, powerUp.y);
            
            // Floating animation
            const floatOffset = Math.sin(powerUp.animationTime * 3) * 5;
            ctx.translate(0, floatOffset);
            
            // Draw power-up background
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, powerUp.radius + 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw power-up icon
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerUp.type.name, 0, 0);
            
            ctx.restore();
        });
    }
    
    renderOilSlicks(oilSlicks) {
        const ctx = this.ctx;
        
        oilSlicks.forEach(oilSlick => {
            if (!oilSlick.active) return;
            
            ctx.save();
            ctx.translate(oilSlick.x, oilSlick.y);
            
            // Draw oil slick with gradient
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, oilSlick.radius);
            gradient.addColorStop(0, 'rgba(44, 62, 80, 0.8)');
            gradient.addColorStop(0.7, 'rgba(44, 62, 80, 0.4)');
            gradient.addColorStop(1, 'rgba(44, 62, 80, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, oilSlick.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add some shine effect
            const time = oilSlick.animationTime * 2;
            ctx.fillStyle = `rgba(127, 140, 141, ${0.3 + Math.sin(time) * 0.2})`;
            ctx.beginPath();
            ctx.arc(-5, -5, oilSlick.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    renderParticles(particles) {
        const ctx = this.ctx;
        
        particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    renderMinimap(track, karts, camera) {
        const ctx = this.minimapCtx;
        const scale = 0.08;
        
        // Clear minimap
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw track outline
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        track.trackPoints.forEach((point, index) => {
            const x = point.x * scale;
            const y = point.y * scale;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.stroke();
        
        // Draw karts
        karts.forEach(kart => {
            const x = kart.x * scale;
            const y = kart.y * scale;
            
            ctx.fillStyle = kart.isPlayer ? '#e74c3c' : kart.color;
            ctx.beginPath();
            ctx.arc(x, y, kart.isPlayer ? 3 : 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw camera viewport
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            camera.x * scale,
            camera.y * scale,
            150 * scale,
            105 * scale
        );
    }
}

/**
 * Game State Manager - Handles game state transitions and persistence
 */
class GameStateManager {
    constructor() {
        this.state = 'title';
        this.previousState = null;
    }
    
    setState(newState) {
        this.previousState = this.state;
        this.state = newState;
    }
    
    getPreviousState() {
        return this.previousState;
    }
    
    getCurrentState() {
        return this.state;
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new HadleeKartGame();
    window.game = game; // Make game accessible for debugging
});