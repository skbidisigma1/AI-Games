// Runtime-loaded modular track element generator + material parser.
// This module is intentionally dependency-light and is designed to be imported
// dynamically by the editor and TrackLoader.

function v3(THREE, v, fallback = { x: 0, y: 0, z: 0 }) {
  if (!v) v = fallback;
  if (v.isVector3) return v.clone();
  return new THREE.Vector3(v.x ?? fallback.x, v.y ?? fallback.y, v.z ?? fallback.z);
}

function eulerY(THREE, rot) {
  if (!rot) return 0;
  if (typeof rot === 'number') return rot;
  return rot.y ?? 0;
}

function applyTransform(mesh, { position, rotation, scale } = {}) {
  if (position) mesh.position.copy(position);
  if (rotation) {
    if (rotation.isEuler) mesh.rotation.copy(rotation);
    else {
      mesh.rotation.set(rotation.x ?? 0, rotation.y ?? 0, rotation.z ?? 0);
    }
  }
  if (scale) {
    if (typeof scale === 'number') mesh.scale.setScalar(scale);
    else mesh.scale.set(scale.x ?? 1, scale.y ?? 1, scale.z ?? 1);
  }
}

function normalizeColor(value, fallback = 0xffffff) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // '#rrggbb' or '0xrrggbb'
    if (value.startsWith('#')) return Number.parseInt(value.slice(1), 16);
    if (value.startsWith('0x')) return Number.parseInt(value.slice(2), 16);
  }
  return fallback;
}

function normalizeMaterialDef(def) {
  const d = def || {};
  const type = d.type || 'standard';
  return {
    type,
    name: d.name,
    color: normalizeColor(d.color, 0xffffff),
    roughness: typeof d.roughness === 'number' ? d.roughness : 0.75,
    metalness: typeof d.metalness === 'number' ? d.metalness : 0.05,
    emissive: normalizeColor(d.emissive, 0x000000),
    emissiveIntensity: typeof d.emissiveIntensity === 'number' ? d.emissiveIntensity : 0,
    opacity: typeof d.opacity === 'number' ? d.opacity : 1,
    transparent: d.transparent === true || (typeof d.opacity === 'number' && d.opacity < 1),
    side: d.side || 'front',
    flatShading: !!d.flatShading
  };
}

function materialKey(def) {
  const d = normalizeMaterialDef(def);
  return JSON.stringify({
    t: d.type,
    c: d.color,
    r: d.roughness,
    m: d.metalness,
    e: d.emissive,
    ei: d.emissiveIntensity,
    o: d.opacity,
    tr: d.transparent,
    s: d.side,
    f: d.flatShading
  });
}

function createMaterial(THREE, def) {
  const d = normalizeMaterialDef(def);
  const side = d.side === 'double' ? THREE.DoubleSide : (d.side === 'back' ? THREE.BackSide : THREE.FrontSide);

  // MVP: MeshStandardMaterial for everything.
  const params = {
    color: d.color,
    roughness: d.roughness,
    metalness: d.metalness,
    emissive: d.emissive,
    emissiveIntensity: d.emissiveIntensity,
    opacity: d.opacity,
    transparent: d.transparent,
    side,
    flatShading: d.flatShading
  };
  if (typeof d.name === 'string' && d.name.length > 0) params.name = d.name;
  return new THREE.MeshStandardMaterial(params);
}

export function createMaterialResolver({ THREE, specMaterials, configDefaults } = {}) {
  const cache = new Map();

  const defaults = configDefaults || {
    road: { type: 'standard', color: 0x1f2933, roughness: 0.78, metalness: 0.08 },
    offroadWeak: { type: 'standard', color: 0x3a3a2a, roughness: 0.95, metalness: 0.02 },
    offroadStrong: { type: 'standard', color: 0x2e221a, roughness: 0.98, metalness: 0.01 },
    boost: { type: 'standard', color: 0x7c5cff, roughness: 0.35, metalness: 0.15, emissive: 0x2a18a8, emissiveIntensity: 0.9 },
    wall: { type: 'standard', color: 0x35435a, roughness: 0.45, metalness: 0.05, side: 'double' },
    prop: { type: 'standard', color: 0x8aa0b8, roughness: 0.55, metalness: 0.05 },
    marker: { type: 'standard', color: 0x22c55e, roughness: 0.7, metalness: 0.05, emissive: 0x0b3d2e, emissiveIntensity: 0.4 }
  };

  const materialDefs = specMaterials || {};

  function resolve(refOrInline, fallbackKey) {
    let def;
    if (!refOrInline) {
      def = defaults[fallbackKey] || defaults.prop;
    } else if (typeof refOrInline === 'string') {
      def = materialDefs[refOrInline] || defaults[fallbackKey] || defaults.prop;
    } else {
      def = { ...(defaults[fallbackKey] || {}), ...(refOrInline || {}) };
    }

    const key = materialKey(def);
    const cached = cache.get(key);
    if (cached) return cached;

    const mat = createMaterial(THREE, def);
    cache.set(key, mat);
    return mat;
  }

  return { resolve, cache };
}

