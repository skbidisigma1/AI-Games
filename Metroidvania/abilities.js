/**
 * Lost Citadel - Ability System
 * Manages player abilities, unlocks, and special moves
 */

// Ability definitions
const ABILITIES = {
    WALL_JUMP: {
        id: 'wallJump',
        name: 'Wall Jump',
        description: 'Jump off walls while sliding to reach higher platforms',
        icon: '🧗',
        unlocked: false,
        energyCost: 0
    },
    DASH: {
        id: 'dash',
        name: 'Dash',
        description: 'Quick dash in any direction to dodge attacks or cross gaps',
        icon: '💨',
        unlocked: false,
        energyCost: 20
    },
    DOUBLE_JUMP: {
        id: 'doubleJump',
        name: 'Double Jump',
        description: 'Jump again while airborne to reach new heights',
        icon: '⬆️',
        unlocked: false,
        energyCost: 15
    }
};

class AbilityManager {
    constructor(player) {
        this.player = player;
        this.abilities = { ...ABILITIES };
        this.activeAbilities = new Set();
        this.cooldowns = new Map();
        
        // Initialize player abilities if they don't exist
        if (this.player && !this.player.abilities) {
            this.player.abilities = {
                wallJump: false,
                dash: false,
                doubleJump: false
            };
        }
        
        if (this.player) {
            this.updateAbilityStates();
        }
    }
    
    updateAbilityStates() {
        // Sync abilities with player data
        if (this.player && this.player.abilities) {
            for (const [key, ability] of Object.entries(this.abilities)) {
                if (this.player.abilities[ability.id]) {
                    ability.unlocked = true;
                }
            }
        }
    }
    
    unlockAbility(abilityId) {
        if (this.abilities[abilityId.toUpperCase()]) {
            const ability = this.abilities[abilityId.toUpperCase()];
            ability.unlocked = true;
            
            if (this.player && this.player.abilities) {
                this.player.abilities[ability.id] = true;
            }
            
            // Show unlock notification
            if (window.game && window.game.ui) {
                window.game.ui.showAbilityUnlock(ability);
            }
            
            // Play unlock sound
            if (window.game && window.game.audio) {
                window.game.audio.playSound('unlock');
            }
            
            // Update UI
            this.updateUI();
            
            console.log(`Ability unlocked: ${ability.name}`);
            return true;
        }
        return false;
    }
    
    canUseAbility(abilityId) {
        const ability = this.abilities[abilityId.toUpperCase()];
        if (!ability || !ability.unlocked || !this.player) {
            return false;
        }
        
        // Check energy cost
        if (this.player.energy < ability.energyCost) {
            return false;
        }
        
        // Check cooldown
        if (this.cooldowns.has(ability.id) && this.cooldowns.get(ability.id) > 0) {
            return false;
        }
        
        return true;
    }
    
    useAbility(abilityId) {
        if (!this.canUseAbility(abilityId) || !this.player) {
            return false;
        }
        
        const ability = this.abilities[abilityId.toUpperCase()];
        
        // Consume energy
        this.player.energy -= ability.energyCost;
        
        // Set cooldown based on ability
        let cooldownTime = 0;
        switch (ability.id) {
            case 'dash':
                cooldownTime = 30; // 0.5 seconds at 60fps
                break;
            case 'doubleJump':
                cooldownTime = 10;
                break;
            case 'wallJump':
                cooldownTime = 5;
                break;
        }
        
        if (cooldownTime > 0) {
            this.cooldowns.set(ability.id, cooldownTime);
        }
        
        // Add to active abilities for visual feedback
        this.activeAbilities.add(ability.id);
        setTimeout(() => {
            this.activeAbilities.delete(ability.id);
        }, 200);
        
        this.updateUI();
        return true;
    }
    
    update(deltaTime) {
        // Update cooldowns
        for (const [abilityId, cooldown] of this.cooldowns.entries()) {
            if (cooldown > 0) {
                this.cooldowns.set(abilityId, cooldown - 1);
            } else {
                this.cooldowns.delete(abilityId);
            }
        }
        
        // Update UI periodically
        this.updateUI();
    }
    
    updateUI() {
        // Update ability icons in the HUD
        for (const [key, ability] of Object.entries(this.abilities)) {
            const iconElement = document.getElementById(`${ability.id}Icon`);
            if (iconElement) {
                // Remove all state classes
                iconElement.classList.remove('unlocked', 'active');
                
                // Add appropriate state classes
                if (ability.unlocked) {
                    iconElement.classList.add('unlocked');
                }
                
                if (this.activeAbilities.has(ability.id)) {
                    iconElement.classList.add('active');
                }
                
                // Update tooltip with cooldown info
                let tooltip = ability.name;
                if (this.cooldowns.has(ability.id) && this.cooldowns.get(ability.id) > 0) {
                    const cooldownSeconds = Math.ceil(this.cooldowns.get(ability.id) / 60);
                    tooltip += ` (${cooldownSeconds}s)`;
                }
                iconElement.title = tooltip;
            }
        }
    }
    
    getAbilityByName(name) {
        for (const ability of Object.values(this.abilities)) {
            if (ability.name.toLowerCase() === name.toLowerCase() || 
                ability.id.toLowerCase() === name.toLowerCase()) {
                return ability;
            }
        }
        return null;
    }
    
    getUnlockedAbilities() {
        return Object.values(this.abilities).filter(ability => ability.unlocked);
    }
    
    getAllAbilities() {
        return Object.values(this.abilities);
    }
    
    resetAbilities() {
        // Reset all abilities to locked state
        for (const ability of Object.values(this.abilities)) {
            ability.unlocked = false;
        }
        
        if (this.player) {
            this.player.abilities = {
                wallJump: false,
                dash: false,
                doubleJump: false
            };
        }
        
        this.activeAbilities.clear();
        this.cooldowns.clear();
        this.updateUI();
    }
    
    // Debug method to unlock all abilities
    unlockAll() {
        for (const ability of Object.values(this.abilities)) {
            this.unlockAbility(ability.id);
        }
    }
}

// Export for other modules
if (typeof window !== 'undefined') {
    window.AbilityManager = AbilityManager;
    window.ABILITIES = ABILITIES;
}