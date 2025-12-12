import { createTrackBuilder } from '../trackBuilders/index.js';
import { FreeFlyControls } from './freeFlyControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function defaultTrackSpec() {
  return {
    version: 1,
    type: 'modular',
    name: 'New Modular Track',
    materials: {
      road: { type: 'standard', color: '#1f2933', roughness: 0.78, metalness: 0.08 },
      offroadWeak: { type: 'standard', color: '#3a3a2a', roughness: 0.95, metalness: 0.02 },
      offroadStrong: { type: 'standard', color: '#2e221a', roughness: 0.98, metalness: 0.01 },
      boost: { type: 'standard', color: '#7c5cff', roughness: 0.35, metalness: 0.15, emissive: '#2a18a8', emissiveIntensity: 0.9 },
      wall: { type: 'standard', color: '#35435a', roughness: 0.45, metalness: 0.05, side: 'double' },
      prop: { type: 'standard', color: '#8aa0b8', roughness: 0.55, metalness: 0.05 }
    },
    pieces: [
      { kind: 'road_straight', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, size: { x: 60, y: 0.6, z: 26 }, material: 'road' },
      { kind: 'wall_straight', position: { x: 0, y: 1.15, z: -13.5 }, rotation: { x: 0, y: 0, z: 0 }, size: { x: 60, y: 2.3, z: 0.6 }, material: 'wall' },
      { kind: 'wall_straight', position: { x: 0, y: 1.15, z: 13.5 }, rotation: { x: 0, y: 0, z: 0 }, size: { x: 60, y: 2.3, z: 0.6 }, material: 'wall' }
    ],
    markers: {
      start: [{ position: { x: -20, y: 0, z: 0 }, rotation: { y: 0 } }],
      checkpoints: [{ position: { x: 0, y: 2, z: 0 }, size: { x: 30, y: 10, z: 8 } }],
      items: []
    }
  };
}