function pieceDefRegistry({ THREE }) {
  return {
    // Road
    road_straight: {
      role: 'surface',
      build: ({ size, material }) => {
        const s = size || { x: 40, y: 0.6, z: 20 };
        const geom = new THREE.BoxGeometry(s.x, s.y, s.z);
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        return mesh;
      }
    },
    road_straight_short: {
      role: 'surface',
      build: ({ size, material }) => {
        const s = size || { x: 20, y: 0.6, z: 26 };
        const geom = new THREE.BoxGeometry(s.x, s.y, s.z);
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        return mesh;
      }
    },
    road_straight_long: {
      role: 'surface',
      build: ({ size, material }) => {
        const s = size || { x: 120, y: 0.6, z: 26 };
        const geom = new THREE.BoxGeometry(s.x, s.y, s.z);
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        return mesh;
      }
    },
    road_platform: {
      role: 'surface',
      build: ({ size, material }) => {
        const s = size || { x: 60, y: 0.6, z: 60 };
        const geom = new THREE.BoxGeometry(s.x, s.y, s.z);
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        return mesh;
      }
    },
    road_ramp: {
      role: 'surface',
      build: ({ size, material }) => {
        // Prefer new ramp params; accept legacy {x,y,z} too.
        const legacy = size && typeof size === 'object' && ('x' in size) && ('y' in size) && ('z' in size);
        const length = Math.max(1, legacy ? (size.x ?? 40) : (size?.length ?? 40));
        const width = Math.max(1, legacy ? (size.z ?? 26) : (size?.width ?? 26));
        // Keep vertical thickness comparable to other road slabs.
        const thickness = Math.max(0.1, legacy ? (Math.max(0.1, (size?.y ?? 6) * 0.1)) : (size?.thickness ?? 0.6));
        const angleDeg = Math.max(1, Math.min(45, legacy ? 25 : (size?.angleDeg ?? 25)));
        const rise = Math.tan((angleDeg * Math.PI) / 180) * length;

        // Build a wedge with constant thickness.
        const geom = new THREE.BoxGeometry(length, thickness, width, 1, 1, 1);
        const pos = geom.attributes.position;
        for (let i = 0; i < pos.count; i += 1) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          // t: 0 at -length/2 (low end) -> 1 at +length/2 (high end)
          const t = (x + length / 2) / length;
          const baseY = t * rise;
          pos.setY(i, y > 0 ? (baseY + thickness) : baseY);
        }
        pos.needsUpdate = true;
        geom.computeVertexNormals();

        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        return mesh;
      }
    },

    road_ramp_45: {
      role: 'surface',
      build: ({ size, material }) => {
        const s = { ...(size || {}), angleDeg: size?.angleDeg ?? 45 };
        return pieceDefRegistry({ THREE }).road_ramp.build({ size: s, material });
      }
    },
    road_curve_90: {
      role: 'surface',
      build: ({ size, material }) => {
        const s = size || { radius: 30, width: 26, thickness: 0.6, angleDeg: 90 };
        const radius = Math.max(1, s.radius ?? 30);
        const width = Math.max(1, s.width ?? 26);
        const thickness = Math.max(0.1, s.thickness ?? 0.6);
        const angleDeg = Math.max(1, Math.min(90, s.angleDeg ?? 90));
        const angle = (angleDeg * Math.PI) / 180;

        const inner = Math.max(1, radius - width / 2);
        const outer = radius + width / 2;

        // Build an annulus sector (ring slice) and extrude for road thickness.
        // Use explicit radial edges to avoid degenerate/"flat" shapes.
        const shape = new THREE.Shape();
        const segments = Math.max(8, Math.floor(angleDeg / 5));
        const innerStartX = inner;
        const innerStartY = 0;
        const outerStartX = outer;
        const outerStartY = 0;
        const outerEndX = Math.cos(angle) * outer;
        const outerEndY = -Math.sin(angle) * outer;
        const innerEndX = Math.cos(angle) * inner;
        const innerEndY = -Math.sin(angle) * inner;

        shape.moveTo(innerStartX, innerStartY);
        shape.lineTo(outerStartX, outerStartY);
        shape.absarc(0, 0, outer, 0, angle, false);
        shape.lineTo(innerEndX, innerEndY);
        shape.absarc(0, 0, inner, angle, 0, true);
        shape.closePath();

        const geom = new THREE.ExtrudeGeometry(shape, {
          depth: thickness,
          bevelEnabled: false,
          curveSegments: segments
        });
        // Extrude depth is along +Z; rotate so depth becomes +Y (vertical thickness).
        geom.rotateX(Math.PI / 2);

        // Center the piece around its AABB so it behaves like other centered pieces.
        geom.computeBoundingBox();
        if (geom.boundingBox) {
          const center = new THREE.Vector3();
          geom.boundingBox.getCenter(center);
          geom.translate(-center.x, -center.y, -center.z);
        }

        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        return mesh;
      }
    },

    // Unified curve piece (angleDeg: 1..90). Prefer this over legacy ids.
    road_curve: {
      role: 'surface',
      build: ({ size, material }) => {
        return pieceDefRegistry({ THREE }).road_curve_90.build({ size, material });
      }
    },

    road_curve_45: {
      role: 'surface',
      build: ({ size, material }) => {
        const s = { ...(size || {}), angleDeg: size?.angleDeg ?? 45 };
        return pieceDefRegistry({ THREE }).road_curve_90.build({ size: s, material });
      }
    },

    // Walls / barriers
    wall_straight: {
      role: 'wall',
      build: ({ size, material }) => {
        const s = size || { x: 40, y: 2.3, z: 0.6 };
        const geom = new THREE.BoxGeometry(s.x, s.y, s.z);
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
      }
    },
    barrier_block: {
      role: 'wall',
      build: ({ size, material }) => {
        const s = size || { x: 3, y: 2, z: 3 };
        const geom = new THREE.BoxGeometry(s.x, s.y, s.z);
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
      }
    },
    barrier_pipe: {
      role: 'wall',
      build: ({ size, material }) => {
        const s = size || { radius: 0.6, length: 10 };
        const geom = new THREE.CylinderGeometry(s.radius, s.radius, s.length, 14);
        geom.rotateZ(Math.PI / 2);
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
      }
    },
    barrier_cone: {
      role: 'wall',
      build: ({ size, material }) => {
        const s = size || { radius: 1.2, height: 2.4 };
        const geom = new THREE.ConeGeometry(s.radius, s.height, 10);
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
      }
    },

    // Props
    prop_pillar: {
      role: 'prop',
      build: ({ size, material }) => {
        const s = size || { radius: 1.8, height: 10 };
        const geom = new THREE.CylinderGeometry(s.radius, s.radius, s.height, 16);
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
      }
    },
    prop_ring: {
      role: 'prop',
      build: ({ size, material }) => {
        const s = size || { radius: 6, tube: 0.6 };
        const geom = new THREE.TorusGeometry(s.radius, s.tube, 10, 22);
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
      }
    },
    prop_arch: {
      role: 'prop',
      build: ({ size, material }) => {
        const s = size || { width: 16, height: 10, depth: 2, legThickness: 1.2 };
        const group = new THREE.Group();

        const legGeom = new THREE.BoxGeometry(s.legThickness, s.height, s.depth);
        const topGeom = new THREE.BoxGeometry(s.width, s.legThickness, s.depth);

        const left = new THREE.Mesh(legGeom, material);
        left.position.set(-s.width / 2 + s.legThickness / 2, s.height / 2, 0);
        const right = new THREE.Mesh(legGeom, material);
        right.position.set(s.width / 2 - s.legThickness / 2, s.height / 2, 0);
        const top = new THREE.Mesh(topGeom, material);
        top.position.set(0, s.height - s.legThickness / 2, 0);

        [left, right, top].forEach((m) => {
          m.receiveShadow = true;
          m.castShadow = true;
          group.add(m);
        });
        return group;
      }
    },
    prop_tree: {
      // Trees should collide; treat them as wall colliders.
      role: 'wall',
      build: ({ size, material, materialSecondary }) => {
        const s = size || { trunkRadius: 0.6, trunkHeight: 4.5, crownRadius: 2.2, crownHeight: 4 };
        const group = new THREE.Group();

        const trunkMat = material;
        const leavesMat = materialSecondary || material;

        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(s.trunkRadius, s.trunkRadius, s.trunkHeight, 10),
          trunkMat
        );
        trunk.position.y = s.trunkHeight / 2;

        const crown = new THREE.Mesh(
          new THREE.ConeGeometry(s.crownRadius, s.crownHeight, 10),
          leavesMat
        );
        crown.position.y = s.trunkHeight + s.crownHeight / 2;
        [trunk, crown].forEach((m) => {
          m.receiveShadow = true;
          m.castShadow = true;
          group.add(m);
        });
        return group;
      }
    }
  };
}

