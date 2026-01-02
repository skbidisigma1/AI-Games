import { ItemManager } from './items.js';
import { TrackLoader } from './trackLoader.js';
import { CheckpointManager } from './checkpoint.js';
import { Vehicle } from './vehicle.js';
import { ParticleSystem } from './particles.js';

let internal = null;

export async function initGame({ THREE, GLTFLoader, scene, camera, renderer, config, container, track, settings, onExitToMenu, onRestart }) {
  if (!THREE) throw new Error('THREE not provided');
  if (!GLTFLoader) throw new Error('GLTFLoader not provided');
  if (!scene) throw new Error('scene not provided');
  if (!camera) throw new Error('camera not provided');
  if (!renderer) throw new Error('renderer not provided');
  const CONFIG = config;
  if (!CONFIG) throw new Error('config missing');

  container = container || document.getElementById('game-container');
  if (!container) throw new Error('Game container not found');

  // HUD
  const overlay = document.createElement('div');
  overlay.className = 'hud-root';
  if (settings && settings.showHud === false) {
    overlay.style.display = 'none';
  }
  overlay.innerHTML = `
    <div class="hud-top">
      <div class="hud-card hud-left">
        <div class="hud-title">HadleeKart</div>
        <div id="hud-time" class="hud-line">Time: 0:00.000</div>
        <div id="hud-lap" class="hud-line">Lap: 1/3</div>
        <div id="hud-surface" class="hud-line">Surface: Road</div>
      </div>

      <div class="hud-card hud-right">
        <div id="hud-speed" class="hud-speed">0</div>
        <div class="hud-speed-sub">speed</div>

        <div class="hud-meter">
          <div id="hud-drift" class="hud-meter-label">Mini-Turbo: none</div>
          <div class="hud-meter-bar"><div id="hud-drift-fill" class="hud-meter-fill"></div></div>
        </div>

        <div class="hud-meter">
          <div id="hud-boost" class="hud-meter-label">Boost: 0.00s</div>
          <div class="hud-meter-bar"><div id="hud-boost-fill" class="hud-meter-fill hud-meter-fill-boost"></div></div>
        </div>
      </div>
    </div>

    <div class="hud-bottom">
      <div class="hud-card hud-item">
        <div id="hud-item" class="hud-line">Item - Holding: None</div>
        <div class="hud-hint">Shift: drift • E: use item • X: rear view • T: respawn • Esc: pause</div>
      </div>
    </div>
  `;
  container.appendChild(overlay);

  const statusLine = overlay.querySelector('#hud-drift');
  const lapLine = overlay.querySelector('#hud-lap');
  const itemLine = overlay.querySelector('#hud-item');
  const timeLine = overlay.querySelector('#hud-time');
  const speedLine = overlay.querySelector('#hud-speed');
  const surfaceLine = overlay.querySelector('#hud-surface');
  const driftFill = overlay.querySelector('#hud-drift-fill');
  const boostLine = overlay.querySelector('#hud-boost');
  const boostFill = overlay.querySelector('#hud-boost-fill');

  // Results (race complete)
  const resultsOverlay = document.createElement('div');
  resultsOverlay.className = 'race-results';
  resultsOverlay.style.display = 'none';
  resultsOverlay.innerHTML = `
    <div class="ui-card">
      <div class="ui-title">Race Complete</div>
      <div id="results-total" class="ui-subtitle" style="margin-top: 8px;"></div>
      <div id="results-laps" class="ui-footnote" style="margin-top: 12px;"></div>
      <div class="ui-grid" style="margin-top: 16px;">
        <button id="results-restart" class="ui-btn ui-btn-primary">Restart</button>
        <button id="results-exit" class="ui-btn ui-btn-danger">Exit to Menu</button>
      </div>
    </div>
  `;
  container.appendChild(resultsOverlay);

  const rendererConfig = CONFIG.renderer || {};
  const pixelRatioCap = (settings && typeof settings.maxPixelRatio === 'number')
    ? settings.maxPixelRatio
    : (rendererConfig.maxPixelRatio ?? 2);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.6; // Reduced from 1.0 to prevent washing out baked lighting

  // Load HDR skybox
  const skyConfig = CONFIG.sky || {};
  if (skyConfig.hdrPath) {
    try {
      const { HDRLoader } = await import('three/examples/jsm/loaders/HDRLoader.js');
      const hdrLoader = new HDRLoader();
      const hdrTexture = await new Promise((resolve, reject) => {
        hdrLoader.load(
          skyConfig.hdrPath,
          (texture) => resolve(texture),
          undefined,
          (error) => reject(error)
        );
      });
      hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = hdrTexture;
      
      // Only use as environment if enabled (for reflections)
      // Disable or reduce intensity to prevent overpowering baked lighting
      if (skyConfig.useAsEnvironment) {
        scene.environment = hdrTexture;
        scene.environmentIntensity = skyConfig.environmentIntensity ?? 0.3; // Much lower than default
      }
      
      if (CONFIG.debug?.logInfo) {
        console.log('[Game] HDR skybox loaded:', skyConfig.hdrPath);
      }
    } catch (error) {
      console.warn('[Game] Failed to load HDR skybox:', error);
      scene.background = new THREE.Color(skyConfig.color ?? 0x10141f);
    }
  } else {
    scene.background = new THREE.Color(skyConfig.color ?? 0x10141f);
  }

  const cameraConfig = CONFIG.camera || {};
  camera.position.set(0, cameraConfig.followHeight ?? 5, cameraConfig.followDistance ?? 10);
  camera.near = cameraConfig.near ?? camera.near;
  camera.far = cameraConfig.far ?? camera.far;
  const baseCameraFov = cameraConfig.fov ?? camera.fov ?? 60;
  camera.fov = baseCameraFov;
  camera.updateProjectionMatrix();

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

  // Load track
  const trackPath = CONFIG.track?.path || './assets/track/spungilious_speedway/Spungilious Speedway.glb';
  const trackLoader = new TrackLoader({ THREE, GLTFLoader, scene, config: CONFIG });

  // Optional override (used by editor playtest)
  const trackSource = track || { type: 'glb', path: trackPath };
  let trackData;
  try {
    if (trackSource?.type === 'spec') {
      trackData = await trackLoader.loadFromSpec(trackSource.spec);
    } else {
      trackData = await trackLoader.load(trackSource?.path || trackPath);
    }
  } catch (err) {
    console.error('[Game] Failed to load track:', err);
    alert(`Failed to load track: ${err?.message || err}`);
    if (typeof onExitToMenu === 'function') {
      await onExitToMenu();
      return;
    }
    throw err;
  }
  const particleConfig = CONFIG.particles || {};
  const particleSystem = new ParticleSystem({ THREE, scene, maxParticles: particleConfig.maxPoolSize || 1800 });
  
  // Initialize checkpoint manager
  const checkpointManager = new CheckpointManager(
    trackData.checkpoints, 
    trackData.dropoffPoints,
    trackData.startPositions,
    CONFIG
  );
  checkpointManager.onCheckpointPass = (checkpoint, passed, total) => {
    if (CONFIG.debug?.logCheckpoints) {
      console.log(`Checkpoint ${checkpoint.index} passed! (${passed}/${total})`);
    }
  };
  checkpointManager.onLapComplete = (lap, time) => {
    // Always log lap completions
    console.log(`LAP ${lap} COMPLETE! Time: ${CheckpointManager.formatTime(time)}`);
  };
  checkpointManager.onRaceComplete = (totalTime, lapTimes) => {
    console.log('RACE FINISHED!', {
      total: CheckpointManager.formatTime(totalTime),
      laps: lapTimes.map(t => CheckpointManager.formatTime(t))
    });

    // Show results UI
    const totalEl = resultsOverlay.querySelector('#results-total');
    const lapsEl = resultsOverlay.querySelector('#results-laps');
    totalEl.textContent = `Total: ${CheckpointManager.formatTime(totalTime)}`;
    lapsEl.innerHTML = lapTimes.map((t, i) => `Lap ${i + 1}: ${CheckpointManager.formatTime(t)}`).join('<br>');
    resultsOverlay.style.display = '';
  };

  resultsOverlay.querySelector('#results-restart').addEventListener('click', async () => {
    resultsOverlay.style.display = 'none';
    if (typeof onRestart === 'function') {
      await onRestart();
    }
  });
  resultsOverlay.querySelector('#results-exit').addEventListener('click', async () => {
    resultsOverlay.style.display = 'none';
    if (typeof onExitToMenu === 'function') {
      await onExitToMenu();
    }
  });

  // Sky dome
  if (!skyConfig.hdrPath) {
    // Only create geometry dome if not using HDR
    const skyGeometry = new THREE.SphereGeometry(skyConfig.radius ?? 1600, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({ color: skyConfig.color ?? 0x0c0f16, side: THREE.BackSide });
    const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyDome);
  }

  // Input state
  const input = { forward: false, backward: false, left: false, right: false, drift: false, driftJustPressed: false, respawn: false, rearview: false };
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
      case 'KeyX':
        input.rearview = state;
        break;
      default: break;
    }
  };
  const keydownHandler = (e) => setKeyState(e, true);
  const keyupHandler = (e) => setKeyState(e, false);
  window.addEventListener('keydown', keydownHandler);
  window.addEventListener('keyup', keyupHandler);

  // Create vehicle with modular Vehicle class
  const vehicle = new Vehicle({
    scene,
    config: CONFIG,
    trackLoader,
    checkpointManager,
    statusElement: statusLine,
    lapElement: lapLine,
    itemElement: itemLine,
    particleSystem
  });
  
  // Start the race (calculates initial rotation)
  checkpointManager.startRace();
  
  // NOW spawn the vehicle with the correct rotation
  vehicle.spawnAtStart();
  
  const targetCameraPosition = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const clock = new THREE.Clock();
  let wasRearview = false;
  const updateCamera = (delta) => {
    const cameraConfig2 = CONFIG.camera || {};
    const rearConfig = cameraConfig2.rearView || {};
    const physicsConfig = vehicle.config?.vehicle?.physics || {};
    const maxSpeed = physicsConfig.maxSpeed ?? 100;
    const currentSpeed = vehicle.velocity ? vehicle.velocity.length() : 0;
    const speedRatio = THREE.MathUtils.clamp(maxSpeed > 0 ? currentSpeed / maxSpeed : 0, 0, 1);
    const defaultFollowDistance = cameraConfig2.followDistance ?? 8;
    const defaultFollowHeight = cameraConfig2.followHeight ?? 3.5;
    const defaultLookAhead = cameraConfig2.lookAhead ?? 6;
    const defaultLookHeight = cameraConfig2.lookHeight ?? 1.5;
    const rearActive = !!input.rearview;
    const instantFrontSnap = !rearActive && wasRearview;
    let followDistance = rearActive ? (rearConfig.followDistance ?? defaultFollowDistance) : defaultFollowDistance;
    if (rearActive) {
      followDistance += (rearConfig.speedDistanceGain ?? 0) * speedRatio;
    }
    const followHeight = rearActive ? (rearConfig.followHeight ?? defaultFollowHeight) : defaultFollowHeight;
    const lookDistance = rearActive ? (rearConfig.lookBack ?? defaultLookAhead) : defaultLookAhead;
    const lookHeight = rearActive ? (rearConfig.lookHeight ?? defaultLookHeight) : defaultLookHeight;
    const smoothingConfig = rearActive ? 0 : cameraConfig2.smoothing;
    const smoothingBase = THREE.MathUtils.clamp(smoothingConfig ?? 0.001, 1e-4, 0.999);
    const forwardVector = new THREE.Vector3(Math.sin(vehicle.heading), 0, Math.cos(vehicle.heading)).normalize();
    const offsetDirection = rearActive ? forwardVector.clone() : forwardVector.clone().negate();
    const cameraOffset = offsetDirection.multiplyScalar(followDistance);
    cameraOffset.y += followHeight;
    targetCameraPosition.copy(vehicle.group.position).add(cameraOffset);
    if (rearActive || instantFrontSnap) {
      camera.position.copy(targetCameraPosition);
    } else {
      const lerpFactor = 1 - Math.pow(smoothingBase, delta);
      camera.position.lerp(targetCameraPosition, lerpFactor);
    }
    const lookDirection = rearActive ? forwardVector.clone().negate() : forwardVector;
    lookTarget.copy(vehicle.group.position).addScaledVector(lookDirection, lookDistance);
    lookTarget.y += lookHeight;
    camera.lookAt(lookTarget);
    const targetFov = baseCameraFov + (rearActive ? (rearConfig.fovOffset ?? 0) : 0);
    if (rearActive || instantFrontSnap) {
      if (camera.fov !== targetFov) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
    } else if (Math.abs(camera.fov - targetFov) > 0.05) {
      const fovLerp = 1 - Math.pow(0.05, delta);
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, fovLerp);
      camera.updateProjectionMatrix();
    }
    wasRearview = rearActive;
  };

  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);

  internal = {
    THREE,
    scene,
    camera,
    renderer,
    vehicle,
    clock,
    updateCamera,
    trackLoader,
    particleSystem,
    input,
    config: CONFIG,
    checkpointManager,
    _ui: { overlay, resultsOverlay, timeLine, speedLine, surfaceLine, driftFill, boostLine, boostFill, _boostMax: 0 },
    _handlers: { keydownHandler, keyupHandler, handleResize }
  };
  return { vehicle, trackData, checkpointManager };
}

