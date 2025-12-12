export class RibbonTrackBuilder {
  constructor() {
    this.type = 'ribbon';
  }

  /**
   * Build a simple ribbon track from a centerline.
   * Returns objects compatible with TrackLoader.trackData.
   */
  build({ THREE, scene, config, spec }) {
    const group = new THREE.Group();
    group.name = 'GeneratedTrack';

    const normalized = this._normalizeSpec(spec);
    const points = normalized.centerline.points;

    const surfaceMesh = this._buildSurfaceMesh({ THREE, config, points, closed: normalized.closed, width: normalized.width });
    surfaceMesh.name = 'Track_Generated';
    group.add(surfaceMesh);

    const wallMeshes = [];
    if (normalized.wall.enabled) {
      const walls = this._buildWallMeshes({ THREE, config, points, closed: normalized.closed, width: normalized.width, wall: normalized.wall });
      walls.forEach((m, idx) => {
        m.name = `Wall_Generated_${idx}`;
        group.add(m);
        wallMeshes.push(m);
      });
    }

    // Compute bounds
    const bounds = new THREE.Box3().setFromObject(group);

    // Gameplay markers
    const { checkpoints, startPositions } = this._buildMarkers({ THREE, points, closed: normalized.closed, width: normalized.width, checkpointSpacing: normalized.checkpoints.spacing });

    // BVH acceleration
    this._tryBuildBVH(surfaceMesh);
    wallMeshes.forEach((m) => this._tryBuildBVH(m));

    // Add to scene if provided
    if (scene) scene.add(group);

    return {
      group,
      surfaces: [surfaceMesh],
      walls: wallMeshes.map(mesh => ({ mesh, name: mesh.name })),
      trickZones: [],
      checkpoints,
      dropoffPoints: [],
      itemBoxLocations: normalized.items.map((p, index) => ({ index, position: new THREE.Vector3(p.x, p.y ?? 0, p.z) })),
      startPositions,
      bounds: { min: bounds.min.clone(), max: bounds.max.clone() }
    };
  }

  _normalizeSpec(spec) {
    const s = spec || {};
    const width = typeof s.width === 'number' ? s.width : 26;
    const closed = s.closed !== false;
    const wall = {
      enabled: s.wall?.enabled !== false,
      height: typeof s.wall?.height === 'number' ? s.wall.height : 2.3,
      thickness: typeof s.wall?.thickness === 'number' ? s.wall.thickness : 0.5
    };
    const checkpoints = {
      spacing: typeof s.checkpoints?.spacing === 'number' ? s.checkpoints.spacing : 80
    };
    const centerline = {
      points: Array.isArray(s.centerline?.points) ? s.centerline.points : []
    };
    const items = Array.isArray(s.items) ? s.items : [];

    return {
      version: s.version ?? 1,
      type: s.type || 'ribbon',
      name: s.name || 'Untitled Track',
      width,
      closed,
      wall,
      checkpoints,
      centerline,
      items
    };
  }

  _buildSurfaceMesh({ THREE, config, points, closed, width }) {
    const resolved = this._ensureMinPoints(points);
    const { left, right, u } = this._computeOffsets({ THREE, points: resolved, closed, halfWidth: width * 0.5 });

    const vertexCount = left.length * 2;
    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);

    for (let i = 0; i < left.length; i += 1) {
      const li = i * 2;
      const ri = i * 2 + 1;
      positions[li * 3 + 0] = left[i].x;
      positions[li * 3 + 1] = left[i].y;
      positions[li * 3 + 2] = left[i].z;
      positions[ri * 3 + 0] = right[i].x;
      positions[ri * 3 + 1] = right[i].y;
      positions[ri * 3 + 2] = right[i].z;

      uvs[li * 2 + 0] = 0;
      uvs[li * 2 + 1] = u[i];
      uvs[ri * 2 + 0] = 1;
      uvs[ri * 2 + 1] = u[i];
    }

    const segments = left.length - 1;
    const indexCount = segments * 6;
    const indices = new Uint32Array(indexCount);
    for (let i = 0; i < segments; i += 1) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      const base = i * 6;
      indices[base + 0] = a;
      indices[base + 1] = c;
      indices[base + 2] = b;
      indices[base + 3] = b;
      indices[base + 4] = c;
      indices[base + 5] = d;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    geom.computeVertexNormals();

    const matCfg = config?.track?.surface || {};
    const material = new THREE.MeshStandardMaterial({
      color: matCfg.color ?? 0x1f2933,
      roughness: matCfg.roughness ?? 0.78,
      metalness: matCfg.metalness ?? 0.08
    });

    const mesh = new THREE.Mesh(geom, material);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    return mesh;
  }

  _buildWallMeshes({ THREE, config, points, closed, width, wall }) {
    const resolved = this._ensureMinPoints(points);
    const { left, right } = this._computeOffsets({ THREE, points: resolved, closed, halfWidth: width * 0.5 });

    const wallHeight = wall.height;
    const wallThickness = wall.thickness;

    const makeStrip = (edgePoints, outwardSign) => {
      const count = edgePoints.length;
      const positions = new Float32Array(count * 2 * 3);
      for (let i = 0; i < count; i += 1) {
        const p = edgePoints[i];
        const base = i * 2;
        positions[(base + 0) * 3 + 0] = p.x;
        positions[(base + 0) * 3 + 1] = p.y;
        positions[(base + 0) * 3 + 2] = p.z;
        positions[(base + 1) * 3 + 0] = p.x;
        positions[(base + 1) * 3 + 1] = p.y + wallHeight;
        positions[(base + 1) * 3 + 2] = p.z;
      }

      const segments = count - 1;
      const indices = new Uint32Array(segments * 6);
      for (let i = 0; i < segments; i += 1) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        const base = i * 6;
        // two triangles
        indices[base + 0] = a;
        indices[base + 1] = c;
        indices[base + 2] = b;
        indices[base + 3] = b;
        indices[base + 4] = c;
        indices[base + 5] = d;
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setIndex(new THREE.BufferAttribute(indices, 1));
      geom.computeVertexNormals();

      const cfg = config?.track?.guardrail || {};
      const material = new THREE.MeshStandardMaterial({
        color: cfg.color ?? 0x35435a,
        roughness: cfg.roughness ?? 0.45,
        metalness: 0.05,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Inflate a tiny thickness by offsetting the strip outward using a second clone.
      // (Keeps MVP simple while still giving collision something with depth.)
      if (wallThickness > 0.01) {
        const clone = mesh.clone();
        clone.material = material;
        clone.geometry = geom;
        // approximate outward in world XZ: we just add a slight normal-based expansion in compute step later if needed.
        // For now: leave as zero-thickness; raycast walls still works fine.
      }

      return mesh;
    };

    // Left and right strips.
    // (Even zero-thickness is ok for raycast collision in this game.)
    return [makeStrip(left, 1), makeStrip(right, -1)];
  }

  _buildMarkers({ THREE, points, closed, width, checkpointSpacing }) {
    const resolved = this._ensureMinPoints(points);
    const positions = resolved.map((p) => new THREE.Vector3(p.x, p.y ?? 0, p.z));

    const startPos = positions[0].clone();
    const dir = positions[1].clone().sub(positions[0]);
    dir.y = 0;
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
    dir.normalize();
    const heading = Math.atan2(dir.x, dir.z);

    const startPositions = [{ index: 0, position: startPos, rotation: heading }];

    const checkpoints = [];
    const total = this._polylineLength(positions, closed);
    const spacing = Math.max(10, checkpointSpacing || 80);

    let nextDist = 0;
    let idx = 0;
    while (nextDist <= total + 1e-6 && idx < 512) {
      const p = this._pointAtDistance(positions, closed, nextDist);
      const box = new THREE.Box3().setFromCenterAndSize(
        p.clone(),
        new THREE.Vector3(width * 1.2, 10, Math.max(6, width * 0.35))
      );
      checkpoints.push({
        index: idx,
        position: p.clone(),
        box,
        isFinishLine: idx === 0,
        name: `Checkpoint${idx}`
      });
      idx += 1;
      nextDist += spacing;
    }

    return { checkpoints, startPositions };
  }

  _ensureMinPoints(points) {
    const pts = (points || []).filter(p => p && typeof p.x === 'number' && typeof p.z === 'number');
    if (pts.length >= 2) return pts;
    return [
      { x: 0, y: 0, z: 0 },
      { x: 50, y: 0, z: 0 },
      { x: 100, y: 0, z: 50 },
      { x: 50, y: 0, z: 100 },
      { x: 0, y: 0, z: 50 }
    ];
  }

  _computeOffsets({ THREE, points, closed, halfWidth }) {
    const pts = points.map(p => new THREE.Vector3(p.x, p.y ?? 0, p.z));
    const count = pts.length;

    // Compute cumulative length for UVs.
    const u = new Array(count).fill(0);
    let total = 0;
    for (let i = 1; i < count; i += 1) {
      total += pts[i].distanceTo(pts[i - 1]);
      u[i] = total;
    }
    if (total > 0) {
      for (let i = 0; i < count; i += 1) u[i] /= total;
    }

    const left = [];
    const right = [];

    const tangent = (i) => {
      const prev = i === 0 ? (closed ? pts[count - 2] : pts[0]) : pts[i - 1];
      const next = i === count - 1 ? (closed ? pts[1] : pts[count - 1]) : pts[i + 1];
      const t = next.clone().sub(prev);
      t.y = 0;
      if (t.lengthSq() < 1e-6) t.set(0, 0, 1);
      return t.normalize();
    };

    for (let i = 0; i < count; i += 1) {
      const t = tangent(i);
      const n = new THREE.Vector3(-t.z, 0, t.x); // left normal in XZ
      const l = pts[i].clone().addScaledVector(n, halfWidth);
      const r = pts[i].clone().addScaledVector(n, -halfWidth);
      left.push(l);
      right.push(r);
    }

    return { left, right, u };
  }

  _tryBuildBVH(mesh) {
    if (!mesh?.geometry?.computeBoundsTree) return;
    try {
      mesh.geometry.computeBoundsTree();
    } catch {
      // ignore
    }
  }

  _polylineLength(points, closed) {
    if (points.length < 2) return 0;
    let len = 0;
    for (let i = 1; i < points.length; i += 1) {
      len += points[i].distanceTo(points[i - 1]);
    }
    if (closed) len += points[0].distanceTo(points[points.length - 1]);
    return len;
  }

  _pointAtDistance(points, closed, dist) {
    if (points.length < 2) return points[0]?.clone() || null;
    const total = this._polylineLength(points, closed);
    let d = dist;
    if (closed && total > 0) {
      d = ((d % total) + total) % total;
    }

    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const seg = b.distanceTo(a);
      if (d <= seg) {
        const t = seg > 0 ? d / seg : 0;
        return a.clone().lerp(b, t);
      }
      d -= seg;
    }

    if (closed) {
      const a = points[points.length - 1];
      const b = points[0];
      const seg = b.distanceTo(a);
      const t = seg > 0 ? d / seg : 0;
      return a.clone().lerp(b, t);
    }

    return points[points.length - 1].clone();
  }
}

export default RibbonTrackBuilder;
