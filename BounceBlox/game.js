class BounceBloxGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'title'; // 'title', 'playing', 'levelComplete', 'gameOver'
        
        // Game settings
        this.GRAVITY = 0.5;
        this.FRICTION = 0.85;
        this.JUMP_FORCE = -12;
        this.MOVE_SPEED = 5;
        this.BLOCK_SIZE = 40;
        
        // Game state
        this.currentLevel = 1;
        this.maxLevel = 12;
        this.keys = {};
        this.particles = [];
        this.gravityReversed = false;
        this.gravityTimer = 0;
        
        // Initialize player
        this.player = {
            x: 100,
            y: 400,
            width: 30,
            height: 30,
            vx: 0,
            vy: 0,
            onGround: false,
            color: '#ff6b6b'
        };
        
        // Game objects
        this.blocks = [];
        this.stars = [];
        this.exit = null;
        this.starsCollected = 0;
        this.totalStars = 0;
        
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
            this.keys[e.code.toLowerCase()] = true;
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code.toLowerCase()] = false;
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Button events
        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('nextLevel').addEventListener('click', () => {
            this.nextLevel();
        });
        
        document.getElementById('restartLevel').addEventListener('click', () => {
            this.restartLevel();
        });
        
        document.getElementById('restartGame').addEventListener('click', () => {
            this.restartLevel();
        });
        
        document.getElementById('backToMenu').addEventListener('click', () => {
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
        this.stars = [];
        this.particles = [];
        this.starsCollected = 0;
        this.gravityReversed = false;
        this.gravityTimer = 0;
        
        // Reset player position
        this.player.x = 100;
        this.player.y = 400;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.onGround = false;
        
        if (levelNum === 1) {
            this.loadLevel1();
        } else if (levelNum === 2) {
            this.loadLevel2();
        } else if (levelNum === 3) {
            this.loadLevel3();
        } else if (levelNum === 4) {
            this.loadLevel4();
        } else if (levelNum === 5) {
            this.loadLevel5();
        } else if (levelNum === 6) {
            this.loadLevel6();
        } else if (levelNum === 7) {
            this.loadLevel7();
        } else if (levelNum === 8) {
            this.loadLevel8();
        } else if (levelNum === 9) {
            this.loadLevel9();
        } else if (levelNum === 10) {
            this.loadLevel10();
        } else if (levelNum === 11) {
            this.loadLevel11();
        } else if (levelNum === 12) {
            this.loadLevel12();
        }
        
        this.totalStars = this.stars.length;
        this.updateHUD();
    }
    
    loadLevel1() {
        // Simple introductory level
        const blocks = [
            // Ground
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#4ecdc4'},
            // Platforms
            {x: 200, y: 480, width: 120, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 400, y: 400, width: 80, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 550, y: 320, width: 100, height: 20, type: 'launch', color: '#96ceb4'},
            // Walls
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            // Ceiling
            {x: 0, y: 0, width: 800, height: 20, type: 'solid', color: '#4ecdc4'}
        ];
        
        this.blocks = blocks;
        
        this.stars = [
            {x: 250, y: 440, collected: false},
            {x: 420, y: 360, collected: false},
            {x: 580, y: 280, collected: false}
        ];
        
        this.exit = {x: 700, y: 480, width: 60, height: 80};
    }
    
    loadLevel2() {
        // More complex level with gravity blocks
        const blocks = [
            // Ground and walls
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 800, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Platforms with different types
            {x: 150, y: 480, width: 80, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 300, y: 420, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 450, y: 360, width: 80, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 600, y: 300, width: 100, height: 20, type: 'launch', color: '#96ceb4'},
            
            // Additional platforms
            {x: 100, y: 200, width: 100, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 350, y: 150, width: 120, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 550, y: 100, width: 80, height: 20, type: 'solid', color: '#4ecdc4'}
        ];
        
        this.blocks = blocks;
        
        this.stars = [
            {x: 180, y: 440, collected: false},
            {x: 380, y: 110, collected: false},
            {x: 630, y: 260, collected: false},
            {x: 130, y: 160, collected: false}
        ];
        
        this.exit = {x: 580, y: 20, width: 60, height: 80};
    }
    
    loadLevel3() {
        // Advanced level with all block types
        const blocks = [
            // Boundaries
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 800, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Complex platform layout
            {x: 100, y: 520, width: 60, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 200, y: 460, width: 80, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 320, y: 400, width: 60, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 420, y: 340, width: 100, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 550, y: 280, width: 80, height: 20, type: 'crumble', color: '#ff6b6b'},
            
            // Upper section
            {x: 50, y: 220, width: 120, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 200, y: 160, width: 80, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 320, y: 100, width: 100, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 500, y: 140, width: 80, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 620, y: 200, width: 120, height: 20, type: 'solid', color: '#4ecdc4'}
        ];
        
        this.blocks = blocks;
        
        this.stars = [
            {x: 130, y: 480, collected: false},
            {x: 350, y: 360, collected: false},
            {x: 240, y: 120, collected: false},
            {x: 650, y: 160, collected: false},
            {x: 530, y: 100, collected: false}
        ];
        
        this.exit = {x: 670, y: 120, width: 60, height: 80};
    }
    
    loadLevel4() {
        // Precision jumping level
        const blocks = [
            // Boundaries
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 800, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Narrow platforms requiring precise jumps
            {x: 80, y: 520, width: 40, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 180, y: 480, width: 40, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 280, y: 440, width: 40, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 380, y: 400, width: 40, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 520, y: 320, width: 40, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 620, y: 280, width: 40, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 700, y: 240, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Upper challenge
            {x: 600, y: 180, width: 40, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 500, y: 120, width: 40, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 400, y: 80, width: 40, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 250, y: 60, width: 100, height: 20, type: 'solid', color: '#4ecdc4'}
        ];
        
        this.blocks = blocks;
        
        this.stars = [
            {x: 200, y: 440, collected: false},
            {x: 540, y: 280, collected: false},
            {x: 520, y: 80, collected: false},
            {x: 280, y: 20, collected: false}
        ];
        
        this.exit = {x: 280, y: 30, width: 60, height: 30};
    }
    
    loadLevel5() {
        // Gravity reversal maze
        const blocks = [
            // Boundaries
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 800, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Maze-like structure with gravity blocks
            {x: 100, y: 500, width: 200, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 350, y: 460, width: 60, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 450, y: 500, width: 150, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Middle section
            {x: 150, y: 400, width: 80, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 300, y: 360, width: 200, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 550, y: 400, width: 80, height: 20, type: 'gravity', color: '#b968c7'},
            
            // Upper maze
            {x: 50, y: 280, width: 100, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 200, y: 240, width: 60, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 320, y: 200, width: 120, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 500, y: 160, width: 60, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 620, y: 120, width: 100, height: 20, type: 'solid', color: '#4ecdc4'}
        ];
        
        this.blocks = blocks;
        
        this.stars = [
            {x: 200, y: 460, collected: false},
            {x: 380, y: 320, collected: false},
            {x: 100, y: 240, collected: false},
            {x: 530, y: 120, collected: false},
            {x: 650, y: 80, collected: false}
        ];
        
        this.exit = {x: 650, y: 40, width: 60, height: 80};
    }
    
    loadLevel6() {
        // Launch pad challenge
        const blocks = [
            // Boundaries
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 800, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Launch pad sequence
            {x: 80, y: 520, width: 60, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 200, y: 400, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 320, y: 480, width: 60, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 440, y: 300, width: 60, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 560, y: 420, width: 60, height: 20, type: 'launch', color: '#96ceb4'},
            
            // High platforms
            {x: 120, y: 200, width: 80, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 280, y: 160, width: 80, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 440, y: 120, width: 80, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 600, y: 180, width: 80, height: 20, type: 'launch', color: '#96ceb4'},
            
            // Final challenge
            {x: 680, y: 80, width: 80, height: 20, type: 'solid', color: '#4ecdc4'}
        ];
        
        this.blocks = blocks;
        
        this.stars = [
            {x: 110, y: 480, collected: false},
            {x: 230, y: 360, collected: false},
            {x: 470, y: 260, collected: false},
            {x: 630, y: 140, collected: false}
        ];
        
        this.exit = {x: 700, y: 20, width: 60, height: 60};
    }
    
    loadLevel7() {
        // Crumbling tower
        const blocks = [
            // Boundaries
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 800, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Tower of crumbling blocks - speed challenge
            {x: 100, y: 520, width: 100, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 250, y: 480, width: 100, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 400, y: 440, width: 100, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 550, y: 400, width: 100, height: 20, type: 'solid', color: '#4ecdc4'},
            
            {x: 500, y: 360, width: 80, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 380, y: 320, width: 80, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 260, y: 280, width: 80, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 140, y: 240, width: 80, height: 20, type: 'crumble', color: '#ff6b6b'},
            
            {x: 80, y: 200, width: 100, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 220, y: 160, width: 80, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 340, y: 120, width: 80, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 460, y: 80, width: 120, height: 20, type: 'solid', color: '#4ecdc4'}
        ];
        
        this.blocks = blocks;
        
        this.stars = [
            {x: 150, y: 480, collected: false},
            {x: 430, y: 280, collected: false},
            {x: 170, y: 120, collected: false},
            {x: 380, y: 80, collected: false},
            {x: 520, y: 40, collected: false}
        ];
        
        this.exit = {x: 500, y: 20, width: 60, height: 60};
    }
    
    loadLevel8() {
        // Multi-path challenge
        const blocks = [
            // Boundaries
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 800, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Three different paths
            // Left path - gravity heavy
            {x: 80, y: 500, width: 60, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 60, y: 400, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 80, y: 300, width: 60, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 60, y: 200, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 80, y: 100, width: 60, height: 20, type: 'launch', color: '#96ceb4'},
            
            // Middle path - mixed
            {x: 370, y: 480, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 350, y: 420, width: 60, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 380, y: 360, width: 60, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 360, y: 280, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 380, y: 180, width: 60, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 360, y: 100, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Right path - launch heavy
            {x: 660, y: 520, width: 60, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 680, y: 400, width: 60, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 660, y: 320, width: 60, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 680, y: 220, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 660, y: 140, width: 60, height: 20, type: 'launch', color: '#96ceb4'},
            
            // Connecting platforms
            {x: 200, y: 60, width: 400, height: 20, type: 'solid', color: '#4ecdc4'}
        ];
        
        this.blocks = blocks;
        
        this.stars = [
            {x: 110, y: 260, collected: false},
            {x: 390, y: 240, collected: false},
            {x: 690, y: 280, collected: false},
            {x: 300, y: 20, collected: false},
            {x: 500, y: 20, collected: false}
        ];
        
        this.exit = {x: 400, y: 20, width: 60, height: 40};
    }
    
    loadLevel9() {
        // Spiral ascent
        const blocks = [
            // Boundaries
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 800, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Spiral structure
            {x: 100, y: 520, width: 120, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 300, y: 500, width: 100, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 500, y: 480, width: 120, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 650, y: 440, width: 100, height: 20, type: 'solid', color: '#4ecdc4'},
            
            {x: 600, y: 380, width: 120, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 450, y: 340, width: 100, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 280, y: 300, width: 120, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 100, y: 260, width: 100, height: 20, type: 'launch', color: '#96ceb4'},
            
            {x: 60, y: 200, width: 120, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 220, y: 160, width: 100, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 380, y: 120, width: 120, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 550, y: 80, width: 100, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Center platform for exit
            {x: 350, y: 40, width: 100, height: 20, type: 'solid', color: '#4ecdc4'}
        ];
        
        this.blocks = blocks;
        
        this.stars = [
            {x: 160, y: 480, collected: false},
            {x: 550, y: 440, collected: false},
            {x: 650, y: 340, collected: false},
            {x: 330, y: 260, collected: false},
            {x: 120, y: 160, collected: false},
            {x: 440, y: 80, collected: false}
        ];
        
        this.exit = {x: 380, y: 0, width: 60, height: 40};
    }
    
    loadLevel10() {
        // The gauntlet
        const blocks = [
            // Boundaries
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 800, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Obstacle course
            {x: 80, y: 520, width: 40, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 140, y: 480, width: 40, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 220, y: 440, width: 40, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 300, y: 400, width: 40, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 380, y: 360, width: 40, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 460, y: 320, width: 40, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 540, y: 280, width: 40, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 620, y: 240, width: 40, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 680, y: 200, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Return path
            {x: 620, y: 160, width: 40, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 540, y: 120, width: 40, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 460, y: 80, width: 40, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 380, y: 40, width: 40, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 280, y: 60, width: 80, height: 20, type: 'solid', color: '#4ecdc4'}
        ];
        
        this.blocks = blocks;
        
        this.stars = [
            {x: 100, y: 480, collected: false},
            {x: 240, y: 400, collected: false},
            {x: 400, y: 320, collected: false},
            {x: 560, y: 240, collected: false},
            {x: 700, y: 160, collected: false},
            {x: 480, y: 40, collected: false}
        ];
        
        this.exit = {x: 300, y: 20, width: 60, height: 40};
    }
    
    loadLevel11() {
        // Gravity maze
        const blocks = [
            // Boundaries
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 800, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Complex gravity puzzle
            {x: 100, y: 500, width: 80, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 250, y: 450, width: 80, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 400, y: 500, width: 80, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 550, y: 450, width: 80, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Middle section with alternating gravity
            {x: 150, y: 350, width: 60, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 300, y: 320, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 450, y: 350, width: 60, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 600, y: 320, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Upper maze
            {x: 80, y: 220, width: 100, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 220, y: 180, width: 60, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 320, y: 140, width: 80, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 450, y: 100, width: 60, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 550, y: 60, width: 100, height: 20, type: 'solid', color: '#4ecdc4'}
        ];
        
        this.blocks = blocks;
        
        this.stars = [
            {x: 140, y: 460, collected: false},
            {x: 330, y: 280, collected: false},
            {x: 490, y: 310, collected: false},
            {x: 130, y: 180, collected: false},
            {x: 360, y: 100, collected: false},
            {x: 590, y: 20, collected: false}
        ];
        
        this.exit = {x: 580, y: 20, width: 60, height: 40};
    }
    
    loadLevel12() {
        // Final boss level - ultimate challenge
        const blocks = [
            // Boundaries
            {x: 0, y: 560, width: 800, height: 40, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 780, y: 0, width: 20, height: 600, type: 'solid', color: '#4ecdc4'},
            {x: 0, y: 0, width: 800, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Epic final level with all mechanics
            {x: 80, y: 520, width: 40, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 160, y: 480, width: 40, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 240, y: 440, width: 40, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 320, y: 400, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 420, y: 360, width: 40, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 500, y: 320, width: 40, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 580, y: 280, width: 40, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 660, y: 240, width: 80, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Upper challenge section
            {x: 600, y: 180, width: 40, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 520, y: 140, width: 40, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 440, y: 100, width: 40, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 320, y: 80, width: 40, height: 20, type: 'crumble', color: '#ff6b6b'},
            {x: 200, y: 60, width: 40, height: 20, type: 'gravity', color: '#b968c7'},
            {x: 80, y: 40, width: 60, height: 20, type: 'solid', color: '#4ecdc4'},
            
            // Final platforms
            {x: 250, y: 160, width: 100, height: 20, type: 'solid', color: '#4ecdc4'},
            {x: 400, y: 200, width: 80, height: 20, type: 'launch', color: '#96ceb4'},
            {x: 150, y: 120, width: 80, height: 20, type: 'gravity', color: '#b968c7'}
        ];
        
        this.blocks = blocks;
        
        this.stars = [
            {x: 110, y: 480, collected: false},
            {x: 270, y: 400, collected: false},
            {x: 450, y: 320, collected: false},
            {x: 610, y: 240, collected: false},
            {x: 470, y: 60, collected: false},
            {x: 300, y: 120, collected: false},
            {x: 110, y: 0, collected: false}
        ];
        
        this.exit = {x: 100, y: 0, width: 60, height: 40};
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.updateParticles();
        this.checkCollisions();
        this.checkStarCollection();
        this.checkLevelComplete();
        
        // Update gravity reversal timer
        if (this.gravityReversed) {
            this.gravityTimer--;
            if (this.gravityTimer <= 0) {
                this.gravityReversed = false;
            }
        }
    }
    
    updatePlayer() {
        // Handle input
        if (this.keys['arrowleft'] || this.keys['a'] || this.keys['keya']) {
            this.player.vx = -this.MOVE_SPEED;
        } else if (this.keys['arrowright'] || this.keys['d'] || this.keys['keyd']) {
            this.player.vx = this.MOVE_SPEED;
        } else {
            this.player.vx *= this.FRICTION;
        }
        
        // Jump
        if ((this.keys['space'] || this.keys[' '] || this.keys['arrowup'] || this.keys['w'] || this.keys['keyw']) && this.player.onGround) {
            this.player.vy = this.gravityReversed ? -this.JUMP_FORCE : this.JUMP_FORCE;
            this.player.onGround = false;
            this.playSound('jumpSound');
        }
        
        // Reset level with R key
        if (this.keys['r'] || this.keys['keyr']) {
            this.keys['r'] = false; // Prevent continuous reset
            this.keys['keyr'] = false;
            this.restartLevel();
            return; // Exit early since level is restarting
        }
        
        // Apply gravity
        const gravity = this.gravityReversed ? -this.GRAVITY : this.GRAVITY;
        this.player.vy += gravity;
        
        // Update position
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // Keep player in bounds
        if (this.player.x < 20) this.player.x = 20;
        if (this.player.x > 750) this.player.x = 750;
        
        // Check for falling off screen
        if (this.player.y > 650 || this.player.y < -50) {
            this.gameOver();
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
        this.player.onGround = false;
        
        for (let block of this.blocks) {
            if (this.isColliding(this.player, block)) {
                this.handleBlockCollision(block);
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    handleBlockCollision(block) {
        const playerBottom = this.player.y + this.player.height;
        const playerRight = this.player.x + this.player.width;
        const blockBottom = block.y + block.height;
        const blockRight = block.x + block.width;
        
        // Determine collision side
        const overlapLeft = playerRight - block.x;
        const overlapRight = blockRight - this.player.x;
        const overlapTop = playerBottom - block.y;
        const overlapBottom = blockBottom - this.player.y;
        
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        
        if (minOverlap === overlapTop && this.player.vy > 0) {
            // Landing on top
            this.player.y = block.y - this.player.height;
            this.player.vy = 0;
            this.player.onGround = true;
            this.handleBlockEffect(block, 'top');
        } else if (minOverlap === overlapBottom && this.player.vy < 0) {
            // Hitting from bottom
            this.player.y = block.y + block.height;
            this.player.vy = 0;
            this.handleBlockEffect(block, 'bottom');
        } else if (minOverlap === overlapLeft && this.player.vx > 0) {
            // Hitting from left
            this.player.x = block.x - this.player.width;
            this.player.vx = 0;
            this.handleBlockEffect(block, 'side');
        } else if (minOverlap === overlapRight && this.player.vx < 0) {
            // Hitting from right
            this.player.x = block.x + block.width;
            this.player.vx = 0;
            this.handleBlockEffect(block, 'side');
        }
    }
    
    handleBlockEffect(block, collisionSide) {
        switch (block.type) {
            case 'crumble':
                if (collisionSide === 'top') {
                    // Remove block after a short delay
                    setTimeout(() => {
                        const index = this.blocks.indexOf(block);
                        if (index > -1) {
                            this.blocks.splice(index, 1);
                            this.createParticles(block.x + block.width/2, block.y + block.height/2, '#ff6b6b');
                            this.playSound('bounceSound');
                        }
                    }, 100);
                }
                break;
                
            case 'launch':
                if (collisionSide === 'top') {
                    this.player.vy = this.gravityReversed ? 8 : -18;
                    this.createParticles(block.x + block.width/2, block.y, '#96ceb4');
                    this.playSound('bounceSound');
                }
                break;
                
            case 'gravity':
                if (collisionSide === 'top') {
                    this.gravityReversed = !this.gravityReversed;
                    this.gravityTimer = 300; // 5 seconds at 60fps
                    this.createParticles(block.x + block.width/2, block.y, '#b968c7');
                    this.playSound('bounceSound');
                }
                break;
        }
    }
    
    checkStarCollection() {
        for (let star of this.stars) {
            if (!star.collected && this.isCollidingPoint(this.player, star.x, star.y, 20)) {
                star.collected = true;
                this.starsCollected++;
                this.createParticles(star.x, star.y, '#ffeb3b');
                this.playSound('collectSound');
                this.updateHUD();
            }
        }
    }
    
    isCollidingPoint(rect, px, py, radius) {
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        const distance = Math.sqrt((centerX - px) ** 2 + (centerY - py) ** 2);
        return distance < radius;
    }
    
    checkLevelComplete() {
        if (this.starsCollected === this.totalStars) {
            // Check if player reached exit
            if (this.isColliding(this.player, this.exit)) {
                this.levelComplete();
            }
        }
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        this.playSound('completeSound');
        document.getElementById('levelComplete').classList.remove('hidden');
        
        if (this.currentLevel >= this.maxLevel) {
            document.getElementById('levelCompleteText').textContent = 'Congratulations! You completed all levels!';
            document.getElementById('nextLevel').style.display = 'none';
        } else {
            document.getElementById('levelCompleteText').textContent = `Level ${this.currentLevel} complete! Great bouncing!`;
            document.getElementById('nextLevel').style.display = 'inline-block';
        }
    }
    
    nextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.gameState = 'playing';
            document.getElementById('levelComplete').classList.add('hidden');
            this.loadLevel(this.currentLevel);
        }
    }
    
    restartLevel() {
        this.gameState = 'playing';
        document.getElementById('levelComplete').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        this.loadLevel(this.currentLevel);
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    backToMenu() {
        this.gameState = 'title';
        this.currentLevel = 1;
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('titleScreen').classList.add('active');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('levelComplete').classList.add('hidden');
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                maxLife: 30,
                color: color,
                alpha: 1
            });
        }
    }
    
    updateHUD() {
        document.getElementById('currentLevel').textContent = this.currentLevel;
        document.getElementById('starsCollected').textContent = this.starsCollected;
        document.getElementById('totalStars').textContent = this.totalStars;
    }
    
    playSound(soundId) {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {}); // Ignore audio errors
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'linear-gradient(45deg, #e3f2fd, #f3e5f5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#e3f2fd');
        gradient.addColorStop(1, '#f3e5f5');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing' || this.gameState === 'levelComplete' || this.gameState === 'gameOver') {
            this.renderBlocks();
            this.renderStars();
            this.renderExit();
            this.renderPlayer();
            this.renderParticles();
            this.renderGravityIndicator();
        }
    }
    
    renderBlocks() {
        for (let block of this.blocks) {
            this.ctx.fillStyle = block.color;
            this.ctx.fillRect(block.x, block.y, block.width, block.height);
            
            // Add visual indicators for special blocks
            if (block.type === 'crumble') {
                this.ctx.strokeStyle = '#ff4444';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.strokeRect(block.x, block.y, block.width, block.height);
                this.ctx.setLineDash([]);
            } else if (block.type === 'launch') {
                this.ctx.fillStyle = '#66bb6a';
                this.ctx.fillRect(block.x + 5, block.y + 5, block.width - 10, block.height - 10);
            } else if (block.type === 'gravity') {
                this.ctx.fillStyle = '#9c27b0';
                this.ctx.fillRect(block.x + 3, block.y + 3, block.width - 6, block.height - 6);
            }
            
            // Add border
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(block.x, block.y, block.width, block.height);
        }
    }
    
    renderStars() {
        for (let star of this.stars) {
            if (!star.collected) {
                this.drawStar(star.x, star.y, '#ffeb3b');
            }
        }
    }
    
    drawStar(x, y, color) {
        const size = 12;
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#ffa000';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 144 - 90) * Math.PI / 180;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    renderExit() {
        if (this.starsCollected === this.totalStars) {
            this.ctx.fillStyle = '#4caf50';
        } else {
            this.ctx.fillStyle = '#888';
        }
        
        this.ctx.fillRect(this.exit.x, this.exit.y, this.exit.width, this.exit.height);
        
        // Draw door design
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.exit.x + 10, this.exit.y + 10, this.exit.width - 20, this.exit.height - 20);
        
        // Draw handle
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillRect(this.exit.x + this.exit.width - 15, this.exit.y + 30, 8, 8);
        
        // Add exit text
        if (this.starsCollected === this.totalStars) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('EXIT', this.exit.x + this.exit.width/2, this.exit.y - 5);
        }
    }
    
    renderPlayer() {
        // Player cube with rounded corners
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Add face
        this.ctx.fillStyle = '#333';
        // Eyes
        this.ctx.fillRect(this.player.x + 8, this.player.y + 8, 4, 4);
        this.ctx.fillRect(this.player.x + 18, this.player.y + 8, 4, 4);
        // Mouth
        this.ctx.fillRect(this.player.x + 10, this.player.y + 18, 10, 2);
        
        // Add border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }
    
    renderParticles() {
        for (let particle of this.particles) {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        }
        this.ctx.globalAlpha = 1;
    }
    
    renderGravityIndicator() {
        if (this.gravityReversed) {
            this.ctx.fillStyle = 'rgba(156, 39, 176, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Arrow indicating reversed gravity
            this.ctx.fillStyle = '#9c27b0';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('↑ GRAVITY REVERSED ↑', this.canvas.width/2, 50);
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new BounceBloxGame();
    window.bounceBloxGame = game; // Make game accessible globally for testing
});