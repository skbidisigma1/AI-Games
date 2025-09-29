/**
 * Lost Citadel - Player System
 * Player character, movement, combat, and abilities
 */

// Player animation states
const PLAYER_ANIMATIONS = {
    IDLE: 'idle',
    WALK: 'walk',
    RUN: 'run',
    JUMP: 'jump',
    FALL: 'fall',
    WALL_SLIDE: 'wallSlide',
    DASH: 'dash',
    ATTACK: 'attack',
    DUCK: 'duck',
    HURT: 'hurt',
    DEAD: 'dead'
};

// Player constants
const PLAYER_CONFIG = {
    // Movement
    MOVE_SPEED: 6,
    RUN_SPEED: 9,
    JUMP_FORCE: -16,
    WALL_JUMP_FORCE_X: 12,
    WALL_JUMP_FORCE_Y: -14,
    DOUBLE_JUMP_FORCE: -13,
    DASH_FORCE: 20,
    DASH_DURATION: 12,
    DASH_COOLDOWN: 30,
    WALL_SLIDE_SPEED: 2,
    
    // Physics
    GRAVITY: 0.8,
    MAX_FALL_SPEED: 18,
    FRICTION: 0.85,
    AIR_FRICTION: 0.98,
    WALL_FRICTION: 0.7,
    
    // Combat
    ATTACK_DAMAGE: 25,
    ATTACK_RANGE: 40,
    ATTACK_DURATION: 20,
    ATTACK_COOLDOWN: 15,
    COMBO_WINDOW: 40,
    MAX_COMBO: 3,
    
    // Status
    MAX_HEALTH: 100,
    MAX_ENERGY: 100,
    ENERGY_REGEN: 0.5,
    INVINCIBILITY_TIME: 90,
    HITSTUN_TIME: 20,
    
    // Coyote time and jump buffering
    COYOTE_TIME: 8,
    JUMP_BUFFER_TIME: 10,
    
    // Visual
    WIDTH: 24,
    HEIGHT: 32,
    SPRITE_OFFSET_X: 4,
    SPRITE_OFFSET_Y: 0
};

class Player {
    constructor(x, y) {
        // Position and physics
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = PLAYER_CONFIG.WIDTH;
        this.height = PLAYER_CONFIG.HEIGHT;
        
        // Movement state
        this.onGround = false;
        this.onWall = false;
        this.wallDirection = 0; // -1 for left wall, 1 for right wall
        this.facing = 1; // -1 for left, 1 for right
        this.wasOnGround = false;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        
        // Abilities
        this.abilities = {
            wallJump: false,
            dash: false,
            doubleJump: false
        };
        this.hasDoubleJump = false;
        this.dashCooldown = 0;
        this.dashDirection = { x: 0, y: 0 };
        this.isDashing = false;
        this.dashTime = 0;
        
        // Combat
        this.health = PLAYER_CONFIG.MAX_HEALTH;
        this.maxHealth = PLAYER_CONFIG.MAX_HEALTH;
        this.energy = PLAYER_CONFIG.MAX_ENERGY;
        this.maxEnergy = PLAYER_CONFIG.MAX_ENERGY;
        this.attacking = false;
        this.attackTime = 0;
        this.attackCooldown = 0;
        this.combo = 0;
        this.comboTime = 0;
        this.attackHitbox = { x: 0, y: 0, width: 0, height: 0 };
        
        // Status effects
        this.invincible = false;
        this.invincibilityTime = 0;
        this.stunned = false;
        this.stunTime = 0;
        this.dead = false;
        
        // Animation
        this.currentAnimation = PLAYER_ANIMATIONS.IDLE;
        this.animationFrame = 0;
        this.animationTime = 0;
        this.animationSpeed = 0.16;
        this.flipX = false;
        
        // Visual effects
        this.trail = [];
        this.maxTrailLength = 8;
        this.afterimages = [];
        this.color = {
            primary: '#4fc3f7',
            secondary: '#81c784',
            accent: '#ff6b6b'
        };
        
        // Stats
        this.deaths = 0;
        this.enemiesDefeated = 0;
        this.damageDealt = 0;
        this.distanceTraveled = 0;
        
        // Initialize
        this.updateHitbox();
    }
    
