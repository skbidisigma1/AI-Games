/**
 * Lost Citadel - World System
 * World map, rooms, tiles, and interconnected areas
 */

// Tile types and their properties
const TILE_TYPES = {
    EMPTY: { solid: false, color: null, type: 'empty' },
    SOLID: { solid: true, color: '#4a5568', type: 'solid' },
    PLATFORM: { solid: true, color: '#68d391', type: 'platform', oneWay: true },
    SPIKE: { solid: false, color: '#f56565', type: 'spike', damage: 20 },
    WATER: { solid: false, color: '#4299e1', type: 'water' },
    LAVA: { solid: false, color: '#ff6b35', type: 'lava', damage: 30 },
    BOUNCY: { solid: true, color: '#9f7aea', type: 'bouncy' },
    CONVEYOR_LEFT: { solid: true, color: '#ed8936', type: 'conveyor_left' },
    CONVEYOR_RIGHT: { solid: true, color: '#ed8936', type: 'conveyor_right' },
    CRUMBLE: { solid: true, color: '#a0aec0', type: 'crumble' },
    BREAKABLE: { solid: true, color: '#e53e3e', type: 'breakable' },
    DOOR: { solid: true, color: '#38b2ac', type: 'door' },
    SWITCH: { solid: false, color: '#f687b3', type: 'switch' },
    CHECKPOINT: { solid: false, color: '#fbd38d', type: 'checkpoint' }
};

// Room connections and layout
const ROOM_DATA = {
    hub: {
        name: "Central Hub",
        width: 40,
        height: 23,
        spawnX: 100,
        spawnY: 500,
        backgroundColor: '#1a202c',
        music: 'hub',
        connections: {
            upper_caves: { x: 20, y: 5, direction: 'up', requirement: null },
            lower_tunnels: { x: 35, y: 18, direction: 'down', requirement: null },
            crystal_chamber: { x: 5, y: 12, direction: 'left', requirement: 'dash' },
            ancient_ruins: { x: 35, y: 8, direction: 'right', requirement: 'wall_jump' }
        },
        layout: [
            // Define room layout as 2D array - simplified for space
            // Each number corresponds to TILE_TYPES
        ],
        enemies: [
            { type: 'slime', x: 300, y: 400 },
            { type: 'fly', x: 600, y: 200 },
            { type: 'walker', x: 800, y: 450 }
        ],
        collectibles: [
            { type: 'health', x: 200, y: 300, amount: 25 },
            { type: 'energy', x: 500, y: 350, amount: 30 }
        ],
        secrets: [
            { x: 15, y: 20, width: 3, height: 2, reward: 'health_upgrade' }
        ]
    },
    
    upper_caves: {
        name: "Upper Caves",
        width: 30,
        height: 20,
        spawnX: 200,
        spawnY: 400,
        backgroundColor: '#2d3748',
        music: 'caves',
        connections: {
            hub: { x: 15, y: 18, direction: 'down', requirement: null },
            wall_jump_chamber: { x: 25, y: 8, direction: 'right', requirement: null },
            boss_lair: { x: 15, y: 2, direction: 'up', requirement: 'wall_jump' }
        },
        enemies: [
            { type: 'bat', x: 200, y: 100 },
            { type: 'bat', x: 400, y: 150 },
            { type: 'spider', x: 600, y: 350 }
        ],
        collectibles: [
            { type: 'ability', x: 450, y: 200, ability: 'wall_jump' }
        ]
    },
    
    lower_tunnels: {
        name: "Lower Tunnels",
        width: 35,
        height: 25,
        spawnX: 150,
        spawnY: 100,
        backgroundColor: '#1a1a2e',
        music: 'tunnels',
        connections: {
            hub: { x: 8, y: 2, direction: 'up', requirement: null },
            water_caverns: { x: 30, y: 12, direction: 'right', requirement: null },
            dash_shrine: { x: 5, y: 20, direction: 'down', requirement: 'double_jump' }
        },
        enemies: [
            { type: 'worm', x: 300, y: 600 },
            { type: 'crystal_guard', x: 700, y: 400 },
            { type: 'slime', x: 500, y: 500 }
        ],
        hazards: [
            { type: 'spike_pit', x: 400, y: 550, width: 160, height: 32 }
        ]
    },
    
    crystal_chamber: {
        name: "Crystal Chamber",
        width: 25,
        height: 18,
        spawnX: 700,
        spawnY: 300,
        backgroundColor: '#2b6cb0',
        music: 'crystal',
        connections: {
            hub: { x: 23, y: 10, direction: 'right', requirement: null }
        },
        enemies: [
            { type: 'crystal_guardian', x: 400, y: 200 }
        ],
        collectibles: [
            { type: 'ability', x: 200, y: 150, ability: 'dash' }
        ],
        boss: { type: 'crystal_lord', x: 400, y: 300 }
    },
    
    ancient_ruins: {
        name: "Ancient Ruins",
        width: 40,
        height: 30,
        spawnX: 100,
        spawnY: 800,
        backgroundColor: '#744210',
        music: 'ruins',
        connections: {
            hub: { x: 2, y: 15, direction: 'left', requirement: null },
            final_chamber: { x: 35, y: 5, direction: 'right', requirement: 'all_abilities' }
        },
        enemies: [
            { type: 'golem', x: 600, y: 400 },
            { type: 'archer', x: 300, y: 200 },
            { type: 'archer', x: 800, y: 600 }
        ],
        collectibles: [
            { type: 'ability', x: 500, y: 100, ability: 'double_jump' }
        ]
    },
    
    final_chamber: {
        name: "The Heart of the Citadel",
        width: 30,
        height: 20,
        spawnX: 100,
        spawnY: 500,
        backgroundColor: '#4a1a4a',
        music: 'final_boss',
        connections: {
            ancient_ruins: { x: 2, y: 10, direction: 'left', requirement: null }
        },
        boss: { type: 'citadel_lord', x: 600, y: 300 },
        isFinalRoom: true
    }
};

