/**
 * Lost Citadel - Boss System
 * Boss enemies, behaviors, and combat mechanics
 */

// Boss types and their configurations
const BOSS_TYPES = {
    GUARDIAN: {
        name: 'Stone Guardian',
        health: 300,
        maxHealth: 300,
        damage: 40,
        speed: 2,
        size: { width: 80, height: 120 },
        color: '#8d6e63',
        attackCooldown: 120,
        abilities: ['slam', 'charge']
    },
    SHADOW_KNIGHT: {
        name: 'Shadow Knight',
        health: 250,
        maxHealth: 250,
        damage: 30,
        speed: 4,
        size: { width: 60, height: 100 },
        color: '#424242',
        attackCooldown: 90,
        abilities: ['slash', 'teleport']
    },
    CRYSTAL_WARDEN: {
        name: 'Crystal Warden',
        health: 400,
        maxHealth: 400,
        damage: 25,
        speed: 1.5,
        size: { width: 100, height: 140 },
        color: '#7b1fa2',
        attackCooldown: 150,
        abilities: ['laser', 'shield']
    }
};

class Boss {
    constructor(x, y, type = 'GUARDIAN') {
        const config = BOSS_TYPES[type];
        
        // Position and physics
        this.x = x;
        this.y = y;
        this.width = config.size.width;
        this.height = config.size.height;
        this.vx = 0;
        this.vy = 0;
        
        // Stats
        this.type = type;
        this.name = config.name;
        this.health = config.health;
        this.maxHealth = config.maxHealth;
        this.damage = config.damage;
        this.speed = config.speed;
        this.color = config.color;
        
        // Combat
        this.attackCooldown = 0;
        this.maxAttackCooldown = config.attackCooldown;
        this.abilities = [...config.abilities];
        this.currentAbility = null;
        this.abilityTimer = 0;
        
        // State
        this.active = false;
        this.defeated = false;
        this.destroyed = false;
        this.facing = 1; // 1 for right, -1 for left
        
        // AI state
        this.state = 'idle'; // idle, combat, attacking, hurt, dead
        this.stateTimer = 0;
        this.aggroRange = 200;
        this.attackRange = 80;
        
        // Visual effects
        this.flashTimer = 0;
        this.shakeTimer = 0;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        console.log(`Boss created: ${this.name} at (${x}, ${y})`);
    }
    
    update(deltaTime) {
        if (this.defeated || this.destroyed) return;
        
        // Basic update for now - just gravity and bounds
        this.vy += 0.8; // gravity
        this.y += this.vy;
        
        if (this.y > 600) {
            this.y = 600;
            this.vy = 0;
        }
    }
    
    takeDamage(damage, source) {
        if (this.defeated) return false;
        
        this.health -= damage;
        console.log(`Boss ${this.name} took ${damage} damage, health: ${this.health}`);
        
        if (this.health <= 0) {
            this.defeat();
        }
        
        return true;
    }
    
    defeat() {
        this.defeated = true;
        console.log(`Boss defeated: ${this.name}`);
        
        setTimeout(() => {
            this.destroyed = true;
        }, 3000);
    }
    
    render(ctx, camera) {
        if (this.destroyed) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Skip rendering if off-screen
        if (screenX < -this.width || screenX > 1280 + this.width ||
            screenY < -this.height || screenY > 720 + this.height) {
            return;
        }
        
        ctx.save();
        
        // Draw boss body
        ctx.fillStyle = this.defeated ? '#555' : this.color;
        ctx.fillRect(screenX, screenY, this.width, this.height);
        
        // Draw simple eyes
        if (!this.defeated) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(screenX + 15, screenY + 20, 8, 8);
            ctx.fillRect(screenX + 30, screenY + 20, 8, 8);
        }
        
        ctx.restore();
    }
}

// Export for other modules
if (typeof window !== 'undefined') {
    window.Boss = Boss;
    window.BOSS_TYPES = BOSS_TYPES;
}