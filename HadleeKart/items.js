const ITEM_DEFS = {
    MUSHROOM: { type: 'mushroom', name: 'Mushroom', uses: 1 },
    TRIPLE_MUSHROOM: { type: 'triple_mushroom', name: 'Triple Mushroom', uses: 3 },
    GOLDEN_MUSHROOM: { type: 'golden_mushroom', name: 'Golden Mushroom', duration: 7.5 },
    RED_SHELL: { type: 'red_shell', name: 'Red Shell', uses: 1, placeholder: true },
    TRIPLE_RED_SHELL: { type: 'triple_red_shell', name: 'Triple Red Shell', uses: 3, placeholder: true },
    GREEN_SHELL: { type: 'green_shell', name: 'Green Shell', uses: 1, placeholder: true },
    TRIPLE_GREEN_SHELL: { type: 'triple_green_shell', name: 'Triple Green Shell', uses: 3, placeholder: true },
    BLUE_SHELL: { type: 'blue_shell', name: 'Blue Shell', uses: 1, placeholder: true },
    BANANA: { type: 'banana', name: 'Banana', uses: 1, placeholder: true },
    TRIPLE_BANANA: { type: 'triple_banana', name: 'Triple Banana', uses: 3, placeholder: true },
    BOB_OMB: { type: 'bob_omb', name: 'Bob-omb', uses: 1, placeholder: true },
    SHOCK: { type: 'shock', name: 'Lightning', uses: 1, placeholder: true },
    BULLET_BILL: { type: 'bullet_bill', name: 'Bullet Bill', duration: 2.5, placeholder: true },
    STAR: { type: 'star', name: 'Star', duration: 10 },
    BOO: { type: 'boo', name: 'Boo', duration: 10, placeholder: true },
    FIRE_FLOWER: { type: 'fire_flower', name: 'Fire Flower', uses: 10, placeholder: true },
    SUPER_HORN: { type: 'super_horn', name: 'Super Horn', uses: 1, placeholder: true },
};

class ItemState {
    constructor(){
      this.activeItem = null; // { def, remainingUses, timer }
      this.effects = { speedMultiplier: 1, invincible: false };
      this.golden = { active: false, remaining: 0, cooldown: 0 }; // golden mushroom internal spam window
      this.star = { active: false, remaining: 0 };
      this.launchCooldown = 0; // generic cooldown for placeholder projectiles
      this.boo = { active: false, remaining: 0 };
      this.bullet = { active: false, remaining: 0 };
      this.shock = { active: false, remaining: 0 }; // self-effect placeholder
    }
}

class ItemManager {
    constructor(opts){
      this.state = new ItemState();
      this.speedBoostStrength = 0.2; // 20%
      this.singleBoostDuration = 2.0;
      this.onUpdateUI = opts?.onUpdateUI || (()=>{});
      this.log = opts?.log || console.log;
    }

    give(def){
      // Replace whatever was held for now (single slot inventory)
      const item = { def, remainingUses: def.uses || 1, timer: 0 };
      this.state.activeItem = item;
      this.onUpdateUI(this.getUIState());
    }

    cycleExample(){
      // helper for debug: cycles items
      const defs = Object.values(ITEM_DEFS);
      const random = defs[Math.floor(Math.random()*defs.length)];
      this.give(random);
    }

    use(){
      const item = this.state.activeItem;
      if(!item) return;
      const def = item.def;

      if(this.state.launchCooldown > 0){
        return; // still cooling down
      }

      switch(def.type){
        case 'mushroom':
        case 'triple_mushroom':
          this.triggerSingleMushroom(item);
          break;
        case 'golden_mushroom':
          this.triggerGoldenMushroom(item);
          break;
        case 'star':
          this.triggerStar(item);
          break;
        case 'boo':
          this.triggerBoo(item);
          break;
        case 'bullet_bill':
          this.triggerBulletBill(item);
          break;
        case 'shock':
          this.triggerShock(item);
          break;
        case 'fire_flower':
          this.triggerFireFlower(item);
          break;
        case 'super_horn':
          this.triggerSuperHorn(item);
          break;
        default:
          this.placeholderAction(def);
          item.remainingUses -= 1;
          this.state.launchCooldown = 0.4; // 400ms between launches/drops
      }

      if(item.remainingUses <= 0 && !this.isContinuous(def)){
        this.state.activeItem = null;
      }
      this.onUpdateUI(this.getUIState());
    }

    isContinuous(def){
      return def.type === 'golden_mushroom' || def.type === 'star';
    }

    triggerSingleMushroom(item){
      // consume one use and apply temporary speed multiplier via boost timer stored in item.timer if not already running
      if(item.timer > 0) return; // already boosting that instance
      item.timer = this.singleBoostDuration;
      item.remainingUses -= 1;
    }

    triggerGoldenMushroom(item){
      if(!this.state.golden.active){
        this.state.golden.active = true;
        this.state.golden.remaining = item.def.duration || 7.5;
      }
      // golden: each press if cooldown elapsed, start a 2s boost segment
      if(this.state.golden.cooldown <= 0){
        item.timer = this.singleBoostDuration; // reuse timer for current boost wave
        this.state.golden.cooldown = 0.15; // slight delay to avoid spamming key super fast
      }
    }

    triggerStar(item){
      if(!this.state.star.active){
        this.state.star.active = true;
        this.state.star.remaining = item.def.duration || 10;
        this.state.effects.invincible = true;
        this.state.effects.speedMultiplier = Math.max(this.state.effects.speedMultiplier, 1 + this.speedBoostStrength);
      }
    }

