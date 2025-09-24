class PixelVaultGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'title'; // 'title', 'playing', 'levelComplete', 'gameComplete', 'gameOver'
        
        // Game settings
        this.GRAVITY = 0.6;
        this.FRICTION = 0.85;
        this.AIR_FRICTION = 0.98;
        this.JUMP_FORCE = -14;
        this.DOUBLE_JUMP_FORCE = -12;
        this.DASH_FORCE = 12;
        this.MOVE_SPEED = 6;
        this.MAX_FALL_SPEED = 16;
        this.WALL_SLIDE_SPEED = 2;
        this.WALL_JUMP_FORCE_X = 8;
        this.WALL_JUMP_FORCE_Y = -12;
        
        // Game state
        this.currentLevel = 1;
        this.maxLevel = 12;
        this.keys = {};
        this.particles = [];
        this.dashCooldown = 0;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        
        // Initialize player
        this.player = {
            x: 100,
            y: 400,
            width: 24,
            height: 24,
            vx: 0,
            vy: 0,
            onGround: false,
            onWall: false,
            wallDirection: 0,
            hasDoubleJump: true,
            dashesRemaining: 3,
            maxDashes: 3,
            color: '#00ffff',
            trail: []
        };
        
        // Game objects
        this.blocks = [];
        this.fragments = [];
        this.hazards = [];
        this.movingPlatforms = [];
        this.exit = null;
        this.fragmentsCollected = 0;
        this.totalFragments = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadLevel(this.currentLevel);
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code.toLowerCase()] = true;
            
            // Prevent default for game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code.toLowerCase()] = false;
        });
        
        // UI buttons
        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('nextLevel').addEventListener('click', () => {
            this.nextLevel();
        });
        
        document.getElementById('restartLevel').addEventListener('click', () => {
            this.restartLevel();
        });
        
        document.getElementById('restartLevel2').addEventListener('click', () => {
            this.restartLevel();
        });
        
        document.getElementById('restartGame').addEventListener('click', () => {
            this.currentLevel = 1;
            this.startGame();
        });
        
        document.getElementById('backToMenu').addEventListener('click', () => {
            this.backToMenu();
        });
        
        document.getElementById('backToMenu2').addEventListener('click', () => {
            this.backToMenu();
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        this.loadLevel(this.currentLevel);
    }
    
    loadLevel(levelNum) {
        this.blocks = [];
        this.fragments = [];
        this.hazards = [];
        this.movingPlatforms = [];
        this.particles = [];
        this.fragmentsCollected = 0;
        this.dashCooldown = 0;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        
        // Reset player
        this.player.x = 50;
        this.player.y = 450;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.onGround = false;
        this.player.onWall = false;
        this.player.wallDirection = 0;
        this.player.hasDoubleJump = true;
        this.player.dashesRemaining = this.player.maxDashes;
        this.player.trail = [];
        
        // Load the specific level
        if (levelNum >= 1 && levelNum <= 12) {
            this[`loadLevel${levelNum}`]();
        }
        
        this.totalFragments = this.fragments.length;
        this.updateHUD();
    }
    
    loadLevel1() {
        // Tutorial level - Basic movement and jumping
        this.blocks = [
            // Floor
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#0066cc'},
            // Walls
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            // Simple platforms
            {x: 200, y: 480, width: 120, height: 20, type: 'solid', color: '#0066cc'},
            {x: 400, y: 400, width: 120, height: 20, type: 'solid', color: '#0066cc'},
            {x: 600, y: 320, width: 120, height: 20, type: 'solid', color: '#0066cc'}
        ];
        
        this.fragments = [
            {x: 250, y: 440, collected: false},
            {x: 450, y: 360, collected: false},
            {x: 650, y: 280, collected: false}
        ];
        
        this.exit = {x: 720, y: 240, width: 40, height: 80};
    }
    
    loadLevel2() {
        // Introduce double jumping
        this.blocks = [
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#0066cc'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 150, y: 480, width: 100, height: 20, type: 'solid', color: '#0066cc'},
            {x: 400, y: 380, width: 80, height: 20, type: 'solid', color: '#0066cc'},
            {x: 600, y: 280, width: 100, height: 20, type: 'solid', color: '#0066cc'},
            {x: 300, y: 180, width: 200, height: 20, type: 'solid', color: '#0066cc'}
        ];
        
        this.fragments = [
            {x: 200, y: 440, collected: false},
            {x: 430, y: 340, collected: false},
            {x: 640, y: 240, collected: false},
            {x: 380, y: 140, collected: false}
        ];
        
        this.exit = {x: 450, y: 100, width: 40, height: 80};
    }
    
    loadLevel3() {
        // Introduce wall jumping
        this.blocks = [
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#0066cc'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            // Wall jump section
            {x: 200, y: 480, width: 20, height: 80, type: 'solid', color: '#0066cc'},
            {x: 300, y: 400, width: 20, height: 160, type: 'solid', color: '#0066cc'},
            {x: 400, y: 320, width: 20, height: 240, type: 'solid', color: '#0066cc'},
            {x: 500, y: 240, width: 20, height: 320, type: 'solid', color: '#0066cc'},
            // Exit platform
            {x: 600, y: 160, width: 120, height: 20, type: 'solid', color: '#0066cc'}
        ];
        
        this.fragments = [
            {x: 150, y: 520, collected: false},
            {x: 260, y: 360, collected: false},
            {x: 360, y: 280, collected: false},
            {x: 460, y: 200, collected: false},
            {x: 640, y: 120, collected: false}
        ];
        
        this.exit = {x: 680, y: 80, width: 40, height: 80};
    }
    
    loadLevel4() {
        // Introduce dashing
        this.blocks = [
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#0066cc'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 150, y: 480, width: 80, height: 20, type: 'solid', color: '#0066cc'},
            // Gap that requires dashing
            {x: 350, y: 420, width: 80, height: 20, type: 'solid', color: '#0066cc'},
            {x: 550, y: 360, width: 80, height: 20, type: 'solid', color: '#0066cc'},
            {x: 650, y: 240, width: 100, height: 20, type: 'solid', color: '#0066cc'}
        ];
        
        this.fragments = [
            {x: 180, y: 440, collected: false},
            {x: 380, y: 380, collected: false},
            {x: 580, y: 320, collected: false},
            {x: 680, y: 200, collected: false}
        ];
        
        this.exit = {x: 700, y: 160, width: 40, height: 80};
    }
    
    loadLevel5() {
        // Corrupted platforms (disappearing)
        this.blocks = [
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#0066cc'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 100, y: 480, width: 80, height: 20, type: 'solid', color: '#0066cc'},
            {x: 250, y: 400, width: 80, height: 20, type: 'corrupted', color: '#cc00cc', timer: 0, visible: true},
            {x: 400, y: 320, width: 80, height: 20, type: 'corrupted', color: '#cc00cc', timer: 0, visible: true},
            {x: 550, y: 240, width: 80, height: 20, type: 'solid', color: '#0066cc'},
            {x: 680, y: 160, width: 100, height: 20, type: 'solid', color: '#0066cc'}
        ];
        
        this.fragments = [
            {x: 130, y: 440, collected: false},
            {x: 280, y: 360, collected: false},
            {x: 430, y: 280, collected: false},
            {x: 580, y: 200, collected: false},
            {x: 720, y: 120, collected: false}
        ];
        
        this.exit = {x: 720, y: 80, width: 40, height: 80};
    }
    
    loadLevel6() {
        // Moving platforms
        this.blocks = [
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#0066cc'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 100, y: 480, width: 100, height: 20, type: 'solid', color: '#0066cc'},
            {x: 600, y: 160, width: 120, height: 20, type: 'solid', color: '#0066cc'}
        ];
        
        this.movingPlatforms = [
            {x: 300, y: 400, width: 80, height: 20, vx: 2, vy: 0, minX: 250, maxX: 450, minY: 300, maxY: 400, type: 'horizontal'},
            {x: 500, y: 300, width: 80, height: 20, vx: 0, vy: 1, minX: 500, maxX: 500, minY: 200, maxY: 350, type: 'vertical'}
        ];
        
        this.fragments = [
            {x: 130, y: 440, collected: false},
            {x: 330, y: 360, collected: false},
            {x: 530, y: 260, collected: false},
            {x: 640, y: 120, collected: false}
        ];
        
        this.exit = {x: 680, y: 80, width: 40, height: 80};
    }
    
    loadLevel7() {
        // Hazards (energy barriers)
        this.blocks = [
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#0066cc'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 100, y: 480, width: 100, height: 20, type: 'solid', color: '#0066cc'},
            {x: 300, y: 400, width: 100, height: 20, type: 'solid', color: '#0066cc'},
            {x: 500, y: 320, width: 100, height: 20, type: 'solid', color: '#0066cc'},
            {x: 650, y: 180, width: 100, height: 20, type: 'solid', color: '#0066cc'}
        ];
        
        this.hazards = [
            {x: 250, y: 350, width: 20, height: 150, type: 'energy', color: '#ff0000'},
            {x: 450, y: 270, width: 20, height: 150, type: 'energy', color: '#ff0000'}
        ];
        
        this.fragments = [
            {x: 130, y: 440, collected: false},
            {x: 330, y: 360, collected: false},
            {x: 530, y: 280, collected: false},
            {x: 680, y: 140, collected: false}
        ];
        
        this.exit = {x: 700, y: 100, width: 40, height: 80};
    }
    
    loadLevel8() {
        // Complex wall jumping maze
        this.blocks = [
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#0066cc'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            // Maze walls
            {x: 150, y: 400, width: 20, height: 160, type: 'solid', color: '#0066cc'},
            {x: 250, y: 300, width: 20, height: 260, type: 'solid', color: '#0066cc'},
            {x: 350, y: 400, width: 20, height: 160, type: 'solid', color: '#0066cc'},
            {x: 450, y: 200, width: 20, height: 360, type: 'solid', color: '#0066cc'},
            {x: 550, y: 300, width: 20, height: 260, type: 'solid', color: '#0066cc'},
            {x: 650, y: 100, width: 20, height: 460, type: 'solid', color: '#0066cc'},
            // Final platform
            {x: 680, y: 80, width: 80, height: 20, type: 'solid', color: '#0066cc'}
        ];
        
        this.fragments = [
            {x: 100, y: 520, collected: false},
            {x: 200, y: 520, collected: false},
            {x: 300, y: 360, collected: false},
            {x: 400, y: 160, collected: false},
            {x: 500, y: 260, collected: false},
            {x: 600, y: 60, collected: false}
        ];
        
        this.exit = {x: 700, y: 0, width: 40, height: 80};
    }
    
    loadLevel9() {
        // Everything combined - the gauntlet
        this.blocks = [
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#0066cc'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 100, y: 480, width: 80, height: 20, type: 'solid', color: '#0066cc'},
            {x: 300, y: 400, width: 80, height: 20, type: 'corrupted', color: '#cc00cc', timer: 0, visible: true},
            {x: 500, y: 320, width: 20, height: 240, type: 'solid', color: '#0066cc'},
            {x: 600, y: 200, width: 80, height: 20, type: 'solid', color: '#0066cc'}
        ];
        
        this.movingPlatforms = [
            {x: 200, y: 350, width: 60, height: 20, vx: 1.5, vy: 0, minX: 200, maxX: 350, minY: 350, maxY: 350, type: 'horizontal'}
        ];
        
        this.hazards = [
            {x: 420, y: 270, width: 20, height: 150, type: 'energy', color: '#ff0000'},
            {x: 580, y: 150, width: 20, height: 150, type: 'energy', color: '#ff0000'}
        ];
        
        this.fragments = [
            {x: 130, y: 440, collected: false},
            {x: 220, y: 310, collected: false},
            {x: 330, y: 360, collected: false},
            {x: 460, y: 280, collected: false},
            {x: 630, y: 160, collected: false}
        ];
        
        this.exit = {x: 640, y: 120, width: 40, height: 80};
    }
    
    loadLevel10() {
        // Precision platforming
        this.blocks = [
            {x: 0, y: 560, width: 100, height: 40, type: 'solid', color: '#0066cc'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            // Narrow platforms
            {x: 150, y: 480, width: 40, height: 20, type: 'solid', color: '#0066cc'},
            {x: 250, y: 420, width: 40, height: 20, type: 'corrupted', color: '#cc00cc', timer: 0, visible: true},
            {x: 350, y: 360, width: 40, height: 20, type: 'solid', color: '#0066cc'},
            {x: 450, y: 300, width: 40, height: 20, type: 'corrupted', color: '#cc00cc', timer: 0, visible: true},
            {x: 550, y: 240, width: 40, height: 20, type: 'solid', color: '#0066cc'},
            {x: 650, y: 180, width: 40, height: 20, type: 'solid', color: '#0066cc'},
            {x: 700, y: 100, width: 80, height: 20, type: 'solid', color: '#0066cc'}
        ];
        
        this.hazards = [
            {x: 200, y: 400, width: 20, height: 160, type: 'energy', color: '#ff0000'},
            {x: 400, y: 280, width: 20, height: 280, type: 'energy', color: '#ff0000'},
            {x: 600, y: 160, width: 20, height: 400, type: 'energy', color: '#ff0000'}
        ];
        
        this.fragments = [
            {x: 50, y: 520, collected: false},
            {x: 170, y: 440, collected: false},
            {x: 270, y: 380, collected: false},
            {x: 370, y: 320, collected: false},
            {x: 470, y: 260, collected: false},
            {x: 570, y: 200, collected: false},
            {x: 670, y: 140, collected: false},
            {x: 730, y: 60, collected: false}
        ];
        
        this.exit = {x: 720, y: 20, width: 40, height: 80};
    }
    
    loadLevel11() {
        // Speed run level
        this.blocks = [
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#0066cc'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 120, y: 480, width: 60, height: 20, type: 'solid', color: '#0066cc'},
            {x: 240, y: 400, width: 60, height: 20, type: 'solid', color: '#0066cc'},
            {x: 360, y: 320, width: 60, height: 20, type: 'solid', color: '#0066cc'},
            {x: 480, y: 240, width: 60, height: 20, type: 'solid', color: '#0066cc'},
            {x: 600, y: 160, width: 60, height: 20, type: 'solid', color: '#0066cc'},
            {x: 700, y: 80, width: 80, height: 20, type: 'solid', color: '#0066cc'}
        ];
        
        // Multiple moving platforms
        this.movingPlatforms = [
            {x: 180, y: 440, width: 40, height: 20, vx: 2, vy: 0, minX: 180, maxX: 220, minY: 440, maxY: 440, type: 'horizontal'},
            {x: 300, y: 360, width: 40, height: 20, vx: -2, vy: 0, minX: 300, maxX: 340, minY: 360, maxY: 360, type: 'horizontal'},
            {x: 420, y: 280, width: 40, height: 20, vx: 2, vy: 0, minX: 420, maxX: 460, minY: 280, maxY: 280, type: 'horizontal'},
            {x: 540, y: 200, width: 40, height: 20, vx: -2, vy: 0, minX: 540, maxX: 580, minY: 200, maxY: 200, type: 'horizontal'}
        ];
        
        this.fragments = [
            {x: 70, y: 520, collected: false},
            {x: 200, y: 400, collected: false},
            {x: 320, y: 320, collected: false},
            {x: 440, y: 240, collected: false},
            {x: 560, y: 160, collected: false},
            {x: 730, y: 40, collected: false}
        ];
        
        this.exit = {x: 720, y: 0, width: 40, height: 80};
    }
    
    loadLevel12() {
        // Final boss level - Ultimate challenge
        this.blocks = [
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#0066cc'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#0066cc'},
            // Multi-level structure
            {x: 100, y: 480, width: 100, height: 20, type: 'solid', color: '#0066cc'},
            {x: 250, y: 400, width: 60, height: 20, type: 'corrupted', color: '#cc00cc', timer: 0, visible: true},
            {x: 350, y: 320, width: 20, height: 240, type: 'solid', color: '#0066cc'},
            {x: 400, y: 380, width: 60, height: 20, type: 'corrupted', color: '#cc00cc', timer: 0, visible: true},
            {x: 500, y: 300, width: 20, height: 260, type: 'solid', color: '#0066cc'},
            {x: 550, y: 200, width: 80, height: 20, type: 'solid', color: '#0066cc'},
            {x: 680, y: 120, width: 80, height: 20, type: 'solid', color: '#0066cc'},
            {x: 700, y: 40, width: 80, height: 20, type: 'solid', color: '#0066cc'}
        ];
        
        this.movingPlatforms = [
            {x: 200, y: 350, width: 40, height: 20, vx: 0, vy: 2, minX: 200, maxX: 200, minY: 300, maxY: 450, type: 'vertical'},
            {x: 650, y: 80, width: 40, height: 20, vx: 1, vy: 0, minX: 600, maxX: 720, minY: 80, maxY: 80, type: 'horizontal'}
        ];
        
        this.hazards = [
            {x: 320, y: 250, width: 20, height: 310, type: 'energy', color: '#ff0000'},
            {x: 470, y: 200, width: 20, height: 360, type: 'energy', color: '#ff0000'},
            {x: 630, y: 100, width: 20, height: 460, type: 'energy', color: '#ff0000'}
        ];
        
        this.fragments = [
            {x: 130, y: 440, collected: false},
            {x: 220, y: 310, collected: false},
            {x: 280, y: 360, collected: false},
            {x: 430, y: 340, collected: false},
            {x: 580, y: 160, collected: false},
            {x: 710, y: 80, collected: false},
            {x: 670, y: 0, collected: false},
            {x: 730, y: 0, collected: false}
        ];
        
        this.exit = {x: 720, y: -40, width: 40, height: 80};
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.updateMovingPlatforms();
        this.updateCorruptedBlocks();
        this.updateParticles();
        this.checkCollisions();
        this.checkFragmentCollection();
        this.checkExitReached();
        
        // Update timers
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.coyoteTime > 0) this.coyoteTime--;
        if (this.jumpBuffer > 0) this.jumpBuffer--;
    }
    
    updatePlayer() {
        const player = this.player;
        
        // Handle input
        let moveX = 0;
        if (this.keys['a'] || this.keys['arrowleft']) moveX = -1;
        if (this.keys['d'] || this.keys['arrowright']) moveX = 1;
        
        // Handle dashing
        if ((this.keys['shift'] || this.keys['shiftleft'] || this.keys['shiftright']) && 
            this.dashCooldown === 0 && player.dashesRemaining > 0) {
            if (moveX !== 0) {
                player.vx = moveX * this.DASH_FORCE;
                player.dashesRemaining--;
                this.dashCooldown = 20;
                this.createDashParticles();
                this.playSound('dashSound');
            }
        }
        
        // Horizontal movement
        if (moveX !== 0 && this.dashCooldown === 0) {
            player.vx += moveX * 0.8;
            if (Math.abs(player.vx) > this.MOVE_SPEED) {
                player.vx = Math.sign(player.vx) * this.MOVE_SPEED;
            }
        }
        
        // Apply friction
        if (player.onGround) {
            player.vx *= this.FRICTION;
        } else {
            player.vx *= this.AIR_FRICTION;
        }
        
        // Jumping
        if (this.keys[' '] || this.keys['w'] || this.keys['arrowup']) {
            if (!this.keys.jumpPressed) {
                this.keys.jumpPressed = true;
                this.jumpBuffer = 6;
            }
        } else {
            this.keys.jumpPressed = false;
        }
        
        // Handle jump buffer and coyote time
        if (this.jumpBuffer > 0) {
            if (player.onGround || this.coyoteTime > 0) {
                // Regular jump
                player.vy = this.JUMP_FORCE;
                player.onGround = false;
                player.hasDoubleJump = true;
                this.jumpBuffer = 0;
                this.coyoteTime = 0;
                this.playSound('jumpSound');
            } else if (player.onWall) {
                // Wall jump
                player.vy = this.WALL_JUMP_FORCE_Y;
                player.vx = -player.wallDirection * this.WALL_JUMP_FORCE_X;
                player.onWall = false;
                player.wallDirection = 0;
                player.hasDoubleJump = true;
                this.jumpBuffer = 0;
                this.playSound('jumpSound');
            } else if (player.hasDoubleJump) {
                // Double jump
                player.vy = this.DOUBLE_JUMP_FORCE;
                player.hasDoubleJump = false;
                this.jumpBuffer = 0;
                this.createDoubleJumpParticles();
                this.playSound('jumpSound');
            }
        }
        
        // Wall sliding
        if (player.onWall && !player.onGround && player.vy > 0) {
            player.vy = Math.min(player.vy, this.WALL_SLIDE_SPEED);
        }
        
        // Apply gravity
        if (!player.onGround) {
            player.vy += this.GRAVITY;
            if (player.vy > this.MAX_FALL_SPEED) {
                player.vy = this.MAX_FALL_SPEED;
            }
        }
        
        // Update position
        player.x += player.vx;
        player.y += player.vy;
        
        // Update trail
        player.trail.push({x: player.x + player.width/2, y: player.y + player.height/2});
        if (player.trail.length > 8) {
            player.trail.shift();
        }
        
        // Reset ground and wall states
        const wasOnGround = player.onGround;
        player.onGround = false;
        player.onWall = false;
        player.wallDirection = 0;
        
        // Set coyote time when leaving ground
        if (wasOnGround && !player.onGround) {
            this.coyoteTime = 6;
        }
    }
    
    updateMovingPlatforms() {
        this.movingPlatforms.forEach(platform => {
            if (platform.type === 'horizontal') {
                platform.x += platform.vx;
                if (platform.x <= platform.minX || platform.x >= platform.maxX) {
                    platform.vx = -platform.vx;
                }
            } else if (platform.type === 'vertical') {
                platform.y += platform.vy;
                if (platform.y <= platform.minY || platform.y >= platform.maxY) {
                    platform.vy = -platform.vy;
                }
            }
        });
    }
    
    updateCorruptedBlocks() {
        this.blocks.forEach(block => {
            if (block.type === 'corrupted') {
                block.timer++;
                if (block.timer > 180) { // 3 seconds at 60fps
                    block.visible = !block.visible;
                    block.timer = 0;
                }
            }
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // gravity
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
    }
    
    checkCollisions() {
        const player = this.player;
        
        // Check block collisions
        [...this.blocks, ...this.movingPlatforms].forEach(block => {
            if (block.type === 'corrupted' && !block.visible) return;
            
            if (this.isColliding(player, block)) {
                this.handleBlockCollision(block);
            }
        });
        
        // Check hazard collisions
        this.hazards.forEach(hazard => {
            if (this.isColliding(player, hazard)) {
                this.gameOver();
            }
        });
        
        // Boundary checks
        if (player.x < 20) {
            player.x = 20;
            player.vx = 0;
        }
        if (player.x + player.width > 780) {
            player.x = 780 - player.width;
            player.vx = 0;
        }
        if (player.y > 600) {
            this.gameOver();
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    handleBlockCollision(block) {
        const player = this.player;
        const wasOnMovingPlatform = this.movingPlatforms.includes(block);
        
        // Calculate collision sides
        const overlapLeft = (player.x + player.width) - block.x;
        const overlapRight = (block.x + block.width) - player.x;
        const overlapTop = (player.y + player.height) - block.y;
        const overlapBottom = (block.y + block.height) - player.y;
        
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);
        
        if (minOverlapX < minOverlapY) {
            // Horizontal collision
            if (overlapLeft < overlapRight) {
                // Collision from left
                player.x = block.x - player.width;
                if (player.vx > 0) player.vx = 0;
                if (player.vy > 0) {
                    player.onWall = true;
                    player.wallDirection = 1;
                }
            } else {
                // Collision from right
                player.x = block.x + block.width;
                if (player.vx < 0) player.vx = 0;
                if (player.vy > 0) {
                    player.onWall = true;
                    player.wallDirection = -1;
                }
            }
        } else {
            // Vertical collision
            if (overlapTop < overlapBottom) {
                // Collision from top (landing on platform)
                player.y = block.y - player.height;
                if (player.vy > 0) {
                    player.vy = 0;
                    player.onGround = true;
                    player.hasDoubleJump = true;
                    player.dashesRemaining = player.maxDashes;
                    
                    // Move with moving platform
                    if (wasOnMovingPlatform) {
                        player.x += block.vx || 0;
                    }
                }
            } else {
                // Collision from bottom (hitting ceiling)
                player.y = block.y + block.height;
                if (player.vy < 0) player.vy = 0;
            }
        }
    }
    
    checkFragmentCollection() {
        this.fragments.forEach(fragment => {
            if (!fragment.collected) {
                const distance = Math.sqrt(
                    Math.pow(this.player.x + this.player.width/2 - fragment.x, 2) +
                    Math.pow(this.player.y + this.player.height/2 - fragment.y, 2)
                );
                
                if (distance < 20) {
                    fragment.collected = true;
                    this.fragmentsCollected++;
                    this.createCollectParticles(fragment.x, fragment.y);
                    this.playSound('collectSound');
                    this.updateHUD();
                }
            }
        });
    }
    
    checkExitReached() {
        if (this.fragmentsCollected === this.totalFragments) {
            if (this.isColliding(this.player, this.exit)) {
                this.levelComplete();
            }
        }
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        this.playSound('completeSound');
        
        if (this.currentLevel >= this.maxLevel) {
            // Game complete!
            document.getElementById('gameComplete').classList.remove('hidden');
        } else {
            document.getElementById('levelComplete').classList.remove('hidden');
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    nextLevel() {
        document.getElementById('levelComplete').classList.add('hidden');
        this.currentLevel++;
        this.loadLevel(this.currentLevel);
        this.gameState = 'playing';
    }
    
    restartLevel() {
        document.getElementById('levelComplete').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        this.loadLevel(this.currentLevel);
        this.gameState = 'playing';
    }
    
    backToMenu() {
        this.gameState = 'title';
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('titleScreen').classList.add('active');
        document.getElementById('levelComplete').classList.add('hidden');
        document.getElementById('gameComplete').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
    }
    
    updateHUD() {
        document.getElementById('currentLevel').textContent = this.currentLevel;
        document.getElementById('maxLevel').textContent = this.maxLevel;
        document.getElementById('fragmentsCollected').textContent = this.fragmentsCollected;
        document.getElementById('totalFragments').textContent = this.totalFragments;
        document.getElementById('dashesRemaining').textContent = this.player.dashesRemaining;
    }
    
    createParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: color,
                life: 30,
                maxLife: 30,
                alpha: 1,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    createCollectParticles(x, y) {
        this.createParticles(x, y, '#ffff00', 12);
    }
    
    createDoubleJumpParticles() {
        this.createParticles(
            this.player.x + this.player.width/2,
            this.player.y + this.player.height,
            '#00ffff',
            6
        );
    }
    
    createDashParticles() {
        this.createParticles(
            this.player.x + this.player.width/2,
            this.player.y + this.player.height/2,
            '#ff00ff',
            10
        );
    }
    
    playSound(soundId) {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {}); // Ignore audio errors
        }
    }
    
    render() {
        const ctx = this.ctx;
        
        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        if (this.gameState !== 'playing') return;
        
        // Render blocks
        this.renderBlocks();
        
        // Render moving platforms
        this.renderMovingPlatforms();
        
        // Render hazards
        this.renderHazards();
        
        // Render fragments
        this.renderFragments();
        
        // Render exit
        this.renderExit();
        
        // Render player
        this.renderPlayer();
        
        // Render particles
        this.renderParticles();
    }
    
    renderBlocks() {
        this.blocks.forEach(block => {
            if (block.type === 'corrupted' && !block.visible) {
                // Render faded version
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillStyle = block.color;
                this.ctx.fillRect(block.x, block.y, block.width, block.height);
                this.ctx.globalAlpha = 1;
                return;
            }
            
            this.ctx.fillStyle = block.color;
            this.ctx.fillRect(block.x, block.y, block.width, block.height);
            
            // Add glow effect for corrupted blocks
            if (block.type === 'corrupted') {
                this.ctx.shadowColor = block.color;
                this.ctx.shadowBlur = 10;
                this.ctx.strokeStyle = block.color;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(block.x, block.y, block.width, block.height);
                this.ctx.shadowBlur = 0;
            } else {
                // Normal block outline
                this.ctx.strokeStyle = '#004488';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(block.x, block.y, block.width, block.height);
            }
        });
    }
    
    renderMovingPlatforms() {
        this.movingPlatforms.forEach(platform => {
            this.ctx.fillStyle = '#00aaff';
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Moving platform indicator
            this.ctx.strokeStyle = '#00ffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });
    }
    
    renderHazards() {
        this.hazards.forEach(hazard => {
            this.ctx.fillStyle = hazard.color;
            this.ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
            
            // Energy effect
            this.ctx.shadowColor = hazard.color;
            this.ctx.shadowBlur = 15;
            this.ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
            this.ctx.shadowBlur = 0;
        });
    }
    
    renderFragments() {
        this.fragments.forEach(fragment => {
            if (!fragment.collected) {
                const time = Date.now() * 0.005;
                const bob = Math.sin(time + fragment.x * 0.01) * 3;
                
                this.ctx.fillStyle = '#ffff00';
                this.ctx.shadowColor = '#ffff00';
                this.ctx.shadowBlur = 10;
                
                // Diamond shape
                this.ctx.save();
                this.ctx.translate(fragment.x, fragment.y + bob);
                this.ctx.rotate(time);
                this.ctx.fillRect(-6, -6, 12, 12);
                this.ctx.restore();
                
                this.ctx.shadowBlur = 0;
            }
        });
    }
    
    renderExit() {
        if (this.fragmentsCollected === this.totalFragments) {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.shadowColor = '#00ff00';
            this.ctx.shadowBlur = 15;
        } else {
            this.ctx.fillStyle = '#666666';
        }
        
        this.ctx.fillRect(this.exit.x, this.exit.y, this.exit.width, this.exit.height);
        this.ctx.shadowBlur = 0;
        
        // Door outline
        this.ctx.strokeStyle = this.fragmentsCollected === this.totalFragments ? '#00ff00' : '#333333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.exit.x, this.exit.y, this.exit.width, this.exit.height);
    }
    
    renderPlayer() {
        const player = this.player;
        
        // Render trail
        this.ctx.globalAlpha = 0.3;
        player.trail.forEach((point, index) => {
            const alpha = index / player.trail.length * 0.3;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = player.color;
            this.ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
        });
        this.ctx.globalAlpha = 1;
        
        // Main player body
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // Player glow
        this.ctx.shadowColor = player.color;
        this.ctx.shadowBlur = 8;
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        this.ctx.shadowBlur = 0;
        
        // Simple face
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(player.x + 6, player.y + 6, 3, 3); // Left eye
        this.ctx.fillRect(player.x + 15, player.y + 6, 3, 3); // Right eye
        
        // Wall slide indicator
        if (player.onWall) {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            const direction = player.wallDirection;
            this.ctx.beginPath();
            this.ctx.moveTo(player.x + player.width/2 - direction * 15, player.y + player.height/2 - 5);
            this.ctx.lineTo(player.x + player.width/2 - direction * 10, player.y + player.height/2);
            this.ctx.lineTo(player.x + player.width/2 - direction * 15, player.y + player.height/2 + 5);
            this.ctx.stroke();
        }
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(
                particle.x - particle.size/2,
                particle.y - particle.size/2,
                particle.size,
                particle.size
            );
        });
        this.ctx.globalAlpha = 1;
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new PixelVaultGame();
});