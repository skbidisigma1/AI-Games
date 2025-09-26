/**
 * Lost Citadel - Main Game Engine
 * Core game systems, initialization, and main game loop
 */

// Game configuration constants
const CONFIG = {
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,
    GRAVITY: 0.8,
    FRICTION: 0.85,
    AIR_FRICTION: 0.98,
    TILE_SIZE: 32,
    CAMERA_LERP: 0.1,
    MAX_FALL_SPEED: 20,
    COLLISION_PRECISION: 8,
    PARTICLE_COUNT: 500,
    SOUND_VOLUME: 0.3,
    
    // Physics constants
    PHYSICS: {
        GRAVITY: 0.8,
        FRICTION: 0.85,
        AIR_FRICTION: 0.98,
        WALL_FRICTION: 0.7,
        BOUNCE_DAMPING: 0.6,
        TERMINAL_VELOCITY: 20
    },
    
    // Rendering constants
    RENDER: {
        CAMERA_SHAKE_DECAY: 0.9,
        PARALLAX_LAYERS: 3,
        PARTICLE_FADE_RATE: 0.02,
        ANIMATION_SPEED: 0.16,
        SCREEN_SHAKE_INTENSITY: 5
    },
    
    // Combat constants
    COMBAT: {
        HITSTUN_DURATION: 20,
        INVINCIBILITY_DURATION: 60,
        KNOCKBACK_STRENGTH: 8,
        CRITICAL_HIT_CHANCE: 0.1,
        COMBO_WINDOW: 30
    }
};

// Game state management
class GameState {
    constructor() {
        this.current = 'title'; // title, playing, paused, dead, victory
        this.previous = null;
        this.transitions = new Map();
        this.stateData = {};
    }
    
    setState(newState, data = {}) {
        this.previous = this.current;
        this.current = newState;
        this.stateData = { ...this.stateData, ...data };
        
        // Execute transition callback if exists
        const transitionKey = `${this.previous}->${newState}`;
        if (this.transitions.has(transitionKey)) {
            this.transitions.get(transitionKey)(data);
        }
    }
    
    registerTransition(from, to, callback) {
        this.transitions.set(`${from}->${to}`, callback);
    }
    
    is(state) {
        return this.current === state;
    }
    
    was(state) {
        return this.previous === state;
    }
}

// Input management system
class InputManager {
    constructor() {
        this.keys = {};
        this.keysPressed = {};
        this.keysReleased = {};
        this.mouse = {
            x: 0,
            y: 0,
            buttons: {},
            wheel: 0
        };
        
        this.keyMappings = {
            // Movement
            'KeyA': 'left',
            'ArrowLeft': 'left',
            'KeyD': 'right',
            'ArrowRight': 'right',
            'KeyW': 'up',
            'ArrowUp': 'up',
            'Space': 'jump',
            'KeyS': 'down',
            'ArrowDown': 'down',
            
            // Combat
            'KeyZ': 'attack',
            'KeyX': 'attack2',
            'KeyC': 'special',
            
            // System
            'Escape': 'pause',
            'KeyM': 'map',
            'KeyR': 'restart',
            'Enter': 'confirm',
            'Backspace': 'back'
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            const action = this.keyMappings[e.code];
            if (action) {
                if (!this.keys[action]) {
                    this.keysPressed[action] = true;
                }
                this.keys[action] = true;
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const action = this.keyMappings[e.code];
            if (action) {
                this.keys[action] = false;
                this.keysReleased[action] = true;
                e.preventDefault();
            }
        });
        
        // Mouse events
        document.addEventListener('mousemove', (e) => {
            const rect = game.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height);
        });
        
        document.addEventListener('mousedown', (e) => {
            this.mouse.buttons[e.button] = true;
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouse.buttons[e.button] = false;
        });
        
