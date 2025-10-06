/**
 * Track Loader for HadleeKart
 * Loads and parses custom track GLB files
 */

export class TrackLoader {
  constructor({ THREE, GLTFLoader, scene }) {
    this.THREE = THREE;
    this.GLTFLoader = GLTFLoader;
    this.scene = scene;
    
    this.trackData = {
      surfaces: [], // Array to hold multiple track meshes
      walls: [],
      trickZones: [],
      checkpoints: [],
      dropoffPoints: [],
      itemBoxLocations: [],
      startPositions: [],
      bounds: { min: new THREE.Vector3(), max: new THREE.Vector3() }
    };
    
    this.itemBoxMeshes = [];
    this.itemBoxStates = [];
    this.animations = [];
    this.animationMixers = [];
    this.miscObjects = [];
  }

  // Debug helper: log useful info about a scene element
  logElementInfo(obj, role = 'unknown') {
    try {
      const THREE = this.THREE;
      const name = obj.name || '<unnamed>';
      const isMesh = !!obj.isMesh;
      const isGroup = !!obj.isGroup;
      const visible = !!obj.visible;
      let size = null;
      if (isMesh) {
        const box = new THREE.Box3().setFromObject(obj);
        const s = new THREE.Vector3();
        box.getSize(s);
        size = { x: s.x, y: s.y, z: s.z };
      }
      const materials = [];
      if (isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          materials.push({
            name: m.name || null,
            type: m.type || null,
            transparent: !!m.transparent,
            opacity: typeof m.opacity === 'number' ? m.opacity : null,
            map: m.map ? (m.map.name || m.map.uuid || 'map') : null,
          });
        });
      }

