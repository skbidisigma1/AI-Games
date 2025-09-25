/**
 * Lost Citadel - Enemy System
 * Diverse enemy types with unique AI behaviors and combat mechanics
 */

// Enemy behavior states
const ENEMY_STATES = {
    IDLE: 'idle',
    PATROL: 'patrol',
    CHASE: 'chase',
    ATTACK: 'attack',
    HURT: 'hurt',
    DEAD: 'dead',
    STUNNED: 'stunned',
    RETURNING: 'returning'
};

// Enemy type configurations
const ENEMY_TYPES = {
    slime: {
        name: "Cave Slime",
        width: 28,
        height: 24,
        health: 40,
        damage: 15,
        speed: 1.5,
        jumpForce: -8,
        color: '#4ade80',
        behavior: 'jumper',
        detectionRange: 120,
        attackRange: 32,
        attackCooldown: 90,
        bouncy: true,
        canFly: false
    },
    
    fly: {
        name: "Crystal Fly",
        width: 20,
        height: 16,
        health: 25,
        damage: 12,
        speed: 2.5,
        color: '#60a5fa',
        behavior: 'flyer',
        detectionRange: 150,
        attackRange: 80,
        attackCooldown: 60,
        canFly: true,
        hoverHeight: 100,
        diveBomb: true
    },
    
    walker: {
        name: "Stone Walker",
        width: 32,
        height: 40,
        health: 80,
        damage: 25,
        speed: 1.2,
        color: '#94a3b8',
        behavior: 'walker',
        detectionRange: 100,
        attackRange: 40,
        attackCooldown: 120,
        armored: true,
        patrolDistance: 200
    },
    
    bat: {
        name: "Shadow Bat",
        width: 24,
        height: 20,
        health: 30,
        damage: 18,
        speed: 3.0,
        color: '#8b5cf6',
        behavior: 'swarm',
        detectionRange: 180,
        attackRange: 24,
        attackCooldown: 45,
        canFly: true,
        swarmBehavior: true,
        echolocation: true
    },
    
    spider: {
        name: "Web Spider",
        width: 26,
        height: 24,
        health: 50,
        damage: 20,
        speed: 2.0,
        color: '#ef4444',
        behavior: 'ambush',
        detectionRange: 80,
        attackRange: 150,
        attackCooldown: 180,
        webAttack: true,
        wallCrawl: true,
        trapSetter: true
    },
    
    worm: {
        name: "Tunnel Worm",
        width: 40,
        height: 32,
        health: 120,
        damage: 30,
        speed: 0.8,
        color: '#d97706',
        behavior: 'burrower',
        detectionRange: 200,
        attackRange: 60,
        attackCooldown: 150,
        underground: true,
        segments: 5
    },
    
    crystal_guard: {
        name: "Crystal Guardian",
        width: 36,
        height: 48,
        health: 100,
        damage: 35,
        speed: 1.0,
        color: '#06b6d4',
        behavior: 'guardian',
        detectionRange: 160,
        attackRange: 100,
        attackCooldown: 200,
        projectileAttack: true,
        shielded: true,
        territorialRange: 300
    },
    
    golem: {
        name: "Ancient Golem",
        width: 48,
        height: 64,
        health: 200,
        damage: 50,
        speed: 0.6,
        color: '#92400e',
        behavior: 'heavy',
        detectionRange: 120,
        attackRange: 80,
        attackCooldown: 240,
        groundPound: true,
        rockThrow: true,
        heavyArmor: true
    },
    
    archer: {
        name: "Skeleton Archer",
        width: 24,
        height: 40,
        health: 60,
        damage: 28,
        speed: 1.8,
        color: '#fbbf24',
        behavior: 'ranged',
        detectionRange: 300,
        attackRange: 250,
        attackCooldown: 90,
        projectileAttack: true,
        keepDistance: true,
        aimPrediction: true
    }
};