export function listAvailablePieces() {
  return [
    { id: 'road_straight', role: 'surface', description: 'Flat rectangular road segment' },
    { id: 'road_straight_short', role: 'surface', description: 'Short flat road segment' },
    { id: 'road_straight_long', role: 'surface', description: 'Long flat road segment' },
    { id: 'road_platform', role: 'surface', description: 'Square platform road segment' },
    { id: 'road_curve', role: 'surface', description: 'Configurable curve segment (1–90°)' },
    { id: 'road_curve_90', role: 'surface', description: 'Quarter-turn curve segment' },
    { id: 'road_curve_45', role: 'surface', description: 'Eighth-turn curve segment' },
    { id: 'road_ramp', role: 'surface', description: 'Simple wedge ramp segment' },
    { id: 'road_ramp_45', role: 'surface', description: 'Steep 45° ramp segment' },
    { id: 'wall_straight', role: 'wall', description: 'Straight barrier wall segment' },
    { id: 'barrier_block', role: 'wall', description: 'Small cube barrier block' },
    { id: 'barrier_pipe', role: 'wall', description: 'Horizontal pipe barrier' },
    { id: 'barrier_cone', role: 'wall', description: 'Cone barrier (collision)' },
    { id: 'prop_pillar', role: 'prop', description: 'Simple cylinder pillar (decor)' },
    { id: 'prop_ring', role: 'prop', description: 'Torus ring (decor)' },
    { id: 'prop_arch', role: 'prop', description: 'Simple arch (two legs + top beam)' },
    { id: 'prop_tree', role: 'wall', description: 'Stylized tree (collides); supports trunk + leaves colors' }
  ];
}

