/**
 * Vehicle Class - Handles kart physics, movement, and controls
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ItemManager } from './items.js';

export class Vehicle {
  constructor({ scene, config, trackLoader, checkpointManager, statusElement, lapElement, itemElement }) {
    this.scene = scene;
    this.config = config;
    this.trackLoader = trackLoader;
    this.checkpointManager = checkpointManager;
    this.statusElement = statusElement;
    this.lapElement = lapElement;
    this.itemElement = itemElement;
    
    // Extract configs
    this.vehicleConfig = config.vehicle || {};
    this.physicsConfig = this.vehicleConfig.physics || {};
    this.driftConfig = config.drift || { stages: [] };
    this.debugConfig = config.debug || {};
    
    // Initialize item manager
    this.itemManager = new ItemManager({
      onUpdateUI: (ui) => this.updateItemUI(ui)
    });
    
    // Create kart group
    this.group = new THREE.Group();
    this.loadKartModel();
    
    // Hitbox dimensions (from Teddy Buggy model at 0.3 scale)
    this.hitboxWidth = 2.85;
    this.hitboxHeight = 2.85;
    this.hitboxLength = 5.25;
    
    // Physics state
    this.velocity = new THREE.Vector3();
    this.verticalVelocity = 0;
    this.heading = 0;
    this.lastSteer = 0;
    this.isGrounded = true;
    this.lastGroundCheck = null;
    
    // Drift state
    this.driftState = {
      active: false,
      direction: 0,
      timer: 0,
      stage: -1,
      yawOffset: 0,
      leanAngle: 0,
      pending: false,
      pendingTimer: 0,
      turnMultiplier: 1,
      chargeRate: 1,
      controlState: 'neutral',
      brakeTimer: 0
    };
    
    // Boost state
    this.boostState = { timer: 0, strength: 0 };

    // Surface state (road/offroad/boost)
    this.surfaceState = {
      type: 'road',
      maxSpeedMultiplier: 1,
      accelMultiplier: 1,
      dragMultiplier: 1,
      rollMultiplier: 1,
      driftAllowed: true
    };
    this._boostPadCooldown = 0;
    this._wasOnBoostPad = false;
    
    // Respawn state
    this.falloffTimer = 0;
    this.falloffThreshold = this.physicsConfig.falloffThreshold || -10;
    this.checkpointCooldown = 0;
    
    // Spawn at start position
    this.spawnAtStart();
    this.scene.add(this.group);
    
    this.updateStatusText();
  }
  
  loadKartModel() {
    const loader = new GLTFLoader();
    loader.load(
      './assets/kart/teddy_buggy.glb',
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        gltf.scene.scale.set(0.3, 0.3, 0.3);
        this.group.add(gltf.scene);
        if (this.debugConfig.logInfo) console.log('[Vehicle] Kart model loaded');
      },
      undefined,
      (error) => {
        console.error('[Vehicle] Error loading kart model:', error);
        this.createFallbackKart();
      }
    );
  }
  
  createFallbackKart() {
    const geometry = new THREE.BoxGeometry(1.8, 0.9, 3.2);
    const material = new THREE.MeshStandardMaterial({ color: 0xff5733 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.position.y = 0.6;
    this.group.add(mesh);
    if (this.debugConfig.logInfo) console.log('[Vehicle] Using fallback kart model');
  }
  
  spawnAtStart() {
    const trackData = this.trackLoader.getTrackData();
    const spawnPos = trackData.startPositions[0];
    
    if (spawnPos) {
      this.group.position.set(spawnPos.position.x, 0, spawnPos.position.z);
      const groundCheck = this.trackLoader.getGroundHeight(this.group.position);
      
      if (groundCheck.hit) {
        this.group.position.y = groundCheck.height + (this.hitboxHeight * 0.5);
      } else {
        this.group.position.y = spawnPos.position.y + this.hitboxHeight * 0.5;
      }
      
      this.heading = spawnPos.rotation;
      
      if (this.debugConfig.logInfo) {
        console.log('[Vehicle] Spawned at Start.0:', {
          x: this.group.position.x.toFixed(2),
          y: this.group.position.y.toFixed(2),
          z: this.group.position.z.toFixed(2)
        });
      }
    } else {
      this.group.position.set(0, 0, 0);
      this.heading = 0;
    }
  }
  
  respawn() {
    const respawnPoint = this.checkpointManager.getRespawnPoint();
    
    this.group.position.set(respawnPoint.position.x, 0, respawnPoint.position.z);
    const groundCheck = this.trackLoader.getGroundHeight(this.group.position);
    
    if (groundCheck.hit) {
      this.group.position.y = groundCheck.height + (this.hitboxHeight * 0.5);
    } else {
      this.group.position.y = respawnPoint.position.y + this.hitboxHeight * 0.5;
    }
    
    this.heading = respawnPoint.rotation;
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.driftState.active = false;
    this.boostState.timer = 0;
    this.checkpointCooldown = this.physicsConfig.respawnCheckpointCooldown || 1.0;
    
    if (this.debugConfig.logRespawn) {
      console.log('[Vehicle] Respawned at checkpoint');
    }
  }
  
  updateItemUI(ui) {
    if (!this.itemElement) return;
    const parts = [];
    parts.push(ui.holding ? `Holding: ${ui.holding}` : 'Holding: None');
    if (ui.uses !== undefined) parts.push(`Uses: ${ui.uses}`);
    if (ui.boost) parts.push(`Boost: ${ui.boost}s`);
    if (ui.window) parts.push(`Window: ${ui.window}s`);
    if (ui.star) parts.push(`Star: ${ui.star}s`);
    if (ui.boo) parts.push(`Boo: ${ui.boo}s`);
    if (ui.bullet) parts.push(`Bullet: ${ui.bullet}s`);
    this.itemElement.textContent = 'Item - ' + parts.join(' | ');
  }
  
  update(delta, input) {
    // Handle manual respawn
    if (input.respawn) {
      this.respawn();
      input.respawn = false;
    }
    
    // Update checkpoint cooldown
    if (this.checkpointCooldown > 0) {
      this.checkpointCooldown -= delta;
    }
    
    // Check for falloff
    if (this.group.position.y < this.falloffThreshold) {
      this.falloffTimer += delta;
      if (this.falloffTimer > (this.physicsConfig.falloffGracePeriod || 0.5)) {
        this.respawn();
        this.falloffTimer = 0;
      }
    } else {
      this.falloffTimer = 0;
    }
    
    // Physics update
    this.updatePhysics(delta, input);
    
    // Update checkpoint manager
    if (this.checkpointCooldown <= 0) {
      this.checkpointManager.update(this.group.position);
    }
    
    // Update lap UI
    const status = this.checkpointManager.getStatus();
    if (this.lapElement) {
      this.lapElement.textContent = `Lap: ${status.currentLap}/${status.totalLaps} | Checkpoints: ${status.checkpointsPassed}/${status.totalCheckpoints}`;
    }
    
    // Update visuals and items
    this.updateVisuals(delta);
    this.updateStatusText();
    
    if (this.itemManager) {
      this.itemManager.update(delta);
      this.applyItemSpeedBoost();
    }
    
    input.driftJustPressed = false;
  }
  
  updatePhysics(delta, input) {
    const upVector = new THREE.Vector3(0, 1, 0);
    const forwardVector = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading)).normalize();
    const rightVector = new THREE.Vector3().crossVectors(upVector, forwardVector).normalize();

    // Surface modifiers (based on the previous ground check).
    this._setSurfaceStateFromType(this.lastGroundCheck?.surfaceType);
    
    const wasGrounded = this.isGrounded;
    const forwardSpeed = this.velocity.dot(forwardVector);
    const steerInput = (input.left ? 1 : 0) - (input.right ? 1 : 0);
    if (steerInput !== 0) this.lastSteer = steerInput;
    
    // Drift handling
    this.handleDriftPrePhysics(wasGrounded, input);

    // Strong offroad: cannot start/continue drift.
    if (this.surfaceState && this.surfaceState.driftAllowed === false) {
      if (this.driftState.active) this.releaseDrift({ awardBoost: false });
      if (this.driftState.pending) {
        this.driftState.pending = false;
        this.driftState.pendingTimer = 0;
      }
    }
    
    // Determine traction mode
    const dualInput = input.forward && input.backward;
    let tractionMode = this.driftState.active ? 'drift' : (dualInput ? 'lowTraction' : 'normal');
    
    if (this.driftState.active) {
      this.updateDriftControl(steerInput);
      if (input.forward && input.backward) {
        this.driftState.brakeTimer += delta;
        if (this.driftState.brakeTimer >= (this.driftConfig.brakeCancelTime || 1)) {
          this.releaseDrift({ awardBoost: false });
        }
      } else {
        this.driftState.brakeTimer = 0;
      }
    }
    
    if (!this.driftState.active) {
      this.driftState.turnMultiplier = 1;
      this.driftState.chargeRate = 1;
      this.driftState.controlState = 'neutral';
      this.driftState.brakeTimer = 0;
    }
    
    // Acceleration
    const acceleration = new THREE.Vector3();
    this.applyAcceleration(acceleration, input, forwardVector, forwardSpeed, dualInput);
    
    // Drift lateral force
    if (this.driftState.active && this.driftState.direction !== 0) {
      const lateralForce = (this.driftConfig.lateralForce || 35) * (this.driftState.turnMultiplier || 1);
      acceleration.addScaledVector(rightVector, -this.driftState.direction * lateralForce);
    }
    
    // Drag and deceleration
    const dragCoefficient = (this.physicsConfig.dragCoefficient || 1.9) * (this.surfaceState.dragMultiplier || 1);
    acceleration.addScaledVector(this.velocity, -dragCoefficient);
    
    if (!input.forward && !input.backward && this.boostState.timer <= 0) {
      const rollResistance = (this.physicsConfig.naturalDeceleration || 12) * (this.surfaceState.rollMultiplier || 1);
      acceleration.addScaledVector(this.velocity, -rollResistance);
    }
    
    // Apply boost
    this.applyBoost(acceleration, forwardVector, delta);
    
    // Update velocity
    this.velocity.addScaledVector(acceleration, delta);
    
    // Speed limits
    this.applySpeedLimits(forwardVector, rightVector);
    
    // Lateral retention (traction)
    this.applyLateralRetention(forwardVector, rightVector, tractionMode);
    
    // Steering
    this.applySteering(steerInput, delta, forwardSpeed);
    
    // Collision resolution
    const proposedPosition = this.group.position.clone().addScaledVector(this.velocity, delta);
    const wallResult = this.trackLoader.checkWallCollision(proposedPosition, {
      width: this.hitboxWidth,
      height: this.hitboxHeight,
      length: this.hitboxLength
    });
    
    // Apply position with wall pushback
    this.group.position.copy(proposedPosition).add(wallResult.pushback);
    
    // Cancel drift on wall collision
    if (wallResult.colliding && this.driftState.active) {
      this.releaseDrift({ awardBoost: false });
    }
    
    // Vertical movement
    this.updateVerticalMovement(delta);
    
    // Update grounded state
    const isGrounded = this.lastGroundCheck && this.lastGroundCheck.hit && 
                       this.lastGroundCheck.height <= this.group.position.y &&
                       (this.group.position.y - this.lastGroundCheck.height) < 0.1;
    const landed = isGrounded && !wasGrounded;
    this.isGrounded = isGrounded;
    
    // Post-physics drift handling
    const currentSpeed = this.velocity.length();
    this.handleDriftPostPhysics(delta, currentSpeed, forwardSpeed, isGrounded, landed, input, steerInput);
  }
  
  applyAcceleration(acceleration, input, forwardVector, forwardSpeed, dualInput) {
    const accelRate = (this.physicsConfig.accelerationRate || 55) * (this.surfaceState.accelMultiplier || 1);
    const brakeStrength = this.physicsConfig.brakeStrength || 70;
    const reverseFactor = this.physicsConfig.reverseAccelerationFactor || 0.7;
    
    if (input.forward && !input.backward) {
      if (forwardSpeed < 0) {
        acceleration.addScaledVector(forwardVector, brakeStrength);
      } else {
        acceleration.addScaledVector(forwardVector, accelRate);
      }
    } else if (input.backward && !input.forward) {
      if (forwardSpeed > 0.5) {
        acceleration.addScaledVector(forwardVector, -brakeStrength);
      } else {
        acceleration.addScaledVector(forwardVector, -accelRate * reverseFactor);
      }
    } else if (dualInput) {
      const dualFactor = this.physicsConfig.dualInputForwardFactor || 0.3;
      acceleration.addScaledVector(forwardVector, accelRate * dualFactor);
    }
  }
  
  applySpeedLimits(forwardVector, rightVector) {
    const maxSpeed = (this.physicsConfig.maxSpeed || 120) * (this.surfaceState.maxSpeedMultiplier || 1);
    const reverseSpeedFactor = this.physicsConfig.reverseSpeedFactor || 0.75;
    
    let adjustedForwardSpeed = this.velocity.dot(forwardVector);
    const lateralSpeed = this.velocity.dot(rightVector);
    
    if (adjustedForwardSpeed > maxSpeed) adjustedForwardSpeed = maxSpeed;
    if (adjustedForwardSpeed < -maxSpeed * reverseSpeedFactor) adjustedForwardSpeed = -maxSpeed * reverseSpeedFactor;
    
    const forwardComponent = forwardVector.clone().multiplyScalar(adjustedForwardSpeed);
    const lateralComponent = rightVector.clone().multiplyScalar(lateralSpeed);
    this.velocity.copy(forwardComponent.add(lateralComponent));
  }
  
  applyLateralRetention(forwardVector, rightVector, tractionMode) {
    const retentionConfig = this.physicsConfig.lateralRetention || {};
    let retention = retentionConfig.normal || 0.2;
    
    if (tractionMode === 'lowTraction') {
      retention = retentionConfig.lowTraction || 0.45;
    } else if (tractionMode === 'drift') {
      retention = retentionConfig.drift || 0.6;
    }
    
    const adjustedLateral = rightVector.clone().multiplyScalar(this.velocity.dot(rightVector) * retention);
    const adjustedForward = forwardVector.clone().multiplyScalar(this.velocity.dot(forwardVector));
    this.velocity.copy(adjustedForward.add(adjustedLateral));
  }
  
  applySteering(steerInput, delta, forwardSpeed) {
    const maxSpeed = this.physicsConfig.maxSpeed || 120;
    const absForwardSpeed = Math.abs(forwardSpeed);
    const speedRatio = THREE.MathUtils.clamp(absForwardSpeed / maxSpeed, 0, 1);
    
    let turnRate = this.physicsConfig.turnRate || Math.PI;
    const lowSpeedBoost = this.physicsConfig.lowSpeedTurnBoost || 1.6;
    
    if (absForwardSpeed < maxSpeed) {
      turnRate *= THREE.MathUtils.lerp(lowSpeedBoost, 1, speedRatio);
    }
    
    if (this.driftState.active && this.driftState.direction !== 0) {
      const driftMultiplier = (this.physicsConfig.driftTurnMultiplier || 1.2) * (this.driftState.turnMultiplier || 1);
      this.heading += this.driftState.direction * turnRate * driftMultiplier * delta;
    } else if (steerInput !== 0) {
      const steerSign = forwardSpeed >= 0 ? 1 : -1;
      const turnMultiplier = forwardSpeed < 0 ? (this.physicsConfig.reverseTurnMultiplier || 1.1) : 1;
      this.heading += steerInput * turnRate * delta * steerSign * turnMultiplier;
    }
  }
  
  updateVerticalMovement(delta) {
    const gravity = this.physicsConfig.gravity || 25;
    const snapGravity = this.physicsConfig.groundSnapGravity || 40;
    
    const groundCheck = this.trackLoader.getGroundHeight(this.group.position);

    // Boost pad cooldown tick.
    this._boostPadCooldown = Math.max(0, (this._boostPadCooldown || 0) - delta);
    
    if (groundCheck.hit) {
      const groundHeight = groundCheck.height;
      const distanceToGround = this.group.position.y - groundHeight;
      const maxSnapDistance = this.physicsConfig.maxSnapDistance || 2.0;
      
      if (distanceToGround > -maxSnapDistance) {
        if (distanceToGround > 0.1 || this.verticalVelocity > 0) {
          this.verticalVelocity -= gravity * delta;
        }
        
        if (distanceToGround < 0.5 && distanceToGround > 0 && this.verticalVelocity < 0) {
          this.verticalVelocity -= snapGravity * delta;
        }
        
        this.group.position.y += this.verticalVelocity * delta;
        
        if (this.group.position.y <= groundHeight && this.group.position.y > groundHeight - 0.5) {
          this.group.position.y = groundHeight;
          if (this.verticalVelocity < 0) {
            this.verticalVelocity = 0;
          }
        }
      } else {
        this.verticalVelocity -= gravity * delta;
        this.group.position.y += this.verticalVelocity * delta;
      }

      // Boost panel trigger: only when close to ground.
      const surfaceType = groundCheck.surfaceType || 'road';
      const onBoost = surfaceType === 'boost' && (this.group.position.y - groundHeight) < 0.25;
      const padCfg = this.config?.boostPads || {};
      const padStrength = typeof padCfg.strength === 'number' ? padCfg.strength : 220;
      const padDuration = typeof padCfg.duration === 'number' ? padCfg.duration : 0.45;
      const padCooldown = typeof padCfg.cooldown === 'number' ? padCfg.cooldown : 0.22;
      if (onBoost && !this._wasOnBoostPad && this._boostPadCooldown <= 0) {
        this.boostState.timer = Math.max(this.boostState.timer || 0, padDuration);
        this.boostState.strength = Math.max(this.boostState.strength || 0, padStrength);
        this._boostPadCooldown = padCooldown;
      }
      this._wasOnBoostPad = onBoost;
    } else {
      this.verticalVelocity -= gravity * delta;
      this.group.position.y += this.verticalVelocity * delta;

      this._wasOnBoostPad = false;
    }
    
    this.lastGroundCheck = groundCheck;

    // Keep surface state in sync for HUD (and next frame physics).
    this._setSurfaceStateFromType(this.lastGroundCheck?.surfaceType);
  }

  _setSurfaceStateFromType(surfaceType) {
    const t = typeof surfaceType === 'string' ? surfaceType : 'road';
    const offCfg = this.config?.offroad || {};

    const weak = {
      maxSpeedMultiplier: typeof offCfg.weakMaxSpeedMultiplier === 'number' ? offCfg.weakMaxSpeedMultiplier : 0.8,
      accelMultiplier: typeof offCfg.weakAccelMultiplier === 'number' ? offCfg.weakAccelMultiplier : 0.85,
      dragMultiplier: typeof offCfg.weakDragMultiplier === 'number' ? offCfg.weakDragMultiplier : 1.2,
      rollMultiplier: typeof offCfg.weakRollMultiplier === 'number' ? offCfg.weakRollMultiplier : 1.15,
      driftAllowed: true
    };
    const strong = {
      maxSpeedMultiplier: typeof offCfg.strongMaxSpeedMultiplier === 'number' ? offCfg.strongMaxSpeedMultiplier : 0.60,
      accelMultiplier: typeof offCfg.strongAccelMultiplier === 'number' ? offCfg.strongAccelMultiplier : 0.6,
      dragMultiplier: typeof offCfg.strongDragMultiplier === 'number' ? offCfg.strongDragMultiplier : 1.4,
      rollMultiplier: typeof offCfg.strongRollMultiplier === 'number' ? offCfg.strongRollMultiplier : 1.3,
      driftAllowed: false
    };

    if (t === 'offroadWeak') {
      this.surfaceState = { type: t, ...weak };
      return;
    }
    if (t === 'offroadStrong') {
      this.surfaceState = { type: t, ...strong };
      return;
    }
    if (t === 'boost') {
      this.surfaceState = { type: t, maxSpeedMultiplier: 1.2, accelMultiplier: 1, dragMultiplier: 1, rollMultiplier: 1, driftAllowed: true };
      return;
    }

    this.surfaceState = { type: 'road', maxSpeedMultiplier: 1, accelMultiplier: 1, dragMultiplier: 1, rollMultiplier: 1, driftAllowed: true };
  }
  
  applyBoost(acceleration, forwardVector, delta) {
    if (this.boostState.timer > 0) {
      acceleration.addScaledVector(forwardVector, this.boostState.strength);
      this.boostState.timer = Math.max(0, this.boostState.timer - delta);
      if (this.boostState.timer === 0) this.boostState.strength = 0;
    }
  }
  
  applyItemSpeedBoost() {
    const mult = this.itemManager.getSpeedMultiplier();
    if (mult === 1) return;
    
    const upVector = new THREE.Vector3(0, 1, 0);
    const forwardVector = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading)).normalize();
    const rightVector = new THREE.Vector3().crossVectors(upVector, forwardVector).normalize();
    
    const forwardSpeed = this.velocity.dot(forwardVector);
    const boosted = forwardSpeed * mult;
    const maxSpeed = this.physicsConfig.maxSpeed || 120;
    const clamped = Math.min(boosted, maxSpeed * 1.5);
    
    const forwardComponent = forwardVector.clone().multiplyScalar(clamped);
    const lateralComponent = rightVector.clone().multiplyScalar(this.velocity.dot(rightVector));
    this.velocity.copy(forwardComponent.add(lateralComponent));
  }
  
  // Drift methods
  handleDriftPrePhysics(wasGrounded, input) {
    if (!input.driftJustPressed) return;
    if (wasGrounded) {
      this.verticalVelocity = this.physicsConfig.hopVelocity || 5;
    }
    this.driftState.pending = true;
    this.driftState.pendingTimer = 0;
  }
  
  handleDriftPostPhysics(delta, speed, forwardSpeed, isGrounded, landed, input, steerInput) {
    if (!this.driftState.active && !this.driftState.pending) return;
    
    // Release drift if button is released while drifting
    if (this.driftState.active && !input.drift) {
      this.releaseDrift({ awardBoost: true });
      return;
    }
    
    // Handle pending drift state
    if (!this.driftState.active && this.driftState.pending) {
      // Cancel pending if drift button released
      if (!input.drift) {
        this.driftState.pending = false;
        this.driftState.pendingTimer = 0;
        return;
      }
      
      // Check if we should start drifting
      const directionInput = steerInput;
      const minSpeed = this.getDriftMinimumSpeed();
      const readyForDrift = isGrounded && forwardSpeed >= minSpeed && directionInput !== 0;
      
      // Define drift initiation window (time after landing where drift can start)
      const driftInitWindow = 0.075; // 75ms window after becoming grounded
      
      // Start drift if conditions met and within time window after landing
      if (readyForDrift && this.driftState.pendingTimer <= driftInitWindow) {
        this.startDrift(directionInput);
      }
      
      // Update pending timer (only while grounded)
      if (isGrounded) {
        this.driftState.pendingTimer += delta;
        
        // Cancel pending if window expired
        if (this.driftState.pendingTimer > driftInitWindow) {
          this.driftState.pending = false;
          this.driftState.pendingTimer = 0;
        }
      }
      
      return;
    }
    
    // Update drift charge
    if (this.driftState.active) {
      if (speed < (this.driftConfig.cancelSpeed || 5) || forwardSpeed <= 0.01) {
        this.releaseDrift({ awardBoost: false });
        return;
      }
      
      this.driftState.timer += delta * (this.driftState.chargeRate || 1);
      const stageIndex = this.resolveDriftStage(this.driftState.timer);
      if (stageIndex !== this.driftState.stage) {
        this.driftState.stage = stageIndex;
      }
    }
  }
  
  startDrift(direction) {
    const dir = Math.sign(direction);
    if (dir === 0) return;
    
    Object.assign(this.driftState, {
      active: true,
      pending: false,
      direction: dir,
      timer: 0,
      stage: -1,
      turnMultiplier: (this.driftConfig.turnMultipliers || {}).neutral || 1,
      chargeRate: (this.driftConfig.chargeRates || {}).neutral || 1,
      controlState: 'neutral',
      brakeTimer: 0
    });
  }
  
  releaseDrift({ awardBoost = true } = {}) {
    if (awardBoost && this.driftState.stage >= 0) {
      const stage = this.driftConfig.stages[this.driftState.stage];
      if (stage) {
        this.boostState.timer = stage.duration;
        this.boostState.strength = stage.boostStrength;
      }
    } else if (!awardBoost) {
      this.boostState.timer = 0;
      this.boostState.strength = 0;
    }
    
    Object.assign(this.driftState, {
      active: false,
      pending: false,
      pendingTimer: 0,
      direction: 0,
      timer: 0,
      stage: -1,
      turnMultiplier: 1,
      chargeRate: 1,
      controlState: 'neutral',
      brakeTimer: 0
    });
  }
  
  updateDriftControl(steerInput) {
    if (!this.driftState.active) {
      this.driftState.turnMultiplier = 1;
      this.driftState.chargeRate = 1;
      this.driftState.controlState = 'neutral';
      return;
    }
    
    const dir = this.driftState.direction || 1;
    const alignment = steerInput * dir;
    const turnConfig = this.driftConfig.turnMultipliers || {};
    const chargeConfig = this.driftConfig.chargeRates || {};
    
    let controlState = 'neutral';
    let turnMultiplier = turnConfig.neutral || 1;
    let chargeRate = chargeConfig.neutral || 1;
    
    if (alignment > 0) {
      controlState = 'tight';
      turnMultiplier = turnConfig.tight || 1.25;
      chargeRate = chargeConfig.tight || 1;
    } else if (alignment < 0) {
      controlState = 'shallow';
      turnMultiplier = turnConfig.shallow || 0.75;
      chargeRate = chargeConfig.shallow || 0.5;
    }
    
    this.driftState.turnMultiplier = turnMultiplier;
    this.driftState.chargeRate = chargeRate;
    this.driftState.controlState = controlState;
  }
  
  resolveDriftStage(time) {
    let stageIndex = -1;
    for (let i = 0; i < this.driftConfig.stages.length; i++) {
      if (time >= this.driftConfig.stages[i].time) stageIndex = i;
    }
    return stageIndex;
  }
  
  getDriftMinimumSpeed() {
    const maxSpeed = this.physicsConfig.maxSpeed || 120;
    const accelRate = this.physicsConfig.accelerationRate || 55;
    const drag = Math.max(0.0001, this.physicsConfig.dragCoefficient || 1.8);
    const theoreticalTopSpeed = accelRate / drag;
    const effectiveTopSpeed = Math.max(0, Math.min(maxSpeed, theoreticalTopSpeed));
    const ratio = this.driftConfig.minSpeedRatio;
    const ratioSpeed = typeof ratio === 'number' ? effectiveTopSpeed * ratio : 0;
    const explicitMin = this.driftConfig.minSpeed || 0;
    let required = Math.max(ratioSpeed, explicitMin);
    const safetyCap = effectiveTopSpeed * 0.9;
    if (effectiveTopSpeed > 0) required = Math.min(required, safetyCap);
    return required;
  }
  
  updateVisuals(delta) {
    const damp = (current, target, smoothing, delta) => {
      const smooth = THREE.MathUtils.clamp(smoothing || 0.001, 1e-4, 0.999);
      const factor = 1 - Math.pow(smooth, delta);
      return THREE.MathUtils.lerp(current, target, factor);
    };
    
    const turnBias = this.driftState.turnMultiplier || 1;
    const yawTarget = this.driftState.active ? (this.driftState.direction * (this.driftConfig.yawOffset || 0.25) * turnBias) : 0;
    const leanStrength = Math.min(turnBias, 1.4);
    const leanTarget = this.driftState.active ? (-this.driftState.direction * (this.driftConfig.maxLean || 0.15) * leanStrength) : 0;
    
    this.driftState.yawOffset = damp(this.driftState.yawOffset, yawTarget, this.driftConfig.yawSmoothing || 0.001, delta);
    this.driftState.leanAngle = damp(this.driftState.leanAngle, leanTarget, this.driftConfig.leanSmoothing || 0.001, delta);
    
    this.group.rotation.y = this.heading + this.driftState.yawOffset;
    this.group.rotation.z = this.driftState.leanAngle;
  }
  
  updateStatusText() {
    if (!this.statusElement) return;
    
    if (this.boostState.timer > 0) {
      this.statusElement.textContent = 'Mini-Turbo: boost!';
      this.statusElement.style.color = '#80ff8c';
      return;
    }
    
    if (this.driftState.active) {
      if (this.driftState.stage >= 0) {
        const stage = this.driftConfig.stages[this.driftState.stage];
        if (stage) {
          this.statusElement.textContent = `Mini-Turbo: ${stage.name}`;
          this.statusElement.style.color = stage.color;
          return;
        }
      }
      this.statusElement.textContent = 'Mini-Turbo: charging';
      this.statusElement.style.color = '#b0b6c9';
      return;
    }
    
    this.statusElement.textContent = 'Mini-Turbo: none';
    this.statusElement.style.color = '#ffffff';
  }
}

export default Vehicle;