        document.addEventListener('wheel', (e) => {
            this.mouse.wheel = e.deltaY;
            e.preventDefault();
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    isPressed(action) {
        return this.keysPressed[action] || false;
    }
    
    isHeld(action) {
        return this.keys[action] || false;
    }
    
    isReleased(action) {
        return this.keysReleased[action] || false;
    }
    
    clearFrameInputs() {
        this.keysPressed = {};
        this.keysReleased = {};
        this.mouse.wheel = 0;
    }
}

// Audio system
class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.music = new Map();
        this.soundVolume = CONFIG.SOUND_VOLUME;
        this.musicVolume = CONFIG.SOUND_VOLUME * 0.7;
        this.currentMusic = null;
        this.audioContext = null;
        
        this.initializeAudio();
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio not supported, using fallback');
        }
    }
    
    createSound(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSound(name, volume = 1.0) {
        // Generate procedural sounds
        switch (name) {
            case 'jump':
                this.createSound(300, 0.2, 'square', this.soundVolume * volume);
                break;
            case 'land':
                this.createSound(150, 0.1, 'sawtooth', this.soundVolume * volume * 0.5);
                break;
            case 'attack':
                this.createSound(400, 0.15, 'sawtooth', this.soundVolume * volume);
                break;
            case 'hit':
                this.createSound(800, 0.1, 'square', this.soundVolume * volume);
                break;
            case 'collect':
                this.createSound(600, 0.3, 'sine', this.soundVolume * volume);
                setTimeout(() => this.createSound(800, 0.2, 'sine', this.soundVolume * volume * 0.7), 100);
                break;
            case 'unlock':
                this.createSound(440, 0.5, 'sine', this.soundVolume * volume);
                setTimeout(() => this.createSound(554, 0.5, 'sine', this.soundVolume * volume * 0.8), 200);
                setTimeout(() => this.createSound(659, 0.7, 'sine', this.soundVolume * volume * 0.6), 400);
                break;
            case 'dash':
                this.createSound(200, 0.3, 'square', this.soundVolume * volume * 0.8);
                break;
            case 'enemy_hit':
                this.createSound(180, 0.2, 'sawtooth', this.soundVolume * volume * 0.7);
                break;
            case 'boss_hit':
                this.createSound(100, 0.4, 'square', this.soundVolume * volume);
                setTimeout(() => this.createSound(120, 0.3, 'square', this.soundVolume * volume * 0.8), 100);
                break;
        }
    }
    
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Particle system
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = CONFIG.PARTICLE_COUNT;
    }
    
    addParticle(x, y, options = {}) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift(); // Remove oldest particle
        }
        
        const particle = {
            x: x,
            y: y,
            vx: options.vx || (Math.random() - 0.5) * 8,
            vy: options.vy || (Math.random() - 0.5) * 8,
            life: options.life || 60,
            maxLife: options.life || 60,
            color: options.color || '#ffffff',
            size: options.size || Math.random() * 4 + 1,
            type: options.type || 'default',
            gravity: options.gravity !== undefined ? options.gravity : 0.1,
            friction: options.friction || 0.98,
            fadeRate: options.fadeRate || CONFIG.RENDER.PARTICLE_FADE_RATE
        };
        
        this.particles.push(particle);
    }
    
    addExplosion(x, y, count = 10, options = {}) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = options.speed || Math.random() * 6 + 2;
            
            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: options.color || '#ff6b6b',
                size: options.size || Math.random() * 3 + 2,
                life: options.life || 40,
                ...options
            });
        }
    }
    
    addTrail(x, y, vx, vy, options = {}) {
        this.addParticle(x, y, {
            vx: vx * -0.3 + (Math.random() - 0.5) * 2,
            vy: vy * -0.3 + (Math.random() - 0.5) * 2,
            color: options.color || '#4fc3f7',
            size: options.size || Math.random() * 2 + 1,
            life: options.life || 20,
            gravity: 0,
            friction: 0.95,
            ...options
        });
    }
    
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update physics
            p.vy += p.gravity;
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.x += p.vx;
            p.y += p.vy;
            
            // Update life
            p.life--;
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(ctx, camera) {
        ctx.save();
        
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            const screenX = p.x - camera.x;
            const screenY = p.y - camera.y;
            
            // Skip particles outside screen
            if (screenX < -10 || screenX > CONFIG.CANVAS_WIDTH + 10 ||
                screenY < -10 || screenY > CONFIG.CANVAS_HEIGHT + 10) {
                continue;
            }
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            
            if (p.type === 'spark') {
                // Draw spark as line
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX - p.vx * 2, screenY - p.vy * 2);
                ctx.stroke();
            } else {
                // Draw regular particle
                ctx.beginPath();
                ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    clear() {
        this.particles = [];
    }
}