// Base Enemy class
class Enemy {
    constructor(config) {
        const typeConfig = ENEMY_TYPES[config.type] || ENEMY_TYPES.slime;
        
        // Position and physics
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.vx = 0;
        this.vy = 0;
        this.width = typeConfig.width;
        this.height = typeConfig.height;
        this.facing = 1;
        
        // Type and properties
        this.type = config.type;
        this.name = typeConfig.name;
        this.color = typeConfig.color;
        this.behavior = typeConfig.behavior;
        
        // Combat stats
        this.health = typeConfig.health;
        this.maxHealth = typeConfig.health;
        this.damage = typeConfig.damage;
        this.speed = typeConfig.speed;
        this.detectionRange = typeConfig.detectionRange;
        this.attackRange = typeConfig.attackRange;
        this.attackCooldown = typeConfig.attackCooldown;
        
        // State management
        this.state = ENEMY_STATES.IDLE;
        this.stateTime = 0;
        this.alertLevel = 0;
        
        // AI behavior
        this.patrolStartX = this.x;
        this.patrolEndX = this.x + (typeConfig.patrolDistance || 100);
        this.patrolDirection = 1;
        
        // Combat
        this.attackTimer = 0;
        this.invincible = false;
        this.invincibilityTime = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        
        // Movement
        this.onGround = false;
        this.canFly = typeConfig.canFly || false;
        this.originalY = this.y;
        
        // Special abilities
        this.setupSpecialAbilities(typeConfig);
        
        // Visual effects
        this.flashTime = 0;
        this.trail = [];
        this.animationTime = 0;
        this.destroyed = false;
        this.spawnAnimation = 30;
        this.spawnScale = 0;
    }
    
    setupSpecialAbilities(typeConfig) {
        this.specialAbilities = {};
        
        if (typeConfig.webAttack) {
            this.specialAbilities.webCooldown = 0;
        }
        
        if (typeConfig.projectileAttack) {
            this.specialAbilities.projectileCooldown = 0;
        }
        
        if (typeConfig.underground) {
            this.specialAbilities.burrowTime = 0;
            this.specialAbilities.isBurrowed = false;
            this.specialAbilities.segments = [];
            for (let i = 0; i < typeConfig.segments; i++) {
                this.specialAbilities.segments.push({
                    x: this.x - i * 8,
                    y: this.y
                });
            }
        }
        
        if (typeConfig.shielded) {
            this.specialAbilities.shieldActive = true;
            this.specialAbilities.shieldHealth = 50;
        }
        
        if (typeConfig.echolocation) {
            this.specialAbilities.echoWaves = [];
            this.specialAbilities.echoCooldown = 0;
        }
    }
    
    update(deltaTime) {
        if (this.destroyed) return;
        
        this.updateTimers(deltaTime);
        
        if (this.spawnAnimation > 0) {
            this.spawnAnimation--;
            this.spawnScale = 1 - (this.spawnAnimation / 30);
            return;
        }
        
        this.updateAI();
        this.updatePhysics();
        this.updateSpecialAbilities();
        this.handleCollisions();
        this.updateVisualEffects();
        
        if (this.health <= 0 && this.state !== ENEMY_STATES.DEAD) {
            this.die();
        }
    }
    
    updateTimers(deltaTime) {
        this.stateTime++;
        if (this.attackTimer > 0) this.attackTimer--;
        if (this.invincibilityTime > 0) {
            this.invincibilityTime--;
            if (this.invincibilityTime === 0) {
                this.invincible = false;
            }
        }
        if (this.flashTime > 0) this.flashTime--;
        
        for (const ability in this.specialAbilities) {
            if (ability.endsWith('Cooldown') && this.specialAbilities[ability] > 0) {
                this.specialAbilities[ability]--;
            }
        }
    }
    
