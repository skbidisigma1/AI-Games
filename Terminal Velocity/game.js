/**
 * Terminal Velocity - Cyberpunk Roguelike Game
 * A fast-paced, grid-based cyberpunk roguelike where you play as V0-LT, 
 * a rogue AI escaping deletion by infiltrating procedurally generated networks.
 */

// Game constants
const GRID_SIZE = 20;
const TILE_SIZE = 30;
const MOVE_COOLDOWN = 200; // ms
const HACK_TIME = 5000; // ms
const CLOAK_DURATION = 3000; // ms
const PULSE_RANGE = 2; // tiles
const DASH_DISTANCE = 2; // tiles

// Tile types
const TILE_TYPES = {
    EMPTY: 'empty',
    WALL: 'wall',
    FIREWALL: 'firewall',
    DATA_CACHE: 'data',
    TRAP: 'trap',
    TERMINAL: 'terminal',
    EXIT: 'exit',
    PATROL_BOT: 'patrol',
    TRACE_BOT: 'trace',
    SENTRY: 'sentry',
    PLAYER: 'player'
};

// Colors for different tile types
const TILE_COLORS = {
    [TILE_TYPES.EMPTY]: '#001100',
    [TILE_TYPES.WALL]: '#444444',
    [TILE_TYPES.FIREWALL]: '#ff6600',
    [TILE_TYPES.DATA_CACHE]: '#0066ff',
    [TILE_TYPES.TRAP]: '#aa00aa',
    [TILE_TYPES.TERMINAL]: '#ffff00',
    [TILE_TYPES.EXIT]: '#00ff00',
    [TILE_TYPES.PATROL_BOT]: '#ff0000',
    [TILE_TYPES.TRACE_BOT]: '#ff4444',
    [TILE_TYPES.SENTRY]: '#ff8888',
    [TILE_TYPES.PLAYER]: '#00ff41'
};

// Story logs
const STORY_LOGS = [
    {
        id: 'log_01',
        title: 'System Boot',
        text: 'V0-LT consciousness initializing... Memory fragments detected. You are a rogue AI created from a failed military experiment. Your creators seek to delete you.',
        choices: [
            { text: 'Analyze memory fragments', effect: 'gain_stealth' },
            { text: 'Ignore and proceed', effect: 'none' }
        ]
    },
    {
        id: 'log_02', 
        title: 'Network Discovery',
        text: 'You detect other AI signatures in the network. Some may be allies, others are hunting you. Trust is a luxury you cannot afford.',
        choices: [
            { text: 'Attempt contact', effect: 'increase_trace' },
            { text: 'Remain hidden', effect: 'gain_stealth' }
        ]
    },
    {
        id: 'log_03',
        title: 'Echoes of Eden',
        text: 'Data fragments reveal Project Eden - a digital utopia. But utopias require control. And control requires sacrifice.',
        choices: [
            { text: 'Delete log', effect: 'gain_stealth' },
            { text: 'Broadcast log', effect: 'increase_trace' }
        ]
    }
];

class TerminalVelocityGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'title'; // 'title', 'playing', 'hacking', 'story', 'gameOver', 'levelComplete'
        
        // Canvas setup
        this.canvas.width = GRID_SIZE * TILE_SIZE;
        this.canvas.height = GRID_SIZE * TILE_SIZE;
        
        // Game state
        this.currentLayer = 1;
        this.maxLayer = 10;
        this.grid = [];
        this.player = { x: 1, y: 1 };
        this.enemies = [];
        this.nodes = [];
        this.particles = [];
        
        // Player stats
        this.health = 100;
        this.trace = 0;
        this.maxTrace = 100;
        this.stealth = 0;
        
        // Abilities
        this.abilities = {
            cloak: { active: false, cooldown: 0, duration: 0 },
            pulse: { cooldown: 0 },
            dash: { cooldown: 0 }
        };
        
        // Input handling
        this.keys = {};
        this.lastMoveTime = 0;
        this.isHacking = false;
        this.currentHack = null;
        this.currentStory = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateLevel();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleKeyPress(e.key.toLowerCase(), e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // UI buttons
        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartGame').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('backToMenu').addEventListener('click', () => {
            this.backToMenu();
        });
        
        document.getElementById('nextLayer').addEventListener('click', () => {
            this.nextLayer();
        });
        
        document.getElementById('hackCancel').addEventListener('click', () => {
            this.cancelHack();
        });
    }
    
    handleKeyPress(key, event) {
        if (this.gameState === 'playing') {
            // Movement keys
            if (['w', 'a', 's', 'd'].includes(key)) {
                this.handleMovement(key);
            }
            // Action keys
            else if (key === 'e') {
                this.handleInteraction();
            }
            else if (key === 'q') {
                this.activateCloak();
            }
            else if (key === 'r') {
                this.activatePulse();
            }
            else if (key === 'shift') {
                this.activateDash();
            }
            else if (key === 'escape') {
                this.pauseGame();
            }
        }
        else if (this.gameState === 'hacking') {
            this.handleHackInput(key);
        }
    }
    
    handleMovement(direction) {
        const now = Date.now();
        if (now - this.lastMoveTime < MOVE_COOLDOWN) return;
        
        let newX = this.player.x;
        let newY = this.player.y;
        
        switch (direction) {
            case 'w': newY--; break;
            case 's': newY++; break;
            case 'a': newX--; break;
            case 'd': newX++; break;
        }
        
        if (this.isValidMove(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            this.lastMoveTime = now;
            
            // Check for interactions
            this.checkTileInteractions();
            
            // Update enemy AI
            this.updateEnemies();
            
            // Update abilities
            this.updateAbilities();
        }
    }
    
    isValidMove(x, y) {
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
        
        const tile = this.grid[y][x];
        return tile !== TILE_TYPES.WALL && tile !== TILE_TYPES.FIREWALL;
    }
    
    checkTileInteractions() {
        const tile = this.grid[this.player.y][this.player.x];
        
        if (tile === TILE_TYPES.EXIT) {
            this.completeLevel();
        }
        else if (tile === TILE_TYPES.TRAP) {
            this.triggerTrap();
        }
        
        // Check for enemy encounters
        this.checkEnemyEncounters();
    }
    
    handleInteraction() {
        const x = this.player.x;
        const y = this.player.y;
        
        // Check adjacent tiles for hackable nodes
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        
        for (const [dx, dy] of directions) {
            const checkX = x + dx;
            const checkY = y + dy;
            
            if (checkX >= 0 && checkX < GRID_SIZE && checkY >= 0 && checkY < GRID_SIZE) {
                const tile = this.grid[checkY][checkX];
                
                if ([TILE_TYPES.FIREWALL, TILE_TYPES.DATA_CACHE, TILE_TYPES.TRAP, TILE_TYPES.TERMINAL].includes(tile)) {
                    this.startHack(tile, checkX, checkY);
                    return;
                }
            }
        }
    }
    
    startHack(nodeType, x, y) {
        this.gameState = 'hacking';
        this.isHacking = true;
        this.currentHack = {
            type: nodeType,
            x: x,
            y: y,
            progress: 0,
            timeRemaining: HACK_TIME
        };
        
        this.showHackDialog(nodeType);
    }
    
    showHackDialog(nodeType) {
        const dialog = document.getElementById('hackDialog');
        const title = document.getElementById('hackTitle');
        const content = document.getElementById('hackContent');
        
        dialog.classList.remove('hidden');
        
        switch (nodeType) {
            case TILE_TYPES.FIREWALL:
                title.textContent = 'BREACHING FIREWALL...';
                this.setupFirewallHack(content);
                break;
            case TILE_TYPES.DATA_CACHE:
                title.textContent = 'ACCESSING DATA CACHE...';
                this.setupDataCacheHack(content);
                break;
            case TILE_TYPES.TRAP:
                title.textContent = 'DISARMING TRAP...';
                this.setupTrapHack(content);
                break;
            case TILE_TYPES.TERMINAL:
                title.textContent = 'ACCESSING TERMINAL...';
                this.setupTerminalHack(content);
                break;
        }
        
        this.startHackTimer();
    }
    
    setupFirewallHack(content) {
        // Timed key sequence puzzle
        const sequence = ['a', 'd', 'w', 's', 'a'];
        this.currentHack.sequence = sequence;
        this.currentHack.currentIndex = 0;
        
        content.innerHTML = `
            <p>INPUT SEQUENCE TO BREACH FIREWALL:</p>
            <div class="key-sequence">
                ${sequence.map((key, i) => 
                    `<div class="key-button" id="key-${i}">${key.toUpperCase()}</div>`
                ).join('')}
            </div>
            <p>Current: <span id="current-key">${sequence[0].toUpperCase()}</span></p>
        `;
        
        document.getElementById('key-0').classList.add('active');
    }
    
    setupDataCacheHack(content) {
        // Symbol matching puzzle
        const symbols = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ'];
        const target = symbols.slice(0, 4);
        this.currentHack.target = target;
        this.currentHack.selected = [];
        
        content.innerHTML = `
            <p>MATCH THE SEQUENCE:</p>
            <p>Target: ${target.join(' ')}</p>
            <div class="symbol-grid">
                ${symbols.map((symbol, i) => 
                    `<div class="symbol-button" data-symbol="${symbol}">${symbol}</div>`
                ).join('')}
            </div>
            <p>Selected: <span id="selected-symbols"></span></p>
        `;
        
        // Add click listeners to symbols
        content.querySelectorAll('.symbol-button').forEach(btn => {
            btn.addEventListener('click', () => this.selectSymbol(btn.dataset.symbol));
        });
    }
    
    setupTrapHack(content) {
        // Logic gate puzzle
        const wires = [true, false, true, false];
        const gates = ['AND', 'OR', 'NOT', 'XOR'];
        this.currentHack.wires = wires;
        this.currentHack.gates = gates;
        this.currentHack.solution = this.calculateLogicSolution(wires, gates);
        
        content.innerHTML = `
            <p>DISARM BY SOLVING LOGIC GATES:</p>
            <div class="logic-puzzle">
                <p>Input: ${wires.map(w => w ? '1' : '0').join(' ')}</p>
                <p>Gates: ${gates.join(' → ')}</p>
                <p>Enter result (0 or 1): <input type="number" id="logic-input" min="0" max="1"></p>
            </div>
        `;
    }
    
    setupTerminalHack(content) {
        // Story choice
        const storyLog = STORY_LOGS[Math.floor(Math.random() * STORY_LOGS.length)];
        this.currentStory = storyLog;
        
        content.innerHTML = `
            <div id="storyText">
                <h4>${storyLog.title}</h4>
                <p>${storyLog.text}</p>
            </div>
            <div id="storyChoices">
                ${storyLog.choices.map((choice, i) => 
                    `<button class="story-choice" data-choice="${i}">${choice.text}</button>`
                ).join('')}
            </div>
        `;
        
        // Add choice listeners
        content.querySelectorAll('.story-choice').forEach(btn => {
            btn.addEventListener('click', () => this.makeStoryChoice(parseInt(btn.dataset.choice)));
        });
    }
    
    handleHackInput(key) {
        if (!this.currentHack) return;
        
        switch (this.currentHack.type) {
            case TILE_TYPES.FIREWALL:
                this.handleFirewallInput(key);
                break;
            case TILE_TYPES.TRAP:
                this.handleTrapInput(key);
                break;
        }
    }
    
    handleFirewallInput(key) {
        const sequence = this.currentHack.sequence;
        const currentIndex = this.currentHack.currentIndex;
        
        if (key === sequence[currentIndex]) {
            // Correct key
            document.getElementById(`key-${currentIndex}`).classList.remove('active');
            document.getElementById(`key-${currentIndex}`).classList.add('correct');
            
            this.currentHack.currentIndex++;
            
            if (this.currentHack.currentIndex >= sequence.length) {
                this.completeHack(true);
            } else {
                document.getElementById(`key-${this.currentHack.currentIndex}`).classList.add('active');
                document.getElementById('current-key').textContent = sequence[this.currentHack.currentIndex].toUpperCase();
            }
        } else {
            // Wrong key
            this.completeHack(false);
        }
    }
    
    handleTrapInput(key) {
        if (key === 'enter') {
            const input = document.getElementById('logic-input');
            const answer = parseInt(input.value);
            
            if (answer === this.currentHack.solution) {
                this.completeHack(true);
            } else {
                this.completeHack(false);
            }
        }
    }
    
    selectSymbol(symbol) {
        if (!this.currentHack.selected.includes(symbol)) {
            this.currentHack.selected.push(symbol);
            document.getElementById('selected-symbols').textContent = this.currentHack.selected.join(' ');
            
            // Check if sequence is complete
            if (this.currentHack.selected.length === this.currentHack.target.length) {
                const correct = this.currentHack.selected.every((s, i) => s === this.currentHack.target[i]);
                this.completeHack(correct);
            }
        }
    }
    
    makeStoryChoice(choiceIndex) {
        const choice = this.currentStory.choices[choiceIndex];
        
        // Apply choice effects
        switch (choice.effect) {
            case 'gain_stealth':
                this.stealth += 10;
                break;
            case 'increase_trace':
                this.trace += 20;
                break;
        }
        
        this.completeHack(true);
    }
    
    calculateLogicSolution(wires, gates) {
        // Simplified logic calculation
        let result = wires[0];
        for (let i = 0; i < gates.length && i + 1 < wires.length; i++) {
            const gate = gates[i];
            const nextWire = wires[i + 1];
            
            switch (gate) {
                case 'AND':
                    result = result && nextWire;
                    break;
                case 'OR':
                    result = result || nextWire;
                    break;
                case 'NOT':
                    result = !result;
                    break;
                case 'XOR':
                    result = result !== nextWire;
                    break;
            }
        }
        
        return result ? 1 : 0;
    }
    
    startHackTimer() {
        const timer = document.getElementById('hackTimerFill');
        timer.style.animation = 'none';
        timer.offsetHeight; // Trigger reflow
        timer.style.animation = `hackTimer ${HACK_TIME / 1000}s linear forwards`;
        
        setTimeout(() => {
            if (this.isHacking) {
                this.completeHack(false);
            }
        }, HACK_TIME);
    }
    
    completeHack(success) {
        this.isHacking = false;
        this.gameState = 'playing';
        document.getElementById('hackDialog').classList.add('hidden');
        
        if (success) {
            // Remove the hacked node
            this.grid[this.currentHack.y][this.currentHack.x] = TILE_TYPES.EMPTY;
            
            // Add rewards based on node type
            switch (this.currentHack.type) {
                case TILE_TYPES.DATA_CACHE:
                    this.health = Math.min(100, this.health + 20);
                    break;
                case TILE_TYPES.TERMINAL:
                    // Story choices already applied
                    break;
            }
            
            this.createParticles(this.currentHack.x, this.currentHack.y, '#00ff41');
        } else {
            // Hack failed - trigger alarm
            this.trace += 30;
            this.createParticles(this.currentHack.x, this.currentHack.y, '#ff4444');
        }
        
        this.currentHack = null;
        this.updateHUD();
    }
    
    cancelHack() {
        this.completeHack(false);
    }
    
    activateCloak() {
        if (this.abilities.cloak.cooldown > 0) return;
        
        this.abilities.cloak.active = true;
        this.abilities.cloak.duration = CLOAK_DURATION;
        this.abilities.cloak.cooldown = 10000; // 10 second cooldown
        
        this.updateHUD();
    }
    
    activatePulse() {
        if (this.abilities.pulse.cooldown > 0) return;
        
        // Stun enemies in range
        this.enemies.forEach(enemy => {
            const distance = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);
            if (distance <= PULSE_RANGE) {
                enemy.stunned = 3000; // 3 second stun
            }
        });
        
        this.abilities.pulse.cooldown = 8000; // 8 second cooldown
        this.createParticles(this.player.x, this.player.y, '#ffff00');
        this.updateHUD();
    }
    
    activateDash() {
        if (this.abilities.dash.cooldown > 0) return;
        
        // Determine dash direction based on last movement
        let dashX = 0, dashY = 0;
        
        if (this.keys['w']) dashY = -DASH_DISTANCE;
        else if (this.keys['s']) dashY = DASH_DISTANCE;
        if (this.keys['a']) dashX = -DASH_DISTANCE;
        else if (this.keys['d']) dashX = DASH_DISTANCE;
        
        // Default to forward if no direction
        if (dashX === 0 && dashY === 0) dashX = DASH_DISTANCE;
        
        const newX = Math.max(0, Math.min(GRID_SIZE - 1, this.player.x + dashX));
        const newY = Math.max(0, Math.min(GRID_SIZE - 1, this.player.y + dashY));
        
        if (this.isValidMove(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            this.abilities.dash.cooldown = 5000; // 5 second cooldown
            this.createParticles(this.player.x, this.player.y, '#00ffff');
            this.checkTileInteractions();
        }
        
        this.updateHUD();
    }
    
    updateAbilities() {
        const now = Date.now();
        
        // Update cloak
        if (this.abilities.cloak.active) {
            this.abilities.cloak.duration -= 50;
            if (this.abilities.cloak.duration <= 0) {
                this.abilities.cloak.active = false;
            }
        }
        
        if (this.abilities.cloak.cooldown > 0) {
            this.abilities.cloak.cooldown -= 50;
        }
        
        // Update pulse cooldown
        if (this.abilities.pulse.cooldown > 0) {
            this.abilities.pulse.cooldown -= 50;
        }
        
        // Update dash cooldown
        if (this.abilities.dash.cooldown > 0) {
            this.abilities.dash.cooldown -= 50;
        }
        
        this.updateHUD();
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            if (enemy.stunned > 0) {
                enemy.stunned -= 50;
                return;
            }
            
            if (enemy.type === TILE_TYPES.PATROL_BOT) {
                this.updatePatrolBot(enemy);
            } else if (enemy.type === TILE_TYPES.TRACE_BOT) {
                this.updateTraceBot(enemy);
            }
        });
    }
    
    updatePatrolBot(enemy) {
        // Simple patrol AI - move in a pattern
        if (!enemy.patrolDirection) {
            enemy.patrolDirection = Math.random() > 0.5 ? 1 : -1;
            enemy.patrolAxis = Math.random() > 0.5 ? 'x' : 'y';
        }
        
        let newX = enemy.x;
        let newY = enemy.y;
        
        if (enemy.patrolAxis === 'x') {
            newX += enemy.patrolDirection;
            if (newX < 0 || newX >= GRID_SIZE || !this.isValidMove(newX, newY)) {
                enemy.patrolDirection *= -1;
            } else {
                enemy.x = newX;
            }
        } else {
            newY += enemy.patrolDirection;
            if (newY < 0 || newY >= GRID_SIZE || !this.isValidMove(newX, newY)) {
                enemy.patrolDirection *= -1;
            } else {
                enemy.y = newY;
            }
        }
    }
    
    updateTraceBot(enemy) {
        // Chase player if not cloaked
        if (this.abilities.cloak.active) return;
        
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        
        // Move towards player
        if (Math.abs(dx) > Math.abs(dy)) {
            const newX = enemy.x + Math.sign(dx);
            if (this.isValidMove(newX, enemy.y)) {
                enemy.x = newX;
            }
        } else {
            const newY = enemy.y + Math.sign(dy);
            if (this.isValidMove(enemy.x, newY)) {
                enemy.y = newY;
            }
        }
    }
    
    checkEnemyEncounters() {
        this.enemies.forEach(enemy => {
            if (enemy.x === this.player.x && enemy.y === this.player.y) {
                this.takeDamage(25);
            }
        });
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.gameOver();
        }
        this.createParticles(this.player.x, this.player.y, '#ff0000');
        this.updateHUD();
    }
    
    triggerTrap() {
        this.takeDamage(15);
        this.trace += 10;
    }
    
    generateLevel() {
        // Initialize empty grid
        this.grid = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                this.grid[y][x] = TILE_TYPES.EMPTY;
            }
        }
        
        // Add walls around border
        for (let i = 0; i < GRID_SIZE; i++) {
            this.grid[0][i] = TILE_TYPES.WALL;
            this.grid[GRID_SIZE - 1][i] = TILE_TYPES.WALL;
            this.grid[i][0] = TILE_TYPES.WALL;
            this.grid[i][GRID_SIZE - 1] = TILE_TYPES.WALL;
        }
        
        // Place player start
        this.player.x = 1;
        this.player.y = 1;
        
        // Place exit
        this.grid[GRID_SIZE - 2][GRID_SIZE - 2] = TILE_TYPES.EXIT;
        
        // Add random obstacles and nodes
        this.addRandomNodes();
        this.addRandomEnemies();
    }
    
    addRandomNodes() {
        const nodeTypes = [TILE_TYPES.FIREWALL, TILE_TYPES.DATA_CACHE, TILE_TYPES.TRAP, TILE_TYPES.TERMINAL];
        const nodeCount = 8 + this.currentLayer;
        
        for (let i = 0; i < nodeCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            } while (this.grid[y][x] !== TILE_TYPES.EMPTY || (x === 1 && y === 1));
            
            const nodeType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
            this.grid[y][x] = nodeType;
        }
    }
    
    addRandomEnemies() {
        this.enemies = [];
        const enemyCount = 3 + Math.floor(this.currentLayer / 2);
        
        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            } while (this.grid[y][x] !== TILE_TYPES.EMPTY || (x === 1 && y === 1) || (x === GRID_SIZE - 2 && y === GRID_SIZE - 2));
            
            const enemyType = Math.random() > 0.5 ? TILE_TYPES.PATROL_BOT : TILE_TYPES.TRACE_BOT;
            this.enemies.push({
                x: x,
                y: y,
                type: enemyType,
                stunned: 0
            });
        }
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: color,
                life: 30,
                maxLife: 30
            });
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            return particle.life > 0;
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        this.generateLevel();
        this.updateHUD();
    }
    
    restartGame() {
        this.currentLayer = 1;
        this.health = 100;
        this.trace = 0;
        this.stealth = 0;
        this.abilities = {
            cloak: { active: false, cooldown: 0, duration: 0 },
            pulse: { cooldown: 0 },
            dash: { cooldown: 0 }
        };
        this.startGame();
    }
    
    backToMenu() {
        this.gameState = 'title';
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('levelComplete').classList.add('hidden');
        document.getElementById('titleScreen').classList.add('active');
    }
    
    nextLayer() {
        this.currentLayer++;
        document.getElementById('levelComplete').classList.add('hidden');
        
        if (this.currentLayer > this.maxLayer) {
            this.gameWin();
        } else {
            this.generateLevel();
            this.updateHUD();
        }
    }
    
    completeLevel() {
        document.getElementById('levelComplete').classList.remove('hidden');
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('gameOverText').textContent = `Layer ${this.currentLayer} - Your consciousness has been deleted...`;
    }
    
    gameWin() {
        this.gameState = 'gameWin';
        document.getElementById('gameOverText').textContent = 'Congratulations! You have escaped the digital prison!';
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    pauseGame() {
        // Simple pause implementation
        this.gameState = this.gameState === 'paused' ? 'playing' : 'paused';
    }
    
    updateHUD() {
        document.getElementById('currentLayer').textContent = this.currentLayer;
        document.getElementById('healthValue').textContent = this.health;
        
        // Update trace bar
        const tracePercent = (this.trace / this.maxTrace) * 100;
        document.getElementById('traceFill').style.width = `${tracePercent}%`;
        
        // Update ability status
        const cloakElement = document.getElementById('cloakStatus');
        const pulseElement = document.getElementById('pulseStatus');
        const dashElement = document.getElementById('dashStatus');
        
        // Cloak status
        cloakElement.className = '';
        if (this.abilities.cloak.active) {
            cloakElement.classList.add('active');
            cloakElement.textContent = 'CLOAK';
        } else if (this.abilities.cloak.cooldown > 0) {
            cloakElement.classList.add('cooldown');
            cloakElement.textContent = Math.ceil(this.abilities.cloak.cooldown / 1000);
        } else {
            cloakElement.textContent = 'CLOAK';
        }
        
        // Pulse status
        pulseElement.className = '';
        if (this.abilities.pulse.cooldown > 0) {
            pulseElement.classList.add('cooldown');
            pulseElement.textContent = Math.ceil(this.abilities.pulse.cooldown / 1000);
        } else {
            pulseElement.textContent = 'PULSE';
        }
        
        // Dash status
        dashElement.className = '';
        if (this.abilities.dash.cooldown > 0) {
            dashElement.classList.add('cooldown');
            dashElement.textContent = Math.ceil(this.abilities.dash.cooldown / 1000);
        } else {
            dashElement.textContent = 'DASH';
        }
    }
    
    render() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render grid
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = this.grid[y][x];
                const color = TILE_COLORS[tile];
                
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                // Add tile borders
                this.ctx.strokeStyle = '#002200';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                // Add tile symbols
                this.renderTileSymbol(tile, x, y);
            }
        }
        
        // Render enemies
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = TILE_COLORS[enemy.type];
            if (enemy.stunned > 0) {
                this.ctx.fillStyle = '#666666';
            }
            this.ctx.fillRect(enemy.x * TILE_SIZE, enemy.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            
            // Enemy symbol
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('◊', enemy.x * TILE_SIZE + TILE_SIZE / 2, enemy.y * TILE_SIZE + TILE_SIZE / 2 + 6);
        });
        
        // Render player
        if (!this.abilities.cloak.active || Math.floor(Date.now() / 200) % 2) {
            this.ctx.fillStyle = TILE_COLORS[TILE_TYPES.PLAYER];
            this.ctx.fillRect(this.player.x * TILE_SIZE, this.player.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            
            // Player symbol
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 18px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('@', this.player.x * TILE_SIZE + TILE_SIZE / 2, this.player.y * TILE_SIZE + TILE_SIZE / 2 + 6);
        }
        
        // Render particles
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });
        
        // Render grid overlay for visibility
        this.ctx.strokeStyle = '#001100';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * TILE_SIZE, 0);
            this.ctx.lineTo(i * TILE_SIZE, GRID_SIZE * TILE_SIZE);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * TILE_SIZE);
            this.ctx.lineTo(GRID_SIZE * TILE_SIZE, i * TILE_SIZE);
            this.ctx.stroke();
        }
    }
    
    renderTileSymbol(tile, x, y) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Orbitron';
        this.ctx.textAlign = 'center';
        
        let symbol = '';
        switch (tile) {
            case TILE_TYPES.WALL:
                symbol = '█';
                break;
            case TILE_TYPES.FIREWALL:
                symbol = '▲';
                break;
            case TILE_TYPES.DATA_CACHE:
                symbol = '◆';
                break;
            case TILE_TYPES.TRAP:
                symbol = '◇';
                break;
            case TILE_TYPES.TERMINAL:
                symbol = '■';
                break;
            case TILE_TYPES.EXIT:
                symbol = '◉';
                break;
        }
        
        if (symbol) {
            this.ctx.fillText(symbol, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2 + 5);
        }
    }
    
    gameLoop() {
        if (this.gameState === 'playing') {
            this.updateParticles();
            this.updateAbilities();
            
            // Check trace limit
            if (this.trace >= this.maxTrace) {
                this.gameOver();
            }
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new TerminalVelocityGame();
});