// Camera system
class Camera {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.zoom = 1;
        this.bounds = null; // {left, right, top, bottom}
    }
    
    follow(target, lerp = CONFIG.CAMERA_LERP) {
        this.targetX = target.x + target.width / 2 - CONFIG.CANVAS_WIDTH / 2;
        this.targetY = target.y + target.height / 2 - CONFIG.CANVAS_HEIGHT / 2;
        
        // Apply bounds if set
        if (this.bounds) {
            this.targetX = Math.max(this.bounds.left, Math.min(this.bounds.right - CONFIG.CANVAS_WIDTH, this.targetX));
            this.targetY = Math.max(this.bounds.top, Math.min(this.bounds.bottom - CONFIG.CANVAS_HEIGHT, this.targetY));
        }
        
        // Smooth camera movement
        this.x += (this.targetX - this.x) * lerp;
        this.y += (this.targetY - this.y) * lerp;
    }
    
    shake(intensity, duration = 10) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }
    
    update() {
        // Update screen shake
        if (this.shakeIntensity > 0) {
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= CONFIG.RENDER.CAMERA_SHAKE_DECAY;
            
            if (this.shakeIntensity < 0.1) {
                this.shakeIntensity = 0;
                this.shakeX = 0;
                this.shakeY = 0;
            }
        }
    }
    
    getScreenX(worldX) {
        return worldX - this.x - this.shakeX;
    }
    
    getScreenY(worldY) {
        return worldY - this.y - this.shakeY;
    }
    
    getWorldX(screenX) {
        return screenX + this.x + this.shakeX;
    }
    
    getWorldY(screenY) {
        return screenY + this.y + this.shakeY;
    }
    
    setBounds(left, top, right, bottom) {
        this.bounds = { left, top, right, bottom };
    }
    
    clearBounds() {
        this.bounds = null;
    }
}

// Save system
class SaveManager {
    constructor() {
        this.saveKey = 'lostCitadelSave';
        this.defaultSave = {
            version: '1.0',
            player: {
                x: 100,
                y: 100,
                health: 100,
                maxHealth: 100,
                energy: 100,
                maxEnergy: 100,
                abilities: {
                    wallJump: false,
                    dash: false,
                    doubleJump: false
                }
            },
            world: {
                currentRoom: 'hub',
                unlockedRooms: ['hub'],
                collectedItems: [],
                defeatedEnemies: [],
                defeatedBosses: []
            },
            stats: {
                playTime: 0,
                deaths: 0,
                enemiesDefeated: 0,
                secretsFound: 0,
                areasExplored: 1
            },
            settings: {
                soundVolume: 0.3,
                musicVolume: 0.2,
                fullscreen: false
            }
        };
    }
    
    save(gameData) {
        try {
            const saveData = {
                ...this.defaultSave,
                ...gameData,
                timestamp: Date.now()
            };
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }
    
    load() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (saveData) {
                return JSON.parse(saveData);
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
        return null;
    }
    
    delete() {
        try {
            localStorage.removeItem(this.saveKey);
            return true;
        } catch (e) {
            console.error('Failed to delete save:', e);
            return false;
        }
    }
    
    exists() {
        return localStorage.getItem(this.saveKey) !== null;
    }
    
    getDefaultSave() {
        return JSON.parse(JSON.stringify(this.defaultSave));
    }
}

// Main Game class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Core systems
        this.state = new GameState();
        this.input = new InputManager();
        this.audio = new AudioManager();
        this.particles = new ParticleSystem();
        this.camera = new Camera();
        this.saveManager = new SaveManager();
        
        // Game objects (will be initialized by other modules)
        this.player = null;
        this.world = null;
        this.enemies = [];
        this.bosses = [];
        this.projectiles = [];
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameTime = 0;
        this.frameCount = 0;
        
        // Debug
        this.debugMode = false;
        this.showFPS = false;
        this.fps = 0;
        this.fpsCounter = 0;
        this.fpsTime = 0;
        
