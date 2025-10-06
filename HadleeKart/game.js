import { ItemManager } from './items.js';
import { TrackLoader } from './trackLoader.js';
import { CheckpointManager } from './checkpoint.js';

let internal = null;

export async function initGame({ THREE, GLTFLoader, scene, camera, renderer, config, container }) {
  if (!THREE) throw new Error('THREE not provided');
  if (!GLTFLoader) throw new Error('GLTFLoader not provided');
  if (!scene) throw new Error('scene not provided');
  if (!camera) throw new Error('camera not provided');
  if (!renderer) throw new Error('renderer not provided');
  const CONFIG = config;
  if (!CONFIG) throw new Error('config missing');

  container = container || document.getElementById('game-container');
  if (!container) throw new Error('Game container not found');

  // Overlay / UI
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = [
    '<strong>HadleeKart - Spungilious Speedway</strong>',
    'W / ArrowUp: accelerate',
    'S / ArrowDown: brake / reverse',
    'A / D or Arrow keys: steer',
    'Shift: hop and drift',
    'E: use item',
    'R: cycle random item (debug)',
  ].join('<br>');
  container.appendChild(overlay);

  const statusLine = document.createElement('div');
  statusLine.style.marginTop = '0.5rem';
  statusLine.textContent = 'Mini-Turbo: none';
  overlay.appendChild(statusLine);

  const itemLine = document.createElement('div');
  itemLine.style.marginTop = '0.25rem';
  itemLine.textContent = 'Item: None';
  overlay.appendChild(itemLine);

  const lapLine = document.createElement('div');
  lapLine.style.marginTop = '0.25rem';
  lapLine.textContent = 'Lap: 1/3 | Checkpoints: 0/0';
  overlay.appendChild(lapLine);

  const respawnLine = document.createElement('div');
  respawnLine.style.marginTop = '0.25rem';
  respawnLine.textContent = 'Press T to respawn';
  overlay.appendChild(respawnLine);

  const rendererConfig = CONFIG.renderer || {};
  const pixelRatioCap = rendererConfig.maxPixelRatio ?? 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
  renderer.shadowMap.enabled = true;

  const skyConfig = CONFIG.sky || {};
  scene.background = new THREE.Color(skyConfig.color ?? 0x10141f);

  const cameraConfig = CONFIG.camera || {};
  camera.position.set(0, cameraConfig.followHeight ?? 5, cameraConfig.followDistance ?? 10);

  // Lighting
  const lightingConfig = CONFIG.lighting || {};
  const ambient = new THREE.HemisphereLight(
    lightingConfig.ambientSky ?? 0xcfd9ff,
    lightingConfig.ambientGround ?? 0x060608,
    lightingConfig.ambientIntensity ?? 0.6,
  );
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(
    lightingConfig.sunColor ?? 0xffffff,
    lightingConfig.sunIntensity ?? 0.8,
  );
  const sunPos = lightingConfig.sunPosition || { x: 20, y: 40, z: 10 };
  sun.position.set(sunPos.x, sunPos.y, sunPos.z);
  sun.castShadow = true;
  const shadowSize = lightingConfig.shadowMapSize ?? 1024;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -200;
  sun.shadow.camera.right = 200;
  sun.shadow.camera.top = 200;
  sun.shadow.camera.bottom = -200;
  sun.shadow.camera.far = 500;
  scene.add(sun);

  // Load custom track
  console.log('[Game] Loading track...');
  const trackLoader = new TrackLoader({ THREE, GLTFLoader, scene });
  const trackData = await trackLoader.load('./assets/track/spungilious_speedway/Spungilious Speedway.glb');
  
  // Initialize checkpoint manager
  const checkpointManager = new CheckpointManager(
    trackData.checkpoints, 
    trackData.dropoffPoints,
    trackData.startPositions
  );
  checkpointManager.onCheckpointPass = (checkpoint, passed, total) => {
    console.log(`Checkpoint ${checkpoint.index} passed! (${passed}/${total})`);
  };
  checkpointManager.onLapComplete = (lap, time) => {
    console.log(`LAP ${lap} COMPLETE! Time: ${CheckpointManager.formatTime(time)}`);
  };
  checkpointManager.onRaceComplete = (totalTime, lapTimes) => {
    console.log('RACE FINISHED!', {
      total: CheckpointManager.formatTime(totalTime),
      laps: lapTimes.map(t => CheckpointManager.formatTime(t))
    });
  };

  // Sky dome
  const skyGeometry = new THREE.SphereGeometry(skyConfig.radius ?? 1600, 32, 32);
  const skyMaterial = new THREE.MeshBasicMaterial({ color: skyConfig.color ?? 0x0c0f16, side: THREE.BackSide });
  const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(skyDome);

  // Input state
  const input = { forward: false, backward: false, left: false, right: false, drift: false, driftJustPressed: false, respawn: false };
  const setKeyState = (event, state) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp': input.forward = state; break;
      case 'KeyS':
      case 'ArrowDown': input.backward = state; break;
      case 'KeyA':
      case 'ArrowLeft': input.left = state; break;
      case 'KeyD':
      case 'ArrowRight': input.right = state; break;
      case 'ShiftLeft':
      case 'ShiftRight':
        if (state && !input.drift) input.driftJustPressed = true;
        input.drift = state; break;
      case 'KeyE':
        if (state && internal?.vehicle?.itemManager) internal.vehicle.itemManager.use();
        break;
      case 'KeyR':
        if (state && internal?.vehicle?.itemManager) internal.vehicle.itemManager.cycleExample();
        break;
      case 'KeyT':
        if (state) input.respawn = true;
        break;
      default: break;
    }
  };
  window.addEventListener('keydown', e => setKeyState(e, true));
  window.addEventListener('keyup', e => setKeyState(e, false));

  const upVector = new THREE.Vector3(0, 1, 0);
  const damp = (current, target, smoothing, delta) => {
    const smooth = THREE.MathUtils.clamp(smoothing ?? 0.001, 1e-4, 0.999);
    const factor = 1 - Math.pow(smooth, delta);
    return THREE.MathUtils.lerp(current, target, factor);
  };

  class Vehicle {
    constructor(statusElement, lapElement, trackData, checkpointMgr, trackLoader) {
      this.statusElement = statusElement;
      this.lapElement = lapElement;
      this.trackData = trackData;
      this.checkpointManager = checkpointMgr;
      this.trackLoader = trackLoader;
      this.vehicleConfig = CONFIG.vehicle || {};
      this.physicsConfig = this.vehicleConfig.physics || {};
      this.driftConfig = CONFIG.drift || { stages: [] };
      this.itemManager = new ItemManager({
        onUpdateUI: (ui) => {
          const parts = [];
          parts.push(ui.holding ? `Holding: ${ui.holding}` : 'Holding: None');
          if (ui.uses !== undefined) parts.push(`Uses: ${ui.uses}`);
          if (ui.boost) parts.push(`Boost: ${ui.boost}s`);
          if (ui.window) parts.push(`Window: ${ui.window}s`);
          if (ui.star) parts.push(`Star: ${ui.star}s`);
          if (ui.boo) parts.push(`Boo: ${ui.boo}s`);
          if (ui.bullet) parts.push(`Bullet: ${ui.bullet}s`);
          itemLine.textContent = 'Item - ' + parts.join(' | ');
        }
      });

      this.group = new THREE.Group();

      // Load Teddy Buggy GLB model
      const loader = new GLTFLoader();
      loader.load(
        './assets/kart/teddy_buggy.glb',
        (gltf) => {
          // Enable shadows for all meshes in the model
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          gltf.scene.scale.set(0.3, 0.3, 0.3);
          this.group.add(gltf.scene);
        },
        undefined,
        (error) => {
          console.error('Error loading kart model:', error);
          // Fallback to a simple box if model fails to load
          const fallbackGeometry = new THREE.BoxGeometry(1.8, 0.9, 3.2);
          const fallbackMaterial = new THREE.MeshStandardMaterial({ color: 0xff5733 });
          const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
          fallbackMesh.castShadow = true;
          fallbackMesh.position.y = 0.6;
          this.group.add(fallbackMesh);
        }
      );

      // Hitbox dimensions (exact dimensions from Blender export: 9.5×17.5×9.5m scaled at 0.3)
      // These will be used for collision detection
      this.hitboxWidth = 2.85;   // X dimension (9.5m × 0.3)
      this.hitboxHeight = 2.85;  // Y dimension (9.5m × 0.3 - vertical)
      this.hitboxLength = 5.25;  // Z dimension (17.5m × 0.3 - forward/back)

      // Spawn at Start.0
      const spawnPos = trackData.startPositions[0];
      console.log('[Vehicle] Spawn position:', spawnPos);
      console.log('[Vehicle] All start positions:', trackData.startPositions.map(p => ({ index: p.index, x: p.position.x, y: p.position.y, z: p.position.z })));
      if (spawnPos) {
        // Use the X and Z from spawn position, but calculate Y smartly
        this.group.position.set(spawnPos.position.x, 0, spawnPos.position.z);
        
        // Get the actual ground height at this position
        const groundCheck = this.trackLoader.getGroundHeight(this.group.position);
        
        if (groundCheck.hit) {
          // Spawn at ground level plus half the kart's hitbox height
          // This places the kart's bottom at ground level
          this.group.position.y = groundCheck.height + (this.hitboxHeight * 0.5);
          console.log('[Vehicle] Ground detected at Y:', groundCheck.height.toFixed(2), 
                      'spawning kart at Y:', this.group.position.y.toFixed(2));
        } else {
          // Fallback to spawn position Y if no ground found
          this.group.position.y = spawnPos.position.y + this.hitboxHeight * 0.5;
          console.warn('[Vehicle] No ground detected, using spawn Y + offset');
        }
        
        this.heading = spawnPos.rotation;
        console.log('[Vehicle] Final spawn position:', this.group.position.x.toFixed(2), 
                    this.group.position.y.toFixed(2), this.group.position.z.toFixed(2));
      } else {
        this.group.position.set(0, 0, 0);
        this.heading = 0;
      }
      scene.add(this.group);

      this.velocity = new THREE.Vector3();
      this.verticalVelocity = 0;
      this.lastSteer = 0;

      // Falloff detection
      this.falloffTimer = 0;
      this.falloffThreshold = -10; // Y position below which we respawn

      this.driftState = { active: false, direction: 0, timer: 0, stage: -1, yawOffset: 0, leanAngle: 0, pending: false, turnMultiplier: 1, chargeRate: 1, controlState: 'neutral', brakeTimer: 0 };
      this.boostState = { timer: 0, strength: 0 };
      this.isGrounded = true;
      this.groundThreshold = 0.02;
      
      // Checkpoint cooldown to prevent spam
      this.checkpointCooldown = 0;
      
      this.updateStatusText();
    }

    resolveDriftStage(time) {
      let stageIndex = -1;
      for (let i = 0; i < this.driftConfig.stages.length; i += 1) {
        if (time >= this.driftConfig.stages[i].time) stageIndex = i;
      }
      return stageIndex;
    }
    getDriftMinimumSpeed() {
      const maxSpeed = this.physicsConfig.maxSpeed ?? 120;
      const accelRate = this.physicsConfig.accelerationRate ?? 55;
      const drag = Math.max(0.0001, this.physicsConfig.dragCoefficient ?? 1.8);
      const theoreticalTopSpeed = accelRate / drag;
      const effectiveTopSpeed = Math.max(0, Math.min(maxSpeed, theoreticalTopSpeed));
      const ratio = this.driftConfig.minSpeedRatio;
      const ratioSpeed = typeof ratio === 'number' ? effectiveTopSpeed * ratio : 0;
      const explicitMin = this.driftConfig.minSpeed ?? 0;
      let required = Math.max(ratioSpeed, explicitMin);
      const safetyCap = effectiveTopSpeed * 0.9;
      if (effectiveTopSpeed > 0) required = Math.min(required, safetyCap);
      return required;
    }
    updateDriftControl(steerInput) {
      if (!this.driftState.active) { this.driftState.turnMultiplier = 1; this.driftState.chargeRate = 1; this.driftState.controlState = 'neutral'; return; }
      const dir = this.driftState.direction || 1;
      const alignment = steerInput * dir;
      const turnConfig = this.driftConfig.turnMultipliers || {};
      const chargeConfig = this.driftConfig.chargeRates || {};
      let controlState = 'neutral';
      let turnMultiplier = turnConfig.neutral ?? 1;
      let chargeRate = chargeConfig.neutral ?? 1;
      if (alignment > 0) { controlState = 'tight'; turnMultiplier = turnConfig.tight ?? 1.25; chargeRate = chargeConfig.tight ?? 1; }
      else if (alignment < 0) { controlState = 'shallow'; turnMultiplier = turnConfig.shallow ?? 0.75; chargeRate = chargeConfig.shallow ?? 0.5; }
      this.driftState.turnMultiplier = turnMultiplier; this.driftState.chargeRate = chargeRate; this.driftState.controlState = controlState;
    }
    startDrift(direction) {
      const dir = Math.sign(direction); if (dir === 0) return;
      Object.assign(this.driftState, { active: true, pending: false, direction: dir, timer: 0, stage: -1, turnMultiplier: (this.driftConfig.turnMultipliers || {}).neutral ?? 1, chargeRate: (this.driftConfig.chargeRates || {}).neutral ?? 1, controlState: 'neutral', brakeTimer: 0 });
    }
    releaseDrift({ awardBoost = true } = {}) {
      if (awardBoost && this.driftState.stage >= 0) {
        const stage = this.driftConfig.stages[this.driftState.stage];
        if (stage) { this.boostState.timer = stage.duration; this.boostState.strength = stage.boostStrength; }
      } else if (!awardBoost) { this.boostState.timer = 0; this.boostState.strength = 0; }
      Object.assign(this.driftState, { active: false, pending: false, direction: 0, timer: 0, stage: -1, turnMultiplier: 1, chargeRate: 1, controlState: 'neutral', brakeTimer: 0 });
    }
    updateStatusText() {
      if (!this.statusElement) return;
      if (this.boostState.timer > 0) { this.statusElement.textContent = 'Mini-Turbo: boost!'; this.statusElement.style.color = '#80ff8c'; return; }
      if (this.driftState.active) {
        if (this.driftState.stage >= 0) {
          const stage = this.driftConfig.stages[this.driftState.stage];
          if (stage) { this.statusElement.textContent = `Mini-Turbo: ${stage.name}`; this.statusElement.style.color = stage.color; return; }
        }
        this.statusElement.textContent = 'Mini-Turbo: charging'; this.statusElement.style.color = '#b0b6c9'; return;
      }
      this.statusElement.textContent = 'Mini-Turbo: none'; this.statusElement.style.color = '#ffffff';
    }
    handleDriftPrePhysics(wasGrounded) { if (!input.driftJustPressed) return; if (wasGrounded) this.verticalVelocity = this.physicsConfig.hopVelocity ?? 5; this.driftState.pending = true; }
    handleDriftPostPhysics(delta, speed, forwardSpeed, isGrounded, landed) {
      if (!input.drift) { if (this.driftState.active) this.releaseDrift(); this.driftState.pending = false; return; }
      if (this.driftState.active) { if (speed < (this.driftConfig.cancelSpeed ?? 5) || forwardSpeed <= 0.01) { this.releaseDrift({ awardBoost: false }); return; } this.driftState.timer += delta * (this.driftState.chargeRate ?? 1); const stageIndex = this.resolveDriftStage(this.driftState.timer); if (stageIndex !== this.driftState.stage) this.driftState.stage = stageIndex; return; }
      if (!this.driftState.pending) return;
      const directionInput = (input.left ? 1 : 0) - (input.right ? 1 : 0);
      const minSpeed = this.getDriftMinimumSpeed();
      const readyForDrift = isGrounded && forwardSpeed >= minSpeed && directionInput !== 0;
      if (readyForDrift && (landed || this.verticalVelocity === 0)) this.startDrift(directionInput);
    }
    applyBoost(acceleration, forwardVector, delta) {
      if (this.boostState.timer > 0) { acceleration.addScaledVector(forwardVector, this.boostState.strength); this.boostState.timer = Math.max(0, this.boostState.timer - delta); if (this.boostState.timer === 0) this.boostState.strength = 0; }
    }
    updateVerticalMovement(delta) {
      const gravity = this.physicsConfig.gravity ?? 25;
      const snapGravity = this.physicsConfig.groundSnapGravity ?? 40;
      
      // Get ground height using raycasting
      const groundCheck = this.trackLoader.getGroundHeight(this.group.position);
      
      if (groundCheck.hit) {
        const groundHeight = groundCheck.height;
        const distanceToGround = this.group.position.y - groundHeight;
        
        // Only apply ground physics if we're above or very close to the ground
        // Don't snap up if we're significantly below (prevents teleporting through track)
        const maxSnapDistance = 2.0; // Maximum distance we'll snap to ground
        
        if (distanceToGround > -maxSnapDistance) {
          // If above ground, apply gravity
          if (distanceToGround > 0.1 || this.verticalVelocity > 0) {
            this.verticalVelocity -= gravity * delta;
          }
          
          // Strong snap when close to ground and falling
          if (distanceToGround < 0.5 && distanceToGround > 0 && this.verticalVelocity < 0) {
            this.verticalVelocity -= snapGravity * delta;
          }
          
          // Update position
          this.group.position.y += this.verticalVelocity * delta;
          
          // Snap to ground if touching or slightly below (but not way below)
          if (this.group.position.y <= groundHeight && this.group.position.y > groundHeight - 0.5) {
            this.group.position.y = groundHeight;
            if (this.verticalVelocity < 0) {
              this.verticalVelocity = 0;
            }
          }
        } else {
          // We're way below the track - just fall normally
          this.verticalVelocity -= gravity * delta;
          this.group.position.y += this.verticalVelocity * delta;
        }
      } else {
        // No ground found - falling off track
        this.verticalVelocity -= gravity * delta;
        this.group.position.y += this.verticalVelocity * delta;
      }
      
      // Store the ground check result for isGrounded calculation
      this.lastGroundCheck = groundCheck;
    }
    resolveTrackCollisions(proposedPosition) {
      // THREE is available in outer scope, not a property of Vehicle
      
      // Check wall collisions using Box3
      const wallCollision = this.trackLoader.checkWallCollision(proposedPosition, {
        width: this.hitboxWidth,
        height: this.hitboxHeight,
        length: this.hitboxLength
      });
      
      let finalPosition = proposedPosition.clone();
      
      if (wallCollision.colliding) {
        // Apply pushback from walls
        finalPosition.add(wallCollision.pushback);
        
        // Calculate bounce velocity
        const pushbackNormal = wallCollision.pushback.clone().normalize();
        const velocityDot = this.velocity.dot(pushbackNormal);
        
        if (velocityDot < 0) {
          // Reflect velocity
          const wallConfig = this.physicsConfig.wallImpact || {};
          const restitution = wallConfig.restitution ?? 0.25;
          const tangentRetention = wallConfig.tangentRetention ?? 0.85;
          
          // Split velocity into normal and tangent components
          const normalVelocity = pushbackNormal.clone().multiplyScalar(velocityDot);
          const tangentVelocity = this.velocity.clone().sub(normalVelocity);
          
          // Apply bounce and friction
          const reflected = pushbackNormal.clone().multiplyScalar(-velocityDot * restitution);
          const retained = tangentVelocity.multiplyScalar(tangentRetention);
          
          this.velocity.copy(reflected.add(retained));
          
          // Speed loss on impact
          const directness = Math.abs(velocityDot) / (this.velocity.length() + 0.001);
          const speedLoss = THREE.MathUtils.lerp(0.1, 0.5, directness);
          this.velocity.multiplyScalar(1 - speedLoss);
        }
        
        return {
          position: finalPosition,
          hitWall: true,
          severity: Math.abs(velocityDot) / (this.velocity.length() + 0.001),
          cancelDrift: Math.abs(velocityDot) > 0.65
        };
      }
      
      return {
        position: finalPosition,
        hitWall: false,
        severity: 0,
        cancelDrift: false
      };
    }
    
    respawn() {
      const respawnPoint = this.checkpointManager.getRespawnPoint();
      
      // Set X and Z position
      this.group.position.set(respawnPoint.position.x, 0, respawnPoint.position.z);
      
      // Get the actual ground height at this position
      const groundCheck = this.trackLoader.getGroundHeight(this.group.position);
      
      if (groundCheck.hit) {
        // Spawn at ground level plus half the kart's hitbox height
        // This places the kart's bottom at ground level
        this.group.position.y = groundCheck.height + (this.hitboxHeight * 0.5);
        console.log('[Vehicle] Respawn ground at Y:', groundCheck.height.toFixed(2), 
                    'placing kart at Y:', this.group.position.y.toFixed(2));
      } else {
        // Fallback to respawn point Y if no ground found
        this.group.position.y = respawnPoint.position.y + this.hitboxHeight * 0.5;
        console.warn('[Vehicle] No ground detected at respawn, using position Y + offset');
      }
      
      this.heading = respawnPoint.rotation;
      this.velocity.set(0, 0, 0);
      this.verticalVelocity = 0;
      this.driftState.active = false;
      this.boostState.timer = 0;
      
      // Set cooldown to prevent immediately triggering checkpoint again
      this.checkpointCooldown = 1.0; // 1 second cooldown
      
      console.log('[Vehicle] Respawned at checkpoint', {
        pos: { x: this.group.position.x.toFixed(2), y: this.group.position.y.toFixed(2), z: this.group.position.z.toFixed(2) },
        heading: this.heading.toFixed(2)
      });
    }
    updateVisuals(delta) {
      const turnBias = this.driftState.turnMultiplier ?? 1; const yawTarget = this.driftState.active ? (this.driftState.direction * (this.driftConfig.yawOffset ?? 0.25) * turnBias) : 0; const leanStrength = Math.min(turnBias, 1.4); const leanTarget = this.driftState.active ? (-this.driftState.direction * (this.driftConfig.maxLean ?? 0.15) * leanStrength) : 0;
      this.driftState.yawOffset = damp(this.driftState.yawOffset, yawTarget, this.driftConfig.yawSmoothing ?? 0.001, delta);
      this.driftState.leanAngle = damp(this.driftState.leanAngle, leanTarget, this.driftConfig.leanSmoothing ?? 0.001, delta);
      this.group.rotation.y = this.heading + this.driftState.yawOffset; this.group.rotation.z = this.driftState.leanAngle;
    }
    update(delta) {
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
        if (this.falloffTimer > 0.5) { // Grace period
          this.respawn();
          this.falloffTimer = 0;
        }
      } else {
        this.falloffTimer = 0;
      }
      
      const forwardVector = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading)).normalize();
      const rightVector = new THREE.Vector3().crossVectors(upVector, forwardVector).normalize();
      const wasGrounded = this.isGrounded; const forwardSpeed = this.velocity.dot(forwardVector); const steerInput = (input.left ? 1 : 0) - (input.right ? 1 : 0); if (steerInput !== 0) this.lastSteer = steerInput;
      this.handleDriftPrePhysics(wasGrounded);
      const dualInput = input.forward && input.backward; let tractionMode = this.driftState.active ? 'drift' : (dualInput ? 'lowTraction' : 'normal');
      if (this.driftState.active) { this.updateDriftControl(steerInput); if (input.forward && input.backward) { this.driftState.brakeTimer += delta; if (this.driftState.brakeTimer >= (this.driftConfig.brakeCancelTime ?? 1)) this.releaseDrift({ awardBoost: false }); } else { this.driftState.brakeTimer = 0; } }
      if (!this.driftState.active) { this.driftState.turnMultiplier = 1; this.driftState.chargeRate = 1; this.driftState.controlState = 'neutral'; this.driftState.brakeTimer = 0; }
      const acceleration = new THREE.Vector3(); const accelRate = this.physicsConfig.accelerationRate ?? 55; const brakeStrength = this.physicsConfig.brakeStrength ?? 70; const reverseFactor = this.physicsConfig.reverseAccelerationFactor ?? 0.7;
      if (input.forward && !input.backward) { if (forwardSpeed < 0) acceleration.addScaledVector(forwardVector, brakeStrength); else acceleration.addScaledVector(forwardVector, accelRate); }
      else if (input.backward && !input.forward) { if (forwardSpeed > 0.5) acceleration.addScaledVector(forwardVector, -brakeStrength); else acceleration.addScaledVector(forwardVector, -accelRate * reverseFactor); }
      else if (dualInput) { const dualFactor = this.physicsConfig.dualInputForwardFactor ?? 0.3; acceleration.addScaledVector(forwardVector, accelRate * dualFactor); }
      if (this.driftState.active) { const driftDirection = this.driftState.direction; if (driftDirection !== 0) { const lateralForce = (this.driftConfig.lateralForce ?? 30) * (this.driftState.turnMultiplier ?? 1); acceleration.addScaledVector(rightVector, -driftDirection * lateralForce); } }
      const dragCoefficient = this.physicsConfig.dragCoefficient ?? 1.8; acceleration.addScaledVector(this.velocity, -dragCoefficient);
      if (!input.forward && !input.backward && this.boostState.timer <= 0) { const rollResistance = this.physicsConfig.naturalDeceleration ?? 12; acceleration.addScaledVector(this.velocity, -rollResistance); }
      this.applyBoost(acceleration, forwardVector, delta);
      this.velocity.addScaledVector(acceleration, delta);
      const maxSpeed = this.physicsConfig.maxSpeed ?? 120; const reverseSpeedFactor = this.physicsConfig.reverseSpeedFactor ?? 0.75;
      let adjustedForwardSpeed = this.velocity.dot(forwardVector); const lateralSpeed = this.velocity.dot(rightVector);
      if (adjustedForwardSpeed > maxSpeed) adjustedForwardSpeed = maxSpeed;
      if (adjustedForwardSpeed < -maxSpeed * reverseSpeedFactor) adjustedForwardSpeed = -maxSpeed * reverseSpeedFactor;
      const forwardComponent = forwardVector.clone().multiplyScalar(adjustedForwardSpeed); const lateralComponent = rightVector.clone().multiplyScalar(lateralSpeed); this.velocity.copy(forwardComponent.add(lateralComponent));
      const retentionConfig = this.physicsConfig.lateralRetention || {}; let retention = retentionConfig.normal ?? 0.2; if (tractionMode === 'lowTraction') retention = retentionConfig.lowTraction ?? 0.45; else if (tractionMode === 'drift') retention = retentionConfig.drift ?? 0.6;
      const adjustedLateral = rightVector.clone().multiplyScalar(this.velocity.dot(rightVector) * retention); const adjustedForward = forwardVector.clone().multiplyScalar(this.velocity.dot(forwardVector)); this.velocity.copy(adjustedForward.add(adjustedLateral));
      const absForwardSpeed = Math.abs(adjustedForwardSpeed); const speedRatio = THREE.MathUtils.clamp(absForwardSpeed / maxSpeed, 0, 1); let turnRate = this.physicsConfig.turnRate ?? Math.PI; const lowSpeedBoost = this.physicsConfig.lowSpeedTurnBoost ?? 1.6; if (absForwardSpeed < maxSpeed) turnRate *= THREE.MathUtils.lerp(lowSpeedBoost, 1, speedRatio); if (tractionMode === 'lowTraction') turnRate *= this.physicsConfig.dualInputTurnMultiplier ?? 0.7; if (adjustedForwardSpeed < 0) turnRate *= this.physicsConfig.reverseTurnMultiplier ?? 1.1;
      const steerSign = adjustedForwardSpeed >= 0 ? 1 : -1; const driftDirection = this.driftState.direction;
      if (this.driftState.active && driftDirection !== 0) { const driftMultiplier = (this.physicsConfig.driftTurnMultiplier ?? 1.2) * (this.driftState.turnMultiplier ?? 1); this.heading += driftDirection * turnRate * driftMultiplier * delta; }
      else if (steerInput !== 0) { this.heading += steerInput * turnRate * delta * steerSign; }
      const proposedPosition = this.group.position.clone().addScaledVector(this.velocity, delta); const wallResult = this.resolveTrackCollisions(proposedPosition); this.group.position.copy(wallResult.position);
      if (wallResult.hitWall && wallResult.cancelDrift && this.driftState.active) this.releaseDrift({ awardBoost: false });
      this.updateVerticalMovement(delta);
      
      // Check if grounded based on actual distance to ground
      // IMPORTANT: Ground must be BELOW us (groundHeight <= our Y position)
      // This prevents "grounded" state when underneath elevated track sections
      const isGrounded = this.lastGroundCheck && this.lastGroundCheck.hit && 
                         this.lastGroundCheck.height <= this.group.position.y &&
                         (this.group.position.y - this.lastGroundCheck.height) < 0.1;
      const landed = isGrounded && !wasGrounded; 
      this.isGrounded = isGrounded;
      
      const currentSpeed = this.velocity.length(); this.handleDriftPostPhysics(delta, currentSpeed, adjustedForwardSpeed, isGrounded, landed);
      
      // Update checkpoint manager (only if cooldown expired)
      if (this.checkpointCooldown <= 0) {
        this.checkpointManager.update(this.group.position);
      }
      
      // Update lap UI
      const status = this.checkpointManager.getStatus();
      if (this.lapElement) {
        this.lapElement.textContent = `Lap: ${status.currentLap}/${status.totalLaps} | Checkpoints: ${status.checkpointsPassed}/${status.totalCheckpoints}`;
      }
      
      this.updateVisuals(delta); this.updateStatusText();
      if (this.itemManager) { this.itemManager.update(delta); const mult = this.itemManager.getSpeedMultiplier(); if (mult !== 1) { const forwardVector2 = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading)).normalize(); const forwardSpeed2 = this.velocity.dot(forwardVector2); const boosted = forwardSpeed2 * mult; const maxSpeed2 = this.physicsConfig.maxSpeed ?? 120; const clamped = Math.min(boosted, maxSpeed2 * 1.5); const forwardComponent2 = forwardVector2.clone().multiplyScalar(clamped); const rightVector2 = new THREE.Vector3().crossVectors(upVector, forwardVector2).normalize(); const lateralComponent2 = rightVector2.clone().multiplyScalar(this.velocity.dot(rightVector2)); this.velocity.copy(forwardComponent2.add(lateralComponent2)); } }
      input.driftJustPressed = false;
    }
  }

  const vehicle = new Vehicle(statusLine, lapLine, trackData, checkpointManager, trackLoader);
  
  // Start the race
  checkpointManager.startRace();
  
  const targetCameraPosition = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const clock = new THREE.Clock();
  const updateCamera = (delta) => {
    const cameraConfig2 = CONFIG.camera || {};
    const followDistance = cameraConfig2.followDistance ?? 8;
    const followHeight = cameraConfig2.followHeight ?? 3.5;
    const lookAhead = cameraConfig2.lookAhead ?? 6;
    const lookHeight = cameraConfig2.lookHeight ?? 1.5;
    const smoothingBase = THREE.MathUtils.clamp(cameraConfig2.smoothing ?? 0.001, 1e-4, 0.999);
    const forwardVector = new THREE.Vector3(Math.sin(vehicle.heading), 0, Math.cos(vehicle.heading));
    const cameraOffset = forwardVector.clone().multiplyScalar(-followDistance); cameraOffset.y += followHeight;
    targetCameraPosition.copy(vehicle.group.position).add(cameraOffset);
    const lerpFactor = 1 - Math.pow(smoothingBase, delta); camera.position.lerp(targetCameraPosition, lerpFactor);
    lookTarget.copy(vehicle.group.position).addScaledVector(forwardVector, lookAhead); lookTarget.y += lookHeight; camera.lookAt(lookTarget);
  };

  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);

  internal = { THREE, scene, camera, renderer, vehicle, clock, updateCamera, trackLoader };
  return { vehicle, trackData, checkpointManager };
}

export function updateGame() {
  if (!internal) return;
  const { vehicle, clock, updateCamera, renderer, scene, camera, trackLoader } = internal;
  const delta = Math.min(clock.getDelta(), 0.05);
  
  vehicle.update(delta);
  
  // Update item boxes
  if (trackLoader) {
    trackLoader.updateItemBoxes(delta);
    
    // Check item box collisions
    const collected = trackLoader.checkItemBoxCollision(vehicle.group.position, 2.5);
    if (collected.length > 0 && vehicle.itemManager) {
      // Give a random item (for now)
      vehicle.itemManager.cycleExample();
    }
  }
  
  updateCamera(delta);
  renderer.render(scene, camera);
}
