class EliNeilsonGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'title'; // 'title', 'playing', 'gameOver', 'complete'
        
        // Game settings
        this.MOVE_SPEED = 3;
        this.TILE_SIZE = 40;
        
        // Input handling
        this.keys = {};
        this.lastInteractionTime = 0;
        
        // Player (Eli)
        this.player = {
            x: 80,
            y: 520,
            width: 30,
            height: 30,
            health: 100,
            maxHealth: 100,
            color: '#4a90e2'
        };
        
        // Game world
        this.currentRoom = 'entrance';
        this.rooms = this.initializeRooms();
        this.inventory = [];
        this.maxInventorySlots = 6;
        
        // Game objects
        this.hazards = [];
        this.items = [];
        this.interactables = [];
        this.doors = [];
        
        this.setupLevel();
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateInventoryDisplay();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (this.gameState === 'playing') {
                if (e.key.toLowerCase() === 'e') {
                    this.handleInteraction();
                }
                if (e.key.toLowerCase() === 'w') {
                    this.useItem();
                }
            }
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
        
        document.getElementById('restartFromGameOver').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('backToMenu').addEventListener('click', () => {
            this.showTitle();
        });
    }
    
    initializeRooms() {
        return {
            entrance: {
                name: "Entrance Hall",
                walls: [
                    // Outer walls
                    {x: 0, y: 0, width: 800, height: 20},           // Top
                    {x: 0, y: 580, width: 800, height: 20},         // Bottom
                    {x: 0, y: 0, width: 20, height: 600},           // Left
                    {x: 780, y: 0, width: 20, height: 600},         // Right
                    // Inner obstacles
                    {x: 200, y: 200, width: 100, height: 20},       // Table
                    {x: 500, y: 300, width: 80, height: 80},        // Large obstacle
                ],
                hazards: [
                    {x: 300, y: 400, width: 60, height: 20, type: 'spikes', damage: 25},
                    {x: 600, y: 150, width: 40, height: 40, type: 'fire', damage: 30},
                ],
                items: [
                    {x: 150, y: 250, type: 'key', name: 'Door Key'},
                    {x: 650, y: 500, type: 'health', name: 'Bandage'},
                ],
                doors: [
                    {x: 380, y: 20, width: 40, height: 20, to: 'hallway', requiresKey: true},
                ],
                interactables: [
                    {x: 100, y: 100, width: 40, height: 40, type: 'sign', message: "Welcome to Eli's house! Beware of the hazards ahead."},
                ]
            },
            hallway: {
                name: "Dark Hallway",
                walls: [
                    {x: 0, y: 0, width: 800, height: 20},
                    {x: 0, y: 580, width: 800, height: 20},
                    {x: 0, y: 0, width: 20, height: 600},
                    {x: 780, y: 0, width: 20, height: 600},
                    // Hallway obstacles
                    {x: 200, y: 100, width: 20, height: 200},
                    {x: 400, y: 300, width: 20, height: 200},
                    {x: 600, y: 100, width: 20, height: 200},
                ],
                hazards: [
                    {x: 100, y: 200, width: 80, height: 20, type: 'laser', damage: 35},
                    {x: 300, y: 450, width: 80, height: 20, type: 'laser', damage: 35},
                    {x: 500, y: 150, width: 80, height: 20, type: 'laser', damage: 35},
                ],
                items: [
                    {x: 350, y: 200, type: 'shield', name: 'Protection Shield'},
                ],
                doors: [
                    {x: 380, y: 580, width: 40, height: 20, to: 'entrance', requiresKey: false},
                    {x: 380, y: 20, width: 40, height: 20, to: 'computerroom', requiresKey: false},
                ],
                interactables: []
            },
            computerroom: {
                name: "Computer Room",
                walls: [
                    {x: 0, y: 0, width: 800, height: 20},
                    {x: 0, y: 580, width: 800, height: 20},
                    {x: 0, y: 0, width: 20, height: 600},
                    {x: 780, y: 0, width: 20, height: 600},
                    // Computer desk
                    {x: 300, y: 200, width: 200, height: 80},
                ],
                hazards: [
                    {x: 100, y: 400, width: 100, height: 20, type: 'electric', damage: 40},
                    {x: 600, y: 400, width: 100, height: 20, type: 'electric', damage: 40},
                ],
                items: [],
                doors: [
                    {x: 380, y: 580, width: 40, height: 20, to: 'hallway', requiresKey: false},
                ],
                interactables: [
                    {x: 350, y: 180, width: 100, height: 40, type: 'computer', message: "Eli's Computer - Press E to search!"},
                ]
            }
        };
    }
    
    setupLevel() {
        const room = this.rooms[this.currentRoom];
        this.hazards = [...room.hazards];
        this.items = [...room.items];
        this.doors = [...room.doors];
        this.interactables = [...room.interactables];
        
        // Reset player position when entering new room
        if (this.currentRoom === 'entrance') {
            this.player.x = 80;
            this.player.y = 520;
        } else if (this.currentRoom === 'hallway') {
            this.player.x = 400;
            this.player.y = 550;
        } else if (this.currentRoom === 'computerroom') {
            this.player.x = 400;
            this.player.y = 550;
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.showScreen('gameScreen');
    }
    
    restartGame() {
        this.currentRoom = 'entrance';
        this.player.x = 80;
        this.player.y = 520;
        this.player.health = this.player.maxHealth;
        this.inventory = [];
        this.setupLevel();
        this.updateInventoryDisplay();
        this.gameState = 'playing';
        this.showScreen('gameScreen');
    }
    
    showTitle() {
        this.gameState = 'title';
        this.showScreen('titleScreen');
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.checkCollisions();
        this.updateUI();
        this.checkInteractables();
    }
    
    updatePlayer() {
        const speed = this.MOVE_SPEED;
        let newX = this.player.x;
        let newY = this.player.y;
        
        // Movement
        if (this.keys['arrowleft']) {
            newX -= speed;
        }
        if (this.keys['arrowright']) {
            newX += speed;
        }
        if (this.keys['arrowup']) {
            newY -= speed;
        }
        if (this.keys['arrowdown']) {
            newY += speed;
        }
        
        // Check wall collisions
        if (!this.checkWallCollision(newX, this.player.y)) {
            this.player.x = newX;
        }
        if (!this.checkWallCollision(this.player.x, newY)) {
            this.player.y = newY;
        }
    }
    
    checkWallCollision(x, y) {
        const room = this.rooms[this.currentRoom];
        const playerRect = {x, y, width: this.player.width, height: this.player.height};
        
        return room.walls.some(wall => this.isColliding(playerRect, wall));
    }
    
    checkCollisions() {
        // Check hazard collisions
        this.hazards.forEach(hazard => {
            if (this.isColliding(this.player, hazard)) {
                this.takeDamage(hazard.damage);
            }
        });
        
        // Check item collisions
        this.items = this.items.filter(item => {
            if (this.isColliding(this.player, item)) {
                this.collectItem(item);
                return false;
            }
            return true;
        });
        
        // Check door collisions
        this.doors.forEach(door => {
            if (this.isColliding(this.player, door)) {
                this.enterDoor(door);
            }
        });
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    takeDamage(amount) {
        // Check if player has shield
        const hasShield = this.inventory.some(item => item.type === 'shield');
        if (hasShield) {
            amount = Math.floor(amount / 2);
            // Remove shield after use
            this.inventory = this.inventory.filter(item => item.type !== 'shield');
            this.updateInventoryDisplay();
        }
        
        this.player.health -= amount;
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    collectItem(item) {
        if (this.inventory.length < this.maxInventorySlots) {
            this.inventory.push(item);
            this.updateInventoryDisplay();
            
            if (item.type === 'health') {
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
            }
        }
    }
    
    enterDoor(door) {
        if (door.requiresKey) {
            const hasKey = this.inventory.some(item => item.type === 'key');
            if (!hasKey) {
                return;
            }
            // Remove key after use
            this.inventory = this.inventory.filter(item => item.type !== 'key');
            this.updateInventoryDisplay();
        }
        
        this.currentRoom = door.to;
        this.setupLevel();
    }
    
    checkInteractables() {
        let nearInteractable = null;
        
        this.interactables.forEach(interactable => {
            if (this.isColliding(this.player, interactable)) {
                nearInteractable = interactable;
            }
        });
        
        const prompt = document.getElementById('interactionPrompt');
        if (nearInteractable) {
            document.getElementById('interactionText').textContent = nearInteractable.message;
            prompt.classList.remove('hidden');
        } else {
            prompt.classList.add('hidden');
        }
    }
    
    handleInteraction() {
        const now = Date.now();
        if (now - this.lastInteractionTime < 500) return; // Prevent spam
        this.lastInteractionTime = now;
        
        this.interactables.forEach(interactable => {
            if (this.isColliding(this.player, interactable)) {
                if (interactable.type === 'computer') {
                    this.winGame();
                }
            }
        });
    }
    
    useItem() {
        if (this.inventory.length > 0) {
            const item = this.inventory.shift();
            if (item.type === 'health') {
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
            }
            this.updateInventoryDisplay();
        }
    }
    
    updateInventoryDisplay() {
        const slotsContainer = document.getElementById('inventorySlots');
        slotsContainer.innerHTML = '';
        
        for (let i = 0; i < this.maxInventorySlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            
            if (i < this.inventory.length) {
                slot.classList.add('filled');
                const item = this.inventory[i];
                slot.textContent = item.type === 'key' ? '🗝️' : 
                                   item.type === 'health' ? '❤️' : 
                                   item.type === 'shield' ? '🛡️' : '?';
            }
            
            slotsContainer.appendChild(slot);
        }
    }
    
    updateUI() {
        // Update health bar
        const healthPercentage = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('healthFill').style.width = healthPercentage + '%';
        
        // Update objective based on current room
        let objective = "Reach your computer safely";
        if (this.currentRoom === 'entrance') {
            objective = "Find the key to progress further";
        } else if (this.currentRoom === 'hallway') {
            objective = "Navigate through the dangerous hallway";
        } else if (this.currentRoom === 'computerroom') {
            objective = "Reach your computer and search for Ryan Reynolds OF!";
        }
        document.getElementById('currentObjective').textContent = objective;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    winGame() {
        this.gameState = 'complete';
        document.getElementById('completionText').textContent = 
            "Success! Eli reached his computer and searched for Ryan Reynolds OF!";
        document.getElementById('gameComplete').classList.remove('hidden');
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#f4e4c1';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing') {
            this.renderRoom();
            this.renderPlayer();
        }
    }
    
    renderRoom() {
        const room = this.rooms[this.currentRoom];
        
        // Draw walls
        this.ctx.fillStyle = '#8b4513';
        room.walls.forEach(wall => {
            this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        });
        
        // Draw doors
        this.ctx.fillStyle = '#654321';
        this.doors.forEach(door => {
            this.ctx.fillRect(door.x, door.y, door.width, door.height);
            this.ctx.fillStyle = '#f4e4c1';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('DOOR', door.x + door.width/2, door.y + door.height/2 + 4);
            this.ctx.fillStyle = '#654321';
        });
        
        // Draw hazards
        this.hazards.forEach(hazard => {
            if (hazard.type === 'spikes') {
                this.ctx.fillStyle = '#ff4444';
                this.ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
                // Draw spikes pattern
                this.ctx.fillStyle = '#cc0000';
                for (let i = 0; i < hazard.width; i += 10) {
                    this.ctx.fillRect(hazard.x + i, hazard.y - 5, 5, 10);
                }
            } else if (hazard.type === 'fire') {
                this.ctx.fillStyle = '#ff6600';
                this.ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
                this.ctx.fillStyle = '#ffaa00';
                this.ctx.fillRect(hazard.x + 5, hazard.y + 5, hazard.width - 10, hazard.height - 10);
            } else if (hazard.type === 'laser') {
                this.ctx.fillStyle = '#ff0088';
                this.ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
            } else if (hazard.type === 'electric') {
                this.ctx.fillStyle = '#00ffff';
                this.ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
                // Electric effect
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                for (let i = 0; i < hazard.width; i += 20) {
                    this.ctx.moveTo(hazard.x + i, hazard.y);
                    this.ctx.lineTo(hazard.x + i + 10, hazard.y + hazard.height);
                }
                this.ctx.stroke();
            }
        });
        
        // Draw items
        this.items.forEach(item => {
            if (item.type === 'key') {
                this.ctx.fillStyle = '#ffdd00';
                this.ctx.fillRect(item.x, item.y, 20, 20);
                this.ctx.fillStyle = '#000000';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🗝️', item.x + 10, item.y + 15);
            } else if (item.type === 'health') {
                this.ctx.fillStyle = '#ff4444';
                this.ctx.fillRect(item.x, item.y, 20, 20);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('❤️', item.x + 10, item.y + 15);
            } else if (item.type === 'shield') {
                this.ctx.fillStyle = '#cccccc';
                this.ctx.fillRect(item.x, item.y, 20, 20);
                this.ctx.fillStyle = '#000000';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🛡️', item.x + 10, item.y + 15);
            }
        });
        
        // Draw interactables
        this.interactables.forEach(interactable => {
            if (interactable.type === 'computer') {
                this.ctx.fillStyle = '#333333';
                this.ctx.fillRect(interactable.x, interactable.y, interactable.width, interactable.height);
                this.ctx.fillStyle = '#0066cc';
                this.ctx.fillRect(interactable.x + 10, interactable.y + 5, interactable.width - 20, interactable.height - 10);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('💻', interactable.x + interactable.width/2, interactable.y + interactable.height/2 + 4);
            } else if (interactable.type === 'sign') {
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(interactable.x, interactable.y, interactable.width, interactable.height);
                this.ctx.fillStyle = '#f4e4c1';
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('📋', interactable.x + interactable.width/2, interactable.y + interactable.height/2 + 7);
            }
        });
    }
    
    renderPlayer() {
        // Draw Eli
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw simple face
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 5, 3, 3); // Left eye
        this.ctx.fillRect(this.player.x + 15, this.player.y + 5, 3, 3); // Right eye
        this.ctx.fillRect(this.player.x + 8, this.player.y + 15, 8, 2); // Mouth
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new EliNeilsonGame();
    window.game = game; // Make game accessible globally for debugging
});