    update(deltaTime) {
        if (this.dead) return;
        
        const input = window.game?.input;
        if (!input) return; // No input manager available
        
        // Update timers
        this.updateTimers(deltaTime);
        
        // Handle input
        this.handleInput(input);
        
        // Update physics
        this.updatePhysics();
        
        // Handle collisions
        this.handleCollisions();
        
        // Update combat
        this.updateCombat();
        
        // Update abilities
        this.updateAbilities();
        
        // Update animation
        this.updateAnimation();
        
        // Update visual effects
        this.updateVisualEffects();
        
        // Update hitbox
        this.updateHitbox();
        
        // Clamp position to prevent falling through world
        this.clampPosition();
        
        // Track distance traveled
        this.distanceTraveled += Math.abs(this.vx) + Math.abs(this.vy);
    }
    
    updateTimers(deltaTime) {
        // Movement timers
        if (this.coyoteTime > 0) this.coyoteTime--;
        if (this.jumpBuffer > 0) this.jumpBuffer--;
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.dashTime > 0) this.dashTime--;
        
        // Combat timers
        if (this.attackTime > 0) this.attackTime--;
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.comboTime > 0) this.comboTime--;
        
        // Status effect timers
        if (this.invincibilityTime > 0) {
            this.invincibilityTime--;
            if (this.invincibilityTime === 0) {
                this.invincible = false;
            }
        }
        
        if (this.stunTime > 0) {
            this.stunTime--;
            if (this.stunTime === 0) {
                this.stunned = false;
            }
        }
        
        // Energy regeneration
        if (this.energy < this.maxEnergy && !this.isDashing && !this.attacking) {
            this.energy = Math.min(this.maxEnergy, this.energy + PLAYER_CONFIG.ENERGY_REGEN);
        }
    }
    
    handleInput(input) {
        if (this.stunned) return;
        
        // Horizontal movement
        let moveInput = 0;
        if (input.isHeld('left')) moveInput -= 1;
        if (input.isHeld('right')) moveInput += 1;
        
        // Set facing direction
        if (moveInput !== 0) {
            this.facing = moveInput;
            this.flipX = moveInput < 0;
        }
        
        // Jump input
        if (input.isPressed('jump')) {
            this.jumpBuffer = PLAYER_CONFIG.JUMP_BUFFER_TIME;
        }
        
        // Attack input
        if (input.isPressed('attack') || input.isPressed('attack2')) {
            this.tryAttack();
        }
        
        // Special ability input
        if (input.isPressed('special')) {
            this.trySpecialAbility();
        }
        
        // Duck input
        const ducking = input.isHeld('down');
        
        // Handle movement
        if (!this.isDashing) {
            this.handleMovement(moveInput, ducking);
        }
        
        // Handle jumping
        this.handleJumping();
        
        // Handle dashing
        if (this.abilities.dash && input.isPressed('special') && this.dashCooldown === 0 && this.energy >= 20) {
            this.tryDash(moveInput, ducking, input.isHeld('up'));
        }
    }
    
    handleMovement(moveInput, ducking) {
        if (ducking && this.onGround) {
            // Ducking - reduce movement and change hitbox
            this.vx *= 0.5;
            this.height = PLAYER_CONFIG.HEIGHT * 0.6;
            this.currentAnimation = PLAYER_ANIMATIONS.DUCK;
        } else {
            this.height = PLAYER_CONFIG.HEIGHT;
            
            if (moveInput !== 0) {
                // Apply movement force
                const speed = input.isHeld('run') ? PLAYER_CONFIG.RUN_SPEED : PLAYER_CONFIG.MOVE_SPEED;
                const acceleration = this.onGround ? 1.2 : 0.8; // Air control
                
                this.vx += moveInput * acceleration;
                this.vx = Math.max(-speed, Math.min(speed, this.vx));
                
                // Set animation
                if (this.onGround) {
                    this.currentAnimation = speed > PLAYER_CONFIG.MOVE_SPEED ? 
                        PLAYER_ANIMATIONS.RUN : PLAYER_ANIMATIONS.WALK;
                }
            } else if (this.onGround) {
                this.currentAnimation = PLAYER_ANIMATIONS.IDLE;
            }
        }
    }
    
    handleJumping() {
        if (this.jumpBuffer > 0) {
            let jumped = false;
            
            // Ground jump or coyote time jump
            if (this.onGround || this.coyoteTime > 0) {
                this.vy = PLAYER_CONFIG.JUMP_FORCE;
                this.onGround = false;
                this.coyoteTime = 0;
                this.hasDoubleJump = true;
                jumped = true;
                window.game?.audio.playSound('jump');
                
                // Jump particles
                window.game?.particles.addExplosion(
                    this.x + this.width / 2,
                    this.y + this.height,
                    6,
                    { color: this.color.secondary, speed: 3, life: 20 }
                );
            }
            // Wall jump
            else if (this.abilities.wallJump && this.onWall && this.wallDirection !== 0) {
                this.vy = PLAYER_CONFIG.WALL_JUMP_FORCE_Y;
                this.vx = -this.wallDirection * PLAYER_CONFIG.WALL_JUMP_FORCE_X;
                this.onWall = false;
                this.wallDirection = 0;
                this.hasDoubleJump = true;
                jumped = true;
                window.game?.audio.playSound('jump');
                
                // Wall jump particles
                window.game?.particles.addExplosion(
                    this.x + (this.wallDirection > 0 ? 0 : this.width),
                    this.y + this.height / 2,
                    8,
                    { color: this.color.primary, speed: 4, life: 25 }
                );
            }
            // Double jump
            else if (this.abilities.doubleJump && this.hasDoubleJump && !this.onGround) {
                this.vy = PLAYER_CONFIG.DOUBLE_JUMP_FORCE;
                this.hasDoubleJump = false;
                jumped = true;
                window.game?.audio.playSound('jump', 1.2);
                
                // Double jump particles
                window.game?.particles.addExplosion(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    10,
                    { color: this.color.accent, speed: 5, life: 30, type: 'spark' }
                );
            }
            
            if (jumped) {
                this.jumpBuffer = 0;
                this.currentAnimation = PLAYER_ANIMATIONS.JUMP;
            }
        }
    }
    
    tryDash(moveX, moveY, upPressed) {
        // Determine dash direction
        let dashX = moveX;
        let dashY = 0;
        
        if (upPressed) dashY = -1;
        else if (moveY) dashY = 1;
        
        // Default to facing direction if no input
        if (dashX === 0 && dashY === 0) {
            dashX = this.facing;
        }
        
        // Normalize direction
        const magnitude = Math.sqrt(dashX * dashX + dashY * dashY);
        if (magnitude > 0) {
            dashX /= magnitude;
            dashY /= magnitude;
        }
        
        // Execute dash
        this.isDashing = true;
        this.dashTime = PLAYER_CONFIG.DASH_DURATION;
        this.dashCooldown = PLAYER_CONFIG.DASH_COOLDOWN;
        this.dashDirection.x = dashX;
        this.dashDirection.y = dashY;
        this.energy -= 20;
        this.invincible = true;
        this.invincibilityTime = PLAYER_CONFIG.DASH_DURATION;
        
        this.currentAnimation = PLAYER_ANIMATIONS.DASH;
        window.game?.audio.playSound('dash');
        window.game?.camera.shake(3);
        
        // Dash particles
        for (let i = 0; i < 15; i++) {
            window.game?.particles.addParticle(
                this.x + this.width / 2,
                this.y + this.height / 2,
                {
                    vx: -dashX * 10 + (Math.random() - 0.5) * 4,
                    vy: -dashY * 10 + (Math.random() - 0.5) * 4,
                    color: this.color.primary,
                    size: Math.random() * 3 + 1,
                    life: 25,
                    gravity: 0,
                    friction: 0.9
                }
            );
        }
    }
    
    tryAttack() {
        if (this.attackCooldown > 0 || this.isDashing) return;
        
        // Reset combo if window expired
        if (this.comboTime === 0) {
            this.combo = 0;
        }
        
        this.attacking = true;
        this.attackTime = PLAYER_CONFIG.ATTACK_DURATION;
        this.attackCooldown = PLAYER_CONFIG.ATTACK_COOLDOWN;
        this.combo = Math.min(this.combo + 1, PLAYER_CONFIG.MAX_COMBO);
        this.comboTime = PLAYER_CONFIG.COMBO_WINDOW;
        
        this.currentAnimation = PLAYER_ANIMATIONS.ATTACK;
        window.game?.audio.playSound('attack');
        
        // Create attack particles
        const attackX = this.x + (this.facing > 0 ? this.width : 0);
        const attackY = this.y + this.height / 2;
        
        window.game?.particles.addExplosion(
            attackX,
            attackY,
            8,
            {
                color: this.color.accent,
                speed: 6,
                life: 15,
                gravity: 0,
                friction: 0.92
            }
        );
        
        // Screen shake based on combo
        window.game?.camera.shake(2 + this.combo);
    }
    
    trySpecialAbility() {
        // Implementation depends on unlocked abilities
        // This could cycle through available special moves
        if (this.abilities.dash && this.dashCooldown === 0) {
            // Dash is handled in input
        }
    }
    
    updatePhysics() {
        // Store previous ground state
        this.wasOnGround = this.onGround;
        
        // Apply gravity
        if (!this.isDashing) {
            this.vy += PLAYER_CONFIG.GRAVITY;
            this.vy = Math.min(this.vy, PLAYER_CONFIG.MAX_FALL_SPEED);
        }
        
        // Apply dash movement
        if (this.isDashing && this.dashTime > 0) {
            this.vx = this.dashDirection.x * PLAYER_CONFIG.DASH_FORCE;
            this.vy = this.dashDirection.y * PLAYER_CONFIG.DASH_FORCE;
        } else {
            this.isDashing = false;
            
            // Apply friction
            if (this.onGround) {
                this.vx *= PLAYER_CONFIG.FRICTION;
            } else {
                this.vx *= PLAYER_CONFIG.AIR_FRICTION;
            }
        }
        
        // Wall sliding
        if (this.abilities.wallJump && this.onWall && !this.onGround && this.vy > 0) {
            this.vy = Math.min(this.vy, PLAYER_CONFIG.WALL_SLIDE_SPEED);
            this.currentAnimation = PLAYER_ANIMATIONS.WALL_SLIDE;
            
            // Wall slide particles
            if (Math.random() < 0.3) {
                window.game?.particles.addParticle(
                    this.x + (this.wallDirection > 0 ? 0 : this.width),
                    this.y + Math.random() * this.height,
                    {
                        vx: -this.wallDirection * 2,
                        vy: Math.random() * 2,
                        color: '#cccccc',
                        size: 1,
                        life: 20,
                        gravity: 0.1
                    }
                );
            }
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Update coyote time
        if (this.wasOnGround && !this.onGround) {
            this.coyoteTime = PLAYER_CONFIG.COYOTE_TIME;
        }
        
        // Set air animations
        if (!this.onGround && !this.onWall && !this.isDashing && !this.attacking) {
            this.currentAnimation = this.vy < 0 ? PLAYER_ANIMATIONS.JUMP : PLAYER_ANIMATIONS.FALL;
        }
    }
    
    handleCollisions() {
        if (!window.game?.world) return;
        
        // Reset collision flags
        this.onGround = false;
        this.onWall = false;
        this.wallDirection = 0;
        
        const tiles = window.game?.world.getTilesNearPlayer(this);
        
        // Horizontal collision
        for (const tile of tiles) {
            if (window.game?.checkCollision(this, tile) && tile.solid) {
                if (this.vx > 0) { // Moving right
                    this.x = tile.x - this.width;
                    this.vx = 0;
                    this.onWall = true;
                    this.wallDirection = 1;
                } else if (this.vx < 0) { // Moving left
                    this.x = tile.x + tile.width;
                    this.vx = 0;
                    this.onWall = true;
                    this.wallDirection = -1;
                }
            }
        }
        
        // Vertical collision
        for (const tile of tiles) {
            if (window.game?.checkCollision(this, tile) && tile.solid) {
                if (this.vy > 0) { // Falling
                    this.y = tile.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                    this.hasDoubleJump = true;
                    
                    // Landing sound and particles
                    if (!this.wasOnGround) {
                        window.game?.audio.playSound('land');
                        window.game?.particles.addExplosion(
                            this.x + this.width / 2,
                            this.y + this.height,
                            4,
                            { color: '#888888', speed: 2, life: 15 }
                        );
                    }
                } else if (this.vy < 0) { // Jumping up
                    this.y = tile.y + tile.height;
                    this.vy = 0;
                }
            }
        }
        
        // Handle special tile types
        for (const tile of tiles) {
            if (window.game?.checkCollision(this, tile)) {
                this.handleSpecialTile(tile);
            }
        }
        
        // Check for hazards and damage zones
        this.checkHazards();
        
        // Check for items and collectibles
        this.checkCollectibles();
    }
    
    handleSpecialTile(tile) {
        switch (tile.type) {
            case 'spike':
                if (!this.invincible) {
                    this.takeDamage(20, tile.x + tile.width / 2, tile.y + tile.height / 2);
                }
                break;
                
            case 'water':
                // Slow movement in water
                this.vx *= 0.7;
                this.vy *= 0.8;
                
                // Water particles
                if (Math.random() < 0.1) {
                    window.game?.particles.addParticle(
                        this.x + Math.random() * this.width,
                        this.y + Math.random() * this.height,
                        {
                            vx: (Math.random() - 0.5) * 2,
                            vy: -Math.random() * 2,
                            color: '#4fc3f7',
                            size: 2,
                            life: 30,
                            gravity: 0.05
                        }
                    );
                }
                break;
                
            case 'conveyor_left':
                this.vx -= 2;
                break;
                
            case 'conveyor_right':
                this.vx += 2;
                break;
                
            case 'bouncy':
                if (this.vy > 0) {
                    this.vy = -Math.abs(this.vy) * 1.5;
                    window.game?.audio.playSound('jump', 0.7);
                    window.game?.particles.addExplosion(
                        this.x + this.width / 2,
                        this.y + this.height,
                        8,
                        { color: '#81c784', speed: 4, life: 20 }
                    );
                }
                break;
        }
    }
    
    checkHazards() {
        if (!window.game?.world || this.invincible) return;
        
        const hazards = window.game?.world.getHazardsNearPlayer(this);
        for (const hazard of hazards) {
            if (window.game?.checkCollision(this, hazard)) {
                this.takeDamage(hazard.damage || 10, hazard.x + hazard.width / 2, hazard.y + hazard.height / 2);
                break; // Only take damage from one hazard per frame
            }
        }
    }
    
    checkCollectibles() {
        if (!window.game?.world) return;
        
        const collectibles = window.game?.world.getCollectiblesNearPlayer(this);
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const item = collectibles[i];
            if (window.game?.checkCollision(this, item)) {
                this.collectItem(item);
                window.game?.world.removeCollectible(item);
            }
        }
    }
    
    collectItem(item) {
        switch (item.type) {
            case 'health':
                this.heal(item.amount || 25);
                window.game?.audio.playSound('collect');
                break;
                
            case 'energy':
                this.restoreEnergy(item.amount || 30);
                window.game?.audio.playSound('collect');
                break;
                
            case 'ability':
                this.unlockAbility(item.ability);
                window.game?.audio.playSound('unlock');
                if (window.game?.ui) {
                    window.game?.ui.showAbilityUnlock(item.ability);
                }
                break;
                
            case 'key':
                if (window.game?.world) {
                    window.game?.world.addKey(item.keyType);
                }
                window.game?.audio.playSound('collect');
                break;
        }
        
        // Collect particles
        window.game?.particles.addExplosion(
            item.x + item.width / 2,
            item.y + item.height / 2,
            12,
            {
                color: item.color || this.color.secondary,
                speed: 6,
                life: 30,
                gravity: 0
            }
        );
    }
    
    updateCombat() {
        // Update attack hitbox
        if (this.attacking && this.attackTime > PLAYER_CONFIG.ATTACK_DURATION * 0.3) {
            const range = PLAYER_CONFIG.ATTACK_RANGE;
            this.attackHitbox = {
                x: this.x + (this.facing > 0 ? this.width : -range),
                y: this.y + this.height / 4,
                width: range,
                height: this.height / 2
            };
            
            // Check for enemy hits
            this.checkAttackHits();
        } else {
            this.attackHitbox = { x: 0, y: 0, width: 0, height: 0 };
        }
        
        // End attack
        if (this.attacking && this.attackTime === 0) {
            this.attacking = false;
        }
    }
    
    checkAttackHits() {
        // Check enemies
        for (const enemy of window.game?.enemies) {
            if (window.game?.checkCollision(this.attackHitbox, enemy) && !enemy.invincible) {
                const damage = PLAYER_CONFIG.ATTACK_DAMAGE * this.combo;
                const criticalHit = Math.random() < CONFIG.COMBAT.CRITICAL_HIT_CHANCE;
                
                if (criticalHit) {
                    damage *= 1.5;
                }
                
                enemy.takeDamage(damage, this.x + this.width / 2, this.y + this.height / 2);
                this.damageDealt += damage;
                
                if (enemy.health <= 0) {
                    this.enemiesDefeated++;
                }
                
                // Knockback
                const knockbackX = this.facing * CONFIG.COMBAT.KNOCKBACK_STRENGTH;
                enemy.applyKnockback(knockbackX, -2);
                
                window.game?.audio.playSound('hit');
                window.game?.camera.shake(4 + (criticalHit ? 3 : 0));
                
                // Hit particles
                window.game?.particles.addExplosion(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    criticalHit ? 15 : 10,
                    {
                        color: criticalHit ? '#ffff00' : this.color.accent,
                        speed: criticalHit ? 8 : 6,
                        life: criticalHit ? 35 : 25
                    }
                );
                
                break; // Only hit one enemy per attack
            }
        }
        
        // Check bosses
        for (const boss of window.game?.bosses) {
            if (window.game?.checkCollision(this.attackHitbox, boss) && !boss.invincible) {
                const damage = PLAYER_CONFIG.ATTACK_DAMAGE * this.combo;
                boss.takeDamage(damage, this.x + this.width / 2, this.y + this.height / 2);
                this.damageDealt += damage;
                
                window.game?.audio.playSound('boss_hit');
                window.game?.camera.shake(6);
                
                break;
            }
        }
    }
    
    updateAbilities() {
        // Update ability cooldowns and effects
        if (this.isDashing) {
            // Add dash afterimages
            this.afterimages.push({
                x: this.x,
                y: this.y,
                alpha: 0.8,
                life: 10
            });
            
            // Limit afterimage count
            if (this.afterimages.length > 5) {
                this.afterimages.shift();
            }
        }
        
        // Update afterimages
        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            const afterimage = this.afterimages[i];
            afterimage.life--;
            afterimage.alpha = afterimage.life / 10;
            
            if (afterimage.life <= 0) {
                this.afterimages.splice(i, 1);
            }
        }
    }
    
    updateAnimation() {
        this.animationTime += this.animationSpeed;
        
        // Update animation frame based on current animation
        switch (this.currentAnimation) {
            case PLAYER_ANIMATIONS.IDLE:
                this.animationFrame = Math.floor(this.animationTime * 2) % 4;
                break;
                
            case PLAYER_ANIMATIONS.WALK:
                this.animationFrame = Math.floor(this.animationTime * 8) % 6;
                break;
                
            case PLAYER_ANIMATIONS.RUN:
                this.animationFrame = Math.floor(this.animationTime * 12) % 8;
                break;
                
            case PLAYER_ANIMATIONS.JUMP:
            case PLAYER_ANIMATIONS.FALL:
                this.animationFrame = Math.floor(this.animationTime * 4) % 2;
                break;
                
            case PLAYER_ANIMATIONS.ATTACK:
                this.animationFrame = Math.floor((1 - this.attackTime / PLAYER_CONFIG.ATTACK_DURATION) * 4);
                break;
                
            default:
                this.animationFrame = 0;
        }
    }
    
    updateVisualEffects() {
        // Update trail
        this.trail.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            alpha: 1
        });
        
        // Limit trail length
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Fade trail
        for (let i = 0; i < this.trail.length; i++) {
            this.trail[i].alpha = i / this.trail.length;
        }
        
        // Add movement particles when running
        if (this.currentAnimation === PLAYER_ANIMATIONS.RUN && this.onGround && Math.random() < 0.3) {
            window.game?.particles.addParticle(
                this.x + Math.random() * this.width,
                this.y + this.height,
                {
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 2,
                    color: '#888888',
                    size: 1,
                    life: 15,
                    gravity: 0.1
                }
            );
        }
    }
    
    updateHitbox() {
        // Update hitbox based on current state
        if (this.currentAnimation === PLAYER_ANIMATIONS.DUCK) {
            this.height = PLAYER_CONFIG.HEIGHT * 0.6;
        } else {
            this.height = PLAYER_CONFIG.HEIGHT;
        }
    }
    
    clampPosition() {
        // Prevent falling through the world
        if (this.y > 2000) { // Arbitrary death barrier
            this.takeDamage(this.health, this.x, this.y);
        }
    }
    
    takeDamage(amount, sourceX = 0, sourceY = 0) {
        if (this.invincible || this.dead) return;
        
        this.health -= amount;
        this.invincible = true;
        this.invincibilityTime = PLAYER_CONFIG.INVINCIBILITY_TIME;
        this.stunned = true;
        this.stunTime = PLAYER_CONFIG.HITSTUN_TIME;
        
        // Knockback from damage source
        const knockbackX = this.x < sourceX ? -5 : 5;
        this.vx += knockbackX;
        this.vy -= 3;
        
        window.game?.audio.playSound('hit');
        window.game?.camera.shake(8);
        
        // Damage particles
        window.game?.particles.addExplosion(
            this.x + this.width / 2,
            this.y + this.height / 2,
            12,
            {
                color: this.color.accent,
                speed: 8,
                life: 40,
                gravity: 0.1
            }
        );
        
        // Check for death
        if (this.health <= 0) {
            this.die();
        } else {
            this.currentAnimation = PLAYER_ANIMATIONS.HURT;
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        
        // Healing particles
        window.game?.particles.addExplosion(
            this.x + this.width / 2,
            this.y + this.height / 2,
            8,
            {
                color: this.color.secondary,
                speed: 4,
                life: 30,
                gravity: -0.1
            }
        );
    }
    
    restoreEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
        
        // Energy particles
        window.game?.particles.addExplosion(
            this.x + this.width / 2,
            this.y + this.height / 2,
            6,
            {
                color: this.color.primary,
                speed: 3,
                life: 25,
                gravity: 0
            }
        );
    }
    
    unlockAbility(abilityName) {
        if (this.abilities.hasOwnProperty(abilityName)) {
            this.abilities[abilityName] = true;
            console.log(`Unlocked ability: ${abilityName}`);
        }
    }
    
    die() {
        this.dead = true;
        this.deaths++;
        this.currentAnimation = PLAYER_ANIMATIONS.DEAD;
        this.vx = 0;
        this.vy = 0;
        
        // Death explosion
        window.game?.particles.addExplosion(
            this.x + this.width / 2,
            this.y + this.height / 2,
            20,
            {
                color: this.color.accent,
                speed: 10,
                life: 60,
                gravity: 0.2
            }
        );
        
        window.game?.camera.shake(15);
        
        // Transition to death state
        setTimeout(() => {
            window.game?.state.setState('dead');
            if (window.game?.ui) {
                window.game?.ui.showDeathScreen();
            }
        }, 1000);
    }
    
    respawn(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.health = this.maxHealth;
        this.energy = this.maxEnergy;
        this.dead = false;
        this.invincible = false;
        this.invincibilityTime = 0;
        this.stunned = false;
        this.stunTime = 0;
        this.attacking = false;
        this.attackTime = 0;
        this.isDashing = false;
        this.dashTime = 0;
        this.currentAnimation = PLAYER_ANIMATIONS.IDLE;
        
        // Clear visual effects
        this.trail = [];
        this.afterimages = [];
        
        console.log('Player respawned');
    }
    
    render(ctx, camera) {
        // Render afterimages first
        for (const afterimage of this.afterimages) {
            ctx.save();
            ctx.globalAlpha = afterimage.alpha * 0.5;
            ctx.fillStyle = this.color.primary;
            ctx.fillRect(
                camera.getScreenX(afterimage.x),
                camera.getScreenY(afterimage.y),
                this.width,
                this.height
            );
            ctx.restore();
        }
        
        // Render trail
        for (let i = 0; i < this.trail.length - 1; i++) {
            const current = this.trail[i];
            const next = this.trail[i + 1];
            
            ctx.save();
            ctx.globalAlpha = current.alpha * 0.3;
            ctx.strokeStyle = this.color.primary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(camera.getScreenX(current.x), camera.getScreenY(current.y));
            ctx.lineTo(camera.getScreenX(next.x), camera.getScreenY(next.y));
            ctx.stroke();
            ctx.restore();
        }
        
        // Render player
        ctx.save();
        
        // Apply invincibility flashing
        if (this.invincible && Math.floor(this.invincibilityTime / 3) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        const screenX = camera.getScreenX(this.x);
        const screenY = camera.getScreenY(this.y);
        
        // Flip sprite if needed
        if (this.flipX) {
            ctx.scale(-1, 1);
            ctx.translate(-screenX - this.width, 0);
        }
        
        // Draw player rectangle (placeholder for sprite)
        ctx.fillStyle = this.color.primary;
        ctx.fillRect(
            this.flipX ? 0 : screenX,
            screenY,
            this.width,
            this.height
        );
        
        // Draw eyes
        ctx.fillStyle = '#ffffff';
        const eyeY = screenY + 8;
        const eyeSize = 3;
        if (this.flipX) {
            ctx.fillRect(this.width - 16, eyeY, eyeSize, eyeSize);
            ctx.fillRect(this.width - 8, eyeY, eyeSize, eyeSize);
        } else {
            ctx.fillRect(screenX + 8, eyeY, eyeSize, eyeSize);
            ctx.fillRect(screenX + 16, eyeY, eyeSize, eyeSize);
        }
        
        // Draw additional details based on animation
        this.renderAnimationDetails(ctx, screenX, screenY);
        
        ctx.restore();
        
        // Debug: render hitboxes
        if (window.game?.debugMode) {
            this.renderDebug(ctx, camera);
        }
    }
    
    renderAnimationDetails(ctx, screenX, screenY) {
        const realScreenX = this.flipX ? 0 : screenX;
        
        switch (this.currentAnimation) {
            case PLAYER_ANIMATIONS.ATTACK:
                // Attack effect
                ctx.fillStyle = this.color.accent;
                const attackOffset = this.flipX ? -10 : this.width + 5;
                ctx.fillRect(realScreenX + attackOffset, screenY + 10, 8, 12);
                break;
                
            case PLAYER_ANIMATIONS.DASH:
                // Dash glow
                ctx.shadowColor = this.color.primary;
                ctx.shadowBlur = 10;
                break;
                
            case PLAYER_ANIMATIONS.WALL_SLIDE:
                // Wall slide sparks already handled by particles
                break;
        }
    }
    
    renderDebug(ctx, camera) {
        ctx.save();
        
        // Player hitbox
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            camera.getScreenX(this.x),
            camera.getScreenY(this.y),
            this.width,
            this.height
        );
        
        // Attack hitbox
        if (this.attacking && this.attackHitbox.width > 0) {
            ctx.strokeStyle = '#ff0000';
            ctx.strokeRect(
                camera.getScreenX(this.attackHitbox.x),
                camera.getScreenY(this.attackHitbox.y),
                this.attackHitbox.width,
                this.attackHitbox.height
            );
        }
        
        // Velocity vector
        ctx.strokeStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(
            camera.getScreenX(this.x + this.width / 2),
            camera.getScreenY(this.y + this.height / 2)
        );
        ctx.lineTo(
            camera.getScreenX(this.x + this.width / 2 + this.vx * 5),
            camera.getScreenY(this.y + this.height / 2 + this.vy * 5)
        );
        ctx.stroke();
        
        ctx.restore();
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.Player = Player;
    window.PLAYER_CONFIG = PLAYER_CONFIG;
    window.PLAYER_ANIMATIONS = PLAYER_ANIMATIONS;
}

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Player, PLAYER_CONFIG, PLAYER_ANIMATIONS };
}