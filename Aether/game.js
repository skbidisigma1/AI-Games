// Echoes of Aether - 2D Side-scrolling Action Platformer

class AetherGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'title'; // title, playing, paused, gameOver, help, progress
        this.isRunning = false;
        this.currentScreen = 'titleScreen';
        
        // Game world
        this.camera = { x: 0, y: 0 };
        this.world = { width: 2400, height: 1200 };
        this.gravity = 0.5;
        this.friction = 0.8;
        
        // Player data (persistent across runs)
        this.playerData = {
            totalCoins: 0,
            abilities: {
                doubleJump: false,
                dash: false,
                wallClimb: false,
                groundSmash: false
            },
            upgrades: {
                coinMagnet: false,
                extraHealth: false,
                invincibilityFrames: false,
                enemyDropBoost: false
            },
            zonesVisited: new Set(),
            runsCompleted: 0
        };
        
        // Current run data
        this.runData = {
            coins: 0,
            enemiesDefeated: 0,
            currentZone: 'Central',
            health: 100,
            maxHealth: 100,
            spellCharges: 3,
            maxSpellCharges: 3
        };
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.coins = [];
        this.platforms = [];
        this.backgroundElements = [];
        
        // Input handling
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.mousePressed = false;
        
        // Room system
        this.currentRoom = null;
        this.rooms = [];
        this.roomTransitions = [];
        
        // Zones
        this.zones = {
            Central: { color: '#4a4a6a', enemies: ['WispShade'], theme: 'neutral' },
            Pyra: { color: '#ff4444', enemies: ['WispShade', 'ElementalSpirit'], theme: 'fire' },
            Glacium: { color: '#44aaff', enemies: ['WispShade', 'TitanRemnant'], theme: 'ice' },
            Zephyra: { color: '#44ff44', enemies: ['ElementalSpirit'], theme: 'air' },
            Terran: { color: '#aa6644', enemies: ['TitanRemnant'], theme: 'earth' }
        };
        
        this.init();
    }
    
    init() {
        this.loadPlayerData();
        this.setupEventListeners();
        this.updateProgressScreen();
        this.updateHUD();
        this.gameLoop();
    }
    
    // Save/Load System
    loadPlayerData() {
        const saved = localStorage.getItem('aetherGameData');
        if (saved) {
            const data = JSON.parse(saved);
            this.playerData = { ...this.playerData, ...data };
        }
    }
    
    savePlayerData() {
        localStorage.setItem('aetherGameData', JSON.stringify(this.playerData));
    }
    
    // Screen Management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
        
        if (screenId === 'progressScreen') {
            this.updateProgressScreen();
        }
    }
    
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('startGame').addEventListener('click', () => this.startNewRun());
        document.getElementById('showHelp').addEventListener('click', () => this.showScreen('helpScreen'));
        document.getElementById('showProgress').addEventListener('click', () => this.showScreen('progressScreen'));
        
        document.getElementById('startFromHelp').addEventListener('click', () => this.startNewRun());
        document.getElementById('backToTitle').addEventListener('click', () => this.showScreen('titleScreen'));
        document.getElementById('backToTitleFromProgress').addEventListener('click', () => this.showScreen('titleScreen'));
        
        // Game controls
        document.getElementById('resumeGame').addEventListener('click', () => this.resumeGame());
        document.getElementById('showHelpFromGame').addEventListener('click', () => this.showHelp());
        document.getElementById('backToMenuFromGame').addEventListener('click', () => this.endRun());
        
        document.getElementById('restartGame').addEventListener('click', () => this.startNewRun());
        document.getElementById('backToMenuFromGameOver').addEventListener('click', () => this.showScreen('titleScreen'));
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse controls
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent right-click menu
        
        // Upgrade buttons (will be created dynamically)
        this.setupUpgradeButtons();
    }
    
    setupUpgradeButtons() {
        // Coin Magnet
        const coinMagnetBtn = document.querySelector('#upgradeCoinMagnet .upgrade-buy');
        if (coinMagnetBtn) {
            coinMagnetBtn.addEventListener('click', () => this.buyUpgrade('coinMagnet', 50));
        }
        
        // Extra Health
        const extraHealthBtn = document.querySelector('#upgradeExtraHealth .upgrade-buy');
        if (extraHealthBtn) {
            extraHealthBtn.addEventListener('click', () => this.buyUpgrade('extraHealth', 100));
        }
    }
    
    // Input Handling
    handleKeyDown(e) {
        this.keys[e.code] = true;
        
        // Global keys
        if (e.code === 'Escape') {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            } else if (this.currentScreen === 'helpScreen') {
                this.showScreen('titleScreen');
            }
        }
        
        // Game-specific keys
        if (this.gameState === 'playing' && this.player) {
            switch(e.code) {
                case 'KeyW':
                case 'Space':
                case 'ArrowUp':
                    this.player.jump();
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.player.groundSmash();
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.player.dash();
                    break;
            }
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    handleMouseDown(e) {
        if (this.gameState !== 'playing') return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
        
        if (e.button === 0) { // Left click - melee attack
            this.player.meleeAttack();
        } else if (e.button === 2) { // Right click - ranged spell
            this.player.rangedSpell();
        }
    }
    
    handleMouseUp(e) {
        // Handle mouse release if needed
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
    }
    
    // Game State Management
    startNewRun() {
        this.gameState = 'playing';
        this.isRunning = true;
        this.showScreen('gameScreen');
        
        // Reset run data
        this.runData = {
            coins: 0,
            enemiesDefeated: 0,
            currentZone: 'Central',
            health: this.playerData.upgrades.extraHealth ? 120 : 100,
            maxHealth: this.playerData.upgrades.extraHealth ? 120 : 100,
            spellCharges: 3,
            maxSpellCharges: 3
        };
        
        this.initializeWorld();
        this.updateHUD();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pauseMenu').classList.remove('hidden');
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pauseMenu').classList.add('hidden');
    }
    
    showHelp() {
        this.pauseGame();
        this.showScreen('helpScreen');
    }
    
    endRun() {
        this.gameState = 'title';
        this.isRunning = false;
        this.showScreen('titleScreen');
        document.getElementById('pauseMenu').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.add('hidden');
        
        // Save progress
        this.playerData.totalCoins += this.runData.coins;
        this.savePlayerData();
        this.updateProgressScreen();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('gameOverMenu').classList.remove('hidden');
        
        // Update run stats
        document.getElementById('runCoins').textContent = this.runData.coins;
        document.getElementById('runEnemies').textContent = this.runData.enemiesDefeated;
        document.getElementById('runZone').textContent = this.runData.currentZone;
        
        // Save progress
        this.playerData.totalCoins += this.runData.coins;
        this.playerData.runsCompleted++;
        this.savePlayerData();
    }
    
    // World Initialization
    initializeWorld() {
        this.generateRoom();
        this.createPlayer();
        this.camera.x = 0;
        this.camera.y = 0;
    }
    
    createPlayer() {
        this.player = new Player(100, 400, this);
    }
    
    generateRoom() {
        // Clear existing objects
        this.enemies = [];
        this.coins = [];
        this.platforms = [];
        this.projectiles = [];
        
        // Generate platforms
        this.generatePlatforms();
        
        // Generate enemies
        this.generateEnemies();
        
        // Generate coins
        this.generateCoins();
    }
    
    generatePlatforms() {
        // Ground platform
        this.platforms.push(new Platform(0, 550, this.world.width, 50, 'solid'));
        
        // Various platforms for platforming
        this.platforms.push(new Platform(200, 480, 150, 20, 'solid'));
        this.platforms.push(new Platform(400, 420, 100, 20, 'crumble'));
        this.platforms.push(new Platform(600, 360, 120, 20, 'solid'));
        this.platforms.push(new Platform(800, 300, 100, 20, 'launch'));
        this.platforms.push(new Platform(1000, 450, 150, 20, 'solid'));
        this.platforms.push(new Platform(1200, 380, 100, 20, 'solid'));
        this.platforms.push(new Platform(1400, 320, 120, 20, 'gravity-reverse'));
        this.platforms.push(new Platform(1600, 480, 150, 20, 'solid'));
        this.platforms.push(new Platform(1800, 400, 100, 20, 'solid'));
        this.platforms.push(new Platform(2000, 350, 120, 20, 'solid'));
        
        // Walls for wall climbing
        this.platforms.push(new Platform(300, 200, 20, 300, 'wall'));
        this.platforms.push(new Platform(700, 150, 20, 200, 'wall'));
        this.platforms.push(new Platform(1100, 100, 20, 350, 'wall'));
        this.platforms.push(new Platform(1500, 50, 20, 270, 'wall'));
    }
    
    generateEnemies() {
        // Distribute enemies throughout the level
        const enemyPositions = [
            [300, 500], [500, 380], [750, 260], [950, 400],
            [1150, 330], [1350, 270], [1550, 430], [1750, 350],
            [1950, 300], [2150, 480]
        ];
        
        enemyPositions.forEach(([x, y]) => {
            const enemyType = this.getRandomEnemyType();
            this.enemies.push(new Enemy(x, y, enemyType, this));
        });
    }
    
    getRandomEnemyType() {
        const zoneEnemies = this.zones[this.runData.currentZone].enemies;
        return zoneEnemies[Math.floor(Math.random() * zoneEnemies.length)];
    }
    
    generateCoins() {
        // Place coins throughout the level
        const coinPositions = [
            [250, 450], [450, 390], [650, 330], [850, 270],
            [1050, 420], [1250, 350], [1450, 290], [1650, 450],
            [1850, 370], [2050, 320], [2200, 480]
        ];
        
        coinPositions.forEach(([x, y]) => {
            this.coins.push(new Coin(x, y, this));
        });
        
        // Add some secret/hidden coins
        this.coins.push(new Coin(150, 200, this, true)); // Hidden coin
        this.coins.push(new Coin(550, 150, this, true)); // Hidden coin
        this.coins.push(new Coin(950, 100, this, true)); // Hidden coin
    }
    
    // Upgrade System
    buyUpgrade(upgradeType, cost) {
        if (this.playerData.totalCoins >= cost && !this.playerData.upgrades[upgradeType]) {
            this.playerData.totalCoins -= cost;
            this.playerData.upgrades[upgradeType] = true;
            this.savePlayerData();
            this.updateProgressScreen();
        }
    }
    
    // Update UI
    updateHUD() {
        document.getElementById('currentCoins').textContent = this.runData.coins;
        document.getElementById('currentZone').textContent = this.runData.currentZone;
        document.getElementById('spellCharges').textContent = this.runData.spellCharges;
        
        // Update health bar
        const healthPercentage = (this.runData.health / this.runData.maxHealth) * 100;
        document.getElementById('healthFill').style.width = `${healthPercentage}%`;
        
        // Update ability indicators
        this.updateAbilityIndicators();
    }
    
    updateAbilityIndicators() {
        const abilities = ['doubleJump', 'dash', 'wallClimb', 'groundSmash'];
        abilities.forEach(ability => {
            const indicator = document.getElementById(`hud${ability.charAt(0).toUpperCase() + ability.slice(1)}`);
            if (this.playerData.abilities[ability]) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    updateProgressScreen() {
        document.getElementById('totalCoins').textContent = this.playerData.totalCoins;
        
        // Update ability statuses
        const abilities = ['doubleJump', 'dash', 'wallClimb', 'groundSmash'];
        abilities.forEach(ability => {
            const element = document.getElementById(`ability${ability.charAt(0).toUpperCase() + ability.slice(1)}`);
            const statusSpan = element.querySelector('.ability-status');
            if (this.playerData.abilities[ability]) {
                element.classList.add('unlocked');
                statusSpan.textContent = 'UNLOCKED';
            } else {
                element.classList.remove('unlocked');
                statusSpan.textContent = 'LOCKED';
            }
        });
        
        // Update upgrade buttons
        this.updateUpgradeButtons();
    }
    
    updateUpgradeButtons() {
        // Coin Magnet
        const coinMagnetBtn = document.querySelector('#upgradeCoinMagnet .upgrade-buy');
        if (coinMagnetBtn) {
            if (this.playerData.upgrades.coinMagnet) {
                coinMagnetBtn.textContent = 'OWNED';
                coinMagnetBtn.disabled = true;
            } else if (this.playerData.totalCoins >= 50) {
                coinMagnetBtn.textContent = 'BUY';
                coinMagnetBtn.disabled = false;
            } else {
                coinMagnetBtn.textContent = 'LOCKED';
                coinMagnetBtn.disabled = true;
            }
        }
        
        // Extra Health
        const extraHealthBtn = document.querySelector('#upgradeExtraHealth .upgrade-buy');
        if (extraHealthBtn) {
            if (this.playerData.upgrades.extraHealth) {
                extraHealthBtn.textContent = 'OWNED';
                extraHealthBtn.disabled = true;
            } else if (this.playerData.totalCoins >= 100) {
                extraHealthBtn.textContent = 'BUY';
                extraHealthBtn.disabled = false;
            } else {
                extraHealthBtn.textContent = 'LOCKED';
                extraHealthBtn.disabled = true;
            }
        }
    }
    
    // Game Loop
    gameLoop() {
        if (this.gameState === 'playing' && this.isRunning) {
            this.update();
            this.render();
        }
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (!this.player) return;
        
        // Update player
        this.player.update();
        
        // Update camera to follow player
        this.updateCamera();
        
        // Update enemies
        this.enemies.forEach(enemy => enemy.update());
        
        // Update projectiles
        this.projectiles.forEach(projectile => projectile.update());
        
        // Update coins
        this.coins.forEach(coin => coin.update());
        
        // Remove dead objects
        this.enemies = this.enemies.filter(enemy => !enemy.dead);
        this.projectiles = this.projectiles.filter(projectile => !projectile.dead);
        this.coins = this.coins.filter(coin => !coin.collected);
        
        // Check win/lose conditions
        if (this.runData.health <= 0) {
            this.gameOver();
        }
        
        this.updateHUD();
    }
    
    updateCamera() {
        // Follow player with some offset
        const targetX = this.player.x - this.canvas.width / 2;
        const targetY = this.player.y - this.canvas.height / 2;
        
        // Smooth camera movement
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        // Keep camera within world bounds
        this.camera.x = Math.max(0, Math.min(this.world.width - this.canvas.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.world.height - this.canvas.height, this.camera.y));
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.zones[this.runData.currentZone].color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for camera transformation
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render platforms
        this.platforms.forEach(platform => platform.render(this.ctx));
        
        // Render coins
        this.coins.forEach(coin => coin.render(this.ctx));
        
        // Render enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // Render projectiles
        this.projectiles.forEach(projectile => projectile.render(this.ctx));
        
        // Render player
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // Restore context
        this.ctx.restore();
    }
}

// Player Class
class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.width = 24;
        this.height = 32;
        
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.jumpPower = 12;
        
        this.onGround = false;
        this.canDoubleJump = false;
        this.isWallClimbing = false;
        this.isDashing = false;
        this.dashCooldown = 0;
        
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        
        this.attackCooldown = 0;
        this.spellCooldown = 0;
        
        this.color = '#4ecdc4';
    }
    
    update() {
        this.handleInput();
        this.applyPhysics();
        this.checkCollisions();
        this.updateTimers();
        this.constrainToWorld();
    }
    
    handleInput() {
        const keys = this.game.keys;
        
        // Horizontal movement
        if (keys['KeyA'] || keys['ArrowLeft']) {
            this.vx = -this.speed;
        } else if (keys['KeyD'] || keys['ArrowRight']) {
            this.vx = this.speed;
        } else {
            this.vx *= this.game.friction;
        }
        
        // Dash ability
        if (this.dashCooldown <= 0 && this.game.playerData.abilities.dash) {
            if (keys['ShiftLeft'] || keys['ShiftRight']) {
                this.dash();
            }
        }
    }
    
    jump() {
        if (this.onGround) {
            this.vy = -this.jumpPower;
            this.onGround = false;
            this.canDoubleJump = this.game.playerData.abilities.doubleJump;
        } else if (this.canDoubleJump && this.game.playerData.abilities.doubleJump) {
            this.vy = -this.jumpPower * 0.8;
            this.canDoubleJump = false;
        }
    }
    
    dash() {
        if (this.dashCooldown <= 0 && this.game.playerData.abilities.dash) {
            const keys = this.game.keys;
            let dashDirection = 0;
            
            if (keys['KeyA'] || keys['ArrowLeft']) dashDirection = -1;
            else if (keys['KeyD'] || keys['ArrowRight']) dashDirection = 1;
            else dashDirection = this.vx > 0 ? 1 : -1; // Dash in current direction
            
            this.vx = dashDirection * 15;
            this.isDashing = true;
            this.dashCooldown = 60; // 1 second at 60 FPS
            this.invulnerable = true;
            this.invulnerabilityTime = 20;
        }
    }
    
    groundSmash() {
        if (!this.onGround && this.game.playerData.abilities.groundSmash) {
            this.vy = 20; // Fast downward movement
        }
    }
    
    meleeAttack() {
        if (this.attackCooldown <= 0) {
            this.attackCooldown = 30; // 0.5 seconds
            
            // Create attack hitbox
            const attackRange = 40;
            const attackX = this.vx >= 0 ? this.x + this.width : this.x - attackRange;
            const attackY = this.y;
            
            // Check for enemies in range
            this.game.enemies.forEach(enemy => {
                if (enemy.x >= attackX && enemy.x <= attackX + attackRange &&
                    enemy.y >= attackY && enemy.y <= attackY + this.height) {
                    enemy.takeDamage(25);
                }
            });
        }
    }
    
    rangedSpell() {
        if (this.spellCooldown <= 0 && this.game.runData.spellCharges > 0) {
            this.spellCooldown = 60; // 1 second
            this.game.runData.spellCharges--;
            
            // Create projectile
            const direction = this.vx >= 0 ? 1 : -1;
            this.game.projectiles.push(new Projectile(
                this.x + this.width/2, 
                this.y + this.height/2, 
                direction * 8, 
                0, 
                'player',
                this.game
            ));
        }
    }
    
    applyPhysics() {
        // Apply gravity
        if (!this.onGround) {
            this.vy += this.game.gravity;
        }
        
        // Apply movement
        this.x += this.vx;
        this.y += this.vy;
        
        // Reset ground state
        this.onGround = false;
        
        // Reduce dash effect
        if (this.isDashing) {
            this.vx *= 0.9;
            if (Math.abs(this.vx) < 2) {
                this.isDashing = false;
            }
        }
    }
    
    checkCollisions() {
        // Platform collisions
        this.game.platforms.forEach(platform => {
            if (this.intersects(platform)) {
                this.handlePlatformCollision(platform);
            }
        });
        
        // Enemy collisions
        this.game.enemies.forEach(enemy => {
            if (this.intersects(enemy) && !this.invulnerable) {
                this.takeDamage(enemy.damage);
            }
        });
        
        // Coin collisions
        this.game.coins.forEach(coin => {
            if (this.intersects(coin) && !coin.collected) {
                coin.collect();
            }
        });
    }
    
    handlePlatformCollision(platform) {
        if (platform.type === 'wall' && this.game.playerData.abilities.wallClimbing) {
            // Wall climbing logic
            const keys = this.game.keys;
            if (keys['KeyW'] || keys['Space'] || keys['ArrowUp']) {
                this.vy = -3; // Climb up
                this.isWallClimbing = true;
                this.canDoubleJump = true; // Reset double jump on wall
            }
        } else {
            // Regular platform collision
            const overlapX = Math.min(this.x + this.width - platform.x, platform.x + platform.width - this.x);
            const overlapY = Math.min(this.y + this.height - platform.y, platform.y + platform.height - this.y);
            
            if (overlapX < overlapY) {
                // Horizontal collision
                if (this.x < platform.x) {
                    this.x = platform.x - this.width;
                } else {
                    this.x = platform.x + platform.width;
                }
                this.vx = 0;
            } else {
                // Vertical collision
                if (this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                    this.canDoubleJump = this.game.playerData.abilities.doubleJump;
                    
                    // Handle special platform types
                    if (platform.type === 'launch') {
                        this.vy = -20; // Launch player
                        this.onGround = false;
                    } else if (platform.type === 'crumble') {
                        platform.startCrumbling();
                    }
                } else {
                    this.y = platform.y + platform.height;
                    this.vy = 0;
                }
            }
        }
    }
    
    intersects(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
    
    takeDamage(amount) {
        if (!this.invulnerable) {
            this.game.runData.health -= amount;
            this.invulnerable = true;
            this.invulnerabilityTime = 120; // 2 seconds
            
            // Knockback
            this.vx += this.vx > 0 ? 5 : -5;
            this.vy = -5;
        }
    }
    
    updateTimers() {
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.spellCooldown > 0) this.spellCooldown--;
        
        if (this.invulnerabilityTime > 0) {
            this.invulnerabilityTime--;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
    }
    
    constrainToWorld() {
        // Keep player within world bounds
        this.x = Math.max(0, Math.min(this.game.world.width - this.width, this.x));
        
        // Fall death
        if (this.y > this.game.world.height) {
            this.game.runData.health = 0;
        }
    }
    
    render(ctx) {
        // Flicker during invulnerability
        if (this.invulnerable && Math.floor(this.invulnerabilityTime / 5) % 2) {
            return;
        }
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw simple face
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 6, this.y + 8, 3, 3); // Left eye
        ctx.fillRect(this.x + 15, this.y + 8, 3, 3); // Right eye
        ctx.fillRect(this.x + 8, this.y + 18, 8, 2); // Mouth
    }
}

// Enemy Class
class Enemy {
    constructor(x, y, type, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.type = type;
        this.dead = false;
        
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        
        this.attackCooldown = 0;
        this.aiTimer = 0;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        
        this.setupByType();
    }
    
    setupByType() {
        switch(this.type) {
            case 'WispShade':
                this.width = 20;
                this.height = 20;
                this.health = 25;
                this.maxHealth = 25;
                this.damage = 10;
                this.speed = 2;
                this.color = '#8a2be2';
                this.behavior = 'swarm';
                break;
            case 'TitanRemnant':
                this.width = 40;
                this.height = 50;
                this.health = 100;
                this.maxHealth = 100;
                this.damage = 25;
                this.speed = 1;
                this.color = '#696969';
                this.behavior = 'tank';
                break;
            case 'ElementalSpirit':
                this.width = 25;
                this.height = 30;
                this.health = 50;
                this.maxHealth = 50;
                this.damage = 15;
                this.speed = 3;
                this.color = this.getElementalColor();
                this.behavior = 'ranged';
                break;
        }
    }
    
    getElementalColor() {
        const zone = this.game.runData.currentZone;
        switch(zone) {
            case 'Pyra': return '#ff4444';
            case 'Glacium': return '#44aaff';
            case 'Zephyra': return '#44ff44';
            case 'Terran': return '#aa6644';
            default: return '#ffffff';
        }
    }
    
    update() {
        this.updateAI();
        this.applyPhysics();
        this.checkCollisions();
        this.updateTimers();
    }
    
    updateAI() {
        const player = this.game.player;
        const distanceToPlayer = Math.sqrt(
            Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2)
        );
        
        switch(this.behavior) {
            case 'swarm':
                if (distanceToPlayer < 150) {
                    // Move towards player
                    this.direction = player.x > this.x ? 1 : -1;
                    this.vx = this.direction * this.speed;
                } else {
                    // Patrol behavior
                    this.aiTimer++;
                    if (this.aiTimer > 120) { // Change direction every 2 seconds
                        this.direction *= -1;
                        this.aiTimer = 0;
                    }
                    this.vx = this.direction * this.speed * 0.5;
                }
                break;
                
            case 'tank':
                if (distanceToPlayer < 100) {
                    // Slow approach
                    this.direction = player.x > this.x ? 1 : -1;
                    this.vx = this.direction * this.speed;
                } else {
                    this.vx *= 0.8; // Slow down when far
                }
                break;
                
            case 'ranged':
                if (distanceToPlayer < 200 && this.attackCooldown <= 0) {
                    // Stop and shoot
                    this.vx = 0;
                    this.rangedAttack();
                } else if (distanceToPlayer > 250) {
                    // Move closer
                    this.direction = player.x > this.x ? 1 : -1;
                    this.vx = this.direction * this.speed;
                } else {
                    // Maintain distance
                    this.direction = player.x > this.x ? -1 : 1;
                    this.vx = this.direction * this.speed * 0.5;
                }
                break;
        }
    }
    
    rangedAttack() {
        this.attackCooldown = 120; // 2 seconds
        
        const player = this.game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const projectileSpeed = 4;
        this.game.projectiles.push(new Projectile(
            this.x + this.width/2,
            this.y + this.height/2,
            (dx / distance) * projectileSpeed,
            (dy / distance) * projectileSpeed,
            'enemy',
            this.game
        ));
    }
    
    applyPhysics() {
        // Apply gravity
        if (!this.onGround) {
            this.vy += this.game.gravity;
        }
        
        // Apply movement
        this.x += this.vx;
        this.y += this.vy;
        
        // Reset ground state
        this.onGround = false;
    }
    
    checkCollisions() {
        // Platform collisions
        this.game.platforms.forEach(platform => {
            if (this.intersects(platform)) {
                this.handlePlatformCollision(platform);
            }
        });
    }
    
    handlePlatformCollision(platform) {
        const overlapX = Math.min(this.x + this.width - platform.x, platform.x + platform.width - this.x);
        const overlapY = Math.min(this.y + this.height - platform.y, platform.y + platform.height - this.y);
        
        if (overlapX < overlapY) {
            // Horizontal collision
            if (this.x < platform.x) {
                this.x = platform.x - this.width;
            } else {
                this.x = platform.x + platform.width;
            }
            this.vx = 0;
            this.direction *= -1; // Turn around
        } else {
            // Vertical collision
            if (this.y < platform.y) {
                this.y = platform.y - this.height;
                this.vy = 0;
                this.onGround = true;
            } else {
                this.y = platform.y + platform.height;
                this.vy = 0;
            }
        }
    }
    
    intersects(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.dead = true;
        this.game.runData.enemiesDefeated++;
        
        // Drop coin with chance
        if (Math.random() < 0.7) {
            this.game.coins.push(new Coin(this.x, this.y, this.game));
        }
    }
    
    updateTimers() {
        if (this.attackCooldown > 0) this.attackCooldown--;
    }
    
    render(ctx) {
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x, this.y - 8, barWidth * healthPercent, barHeight);
        }
        
        // Simple visual differentiation by type
        ctx.fillStyle = '#ffffff';
        if (this.type === 'WispShade') {
            // Draw wispy trails
            ctx.globalAlpha = 0.5;
            ctx.fillRect(this.x - 5, this.y + 5, 10, 10);
            ctx.fillRect(this.x + this.width - 5, this.y + 5, 10, 10);
            ctx.globalAlpha = 1;
        } else if (this.type === 'TitanRemnant') {
            // Draw armor segments
            ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, 5);
            ctx.fillRect(this.x + 5, this.y + this.height - 10, this.width - 10, 5);
        } else if (this.type === 'ElementalSpirit') {
            // Draw elemental aura
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
            ctx.globalAlpha = 1;
        }
    }
}