        this.initialize();
    }
    
    initialize() {
        // Set up canvas
        this.ctx.imageSmoothingEnabled = false;
        
        // Initialize game state transitions
        this.setupStateTransitions();
        
        // Initialize UI
        if (window.UIManager) {
            this.ui = new UIManager(this);
        }
        
        // Enable save/load button if save exists
        const loadButton = document.getElementById('loadGame');
        if (loadButton) {
            loadButton.disabled = !this.saveManager.exists();
        }
        
        // Start game loop
        this.gameLoop();
    }
    
    setupStateTransitions() {
        // Title -> Playing
        this.state.registerTransition('title', 'playing', () => {
            this.startNewGame();
        });
        
        // Playing -> Paused
        this.state.registerTransition('playing', 'paused', () => {
            // Pause logic handled in UI
        });
        
        // Any -> Title
        this.state.registerTransition('playing', 'title', () => {
            this.returnToTitle();
        });
        
        this.state.registerTransition('dead', 'title', () => {
            this.returnToTitle();
        });
        
        this.state.registerTransition('victory', 'title', () => {
            this.returnToTitle();
        });
    }
    
    startNewGame() {
        // Initialize player
        if (window.Player) {
            this.player = new Player(100, 500);
        }
        
        // Initialize world
        if (window.World) {
            this.world = new World();
            this.world.loadRoom('hub');
        }
        
        // Initialize abilities
        if (window.AbilityManager) {
            this.abilityManager = new AbilityManager(this.player);
        }
        
        // Reset camera
        this.camera.x = 0;
        this.camera.y = 0;
        
        // Clear particles
        this.particles.clear();
        
        // Resume audio context
        this.audio.resumeContext();
        
        // Reset timing
        this.gameTime = 0;
        
        console.log('New game started');
    }
    
    loadGame() {
        const saveData = this.saveManager.load();
        if (!saveData) {
            console.error('No save data found');
            return false;
        }
        
        // Start new game first
        this.startNewGame();
        
        // Apply save data
        if (this.player && saveData.player) {
            Object.assign(this.player, saveData.player);
        }
        
        if (this.world && saveData.world) {
            this.world.loadRoom(saveData.world.currentRoom);
            this.world.unlockedRooms = [...saveData.world.unlockedRooms];
            this.world.collectedItems = [...saveData.world.collectedItems];
            this.world.defeatedEnemies = [...saveData.world.defeatedEnemies];
            this.world.defeatedBosses = [...saveData.world.defeatedBosses];
        }
        
        this.gameTime = saveData.stats.playTime || 0;
        
        this.state.setState('playing');
        
        console.log('Game loaded successfully');
        return true;
    }
    
    saveGame() {
        if (!this.player || !this.world) {
            console.error('Cannot save: game not initialized');
            return false;
        }
        
        const saveData = {
            player: {
                x: this.player.x,
                y: this.player.y,
                health: this.player.health,
                maxHealth: this.player.maxHealth,
                energy: this.player.energy,
                maxEnergy: this.player.maxEnergy,
                abilities: { ...this.player.abilities }
            },
            world: {
                currentRoom: this.world.currentRoom,
                unlockedRooms: [...this.world.unlockedRooms],
                collectedItems: [...this.world.collectedItems],
                defeatedEnemies: [...this.world.defeatedEnemies],
                defeatedBosses: [...this.world.defeatedBosses]
            },
            stats: {
                playTime: this.gameTime,
                deaths: this.player.deaths || 0,
                enemiesDefeated: this.player.enemiesDefeated || 0,
                secretsFound: this.world.secretsFound || 0,
                areasExplored: this.world.unlockedRooms.length
            }
        };
        
        return this.saveManager.save(saveData);
    }
    
    returnToTitle() {
        // Clear game objects
        this.player = null;
        this.world = null;
        this.enemies = [];
        this.bosses = [];
        this.projectiles = [];
        
        // Clear particles
        this.particles.clear();
        
        // Reset camera
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.shakeIntensity = 0;
        
        // Reset timing
        this.gameTime = 0;
        
        console.log('Returned to title');
    }
    
    gameLoop(currentTime = 0) {
        // Calculate delta time
        this.deltaTime = Math.min(currentTime - this.lastTime, 33); // Cap at 30 FPS
        this.lastTime = currentTime;
        this.gameTime += this.deltaTime;
        this.frameCount++;
        
        // Update FPS counter
        this.fpsTime += this.deltaTime;
        this.fpsCounter++;
        if (this.fpsTime >= 1000) {
            this.fps = Math.round(this.fpsCounter * 1000 / this.fpsTime);
            this.fpsTime = 0;
            this.fpsCounter = 0;
        }
        
        // Update game
        this.update();
        
        // Render game
        this.render();
        
        // Clear frame inputs
        this.input.clearFrameInputs();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        // Handle global input
        if (this.input.isPressed('pause')) {
            if (this.state.is('playing')) {
                this.state.setState('paused');
                if (this.ui) this.ui.showPauseMenu();
            } else if (this.state.is('paused')) {
                this.state.setState('playing');
                if (this.ui) this.ui.hidePauseMenu();
            }
        }
        
        // Debug toggles
        if (this.input.isPressed('F1')) {
            this.debugMode = !this.debugMode;
        }
        
        if (this.input.isPressed('F2')) {
            this.showFPS = !this.showFPS;
        }
        
        // Only update game systems when playing
        if (this.state.is('playing')) {
            // Update camera first
            if (this.player) {
                this.camera.follow(this.player);
            }
            this.camera.update();
            
            // Update player
            if (this.player) {
                this.player.update(this.deltaTime);
            }
            
            // Update world
            if (this.world) {
                this.world.update(this.deltaTime);
            }
            
            // Update enemies
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                enemy.update(this.deltaTime);
                
                if (enemy.destroyed) {
                    this.enemies.splice(i, 1);
                }
            }
            
            // Update bosses
            for (let i = this.bosses.length - 1; i >= 0; i--) {
                const boss = this.bosses[i];
                boss.update(this.deltaTime);
                
                if (boss.destroyed) {
                    this.bosses.splice(i, 1);
                }
            }
            
            // Update projectiles
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const projectile = this.projectiles[i];
                projectile.update(this.deltaTime);
                
                if (projectile.destroyed) {
                    this.projectiles.splice(i, 1);
                }
            }
            
            // Update abilities
            if (this.abilityManager) {
                this.abilityManager.update(this.deltaTime);
            }
        }
        
        // Always update particles and UI
        this.particles.update();
        
        if (this.ui) {
            this.ui.update(this.deltaTime);
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // Only render game when playing or paused
        if (this.state.is('playing') || this.state.is('paused')) {
            this.ctx.save();
            
            // Apply camera transform
            this.ctx.translate(-this.camera.x - this.camera.shakeX, -this.camera.y - this.camera.shakeY);
            
            // Render world background
            if (this.world) {
                this.world.renderBackground(this.ctx, this.camera);
            }
            
            // Render world geometry
            if (this.world) {
                this.world.render(this.ctx, this.camera);
            }
            
            // Render enemies
            for (const enemy of this.enemies) {
                enemy.render(this.ctx, this.camera);
            }
            
            // Render bosses
            for (const boss of this.bosses) {
                boss.render(this.ctx, this.camera);
            }
            
            // Render player
            if (this.player) {
                this.player.render(this.ctx, this.camera);
            }
            
            // Render projectiles
            for (const projectile of this.projectiles) {
                projectile.render(this.ctx, this.camera);
            }
            
            // Render particles
            this.particles.render(this.ctx, this.camera);
            
            // Render world foreground
            if (this.world) {
                this.world.renderForeground(this.ctx, this.camera);
            }
            
            this.ctx.restore();
            
            // Render debug info
            if (this.debugMode) {
                this.renderDebug();
            }
        }
        
        // Render UI
        if (this.ui) {
            this.ui.render(this.ctx);
        }
        
        // Render FPS
        if (this.showFPS) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px monospace';
            this.ctx.fillText(`FPS: ${this.fps}`, 10, 30);
        }
    }
    
    renderDebug() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        this.ctx.font = '12px monospace';
        
        let y = 20;
        const debugInfo = [
            `State: ${this.state.current}`,
            `Camera: ${Math.round(this.camera.x)}, ${Math.round(this.camera.y)}`,
            `Particles: ${this.particles.particles.length}`,
            `Enemies: ${this.enemies.length}`,
            `Bosses: ${this.bosses.length}`,
            `Projectiles: ${this.projectiles.length}`
        ];
        
        if (this.player) {
            debugInfo.push(
                `Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`,
                `Velocity: ${Math.round(this.player.vx * 10) / 10}, ${Math.round(this.player.vy * 10) / 10}`,
                `Health: ${this.player.health}/${this.player.maxHealth}`,
                `Energy: ${this.player.energy}/${this.player.maxEnergy}`
            );
        }
        
        for (const info of debugInfo) {
            this.ctx.fillText(info, 10, y);
            y += 15;
        }
        
        this.ctx.restore();
    }
    
    // Utility methods for other modules
    addEnemy(enemy) {
        this.enemies.push(enemy);
    }
    
    addBoss(boss) {
        this.bosses.push(boss);
    }
    
    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }
    
    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index !== -1) {
            this.enemies.splice(index, 1);
        }
    }
    
    removeBoss(boss) {
        const index = this.bosses.indexOf(boss);
        if (index !== -1) {
            this.bosses.splice(index, 1);
        }
    }
    
    removeProjectile(projectile) {
        const index = this.projectiles.indexOf(projectile);
        if (index !== -1) {
            this.projectiles.splice(index, 1);
        }
    }
    
    // Collision detection utilities
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getAngle(obj1, obj2) {
        return Math.atan2(obj2.y - obj1.y, obj2.x - obj1.x);
    }
}

// Initialize game when DOM is loaded
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
    window.game = game; // Make globally accessible for other modules
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game, CONFIG };
}