function loadSavedTrackSpec() {
  try {
    const raw = localStorage.getItem('hadleekart.trackSpec');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveTrackSpec(spec) {
  localStorage.setItem('hadleekart.trackSpec', JSON.stringify(spec));
}

function deepCloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export class TrackEditorMode {
  constructor() {
    this._active = false;
    this._root = null;
    this._ui = null;
    this._controls = null;
    this._fly = null;
    this._grid = null;
    this._lights = [];

    this._THREE = null;
    this._scene = null;
    this._camera = null;
    this._renderer = null;
    this._config = null;

    this._builder = null;
    this._generated = null;

    this._spec = defaultTrackSpec();

    this._raycaster = null;
    this._plane = null;

    this._piecesGroup = null;
    this._pieceMeshes = [];
    this._selectedPieceIndex = -1;
    this._selection = new Set();
    this._selectionPivot = null;
    this._pivotAttached = false;
    this._pivotStart = null;
    this._multiStart = null;
    this._transform = null;
    this._transformHelper = null;
    this._placement = { kind: 'road_straight', material: 'road' };
    this._placementPreview = null;
    this._previewMat = null;
    this._previewLastHit = null;

    this._snap = {
      enabled: true,
      translate: 1,
      rotateDeg: 12.5,
      scale: 0.1
    };

    this._mods = { shift: false, ctrl: false, alt: false, meta: false };

    this._pieceMatOverrideEnabledEl = null;
    this._pieceMatColorEl = null;
    this._pieceMatColor2El = null;
    this._pieceMatRoughEl = null;
    this._pieceMatMetalEl = null;

    this._handlers = {};
    this._onExitToMenu = null;
    this._onPlaytest = null;

    this._history = [];
    this._historyIndex = -1;
    this._historyMax = 120;
    this._transformDragSnapshot = null;
    this._transformDragWasMulti = false;

    this._historyDebounceTimer = null;

    this._gizmoMatDefault = null;
    this._gizmoMatSelected = null;
  }

  async enter({ THREE, scene, camera, renderer, config, container, onExitToMenu, onPlaytest }) {
    this._active = true;
    this._THREE = THREE;
    this._scene = scene;
    this._camera = camera;
    this._renderer = renderer;
    this._config = config;
    this._onExitToMenu = onExitToMenu;
    this._onPlaytest = onPlaytest;

    this._builder = createTrackBuilder('modular');

    this._root = new THREE.Group();
    this._root.name = 'EditorRoot';
    scene.add(this._root);

    // Give the user a clear 3D view immediately.
    camera.position.set(120, 85, 120);
    camera.lookAt(50, 0, 50);
    camera.updateProjectionMatrix();

    // A simple background so it's not an empty gray.
    scene.background = new THREE.Color(0x0c0f16);

    // Lighting (track mesh uses standard material).
    const hemi = new THREE.HemisphereLight(0xcfd9ff, 0x060608, 0.9);
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(50, 90, 30);
    sun.castShadow = false;
    this._root.add(hemi);
    this._root.add(sun);
    this._lights = [hemi, sun];

    this._grid = new THREE.GridHelper(600, 60, 0x243244, 0x1b2433);
    this._grid.position.y = 0;
    this._root.add(this._grid);

    this._raycaster = new THREE.Raycaster();
    this._plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Fly camera (WASD move, QE up/down, hold RMB to look, Shift to go fast)
    this._fly = new FreeFlyControls({ THREE, camera, domElement: renderer.domElement });

    // UI overlay
    const ui = document.createElement('div');
    ui.className = 'editor-panel';
    ui.innerHTML = `
      <div class="editor-row">
        <div class="editor-title">Track Editor</div>
        <div class="editor-actions">
          <button id="editor-back" class="editor-btn">Back</button>
          <button id="editor-save" class="editor-btn">Save</button>
          <button id="editor-export" class="editor-btn">Export JSON</button>
          <button id="editor-play" class="editor-btn editor-btn-primary">Playtest</button>
        </div>
      </div>

      <div class="editor-row editor-controls">
        <label class="editor-label">Piece
          <select id="editor-piece">
            <option value="road_straight">road_straight</option>
            <option value="road_straight_short">road_straight_short</option>
            <option value="road_straight_long">road_straight_long</option>
            <option value="road_platform">road_platform</option>
            <option value="road_curve_90">road_curve_90</option>
            <option value="road_ramp">road_ramp</option>
            <option value="wall_straight">wall_straight</option>
            <option value="barrier_block">barrier_block</option>
            <option value="barrier_pipe">barrier_pipe</option>
            <option value="barrier_cone">barrier_cone</option>
            <option value="prop_pillar">prop_pillar</option>
            <option value="prop_ring">prop_ring</option>
            <option value="prop_arch">prop_arch</option>
            <option value="prop_tree">prop_tree</option>
          </select>
        </label>
        <label class="editor-label">Material
          <select id="editor-mat">
            <option value="road">road</option>
            <option value="offroadWeak">offroadWeak</option>
            <option value="offroadStrong">offroadStrong</option>
            <option value="boost">boost</option>
            <option value="wall">wall</option>
            <option value="prop">prop</option>
          </select>
        </label>
        <button id="editor-mode-move" class="editor-btn">Move</button>
        <button id="editor-mode-rotate" class="editor-btn">Rotate</button>
        <button id="editor-mode-scale" class="editor-btn">Scale</button>
        <button id="editor-delete" class="editor-btn">Delete</button>
      </div>

      <div class="editor-row editor-controls">
        <label class="editor-label"><input id="editor-snap-enabled" type="checkbox"> Snap</label>
        <label class="editor-label">Grid <input id="editor-snap-grid" type="number" min="0" step="0.25" value="1" style="width: 70px;"></label>
        <label class="editor-label">Angle° <input id="editor-snap-rot" type="number" min="0" step="0.5" value="12.5" style="width: 70px;"></label>
      </div>

      <div class="editor-row editor-controls">
        <div class="editor-title" style="font-size: 13px; opacity: 0.85;">Materials</div>
      </div>
      <div class="editor-row editor-controls">
        <div class="editor-mat-grid" style="display: grid; grid-template-columns: 90px 1fr 1fr 1fr; gap: 8px; align-items: center; width: 100%;">
          <div style="opacity: 0.8;">Key</div>
          <div style="opacity: 0.8;">Color</div>
          <div style="opacity: 0.8;">Rough</div>
          <div style="opacity: 0.8;">Metal</div>

          <div>road</div>
          <input id="mat-road-color" type="color">
          <input id="mat-road-rough" type="range" min="0" max="1" step="0.01">
          <input id="mat-road-metal" type="range" min="0" max="1" step="0.01">

          <div>offroadWeak</div>
          <input id="mat-offroadWeak-color" type="color">
          <input id="mat-offroadWeak-rough" type="range" min="0" max="1" step="0.01">
          <input id="mat-offroadWeak-metal" type="range" min="0" max="1" step="0.01">

          <div>offroadStrong</div>
          <input id="mat-offroadStrong-color" type="color">
          <input id="mat-offroadStrong-rough" type="range" min="0" max="1" step="0.01">
          <input id="mat-offroadStrong-metal" type="range" min="0" max="1" step="0.01">

          <div>boost</div>
          <input id="mat-boost-color" type="color">
          <input id="mat-boost-rough" type="range" min="0" max="1" step="0.01">
          <input id="mat-boost-metal" type="range" min="0" max="1" step="0.01">

          <div>wall</div>
          <input id="mat-wall-color" type="color">
          <input id="mat-wall-rough" type="range" min="0" max="1" step="0.01">
          <input id="mat-wall-metal" type="range" min="0" max="1" step="0.01">

          <div>prop</div>
          <input id="mat-prop-color" type="color">
          <input id="mat-prop-rough" type="range" min="0" max="1" step="0.01">
          <input id="mat-prop-metal" type="range" min="0" max="1" step="0.01">
        </div>
      </div>

      <div class="editor-row editor-controls">
        <div class="editor-title" style="font-size: 13px; opacity: 0.85;">Selected Piece Override</div>
      </div>
      <div class="editor-row editor-controls">
        <label class="editor-label"><input id="piece-mat-override" type="checkbox"> Override material</label>
        <label class="editor-label">Color <input id="piece-mat-color" type="color"></label>
        <label class="editor-label">Leaves <input id="piece-mat-color-2" type="color"></label>
        <label class="editor-label">Rough <input id="piece-mat-rough" type="range" min="0" max="1" step="0.01"></label>
        <label class="editor-label">Metal <input id="piece-mat-metal" type="range" min="0" max="1" step="0.01"></label>
      </div>

      <div class="editor-help">
        LMB: place/select • Shift+LMB: multi-select • RMB+WASD: fly • G/R/S: move/rotate/scale • Ctrl+Z/Y: undo/redo • Ctrl+D: duplicate • F: focus • V: toggle snap • Alt: disable snap • Shift/Ctrl: finer snap
      </div>
    `;
    container.appendChild(ui);
    this._ui = ui;

    // Load last saved spec if present
    const saved = loadSavedTrackSpec();
    if (saved?.type === 'modular' && Array.isArray(saved?.pieces)) {
      this._spec = { ...defaultTrackSpec(), ...saved };
    }

    // Reset history/selection for a clean editor session.
    this._history = [];
    this._historyIndex = -1;
    this._selection.clear();
    this._selectedPieceIndex = -1;

    // Hook UI
    const pieceEl = ui.querySelector('#editor-piece');
    const matEl = ui.querySelector('#editor-mat');
    pieceEl.value = this._placement.kind;
    matEl.value = this._placement.material;
    pieceEl.addEventListener('change', () => {
      this._placement.kind = pieceEl.value;
    });
    matEl.addEventListener('change', () => {
      this._placement.material = matEl.value;
    });

    // Snap UI
    const snapEnabledEl = ui.querySelector('#editor-snap-enabled');
    const snapGridEl = ui.querySelector('#editor-snap-grid');
    const snapRotEl = ui.querySelector('#editor-snap-rot');
    snapEnabledEl.checked = !!this._snap.enabled;
    snapGridEl.value = String(this._snap.translate);
    snapRotEl.value = String(this._snap.rotateDeg);
    const applySnap = () => {
      this._snap.enabled = !!snapEnabledEl.checked;
      const grid = Number(snapGridEl.value);
      const rot = Number(snapRotEl.value);
      this._snap.translate = Number.isFinite(grid) && grid > 0 ? grid : 0;
      this._snap.rotateDeg = Number.isFinite(rot) && rot > 0 ? rot : 0;
      this._applyTransformSnapping();
      this._toast(this._snap.enabled ? 'Snap enabled' : 'Snap disabled');
    };
    snapEnabledEl.addEventListener('change', applySnap);
    snapGridEl.addEventListener('change', applySnap);
    snapRotEl.addEventListener('change', applySnap);

    // Materials UI bindings
    this._spec.materials = this._spec.materials || {};
    const bindMatRow = (key) => {
      const def = this._spec.materials[key] || {};
      this._spec.materials[key] = def;

      const colorEl = ui.querySelector(`#mat-${key}-color`);
      const roughEl = ui.querySelector(`#mat-${key}-rough`);
      const metalEl = ui.querySelector(`#mat-${key}-metal`);

      // Initialize
      colorEl.value = this._toHexColor(def.color ?? '#ffffff');
      roughEl.value = String(typeof def.roughness === 'number' ? def.roughness : 0.75);
      metalEl.value = String(typeof def.metalness === 'number' ? def.metalness : 0.05);

      const apply = () => {
        def.type = def.type || 'standard';
        def.color = colorEl.value;
        def.roughness = clamp(Number(roughEl.value), 0, 1);
        def.metalness = clamp(Number(metalEl.value), 0, 1);
        this._rebuild();
        this._scheduleHistoryPush();
      };

      colorEl.addEventListener('input', apply);
      roughEl.addEventListener('input', apply);
      metalEl.addEventListener('input', apply);
    };
    bindMatRow('road');
    bindMatRow('offroadWeak');
    bindMatRow('offroadStrong');
    bindMatRow('boost');
    bindMatRow('wall');
    bindMatRow('prop');

    // Selected-piece material override controls
    this._pieceMatOverrideEnabledEl = ui.querySelector('#piece-mat-override');
    this._pieceMatColorEl = ui.querySelector('#piece-mat-color');
    this._pieceMatColor2El = ui.querySelector('#piece-mat-color-2');
    this._pieceMatRoughEl = ui.querySelector('#piece-mat-rough');
    this._pieceMatMetalEl = ui.querySelector('#piece-mat-metal');

    const applySelectedOverride = () => {
      const idx = this._selectedPieceIndex;
      const piece = this._spec.pieces?.[idx];
      if (!piece) return;

      const enabled = !!this._pieceMatOverrideEnabledEl?.checked;
      if (!enabled) {
        piece.materialOverride = undefined;
        piece.materialOverrideSecondary = undefined;
        this._rebuild();
        this._scheduleHistoryPush();
        return;
      }

      piece.materialOverride = {
        type: 'standard',
        color: this._pieceMatColorEl?.value,
        roughness: clamp(Number(this._pieceMatRoughEl?.value ?? 0.75), 0, 1),
        metalness: clamp(Number(this._pieceMatMetalEl?.value ?? 0.05), 0, 1)
      };

      // Secondary color (primarily for tree leaves). Only applies if provided.
      const c2 = this._pieceMatColor2El?.value;
      piece.materialOverrideSecondary = c2
        ? { type: 'standard', color: c2 }
        : undefined;
      this._rebuild();
      this._scheduleHistoryPush();
    };

    this._pieceMatOverrideEnabledEl.addEventListener('change', applySelectedOverride);
    this._pieceMatColorEl.addEventListener('input', applySelectedOverride);
    this._pieceMatColor2El.addEventListener('input', applySelectedOverride);
    this._pieceMatRoughEl.addEventListener('input', applySelectedOverride);
    this._pieceMatMetalEl.addEventListener('input', applySelectedOverride);

    ui.querySelector('#editor-back').addEventListener('click', () => {
      if (typeof this._onExitToMenu === 'function') this._onExitToMenu();
    });
    ui.querySelector('#editor-save').addEventListener('click', () => {
      saveTrackSpec(this._spec);
      this._toast('Saved to local storage');
    });

    ui.querySelector('#editor-export').addEventListener('click', async () => {
      try {
        const blob = new Blob([JSON.stringify(this._spec, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(this._spec.name || 'track').replace(/[^a-z0-9_-]+/gi, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this._toast('Exported JSON');
      } catch (err) {
        console.error('[Editor] Export failed:', err);
        alert(`Export failed: ${err.message || err}`);
      }
    });
    ui.querySelector('#editor-play').addEventListener('click', () => {
      saveTrackSpec(this._spec);
      if (typeof this._onPlaytest === 'function') this._onPlaytest(this._spec);
    });

    // Piece gizmos (wireframe boxes, used for selection and TransformControls)
    this._piecesGroup = new THREE.Group();
    this._piecesGroup.name = 'EditorPieces';
    this._root.add(this._piecesGroup);

    // Placement preview (hover outline)
    this._previewMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      depthTest: true
    });
    this._placementPreview = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this._previewMat);
    this._placementPreview.name = 'PlacementPreview';
    this._placementPreview.visible = false;
    this._root.add(this._placementPreview);

    this._transform = new TransformControls(camera, renderer.domElement);
    this._transform.setMode('translate');
    this._applyTransformSnapping();
    this._transform.addEventListener('dragging-changed', (e) => {
      if (this._fly) this._fly.enabled = !e.value;

      // Capture a pre-drag snapshot for undo and (if multi) a transform baseline.
      if (e.value) {
        this._transformDragSnapshot = deepCloneJson(this._spec);
        this._transformDragWasMulti = this._selection.size > 1;

        if (this._transformDragWasMulti) {
          const pivot = this._selectionPivot;
          if (pivot) {
            this._pivotStart = {
              position: pivot.position.clone(),
              quaternion: pivot.quaternion.clone(),
              scale: pivot.scale.clone()
            };
          }
          const indices = Array.from(this._selection);
          this._multiStart = indices.map((idx) => {
            const obj = this._pieceMeshes[idx];
            if (!obj) return null;
            return {
              idx,
              position: obj.position.clone(),
              quaternion: obj.quaternion.clone(),
              rotation: obj.rotation.clone(),
              scale: obj.scale.clone()
            };
          }).filter(Boolean);
        } else {
          this._pivotStart = null;
          this._multiStart = null;
        }
        return;
      }

      // Drag ended: push a single history entry for the whole manipulation.
      if (this._transformDragSnapshot) {
        const before = safeJsonStringify(this._transformDragSnapshot);
        const after = safeJsonStringify(this._spec);
        if (before && after && before !== after) {
          this._pushHistory();
        }
      }
      this._transformDragSnapshot = null;
      this._transformDragWasMulti = false;
      this._pivotStart = null;
      this._multiStart = null;
    });
    this._transform.addEventListener('objectChange', () => {
      if (this._selection.size > 1 && this._pivotAttached) {
        this._applyPivotToSelection();
        this._syncSelectionToSpec();
      } else {
        this._syncSelectedPieceFromObject();
      }
      this._rebuild();
    });

    // TransformControls is not necessarily an Object3D in all Three.js versions.
    // Add its helper (which is an Object3D) to the scene instead.
    this._transformHelper = this._transform.getHelper?.() || null;
    if (this._transformHelper) this._root.add(this._transformHelper);

    ui.querySelector('#editor-mode-move').addEventListener('click', () => this._transform?.setMode('translate'));
    ui.querySelector('#editor-mode-rotate').addEventListener('click', () => this._transform?.setMode('rotate'));
    ui.querySelector('#editor-mode-scale').addEventListener('click', () => this._transform?.setMode('scale'));
    ui.querySelector('#editor-delete').addEventListener('click', () => this._deleteSelectedPiece());

    // Pointer handling
    const dom = renderer.domElement;

    this._handlers.pointerDown = (e) => this._onPointerDown(e);
    this._handlers.pointerMove = (e) => this._onPointerMove(e);
    this._handlers.pointerUp = (e) => this._onPointerUp(e);
    this._handlers.contextMenu = (e) => this._onContextMenu(e);
    this._handlers.keydown = (e) => this._onKeyDown(e);
    this._handlers.keyup = (e) => this._onKeyUp(e);
    this._handlers.blur = () => this._onWindowBlur();

    dom.addEventListener('pointerdown', this._handlers.pointerDown);
    dom.addEventListener('pointermove', this._handlers.pointerMove);
    window.addEventListener('pointerup', this._handlers.pointerUp);
    dom.addEventListener('contextmenu', this._handlers.contextMenu);
    window.addEventListener('keydown', this._handlers.keydown);
    window.addEventListener('keyup', this._handlers.keyup);
    window.addEventListener('blur', this._handlers.blur);

    // Selection pivot for multi-select transforms
    this._selectionPivot = new THREE.Object3D();
    this._selectionPivot.name = 'SelectionPivot';
    this._selectionPivot.visible = false;
    this._root.add(this._selectionPivot);

    // Initial build + history baseline
    this._rebuildPieceMeshes();
    this._rebuild();
    this._pushHistory(true);
  }

  update(dt) {
    if (!this._active) return;
    if (this._fly) this._fly.update(dt);

    // Editor mode owns its own rendering.
    if (this._renderer && this._scene && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  }

  async exit() {
    if (!this._active) return;

    if (this._historyDebounceTimer) {
      clearTimeout(this._historyDebounceTimer);
      this._historyDebounceTimer = null;
    }

    const dom = this._renderer?.domElement;
    if (dom && this._handlers.pointerDown) dom.removeEventListener('pointerdown', this._handlers.pointerDown);
    if (dom && this._handlers.pointerMove) dom.removeEventListener('pointermove', this._handlers.pointerMove);
    if (dom && this._handlers.contextMenu) dom.removeEventListener('contextmenu', this._handlers.contextMenu);
    if (this._handlers.pointerUp) window.removeEventListener('pointerup', this._handlers.pointerUp);
    if (this._handlers.keydown) window.removeEventListener('keydown', this._handlers.keydown);
    if (this._handlers.keyup) window.removeEventListener('keyup', this._handlers.keyup);
    if (this._handlers.blur) window.removeEventListener('blur', this._handlers.blur);

    if (this._fly) {
      this._fly.dispose();
      this._fly = null;
    }

    if (this._ui && this._ui.parentElement) {
      this._ui.parentElement.removeChild(this._ui);
      this._ui = null;
    }

    if (this._generated?.group) {
      this._root.remove(this._generated.group);
      this._disposeObject(this._generated.group);
      this._generated = null;
    }

    if (this._placementPreview) {
      this._root.remove(this._placementPreview);
      this._disposeObject(this._placementPreview);
      this._placementPreview = null;
    }
    if (this._previewMat) {
      this._previewMat.dispose();
      this._previewMat = null;
    }

    if (this._transform) {
      if (this._transformHelper) {
        this._root.remove(this._transformHelper);
        this._transformHelper = null;
      }
      this._transform.dispose();
      this._transform = null;
    }

    if (this._piecesGroup) {
      this._root.remove(this._piecesGroup);
      this._disposeObject(this._piecesGroup);
      this._piecesGroup = null;
      this._pieceMeshes = [];
      this._selectedPieceIndex = -1;
      this._selection.clear();

      // Materials may have been disposed by _disposeObject; recreate next session.
      this._gizmoMatDefault = null;
      this._gizmoMatSelected = null;
    }

    if (this._selectionPivot) {
      this._root.remove(this._selectionPivot);
      this._selectionPivot = null;
      this._pivotAttached = false;
      this._pivotStart = null;
      this._multiStart = null;
    }

    if (this._grid) {
      this._root.remove(this._grid);
      this._disposeObject(this._grid);
      this._grid = null;
    }

    if (this._lights && this._lights.length > 0) {
      this._lights.forEach((l) => {
        this._root.remove(l);
      });
      this._lights = [];
    }

    if (this._root) {
      this._scene.remove(this._root);
      this._root = null;
    }

    this._active = false;
  }

  _rebuild() {
    if (!this._builder || !this._THREE) return;

    if (this._generated?.group) {
      this._root.remove(this._generated.group);
      this._disposeObject(this._generated.group);
      this._generated = null;
    }

    // Build in scene under editor root (not the main scene root)
    // (builder adds to scene; we want it parented under editor root instead)
    const built = this._builder.build({
      THREE: this._THREE,
      scene: null,
      config: this._config,
      spec: this._spec
    });

    this._generated = built;
    this._root.add(built.group);
  }

  _rebuildPieceMeshes() {
    const THREE = this._THREE;
    if (!THREE || !this._piecesGroup) return;

    this._pieceMeshes.forEach((m) => {
      this._piecesGroup.remove(m);
      this._disposeObject(m);
    });
    this._pieceMeshes = [];

    // Two shared materials: default and selected.
    if (!this._gizmoMatDefault) {
      this._gizmoMatDefault = new THREE.MeshBasicMaterial({ color: 0x6bdcff, wireframe: true });
    }
    if (!this._gizmoMatSelected) {
      this._gizmoMatSelected = new THREE.MeshBasicMaterial({ color: 0xffc857, wireframe: true });
    }

    const pieces = Array.isArray(this._spec.pieces) ? this._spec.pieces : [];
    pieces.forEach((p, idx) => {
      const bb = this._previewBoundsFor(p.kind || 'road_straight', p.size);
      const geom = new THREE.BoxGeometry(bb.x, bb.y, bb.z);
      const mesh = new THREE.Mesh(geom, this._gizmoMatDefault);
      mesh.name = `PieceGizmo_${idx}`;
      // Gizmo is centered; stored piece.position is a ground-anchor (bottom center).
      mesh.position.set(p.position?.x ?? 0, (p.position?.y ?? 0) + bb.y * 0.5, p.position?.z ?? 0);
      mesh.rotation.set(p.rotation?.x ?? 0, p.rotation?.y ?? 0, p.rotation?.z ?? 0);
      // mesh.scale is reserved for user scaling only.
      if (p.scale !== undefined && p.scale !== null) {
        if (typeof p.scale === 'number') {
          mesh.scale.setScalar(p.scale);
        } else {
          mesh.scale.set(p.scale.x ?? 1, p.scale.y ?? 1, p.scale.z ?? 1);
        }
      } else {
        mesh.scale.set(1, 1, 1);
      }
      mesh.userData.pieceIndex = idx;
      this._piecesGroup.add(mesh);
      this._pieceMeshes.push(mesh);
    });

    // Ensure selection still points to valid indices after rebuild.
    const maxIdx = this._pieceMeshes.length - 1;
    const nextSel = new Set();
    this._selection.forEach((idx) => {
      if (typeof idx === 'number' && idx >= 0 && idx <= maxIdx) nextSel.add(idx);
    });
    this._selection = nextSel;
    if (this._selection.size === 0) {
      this._selectedPieceIndex = -1;
    } else if (!this._selection.has(this._selectedPieceIndex)) {
      this._selectedPieceIndex = Math.min(...Array.from(this._selection));
    }
    this._updateSelectionVisuals();
    this._attachTransformToSelection();
  }

  _getPointerNDC(event) {
    const rect = this._renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    return { x, y };
  }

  _raycastToPlane(event) {
    const ndc = this._getPointerNDC(event);
    this._raycaster.setFromCamera(ndc, this._camera);
    const hit = new this._THREE.Vector3();
    const ok = this._raycaster.ray.intersectPlane(this._plane, hit);
    return ok ? hit : null;
  }

  _pickPoint(event) {
    const ndc = this._getPointerNDC(event);
    this._raycaster.setFromCamera(ndc, this._camera);
    const hits = this._raycaster.intersectObjects(this._pieceMeshes, false);
    if (!hits || hits.length === 0) return -1;
    return hits[0].object.userData.pieceIndex;
  }

  _onPointerDown(event) {
    if (!this._active) return;

    // If we're interacting with the transform gizmo, don't place new pieces.
    if (this._transform?.dragging || this._transform?.axis) return;

    // Left
    if (event.button === 0) {
      const idx = this._pickPoint(event);
      if (idx >= 0) {
        this._handleClickSelection(idx, !!event.shiftKey);
        return;
      }

      const hit = this._raycastToPlane(event);
      if (!hit) return;

      const snapped = this._shouldSnapNow()
        ? this._snapPointXZ(hit)
        : hit;

      const kind = this._placement.kind;
      const material = this._placement.material;
      this._spec.pieces = Array.isArray(this._spec.pieces) ? this._spec.pieces : [];
      this._spec.pieces.push({
        kind,
        material,
        position: { x: snapped.x, y: 0, z: snapped.z },
        rotation: { x: 0, y: 0, z: 0 },
        size: this._defaultSizeForKind(kind)
      });

      this._ensureBasicMarkers();
      this._rebuildPieceMeshes();
      this._rebuild();
      this._handleClickSelection(this._spec.pieces.length - 1, false);
      this._pushHistory();
    }
  }

  _onPointerMove(event) {
    if (!this._active) return;
    this._updatePlacementPreview(event);
  }

  _onPointerUp() {
    if (!this._active) return;
  }

  _onContextMenu(event) {
    if (!this._active) return;
    event.preventDefault();

    // RMB is reserved for FreeFlyControls look; no delete-on-right-click.
  }

  _defaultSizeForKind(kind) {
    if (kind === 'road_straight') return { x: 60, y: 0.6, z: 26 };
    if (kind === 'road_straight_short') return { x: 20, y: 0.6, z: 26 };
    if (kind === 'road_straight_long') return { x: 120, y: 0.6, z: 26 };
    if (kind === 'road_platform') return { x: 60, y: 0.6, z: 60 };
    if (kind === 'road_ramp') return { x: 40, y: 6, z: 26 };
    if (kind === 'wall_straight') return { x: 60, y: 2.3, z: 0.6 };
    if (kind === 'barrier_cone') return { radius: 1.2, height: 2.4 };
    if (kind === 'barrier_block') return { x: 3, y: 2, z: 3 };
    if (kind === 'barrier_pipe') return { radius: 0.6, length: 10 };
    if (kind === 'prop_pillar') return { radius: 1.8, height: 10 };
    if (kind === 'prop_ring') return { radius: 6, tube: 0.6 };
    if (kind === 'prop_arch') return { width: 16, height: 10, depth: 2, legThickness: 1.2 };
    if (kind === 'prop_tree') return { trunkRadius: 0.6, trunkHeight: 4.5, crownRadius: 2.2, crownHeight: 4 };
    if (kind === 'road_curve_90') return { radius: 30, width: 26, thickness: 0.6 };
    return { x: 10, y: 10, z: 10 };
  }

  _ensureBasicMarkers() {
    this._spec.markers = this._spec.markers || {};
    if (!Array.isArray(this._spec.markers.start) || this._spec.markers.start.length === 0) {
      this._spec.markers.start = [{ position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } }];
    }
    if (!Array.isArray(this._spec.markers.checkpoints) || this._spec.markers.checkpoints.length === 0) {
      this._spec.markers.checkpoints = [{ position: { x: 0, y: 2, z: 0 }, size: { x: 30, y: 10, z: 8 } }];
    }
    if (!Array.isArray(this._spec.markers.items)) {
      this._spec.markers.items = [];
    }
  }

  _selectPiece(index) {
    // Backwards compatible entrypoint: single select.
    this._selection.clear();
    if (typeof index === 'number' && index >= 0) this._selection.add(index);
    this._selectedPieceIndex = typeof index === 'number' ? index : -1;
    this._updateSelectionVisuals();
    this._attachTransformToSelection();
    this._refreshSelectedOverrideUI();
  }

  _syncSelectedPieceFromObject() {
    const idx = this._selectedPieceIndex;
    const obj = this._pieceMeshes[idx];
    const piece = this._spec.pieces?.[idx];
    if (!obj || !piece) return;

    const bb = this._previewBoundsFor(piece.kind || 'road_straight', piece.size);
    // Convert centered gizmo position back to ground-anchor.
    piece.position = { x: obj.position.x, y: obj.position.y - bb.y * 0.5, z: obj.position.z };
    piece.rotation = { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z };

    // Store scale separately from size so pieces can be scaled non-destructively.
    const sx = obj.scale.x;
    const sy = obj.scale.y;
    const sz = obj.scale.z;
    const isUnit = Math.abs(sx - 1) < 1e-6 && Math.abs(sy - 1) < 1e-6 && Math.abs(sz - 1) < 1e-6;
    piece.scale = isUnit ? undefined : { x: sx, y: sy, z: sz };

    this._refreshSelectedOverrideUI();
  }

  _refreshSelectedOverrideUI() {
    if (!this._pieceMatOverrideEnabledEl) return;
    const idx = this._selectedPieceIndex;
    const piece = this._spec.pieces?.[idx];
    if (!piece) {
      this._pieceMatOverrideEnabledEl.checked = false;
      return;
    }

    const baseKey = typeof piece.material === 'string' ? piece.material : null;
    const base = baseKey ? (this._spec.materials?.[baseKey] || {}) : (piece.material || {});
    const ov = piece.materialOverride || null;
    const ov2 = piece.materialOverrideSecondary || null;

    this._pieceMatOverrideEnabledEl.checked = !!ov;
    this._pieceMatColorEl.value = this._toHexColor((ov?.color) ?? (base?.color) ?? '#ffffff');
    this._pieceMatColor2El.value = this._toHexColor((ov2?.color) ?? '#2e8b57');
    this._pieceMatRoughEl.value = String(typeof ((ov?.roughness) ?? (base?.roughness)) === 'number' ? ((ov?.roughness) ?? (base?.roughness)) : 0.75);
    this._pieceMatMetalEl.value = String(typeof ((ov?.metalness) ?? (base?.metalness)) === 'number' ? ((ov?.metalness) ?? (base?.metalness)) : 0.05);

    // Only show the leaves color picker for trees (avoid UI clutter).
    const showLeaves = (piece.kind === 'prop_tree');
    if (this._pieceMatColor2El) this._pieceMatColor2El.style.display = showLeaves ? '' : 'none';
  }

  _updatePlacementPreview(event) {
    if (!this._placementPreview) return;
    if (this._transform?.dragging || this._transform?.axis) {
      this._placementPreview.visible = false;
      return;
    }

    const hit = this._raycastToPlane(event);
    if (!hit) {
      this._placementPreview.visible = false;
      return;
    }

    const place = this._shouldSnapNow()
      ? this._snapPointXZ(hit)
      : hit;

    const kind = this._placement.kind;
    const size = this._defaultSizeForKind(kind);
    const bb = this._previewBoundsFor(kind, size);

    // Rebuild preview geometry only if needed.
    const sig = `${kind}:${JSON.stringify(bb)}`;
    if (this._placementPreview.userData._sig !== sig) {
      this._placementPreview.userData._sig = sig;
      this._placementPreview.geometry?.dispose?.();
      this._placementPreview.geometry = new this._THREE.BoxGeometry(bb.x, bb.y, bb.z);
    }

    this._placementPreview.position.set(place.x, bb.y * 0.5, place.z);
    this._placementPreview.rotation.set(0, 0, 0);
    this._placementPreview.visible = true;
    this._previewLastHit = place;
  }

  _previewBoundsFor(kind, size) {
    // Always return a conservative axis-aligned box for preview.
    if (size && typeof size === 'object' && ('x' in size) && ('y' in size) && ('z' in size)) {
      return { x: Math.max(0.1, size.x ?? 1), y: Math.max(0.1, size.y ?? 1), z: Math.max(0.1, size.z ?? 1) };
    }
    if (kind === 'road_curve_90') {
      const r = Math.max(1, size?.radius ?? 30);
      const w = Math.max(1, size?.width ?? 26);
      const t = Math.max(0.1, size?.thickness ?? 0.6);
      const outer = r + w / 2;
      return { x: outer, y: t, z: outer };
    }
    if (kind === 'barrier_cone') {
      const rad = Math.max(0.1, size?.radius ?? 1.2);
      const h = Math.max(0.1, size?.height ?? 2.4);
      return { x: rad * 2, y: h, z: rad * 2 };
    }
    if (kind === 'barrier_pipe') {
      const rad = Math.max(0.1, size?.radius ?? 0.6);
      const len = Math.max(0.1, size?.length ?? 10);
      return { x: len, y: rad * 2, z: rad * 2 };
    }
    if (kind === 'prop_pillar') {
      const rad = Math.max(0.1, size?.radius ?? 1.8);
      const h = Math.max(0.1, size?.height ?? 10);
      return { x: rad * 2, y: h, z: rad * 2 };
    }
    if (kind === 'prop_ring') {
      const rad = Math.max(0.1, size?.radius ?? 6);
      const tube = Math.max(0.1, size?.tube ?? 0.6);
      const extent = rad + tube;
      return { x: extent * 2, y: tube * 2, z: extent * 2 };
    }
    if (kind === 'prop_arch') {
      const w = Math.max(0.1, size?.width ?? 16);
      const h = Math.max(0.1, size?.height ?? 10);
      const d = Math.max(0.1, size?.depth ?? 2);
      return { x: w, y: h, z: d };
    }
    if (kind === 'prop_tree') {
      const rad = Math.max(0.1, size?.crownRadius ?? 2.2);
      const th = Math.max(0.1, size?.trunkHeight ?? 4.5);
      const ch = Math.max(0.1, size?.crownHeight ?? 4);
      return { x: rad * 2, y: th + ch, z: rad * 2 };
    }
    // Fallback
    return { x: 10, y: 2, z: 10 };
  }

  _toHexColor(v) {
    // Accept '#rrggbb', '0xrrggbb', or number.
    if (typeof v === 'string') {
      if (v.startsWith('#') && v.length === 7) return v;
      if (v.startsWith('0x')) {
        const n = Number.parseInt(v.slice(2), 16);
        if (Number.isFinite(n)) return `#${n.toString(16).padStart(6, '0')}`;
      }
      // Best effort
      return '#ffffff';
    }
    if (typeof v === 'number' && Number.isFinite(v)) {
      return `#${(v & 0xffffff).toString(16).padStart(6, '0')}`;
    }
    return '#ffffff';
  }

  _deleteSelectedPiece() {
    this._deleteSelection();
  }

  _deleteSelection() {
    if (!Array.isArray(this._spec.pieces)) return;
    if (this._selection.size === 0) return;

    const indices = Array.from(this._selection).filter((n) => typeof n === 'number' && n >= 0);
    if (indices.length === 0) return;
    indices.sort((a, b) => b - a);
    indices.forEach((idx) => {
      if (idx >= 0 && idx < this._spec.pieces.length) this._spec.pieces.splice(idx, 1);
    });

    this._selection.clear();
    this._selectedPieceIndex = -1;
    this._pivotAttached = false;
    this._transform?.detach();
    this._rebuildPieceMeshes();
    this._rebuild();
    this._pushHistory();
  }

  _handleClickSelection(idx, additive) {
    if (typeof idx !== 'number' || idx < 0) return;
    if (!additive) {
      this._selection.clear();
      this._selection.add(idx);
      this._selectedPieceIndex = idx;
    } else {
      if (this._selection.has(idx)) {
        this._selection.delete(idx);
        if (this._selectedPieceIndex === idx) {
          const next = Array.from(this._selection).sort((a, b) => a - b)[0];
          this._selectedPieceIndex = typeof next === 'number' ? next : -1;
        }
      } else {
        this._selection.add(idx);
        this._selectedPieceIndex = idx;
      }
    }

    this._updateSelectionVisuals();
    this._attachTransformToSelection();
    this._refreshSelectedOverrideUI();
  }

  _updateSelectionVisuals() {
    if (!this._pieceMeshes || this._pieceMeshes.length === 0) return;
    this._pieceMeshes.forEach((m) => {
      const idx = m?.userData?.pieceIndex;
      const selected = this._selection.has(idx);
      m.material = selected ? this._gizmoMatSelected : this._gizmoMatDefault;
    });
  }

  _attachTransformToSelection() {
    if (!this._transform) return;
    if (this._selection.size === 0) {
      this._transform.detach();
      this._pivotAttached = false;
      if (this._selectionPivot) this._selectionPivot.visible = false;
      return;
    }

    if (this._selection.size === 1) {
      const idx = Array.from(this._selection)[0];
      if (typeof idx === 'number' && idx >= 0 && idx < this._pieceMeshes.length) {
        this._transform.attach(this._pieceMeshes[idx]);
        this._pivotAttached = false;
        if (this._selectionPivot) this._selectionPivot.visible = false;
      }
      return;
    }

    // Multi-select: attach to a pivot at the centroid.
    if (!this._selectionPivot) return;
    const center = new this._THREE.Vector3();
    let count = 0;
    this._selection.forEach((idx) => {
      const obj = this._pieceMeshes[idx];
      if (!obj) return;
      center.add(obj.position);
      count += 1;
    });
    if (count === 0) return;
    center.multiplyScalar(1 / count);

    this._selectionPivot.position.copy(center);
    this._selectionPivot.rotation.set(0, 0, 0);
    this._selectionPivot.scale.set(1, 1, 1);
    this._selectionPivot.updateMatrixWorld(true);
    this._selectionPivot.visible = false;

    this._transform.attach(this._selectionPivot);
    this._pivotAttached = true;
  }

  _applyPivotToSelection() {
    if (!this._selectionPivot || !this._pivotStart || !Array.isArray(this._multiStart) || this._multiStart.length === 0) return;

    const pivot = this._selectionPivot;

    // Compute delta transform from the start of the drag.
    const deltaPos = pivot.position.clone().sub(this._pivotStart.position);
    const deltaQ = pivot.quaternion.clone().multiply(this._pivotStart.quaternion.clone().invert());
    const deltaScale = new this._THREE.Vector3(
      pivot.scale.x / (this._pivotStart.scale.x || 1),
      pivot.scale.y / (this._pivotStart.scale.y || 1),
      pivot.scale.z / (this._pivotStart.scale.z || 1),
    );

    const pivotOrigin = this._pivotStart.position;

    this._multiStart.forEach((st) => {
      const obj = this._pieceMeshes[st.idx];
      if (!obj) return;

      // Translate around pivot origin, rotate around pivot, then scale around pivot.
      const p = st.position.clone().sub(pivotOrigin);
      p.multiply(deltaScale);
      p.applyQuaternion(deltaQ);
      p.add(pivotOrigin).add(deltaPos);
      obj.position.copy(p);

      const q = deltaQ.clone().multiply(st.quaternion);
      obj.quaternion.copy(q);
      obj.scale.set(st.scale.x * deltaScale.x, st.scale.y * deltaScale.y, st.scale.z * deltaScale.z);
    });
  }

  _syncSelectionToSpec() {
    // Sync all selected meshes into spec (used for multi-select edits).
    const indices = Array.from(this._selection);
    indices.forEach((idx) => {
      const obj = this._pieceMeshes[idx];
      const piece = this._spec.pieces?.[idx];
      if (!obj || !piece) return;
      const bb = this._previewBoundsFor(piece.kind || 'road_straight', piece.size);
      piece.position = { x: obj.position.x, y: obj.position.y - bb.y * 0.5, z: obj.position.z };
      piece.rotation = { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z };

      const sx = obj.scale.x;
      const sy = obj.scale.y;
      const sz = obj.scale.z;
      const isUnit = Math.abs(sx - 1) < 1e-6 && Math.abs(sy - 1) < 1e-6 && Math.abs(sz - 1) < 1e-6;
      piece.scale = isUnit ? undefined : { x: sx, y: sy, z: sz };
    });
  }

  _onKeyDown(e) {
    if (!this._active) return;

    this._updateModsFromEvent(e);
    // Modifiers affect snapping in real-time.
    if (e.code === 'AltLeft' || e.code === 'AltRight' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ControlLeft' || e.code === 'ControlRight' || e.code === 'MetaLeft' || e.code === 'MetaRight') {
      this._applyTransformSnapping();
    }

    // Avoid hijacking typical text editing inside UI.
    const activeTag = document.activeElement?.tagName;
    const inInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

    const ctrl = !!(e.ctrlKey || e.metaKey);
    const shift = !!e.shiftKey;

    // Undo / redo
    if (ctrl && e.code === 'KeyZ') {
      e.preventDefault();
      if (shift) this.redo();
      else this.undo();
      return;
    }
    if (ctrl && e.code === 'KeyY') {
      e.preventDefault();
      this.redo();
      return;
    }

    if (inInput) return;

    // Delete
    if (e.code === 'Delete' || e.code === 'Backspace') {
      this._deleteSelection();
      return;
    }

    // Duplicate
    if (ctrl && e.code === 'KeyD') {
      e.preventDefault();
      this._duplicateSelection();
      return;
    }

    // Transform modes
    if (e.code === 'KeyG') this._transform?.setMode('translate');
    if (e.code === 'KeyR') this._transform?.setMode('rotate');
    if (e.code === 'KeyS') this._transform?.setMode('scale');

    // Toggle snapping
    if (e.code === 'KeyV') {
      this._snap.enabled = !this._snap.enabled;
      const el = this._ui?.querySelector?.('#editor-snap-enabled');
      if (el) el.checked = !!this._snap.enabled;
      this._applyTransformSnapping();
      this._toast(this._snap.enabled ? 'Snap enabled' : 'Snap disabled');
    }

    // Focus camera
    if (e.code === 'KeyF') {
      this._focusSelection();
    }
  }

  _onKeyUp(e) {
    if (!this._active) return;
    this._updateModsFromEvent(e);
    if (e.code === 'AltLeft' || e.code === 'AltRight' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ControlLeft' || e.code === 'ControlRight' || e.code === 'MetaLeft' || e.code === 'MetaRight') {
      this._applyTransformSnapping();
    }
  }

  _onWindowBlur() {
    this._mods = { shift: false, ctrl: false, alt: false, meta: false };
    this._applyTransformSnapping();
  }

  _duplicateSelection() {
    if (!Array.isArray(this._spec.pieces)) return;
    const indices = Array.from(this._selection).filter((n) => typeof n === 'number' && n >= 0 && n < this._spec.pieces.length);
    if (indices.length === 0) return;

    // Keep stable order when duplicating.
    indices.sort((a, b) => a - b);

    const offset = { x: 8, y: 0, z: 8 };
    const newIndices = [];
    indices.forEach((idx) => {
      const src = this._spec.pieces[idx];
      if (!src) return;
      const clone = deepCloneJson(src);
      clone.position = clone.position || { x: 0, y: 0, z: 0 };
      clone.position.x = (clone.position.x ?? 0) + offset.x;
      clone.position.y = (clone.position.y ?? 0) + offset.y;
      clone.position.z = (clone.position.z ?? 0) + offset.z;
      this._spec.pieces.push(clone);
      newIndices.push(this._spec.pieces.length - 1);
    });

    this._rebuildPieceMeshes();
    this._rebuild();

    // Select duplicated pieces.
    this._selection.clear();
    newIndices.forEach((i) => this._selection.add(i));
    this._selectedPieceIndex = newIndices[newIndices.length - 1] ?? -1;
    this._updateSelectionVisuals();
    this._attachTransformToSelection();
    this._refreshSelectedOverrideUI();

    this._pushHistory();
    this._toast(`Duplicated ${newIndices.length} piece${newIndices.length === 1 ? '' : 's'}`);
  }

  _focusSelection() {
    if (!this._camera || !this._THREE) return;
    if (this._selection.size === 0) return;

    const box = new this._THREE.Box3();
    const tmp = new this._THREE.Box3();
    let any = false;
    this._selection.forEach((idx) => {
      const obj = this._pieceMeshes[idx];
      if (!obj) return;
      tmp.setFromObject(obj);
      if (!any) {
        box.copy(tmp);
        any = true;
      } else {
        box.union(tmp);
      }
    });
    if (!any) return;

    const center = new this._THREE.Vector3();
    const size = new this._THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 1);

    const fov = (this._camera.fov * Math.PI) / 180;
    const dist = (maxDim * 0.5) / Math.tan(fov * 0.5);
    const dir = new this._THREE.Vector3(1, 0.65, 1).normalize();
    const targetPos = center.clone().addScaledVector(dir, dist * 1.25);

    this._camera.position.copy(targetPos);
    this._camera.lookAt(center);
    this._camera.updateProjectionMatrix();
  }

  _pushHistory(force = false) {
    const specJson = safeJsonStringify(this._spec);
    if (!specJson) return;

    const selection = Array.from(this._selection);
    const primary = this._selectedPieceIndex;

    const current = this._history[this._historyIndex];
    if (!force && current && current.specJson === specJson) {
      current.selection = selection;
      current.primary = primary;
      return;
    }

    // Drop redo tail.
    this._history = this._history.slice(0, this._historyIndex + 1);
    this._history.push({ specJson, selection, primary });

    if (this._history.length > this._historyMax) {
      const overflow = this._history.length - this._historyMax;
      this._history.splice(0, overflow);
    }
    this._historyIndex = this._history.length - 1;
  }

  _applyTransformSnapping() {
    const tc = this._transform;
    const THREE = this._THREE;
    if (!tc || !THREE) return;

    const factor = this._snapFactor();
    const enabled = !!this._snap.enabled && factor > 0;
    const t = enabled && this._snap.translate > 0 ? (this._snap.translate * factor) : null;
    const r = enabled && this._snap.rotateDeg > 0 ? THREE.MathUtils.degToRad(this._snap.rotateDeg * factor) : null;
    const s = enabled && this._snap.scale > 0 ? (this._snap.scale * factor) : null;

    // Support multiple TransformControls versions.
    if (typeof tc.setTranslationSnap === 'function') tc.setTranslationSnap(t);
    else tc.translationSnap = t;

    if (typeof tc.setRotationSnap === 'function') tc.setRotationSnap(r);
    else tc.rotationSnap = r;

    if (typeof tc.setScaleSnap === 'function') tc.setScaleSnap(s);
    else tc.scaleSnap = s;
  }

  _snapValue(v, step) {
    if (!Number.isFinite(v) || !Number.isFinite(step) || step <= 0) return v;
    return Math.round(v / step) * step;
  }

  _snapPointXZ(v3) {
    const step = this._snap.translate * this._snapFactor();
    return new this._THREE.Vector3(
      this._snapValue(v3.x, step),
      v3.y,
      this._snapValue(v3.z, step)
    );
  }

  _updateModsFromEvent(e) {
    this._mods.shift = !!e.shiftKey;
    this._mods.ctrl = !!e.ctrlKey;
    this._mods.alt = !!e.altKey;
    this._mods.meta = !!e.metaKey;
  }

  _snapFactor() {
    // Alt disables snapping entirely.
    if (this._mods.alt) return 0;

    // Priority: both -> 1/10; ctrl -> 1/5; shift -> 1/2; none -> 1.
    const ctrl = this._mods.ctrl || this._mods.meta;
    const shift = this._mods.shift;
    if (ctrl && shift) return 0.1;
    if (ctrl) return 0.2;
    if (shift) return 0.5;
    return 1;
  }

  _shouldSnapNow() {
    return !!this._snap.enabled && this._snap.translate > 0 && this._snapFactor() > 0;
  }

  _scheduleHistoryPush(delayMs = 250) {
    if (this._historyDebounceTimer) clearTimeout(this._historyDebounceTimer);
    this._historyDebounceTimer = setTimeout(() => {
      this._historyDebounceTimer = null;
      this._pushHistory();
    }, delayMs);
  }

  undo() {
    if (this._historyIndex <= 0) return;
    this._historyIndex -= 1;
    this._restoreHistoryEntry(this._history[this._historyIndex]);
    this._toast('Undo');
  }

  redo() {
    if (this._historyIndex >= this._history.length - 1) return;
    this._historyIndex += 1;
    this._restoreHistoryEntry(this._history[this._historyIndex]);
    this._toast('Redo');
  }

  _restoreHistoryEntry(entry) {
    if (!entry) return;
    const spec = JSON.parse(entry.specJson);
    this._spec = spec;

    this._selection.clear();
    (entry.selection || []).forEach((idx) => {
      if (typeof idx === 'number') this._selection.add(idx);
    });
    this._selectedPieceIndex = typeof entry.primary === 'number' ? entry.primary : -1;

    this._rebuildPieceMeshes();
    this._rebuild();
    this._refreshSelectedOverrideUI();
  }

  _toast(text) {
    if (!this._ui) return;
    const el = document.createElement('div');
    el.className = 'editor-toast';
    el.textContent = text;
    this._ui.appendChild(el);
    setTimeout(() => {
      if (el.parentElement) el.parentElement.removeChild(el);
    }, 1400);
  }

  _disposeObject(obj) {
    if (!obj) return;
    obj.traverse?.((child) => {
      if (child.geometry) {
        if (child.geometry.disposeBoundsTree) {
          try { child.geometry.disposeBoundsTree(); } catch { /* ignore */ }
        }
        if (child.geometry.dispose) child.geometry.dispose();
      }
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => m?.dispose?.());
      }
    });
  }
}

export default TrackEditorMode;