      const info = { name, role, isMesh, isGroup, visible, size, materials };
      console.log('[TrackLoader] Element:', info);
    } catch (err) {
      console.warn('[TrackLoader] Failed to log element info', err);
    }
  }

  // Log an object and its descendants (useful for groups)
  logElementRecursive(obj, role = 'unknown') {
    if (!obj) return;
    this.logElementInfo(obj, role);
    if (obj.children && obj.children.length > 0) {
      obj.children.forEach((child) => {
        this.logElementRecursive(child, role + '-part');
      });
    }
  }

  /**
   * Load a track from a GLB file
   * @param {string} path - Path to the GLB file
   * @returns {Promise<Object>} Track data
   */
  async load(path) {
    return new Promise((resolve, reject) => {
      const loader = new this.GLTFLoader();
      
      loader.load(
        path,
        (gltf) => {
          console.log('[TrackLoader] Loaded track:', path);
          console.log('[TrackLoader] GLTF scene:', gltf.scene);
          
          // Store animations if any
          if (gltf.animations && gltf.animations.length > 0) {
            console.log('[TrackLoader] Found', gltf.animations.length, 'animations');
            this.animations = gltf.animations;
            
            // Create animation mixer for the scene
            const mixer = new this.THREE.AnimationMixer(gltf.scene);
            this.animationMixers.push(mixer);
            
            // Play all animations at 50% speed
            gltf.animations.forEach((clip) => {
              const action = mixer.clipAction(clip);
              action.timeScale = 0.5; // 50% speed
              action.play();
              console.log('[TrackLoader] Playing animation:', clip.name, 'at 50% speed');
            });
          }
          
          try {
            this.parseTrack(gltf.scene);
            this.createItemBoxes();
            resolve(this.trackData);
          } catch (error) {
            console.error('[TrackLoader] Error parsing track:', error);
            reject(error);
          }
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total * 100).toFixed(0);
            console.log(`[TrackLoader] Loading: ${percent}%`);
          }
        },
        (error) => {
          console.error('[TrackLoader] Error loading track:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Parse the loaded GLTF scene and extract track elements
   */
  parseTrack(root) {
    const { THREE } = this;
    
    // Debug: log all object names in the scene
    const objectNames = [];
    if (root && root.children) {
      console.log('[TrackLoader] Root has', root.children.length, 'direct children');
      console.log('[TrackLoader] Detailed children list:');
      root.children.forEach((child, idx) => {
        const name = child ? (child.name || '<unnamed>') : '<null>';
        const type = child ? (child.type || '<no type>') : '<null>';
        const hasChildren = child && child.children ? child.children.length : 0;
        console.log(`  [${idx}] name="${name}" type=${type} children=${hasChildren}`);
        
        if (child && child.name) {
          objectNames.push(child.name);
          
          // Check if this object has children - log them all
          if (child.children && child.children.length > 0) {
            console.log(`      Children of "${child.name}":`);
            child.children.forEach((subChild, subIdx) => {
              const subName = subChild ? (subChild.name || '<unnamed>') : '<null>';
              const subType = subChild ? (subChild.type || '<no type>') : '<null>';
              console.log(`        [${subIdx}] name="${subName}" type=${subType}`);
            });
          }
        }
      });
      console.log('[TrackLoader] Direct children names:', objectNames);
      
      // Now also do a full traverse to see ALL objects
      const allObjects = [];
      root.traverse((obj) => {
        if (obj && obj.name) {
          allObjects.push(obj.name);
        }
      });
      console.log('[TrackLoader] ALL objects (via traverse):', allObjects);
    }
    
    // Process each direct child (all objects are siblings in your Blender export)
    // IMPORTANT: Create a copy of the children array because adding objects to the scene
    // will remove them from root.children, mutating the array during iteration!
    if (root && root.children) {
      const childrenCopy = [...root.children];
      childrenCopy.forEach((child, index) => {
        if (!child) {
          console.warn(`[TrackLoader] Child ${index} is null/undefined`);
          return;
        }
        if (!child.name) {
          console.warn(`[TrackLoader] Child ${index} has no name:`, child);
          return;
        }

        const name = child.name;
        console.log(`[TrackLoader] Processing child ${index}: "${name}"`);
        
        // Determine role for logging
        let role = 'other';
        if (name === 'Track' || name.startsWith('Track')) role = 'track';
        else if (name === 'Wall' || name.startsWith('Wall')) role = 'wall';
        else if (name === 'Trick' || name.startsWith('Trick')) role = 'trick';
        else if (name === 'Misc' || name.startsWith('Misc')) role = 'decoration';
        else if (name.startsWith('Start')) role = 'start';
        else if (name.startsWith('Checkpoint')) role = 'checkpoint';
        else if (name.startsWith('Item')) role = 'item';
        else if (name.startsWith('Dropoff')) role = 'dropoff';
        
        // Log element info for debugging
        this.logElementInfo(child, role);

        // Main track surface (Track, Track0, Track1, etc.)
        if (name === 'Track' || name.startsWith('Track')) {
          this.setupTrackSurface(child);
        }
        // Walls (Wall, Wall0, Wall1, etc.)
        else if (name === 'Wall' || name.startsWith('Wall')) {
          this.setupWalls(child);
        }
        // Trick zones (Trick, Trick0, Trick1, etc.)
        else if (name === 'Trick' || name.startsWith('Trick')) {
          this.setupTrickZones(child);
        }
        // Decorative elements (Misc, Misc0, Misc1, etc.) - no collision
        else if (name === 'Misc' || name.startsWith('Misc')) {
          this.setupDecorations(child);
        }
        // Start positions
        else if (name.startsWith('Start')) {
          this.setupStartPosition(child);
        }
        // Checkpoints
        else if (name.startsWith('Checkpoint')) {
          this.setupCheckpoint(child);
        }
        // Item box locations
        else if (name.startsWith('Item')) {
          this.setupItemLocation(child);
        }
        // Dropoff points
        else if (name.startsWith('Dropoff')) {
          this.setupDropoffPoint(child);
        }
      });
    }
    
    // Calculate track bounds
    this.calculateBounds();
    
    // Sort checkpoints and dropoffs by index
    this.trackData.checkpoints.sort((a, b) => a.index - b.index);
    this.trackData.dropoffPoints.sort((a, b) => a.index - b.index);
    this.trackData.startPositions.sort((a, b) => a.index - b.index);
    this.trackData.itemBoxLocations.sort((a, b) => a.index - b.index);
    
    console.log('[TrackLoader] Parsed track:', {
      checkpoints: this.trackData.checkpoints.length,
      dropoffs: this.trackData.dropoffPoints.length,
      starts: this.trackData.startPositions.length,
      items: this.trackData.itemBoxLocations.length,
      trickZones: this.trackData.trickZones.length
    });
  }

  setupTrackSurface(mesh) {
    // Enable shadows and add to scene
    // Each track mesh (Track0, Track1, etc.) is added to the surfaces array
    if (mesh.isMesh) {
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      this.scene.add(mesh);
      this.trackData.surfaces.push(mesh);
      console.log('[TrackLoader] Track surface added:', mesh.name);
    } else if (mesh.children && mesh.children.length > 0) {
      mesh.children.forEach((child) => {
        if (child.isMesh) {
          child.receiveShadow = true;
          child.castShadow = false;
          this.trackData.surfaces.push(child);
        }
      });
      this.scene.add(mesh);
      console.log('[TrackLoader] Track surface group added:', mesh.name);
    } else {
      this.scene.add(mesh);
      this.trackData.surfaces.push(mesh);
      console.log('[TrackLoader] Track surface added (unknown type):', mesh.name);
    }
  }

  setupWalls(wall) {
    // Each wall is now a separate mesh (Wall0, Wall1, etc.)
    if (!wall.isMesh) {
      console.warn('[TrackLoader] Wall is not a mesh:', wall.name);
      return;
    }
    
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.visible = true;
    
    // Add to scene
    this.scene.add(wall);
    
    // Store wall mesh for raycasting collision (no Box3 needed)
    this.trackData.walls.push({ 
      mesh: wall,
      name: wall.name 
    });
    
    console.log('[TrackLoader] Wall added for raycasting:', wall.name);
  }

  setupTrickZones(trick) {
    // Trick zones - handle single mesh or group
    const addTrickMesh = (mesh) => {
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.trackData.trickZones.push({ mesh: mesh, bounds: new this.THREE.Box3().setFromObject(mesh) });
      this.scene.add(mesh);
    };

    if (trick.isMesh) addTrickMesh(trick);
    else if (trick.children && trick.children.length > 0) trick.children.forEach((c) => addTrickMesh(c));
    else this.scene.add(trick);

    console.log('[TrackLoader] Trick zones added:', this.trackData.trickZones.length);
  }

  setupDecorations(misc) {
    // Decorative only - render but no collision
    if (!misc.isMesh && !misc.isGroup) {
      console.warn('[TrackLoader] Misc object is neither mesh nor group:', misc.name);
      return;
    }
    
    misc.castShadow = true;
    misc.receiveShadow = true;
    misc.visible = true;
    
    // Enable shadows for children too
    if (misc.children) {
      misc.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
    
    this.scene.add(misc);
    this.miscObjects.push(misc);
    
    console.log('[TrackLoader] Decoration added:', misc.name);
  }

  setupStartPosition(obj) {
    const indexMatch = obj.name.match(/Start(\d+)/);
    const index = indexMatch ? parseInt(indexMatch[1]) : 0;
    
    // Use the object's position directly - since all objects are at root level,
    // the position property IS the world position
    const position = obj.position.clone();
    
    // Get rotation from the object
    const euler = obj.rotation.clone();
    
    this.trackData.startPositions.push({
      index,
      position: position,
      rotation: euler.y // Y-axis rotation (heading)
    });
    
    console.log(`[TrackLoader] Start position ${index} at:`, position.x.toFixed(2), position.y.toFixed(2), position.z.toFixed(2), 'rotation:', euler.y.toFixed(2));
    
    // Make invisible (don't add to scene)
    obj.visible = false;
  }

  setupCheckpoint(obj) {
    const indexMatch = obj.name.match(/Checkpoint(\d+)/);
    const index = indexMatch ? parseInt(indexMatch[1]) : 0;
    
    console.log(`[TrackLoader] Setting up checkpoint ${index}:`, {
      name: obj.name,
      type: obj.type,
      isMesh: obj.isMesh,
      isGroup: obj.isGroup,
      hasGeometry: obj.geometry ? true : false,
      children: obj.children ? obj.children.length : 0,
      position: obj.position
    });
    
    // Use object's position directly
    const position = obj.position.clone();
    
    // Create a trigger box from the object's bounds
    // Temporarily add to scene to calculate bounds correctly
    this.scene.add(obj);
    const box = new this.THREE.Box3().setFromObject(obj);
    this.scene.remove(obj);
    
    // Check if box is valid (not collapsed to a point)
    const size = new this.THREE.Vector3();
    box.getSize(size);
    
    console.log(`[TrackLoader] Checkpoint ${index} initial box size:`, {
      x: size.x.toFixed(4),
      y: size.y.toFixed(4),
      z: size.z.toFixed(4)
    });
    
    // If the object has no geometry (is an Empty), create a default trigger box
    if (size.x < 0.1 && size.y < 0.1 && size.z < 0.1) {
      console.warn(`[TrackLoader] Checkpoint ${index} has no geometry, creating default trigger box`);
      // Create a reasonable sized trigger box (20 units wide, 10 tall, 5 deep)
      const halfSize = new this.THREE.Vector3(10, 5, 2.5);
      box.setFromCenterAndSize(position, new this.THREE.Vector3(20, 10, 5));
    }
    
    this.trackData.checkpoints.push({
      index,
      position: position.clone(),
      box: box,
      isFinishLine: index === 0,
      name: obj.name
    });
    
    console.log(`[TrackLoader] Checkpoint ${index} added:`, {
      name: obj.name,
      position: { x: position.x.toFixed(2), y: position.y.toFixed(2), z: position.z.toFixed(2) },
      box: { min: box.min, max: box.max }
    });
    
    // Make invisible but keep for collision detection
    obj.visible = false;
    
    // Optional: visualize in debug mode
    if (true) { // Set to true for debugging
      const helper = new this.THREE.Box3Helper(box, 0x00ff00);
      this.scene.add(helper);
      console.log(`[TrackLoader] Checkpoint ${index} debug helper added`);
    }
  }

  setupItemLocation(obj) {
    const indexMatch = obj.name.match(/Item(\d+)/);
    const index = indexMatch ? parseInt(indexMatch[1]) : 0;
    
    // Use object's position directly
    const position = obj.position.clone();
    
    this.trackData.itemBoxLocations.push({
      index,
      position: position.clone()
    });
    
    obj.visible = false;
  }

  setupDropoffPoint(obj) {
    const indexMatch = obj.name.match(/Dropoff(\d+)/);
    const index = indexMatch ? parseInt(indexMatch[1]) : 0;
    
    console.log(`[TrackLoader] Setting up dropoff ${index}:`, {
      name: obj.name,
      type: obj.type,
      isMesh: obj.isMesh,
      hasGeometry: obj.geometry ? true : false,
      children: obj.children ? obj.children.length : 0
    });
    
    // Use object's position and rotation directly
    const position = obj.position.clone();
    const euler = obj.rotation.clone();
    
    // Create trigger box
    this.scene.add(obj);
    const box = new this.THREE.Box3().setFromObject(obj);
    this.scene.remove(obj);
    
    // Check if box is valid
    const size = new this.THREE.Vector3();
    box.getSize(size);
    
    console.log(`[TrackLoader] Dropoff ${index} initial box size:`, {
      x: size.x.toFixed(4),
      y: size.y.toFixed(4),
      z: size.z.toFixed(4)
    });
    
    // If the object has no geometry (is an Empty), create a default trigger box
    if (size.x < 0.1 && size.y < 0.1 && size.z < 0.1) {
      console.warn(`[TrackLoader] Dropoff ${index} has no geometry, creating default trigger box`);
      // Create a reasonable sized trigger box (15 units wide, 8 tall, 4 deep)
      box.setFromCenterAndSize(position, new this.THREE.Vector3(15, 8, 4));
    }
    
    this.trackData.dropoffPoints.push({
      index,
      position: position.clone(),
      rotation: euler.y,
      box: box
    });
    
    console.log(`[TrackLoader] Dropoff ${index} added:`, {
      position: { x: position.x.toFixed(2), y: position.y.toFixed(2), z: position.z.toFixed(2) },
      rotation: euler.y.toFixed(2),
      box: { min: box.min, max: box.max }
    });
    
    obj.visible = false;
    
    // Debug visualization
    if (true) {
      const helper = new this.THREE.Box3Helper(box, 0xff0000);
      this.scene.add(helper);
      console.log(`[TrackLoader] Dropoff ${index} debug helper added`);
    }
  }

  calculateBounds() {
    // Calculate overall track bounds from all surfaces
    if (this.trackData.surfaces.length > 0) {
      const box = new this.THREE.Box3();
      this.trackData.surfaces.forEach(surface => {
        if (surface) {
          box.expandByObject(surface);
        }
      });
      this.trackData.bounds.min.copy(box.min);
      this.trackData.bounds.max.copy(box.max);
      
      console.log('[TrackLoader] Track bounds:', {
        min: this.trackData.bounds.min,
        max: this.trackData.bounds.max
      });
    }
  }

  /**
   * Create visual item boxes at the defined locations
   */
  createItemBoxes() {
    const { THREE } = this;
    
    // Simple cube for now
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffdd00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.6
    });
    
    this.trackData.itemBoxLocations.forEach((location, i) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(location.position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Store reference
      this.itemBoxMeshes.push(mesh);
      this.itemBoxStates.push({
        active: true,
        respawnTimer: 0,
        mesh: mesh
      });
      
      this.scene.add(mesh);
    });
    
    console.log('[TrackLoader] Item boxes created:', this.itemBoxMeshes.length);
  }

  /**
   * Update item boxes (rotation animation, respawn timers) and track animations
   */
  updateItemBoxes(delta) {
    // Update item boxes
    this.itemBoxMeshes.forEach((mesh, i) => {
      const state = this.itemBoxStates[i];
      
      if (state.active) {
        // Rotate and bob
        mesh.rotation.y += delta * 2;
        mesh.position.y = this.trackData.itemBoxLocations[i].position.y + Math.sin(Date.now() * 0.003) * 0.3;
        mesh.visible = true;
      } else {
        // Respawning
        state.respawnTimer -= delta;
        mesh.visible = false;
        
        if (state.respawnTimer <= 0) {
          state.active = true;
        }
      }
    });
    
    // Update animation mixers (for Misc objects with animations)
    this.animationMixers.forEach(mixer => {
      mixer.update(delta);
    });
  }

  /**
   * Check if kart collides with an item box
   */
  checkItemBoxCollision(kartPosition, kartRadius = 2) {
    const collected = [];
    
    this.itemBoxMeshes.forEach((mesh, i) => {
      const state = this.itemBoxStates[i];
      if (!state.active) return;
      
      const distance = kartPosition.distanceTo(mesh.position);
      if (distance < kartRadius + 1) {
        // Collected!
        state.active = false;
        state.respawnTimer = 5; // 5 seconds respawn
        collected.push(i);
      }
    });
    
    return collected;
  }

  /**
   * Check if position is on a trick zone
   */
  isOnTrickZone(position) {
    for (const zone of this.trackData.trickZones) {
      if (zone.bounds.containsPoint(position)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the track data
   */
  getTrackData() {
    return this.trackData;
  }

  /**
   * Raycast down to find ground height at position
   * @param {Vector3} position - Position to check
   * @returns {Object} { height: number, hit: boolean, normal: Vector3 }
   */
  getGroundHeight(position) {
    const { THREE } = this;
    
    // Raycast straight down from high above the position
    const raycaster = new THREE.Raycaster();
    const rayOrigin = new THREE.Vector3(position.x, 100, position.z);
    const rayDirection = new THREE.Vector3(0, -1, 0);
    
    raycaster.set(rayOrigin, rayDirection);
    
    // Check against ALL track surfaces
    const intersects = [];
    this.trackData.surfaces.forEach(surface => {
      if (surface) {
        const hits = raycaster.intersectObject(surface, true);
        intersects.push(...hits);
      }
    });
    
    // Also check trick zones for ground
    this.trackData.trickZones.forEach(zone => {
      if (zone.mesh) {
        const hits = raycaster.intersectObject(zone.mesh, true);
        intersects.push(...hits);
      }
    });
    
    if (intersects.length > 0) {
      // Get closest hit
      intersects.sort((a, b) => a.distance - b.distance);
      const closest = intersects[0];
      
      return {
        height: closest.point.y,
        hit: true,
        normal: closest.face ? closest.face.normal.clone() : new THREE.Vector3(0, 1, 0),
        point: closest.point
      };
    }
    
    return { height: 0, hit: false, normal: new THREE.Vector3(0, 1, 0) };
  }

  /**
   * Check collision with walls using raycasting
   * @param {Vector3} position - Kart position
   * @param {Object} dimensions - { width, height, length }
   * @returns {Object} { colliding: boolean, pushback: Vector3 }
   */
  checkWallCollision(position, dimensions) {
    const { THREE } = this;
    
    if (!this.trackData.walls || this.trackData.walls.length === 0) {
      return { colliding: false, pushback: new THREE.Vector3() };
    }
    
    const raycaster = new THREE.Raycaster();
    // Use only the WIDTH for collision radius (side-to-side), and reduce to actual kart edge
    // Add small buffer (0.1) to detect just before actual contact for smooth response
    const rayDistance = (dimensions.width * 0.5) + 0.1;
    
    let totalPushback = new THREE.Vector3();
    let collisionCount = 0;
    
    // Cast 8 rays in a circle around the kart (horizontal only)
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayDir = new THREE.Vector3(
        Math.cos(angle),
        0, // Horizontal rays only
        Math.sin(angle)
      ).normalize();
      
      // Ray origin at kart center, at mid-height
      const rayOrigin = new THREE.Vector3(
        position.x,
        position.y + dimensions.height * 0.5,
        position.z
      );
      
      raycaster.set(rayOrigin, rayDir);
      
      // Check all walls
      for (const wall of this.trackData.walls) {
        if (!wall.mesh) continue;
        
        const intersects = raycaster.intersectObject(wall.mesh, true);
        
        if (intersects.length > 0) {
          const hit = intersects[0];
          
          // Only trigger if we've actually penetrated the wall (distance < kart radius)
          if (hit.distance < rayDistance) {
            collisionCount++;
            
            // Calculate pushback based on how far we've penetrated
            const penetration = rayDistance - hit.distance;
            const pushback = rayDir.clone().negate().multiplyScalar(penetration);
            totalPushback.add(pushback);
          }
        }
      }
    }
    
    // Average out pushback if multiple rays hit
    if (collisionCount > 0) {
      totalPushback.multiplyScalar(1.0 / collisionCount);
    }
    
    return {
      colliding: collisionCount > 0,
      pushback: totalPushback
    };
  }
}

export default TrackLoader;