// Projectile Class
class Projectile {
    constructor(x, y, vx, vy, owner, game) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.owner = owner; // 'player' or 'enemy'
        this.game = game;
        
        this.width = 6;
        this.height = 6;
        this.damage = 15;
        this.dead = false;
        this.lifetime = 180; // 3 seconds
        
        this.color = owner === 'player' ? '#4ecdc4' : '#ff4444';
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
        
        if (this.lifetime <= 0) {
            this.dead = true;
            return;
        }
        
        this.checkCollisions();
        this.checkWorldBounds();
    }
    
    checkCollisions() {
        // Platform collisions
        this.game.platforms.forEach(platform => {
            if (this.intersects(platform)) {
                this.dead = true;
            }
        });
        
        // Entity collisions
        if (this.owner === 'player') {
            // Player projectile hits enemies
            this.game.enemies.forEach(enemy => {
                if (this.intersects(enemy)) {
                    enemy.takeDamage(this.damage);
                    this.dead = true;
                }
            });
        } else {
            // Enemy projectile hits player
            if (this.intersects(this.game.player) && !this.game.player.invulnerable) {
                this.game.player.takeDamage(this.damage);
                this.dead = true;
            }
        }
    }
    
    checkWorldBounds() {
        if (this.x < 0 || this.x > this.game.world.width || 
            this.y < 0 || this.y > this.game.world.height) {
            this.dead = true;
        }
    }
    
    intersects(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add glowing effect
        ctx.globalAlpha = 0.5;
        ctx.fillRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
        ctx.globalAlpha = 1;
    }
}