class World {
    constructor() {
        this.currentRoom = null;
        this.rooms = new Map();
        this.tiles = [];
        this.backgrounds = [];
        this.parallaxLayers = [];
        this.unlockedRooms = ['hub'];
        this.collectedItems = [];
        this.defeatedEnemies = [];
        this.defeatedBosses = [];
        this.activatedSwitches = [];
        this.checkpoints = [];
        this.lastCheckpoint = null;
        this.secretsFound = 0;
        this.roomTransitionActive = false;
        
        // Environmental effects
        this.windEffect = { x: 0, y: 0 };
        this.ambientParticles = [];
        this.weatherEffect = null; // 'rain', 'snow', 'dust', etc.
        
        // Dynamic elements
        this.crumbleBlocks = [];
        this.movingPlatforms = [];
        this.switches = [];
        this.doors = [];
        
        this.initializeRooms();
        this.generateRoomLayouts();
    }
    
    initializeRooms() {
        for (const [roomId, roomData] of Object.entries(ROOM_DATA)) {
            this.rooms.set(roomId, {
                ...roomData,
                visited: false,
                enemies: [...roomData.enemies || []],
                collectibles: [...roomData.collectibles || []],
                layout: this.generateRoomLayout(roomData)
            });
        }
    }
    
    generateRoomLayouts() {
        // Generate procedural elements for each room
        for (const [roomId, room] of this.rooms) {
            this.generateRoomDetails(room, roomId);
        }
    }
    
    generateRoomLayout(roomData) {
        const layout = [];
        
        // Initialize empty layout
        for (let y = 0; y < roomData.height; y++) {
            layout[y] = [];
            for (let x = 0; x < roomData.width; x++) {
                layout[y][x] = 0; // Empty by default
            }
        }
        
        // Generate room-specific layouts
        switch (roomData.name) {
            case "Central Hub":
                this.generateHubLayout(layout, roomData);
                break;
            case "Upper Caves":
                this.generateCaveLayout(layout, roomData);
                break;
            case "Lower Tunnels":
                this.generateTunnelLayout(layout, roomData);
                break;
            case "Crystal Chamber":
                this.generateCrystalLayout(layout, roomData);
                break;
            case "Ancient Ruins":
                this.generateRuinsLayout(layout, roomData);
                break;
            case "The Heart of the Citadel":
                this.generateFinalLayout(layout, roomData);
                break;
            default:
                this.generateGenericLayout(layout, roomData);
        }
        
        return layout;
    }
    
