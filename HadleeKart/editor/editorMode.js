import { createTrackBuilder } from '../trackBuilders/index.js';
import { FreeFlyControls } from './freeFlyControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { createEditorUI } from './ui/editorUI.js';
import { createCommandRegistry } from './ui/commandRegistry.js';
import { createEditorKeymap } from './ui/keymap.js';

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

function mergeSpecWithDefaults(spec) {
  const base = defaultTrackSpec();
  const incoming = (spec && typeof spec === 'object') ? spec : {};

  // Shallow merge top-level, then deep-ish merge for known nested objects.
  const merged = { ...base, ...incoming };
  merged.materials = { ...(base.materials || {}), ...(incoming.materials || {}) };
  merged.markers = { ...(base.markers || {}), ...(incoming.markers || {}) };
  merged.pieces = Array.isArray(incoming.pieces) ? incoming.pieces : (Array.isArray(base.pieces) ? base.pieces : []);
  return merged;
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function tryCreateTrackBuilder(type) {
  try {
    return createTrackBuilder(type);
  } catch {
    return null;
  }
}

export class TrackEditorMode {
  constructor() {
    this._active = false;
    this._root = null;
    this._ui = null;
    this._uiShell = null;
    this._commands = null;
    this._keymap = null;

    this._paused = false;

    // Track transform mode locally (so we can show delta UI and avoid relying on TransformControls internals).
    this._transformMode = 'translate';
    this._transformDeltaStart = null;
    this._transformDeltaText = '';
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

    this._placementMatEl = null;

    // Materials tray UI
    this._materialsRoot = null;
    this._materialsTitleEl = null;
    this._materialsActionsEl = null;
    this._materialsBodyEl = null;
    this._materialsRenderKey = '';
    this._materialsPaletteEl = null;
    this._materialsSelectionHintEl = null;
    this._materialsSelMatEl = null;
    this._materialsClearOverridesBtn = null;

    this._pieceMatOverrideEnabledEl = null;
    this._pieceMatColorEl = null;
    this._pieceMatColor2El = null;
    this._pieceMatRoughEl = null;
    this._pieceMatRoughNumEl = null;
    this._pieceMatMetalEl = null;
    this._pieceMatMetalNumEl = null;

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
    this._placementMode = 'piece';
    this._placementPreview = null;
    this._previewMat = null;
    this._previewLastHit = null;

    this._markersGroup = null;
    this._markerMeshes = { start: [], checkpoints: [], items: [] };
    this._selectedMarker = null; // { type: 'start'|'checkpoints'|'items', index }

    this._markerMatStart = null;
    this._markerMatCheckpoint = null;
    this._markerMatItem = null;

    this._clipboard = null;

    this._snap = {
      enabled: true,
      translate: 1,
      rotateDeg: 12.5,
      scale: 0.1
    };

    this._mods = { shift: false, ctrl: false, alt: false, meta: false };

    this._handlers = {};
    this._onExitToMenu = null;
    this._onPlaytest = null;

    this._history = [];
    this._historyIndex = -1;
    this._historyMax = 120;
    this._transformDragSnapshot = null;
    this._transformDragWasMulti = false;

    this._isTransformDragging = false;
    this._pendingGeneratedRebuild = false;

    this._historyDebounceTimer = null;

    this._gizmoMatDefault = null;
    this._gizmoMatSelected = null;
  }

  _resetSessionState() {
    // Clear selection + history to a clean baseline.
    this._selection?.clear?.();
    this._selectedPieceIndex = -1;
    this._selectedMarker = null;
    this._pivotAttached = false;
    this._transform?.detach?.();
    if (this._selectionPivot) this._selectionPivot.visible = false;

    this._history = [];
    this._historyIndex = -1;
  }

  _importSpecFromJsonString(text, { sourceName } = {}) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new Error(`Invalid JSON${sourceName ? ` (${sourceName})` : ''}`);
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid track spec (expected an object)');
    }
    if (!Array.isArray(parsed.pieces)) {
      throw new Error('Invalid track spec (missing pieces array)');
    }

    this._spec = mergeSpecWithDefaults(parsed);
    this._ensureBasicMarkers();
    this._ensurePieceNames();

    this._resetSessionState();
    this._rebuildPieceMeshes();
    this._rebuildMarkerMeshes();
    this._rebuild();
    this._pushHistory(true);
    this._syncUi();
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

    // Builder is selected after we load any saved spec.
    this._builder = null;

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

    // Editor UI shell (menus + panes)
    this._commands = createCommandRegistry();
    this._keymap = createEditorKeymap({
      runCommand: (id) => this._commands?.run?.(id)
    });
    this._uiShell = createEditorUI({
      container,
      onMenuAction: (id) => this._commands?.run?.(id),
      onOutlinerSelect: (payload) => {
        if (!payload || typeof payload !== 'object') return;
        if (payload.kind === 'marker') {
          this._selectMarker(payload.markerType, payload.index);
          return;
        }
        this.selectPiece(payload.index, payload.additive);
      },
      onOutlinerRename: (payload) => {
        if (!payload || payload.kind !== 'piece') return;
        const idx = payload.index;
        if (!Array.isArray(this._spec?.pieces) || typeof idx !== 'number' || idx < 0 || idx >= this._spec.pieces.length) return;
        const piece = this._spec.pieces[idx];
        piece.name = typeof payload.name === 'string' ? payload.name : String(payload.name ?? '');
        this._pushHistory();
        this._syncUi();
      }
    });

    const ui = document.createElement('div');
    ui.className = 'ed-props';
    ui.innerHTML = `
      <div class="ed-card">
        <div class="ed-card-title">Placement</div>
        <div class="ed-grid" style="grid-template-columns: 90px 1fr;">
          <div class="ed-grid-h">Mode</div>
          <div class="ed-field">
            <select id="editor-place-mode">
              <option value="piece">Piece</option>
              <option value="start">Start</option>
              <option value="checkpoint">Checkpoint</option>
              <option value="item">Item</option>
            </select>
          </div>

          <div class="ed-grid-h">Piece</div>
          <div class="ed-field">
            <select id="editor-piece">
              <option value="road_straight">road_straight</option>
              <option value="road_straight_short">road_straight_short</option>
              <option value="road_straight_long">road_straight_long</option>
              <option value="road_platform">road_platform</option>
              <option value="road_curve">road_curve</option>
              <option value="road_curve_90">road_curve_90</option>
              <option value="road_curve_45">road_curve_45</option>
              <option value="road_ramp">road_ramp</option>
              <option value="road_ramp_45">road_ramp_45</option>
              <option value="wall_straight">wall_straight</option>
              <option value="barrier_block">barrier_block</option>
              <option value="barrier_pipe">barrier_pipe</option>
              <option value="barrier_cone">barrier_cone</option>
              <option value="prop_pillar">prop_pillar</option>
              <option value="prop_ring">prop_ring</option>
              <option value="prop_arch">prop_arch</option>
              <option value="prop_tree">prop_tree</option>
            </select>
          </div>

          <div class="ed-grid-h">Material</div>
          <div class="ed-field">
            <select id="editor-mat">
              <option value="road">road</option>
              <option value="offroadWeak">offroadWeak</option>
              <option value="offroadStrong">offroadStrong</option>
              <option value="boost">boost</option>
              <option value="wall">wall</option>
              <option value="prop">prop</option>
            </select>
          </div>
        </div>

        <div class="ed-props-actions">
          <button id="editor-mode-move" class="editor-btn" type="button">Move</button>
          <button id="editor-mode-rotate" class="editor-btn" type="button">Rotate</button>
          <button id="editor-mode-scale" class="editor-btn" type="button">Scale</button>
          <button id="editor-delete" class="editor-btn" type="button">Delete</button>
        </div>

        <div class="ed-props-advanced" id="editor-curve-angle-row" style="display:none;">
          <div class="ed-grid" style="grid-template-columns: 90px 1fr 80px;">
            <div class="ed-grid-h">Curve°</div>
            <div class="ed-field"><input id="editor-curve-angle" type="range" min="1" max="90" step="1" value="90"></div>
            <div class="ed-field"><input id="editor-curve-angle-num" type="number" min="1" max="90" step="1" value="90"></div>
          </div>
        </div>

        <div class="ed-props-advanced" id="editor-ramp-angle-row" style="display:none;">
          <div class="ed-grid" style="grid-template-columns: 90px 1fr 80px;">
            <div class="ed-grid-h">Ramp°</div>
            <div class="ed-field"><input id="editor-ramp-angle" type="range" min="1" max="45" step="1" value="25"></div>
            <div class="ed-field"><input id="editor-ramp-angle-num" type="number" min="1" max="45" step="1" value="25"></div>
          </div>
        </div>
      </div>

      <div class="ed-card">
        <div class="ed-card-title">Snapping</div>
        <div class="ed-grid" style="grid-template-columns: 90px 1fr;">
          <div class="ed-grid-h">Enabled</div>
          <label class="ed-check"><input id="editor-snap-enabled" type="checkbox"> Snap</label>

          <div class="ed-grid-h">Grid</div>
          <div class="ed-field"><input id="editor-snap-grid" type="number" min="0" step="0.25" value="1"></div>

          <div class="ed-grid-h">Angle°</div>
          <div class="ed-field"><input id="editor-snap-rot" type="number" min="0" step="0.5" value="12.5"></div>
        </div>
        <div class="ed-mat-hint">Hold Alt to temporarily disable snapping</div>
      </div>

      <div class="ed-mat-hint">
        LMB: place/select • Shift+LMB: multi-select • RMB+WASD: fly • G/R/F: move/rotate/scale • Ctrl+Z/Y: undo/redo • Ctrl+D: duplicate • Enter: deselect • C: focus • V: toggle snap • Esc: menu
      </div>
    `;
    this._uiShell.rightContent.appendChild(ui);
    this._ui = ui;

    this._registerCommands();

    // Load last saved spec if present
    const saved = loadSavedTrackSpec();
    if (saved?.type && Array.isArray(saved?.pieces)) {
      // Merge with defaults to keep missing fields stable.
      this._spec = mergeSpecWithDefaults(saved);
    }

    this._ensureBasicMarkers();
    this._ensurePieceNames();

    // Select the appropriate builder for the spec.
    this._builder = tryCreateTrackBuilder(this._spec?.type) || tryCreateTrackBuilder('modular');

    // Reset history/selection for a clean editor session.
    this._resetSessionState();

    // Hook UI
    const modeEl = ui.querySelector('#editor-place-mode');
    const pieceEl = ui.querySelector('#editor-piece');
    const matEl = ui.querySelector('#editor-mat');
    const curveRowEl = ui.querySelector('#editor-curve-angle-row');
    const curveAngleEl = ui.querySelector('#editor-curve-angle');
    const curveAngleNumEl = ui.querySelector('#editor-curve-angle-num');
    const rampRowEl = ui.querySelector('#editor-ramp-angle-row');
    const rampAngleEl = ui.querySelector('#editor-ramp-angle');
    const rampAngleNumEl = ui.querySelector('#editor-ramp-angle-num');
    modeEl.value = this._placementMode;
    pieceEl.value = this._placement.kind;
    matEl.value = this._placement.material;

    const syncPlacementModeUi = () => {
      const isPiece = this._placementMode === 'piece';
      pieceEl.disabled = !isPiece;
      matEl.disabled = !isPiece;
    };

    modeEl.addEventListener('change', () => {
      this._placementMode = modeEl.value;
      syncPlacementModeUi();
      this._refreshPlacementPreviewFromLastHit();
      this._toast(`Mode: ${this._placementMode}`);
    });

    const syncAngleUI = () => {
      const kind = this._placement.kind;
      const isCurve = kind === 'road_curve' || kind === 'road_curve_90' || kind === 'road_curve_45';
      const isRamp = kind === 'road_ramp' || kind === 'road_ramp_45';

      curveRowEl.style.display = isCurve ? '' : 'none';
      rampRowEl.style.display = isRamp ? '' : 'none';

      if (isCurve) {
        const def = this._defaultSizeForKind(kind);
        const current = this._placement?.size?.angleDeg;
        const angle = clamp(Number(current ?? def?.angleDeg ?? 90), 1, 90);
        curveAngleEl.value = String(angle);
        curveAngleNumEl.value = String(angle);
      }

      if (isRamp) {
        const def = this._defaultSizeForKind(kind);
        const current = this._placement?.size?.angleDeg;
        const angle = clamp(Number(current ?? def?.angleDeg ?? 25), 1, 45);
        rampAngleEl.value = String(angle);
        rampAngleNumEl.value = String(angle);
      }
    };

    const applyPlacementAngle = (angleDeg) => {
      const kind = this._placement.kind;
      const isCurve = kind === 'road_curve' || kind === 'road_curve_90' || kind === 'road_curve_45';
      const isRamp = kind === 'road_ramp' || kind === 'road_ramp_45';
      if (!isCurve && !isRamp) {
        this._placement.size = undefined;
        return;
      }
      this._placement.size = { ...(this._placement.size || {}), angleDeg };
      this._refreshPlacementPreviewFromLastHit();
    };

    const onCurveAngleChanged = (raw) => {
      const angle = clamp(Number(raw), 1, 90);
      curveAngleEl.value = String(angle);
      curveAngleNumEl.value = String(angle);
      applyPlacementAngle(angle);
    };

    const onRampAngleChanged = (raw) => {
      const angle = clamp(Number(raw), 1, 45);
      rampAngleEl.value = String(angle);
      rampAngleNumEl.value = String(angle);
      applyPlacementAngle(angle);
    };

    curveAngleEl.addEventListener('input', () => onCurveAngleChanged(curveAngleEl.value));
    curveAngleNumEl.addEventListener('input', () => onCurveAngleChanged(curveAngleNumEl.value));
    rampAngleEl.addEventListener('input', () => onRampAngleChanged(rampAngleEl.value));
    rampAngleNumEl.addEventListener('input', () => onRampAngleChanged(rampAngleNumEl.value));

    pieceEl.addEventListener('change', () => {
      this._placement.kind = pieceEl.value;
      const kind = this._placement.kind;
      const isCurve = kind === 'road_curve' || kind === 'road_curve_90' || kind === 'road_curve_45';
      const isRamp = kind === 'road_ramp' || kind === 'road_ramp_45';
      if (!isCurve && !isRamp) this._placement.size = undefined;
      syncAngleUI();
      this._refreshPlacementPreviewFromLastHit();
    });
    matEl.addEventListener('change', () => {
      this._placement.material = matEl.value;
      this._syncMaterialsTrayUI();
    });

    // Store so the materials tray can update it.
    this._placementMatEl = matEl;

    syncAngleUI();
    syncPlacementModeUi();

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

    // Bottom materials tray UI
    const matsRoot = document.createElement('div');
    matsRoot.className = 'ed-mat-layout';
    matsRoot.innerHTML = `
      <div class="ed-card">
        <div class="ed-card-title">Placement Palette</div>
        <div class="ed-mat-palette" id="ed-mat-palette"></div>
        <div class="ed-mat-hint">Affects only newly placed pieces</div>
      </div>

      <div class="ed-card">
        <div class="ed-mat-card-head">
          <div class="ed-card-title" id="ed-mat-title">Selection</div>
          <div class="ed-mat-card-actions" id="ed-mat-actions"></div>
        </div>
        <div class="ed-mat-card-body" id="ed-mat-body">
          <div class="ed-mat-hint" id="ed-mat-sel-hint">Select pieces to edit their material/overrides</div>

          <div class="ed-mat-section">
            <div class="ed-grid" style="grid-template-columns: 110px 1fr;">
              <div class="ed-grid-h">Material</div>
              <div class="ed-field">
                <select id="ed-mat-sel-mat"></select>
              </div>
            </div>
          </div>

          <div class="ed-mat-section">
            <div class="ed-grid" style="grid-template-columns: 110px 1fr 1fr 1fr;">
              <div class="ed-grid-h">Override</div>
              <div class="ed-field"><label><input type="checkbox" id="ed-mat-ov-enabled" /> enable</label></div>
              <div class="ed-field"><button class="editor-btn" id="ed-mat-ov-clear" type="button">Clear</button></div>
              <div></div>

              <div class="ed-grid-h">Color</div>
              <div class="ed-field"><input type="color" id="ed-mat-ov-color" /></div>
              <div class="ed-field"><input type="color" id="ed-mat-ov-color2" /></div>
              <div></div>

              <div class="ed-grid-h">Rough</div>
              <div class="ed-field"><input type="range" min="0" max="1" step="0.01" id="ed-mat-ov-rough" /></div>
              <div class="ed-field"><input type="number" min="0" max="1" step="0.01" id="ed-mat-ov-rough-n" /></div>
              <div></div>

              <div class="ed-grid-h">Metal</div>
              <div class="ed-field"><input type="range" min="0" max="1" step="0.01" id="ed-mat-ov-metal" /></div>
              <div class="ed-field"><input type="number" min="0" max="1" step="0.01" id="ed-mat-ov-metal-n" /></div>
              <div></div>
            </div>
          </div>
        </div>
      </div>
    `;
    this._uiShell?.bottomContent?.appendChild?.(matsRoot);
    this._materialsRoot = matsRoot;
    this._materialsTitleEl = matsRoot.querySelector('#ed-mat-title');
    this._materialsActionsEl = matsRoot.querySelector('#ed-mat-actions');
    this._materialsBodyEl = matsRoot.querySelector('#ed-mat-body');
    this._materialsRenderKey = '';
    this._materialsPaletteEl = matsRoot.querySelector('#ed-mat-palette');
    this._materialsSelectionHintEl = matsRoot.querySelector('#ed-mat-sel-hint');
    this._materialsSelMatEl = matsRoot.querySelector('#ed-mat-sel-mat');
    this._materialsClearOverridesBtn = matsRoot.querySelector('#ed-mat-ov-clear');

    this._pieceMatOverrideEnabledEl = matsRoot.querySelector('#ed-mat-ov-enabled');
    this._pieceMatColorEl = matsRoot.querySelector('#ed-mat-ov-color');
    this._pieceMatColor2El = matsRoot.querySelector('#ed-mat-ov-color2');
    this._pieceMatRoughEl = matsRoot.querySelector('#ed-mat-ov-rough');
    this._pieceMatRoughNumEl = matsRoot.querySelector('#ed-mat-ov-rough-n');
    this._pieceMatMetalEl = matsRoot.querySelector('#ed-mat-ov-metal');
    this._pieceMatMetalNumEl = matsRoot.querySelector('#ed-mat-ov-metal-n');

    // Ensure materials exist.
    this._spec.materials = this._spec.materials || {};
    ['road', 'offroadWeak', 'offroadStrong', 'boost', 'wall', 'prop'].forEach((k) => {
      this._spec.materials[k] = this._spec.materials[k] || {};
    });

    this._initMaterialsTrayHandlers();
    this._syncMaterialsTrayUI(true);

    // Piece gizmos (wireframe boxes, used for selection and TransformControls)
    this._piecesGroup = new THREE.Group();
    this._piecesGroup.name = 'EditorPieces';
    this._root.add(this._piecesGroup);

    // Marker gizmos (Start/Checkpoint/Item)
    this._markersGroup = new THREE.Group();
    this._markersGroup.name = 'EditorMarkers';
    this._root.add(this._markersGroup);

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
    this._transformMode = 'translate';
    this._applyTransformSnapping();
    this._transform.addEventListener('dragging-changed', (e) => {
      if (this._fly) this._fly.enabled = !e.value && !this._paused;

      this._isTransformDragging = !!e.value;

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

        // Start transform delta readout from current attached object.
        const obj = this._pivotAttached ? this._selectionPivot : this._pieceMeshes[this._selectedPieceIndex];
        if (obj) {
          this._transformDeltaStart = {
            position: obj.position.clone(),
            quaternion: obj.quaternion.clone(),
            scale: obj.scale.clone()
          };
          this._transformDeltaText = '';
          this._updateStatusBar();
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

      // Apply a single rebuild after drag completes (keeps interaction smooth).
      if (this._pendingGeneratedRebuild) {
        this._pendingGeneratedRebuild = false;
        this._rebuild();
      }

      this._transformDragSnapshot = null;
      this._transformDragWasMulti = false;
      this._pivotStart = null;
      this._multiStart = null;

      // Clear delta readout.
      this._transformDeltaStart = null;
      this._transformDeltaText = '';
      this._updateStatusBar();
    });
    this._transform.addEventListener('objectChange', () => {
      if (this._selection.size > 1 && this._pivotAttached) {
        this._applyPivotToSelection();
        this._syncSelectionToSpec();
      } else if (this._selectedMarker) {
        this._syncSelectedMarkerFromObject();
      } else {
        this._syncSelectedPieceFromObject();
      }

      this._updateTransformDeltaReadout();

      // Avoid rebuilding the full generated track on every mouse move while dragging.
      if (this._isTransformDragging) {
        this._pendingGeneratedRebuild = true;
      } else {
        this._rebuild();
      }
    });

    // TransformControls is not necessarily an Object3D in all Three.js versions.
    // Add its helper (which is an Object3D) to the scene instead.
    this._transformHelper = this._transform.getHelper?.() || null;
    if (this._transformHelper) this._root.add(this._transformHelper);

    ui.querySelector('#editor-mode-move').addEventListener('click', () => { this._transformMode = 'translate'; this._transform?.setMode('translate'); this._syncUi(); });
    ui.querySelector('#editor-mode-rotate').addEventListener('click', () => { this._transformMode = 'rotate'; this._transform?.setMode('rotate'); this._syncUi(); });
    ui.querySelector('#editor-mode-scale').addEventListener('click', () => { this._transformMode = 'scale'; this._transform?.setMode('scale'); this._syncUi(); });
    ui.querySelector('#editor-delete').addEventListener('click', () => this._deleteSelected());

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
    this._rebuildMarkerMeshes();
    this._rebuild();
    this._pushHistory(true);
    this._syncUi();
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

    if (this._uiShell) {
      this._uiShell.dispose();
      this._uiShell = null;
    }

    this._commands = null;
    this._keymap = null;

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

    if (this._markersGroup) {
      this._root.remove(this._markersGroup);
      this._disposeObject(this._markersGroup, { disposeMaterials: false });
      this._markersGroup = null;
      this._markerMeshes = { start: [], checkpoints: [], items: [] };
      this._selectedMarker = null;

      this._markerMatStart?.dispose?.();
      this._markerMatCheckpoint?.dispose?.();
      this._markerMatItem?.dispose?.();
      this._markerMatStart = null;
      this._markerMatCheckpoint = null;
      this._markerMatItem = null;
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

    // Placement raycasts hit generated surfaces every pointer move; BVH helps a lot.
    const surfaces = Array.isArray(built?.surfaces) ? built.surfaces : [];
    surfaces.forEach((mesh) => {
      const geom = mesh?.geometry;
      if (!geom) return;
      if (!geom.computeBoundsTree) return;
      if (geom.boundsTree) return;
      try {
        geom.computeBoundsTree();
      } catch {
        // ignore (BVH is a perf hint, not required for correctness)
      }
    });

    this._generated = built;
    this._root.add(built.group);
  }

  _rebuildPieceMeshes() {
    const THREE = this._THREE;
    if (!THREE || !this._piecesGroup) return;

    this._pieceMeshes.forEach((m) => {
      this._piecesGroup.remove(m);
      // Gizmo meshes share materials; avoid disposing shared materials during rebuild.
      this._disposeObject(m, { disposeMaterials: false });
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
      let geom;
      const kind = (p.kind || 'road_straight');
      if (kind === 'road_curve' || kind === 'road_curve_90' || kind === 'road_curve_45') {
        const radius = Math.max(1, p.size?.radius ?? 30);
        const width = Math.max(1, p.size?.width ?? 26);
        const thickness = Math.max(0.1, p.size?.thickness ?? 0.6);
        const angleDeg = Math.max(1, Math.min(90, p.size?.angleDeg ?? (kind === 'road_curve_45' ? 45 : 90)));
        const angle = (angleDeg * Math.PI) / 180;
        const inner = Math.max(1, radius - width / 2);
        const outer = radius + width / 2;

        const shape = new THREE.Shape();
        const segments = Math.max(8, Math.floor(angleDeg / 5));
        const innerStartX = inner;
        const innerStartY = 0;
        const outerStartX = outer;
        const outerStartY = 0;
        const innerEndX = Math.cos(angle) * inner;
        const innerEndY = -Math.sin(angle) * inner;

        shape.moveTo(innerStartX, innerStartY);
        shape.lineTo(outerStartX, outerStartY);
        shape.absarc(0, 0, outer, 0, angle, false);
        shape.lineTo(innerEndX, innerEndY);
        shape.absarc(0, 0, inner, angle, 0, true);
        shape.closePath();

        geom = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: segments });
        geom.rotateX(Math.PI / 2);
        geom.computeBoundingBox();
        if (geom.boundingBox) {
          const c = new THREE.Vector3();
          geom.boundingBox.getCenter(c);
          geom.translate(-c.x, -c.y, -c.z);
        }
      } else if (kind === 'road_ramp' || kind === 'road_ramp_45') {
        const legacy = p.size && typeof p.size === 'object' && ('x' in p.size) && ('y' in p.size) && ('z' in p.size);
        const length = Math.max(1, legacy ? (p.size.x ?? 40) : (p.size?.length ?? 40));
        const width = Math.max(1, legacy ? (p.size.z ?? 26) : (p.size?.width ?? 26));
        const thickness = Math.max(0.1, legacy ? Math.min(2, (p.size.y ?? 6) * 0.1) : (p.size?.thickness ?? 0.6));
        const angleDeg = Math.max(1, Math.min(45, legacy ? 25 : (p.size?.angleDeg ?? (kind === 'road_ramp_45' ? 45 : 25))));
        const rise = Math.tan((angleDeg * Math.PI) / 180) * length;
        geom = new THREE.BoxGeometry(length, thickness, width, 1, 1, 1);
        const pos = geom.attributes.position;
        for (let i = 0; i < pos.count; i += 1) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const t = (x + length / 2) / length;
          const baseY = t * rise;
          pos.setY(i, y > 0 ? (baseY + thickness) : baseY);
        }
        pos.needsUpdate = true;
        geom.computeVertexNormals();
      } else {
        geom = new THREE.BoxGeometry(bb.x, bb.y, bb.z);
      }
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
    this._syncUi();
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

  _raycastToSurfaces(event) {
    // Raycast against the currently generated track surfaces (more accurate than a fixed plane).
    const ndc = this._getPointerNDC(event);
    this._raycaster.setFromCamera(ndc, this._camera);

    const surfaces = Array.isArray(this._generated?.surfaces) ? this._generated.surfaces : [];
    if (surfaces.length === 0) return null;

    const hits = this._raycaster.intersectObjects(surfaces, true);
    if (!hits || hits.length === 0) return null;

    const h = hits[0];
    return {
      point: h.point,
      normal: h.face?.normal ? h.face.normal.clone() : null,
      object: h.object
    };
  }

  _raycastPlacement(event) {
    // Prefer surfaces, fall back to the editor ground plane.
    const surf = this._raycastToSurfaces(event);
    if (surf?.point) return { point: surf.point, source: 'surface' };
    const plane = this._raycastToPlane(event);
    if (plane) return { point: plane, source: 'plane' };
    return null;
  }

  _pickPoint(event) {
    return this._pickPieceHit(event)?.index ?? -1;
  }

  _pickPieceHit(event) {
    if (!this._raycaster || !this._camera) return null;
    const ndc = this._getPointerNDC(event);
    this._raycaster.setFromCamera(ndc, this._camera);
    const hits = this._raycaster.intersectObjects(this._pieceMeshes, false);
    if (!hits || hits.length === 0) return null;
    const pieceIndex = hits[0].object?.userData?.pieceIndex;
    if (typeof pieceIndex !== 'number') return null;
    return { index: pieceIndex, distance: hits[0].distance };
  }

  _pickMarker(event) {
    if (!this._raycaster || !this._camera) return null;
    const ndc = this._getPointerNDC(event);
    this._raycaster.setFromCamera(ndc, this._camera);

    const all = [];
    all.push(...(this._markerMeshes?.start || []));
    all.push(...(this._markerMeshes?.checkpoints || []));
    all.push(...(this._markerMeshes?.items || []));
    if (all.length === 0) return null;

    const hits = this._raycaster.intersectObjects(all, true);
    if (!hits || hits.length === 0) return null;

    let obj = hits[0].object;
    while (obj && !obj.userData?.markerType && obj.parent) obj = obj.parent;
    if (!obj?.userData?.markerType) return null;
    return { type: obj.userData.markerType, index: obj.userData.markerIndex, object: obj, distance: hits[0].distance };
  }

  _onPointerDown(event) {
    if (!this._active) return;
    if (this._paused) return;

    // If we're interacting with the transform gizmo, don't place new pieces.
    if (this._transform?.dragging || this._transform?.axis) return;

    // Left
    if (event.button === 0) {
      const mk = this._pickMarker(event);
      const piece = this._pickPieceHit(event);
      if (mk && (!piece || mk.distance <= piece.distance + 1e-6)) {
        this._selectMarker(mk.type, mk.index);
        return;
      }
      if (piece?.index >= 0) {
        this._selectedMarker = null;
        this._handleClickSelection(piece.index, !!event.shiftKey);
        return;
      }

      const hit = this._raycastPlacement(event);
      if (!hit?.point) return;

      // Place markers when not in piece mode.
      if (this._placementMode && this._placementMode !== 'piece') {
        this._placeMarkerAt(hit.point);
        return;
      }

      const kind = this._placement.kind;
      const material = this._placement.material;
      const size = this._placementSizeForKind(kind);

      // Prefer snapping to an existing piece; fall back to grid snapping.
      const smart = this._computeSmartSnap({ point: hit.point, newKind: kind, newSize: size });
      const snapped = smart?.point
        ? smart.point
        : (this._shouldSnapNow() ? this._snapPointXZ(hit.point) : hit.point);

      this._spec.pieces = Array.isArray(this._spec.pieces) ? this._spec.pieces : [];
      const existingNames = new Set(this._spec.pieces.map((p) => (typeof p?.name === 'string' ? p.name.trim() : '')).filter(Boolean));
      const newPieceName = this._generateUniquePieceName(kind, existingNames);
      this._spec.pieces.push({
        name: newPieceName,
        kind,
        material,
        // Place on hit height so pieces can be stacked / placed on ramps.
        position: { x: snapped.x, y: snapped.y, z: snapped.z },
        rotation: { x: 0, y: smart?.rotationY ?? 0, z: 0 },
        size
      });

      this._ensureBasicMarkers();
      this._rebuildPieceMeshes();
      this._rebuildMarkerMeshes();
      this._rebuild();
      this._handleClickSelection(this._spec.pieces.length - 1, false);
      this._pushHistory();
    }
  }

  _onPointerMove(event) {
    if (!this._active) return;
    if (this._paused) return;
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
    if (kind === 'road_ramp') return { length: 40, width: 26, thickness: 0.6, angleDeg: 25 };
    if (kind === 'road_ramp_45') return { length: 40, width: 26, thickness: 0.6, angleDeg: 45 };
    if (kind === 'wall_straight') return { x: 60, y: 2.3, z: 0.6 };
    if (kind === 'barrier_cone') return { radius: 1.2, height: 2.4 };
    if (kind === 'barrier_block') return { x: 3, y: 2, z: 3 };
    if (kind === 'barrier_pipe') return { radius: 0.6, length: 10 };
    if (kind === 'prop_pillar') return { radius: 1.8, height: 10 };
    if (kind === 'prop_ring') return { radius: 6, tube: 0.6 };
    if (kind === 'prop_arch') return { width: 16, height: 10, depth: 2, legThickness: 1.2 };
    if (kind === 'prop_tree') return { trunkRadius: 0.6, trunkHeight: 4.5, crownRadius: 2.2, crownHeight: 4 };
    if (kind === 'road_curve') return { radius: 30, width: 26, thickness: 0.6, angleDeg: 90 };
    if (kind === 'road_curve_90') return { radius: 30, width: 26, thickness: 0.6, angleDeg: 90 };
    if (kind === 'road_curve_45') return { radius: 30, width: 26, thickness: 0.6, angleDeg: 45 };
    return { x: 10, y: 10, z: 10 };
  }

  _placementSizeForKind(kind) {
    const base = this._defaultSizeForKind(kind);
    const override = this._placement?.size;
    if (!override || typeof override !== 'object') return base;

    const isCurve = kind === 'road_curve' || kind === 'road_curve_90' || kind === 'road_curve_45';
    const isRamp = kind === 'road_ramp' || kind === 'road_ramp_45';
    if (!isCurve && !isRamp) return base;

    return { ...base, ...override };
  }

  _refreshPlacementPreviewFromLastHit() {
    if (!this._placementPreview) return;
    if (!this._placementPreview.visible) return;
    if (!this._previewLastHit) return;

    // Force the preview to rebuild next time _updatePlacementPreview runs.
    this._placementPreview.userData._sig = null;

    const place = this._previewLastHit;

    // Marker preview refresh
    if (this._placementMode && this._placementMode !== 'piece') {
      const mode = this._placementMode;
      const sig = `marker:${mode}`;
      if (this._placementPreview.userData._sig !== sig) {
        this._placementPreview.userData._sig = sig;
        this._placementPreview.geometry?.dispose?.();

        if (mode === 'start') {
          const g = new this._THREE.ConeGeometry(0.9, 2.2, 10);
          g.translate(0, 1.1, 0);
          this._placementPreview.geometry = g;
        } else if (mode === 'checkpoint') {
          this._placementPreview.geometry = new this._THREE.BoxGeometry(30, 10, 8);
        } else {
          const g = new this._THREE.SphereGeometry(0.9, 10, 10);
          g.translate(0, 0.9, 0);
          this._placementPreview.geometry = g;
        }
      }

      const bb = (mode === 'checkpoint') ? { x: 30, y: 10, z: 8 } : (mode === 'start' ? { x: 1.8, y: 2.2, z: 1.8 } : { x: 1.8, y: 1.8, z: 1.8 });
      const yaw = mode === 'start' ? this._cameraYaw() : 0;
      const y = mode === 'checkpoint' ? (place.y + bb.y * 0.5) : place.y;
      this._placementPreview.position.set(place.x, y, place.z);
      this._placementPreview.rotation.set(0, yaw, 0);
      return;
    }

    // Piece preview refresh
    const kind = this._placement.kind;
    const size = this._placementSizeForKind(kind);
    const bb = this._previewBoundsFor(kind, size);

    const sig = `${kind}:${JSON.stringify(size)}`;
    if (this._placementPreview.userData._sig !== sig) {
      this._placementPreview.userData._sig = sig;
      this._placementPreview.geometry?.dispose?.();

      if (kind === 'road_curve' || kind === 'road_curve_90' || kind === 'road_curve_45') {
        const radius = Math.max(1, size?.radius ?? 30);
        const width = Math.max(1, size?.width ?? 26);
        const thickness = Math.max(0.1, size?.thickness ?? 0.6);
        const angleDeg = Math.max(1, Math.min(90, size?.angleDeg ?? (kind === 'road_curve_45' ? 45 : 90)));
        const angle = (angleDeg * Math.PI) / 180;
        const inner = Math.max(1, radius - width / 2);
        const outer = radius + width / 2;

        const shape = new this._THREE.Shape();
        const segments = Math.max(8, Math.floor(angleDeg / 5));
        const innerStartX = inner;
        const innerStartY = 0;
        const outerStartX = outer;
        const outerStartY = 0;
        const innerEndX = Math.cos(angle) * inner;
        const innerEndY = -Math.sin(angle) * inner;

        shape.moveTo(innerStartX, innerStartY);
        shape.lineTo(outerStartX, outerStartY);
        shape.absarc(0, 0, outer, 0, angle, false);
        shape.lineTo(innerEndX, innerEndY);
        shape.absarc(0, 0, inner, angle, 0, true);
        shape.closePath();

        const g = new this._THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: segments });
        g.rotateX(Math.PI / 2);
        g.computeBoundingBox();
        if (g.boundingBox) {
          const c = new this._THREE.Vector3();
          g.boundingBox.getCenter(c);
          g.translate(-c.x, -c.y, -c.z);
        }
        this._placementPreview.geometry = g;
      } else if (kind === 'road_ramp' || kind === 'road_ramp_45') {
        const legacy = size && typeof size === 'object' && ('x' in size) && ('y' in size) && ('z' in size);
        const length = Math.max(1, legacy ? (size.x ?? 40) : (size?.length ?? 40));
        const width = Math.max(1, legacy ? (size.z ?? 26) : (size?.width ?? 26));
        const thickness = Math.max(0.1, legacy ? Math.min(2, (size.y ?? 6) * 0.1) : (size?.thickness ?? 0.6));
        const angleDeg = Math.max(1, Math.min(45, legacy ? 25 : (size?.angleDeg ?? (kind === 'road_ramp_45' ? 45 : 25))));
        const rise = Math.tan((angleDeg * Math.PI) / 180) * length;
        const g = new this._THREE.BoxGeometry(length, thickness, width, 1, 1, 1);
        const pos = g.attributes.position;
        for (let i = 0; i < pos.count; i += 1) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const t = (x + length / 2) / length;
          const baseY = t * rise;
          pos.setY(i, y > 0 ? (baseY + thickness) : baseY);
        }
        pos.needsUpdate = true;
        g.computeVertexNormals();
        this._placementPreview.geometry = g;
      } else {
        this._placementPreview.geometry = new this._THREE.BoxGeometry(bb.x, bb.y, bb.z);
      }
    }

    this._placementPreview.position.set(place.x, place.y + bb.y * 0.5, place.z);
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

  _startMarkerCount() {
    const start = this._spec?.markers?.start;
    return Array.isArray(start) ? start.length : 0;
  }

  _ensurePieceNames() {
    if (!Array.isArray(this._spec?.pieces)) return;
    const names = new Set();
    this._spec.pieces.forEach((p) => {
      if (p && typeof p.name === 'string' && p.name.trim().length > 0) names.add(p.name.trim());
    });

    this._spec.pieces.forEach((p) => {
      if (!p || (typeof p.name === 'string' && p.name.trim().length > 0)) return;
      const base = (p.kind || 'piece');
      p.name = this._generateUniquePieceName(base, names);
      names.add(p.name);
    });
  }

  _generateUniquePieceName(base, existingNames = null) {
    const names = existingNames || new Set((this._spec?.pieces || []).map((p) => (typeof p?.name === 'string' ? p.name.trim() : '')).filter(Boolean));
    const safeBase = String(base || 'piece').replace(/\s+/g, '_');
    for (let i = 1; i < 100000; i += 1) {
      const cand = `${safeBase}_${String(i).padStart(3, '0')}`;
      if (!names.has(cand)) return cand;
    }
    return `${safeBase}_${Date.now()}`;
  }

  _cameraYaw() {
    if (!this._THREE || !this._camera) return 0;
    const e = new this._THREE.Euler().setFromQuaternion(this._camera.quaternion, 'YXZ');
    return e.y;
  }

  _rebuildMarkerMeshes() {
    const THREE = this._THREE;
    if (!THREE || !this._markersGroup) return;

    // Remove existing
    const existing = [];
    existing.push(...(this._markerMeshes?.start || []));
    existing.push(...(this._markerMeshes?.checkpoints || []));
    existing.push(...(this._markerMeshes?.items || []));
    existing.forEach((m) => {
      if (!m) return;
      this._markersGroup.remove(m);
      this._disposeObject(m, { disposeMaterials: false });
    });

    this._markerMeshes = { start: [], checkpoints: [], items: [] };

    if (!this._markerMatStart) this._markerMatStart = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true });
    if (!this._markerMatCheckpoint) this._markerMatCheckpoint = new THREE.MeshBasicMaterial({ color: 0xff4d9d, wireframe: true });
    if (!this._markerMatItem) this._markerMatItem = new THREE.MeshBasicMaterial({ color: 0xfbbf24, wireframe: true });

    this._ensureBasicMarkers();

    // Start
    (this._spec.markers.start || []).forEach((st, idx) => {
      const g = new THREE.Group();
      g.name = `Marker_Start_${idx}`;
      g.userData = { kind: 'marker', markerType: 'start', markerIndex: idx };

      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 10), this._markerMatStart);
      cone.position.y = 1.1;
      g.add(cone);

      const p = st?.position || { x: 0, y: 0, z: 0 };
      g.position.set(p.x ?? 0, p.y ?? 0, p.z ?? 0);
      g.rotation.set(0, st?.rotation?.y ?? 0, 0);
      this._markersGroup.add(g);
      this._markerMeshes.start.push(g);
    });

    // Checkpoints
    (this._spec.markers.checkpoints || []).forEach((cp, idx) => {
      const size = cp?.size || { x: 30, y: 10, z: 8 };
      const sx = Math.max(0.1, size.x ?? 30);
      const sy = Math.max(0.1, size.y ?? 10);
      const sz = Math.max(0.1, size.z ?? 8);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), this._markerMatCheckpoint);
      mesh.name = `Marker_Checkpoint_${idx}`;
      mesh.userData = { kind: 'marker', markerType: 'checkpoints', markerIndex: idx };

      const p = cp?.position || { x: 0, y: 2, z: 0 };
      mesh.position.set(p.x ?? 0, p.y ?? 0, p.z ?? 0);
      const r = cp?.rotation || { x: 0, y: 0, z: 0 };
      mesh.rotation.set(r.x ?? 0, r.y ?? 0, r.z ?? 0);
      this._markersGroup.add(mesh);
      this._markerMeshes.checkpoints.push(mesh);
    });

    // Items
    (this._spec.markers.items || []).forEach((it, idx) => {
      const g = new THREE.Group();
      g.name = `Marker_Item_${idx}`;
      g.userData = { kind: 'marker', markerType: 'items', markerIndex: idx };

      const sph = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), this._markerMatItem);
      sph.position.y = 0.9;
      g.add(sph);

      const p = it?.position || { x: 0, y: 0, z: 0 };
      g.position.set(p.x ?? 0, p.y ?? 0, p.z ?? 0);
      this._markersGroup.add(g);
      this._markerMeshes.items.push(g);
    });

    // Clear invalid selected marker.
    if (this._selectedMarker) {
      const list = this._markerMeshes?.[this._selectedMarker.type];
      if (!Array.isArray(list) || !list[this._selectedMarker.index]) {
        this._selectedMarker = null;
      }
    }

    this._attachTransformToSelection();
  }

  _selectMarker(type, index) {
    const list = this._markerMeshes?.[type];
    if (!Array.isArray(list)) return;
    if (typeof index !== 'number' || index < 0 || index >= list.length) return;

    // Markers are exclusive selection for now.
    this._selection.clear();
    this._selectedPieceIndex = -1;
    this._selectedMarker = { type, index };

    this._updateSelectionVisuals();
    this._attachTransformToSelection();
    this._syncUi();
  }

  _syncSelectedMarkerFromObject() {
    const sel = this._selectedMarker;
    if (!sel) return;
    const obj = this._markerMeshes?.[sel.type]?.[sel.index];
    if (!obj) return;

    this._ensureBasicMarkers();
    const list = this._spec?.markers?.[sel.type];
    if (!Array.isArray(list)) return;
    const entry = list[sel.index];
    if (!entry) return;

    if (sel.type === 'start') {
      entry.position = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
      entry.rotation = { y: obj.rotation.y };
      return;
    }

    if (sel.type === 'checkpoints') {
      entry.position = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
      entry.rotation = { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z };

      // Persist size based on the base geometry dimensions and current scale.
      const p = obj.geometry?.parameters || {};
      const baseX = Number.isFinite(p.width) ? p.width : (entry.size?.x ?? 30);
      const baseY = Number.isFinite(p.height) ? p.height : (entry.size?.y ?? 10);
      const baseZ = Number.isFinite(p.depth) ? p.depth : (entry.size?.z ?? 8);
      entry.size = {
        x: Math.max(0.1, baseX * (obj.scale?.x ?? 1)),
        y: Math.max(0.1, baseY * (obj.scale?.y ?? 1)),
        z: Math.max(0.1, baseZ * (obj.scale?.z ?? 1))
      };
      return;
    }

    if (sel.type === 'items') {
      entry.position = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
    }
  }

  _placeMarkerAt(point) {
    this._ensureBasicMarkers();
    const place = this._shouldSnapNow() ? this._snapPointXZ(point) : point;

    if (this._placementMode === 'start') {
      if (this._spec.markers.start.length >= 12) {
        this._toast('Max start positions: 12');
        return;
      }
      const yaw = this._cameraYaw();
      this._spec.markers.start.push({ position: { x: place.x, y: place.y, z: place.z }, rotation: { y: yaw } });
      this._rebuildMarkerMeshes();
      this._rebuild();
      this._selectMarker('start', this._spec.markers.start.length - 1);
      this._pushHistory();
      return;
    }

    if (this._placementMode === 'checkpoint') {
      const size = { x: 30, y: 10, z: 8 };
      this._spec.markers.checkpoints.push({ position: { x: place.x, y: place.y + size.y * 0.5, z: place.z }, rotation: { x: 0, y: 0, z: 0 }, size });
      this._rebuildMarkerMeshes();
      this._rebuild();
      this._selectMarker('checkpoints', this._spec.markers.checkpoints.length - 1);
      this._pushHistory();
      return;
    }

    if (this._placementMode === 'item') {
      this._spec.markers.items.push({ position: { x: place.x, y: place.y, z: place.z } });
      this._rebuildMarkerMeshes();
      this._rebuild();
      this._selectMarker('items', this._spec.markers.items.length - 1);
      this._pushHistory();
    }
  }

  _deleteSelected() {
    if (this._selectedMarker) {
      this._deleteSelectedMarker();
      return;
    }
    this._deleteSelection();
  }

  _deleteSelectedMarker() {
    const sel = this._selectedMarker;
    if (!sel) return;
    const list = this._spec?.markers?.[sel.type];
    if (!Array.isArray(list)) return;
    if (sel.index < 0 || sel.index >= list.length) return;

    list.splice(sel.index, 1);
    this._selectedMarker = null;
    this._transform?.detach?.();
    this._rebuildMarkerMeshes();
    this._rebuild();
    this._pushHistory();
    this._syncUi();
  }

  _selectPiece(index) {
    // Backwards compatible entrypoint: single select.
    this._selection.clear();
    if (typeof index === 'number' && index >= 0) this._selection.add(index);
    this._selectedPieceIndex = typeof index === 'number' ? index : -1;
    this._updateSelectionVisuals();
    this._attachTransformToSelection();
    this._refreshSelectedOverrideUI();
    this._syncUi();
  }

  selectPiece(index, additive = false) {
    this._handleClickSelection(index, additive);
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
    const rough = typeof ((ov?.roughness) ?? (base?.roughness)) === 'number' ? ((ov?.roughness) ?? (base?.roughness)) : 0.75;
    const metal = typeof ((ov?.metalness) ?? (base?.metalness)) === 'number' ? ((ov?.metalness) ?? (base?.metalness)) : 0.05;
    this._pieceMatRoughEl.value = String(rough);
    if (this._pieceMatRoughNumEl) this._pieceMatRoughNumEl.value = String(rough);
    this._pieceMatMetalEl.value = String(metal);
    if (this._pieceMatMetalNumEl) this._pieceMatMetalNumEl.value = String(metal);

    // Only show the leaves color picker for trees (avoid UI clutter).
    const showLeaves = (piece.kind === 'prop_tree');
    if (this._pieceMatColor2El) this._pieceMatColor2El.style.display = showLeaves ? '' : 'none';
  }

  _materialKeys() {
    return ['road', 'offroadWeak', 'offroadStrong', 'boost', 'wall', 'prop'];
  }

  _selectedPieceIndicesSorted() {
    return Array.from(this._selection)
      .filter((n) => typeof n === 'number' && n >= 0)
      .sort((a, b) => a - b);
  }

  _setPlacementMaterial(key) {
    const keys = this._materialKeys();
    const next = keys.includes(key) ? key : 'road';
    this._placement.material = next;
    if (this._placementMatEl) this._placementMatEl.value = next;
    this._syncMaterialsTrayUI();
  }

  _initMaterialsTrayHandlers() {
    if (!this._materialsRoot) return;

    // Palette buttons
    if (this._materialsPaletteEl) {
      const keys = this._materialKeys();
      this._materialsPaletteEl.innerHTML = keys.map((k) => {
        const col = this._toHexColor(this._spec.materials?.[k]?.color ?? '#ffffff');
        return `
          <button class="ed-mat-swatch" type="button" data-key="${k}">
            <span class="ed-mat-swatch-dot" style="background:${col}"></span>
            <span class="ed-mat-swatch-label">${k}</span>
          </button>
        `;
      }).join('');

      this._materialsPaletteEl.querySelectorAll('.ed-mat-swatch').forEach((btn) => {
        btn.addEventListener('click', () => {
          const k = btn.getAttribute('data-key');
          if (k) this._setPlacementMaterial(k);
        });
      });
    }

    // Selection material
    if (this._materialsSelMatEl) {
      const keys = this._materialKeys();
      this._materialsSelMatEl.innerHTML = [
        '<option value="">(mixed)</option>',
        ...keys.map((k) => `<option value="${k}">${k}</option>`)
      ].join('');

      this._materialsSelMatEl.addEventListener('change', () => {
        const key = this._materialsSelMatEl.value;
        if (!key) return;
        const indices = this._selectedPieceIndicesSorted();
        if (indices.length === 0) return;
        indices.forEach((idx) => {
          const p = this._spec.pieces?.[idx];
          if (!p) return;
          p.material = key;
        });
        this._rebuild();
        this._pushHistory();
        this._syncMaterialsTrayUI(true);
        this._syncUi();
      });
    }

    const applyOverrideToSelection = (patch) => {
      const indices = this._selectedPieceIndicesSorted();
      if (indices.length === 0) return;
      indices.forEach((idx) => {
        const p = this._spec.pieces?.[idx];
        if (!p) return;
        p.materialOverride = { ...(p.materialOverride || {}), ...(patch || {}) };
      });
      this._rebuild();
      this._scheduleHistoryPush(250);
      this._syncMaterialsTrayUI(true);
    };

    // Override enabled checkbox
    if (this._pieceMatOverrideEnabledEl) {
      this._pieceMatOverrideEnabledEl.addEventListener('change', () => {
        const indices = this._selectedPieceIndicesSorted();
        if (indices.length === 0) return;
        const enable = !!this._pieceMatOverrideEnabledEl.checked;

        // If disabling and nothing is overridden, avoid no-op history entries.
        const pieces = this._spec.pieces || [];
        const hadAny = indices.some((idx) => {
          const p = pieces[idx];
          return !!(p?.materialOverride || p?.materialOverrideSecondary);
        });
        if (!enable && !hadAny) {
          this._syncMaterialsTrayUI(true);
          return;
        }

        indices.forEach((idx) => {
          const p = this._spec.pieces?.[idx];
          if (!p) return;
          if (enable) {
            // Enabled by default: we only create overrides once the user edits values.
            // Keeping this as a no-op avoids dirtying the spec just by selecting.
          } else {
            p.materialOverride = undefined;
            p.materialOverrideSecondary = undefined;
          }
        });
        this._rebuild();
        this._pushHistory();
        this._syncMaterialsTrayUI(true);
        this._syncUi();
      });
    }

    if (this._materialsClearOverridesBtn) {
      this._materialsClearOverridesBtn.addEventListener('click', () => {
        const indices = this._selectedPieceIndicesSorted();
        if (indices.length === 0) return;
        indices.forEach((idx) => {
          const p = this._spec.pieces?.[idx];
          if (!p) return;
          p.materialOverride = undefined;
          p.materialOverrideSecondary = undefined;
        });
        this._rebuild();
        this._pushHistory();
        this._syncMaterialsTrayUI(true);
        this._syncUi();
      });
    }

    // Override controls
    const onColor = () => {
      if (!this._pieceMatColorEl) return;
      applyOverrideToSelection({ color: this._pieceMatColorEl.value });
    };
    const onColor2 = () => {
      if (!this._pieceMatColor2El) return;
      const indices = this._selectedPieceIndicesSorted();
      if (indices.length === 0) return;
      indices.forEach((idx) => {
        const p = this._spec.pieces?.[idx];
        if (!p) return;
        p.materialOverrideSecondary = { ...(p.materialOverrideSecondary || {}), color: this._pieceMatColor2El.value };
      });
      this._rebuild();
      this._scheduleHistoryPush(250);
      this._syncMaterialsTrayUI(true);
    };
    const linkRangeNumber = (rangeEl, numEl, onApply) => {
      if (!rangeEl || !numEl) return;
      const clamp01 = (v) => clamp(v, 0, 1);
      const sync = (fromRange) => {
        const v = clamp01(Number(fromRange ? rangeEl.value : numEl.value));
        rangeEl.value = String(v);
        numEl.value = String(v);
        onApply(v);
      };
      rangeEl.addEventListener('input', () => sync(true));
      numEl.addEventListener('input', () => sync(false));
    };

    if (this._pieceMatColorEl) this._pieceMatColorEl.addEventListener('input', onColor);
    if (this._pieceMatColor2El) this._pieceMatColor2El.addEventListener('input', onColor2);
    linkRangeNumber(this._pieceMatRoughEl, this._pieceMatRoughNumEl, (v) => applyOverrideToSelection({ roughness: v }));
    linkRangeNumber(this._pieceMatMetalEl, this._pieceMatMetalNumEl, (v) => applyOverrideToSelection({ metalness: v }));
  }

  _syncMaterialsTrayUI(force = false) {
    if (!this._materialsRoot) return;

    const indices = this._selectedPieceIndicesSorted();
    const primary = typeof this._selectedPieceIndex === 'number' ? this._selectedPieceIndex : -1;
    const hasMarkerSelection = !!this._selectedMarker;
    const placementKey = this._placement.material || 'road';

    const keyParts = [
      `p:${placementKey}`,
      `m:${hasMarkerSelection ? `${this._selectedMarker.type}:${this._selectedMarker.index}` : 'none'}`,
      `sel:${indices.join(',')}`
    ];
    const renderKey = keyParts.join('|');
    if (!force && renderKey === this._materialsRenderKey) return;
    this._materialsRenderKey = renderKey;

    // Palette active
    if (this._materialsPaletteEl) {
      this._materialsPaletteEl.querySelectorAll('.ed-mat-swatch').forEach((btn) => {
        const k = btn.getAttribute('data-key');
        btn.classList.toggle('is-active', k === placementKey);
      });
    }

    // Selection title
    if (this._materialsTitleEl) {
      const title = hasMarkerSelection
        ? 'Selection (marker)'
        : (indices.length > 0 ? `Selection (${indices.length})` : 'Selection');
      this._materialsTitleEl.textContent = title;
    }

    const disableSelectionUI = hasMarkerSelection || indices.length === 0;
    if (this._materialsSelectionHintEl) {
      this._materialsSelectionHintEl.style.display = disableSelectionUI ? '' : 'none';
      this._materialsSelectionHintEl.textContent = hasMarkerSelection
        ? 'Markers do not have materials'
        : 'Select pieces to edit their material/overrides';
    }

    const setDisabled = (el, v) => { if (el) el.disabled = !!v; };
    setDisabled(this._materialsSelMatEl, disableSelectionUI);
    setDisabled(this._pieceMatOverrideEnabledEl, disableSelectionUI);
    setDisabled(this._materialsClearOverridesBtn, disableSelectionUI);
    setDisabled(this._pieceMatColorEl, disableSelectionUI);
    setDisabled(this._pieceMatColor2El, disableSelectionUI);
    setDisabled(this._pieceMatRoughEl, disableSelectionUI);
    setDisabled(this._pieceMatRoughNumEl, disableSelectionUI);
    setDisabled(this._pieceMatMetalEl, disableSelectionUI);
    setDisabled(this._pieceMatMetalNumEl, disableSelectionUI);

    if (disableSelectionUI) return;

    const pieces = this._spec.pieces || [];
    const primPiece = pieces[primary] || pieces[indices[0]];
    const matKeys = indices.map((idx) => {
      const p = pieces[idx];
      return (p && typeof p.material === 'string') ? p.material : '';
    });
    const allSameMat = matKeys.length > 0 && matKeys.every((k) => k && k === matKeys[0]);
    if (this._materialsSelMatEl) this._materialsSelMatEl.value = allSameMat ? matKeys[0] : '';

    // Override checkbox mixed state
    const hasOv = indices.map((idx) => !!pieces[idx]?.materialOverride);
    const allOv = hasOv.length > 0 && hasOv.every(Boolean);
    const noneOv = hasOv.length > 0 && hasOv.every((v) => !v);
    if (this._pieceMatOverrideEnabledEl) {
      // Override is enabled by default (even if the piece doesn't yet have an override object).
      // Mixed selection shows indeterminate.
      this._pieceMatOverrideEnabledEl.indeterminate = !(allOv || noneOv);
      this._pieceMatOverrideEnabledEl.checked = true;
    }

    // Sync fields from primary piece effective values (but keep the multi-select checkbox state).
    this._refreshSelectedOverrideUI();
    if (this._pieceMatOverrideEnabledEl) {
      this._pieceMatOverrideEnabledEl.indeterminate = !(allOv || noneOv);
      this._pieceMatOverrideEnabledEl.checked = true;
    }
  }

  _updatePlacementPreview(event) {
    if (!this._placementPreview) return;
    if (this._transform?.dragging || this._transform?.axis) {
      this._placementPreview.visible = false;
      return;
    }

    const hit = this._raycastPlacement(event);
    if (!hit?.point) {
      this._placementPreview.visible = false;
      return;
    }

    // Marker preview
    if (this._placementMode && this._placementMode !== 'piece') {
      const mode = this._placementMode;
      const place = this._shouldSnapNow() ? this._snapPointXZ(hit.point) : hit.point;
      const sig = `marker:${mode}`;
      if (this._placementPreview.userData._sig !== sig) {
        this._placementPreview.userData._sig = sig;
        this._placementPreview.geometry?.dispose?.();

        if (mode === 'start') {
          const g = new this._THREE.ConeGeometry(0.9, 2.2, 10);
          g.translate(0, 1.1, 0);
          this._placementPreview.geometry = g;
        } else if (mode === 'checkpoint') {
          this._placementPreview.geometry = new this._THREE.BoxGeometry(30, 10, 8);
        } else {
          const g = new this._THREE.SphereGeometry(0.9, 10, 10);
          g.translate(0, 0.9, 0);
          this._placementPreview.geometry = g;
        }
      }

      const bb = (mode === 'checkpoint') ? { x: 30, y: 10, z: 8 } : (mode === 'start' ? { x: 1.8, y: 2.2, z: 1.8 } : { x: 1.8, y: 1.8, z: 1.8 });
      const yaw = mode === 'start' ? this._cameraYaw() : 0;
      const y = mode === 'checkpoint' ? (place.y + bb.y * 0.5) : place.y;
      this._placementPreview.position.set(place.x, y, place.z);
      this._placementPreview.rotation.set(0, yaw, 0);
      this._placementPreview.visible = true;
      this._previewLastHit = place;
      return;
    }

    const kind = this._placement.kind;
    const size = this._placementSizeForKind(kind);

    const smart = this._computeSmartSnap({ point: hit.point, newKind: kind, newSize: size });
    const place = smart?.point
      ? smart.point
      : (this._shouldSnapNow() ? this._snapPointXZ(hit.point) : hit.point);

    const bb = this._previewBoundsFor(kind, size);

    // Rebuild preview geometry only if needed.
    const sig = `${kind}:${JSON.stringify(size)}`;
    if (this._placementPreview.userData._sig !== sig) {
      this._placementPreview.userData._sig = sig;
      this._placementPreview.geometry?.dispose?.();
      if (kind === 'road_curve' || kind === 'road_curve_90' || kind === 'road_curve_45') {
        const radius = Math.max(1, size?.radius ?? 30);
        const width = Math.max(1, size?.width ?? 26);
        const thickness = Math.max(0.1, size?.thickness ?? 0.6);
        const angleDeg = Math.max(1, Math.min(90, size?.angleDeg ?? (kind === 'road_curve_45' ? 45 : 90)));
        const angle = (angleDeg * Math.PI) / 180;
        const inner = Math.max(1, radius - width / 2);
        const outer = radius + width / 2;

        const shape = new this._THREE.Shape();
        const segments = Math.max(8, Math.floor(angleDeg / 5));
        const innerStartX = inner;
        const innerStartY = 0;
        const outerStartX = outer;
        const outerStartY = 0;
        const innerEndX = Math.cos(angle) * inner;
        const innerEndY = -Math.sin(angle) * inner;

        shape.moveTo(innerStartX, innerStartY);
        shape.lineTo(outerStartX, outerStartY);
        shape.absarc(0, 0, outer, 0, angle, false);
        shape.lineTo(innerEndX, innerEndY);
        shape.absarc(0, 0, inner, angle, 0, true);
        shape.closePath();

        const g = new this._THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: segments });
        g.rotateX(Math.PI / 2);
        g.computeBoundingBox();
        if (g.boundingBox) {
          const c = new this._THREE.Vector3();
          g.boundingBox.getCenter(c);
          g.translate(-c.x, -c.y, -c.z);
        }
        this._placementPreview.geometry = g;
      } else if (kind === 'road_ramp' || kind === 'road_ramp_45') {
        const legacy = size && typeof size === 'object' && ('x' in size) && ('y' in size) && ('z' in size);
        const length = Math.max(1, legacy ? (size.x ?? 40) : (size?.length ?? 40));
        const width = Math.max(1, legacy ? (size.z ?? 26) : (size?.width ?? 26));
        const thickness = Math.max(0.1, legacy ? Math.min(2, (size.y ?? 6) * 0.1) : (size?.thickness ?? 0.6));
        const angleDeg = Math.max(1, Math.min(45, legacy ? 25 : (size?.angleDeg ?? (kind === 'road_ramp_45' ? 45 : 25))));
        const rise = Math.tan((angleDeg * Math.PI) / 180) * length;
        const g = new this._THREE.BoxGeometry(length, thickness, width, 1, 1, 1);
        const pos = g.attributes.position;
        for (let i = 0; i < pos.count; i += 1) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const t = (x + length / 2) / length;
          const baseY = t * rise;
          pos.setY(i, y > 0 ? (baseY + thickness) : baseY);
        }
        pos.needsUpdate = true;
        g.computeVertexNormals();
        this._placementPreview.geometry = g;
      } else {
        this._placementPreview.geometry = new this._THREE.BoxGeometry(bb.x, bb.y, bb.z);
      }
    }

    // Keep the preview resting on the hit height.
    this._placementPreview.position.set(place.x, place.y + bb.y * 0.5, place.z);
    this._placementPreview.rotation.set(0, smart?.rotationY ?? 0, 0);
    this._placementPreview.visible = true;
    this._previewLastHit = place;
  }

  _previewBoundsFor(kind, size) {
    // Always return a conservative axis-aligned box for preview.
    if (size && typeof size === 'object' && ('x' in size) && ('y' in size) && ('z' in size)) {
      return { x: Math.max(0.1, size.x ?? 1), y: Math.max(0.1, size.y ?? 1), z: Math.max(0.1, size.z ?? 1) };
    }
    if (kind === 'road_curve' || kind === 'road_curve_90') {
      const r = Math.max(1, size?.radius ?? 30);
      const w = Math.max(1, size?.width ?? 26);
      const t = Math.max(0.1, size?.thickness ?? 0.6);
      const outer = r + w / 2;
      // AABB for centered quarter-ring.
      return { x: outer, y: t, z: outer };
    }
    if (kind === 'road_curve_45') {
      const r = Math.max(1, size?.radius ?? 30);
      const w = Math.max(1, size?.width ?? 26);
      const t = Math.max(0.1, size?.thickness ?? 0.6);
      const outer = r + w / 2;
      // Still fits in outer×outer AABB after centering.
      return { x: outer, y: t, z: outer };
    }
    if (kind === 'road_ramp' || kind === 'road_ramp_45') {
      const length = Math.max(1, size?.length ?? 40);
      const width = Math.max(1, size?.width ?? 26);
      const thickness = Math.max(0.1, size?.thickness ?? 0.6);
      const angleDeg = Math.max(0, Math.min(45, size?.angleDeg ?? (kind === 'road_ramp_45' ? 45 : 25)));
      const rise = Math.tan((angleDeg * Math.PI) / 180) * length;
      return { x: length, y: thickness + rise, z: width };
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
    this._syncUi();
  }

  _handleClickSelection(idx, additive) {
    if (typeof idx !== 'number' || idx < 0) return;
    this._selectedMarker = null;
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
    this._syncUi();
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

    if (this._selectedMarker) {
      const obj = this._markerMeshes?.[this._selectedMarker.type]?.[this._selectedMarker.index];
      if (obj) {
        this._transform.attach(obj);
        this._pivotAttached = false;
        if (this._selectionPivot) this._selectionPivot.visible = false;
      }
      return;
    }

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

    // Route through keymap/commands (skips when a text input is focused).
    if (this._keymap?.handleKeydown?.(e)) {
      this._syncUi();
      return;
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
    if (this._selectedMarker) {
      this._ensureBasicMarkers();
      const sel = this._selectedMarker;
      const list = this._spec?.markers?.[sel.type];
      if (!Array.isArray(list) || !list[sel.index]) return;

      if (sel.type === 'start' && list.length >= 12) {
        this._toast('Max start positions: 12');
        return;
      }

      const offset = { x: 8, y: 0, z: 8 };
      const clone = deepCloneJson(list[sel.index]);
      clone.position = clone.position || { x: 0, y: 0, z: 0 };
      clone.position.x = (clone.position.x ?? 0) + offset.x;
      clone.position.y = (clone.position.y ?? 0) + offset.y;
      clone.position.z = (clone.position.z ?? 0) + offset.z;
      list.push(clone);

      this._rebuildMarkerMeshes();
      this._rebuild();
      this._selectMarker(sel.type, list.length - 1);
      this._pushHistory();
      this._toast('Duplicated 1 marker');
      this._syncUi();
      return;
    }

    if (!Array.isArray(this._spec.pieces)) return;
    const indices = Array.from(this._selection).filter((n) => typeof n === 'number' && n >= 0 && n < this._spec.pieces.length);
    if (indices.length === 0) return;

    // Keep stable order when duplicating.
    indices.sort((a, b) => a - b);

    const offset = { x: 8, y: 0, z: 8 };
    const existingNames = new Set(this._spec.pieces.map((p) => (typeof p?.name === 'string' ? p.name.trim() : '')).filter(Boolean));
    const newIndices = [];
    indices.forEach((idx) => {
      const src = this._spec.pieces[idx];
      if (!src) return;
      const clone = deepCloneJson(src);
      clone.position = clone.position || { x: 0, y: 0, z: 0 };
      clone.position.x = (clone.position.x ?? 0) + offset.x;
      clone.position.y = (clone.position.y ?? 0) + offset.y;
      clone.position.z = (clone.position.z ?? 0) + offset.z;

      clone.name = this._generateUniquePieceName(clone.kind || 'piece', existingNames);
      existingNames.add(clone.name);

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
    this._syncUi();
  }

  _copySelection() {
    if (this._selectedMarker) {
      const sel = this._selectedMarker;
      const list = this._spec?.markers?.[sel.type];
      if (!Array.isArray(list) || !list[sel.index]) {
        this._toast('Nothing to copy');
        return;
      }
      this._clipboard = { kind: 'marker', markerType: sel.type, entries: [deepCloneJson(list[sel.index])] };
      this._toast('Copied 1 marker');
      return;
    }

    if (!Array.isArray(this._spec.pieces)) {
      this._toast('Nothing to copy');
      return;
    }
    const indices = Array.from(this._selection).filter((n) => typeof n === 'number' && n >= 0 && n < this._spec.pieces.length);
    if (indices.length === 0) {
      this._toast('Nothing to copy');
      return;
    }

    indices.sort((a, b) => a - b);
    const pieces = indices.map((idx) => deepCloneJson(this._spec.pieces[idx]));
    this._clipboard = { kind: 'piece', pieces };
    this._toast(`Copied ${pieces.length} piece${pieces.length === 1 ? '' : 's'}`);
  }

  _pasteClipboard() {
    if (!this._clipboard) {
      this._toast('Clipboard is empty');
      return;
    }

    if (this._clipboard.kind === 'marker') {
      this._ensureBasicMarkers();
      const type = this._clipboard.markerType;
      const list = this._spec?.markers?.[type];
      if (!Array.isArray(list)) {
        this._toast('Cannot paste marker');
        return;
      }
      const clones = (this._clipboard.entries || []).map((e) => deepCloneJson(e));
      if (clones.length === 0) {
        this._toast('Clipboard is empty');
        return;
      }

      if (type === 'start' && (list.length + clones.length) > 12) {
        this._toast('Max start positions: 12');
        return;
      }

      clones.forEach((c) => {
        c.position = c.position || { x: 0, y: 0, z: 0 };
        list.push(c);
      });

      this._rebuildMarkerMeshes();
      this._rebuild();
      this._selectMarker(type, list.length - 1);
      this._pushHistory();
      this._toast(`Pasted ${clones.length} marker${clones.length === 1 ? '' : 's'}`);
      this._syncUi();
      return;
    }

    if (this._clipboard.kind === 'piece') {
      this._spec.pieces = Array.isArray(this._spec.pieces) ? this._spec.pieces : [];
      const src = Array.isArray(this._clipboard.pieces) ? this._clipboard.pieces : [];
      if (src.length === 0) {
        this._toast('Clipboard is empty');
        return;
      }

      const existingNames = new Set(this._spec.pieces.map((p) => (typeof p?.name === 'string' ? p.name.trim() : '')).filter(Boolean));

      const newIndices = [];
      src.forEach((p) => {
        const clone = deepCloneJson(p);
        // Pasting should not offset positions.
        clone.position = clone.position || { x: 0, y: 0, z: 0 };
        // Assign a unique default name on paste.
        clone.name = this._generateUniquePieceName(clone.kind || 'piece', existingNames);
        existingNames.add(clone.name);
        this._spec.pieces.push(clone);
        newIndices.push(this._spec.pieces.length - 1);
      });

      this._rebuildPieceMeshes();
      this._rebuild();

      this._selectedMarker = null;
      this._selection.clear();
      newIndices.forEach((i) => this._selection.add(i));
      this._selectedPieceIndex = newIndices[newIndices.length - 1] ?? -1;
      this._updateSelectionVisuals();
      this._attachTransformToSelection();
      this._refreshSelectedOverrideUI();

      this._pushHistory();
      this._toast(`Pasted ${newIndices.length} piece${newIndices.length === 1 ? '' : 's'}`);
      this._syncUi();
    }
  }

  _focusSelection() {
    if (!this._camera || !this._THREE) return;

    if (this._selectedMarker) {
      const obj = this._markerMeshes?.[this._selectedMarker.type]?.[this._selectedMarker.index];
      if (!obj) return;
      const box = new this._THREE.Box3().setFromObject(obj);
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
      return;
    }

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

  _computeSmartSnap({ point, newKind, newSize }) {
    // Snap to nearby pieces on all axes (XYZ). This complements grid snapping.
    if (!this._shouldSnapNow()) return null;
    if (!point || !this._THREE) return null;
    if (!Array.isArray(this._spec?.pieces) || this._spec.pieces.length === 0) return null;
    if (!Array.isArray(this._pieceMeshes) || this._pieceMeshes.length === 0) return null;

    const THREE = this._THREE;
    const newBB = this._previewBoundsFor(newKind, newSize);
    const newHalf = new THREE.Vector3(newBB.x * 0.5, newBB.y * 0.5, newBB.z * 0.5);

    const base = Math.max(1.5, Number.isFinite(this._snap.translate) ? this._snap.translate : 1);
    const threshold = Math.max(2.0, base * 1.75);

    let best = null;
    const tmpLocal = new THREE.Vector3();

    for (let i = 0; i < this._pieceMeshes.length; i += 1) {
      const mesh = this._pieceMeshes[i];
      const piece = this._spec.pieces[i];
      if (!mesh || !piece) continue;

      const kind = piece.kind || 'road_straight';
      const bb = this._previewBoundsFor(kind, piece.size);
      const sx = mesh.scale?.x ?? 1;
      const sy = mesh.scale?.y ?? 1;
      const sz = mesh.scale?.z ?? 1;
      const half = new THREE.Vector3(bb.x * 0.5 * sx, bb.y * 0.5 * sy, bb.z * 0.5 * sz);

      tmpLocal.copy(point);
      mesh.worldToLocal(tmpLocal);

      const dx = Math.max(Math.abs(tmpLocal.x) - half.x, 0);
      const dy = Math.max(Math.abs(tmpLocal.y) - half.y, 0);
      const dz = Math.max(Math.abs(tmpLocal.z) - half.z, 0);
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > threshold) continue;
      if (!best || dist < best.dist) {
        best = {
          idx: i,
          dist,
          mesh,
          piece,
          localHit: tmpLocal.clone(),
          half
        };
      }
    }

    if (!best) return null;

    const lh = best.localHit;
    const halfT = best.half;
    const nx = halfT.x > 1e-6 ? Math.abs(lh.x) / halfT.x : 0;
    const ny = halfT.y > 1e-6 ? Math.abs(lh.y) / halfT.y : 0;
    const nz = halfT.z > 1e-6 ? Math.abs(lh.z) / halfT.z : 0;
    let axis = 'x';
    if (ny >= nx && ny >= nz) axis = 'y';
    else if (nz >= nx && nz >= ny) axis = 'z';

    const axisValue = axis === 'x' ? lh.x : (axis === 'y' ? lh.y : lh.z);
    const sign = axisValue >= 0 ? 1 : -1;

    const snappedCenterLocal = new THREE.Vector3(0, 0, 0);
    if (axis === 'x') snappedCenterLocal.x = sign * (halfT.x + newHalf.x);
    if (axis === 'y') snappedCenterLocal.y = sign * (halfT.y + newHalf.y);
    if (axis === 'z') snappedCenterLocal.z = sign * (halfT.z + newHalf.z);

    const snappedCenterWorld = snappedCenterLocal.clone();
    best.mesh.localToWorld(snappedCenterWorld);

    // Editor convention: spec position is a ground-anchor (bottom center) in world Y.
    const anchor = new THREE.Vector3(
      snappedCenterWorld.x,
      snappedCenterWorld.y - newHalf.y,
      snappedCenterWorld.z
    );

    const yaw = best.mesh.rotation?.y ?? (best.piece.rotation?.y ?? 0);
    return { point: anchor, rotationY: yaw, snappedToIndex: best.idx, axis };
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
    this._selectedMarker = null;

    this._rebuildPieceMeshes();
    this._rebuildMarkerMeshes();
    this._rebuild();
    this._refreshSelectedOverrideUI();
    this._syncUi();
  }

  _registerCommands() {
    if (!this._commands) return;

    this._commands.register('editor.exit', () => {
      if (typeof this._onExitToMenu === 'function') this._onExitToMenu();
    });

    this._commands.register('editor.save', () => {
      saveTrackSpec(this._spec);
      this._toast('Saved to local storage');

      const startCount = this._startMarkerCount();
      if (startCount !== 12) {
        alert(`Track should have exactly 12 start positions (currently ${startCount}).`);
      }
    });

    this._commands.register('editor.export', async () => {
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

    this._commands.register('editor.import', async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.style.display = 'none';

      const cleanup = () => {
        try { input.remove(); } catch { /* ignore */ }
      };

      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) {
          cleanup();
          return;
        }
        try {
          const text = await file.text();
          this._importSpecFromJsonString(text, { sourceName: file.name });
          // Mirror the main menu behavior: imported spec becomes the current saved track.
          saveTrackSpec(this._spec);
          this._toast(`Imported ${file.name}`);
        } catch (err) {
          console.error('[Editor] Import failed:', err);
          alert(`Import failed: ${err.message || err}`);
        } finally {
          cleanup();
        }
      });

      document.body.appendChild(input);
      input.click();
    });

    this._commands.register('editor.playtest', () => {
      const startCount = this._startMarkerCount();
      if (startCount !== 12) {
        alert(`Cannot playtest: track must have exactly 12 start positions (currently ${startCount}).`);
        return;
      }
      saveTrackSpec(this._spec);
      if (typeof this._onPlaytest === 'function') this._onPlaytest(this._spec);
    });

    this._commands.register('editor.undo', () => this.undo());
    this._commands.register('editor.redo', () => this.redo());
    this._commands.register('editor.duplicate', () => this._duplicateSelection());
    this._commands.register('editor.copy', () => this._copySelection());
    this._commands.register('editor.paste', () => this._pasteClipboard());
    this._commands.register('editor.delete', () => this._deleteSelected());
    this._commands.register('editor.focus', () => this._focusSelection());

    this._commands.register('editor.rename', () => {
      if (this._selectedMarker) {
        this._toast('Markers cannot be renamed');
        return;
      }
      if (!Array.isArray(this._spec?.pieces) || this._selection.size !== 1) {
        this._toast('Select one piece to rename');
        return;
      }
      const idx = this._selectedPieceIndex;
      if (typeof idx !== 'number' || idx < 0 || idx >= this._spec.pieces.length) return;
      const piece = this._spec.pieces[idx];
      const current = (typeof piece?.name === 'string') ? piece.name : '';
      const next = prompt('Rename object', current || '');
      if (next === null) return;
      piece.name = String(next);
      this._pushHistory();
      this._syncUi();
    });

    this._commands.register('editor.deselect', () => {
      this._selectedMarker = null;
      this._selectPiece(-1);
    });

    this._commands.register('editor.toggleSnap', () => {
      this._snap.enabled = !this._snap.enabled;
      const el = this._ui?.querySelector?.('#editor-snap-enabled');
      if (el) el.checked = !!this._snap.enabled;
      this._applyTransformSnapping();
      this._toast(this._snap.enabled ? 'Snap enabled' : 'Snap disabled');
      this._updateStatusBar();
    });

    this._commands.register('editor.mode.translate', () => { this._transformMode = 'translate'; this._transform?.setMode('translate'); this._syncUi(); });
    this._commands.register('editor.mode.rotate', () => { this._transformMode = 'rotate'; this._transform?.setMode('rotate'); this._syncUi(); });
    this._commands.register('editor.mode.scale', () => { this._transformMode = 'scale'; this._transform?.setMode('scale'); this._syncUi(); });

    this._commands.register('editor.resetLayout', () => this._uiShell?.resetLayout?.());

    this._commands.register('editor.pause.toggle', () => {
      this._setPaused(!this._paused);
    });
    this._commands.register('editor.pause.resume', () => {
      this._setPaused(false);
    });

    this._commands.register('editor.showShortcuts', () => {
      alert(
        'Editor Shortcuts\n\n' +
        'LMB: place/select\n' +
        'Shift+LMB: multi-select\n' +
        'RMB+WASD: fly camera\n' +
        'G/R/F: move/rotate/scale\n' +
        'Ctrl+Z / Ctrl+Y: undo/redo\n' +
        'Ctrl+D: duplicate\n' +
        'Ctrl+C / Ctrl+V: copy/paste\n' +
        'Delete: delete selection\n' +
        'C: focus selection\n' +
        'V: toggle snapping\n' +
        'Esc: editor menu\n' +
        'Alt: temporarily disable snapping\n' +
        'Ctrl+S: save'
      );
    });
  }

  _syncUi() {
    if (!this._uiShell) return;
    const pieces = Array.isArray(this._spec.pieces) ? this._spec.pieces : [];

    const selection = this._selection;
    const primaryIndex = this._selectedPieceIndex;
    const markers = this._spec?.markers || {};
    const selectedMarker = this._selectedMarker;
    this._uiShell.renderOutliner({ pieces, selection, primaryIndex, markers, selectedMarker });

    let label = '';
    if (this._selectedMarker) {
      const pretty = this._selectedMarker.type === 'checkpoints' ? 'checkpoint' : (this._selectedMarker.type === 'items' ? 'item' : 'start');
      label = `${pretty} ${this._selectedMarker.index}`;
    } else if (selection.size === 1) {
      const p = pieces[primaryIndex];
      if (p) {
        const mat = typeof p.material === 'string' ? p.material : '';
        label = `${p.kind || 'piece'}${mat ? ` [${mat}]` : ''}`;
      }
    } else if (selection.size > 1) {
      label = 'multi';
    }

    const count = this._selectedMarker ? 1 : selection.size;
    this._uiShell.setSelectionInfo({ count, label });

    this._updateStatusBar();

    this._syncMaterialsTrayUI();
  }

  _updateStatusBar() {
    if (!this._uiShell) return;
    const snapText = this._snap.enabled
      ? `Snap: on (grid ${this._snap.translate}, angle ${this._snap.rotateDeg}°)`
      : 'Snap: off';
    const delta = this._transformDeltaText ? ` | ${this._transformDeltaText}` : '';
    this._uiShell.setStatusRight(`${snapText}${delta}`);
  }

  _setPaused(paused) {
    this._paused = !!paused;
    if (this._uiShell?.setPaused) this._uiShell.setPaused(this._paused);
    if (this._fly) this._fly.enabled = !this._paused && !(this._transform?.dragging);
  }

  _updateTransformDeltaReadout() {
    if (!this._transformDeltaStart) {
      this._transformDeltaText = '';
      return;
    }

    const obj = this._selectedMarker
      ? this._markerMeshes?.[this._selectedMarker.type]?.[this._selectedMarker.index]
      : (this._pivotAttached ? this._selectionPivot : this._pieceMeshes[this._selectedPieceIndex]);
    if (!obj) {
      this._transformDeltaText = '';
      return;
    }

    const st = this._transformDeltaStart;

    if (this._transformMode === 'translate') {
      const dx = obj.position.x - st.position.x;
      const dy = obj.position.y - st.position.y;
      const dz = obj.position.z - st.position.z;
      this._transformDeltaText = `Δ Move: ${dx.toFixed(2)}, ${dy.toFixed(2)}, ${dz.toFixed(2)}`;
      this._updateStatusBar();
      return;
    }

    if (this._transformMode === 'rotate') {
      const q = obj.quaternion;
      const dq = st.quaternion.clone().invert().multiply(q);
      const w = Math.max(-1, Math.min(1, dq.w));
      const angle = 2 * Math.acos(w);
      const deg = angle * (180 / Math.PI);
      this._transformDeltaText = `Δ Rot: ${deg.toFixed(1)}°`;
      this._updateStatusBar();
      return;
    }

    if (this._transformMode === 'scale') {
      const sx = obj.scale.x / (st.scale.x || 1);
      const sy = obj.scale.y / (st.scale.y || 1);
      const sz = obj.scale.z / (st.scale.z || 1);
      this._transformDeltaText = `Δ Scale: ${sx.toFixed(2)}×, ${sy.toFixed(2)}×, ${sz.toFixed(2)}×`;
      this._updateStatusBar();
    }
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

  _disposeObjectWithOptions(obj, { disposeMaterials } = { disposeMaterials: true }) {
    if (!obj) return;
    const doDisposeMaterials = disposeMaterials !== false;
    obj.traverse?.((child) => {
      if (child.geometry) {
        if (child.geometry.disposeBoundsTree) {
          try { child.geometry.disposeBoundsTree(); } catch { /* ignore */ }
        }
        if (child.geometry.dispose) child.geometry.dispose();
      }
      if (doDisposeMaterials && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => m?.dispose?.());
      }
    });
  }

  _disposeObject(obj, options = { disposeMaterials: true }) {
    this._disposeObjectWithOptions(obj, options);
  }
}

export default TrackEditorMode;