// Platform Class
class Platform {
    constructor(x, y, width, height, type = 'solid') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // solid, crumble, launch, gravity-reverse, wall
        
        this.crumbling = false;
        this.crumbleTime = 0;
        
        this.color = this.getColorByType();
    }
    
    getColorByType() {
        switch(this.type) {
            case 'solid': return '#666666';
            case 'crumble': return '#8b4513';
            case 'launch': return '#ffd700';
            case 'gravity-reverse': return '#9400d3';
            case 'wall': return '#4a4a4a';
            default: return '#666666';
        }
    }
    
    startCrumbling() {
        if (this.type === 'crumble' && !this.crumbling) {
            this.crumbling = true;
            this.crumbleTime = 60; // 1 second to crumble
        }
    }
    
    update() {
        if (this.crumbling) {
            this.crumbleTime--;
            if (this.crumbleTime <= 0) {
                // Platform crumbles away (remove from game)
                // This would be handled by the game's platform management
            }
        }
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        
        if (this.crumbling) {
            // Shaking/crumbling effect
            const shake = Math.sin(this.crumbleTime * 0.5) * 2;
            ctx.fillRect(this.x + shake, this.y, this.width, this.height);
            
            // Add cracks
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x + this.width * 0.3, this.y, 2, this.height);
            ctx.fillRect(this.x + this.width * 0.7, this.y, 2, this.height);
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Add visual indicators for special platforms
        if (this.type === 'launch') {
            ctx.fillStyle = '#ffff00';
            for (let i = 0; i < this.width; i += 20) {
                ctx.fillRect(this.x + i, this.y - 5, 10, 5);
            }
        } else if (this.type === 'gravity-reverse') {
            ctx.fillStyle = '#ff00ff';
            for (let i = 0; i < this.width; i += 15) {
                ctx.fillRect(this.x + i, this.y + this.height, 5, 5);
            }
        }
    }
}