export function updateGame() {
  if (!internal) return;
  const { vehicle, clock, updateCamera, renderer, scene, camera, trackLoader, particleSystem, input, THREE, config, checkpointManager, _ui } = internal;
  const delta = Math.min(clock.getDelta(), 0.05);
  const particlePhysics = config?.particles?.physics || {};
  
  vehicle.update(delta, input);

  // HUD updates
  if (_ui?.timeLine && checkpointManager?.raceStartTime) {
    const now = performance.now();
    const total = Math.max(0, now - checkpointManager.raceStartTime);
    _ui.timeLine.textContent = `Time: ${CheckpointManager.formatTime(total)}`;
  }
  if (_ui?.speedLine) {
    const speed = vehicle.velocity ? vehicle.velocity.length() : 0;
    _ui.speedLine.textContent = speed.toFixed(0);
  }
  if (_ui?.surfaceLine) {
    const t = vehicle.surfaceState?.type || 'road';
    const label = t === 'offroadWeak' ? 'Offroad (Weak)' : (t === 'offroadStrong' ? 'Offroad (Strong)' : (t === 'boost' ? 'Boost' : 'Road'));
    _ui.surfaceLine.textContent = `Surface: ${label}`;
  }
  if (_ui?.boostLine && _ui?.boostFill) {
    const remaining = Math.max(0, vehicle.boostState?.timer || 0);
    _ui.boostLine.textContent = `Boost: ${remaining.toFixed(2)}s`;
    if (remaining > _ui._boostMax) _ui._boostMax = remaining;
    if (remaining <= 0) _ui._boostMax = 0;
    const denom = Math.max(0.001, _ui._boostMax || 0.45);
    const pct = remaining > 0 ? Math.max(0, Math.min(1, remaining / denom)) : 0;
    _ui.boostFill.style.width = `${(pct * 100).toFixed(1)}%`;
  }
  if (_ui?.driftFill) {
    const driftCfg = vehicle.driftConfig || {};
    const stages = Array.isArray(driftCfg.stages) ? driftCfg.stages : [];
    const maxTime = stages.length ? stages[stages.length - 1].time : 1;
    const t = vehicle.driftState?.active ? (vehicle.driftState.timer || 0) : 0;
    const pct = maxTime > 0 ? Math.max(0, Math.min(1, t / maxTime)) : 0;
    _ui.driftFill.style.width = `${(pct * 100).toFixed(1)}%`;
    if (vehicle.driftState?.active && vehicle.driftState.stage >= 0 && stages[vehicle.driftState.stage]) {
      _ui.driftFill.style.background = stages[vehicle.driftState.stage].color || 'rgba(255,255,255,0.55)';
    } else {
      _ui.driftFill.style.background = 'rgba(255,255,255,0.55)';
    }
    if (!vehicle.driftState?.active) _ui.driftFill.style.width = '0%';
  }
  
  // Update item boxes
  if (trackLoader) {
    trackLoader.updateItemBoxes(delta);
    
    // Check item box collisions
    const collectionRadius = vehicle.config.itemBox?.collectionRadius || 2.5;
    const collected = trackLoader.checkItemBoxCollision(vehicle.group.position, collectionRadius);
    if (collected.length > 0 && vehicle.itemManager) {
      const debugConfig = vehicle.config.debug || {};
      collected.forEach(itemIndex => {
        if (debugConfig.logItems) {
          console.log(`[Item] Collected item box ${itemIndex}`);
        }
        // Give a random item (for now)
        vehicle.itemManager.cycleExample();
        if (particleSystem) {
          const itemParticles = (config?.particles?.items) || {};
          const source = trackLoader.itemBoxMeshes?.[itemIndex]?.position;
          const burstOrigin = source ? source.clone() : vehicle.group.position.clone();
          const groundHeight = (vehicle.lastGroundCheck?.height ?? vehicle.group.position.y) + (particlePhysics.groundOffset ?? 0.02);
          particleSystem.spawnBurst({
            count: itemParticles.count ?? 24,
            position: burstOrigin,
            positionJitter: { x: 0.6, y: 0.6, z: 0.6 },
            baseVelocity: new THREE.Vector3(0, 1.8, 0),
            velocityJitter: { x: 1.2, y: 1.8, z: 1.2 },
            color: itemParticles.color ?? 0xfff06a,
            colorJitter: itemParticles.colorJitter ?? 0xffffff,
            sizeRange: itemParticles.size ?? [0.12, 0.28],
            lifetimeRange: itemParticles.life ?? [0.35, 0.7],
            alpha: itemParticles.alpha ?? 0.85,
            acceleration: new THREE.Vector3(0, -4, 0),
            drag: 0.92,
            groundY: groundHeight,
            bounce: particlePhysics.bounce ?? 0.3,
            friction: particlePhysics.friction ?? 0.7
          });
        }
      });
    }
  }
  if (particleSystem) {
    particleSystem.update(delta);
  }
  
  updateCamera(delta);
  renderer.render(scene, camera);
}