function ensureModularSpec(spec) {
  const s = spec || {};
  return {
    version: s.version ?? 1,
    type: 'modular',
    name: s.name || 'Modular Track',
    materials: s.materials || {},
    pieces: Array.isArray(s.pieces) ? s.pieces : [],
    markers: {
      start: Array.isArray(s.markers?.start) ? s.markers.start : [],
      checkpoints: Array.isArray(s.markers?.checkpoints) ? s.markers.checkpoints : [],
      items: Array.isArray(s.markers?.items) ? s.markers.items : []
    }
  };
}

function tryBuildBVH(mesh) {
  if (!mesh?.geometry?.computeBoundsTree) return;
  try { mesh.geometry.computeBoundsTree(); } catch { /* ignore */ }
}

function anchorObjectToBottom({ THREE, obj }) {
  if (!THREE || !obj) return;
  // The editor treats piece.position as a ground-anchor (bottom center). Many of the
  // generated geometries are centered around the origin, so lift them so their local
  // bounding-box bottom sits at y=0 before applying world transforms.
  const box = new THREE.Box3().setFromObject(obj);
  if (!box || !Number.isFinite(box.min?.y) || !Number.isFinite(box.max?.y)) return;
  const dy = -box.min.y;
  if (Math.abs(dy) < 1e-6) return;
  obj.position.y += dy;
}

function addSurfaceMeshesFromObject(obj, surfaces) {
  if (!obj) return;
  if (obj.userData?._surfaceMeshes && Array.isArray(obj.userData._surfaceMeshes)) {
    obj.userData._surfaceMeshes.forEach((m) => surfaces.push(m));
    return;
  }
  if (obj.isMesh) {
    surfaces.push(obj);
    return;
  }
  obj.traverse?.((c) => {
    if (c.isMesh) surfaces.push(c);
  });
}

