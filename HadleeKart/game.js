import { ItemManager } from './items.js';

let internal = null;

export function initGame({ THREE, GLTFLoader, scene, camera, renderer, config, container }) {
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
    '<strong>HadleeKart Prototype</strong>',
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
  scene.add(sun);

  // Track & environment
  const trackConfig = CONFIG.track || {};
  const trackWidth = trackConfig.width ?? 24;
  const trackLength = trackConfig.length ?? 2000;

  const trackSurface = trackConfig.surface || {};
  const trackMaterial = new THREE.MeshStandardMaterial({
    color: trackSurface.color ?? 0x1f2933,
    roughness: trackSurface.roughness ?? 0.8,
    metalness: trackSurface.metalness ?? 0.1,
  });
  const trackGeometry = new THREE.PlaneGeometry(trackWidth, trackLength, 20, 200);
  const track = new THREE.Mesh(trackGeometry, trackMaterial);
  track.rotation.x = -Math.PI / 2;
  track.receiveShadow = true;
  scene.add(track);

  const centerLineConfig = trackConfig.centerLine || {};
  const centerLineMaterial = new THREE.MeshBasicMaterial({ color: centerLineConfig.color ?? 0xf9d342 });
  const centerLineGeometry = new THREE.PlaneGeometry(centerLineConfig.width ?? 0.3, trackLength);
  const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
  centerLine.rotation.x = -Math.PI / 2;
  centerLine.position.y = 0.01;
  scene.add(centerLine);

  const guardrailConfig = trackConfig.guardrail || {};
  const buildGuardrail = (direction) => {
    const thickness = guardrailConfig.thickness ?? 1;
    const height = guardrailConfig.height ?? 2.5;
    const inset = trackConfig.guardrailInset ?? 1.5;
    const railGeometry = new THREE.BoxGeometry(thickness, height, trackLength);
    const railMaterial = new THREE.MeshStandardMaterial({
      color: guardrailConfig.color ?? 0x35435a,
      roughness: guardrailConfig.roughness ?? 0.5,
    });
    const rail = new THREE.Mesh(railGeometry, railMaterial);
    const xOffset = direction * (trackWidth / 2 - inset);
    rail.position.set(xOffset, height / 2, 0);
    rail.castShadow = true;
    rail.receiveShadow = true;
    scene.add(rail);
  };
  buildGuardrail(1);
  buildGuardrail(-1);

  const skyGeometry = new THREE.SphereGeometry(skyConfig.radius ?? 1600, 32, 32);
  const skyMaterial = new THREE.MeshBasicMaterial({ color: skyConfig.color ?? 0x0c0f16, side: THREE.BackSide });
  const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(skyDome);

  // Input state
  const input = { forward: false, backward: false, left: false, right: false, drift: false, driftJustPressed: false };
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
    constructor(statusElement) {
      this.statusElement = statusElement;
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

      const spawnOffset = this.vehicleConfig.spawnZOffset ?? 50;
      this.group.position.set(0, 0, -trackLength / 2 + spawnOffset);
      scene.add(this.group);

      this.heading = 0;
      this.velocity = new THREE.Vector3();
      this.verticalVelocity = 0;
      this.lastSteer = 0;

      this.bounds = {
        halfWidth: trackWidth * 0.5 - (trackConfig.guardrailInset ?? 1.5) - 0.2,
        halfLength: trackLength * 0.5 - 12,
      };

      this.driftState = { active: false, direction: 0, timer: 0, stage: -1, yawOffset: 0, leanAngle: 0, pending: false, turnMultiplier: 1, chargeRate: 1, controlState: 'neutral', brakeTimer: 0 };
      this.boostState = { timer: 0, strength: 0 };
      this.isGrounded = true;
      this.groundThreshold = 0.02;
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
      const gravity = this.physicsConfig.gravity ?? 25; const snapGravity = this.physicsConfig.groundSnapGravity ?? 40;
      if (this.group.position.y > 0 || this.verticalVelocity > 0) this.verticalVelocity -= gravity * delta;
      if (this.group.position.y < 0.25 && this.verticalVelocity < 0) this.verticalVelocity -= snapGravity * delta;
      this.group.position.y += this.verticalVelocity * delta;
      if (this.group.position.y <= 0) { this.group.position.y = 0; if (this.verticalVelocity < 0) this.verticalVelocity = 0; }
    }
    resolveTrackCollisions(proposedPosition) {
      const finalPosition = proposedPosition.clone(); const normals = []; const epsilon = 0.01;
      // Edge-based collision: account for half the kart's dimensions
      const halfKartWidth = this.hitboxWidth / 2;
      const halfKartLength = this.hitboxLength / 2;
      
      if (proposedPosition.x + halfKartWidth > this.bounds.halfWidth) { finalPosition.x = this.bounds.halfWidth - halfKartWidth; normals.push(new THREE.Vector3(1, 0, 0)); }
      else if (proposedPosition.x - halfKartWidth < -this.bounds.halfWidth) { finalPosition.x = -this.bounds.halfWidth + halfKartWidth; normals.push(new THREE.Vector3(-1, 0, 0)); }
      if (proposedPosition.z + halfKartLength > this.bounds.halfLength) { finalPosition.z = this.bounds.halfLength - halfKartLength; normals.push(new THREE.Vector3(0, 0, 1)); }
      else if (proposedPosition.z - halfKartLength < -this.bounds.halfLength) { finalPosition.z = -this.bounds.halfLength + halfKartLength; normals.push(new THREE.Vector3(0, 0, -1)); }
      const wallConfig = this.physicsConfig.wallImpact || {}; const tangentRetentionBase = wallConfig.tangentRetention ?? 0.85; const restitutionBase = wallConfig.restitution ?? 0.25; const minSpeedLoss = wallConfig.minSpeedLoss ?? 0.1; const maxSpeedLoss = wallConfig.maxSpeedLoss ?? 0.5; const driftCancelDot = wallConfig.driftCancelDot ?? 0.65; const severeDot = wallConfig.severeDot ?? Math.min(0.95, driftCancelDot + 0.2);
      let maxSeverity = 0; let driftCancel = false;
      normals.forEach(outwardNormal => {
        const approachSpeed = this.velocity.dot(outwardNormal); if (approachSpeed <= 0) return;
        const speed = this.velocity.length(); const directness = speed > 0 ? THREE.MathUtils.clamp(approachSpeed / speed, 0, 1) : 0; maxSeverity = Math.max(maxSeverity, directness);
        const tangentRetention = 1 - (1 - tangentRetentionBase) * directness; const restitution = restitutionBase;
        const velocityNormal = outwardNormal.clone().multiplyScalar(approachSpeed); const velocityTangential = this.velocity.clone().sub(velocityNormal);
        const reflectedNormal = outwardNormal.clone().multiplyScalar(-approachSpeed * restitution); const adjustedTangential = velocityTangential.multiplyScalar(tangentRetention);
        this.velocity.copy(adjustedTangential.add(reflectedNormal));
        const speedLoss = THREE.MathUtils.lerp(minSpeedLoss, maxSpeedLoss, directness); this.velocity.multiplyScalar(Math.max(0, 1 - speedLoss));
        if (directness >= severeDot) this.velocity.multiplyScalar(0.85);
        finalPosition.add(outwardNormal.clone().multiplyScalar(-epsilon));
        if (directness >= driftCancelDot) driftCancel = true;
      });
      return { position: finalPosition, hitWall: normals.length > 0, severity: maxSeverity, cancelDrift: driftCancel };
    }
    updateVisuals(delta) {
      const turnBias = this.driftState.turnMultiplier ?? 1; const yawTarget = this.driftState.active ? (this.driftState.direction * (this.driftConfig.yawOffset ?? 0.25) * turnBias) : 0; const leanStrength = Math.min(turnBias, 1.4); const leanTarget = this.driftState.active ? (-this.driftState.direction * (this.driftConfig.maxLean ?? 0.15) * leanStrength) : 0;
      this.driftState.yawOffset = damp(this.driftState.yawOffset, yawTarget, this.driftConfig.yawSmoothing ?? 0.001, delta);
      this.driftState.leanAngle = damp(this.driftState.leanAngle, leanTarget, this.driftConfig.leanSmoothing ?? 0.001, delta);
      this.group.rotation.y = this.heading + this.driftState.yawOffset; this.group.rotation.z = this.driftState.leanAngle;
    }
    update(delta) {
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
      const isGrounded = this.group.position.y <= this.groundThreshold; const landed = isGrounded && !wasGrounded; this.isGrounded = isGrounded;
      const currentSpeed = this.velocity.length(); this.handleDriftPostPhysics(delta, currentSpeed, adjustedForwardSpeed, isGrounded, landed);
      this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, -this.bounds.halfWidth, this.bounds.halfWidth);
      this.group.position.z = THREE.MathUtils.clamp(this.group.position.z, -this.bounds.halfLength, this.bounds.halfLength);
      this.updateVisuals(delta); this.updateStatusText();
      if (this.itemManager) { this.itemManager.update(delta); const mult = this.itemManager.getSpeedMultiplier(); if (mult !== 1) { const forwardVector2 = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading)).normalize(); const forwardSpeed2 = this.velocity.dot(forwardVector2); const boosted = forwardSpeed2 * mult; const maxSpeed2 = this.physicsConfig.maxSpeed ?? 120; const clamped = Math.min(boosted, maxSpeed2 * 1.5); const forwardComponent2 = forwardVector2.clone().multiplyScalar(clamped); const rightVector2 = new THREE.Vector3().crossVectors(upVector, forwardVector2).normalize(); const lateralComponent2 = rightVector2.clone().multiplyScalar(this.velocity.dot(rightVector2)); this.velocity.copy(forwardComponent2.add(lateralComponent2)); } }
      input.driftJustPressed = false;
    }
  }

  const vehicle = new Vehicle(statusLine);
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

  internal = { THREE, scene, camera, renderer, vehicle, clock, updateCamera };
  return { vehicle };
}

export function updateGame() {
  if (!internal) return;
  const { vehicle, clock, updateCamera, renderer, scene, camera } = internal;
  const delta = Math.min(clock.getDelta(), 0.05);
  vehicle.update(delta);
  updateCamera(delta);
  renderer.render(scene, camera);
}