export function disposeGame() {
  if (!internal) return;

  const { scene, trackLoader, vehicle, particleSystem, _ui, _handlers } = internal;

  // Remove UI
  if (_ui?.overlay && _ui.overlay.parentElement) {
    _ui.overlay.parentElement.removeChild(_ui.overlay);
  }
  if (_ui?.resultsOverlay && _ui.resultsOverlay.parentElement) {
    _ui.resultsOverlay.parentElement.removeChild(_ui.resultsOverlay);
  }

  // Remove listeners
  if (_handlers?.keydownHandler) window.removeEventListener('keydown', _handlers.keydownHandler);
  if (_handlers?.keyupHandler) window.removeEventListener('keyup', _handlers.keyupHandler);
  if (_handlers?.handleResize) window.removeEventListener('resize', _handlers.handleResize);

  // Remove track objects
  if (trackLoader && typeof trackLoader.dispose === 'function') {
    trackLoader.dispose();
  }

  // Remove vehicle
  if (vehicle?.group) {
    scene.remove(vehicle.group);
  }

  // Remove particle system
  if (particleSystem?.mesh) {
    scene.remove(particleSystem.mesh);
  }
  if (particleSystem?.geometry?.dispose) particleSystem.geometry.dispose();
  if (particleSystem?.material?.dispose) particleSystem.material.dispose();

  internal = null;
}