function setSurfaceTypeOnObject(obj, surfaceType) {
  if (!obj || !surfaceType) return;
  if (obj.userData?._surfaceMeshes && Array.isArray(obj.userData._surfaceMeshes)) {
    obj.userData._surfaceMeshes.forEach((m) => {
      if (m && m.userData) m.userData.surfaceType = surfaceType;
    });
    return;
  }
  if (obj.isMesh) {
    obj.userData = obj.userData || {};
    obj.userData.surfaceType = surfaceType;
    return;
  }
  obj.traverse?.((c) => {
    if (c && c.isMesh) {
      c.userData = c.userData || {};
      c.userData.surfaceType = surfaceType;
    }
  });
}

export function buildTrackFromModularSpec({ THREE, scene, config, spec }) {
  const s = ensureModularSpec(spec);
  const cfgDefaults = {
    road: config?.track?.surface || { color: 0x1f2933, roughness: 0.78, metalness: 0.08 },
    offroadWeak: { color: 0x3a3a2a, roughness: 0.95, metalness: 0.02 },
    offroadStrong: { color: 0x2e221a, roughness: 0.98, metalness: 0.01 },
    boost: { color: 0x7c5cff, roughness: 0.35, metalness: 0.15, emissive: 0x2a18a8, emissiveIntensity: 0.9 },
    wall: config?.track?.guardrail || { color: 0x35435a, roughness: 0.45, metalness: 0.05, side: 'double' },
    prop: { color: 0x8aa0b8, roughness: 0.55, metalness: 0.05 },
    marker: { color: 0x22c55e, roughness: 0.7, metalness: 0.05, emissive: 0x0b3d2e, emissiveIntensity: 0.4 }
  };
  const materials = createMaterialResolver({ THREE, specMaterials: s.materials, configDefaults: cfgDefaults });
  const registry = pieceDefRegistry({ THREE });

  const group = new THREE.Group();
  group.name = s.name;

  const surfaces = [];
  const walls = [];

  s.pieces.forEach((p, idx) => {
    const kind = p.kind || 'road_straight';
    const def = registry[kind];
    if (!def) {
      console.warn('[Modular] Unknown piece kind:', kind);
      return;
    }

    const role = def.role;
    const fallbackKey = role === 'wall' ? 'wall' : (role === 'surface' ? 'road' : 'prop');

    // Per-piece override support:
    // - piece.material can be a string key into spec.materials OR an inline material def.
    // - piece.materialOverride (object) merges on top of the base material.
    let materialRefOrInline = p.material;
    if (p.materialOverride && typeof p.materialOverride === 'object') {
      if (typeof p.material === 'string') {
        materialRefOrInline = { ...(s.materials?.[p.material] || {}), ...(p.materialOverride || {}) };
      } else if (p.material && typeof p.material === 'object') {
        materialRefOrInline = { ...(p.material || {}), ...(p.materialOverride || {}) };
      } else {
        materialRefOrInline = { ...(p.materialOverride || {}) };
      }
    }

    const mat = materials.resolve(materialRefOrInline, fallbackKey);

    // Optional per-piece secondary material override (used by certain pieces like trees).
    let matSecondary = null;
    if (p.materialSecondary || p.materialOverrideSecondary) {
      let secondaryRefOrInline = p.materialSecondary;
      if (p.materialOverrideSecondary && typeof p.materialOverrideSecondary === 'object') {
        if (typeof p.materialSecondary === 'string') {
          secondaryRefOrInline = { ...(s.materials?.[p.materialSecondary] || {}), ...(p.materialOverrideSecondary || {}) };
        } else if (p.materialSecondary && typeof p.materialSecondary === 'object') {
          secondaryRefOrInline = { ...(p.materialSecondary || {}), ...(p.materialOverrideSecondary || {}) };
        } else {
          // If no explicit secondary base, layer on top of the primary base.
          if (typeof p.material === 'string') secondaryRefOrInline = { ...(s.materials?.[p.material] || {}), ...(p.materialOverrideSecondary || {}) };
          else if (p.material && typeof p.material === 'object') secondaryRefOrInline = { ...(p.material || {}), ...(p.materialOverrideSecondary || {}) };
          else secondaryRefOrInline = { ...(p.materialOverrideSecondary || {}) };
        }
      }
      matSecondary = materials.resolve(secondaryRefOrInline, fallbackKey);
    }

    const obj = def.build({ size: p.size, material: mat, materialSecondary: matSecondary });

    // Make piece.position behave like a bottom-anchor (editor convention).
    anchorObjectToBottom({ THREE, obj });

    obj.name = `Piece_${kind}_${idx}`;
    applyTransform(obj, {
      position: v3(THREE, p.position),
      rotation: p.rotation?.isEuler ? p.rotation : { x: p.rotation?.x ?? 0, y: p.rotation?.y ?? 0, z: p.rotation?.z ?? 0 },
      scale: p.scale
    });

    if (obj.isMesh) {
      tryBuildBVH(obj);
    } else {
      obj.traverse?.((c) => {
        if (c.isMesh) tryBuildBVH(c);
      });
    }

    group.add(obj);

    if (role === 'surface') {
      const surfaceType = p.surfaceType || (typeof p.material === 'string' ? p.material : 'road');
      setSurfaceTypeOnObject(obj, surfaceType);
      addSurfaceMeshesFromObject(obj, surfaces);
    } else if (role === 'wall') {
      if (obj.isMesh) walls.push({ mesh: obj, name: obj.name });
      else {
        obj.traverse?.((c) => {
          if (c.isMesh) walls.push({ mesh: c, name: c.name });
        });
      }
    }
  });

  // Markers -> TrackLoader-compatible data
  const checkpoints = [];
  const dropoffPoints = [];
  const startPositions = [];
  const itemBoxLocations = [];

  if (s.markers.start.length > 0) {
    s.markers.start.forEach((st, idx) => {
      startPositions.push({ index: idx, position: v3(THREE, st.position), rotation: eulerY(THREE, st.rotation) });
    });
  } else {
    startPositions.push({ index: 0, position: v3(THREE, s.pieces[0]?.position), rotation: 0 });
  }

  if (s.markers.checkpoints.length > 0) {
    s.markers.checkpoints.forEach((cp, idx) => {
      const center = v3(THREE, cp.position);
      const size = v3(THREE, cp.size, { x: 30, y: 10, z: 8 });

      const rot = cp?.rotation || { x: 0, y: 0, z: 0 };
      const e = new THREE.Euler(rot.x ?? 0, rot.y ?? 0, rot.z ?? 0, 'XYZ');
      const q = new THREE.Quaternion().setFromEuler(e);
      const invQuat = q.clone().invert();
      const halfSize = size.clone().multiplyScalar(0.5);

      // Build an enclosing AABB (for broadphase/debug) that matches the rotated box.
      const m4 = new THREE.Matrix4().makeRotationFromQuaternion(q);
      const m3 = new THREE.Matrix3().setFromMatrix4(m4);
      const e0 = Math.abs(m3.elements[0]) * halfSize.x + Math.abs(m3.elements[1]) * halfSize.y + Math.abs(m3.elements[2]) * halfSize.z;
      const e1 = Math.abs(m3.elements[3]) * halfSize.x + Math.abs(m3.elements[4]) * halfSize.y + Math.abs(m3.elements[5]) * halfSize.z;
      const e2 = Math.abs(m3.elements[6]) * halfSize.x + Math.abs(m3.elements[7]) * halfSize.y + Math.abs(m3.elements[8]) * halfSize.z;
      const aabbSize = new THREE.Vector3(e0 * 2, e1 * 2, e2 * 2);
      const box = new THREE.Box3().setFromCenterAndSize(center, aabbSize);

      checkpoints.push({
        index: idx,
        position: center.clone(),
        box,
        size,
        rotation: { x: e.x, y: e.y, z: e.z },
        obb: { center: center.clone(), halfSize, invQuat },
        isFinishLine: idx === 0,
        name: `Checkpoint${idx}`
      });
    });
  } else {
    const center = startPositions[0].position.clone();
    const size = new THREE.Vector3(30, 10, 8);
    const halfSize = size.clone().multiplyScalar(0.5);
    const invQuat = new THREE.Quaternion();
    const box = new THREE.Box3().setFromCenterAndSize(center, size);
    checkpoints.push({
      index: 0,
      position: center.clone(),
      box,
      size,
      rotation: { x: 0, y: 0, z: 0 },
      obb: { center: center.clone(), halfSize, invQuat },
      isFinishLine: true,
      name: 'Checkpoint0'
    });
  }

  s.markers.items.forEach((it, idx) => {
    itemBoxLocations.push({ index: idx, position: v3(THREE, it.position) });
  });

  const boundsBox = new THREE.Box3().setFromObject(group);
  if (scene) scene.add(group);

  return {
    group,
    surfaces,
    walls,
    trickZones: [],
    checkpoints,
    dropoffPoints,
    itemBoxLocations,
    startPositions,
    bounds: { min: boundsBox.min.clone(), max: boundsBox.max.clone() }
  };
}

export default {
  listAvailablePieces,
  buildTrackFromModularSpec,
  createMaterialResolver
};