    generateHubLayout(layout, roomData) {
        const w = roomData.width;
        const h = roomData.height;
        
        // Floor
        for (let x = 0; x < w; x++) {
            layout[h - 1][x] = 1; // Solid
            layout[h - 2][x] = x % 8 === 0 ? 2 : 0; // Occasional platforms
        }
        
        // Walls
        for (let y = 0; y < h; y++) {
            layout[y][0] = 1;
            layout[y][w - 1] = 1;
        }
        
        // Central platforms
        for (let x = 15; x <= 25; x++) {
            layout[15][x] = 1;
            layout[10][x] = x % 3 === 0 ? 2 : 0;
        }
        
        // Upper area platforms
        for (let x = 8; x <= 12; x++) {
            layout[8][x] = 2; // Platform
        }
        
        // Connection areas
        layout[5][20] = 12; // Checkpoint
        layout[18][35] = 12; // Checkpoint
        
        // Decorative elements
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * (w - 2)) + 1;
            const y = Math.floor(Math.random() * (h - 5)) + 1;
            if (layout[y][x] === 0) {
                layout[y][x] = Math.random() < 0.3 ? 10 : 0; // Switches
            }
        }
    }
    
    generateCaveLayout(layout, roomData) {
        const w = roomData.width;
        const h = roomData.height;
        
        // Create cave-like structure
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                // Perlin-noise like generation
                const noise = Math.sin(x * 0.1) * Math.cos(y * 0.15) + Math.random() * 0.3;
                if (noise > 0.3) {
                    layout[y][x] = 1; // Solid rock
                } else if (noise > 0.1 && y > h - 3) {
                    layout[y][x] = 1; // Floor
                }
            }
        }
        
        // Ensure path through cave
        for (let x = 1; x < w - 1; x++) {
            layout[h - 2][x] = 0; // Clear path
            layout[h - 1][x] = 1; // Floor
        }
        
        // Add stalactites and stalagmites
        for (let i = 0; i < 8; i++) {
            const x = Math.floor(Math.random() * (w - 2)) + 1;
            if (layout[1][x] === 1) {
                layout[2][x] = 3; // Spike pointing down
            }
            if (layout[h - 2][x] === 1) {
                layout[h - 3][x] = 3; // Spike pointing up
            }
        }
    }
    
    generateTunnelLayout(layout, roomData) {
        const w = roomData.width;
        const h = roomData.height;
        
        // Create winding tunnel system
        let currentY = Math.floor(h / 2);
        for (let x = 0; x < w; x++) {
            // Tunnel height variation
            const tunnelHeight = 4 + Math.floor(Math.sin(x * 0.2) * 2);
            
            for (let y = currentY - Math.floor(tunnelHeight / 2); y < currentY + Math.floor(tunnelHeight / 2); y++) {
                if (y >= 0 && y < h) {
                    layout[y][x] = 0; // Clear tunnel
                }
            }
            
            // Floor and ceiling
            const floorY = currentY + Math.floor(tunnelHeight / 2);
            const ceilY = currentY - Math.floor(tunnelHeight / 2) - 1;
            
            if (floorY < h) layout[floorY][x] = 1;
            if (ceilY >= 0) layout[ceilY][x] = 1;
            
            // Gradual height change
            if (Math.random() < 0.1) {
                currentY += Math.random() < 0.5 ? -1 : 1;
                currentY = Math.max(3, Math.min(h - 4, currentY));
            }
        }
        
        // Add water pools
        for (let i = 0; i < 3; i++) {
            const x = Math.floor(Math.random() * w);
            const y = h - 3;
            for (let dx = 0; dx < 5; dx++) {
                if (x + dx < w) {
                    layout[y][x + dx] = 4; // Water
                }
            }
        }
    }
    
    generateCrystalLayout(layout, roomData) {
        const w = roomData.width;
        const h = roomData.height;
        
        // Crystalline chamber with geometric platforms
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                // Walls
                if (x === 0 || x === w - 1 || y === h - 1) {
                    layout[y][x] = 1;
                }
                
                // Crystalline platforms in geometric patterns
                if ((x + y) % 6 === 0 && x > 3 && x < w - 3 && y > 3 && y < h - 3) {
                    layout[y][x] = 2; // Platform
                }
                
                // Central crystal formation
                const centerX = Math.floor(w / 2);
                const centerY = Math.floor(h / 2);
                const dist = Math.abs(x - centerX) + Math.abs(y - centerY);
                
                if (dist === 3 || dist === 5) {
                    layout[y][x] = 1; // Crystal structures
                }
            }
        }
        
        // Add bouncy crystal platforms
        layout[10][8] = 6; // Bouncy
        layout[10][16] = 6; // Bouncy
        layout[6][12] = 6; // Bouncy
    }
    
    generateRuinsLayout(layout, roomData) {
        const w = roomData.width;
        const h = roomData.height;
        
        // Ancient ruins with crumbling architecture
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                // Floor
                if (y === h - 1) {
                    layout[y][x] = 1;
                }
                
                // Ruined walls and structures
                if (x % 8 === 0 && y > h - 15) {
                    layout[y][x] = Math.random() < 0.7 ? 1 : 9; // Solid or crumbly
                }
                
                // Platforms at various heights
                if (y === h - 5 && x % 12 > 2 && x % 12 < 8) {
                    layout[y][x] = Math.random() < 0.8 ? 2 : 9; // Platform or crumbly
                }
                
                if (y === h - 10 && x % 15 > 3 && x % 15 < 9) {
                    layout[y][x] = 2;
                }
                
                // Ancient mechanisms
                if (x % 20 === 10 && y === h - 2) {
                    layout[y][x] = 10; // Switch
                }
            }
        }
        
        // Add conveyor belts (ancient mechanisms still working)
        for (let x = 12; x < 18; x++) {
            layout[h - 8][x] = 7; // Conveyor right
        }
        
        for (let x = 25; x < 31; x++) {
            layout[h - 12][x] = 8; // Conveyor left
        }
    }
    
    generateFinalLayout(layout, roomData) {
        const w = roomData.width;
        const h = roomData.height;
        
        // Grand final chamber
        const centerX = Math.floor(w / 2);
        const centerY = Math.floor(h / 2);
        
        // Circular arena
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                // Outer walls
                if (dist > 12) {
                    layout[y][x] = 1;
                }
                
                // Inner platforms for boss fight
                if (dist > 6 && dist < 8 && (x + y) % 4 === 0) {
                    layout[y][x] = 2;
                }
                
                // Floor
                if (y === h - 1 && dist <= 12) {
                    layout[y][x] = 1;
                }
            }
        }
        
        // Boss platform
        for (let x = centerX - 2; x <= centerX + 2; x++) {
            for (let y = centerY - 1; y <= centerY + 1; y++) {
                layout[y][x] = 1;
            }
        }
    }
    
    generateGenericLayout(layout, roomData) {
        const w = roomData.width;
        const h = roomData.height;
        
        // Basic room with floor, ceiling, and walls
        for (let x = 0; x < w; x++) {
            layout[0][x] = 1; // Ceiling
            layout[h - 1][x] = 1; // Floor
        }
        
        for (let y = 0; y < h; y++) {
            layout[y][0] = 1; // Left wall
            layout[y][w - 1] = 1; // Right wall
        }
        
        // Add some platforms
        for (let i = 0; i < Math.floor(w / 8); i++) {
            const x = 4 + i * 8;
            const y = h - 5 - (i % 3) * 3;
            for (let dx = 0; dx < 4; dx++) {
                if (x + dx < w - 1) {
                    layout[y][x + dx] = 2; // Platform
                }
            }
        }
    }
    
    generateRoomDetails(room, roomId) {
        // Add environmental particles based on room type
        room.ambientParticles = [];
        
        switch (room.name) {
            case "Upper Caves":
                room.weatherEffect = 'drip';
                break;
            case "Crystal Chamber":
                room.weatherEffect = 'sparkle';
                break;
            case "Lower Tunnels":
                room.weatherEffect = 'dust';
                break;
            case "Ancient Ruins":
                room.weatherEffect = 'leaves';
                break;
        }
        
        // Generate moving platforms
        if (roomId === 'crystal_chamber') {
            room.movingPlatforms = [
                {
                    x: 200, y: 300, width: 80, height: 16,
                    startX: 200, endX: 400, speed: 1, direction: 1
                },
                {
                    x: 600, y: 200, width: 80, height: 16,
                    startY: 200, endY: 350, speed: 0.8, direction: 1, vertical: true
                }
            ];
        }
        
        // Generate switch-door pairs
        if (room.layout) {
            for (let y = 0; y < room.height; y++) {
                for (let x = 0; x < room.width; x++) {
                    if (room.layout[y][x] === 10) { // Switch
                        // Find nearby door to link
                        for (let dy = -5; dy <= 5; dy++) {
                            for (let dx = -5; dx <= 5; dx++) {
                                const ny = y + dy;
                                const nx = x + dx;
                                if (ny >= 0 && ny < room.height && nx >= 0 && nx < room.width) {
                                    if (room.layout[ny][nx] === 11) { // Door
                                        // Link switch to door
                                        if (!room.switchDoorPairs) room.switchDoorPairs = [];
                                        room.switchDoorPairs.push({
                                            switchX: x, switchY: y,
                                            doorX: nx, doorY: ny,
                                            activated: false
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    loadRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            console.error(`Room ${roomId} not found`);
            return;
        }
        
        const room = this.rooms.get(roomId);
        this.currentRoom = roomId;
        room.visited = true;
        
        // Convert layout to tiles
        this.tiles = [];
        for (let y = 0; y < room.height; y++) {
            for (let x = 0; x < room.width; x++) {
                const tileType = room.layout[y][x];
                if (tileType > 0) {
                    const tileData = this.getTileData(tileType);
                    this.tiles.push({
                        x: x * CONFIG.TILE_SIZE,
                        y: y * CONFIG.TILE_SIZE,
                        width: CONFIG.TILE_SIZE,
                        height: CONFIG.TILE_SIZE,
                        ...tileData
                    });
                }
            }
        }
        
        // Spawn enemies (only if not defeated)
        game.enemies = [];
        for (const enemyData of room.enemies) {
            const enemyKey = `${roomId}_${enemyData.type}_${enemyData.x}_${enemyData.y}`;
            if (!this.defeatedEnemies.includes(enemyKey)) {
                const enemy = this.createEnemy(enemyData);
                if (enemy) {
                    game.addEnemy(enemy);
                }
            }
        }
        
        // Spawn boss (only if not defeated)
        game.bosses = [];
        if (room.boss) {
            const bossKey = `${roomId}_${room.boss.type}`;
            if (!this.defeatedBosses.includes(bossKey)) {
                const boss = this.createBoss(room.boss);
                if (boss) {
                    game.addBoss(boss);
                }
            }
        }
        
        // Place collectibles (only if not collected)
        for (const collectible of room.collectibles) {
            const itemKey = `${roomId}_${collectible.type}_${collectible.x}_${collectible.y}`;
            if (!this.collectedItems.includes(itemKey)) {
                // Collectibles are handled by the room's collectibles array
            }
        }
        
        // Set camera bounds
        game.camera.setBounds(
            0, 0,
            room.width * CONFIG.TILE_SIZE,
            room.height * CONFIG.TILE_SIZE
        );
        
        // Generate background
        this.generateRoomBackground(room);
        
        // Start ambient effects
        this.startRoomAmbience(room);
        
        console.log(`Loaded room: ${room.name}`);
    }
    
    getTileData(tileType) {
        const types = Object.values(TILE_TYPES);
        return types[tileType] || TILE_TYPES.EMPTY;
    }
    
    createEnemy(enemyData) {
        if (!window.Enemy) return null;
        
        return new Enemy({
            type: enemyData.type,
            x: enemyData.x,
            y: enemyData.y,
            ...enemyData
        });
    }
    
    createBoss(bossData) {
        if (!window.Boss) return null;
        
        return new Boss({
            type: bossData.type,
            x: bossData.x,
            y: bossData.y,
            ...bossData
        });
    }
    
    generateRoomBackground(room) {
        this.backgrounds = [];
        this.parallaxLayers = [];
        
        // Generate parallax background layers
        for (let layer = 0; layer < CONFIG.RENDER.PARALLAX_LAYERS; layer++) {
            const parallaxLayer = {
                elements: [],
                scrollSpeed: 0.1 + (layer * 0.2),
                depth: layer + 1
            };
            
            // Add background elements based on room type
            switch (room.name) {
                case "Upper Caves":
                    this.addCaveBackground(parallaxLayer, room);
                    break;
                case "Crystal Chamber":
                    this.addCrystalBackground(parallaxLayer, room);
                    break;
                case "Ancient Ruins":
                    this.addRuinsBackground(parallaxLayer, room);
                    break;
                default:
                    this.addGenericBackground(parallaxLayer, room);
            }
            
            this.parallaxLayers.push(parallaxLayer);
        }
    }
    
    addCaveBackground(layer, room) {
        const count = Math.floor(20 / layer.depth);
        for (let i = 0; i < count; i++) {
            layer.elements.push({
                x: Math.random() * room.width * CONFIG.TILE_SIZE,
                y: Math.random() * room.height * CONFIG.TILE_SIZE,
                width: 20 + Math.random() * 40,
                height: 20 + Math.random() * 40,
                color: `hsl(210, 20%, ${15 + layer.depth * 5}%)`,
                type: 'rock'
            });
        }
    }
    
    addCrystalBackground(layer, room) {
        const count = Math.floor(15 / layer.depth);
        for (let i = 0; i < count; i++) {
            layer.elements.push({
                x: Math.random() * room.width * CONFIG.TILE_SIZE,
                y: Math.random() * room.height * CONFIG.TILE_SIZE,
                width: 15 + Math.random() * 25,
                height: 30 + Math.random() * 50,
                color: `hsl(200, 80%, ${40 + layer.depth * 10}%)`,
                type: 'crystal',
                glow: true
            });
        }
    }
    
    addRuinsBackground(layer, room) {
        const count = Math.floor(10 / layer.depth);
        for (let i = 0; i < count; i++) {
            layer.elements.push({
                x: Math.random() * room.width * CONFIG.TILE_SIZE,
                y: Math.random() * room.height * CONFIG.TILE_SIZE * 0.7,
                width: 30 + Math.random() * 60,
                height: 80 + Math.random() * 100,
                color: `hsl(30, 40%, ${20 + layer.depth * 8}%)`,
                type: 'pillar'
            });
        }
    }
    
    addGenericBackground(layer, room) {
        const count = Math.floor(8 / layer.depth);
        for (let i = 0; i < count; i++) {
            layer.elements.push({
                x: Math.random() * room.width * CONFIG.TILE_SIZE,
                y: Math.random() * room.height * CONFIG.TILE_SIZE,
                width: 10 + Math.random() * 20,
                height: 10 + Math.random() * 20,
                color: `hsl(220, 30%, ${10 + layer.depth * 5}%)`,
                type: 'generic'
            });
        }
    }
    
    startRoomAmbience(room) {
        // Clear previous ambient particles
        this.ambientParticles = [];
        
        // Start room-specific ambient effects
        switch (room.weatherEffect) {
            case 'drip':
                this.startDripEffect(room);
                break;
            case 'sparkle':
                this.startSparkleEffect(room);
                break;
            case 'dust':
                this.startDustEffect(room);
                break;
            case 'leaves':
                this.startLeavesEffect(room);
                break;
        }
    }
    
    startDripEffect(room) {
        // Water drips from ceiling
        setInterval(() => {
            if (this.currentRoom === room && Math.random() < 0.3) {
                game.particles.addParticle(
                    Math.random() * room.width * CONFIG.TILE_SIZE,
                    0,
                    {
                        vx: 0,
                        vy: 2 + Math.random() * 2,
                        color: '#4299e1',
                        size: 2,
                        life: 100,
                        gravity: 0.1
                    }
                );
            }
        }, 1000);
    }
    
    startSparkleEffect(room) {
        // Crystal sparkles
        setInterval(() => {
            if (this.currentRoom === room && Math.random() < 0.5) {
                game.particles.addParticle(
                    Math.random() * room.width * CONFIG.TILE_SIZE,
                    Math.random() * room.height * CONFIG.TILE_SIZE,
                    {
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        color: '#81d4fa',
                        size: 1,
                        life: 80,
                        gravity: 0,
                        friction: 0.99
                    }
                );
            }
        }, 500);
    }
    
    startDustEffect(room) {
        // Floating dust particles
        setInterval(() => {
            if (this.currentRoom === room && Math.random() < 0.4) {
                game.particles.addParticle(
                    Math.random() * room.width * CONFIG.TILE_SIZE,
                    Math.random() * room.height * CONFIG.TILE_SIZE,
                    {
                        vx: (Math.random() - 0.5) * 1,
                        vy: (Math.random() - 0.5) * 1,
                        color: '#8d6e63',
                        size: 1,
                        life: 120,
                        gravity: 0.01,
                        friction: 0.995
                    }
                );
            }
        }, 800);
    }
    
    startLeavesEffect(room) {
        // Falling leaves
        setInterval(() => {
            if (this.currentRoom === room && Math.random() < 0.2) {
                game.particles.addParticle(
                    Math.random() * room.width * CONFIG.TILE_SIZE,
                    0,
                    {
                        vx: (Math.random() - 0.5) * 2,
                        vy: 1 + Math.random() * 2,
                        color: '#8bc34a',
                        size: 3,
                        life: 200,
                        gravity: 0.02,
                        friction: 0.99
                    }
                );
            }
        }, 2000);
    }
    
    update(deltaTime) {
        if (!this.currentRoom) return;
        
        const room = this.rooms.get(this.currentRoom);
        
        // Update moving platforms
        if (room.movingPlatforms) {
            for (const platform of room.movingPlatforms) {
                if (platform.vertical) {
                    platform.y += platform.speed * platform.direction;
                    if (platform.y <= platform.startY || platform.y >= platform.endY) {
                        platform.direction *= -1;
                    }
                } else {
                    platform.x += platform.speed * platform.direction;
                    if (platform.x <= platform.startX || platform.x >= platform.endX) {
                        platform.direction *= -1;
                    }
                }
            }
        }
        
        // Update crumble blocks
        for (let i = this.crumbleBlocks.length - 1; i >= 0; i--) {
            const block = this.crumbleBlocks[i];
            block.timer--;
            
            if (block.timer <= 0) {
                // Remove block from tiles
                const tileIndex = this.tiles.findIndex(tile => 
                    tile.x === block.x && tile.y === block.y
                );
                if (tileIndex !== -1) {
                    this.tiles.splice(tileIndex, 1);
                }
                
                // Remove from crumble blocks
                this.crumbleBlocks.splice(i, 1);
                
                // Add crumble particles
                game.particles.addExplosion(
                    block.x + block.width / 2,
                    block.y + block.height / 2,
                    15,
                    {
                        color: '#a0aec0',
                        speed: 6,
                        life: 40,
                        gravity: 0.3
                    }
                );
            }
        }
        
        // Check room transitions
        this.checkRoomTransitions();
        
        // Update switches
        this.updateSwitches();
    }
    
    checkRoomTransitions() {
        if (!game.player || this.roomTransitionActive) return;
        
        const room = this.rooms.get(this.currentRoom);
        const player = game.player;
        
        for (const [targetRoom, connection] of Object.entries(room.connections)) {
            const transitionX = connection.x * CONFIG.TILE_SIZE;
            const transitionY = connection.y * CONFIG.TILE_SIZE;
            const transitionSize = CONFIG.TILE_SIZE * 2;
            
            // Check if player is near transition
            if (Math.abs(player.x - transitionX) < transitionSize &&
                Math.abs(player.y - transitionY) < transitionSize) {
                
                // Check if player has required ability
                if (this.canAccessRoom(connection.requirement)) {
                    this.initiateRoomTransition(targetRoom, connection);
                } else {
                    // Show requirement message
                    if (game.ui) {
                        game.ui.showMessage(`Requires: ${connection.requirement}`);
                    }
                }
            }
        }
    }
    
    canAccessRoom(requirement) {
        if (!requirement) return true;
        
        if (requirement === 'all_abilities') {
            return game.player.abilities.wallJump && 
                   game.player.abilities.dash && 
                   game.player.abilities.doubleJump;
        }
        
        return game.player.abilities[requirement] || false;
    }
    
    initiateRoomTransition(targetRoom, connection) {
        this.roomTransitionActive = true;
        
        // Fade out effect
        if (game.ui) {
            game.ui.startTransition();
        }
        
        setTimeout(() => {
            // Load new room
            this.loadRoom(targetRoom);
            
            // Position player at entrance
            const newRoom = this.rooms.get(targetRoom);
            game.player.x = newRoom.spawnX;
            game.player.y = newRoom.spawnY;
            
            // Reset player state
            game.player.vx = 0;
            game.player.vy = 0;
            
            // Add room to unlocked list
            if (!this.unlockedRooms.includes(targetRoom)) {
                this.unlockedRooms.push(targetRoom);
            }
            
            setTimeout(() => {
                this.roomTransitionActive = false;
                if (game.ui) {
                    game.ui.endTransition();
                }
            }, 500);
        }, 500);
    }
    
    updateSwitches() {
        const room = this.rooms.get(this.currentRoom);
        if (!room.switchDoorPairs) return;
        
        for (const pair of room.switchDoorPairs) {
            const switchTile = this.tiles.find(tile => 
                tile.x === pair.switchX * CONFIG.TILE_SIZE && 
                tile.y === pair.switchY * CONFIG.TILE_SIZE
            );
            
            if (switchTile && game.player) {
                // Check if player is on switch
                if (game.checkCollision(game.player, switchTile) && !pair.activated) {
                    pair.activated = true;
                    
                    // Remove door tile
                    const doorIndex = this.tiles.findIndex(tile =>
                        tile.x === pair.doorX * CONFIG.TILE_SIZE &&
                        tile.y === pair.doorY * CONFIG.TILE_SIZE
                    );
                    
                    if (doorIndex !== -1) {
                        this.tiles.splice(doorIndex, 1);
                        
                        game.audio.playSound('collect');
                        game.particles.addExplosion(
                            pair.doorX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                            pair.doorY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                            10,
                            { color: '#38b2ac', speed: 5, life: 30 }
                        );
                    }
                }
            }
        }
    }
    
    getTilesNearPlayer(player) {
        const nearbyTiles = [];
        const margin = CONFIG.TILE_SIZE * 2;
        
        for (const tile of this.tiles) {
            if (tile.x < player.x + player.width + margin &&
                tile.x + tile.width > player.x - margin &&
                tile.y < player.y + player.height + margin &&
                tile.y + tile.height > player.y - margin) {
                nearbyTiles.push(tile);
            }
        }
        
        return nearbyTiles;
    }
    
    getHazardsNearPlayer(player) {
        return this.tiles.filter(tile => 
            tile.type === 'spike' || tile.type === 'lava'
        ).filter(tile =>
            Math.abs(tile.x - player.x) < CONFIG.TILE_SIZE * 3 &&
            Math.abs(tile.y - player.y) < CONFIG.TILE_SIZE * 3
        );
    }
    
    getCollectiblesNearPlayer(player) {
        if (!this.currentRoom) return [];
        
        const room = this.rooms.get(this.currentRoom);
        return room.collectibles.filter(item => {
            const itemKey = `${this.currentRoom}_${item.type}_${item.x}_${item.y}`;
            return !this.collectedItems.includes(itemKey);
        });
    }
    
    removeCollectible(item) {
        const itemKey = `${this.currentRoom}_${item.type}_${item.x}_${item.y}`;
        if (!this.collectedItems.includes(itemKey)) {
            this.collectedItems.push(itemKey);
        }
        
        const room = this.rooms.get(this.currentRoom);
        const index = room.collectibles.indexOf(item);
        if (index !== -1) {
            room.collectibles.splice(index, 1);
        }
    }
    
    addKey(keyType) {
        // Implementation for key collection
        console.log(`Collected key: ${keyType}`);
    }
    
    markEnemyDefeated(enemy) {
        const enemyKey = `${this.currentRoom}_${enemy.type}_${enemy.x}_${enemy.y}`;
        if (!this.defeatedEnemies.includes(enemyKey)) {
            this.defeatedEnemies.push(enemyKey);
        }
    }
    
    markBossDefeated(boss) {
        const bossKey = `${this.currentRoom}_${boss.type}`;
        if (!this.defeatedBosses.includes(bossKey)) {
            this.defeatedBosses.push(bossKey);
        }
    }
    
    renderBackground(ctx, camera) {
        const room = this.rooms.get(this.currentRoom);
        if (!room) return;
        
        // Render background color
        ctx.fillStyle = room.backgroundColor;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // Render parallax layers
        for (const layer of this.parallaxLayers) {
            ctx.save();
            
            const offsetX = camera.x * layer.scrollSpeed;
            const offsetY = camera.y * layer.scrollSpeed * 0.5;
            
            for (const element of layer.elements) {
                const screenX = element.x - offsetX;
                const screenY = element.y - offsetY;
                
                // Only render if on screen
                if (screenX > -element.width && screenX < CONFIG.CANVAS_WIDTH &&
                    screenY > -element.height && screenY < CONFIG.CANVAS_HEIGHT) {
                    
                    if (element.glow) {
                        ctx.shadowColor = element.color;
                        ctx.shadowBlur = 10;
                    }
                    
                    ctx.fillStyle = element.color;
                    
                    switch (element.type) {
                        case 'crystal':
                            // Draw crystal shape
                            ctx.beginPath();
                            ctx.moveTo(screenX + element.width / 2, screenY);
                            ctx.lineTo(screenX + element.width, screenY + element.height * 0.3);
                            ctx.lineTo(screenX + element.width * 0.8, screenY + element.height);
                            ctx.lineTo(screenX + element.width * 0.2, screenY + element.height);
                            ctx.lineTo(screenX, screenY + element.height * 0.3);
                            ctx.closePath();
                            ctx.fill();
                            break;
                            
                        case 'pillar':
                            // Draw pillar
                            ctx.fillRect(screenX, screenY, element.width, element.height);
                            // Add some detail
                            ctx.fillStyle = `hsl(30, 40%, ${30 + layer.depth * 8}%)`;
                            ctx.fillRect(screenX + 5, screenY + 10, element.width - 10, 5);
                            ctx.fillRect(screenX + 5, screenY + element.height - 15, element.width - 10, 5);
                            break;
                            
                        default:
                            ctx.fillRect(screenX, screenY, element.width, element.height);
                    }
                    
                    ctx.shadowBlur = 0;
                }
            }
            
            ctx.restore();
        }
    }
    
    render(ctx, camera) {
        // Render tiles
        for (const tile of this.tiles) {
            const screenX = camera.getScreenX(tile.x);
            const screenY = camera.getScreenY(tile.y);
            
            // Only render tiles that are visible
            if (screenX > -tile.width && screenX < CONFIG.CANVAS_WIDTH &&
                screenY > -tile.height && screenY < CONFIG.CANVAS_HEIGHT) {
                
                ctx.fillStyle = tile.color;
                ctx.fillRect(screenX, screenY, tile.width, tile.height);
                
                // Add tile-specific details
                this.renderTileDetails(ctx, tile, screenX, screenY);
            }
        }
        
        // Render collectibles
        this.renderCollectibles(ctx, camera);
        
        // Render moving platforms
        this.renderMovingPlatforms(ctx, camera);
    }
    
    renderTileDetails(ctx, tile, screenX, screenY) {
        switch (tile.type) {
            case 'spike':
                // Draw spike points
                ctx.fillStyle = '#ff4757';
                ctx.beginPath();
                for (let i = 0; i < tile.width; i += 8) {
                    ctx.moveTo(screenX + i, screenY + tile.height);
                    ctx.lineTo(screenX + i + 4, screenY);
                    ctx.lineTo(screenX + i + 8, screenY + tile.height);
                }
                ctx.fill();
                break;
                
            case 'bouncy':
                // Draw bouncy surface indicator
                ctx.fillStyle = '#b19cd9';
                ctx.fillRect(screenX + 2, screenY, tile.width - 4, 4);
                break;
                
            case 'conveyor_left':
            case 'conveyor_right':
                // Draw conveyor belt arrows
                ctx.fillStyle = '#ffa502';
                const direction = tile.type === 'conveyor_right' ? 1 : -1;
                for (let i = 0; i < tile.width; i += 12) {
                    const arrowX = screenX + i + 6;
                    const arrowY = screenY + 4;
                    ctx.beginPath();
                    ctx.moveTo(arrowX, arrowY);
                    ctx.lineTo(arrowX + 4 * direction, arrowY - 2);
                    ctx.lineTo(arrowX + 4 * direction, arrowY + 2);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
                
            case 'crumble':
                // Draw cracks
                ctx.strokeStyle = '#2d3436';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(screenX + 4, screenY + 4);
                ctx.lineTo(screenX + tile.width - 4, screenY + tile.height - 4);
                ctx.moveTo(screenX + tile.width - 4, screenY + 4);
                ctx.lineTo(screenX + 4, screenY + tile.height - 4);
                ctx.stroke();
                break;
                
            case 'switch':
                // Draw switch button
                ctx.fillStyle = '#e17055';
                ctx.fillRect(screenX + 8, screenY + 8, 16, 16);
                break;
                
            case 'checkpoint':
                // Draw checkpoint crystal
                ctx.fillStyle = '#fdcb6e';
                ctx.beginPath();
                ctx.arc(screenX + tile.width / 2, screenY + tile.height / 2, 12, 0, Math.PI * 2);
                ctx.fill();
                // Add glow effect
                ctx.shadowColor = '#fdcb6e';
                ctx.shadowBlur = 20;
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
        }
    }
    
    renderCollectibles(ctx, camera) {
        const room = this.rooms.get(this.currentRoom);
        if (!room) return;
        
        for (const item of room.collectibles) {
            const itemKey = `${this.currentRoom}_${item.type}_${item.x}_${item.y}`;
            if (this.collectedItems.includes(itemKey)) continue;
            
            const screenX = camera.getScreenX(item.x);
            const screenY = camera.getScreenY(item.y);
            
            // Only render if on screen
            if (screenX > -50 && screenX < CONFIG.CANVAS_WIDTH + 50 &&
                screenY > -50 && screenY < CONFIG.CANVAS_HEIGHT + 50) {
                
                // Floating animation
                const time = Date.now() * 0.003;
                const bobY = Math.sin(time + item.x * 0.01) * 3;
                
                // Glow effect
                ctx.shadowColor = item.color || '#4fc3f7';
                ctx.shadowBlur = 15;
                
                ctx.fillStyle = item.color || '#4fc3f7';
                
                switch (item.type) {
                    case 'health':
                        ctx.fillStyle = '#81c784';
                        ctx.shadowColor = '#81c784';
                        ctx.beginPath();
                        ctx.arc(screenX + 16, screenY + 16 + bobY, 8, 0, Math.PI * 2);
                        ctx.fill();
                        // Draw cross
                        ctx.fillRect(screenX + 14, screenY + 10 + bobY, 4, 12);
                        ctx.fillRect(screenX + 10, screenY + 14 + bobY, 12, 4);
                        break;
                        
                    case 'energy':
                        ctx.fillStyle = '#4fc3f7';
                        ctx.shadowColor = '#4fc3f7';
                        ctx.beginPath();
                        ctx.arc(screenX + 16, screenY + 16 + bobY, 10, 0, Math.PI * 2);
                        ctx.fill();
                        // Draw lightning
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.moveTo(screenX + 12, screenY + 8 + bobY);
                        ctx.lineTo(screenX + 16, screenY + 12 + bobY);
                        ctx.lineTo(screenX + 14, screenY + 16 + bobY);
                        ctx.lineTo(screenX + 20, screenY + 24 + bobY);
                        ctx.lineTo(screenX + 16, screenY + 20 + bobY);
                        ctx.lineTo(screenX + 18, screenY + 16 + bobY);
                        ctx.closePath();
                        ctx.fill();
                        break;
                        
                    case 'ability':
                        ctx.fillStyle = '#ff6b6b';
                        ctx.shadowColor = '#ff6b6b';
                        // Draw diamond
                        ctx.beginPath();
                        ctx.moveTo(screenX + 16, screenY + 4 + bobY);
                        ctx.lineTo(screenX + 28, screenY + 16 + bobY);
                        ctx.lineTo(screenX + 16, screenY + 28 + bobY);
                        ctx.lineTo(screenX + 4, screenY + 16 + bobY);
                        ctx.closePath();
                        ctx.fill();
                        break;
                }
                
                ctx.shadowBlur = 0;
            }
        }
    }
    
    renderMovingPlatforms(ctx, camera) {
        const room = this.rooms.get(this.currentRoom);
        if (!room || !room.movingPlatforms) return;
        
        for (const platform of room.movingPlatforms) {
            const screenX = camera.getScreenX(platform.x);
            const screenY = camera.getScreenY(platform.y);
            
            ctx.fillStyle = '#68d391';
            ctx.fillRect(screenX, screenY, platform.width, platform.height);
            
            // Add platform indicator
            ctx.fillStyle = '#48bb78';
            ctx.fillRect(screenX + 2, screenY, platform.width - 4, 2);
        }
    }
    
    renderForeground(ctx, camera) {
        // Render any foreground elements like weather effects
        this.renderWeatherEffects(ctx, camera);
    }
    
    renderWeatherEffects(ctx, camera) {
        const room = this.rooms.get(this.currentRoom);
        if (!room || !room.weatherEffect) return;
        
        // Weather effects are handled by particles system
        // This is for any static overlay effects
        
        switch (room.weatherEffect) {
            case 'fog':
                ctx.save();
                ctx.fillStyle = 'rgba(200, 200, 200, 0.1)';
                ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
                ctx.restore();
                break;
        }
    }
}

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { World, TILE_TYPES, ROOM_DATA };
}