    updateAI() {
        const player = game.player;
        if (!player || player.dead) {
            if (this.state === ENEMY_STATES.CHASE || this.state === ENEMY_STATES.ATTACK) {
                this.setState(ENEMY_STATES.RETURNING);
            }
            return;
        }
        
        const distanceToPlayer = this.getDistanceTo(player);
        const canSeePlayer = this.canSeeTarget(player);
        
        if (canSeePlayer && distanceToPlayer < this.detectionRange) {
            this.alertLevel = Math.min(2, this.alertLevel + 0.02);
        } else {
            this.alertLevel = Math.max(0, this.alertLevel - 0.01);
        }
        
        switch (this.state) {
            case ENEMY_STATES.IDLE:
                if (canSeePlayer && distanceToPlayer < this.detectionRange && this.alertLevel > 1.5) {
                    this.setState(ENEMY_STATES.CHASE);
                } else if (this.stateTime > 120 + Math.random() * 180) {
                    this.setState(ENEMY_STATES.PATROL);
                }
                break;
                
            case ENEMY_STATES.PATROL:
                if (canSeePlayer && distanceToPlayer < this.detectionRange && this.alertLevel > 1.5) {
                    this.setState(ENEMY_STATES.CHASE);
                    return;
                }
                
                const targetX = this.patrolDirection > 0 ? this.patrolEndX : this.patrolStartX;
                const distanceToTarget = Math.abs(this.x - targetX);
                
                if (distanceToTarget < 20) {
                    this.patrolDirection *= -1;
                    this.facing = this.patrolDirection;
                }
                
                this.vx += this.patrolDirection * 0.3;
                this.vx = Math.max(-this.speed * 0.5, Math.min(this.speed * 0.5, this.vx));
                
                if (this.stateTime > 300) {
                    this.setState(ENEMY_STATES.IDLE);
                }
                break;
                
            case ENEMY_STATES.CHASE:
                if (!canSeePlayer) {
                    this.setState(ENEMY_STATES.RETURNING);
                    return;
                }
                
                if (distanceToPlayer < this.attackRange) {
                    this.setState(ENEMY_STATES.ATTACK);
                    return;
                }
                
                const dx = player.x - this.x;
                this.facing = dx > 0 ? 1 : -1;
                
                if (this.canFly) {
                    const dy = player.y - this.y;
                    this.vx += Math.sign(dx) * 0.5;
                    this.vy += Math.sign(dy) * 0.3;
                } else {
                    this.vx += Math.sign(dx) * 0.8;
                }
                
                const maxSpeed = this.speed * 1.2;
                this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));
                if (this.canFly) {
                    this.vy = Math.max(-maxSpeed * 0.8, Math.min(maxSpeed * 0.8, this.vy));
                }
                break;
                
            case ENEMY_STATES.ATTACK:
                if (distanceToPlayer > this.attackRange * 1.5) {
                    this.setState(ENEMY_STATES.CHASE);
                    return;
                }
                
                if (this.attackTimer === 0) {
                    this.performAttack(player);
                    this.attackTimer = this.attackCooldown;
                }
                break;
                
            case ENEMY_STATES.RETURNING:
                const homeX = (this.patrolStartX + this.patrolEndX) / 2;
                const distanceToHome = Math.abs(this.x - homeX);
                