    triggerBoo(item){
      if(!this.state.boo.active){
        this.state.boo.active = true;
        this.state.boo.remaining = item.def.duration || 10;
        // Boo grants invincibility + invisibility placeholder (shares invincible flag)
        this.state.effects.invincible = true;
      }
      item.remainingUses = 0; // single use
    }

    triggerBulletBill(item){
      if(!this.state.bullet.active){
        this.state.bullet.active = true;
        this.state.bullet.remaining = item.def.duration || 2.5;
        // Could force steering & high speed later. For now treat as strong speed buff.
      }
      item.remainingUses = 0;
    }

    triggerShock(item){
      if(!this.state.shock.active){
        this.state.shock.active = true;
        this.state.shock.remaining = 1.5; // placeholder self slow or effect window
        this.log('[Item Placeholder] Activated Lightning (no opponents to shrink).');
      }
      item.remainingUses = 0;
    }

    triggerFireFlower(item){
      this.placeholderAction(item.def); // treat each use as a single fireball
      item.remainingUses -= 1;
    }

    triggerSuperHorn(item){
      this.log('[Item Placeholder] Super Horn blast (would destroy Blue Shell).');
      item.remainingUses = 0;
    }

    placeholderAction(def){
      let verb = 'Used';
      if(/banana|bob_omb/i.test(def.type)) verb = 'Dropped';
      if(/shell/i.test(def.type)) verb = 'Launched';
      if(def.type === 'fire_flower') verb = 'Fired';
      if(def.type === 'super_horn') verb = 'Blasted';
      this.log(`[Item Placeholder] ${verb} ${def.name}. (No opponents yet)`);
    }

    update(delta){
      const item = this.state.activeItem;
      if(this.state.launchCooldown > 0){
        this.state.launchCooldown = Math.max(0, this.state.launchCooldown - delta);
      }
      // manage timers for mushroom boosts
      if(item){
        if(item.timer > 0){
          item.timer = Math.max(0, item.timer - delta);
          if(item.timer === 0 && item.def.type !== 'golden_mushroom'){
            // end of a single mushroom boost
          }
        }
      }

      // golden mushroom window
      if(this.state.golden.active){
        this.state.golden.remaining = Math.max(0, this.state.golden.remaining - delta);
        this.state.golden.cooldown = Math.max(0, this.state.golden.cooldown - delta);
        if(this.state.golden.remaining === 0){
          this.state.golden.active = false;
          // remove active item once window ends
          if(item && item.def.type === 'golden_mushroom'){
            this.state.activeItem = null;
          }
        }
      }

      // star
      if(this.state.star.active){
        this.state.star.remaining = Math.max(0, this.state.star.remaining - delta);
        if(this.state.star.remaining === 0){
          this.state.star.active = false;
          this.state.effects.invincible = false;
          // reset speed multiplier if only star provided it
          this.state.effects.speedMultiplier = 1; // simple reset (could track stack later)
          if(item && item.def.type === 'star'){
            this.state.activeItem = null;
          }
        }
      }

      // boo
      if(this.state.boo.active){
        this.state.boo.remaining = Math.max(0, this.state.boo.remaining - delta);
        if(this.state.boo.remaining === 0){
          this.state.boo.active = false;
          this.state.effects.invincible = this.state.star.active; // only remains if star still active
        }
      }

      // bullet bill
      if(this.state.bullet.active){
        this.state.bullet.remaining = Math.max(0, this.state.bullet.remaining - delta);
        if(this.state.bullet.remaining === 0){
          this.state.bullet.active = false;
        }
      }

      // shock
      if(this.state.shock.active){
        this.state.shock.remaining = Math.max(0, this.state.shock.remaining - delta);
        if(this.state.shock.remaining === 0){
          this.state.shock.active = false;
        }
      }

      // recompute speed multiplier: star and any mushroom effects can stack additively up to a cap (simple model)
      let additive = 0;
      if(item){
        if((item.def.type === 'mushroom' || item.def.type === 'triple_mushroom') && item.timer > 0){
          additive += this.speedBoostStrength; // +20%
        }
        if(item.def.type === 'golden_mushroom' && this.state.golden.active && item.timer > 0){
          additive += this.speedBoostStrength; // each press adds the base 20% but we still treat as single boost level (no stacking per-press)
        }
      }
      if(this.state.star.active){
        additive += this.speedBoostStrength; // +20% during star (placeholder; could be larger later)
      }
      if(this.state.bullet.active){
        additive += 0.5; // bullet bill strong speed buff +50%
      }
      if(this.state.shock.active){
        // in real game others are slowed; here maybe slight self speed penalty to visualize effect
        additive -= 0.1; // mild slowdown to represent charge (not essential)
      }
      const capped = Math.min(additive, 0.6); // cap total at +60% for now
      this.state.effects.speedMultiplier = 1 + capped;

      this.onUpdateUI(this.getUIState());
    }

    getSpeedMultiplier(){
      return this.state.effects.speedMultiplier;
    }

    getUIState(){
      const item = this.state.activeItem;
      if(!item) return { holding: 'None' };
      const def = item.def;
      const base = { holding: def.name };
      if(def.uses){
        base.uses = item.remainingUses;
      }
      if(item.timer > 0){
        base.boost = item.timer.toFixed(2);
      }
      if(def.type === 'golden_mushroom'){
        base.window = this.state.golden.remaining.toFixed(2);
      }
      if(def.type === 'star'){
        base.star = this.state.star.remaining.toFixed(2);
      }
      if(def.type === 'boo') base.boo = this.state.boo.remaining.toFixed(2);
      if(def.type === 'bullet_bill') base.bullet = this.state.bullet.remaining.toFixed(2);
      return base;
    }
}

export { ITEM_DEFS, ItemManager };
export default ItemManager;