// Coin Class
class Coin {
    constructor(x, y, game, isHidden = false) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.width = 16;
        this.height = 16;
        this.collected = false;
        this.isHidden = isHidden;
        
        this.floatOffset = Math.random() * Math.PI * 2;
        this.baseY = y;
        this.value = isHidden ? 5 : 1; // Hidden coins worth more
        
        this.color = isHidden ? '#ffd700' : '#ffff00';
    }
    
    update() {
        // Floating animation
        this.y = this.baseY + Math.sin(Date.now() * 0.003 + this.floatOffset) * 3;
        
        // Coin magnet effect
        if (this.game.playerData.upgrades.coinMagnet) {
            const player = this.game.player;
            const distance = Math.sqrt(
                Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2)
            );
            
            if (distance < 80) {
                const magnetStrength = 0.1;
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                this.x += dx * magnetStrength;
                this.y += dy * magnetStrength;
            }
        }
    }
    
    collect() {
        if (!this.collected) {
            this.collected = true;
            this.game.runData.coins += this.value;
            
            // Visual feedback could be added here
            console.log(`Collected ${this.value} coin(s)!`);
        }
    }
    
    render(ctx) {
        if (this.collected) return;
        
        // Coin body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Inner shine
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 3, this.y + 3, this.width - 6, this.height - 6);
        
        // Center symbol
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 6, this.y + 6, this.width - 12, this.height - 12);
        
        // Hidden coin special effect
        if (this.isHidden) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
            ctx.globalAlpha = 1;
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new AetherGame();
});