                if (distanceToHome < 20) {
                    this.setState(ENEMY_STATES.IDLE);
                    this.alertLevel = 0;
                } else {
                    const dx = homeX - this.x;
                    this.facing = dx > 0 ? 1 : -1;
                    this.vx += Math.sign(dx) * 0.4;
                    this.vx = Math.max(-this.speed, Math.min(this.speed, this.vx));
                }
                break;
        }
        
        this.updateBehaviorSpecificAI(player, distanceToPlayer, canSeePlayer);
    }
    
    updateBehaviorSpecificAI(player, distance, canSee) {
        switch (this.behavior) {
            case 'flyer':
                const targetY = this.originalY - ENEMY_TYPES[this.type].hoverHeight;
                const dy = targetY - this.y;
                this.vy += dy * 0.02;
                
                if (ENEMY_TYPES[this.type].diveBomb && this.state === ENEMY_STATES.ATTACK && distance < 60) {
                    this.vy += 0.8;
                }
                break;
                
            case 'jumper':
                if (this.state === ENEMY_STATES.CHASE && this.onGround) {
                    const dx = player.x - this.x;
                    this.vy = ENEMY_TYPES[this.type].jumpForce || -8;
                    this.vx += Math.sign(dx) * 2;
                    
                    game.particles.addExplosion(
                        this.x + this.width / 2,
                        this.y + this.height,
                        6,
                        { color: this.color, speed: 3, life: 20 }
                    );
                }
                break;
                
            case 'swarm':
                if (this.specialAbilities.echoCooldown === 0 && distance < 200) {
                    this.echolocate();
                    this.specialAbilities.echoCooldown = 120;
                }
                break;
                
            case 'burrower':
                if (this.state === ENEMY_STATES.CHASE && !this.specialAbilities.isBurrowed && distance > 100) {
                    this.specialAbilities.isBurrowed = true;
                    this.specialAbilities.burrowTime = 180;
                    
                    game.particles.addExplosion(
                        this.x + this.width / 2,
                        this.y + this.height,
                        20,
                        { color: '#92400e', speed: 8, life: 30 }
                    );
                }
                
                if (this.specialAbilities.isBurrowed) {
                    this.specialAbilities.burrowTime--;
                    const dx = player.x - this.x;
                    this.vx += Math.sign(dx) * 0.6;
                    
                    if (distance < 50 || this.specialAbilities.burrowTime <= 0) {
                        this.specialAbilities.isBurrowed = false;
                        this.vy = -12;
                        
                        game.particles.addExplosion(
                            this.x + this.width / 2,
                            this.y + this.height / 2,
                            25,
                            { color: '#92400e', speed: 10, life: 40 }
                        );
                        
                        game.camera.shake(8);
                    }
                }
                break;
                
            case 'guardian':
                if (this.specialAbilities.projectileCooldown === 0 && 
                    distance < 250 && distance > 80 && canSee) {
                    this.fireProjectile(player);
                    this.specialAbilities.projectileCooldown = 180;
                }
                break;
                
            case 'ranged':
                if (distance < 100 && this.state === ENEMY_STATES.CHASE) {
                    const dx = this.x - player.x;
                    this.vx += Math.sign(dx) * 0.5;
                }
                
                if (this.specialAbilities.projectileCooldown === 0 && canSee && distance < 300) {
                    this.fireAimedProjectile(player);
                    this.specialAbilities.projectileCooldown = this.attackCooldown;
                }
                break;
                
            case 'heavy':
                if (this.state === ENEMY_STATES.ATTACK && distance < 60 && this.onGround) {
                    this.groundPound();
                }
                
                if (this.specialAbilities.projectileCooldown === 0 && distance > 80 && distance < 200) {
                    this.throwRock(player);
                    this.specialAbilities.projectileCooldown = 240;
                }
                
                this.vx *= 0.9;
                break;
        }
    }
    
    performAttack(target) {
        const dx = target.x - this.x;
        const distance = Math.sqrt(dx * dx + (target.y - this.y) * (target.y - this.y));
        
        if (distance < this.attackRange) {
            if (target === game.player && !target.invincible) {
                target.takeDamage(this.damage, this.x + this.width / 2, this.y + this.height / 2);
            }
            
            game.audio.playSound('enemy_hit');
            
            game.particles.addExplosion(
                this.x + this.width / 2 + Math.sign(dx) * 20,
                this.y + this.height / 2,
                8,
                { color: this.color, speed: 6, life: 25 }
            );
        }
    }
    
    fireProjectile(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const projectile = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: (dx / distance) * 5,
            vy: (dy / distance) * 5,
            width: 12,
            height: 12,
            life: 150,
            type: 'energy',
            damage: this.damage * 0.7,
            color: this.color
        };
        
        game.addProjectile(projectile);
        
        game.particles.addExplosion(
            this.x + this.width / 2,
            this.y + this.height / 2,
            6,
            { color: this.color, speed: 4, life: 20 }
        );
    }
    
    fireAimedProjectile(target) {
        const playerVx = target.vx || 0;
        const timeToTarget = this.getDistanceTo(target) / 6;
        
        const predictedX = target.x + playerVx * timeToTarget;
        const predictedY = target.y;
        
        const dx = predictedX - this.x;
        const dy = predictedY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const projectile = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: (dx / distance) * 6,
            vy: (dy / distance) * 6,
            width: 10,
            height: 10,
            life: 120,
            type: 'arrow',
            damage: this.damage,
            color: '#fbbf24'
        };
        
        game.addProjectile(projectile);
    }
    
    throwRock(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y - 32;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const projectile = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 4,
            vx: (dx / distance) * 4,
            vy: (dy / distance) * 4 - 2,
            width: 20,
            height: 20,
            life: 180,
            type: 'rock',
            damage: this.damage * 1.5,
            color: '#8b5a2b',
            gravity: 0.3
        };
        
        game.addProjectile(projectile);
        game.camera.shake(4);
    }
    
    groundPound() {
        this.vy = 15;
        this.attackTimer = 60;
        
        setTimeout(() => {
            if (this.onGround) {
                const shockwaveRange = 100;
                if (game.player && this.getDistanceTo(game.player) < shockwaveRange) {
                    game.player.takeDamage(this.damage * 1.2, this.x, this.y);
                }
                
                game.camera.shake(12);
                
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 * i) / 20;
                    game.particles.addParticle(
                        this.x + this.width / 2,
                        this.y + this.height,
                        {
                            vx: Math.cos(angle) * 8,
                            vy: Math.sin(angle) * 4,
                            color: '#8b5a2b',
                            size: 3,
                            life: 40,
                            gravity: 0.2
                        }
                    );
                }
            }
        }, 300);
    }
    
    echolocate() {
        const wave = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            radius: 0,
            maxRadius: 150,
            life: 60
        };
        
        this.specialAbilities.echoWaves.push(wave);
        
        setTimeout(() => {
            if (game.player && this.getDistanceTo(game.player) < 150) {
                this.alertLevel = 2;
            }
        }, 30);
    }
    
    updateSpecialAbilities() {
        if (this.specialAbilities.echoWaves) {
            for (let i = this.specialAbilities.echoWaves.length - 1; i >= 0; i--) {
                const wave = this.specialAbilities.echoWaves[i];
                wave.radius += 5;
                wave.life--;
                
                if (wave.life <= 0 || wave.radius >= wave.maxRadius) {
                    this.specialAbilities.echoWaves.splice(i, 1);
                }
            }
        }
    }
    
    updatePhysics() {
        if (!this.canFly && !this.specialAbilities.isBurrowed) {
            this.vy += CONFIG.GRAVITY;
            this.vy = Math.min(this.vy, CONFIG.MAX_FALL_SPEED);
        }
        
        if (this.onGround) {
            this.vx *= CONFIG.FRICTION;
        } else {
            this.vx *= CONFIG.AIR_FRICTION;
        }
        
        if (this.knockbackX !== 0 || this.knockbackY !== 0) {
            this.vx += this.knockbackX;
            this.vy += this.knockbackY;
            this.knockbackX *= 0.8;
            this.knockbackY *= 0.8;
            
            if (Math.abs(this.knockbackX) < 0.1) this.knockbackX = 0;
            if (Math.abs(this.knockbackY) < 0.1) this.knockbackY = 0;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.canFly) {
            this.y = Math.max(50, Math.min(this.y, 1000));
        }
    }
    
    handleCollisions() {
        if (!game.world) return;
        
        this.onGround = false;
        
        const tiles = game.world.getTilesNearPlayer(this);
        
        for (const tile of tiles) {
            if (game.checkCollision(this, tile) && tile.solid) {
                if (this.vx > 0) {
                    this.x = tile.x - this.width;
                    this.vx = 0;
                } else if (this.vx < 0) {
                    this.x = tile.x + tile.width;
                    this.vx = 0;
                }
            }
        }
        
        for (const tile of tiles) {
            if (game.checkCollision(this, tile) && tile.solid) {
                if (this.vy > 0) {
                    this.y = tile.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                } else if (this.vy < 0) {
                    this.y = tile.y + tile.height;
                    this.vy = 0;
                }
            }
        }
    }
    
    updateVisualEffects() {
        this.animationTime += 0.1;
        
        if (Math.abs(this.vx) > 3 || Math.abs(this.vy) > 3) {
            this.trail.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                alpha: 1
            });
            
            if (this.trail.length > 6) {
                this.trail.shift();
            }
            
            for (let i = 0; i < this.trail.length; i++) {
                this.trail[i].alpha = i / this.trail.length;
            }
        }
    }
    
    takeDamage(amount, sourceX, sourceY) {
        if (this.invincible || this.health <= 0) return;
        
        if (this.specialAbilities.shieldActive && this.specialAbilities.shieldHealth > 0) {
            this.specialAbilities.shieldHealth -= amount;
            if (this.specialAbilities.shieldHealth <= 0) {
                this.specialAbilities.shieldActive = false;
                amount = Math.abs(this.specialAbilities.shieldHealth);
            } else {
                amount = 0;
            }
        }
        
        this.health -= amount;
        this.flashTime = 10;
        this.invincible = true;
        this.invincibilityTime = 30;
        
        const dx = this.x - sourceX;
        const dy = this.y - sourceY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.knockbackX = (dx / distance) * 6;
            this.knockbackY = (dy / distance) * 3 - 2;
        }
        
        if (amount > 0) {
            this.setState(ENEMY_STATES.HURT);
            this.alertLevel = 2;
            
            game.particles.addExplosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                10,
                { color: '#ff6b6b', speed: 6, life: 30 }
            );
        }
        
        game.audio.playSound('enemy_hit');
    }
    
    die() {
        this.state = ENEMY_STATES.DEAD;
        this.vx = 0;
        this.vy = 0;
        
        game.particles.addExplosion(
            this.x + this.width / 2,
            this.y + this.height / 2,
            15,
            { color: this.color, speed: 8, life: 50 }
        );
        
        game.camera.shake(4);
        
        if (game.world) {
            game.world.markEnemyDefeated(this);
        }
        
        setTimeout(() => {
            this.destroyed = true;
        }, 1000);
    }
    
    canSeeTarget(target) {
        if (!target) return false;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.detectionRange) return false;
        
        const steps = Math.floor(distance / 16);
        for (let i = 1; i < steps; i++) {
            const checkX = this.x + (dx / steps) * i;
            const checkY = this.y + (dy / steps) * i;
            
            if (game.world) {
                const tiles = game.world.getTilesNearPlayer({ x: checkX, y: checkY, width: 1, height: 1 });
                for (const tile of tiles) {
                    if (tile.solid && 
                        checkX >= tile.x && checkX <= tile.x + tile.width &&
                        checkY >= tile.y && checkY <= tile.y + tile.height) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    getDistanceTo(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    setState(newState) {
        if (newState !== this.state) {
            this.state = newState;
            this.stateTime = 0;
        }
    }
    
    render(ctx, camera) {
        if (this.destroyed) return;
        
        const screenX = camera.getScreenX(this.x);
        const screenY = camera.getScreenY(this.y);
        
        if (screenX < -this.width || screenX > CONFIG.CANVAS_WIDTH ||
            screenY < -this.height || screenY > CONFIG.CANVAS_HEIGHT) {
            return;
        }
        
        ctx.save();
        
        // Render trail
        for (let i = 0; i < this.trail.length - 1; i++) {
            const current = this.trail[i];
            const next = this.trail[i + 1];
            
            ctx.globalAlpha = current.alpha * 0.3;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(
                camera.getScreenX(current.x),
                camera.getScreenY(current.y)
            );
            ctx.lineTo(
                camera.getScreenX(next.x),
                camera.getScreenY(next.y)
            );
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        
        if (this.flashTime > 0 && Math.floor(this.flashTime / 2) % 2) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }
        
        if (this.specialAbilities.isBurrowed) {
            ctx.globalAlpha = 0.3;
        }
        
        if (this.spawnAnimation > 0) {
            ctx.globalAlpha = this.spawnScale;
            ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
            ctx.scale(this.spawnScale, this.spawnScale);
            ctx.translate(-this.width / 2, -this.height / 2);
            screenX = 0;
            screenY = 0;
        }
        
        if (this.facing < 0) {
            ctx.scale(-1, 1);
            ctx.translate(-screenX - this.width, 0);
            screenX = 0;
        }
        
        ctx.fillRect(screenX, screenY, this.width, this.height);
        
        this.renderTypeSpecific(ctx, screenX, screenY);
        
        if (this.specialAbilities.shieldActive && this.specialAbilities.shieldHealth > 0) {
            ctx.strokeStyle = '#4fc3f7';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            ctx.strokeRect(screenX - 2, screenY - 2, this.width + 4, this.height + 4);
        }
        
        ctx.restore();
        
        this.renderSpecialEffects(ctx, camera);
        
        if (game.debugMode) {
            this.renderDebug(ctx, camera);
        }
    }
    
    renderTypeSpecific(ctx, screenX, screenY) {
        switch (this.type) {
            case 'slime':
                ctx.fillStyle = '#38a169';
                ctx.fillRect(screenX + 4, screenY + 4, this.width - 8, this.height - 8);
                ctx.fillStyle = '#000000';
                ctx.fillRect(screenX + 8, screenY + 8, 4, 4);
                ctx.fillRect(screenX + 16, screenY + 8, 4, 4);
                break;
                
            case 'fly':
                ctx.fillStyle = 'rgba(96, 165, 250, 0.5)';
                const wingFlap = Math.sin(this.animationTime * 2) * 4;
                ctx.fillRect(screenX - 4, screenY + 4 + wingFlap, 8, 4);
                ctx.fillRect(screenX + this.width - 4, screenY + 4 - wingFlap, 8, 4);
                break;
                
            case 'spider':
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                for (let i = 0; i < 4; i++) {
                    const legY = screenY + 8 + i * 4;
                    ctx.beginPath();
                    ctx.moveTo(screenX, legY);
                    ctx.lineTo(screenX - 8, legY + 4);
                    ctx.moveTo(screenX + this.width, legY);
                    ctx.lineTo(screenX + this.width + 8, legY + 4);
                    ctx.stroke();
                }
                break;
                
            case 'bat':
                ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
                const wingSpan = 8 + Math.sin(this.animationTime * 3) * 4;
                ctx.fillRect(screenX - wingSpan, screenY + 2, wingSpan, 8);
                ctx.fillRect(screenX + this.width, screenY + 2, wingSpan, 8);
                break;
                
            case 'golem':
                ctx.fillStyle = '#a16207';
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 4; j++) {
                        if ((i + j) % 2) {
                            ctx.fillRect(screenX + i * 16, screenY + j * 16, 16, 16);
                        }
                    }
                }
                break;
                
            case 'archer':
                ctx.strokeStyle = '#8b4513';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenX + this.width + 5, screenY + this.height / 2, 12, -Math.PI/3, Math.PI/3);
                ctx.stroke();
                break;
        }
    }
    
    renderSpecialEffects(ctx, camera) {
        if (this.specialAbilities.echoWaves) {
            for (const wave of this.specialAbilities.echoWaves) {
                ctx.save();
                ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(
                    camera.getScreenX(wave.x),
                    camera.getScreenY(wave.y),
                    wave.radius,
                    0, Math.PI * 2
                );
                ctx.stroke();
                ctx.restore();
            }
        }
        
        if (this.specialAbilities.segments) {
            for (const segment of this.specialAbilities.segments) {
                const segScreenX = camera.getScreenX(segment.x);
                const segScreenY = camera.getScreenY(segment.y);
                
                ctx.fillStyle = '#b45309';
                ctx.fillRect(segScreenX, segScreenY, 16, 16);
            }
        }
    }
    
    renderDebug(ctx, camera) {
        ctx.save();
        
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            camera.getScreenX(this.x),
            camera.getScreenY(this.y),
            this.width,
            this.height
        );
        
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(
            camera.getScreenX(this.x + this.width / 2),
            camera.getScreenY(this.y + this.height / 2),
            this.detectionRange,
            0, Math.PI * 2
        );
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(
            `${this.state} (${this.health}/${this.maxHealth})`,
            camera.getScreenX(this.x),
            camera.getScreenY(this.y) - 5
        );
        
        ctx.restore();
    }
}

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Enemy, ENEMY_TYPES, ENEMY_STATES };
}
