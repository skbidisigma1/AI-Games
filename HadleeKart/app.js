import { initGame, updateGame, disposeGame } from './game.js';
import { TrackEditorMode } from './editor/editorMode.js';

import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree
} from 'three-mesh-bvh';

let app = null;

function createFullScreenPanel(container, className) {
  const el = document.createElement('div');
  el.className = className;
  container.appendChild(el);
  return el;
}

function setVisible(el, visible) {
  if (!el) return;
  el.style.display = visible ? '' : 'none';
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getSavedTrackSpec() {
  const raw = localStorage.getItem('hadleekart.trackSpec');
  if (!raw) return null;
  return safeJsonParse(raw);
}

function getSavedSettings() {
  const raw = localStorage.getItem('hadleekart.settings');
  if (!raw) return null;
  return safeJsonParse(raw);
}

function defaultSettings() {
  return {
    showHud: true,
    maxPixelRatio: 2
  };
}

function mergeSettings(base, override) {
  return {
    ...base,
    ...(override || {}),
    maxPixelRatio: Number.isFinite(Number((override || {}).maxPixelRatio)) ? Number((override || {}).maxPixelRatio) : base.maxPixelRatio,
    showHud: (override || {}).showHud !== undefined ? !!(override || {}).showHud : base.showHud
  };
}

function saveSettings(settings) {
  localStorage.setItem('hadleekart.settings', JSON.stringify(settings));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setScreen(root, activeId) {
  const screens = root.querySelectorAll('[data-screen]');
  screens.forEach((el) => {
    const isActive = el.getAttribute('data-screen') === activeId;
    el.classList.toggle('ui-screen-active', isActive);
    el.style.display = isActive ? '' : 'none';
  });
}

export async function initApp({ THREE, GLTFLoader, scene, camera, renderer, config, container }) {
  if (app) return app;

  // Patch Three.js for BVH-accelerated raycasting if available.
  // (This is safe to call once and applies globally.)
  if (THREE?.Mesh?.prototype && !THREE.Mesh.prototype.raycast.__bvh_patched) {
    THREE.Mesh.prototype.raycast = acceleratedRaycast;
    THREE.Mesh.prototype.raycast.__bvh_patched = true;
  }
  if (THREE?.BufferGeometry?.prototype && !THREE.BufferGeometry.prototype.computeBoundsTree) {
    THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
    THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  }

  const uiRoot = createFullScreenPanel(container, 'ui-root');
  const uiShell = createFullScreenPanel(uiRoot, 'ui-shell');
  const loadingPanel = createFullScreenPanel(uiRoot, 'loading-panel');

  // Screens
  uiShell.innerHTML = `
    <div class="ui-screen" data-screen="main">
      <div class="ui-card ui-card-hero">
        <div class="ui-brand">
          <div class="ui-brand-title">HadleeKart</div>
          <div class="ui-brand-subtitle">Race • Build • Iterate</div>
        </div>

        <div class="ui-grid">
          <button id="ui-main-play" class="ui-btn ui-btn-primary">Play</button>
          <button id="ui-main-editor" class="ui-btn">Track Editor</button>
          <button id="ui-main-settings" class="ui-btn">Settings</button>
          <button id="ui-main-controls" class="ui-btn">Controls</button>
          <button id="ui-main-credits" class="ui-btn">Credits</button>
        </div>

        <div class="ui-footnote">Tip: In the editor, press Playtest to jump into a race.</div>
      </div>
    </div>

    <div class="ui-screen" data-screen="play">
      <div class="ui-card">
        <div class="ui-title">Play</div>
        <div class="ui-subtitle">Choose a track source</div>

        <div class="ui-grid">
          <button id="ui-play-default" class="ui-btn ui-btn-primary">Default Track</button>
          <button id="ui-play-saved" class="ui-btn">Saved Editor Track</button>
          <label class="ui-btn ui-btn-file">
            Import Track JSON
            <input id="ui-play-import" type="file" accept="application/json" />
          </label>
        </div>

        <div class="ui-row">
          <button id="ui-play-back" class="ui-btn ui-btn-ghost">Back</button>
        </div>
      </div>
    </div>

    <div class="ui-screen" data-screen="settings">
      <div class="ui-card">
        <div class="ui-title">Settings</div>
        <div class="ui-subtitle">Applies immediately</div>

        <div class="ui-settings">
          <div class="ui-setting">
            <div class="ui-setting-label">HUD</div>
            <label class="ui-toggle">
              <input id="ui-setting-hud" type="checkbox" />
              <span class="ui-toggle-track"></span>
            </label>
          </div>

          <div class="ui-setting">
            <div class="ui-setting-label">Max Pixel Ratio</div>
            <input id="ui-setting-pr" class="ui-slider" type="range" min="1" max="2" step="0.05" />
            <div id="ui-setting-pr-label" class="ui-setting-value"></div>
          </div>
        </div>

        <div class="ui-row">
          <button id="ui-settings-back" class="ui-btn ui-btn-ghost">Back</button>
        </div>
      </div>
    </div>

    <div class="ui-screen" data-screen="controls">
      <div class="ui-card">
        <div class="ui-title">Controls</div>
        <div class="ui-subtitle">Race</div>
        <div class="ui-footnote" style="margin-top: 10px; font-size: 13px; line-height: 1.6;">
          W / ↑: accelerate<br>
          S / ↓: brake / reverse<br>
          A / D or ← / →: steer<br>
          Shift: hop + drift<br>
          E: use item<br>
          X: rear view<br>
          T: respawn<br>
          Esc: pause
        </div>

        <div class="ui-subtitle" style="margin-top: 14px;">Editor</div>
        <div class="ui-footnote" style="margin-top: 10px; font-size: 13px; line-height: 1.6;">
          LMB: place/select piece<br>
          Shift + LMB: multi-select<br>
          RMB + WASD: fly camera<br>
          G / R / S: move / rotate / scale<br>
          Ctrl + Z / Y: undo / redo<br>
          Ctrl + D: duplicate<br>
          F: focus selection<br>
          V: toggle snapping (grid=1, angle=12.5°)<br>
          Alt: temporarily disable snapping<br>
          Shift: half-step snap • Ctrl: 1/5-step • Shift+Ctrl: 1/10-step<br>
          Delete: delete selection
        </div>

        <div class="ui-row">
          <button id="ui-controls-back" class="ui-btn ui-btn-ghost">Back</button>
        </div>
      </div>
    </div>

    <div class="ui-screen" data-screen="credits">
      <div class="ui-card">
        <div class="ui-title">Credits</div>
        <div class="ui-footnote" style="margin-top: 12px; font-size: 13px; line-height: 1.6;">
          Built with Three.js + three-mesh-bvh.<br>
          Track editor + runtime modular builder included.
        </div>
        <div class="ui-row">
          <button id="ui-credits-back" class="ui-btn ui-btn-ghost">Back</button>
        </div>
      </div>
    </div>

    <div class="ui-screen" data-screen="pause">
      <div class="ui-card">
        <div class="ui-title">Paused</div>
        <div class="ui-subtitle">Esc to resume</div>

        <div class="ui-grid">
          <button id="ui-pause-resume" class="ui-btn ui-btn-primary">Resume</button>
          <button id="ui-pause-restart" class="ui-btn">Restart</button>
          <button id="ui-pause-settings" class="ui-btn">Settings</button>
          <button id="ui-pause-controls" class="ui-btn">Controls</button>
          <button id="ui-pause-exit" class="ui-btn ui-btn-danger">Exit to Menu</button>
        </div>
      </div>
    </div>
  `;

  loadingPanel.innerHTML = `
    <div class="loading-card">
      <div class="loading-title">Loading…</div>
      <div class="loading-subtitle">One moment</div>
    </div>
  `;

  const editorMode = new TrackEditorMode();

  const settings = mergeSettings(defaultSettings(), getSavedSettings());

  // Wire settings UI
  const hudToggle = uiShell.querySelector('#ui-setting-hud');
  const prSlider = uiShell.querySelector('#ui-setting-pr');
  const prLabel = uiShell.querySelector('#ui-setting-pr-label');
  hudToggle.checked = !!settings.showHud;
  prSlider.value = String(clamp(settings.maxPixelRatio ?? 2, 1, 2));
  prLabel.textContent = `${Number(prSlider.value).toFixed(2)}x`;

  const applySettings = () => {
    settings.showHud = !!hudToggle.checked;
    settings.maxPixelRatio = clamp(Number(prSlider.value), 1, 2);
    prLabel.textContent = `${Number(settings.maxPixelRatio).toFixed(2)}x`;
    saveSettings(settings);

    // Apply renderer scaling immediately.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.maxPixelRatio));

    // HUD visibility is applied by game.js when it creates overlay.
  };
  hudToggle.addEventListener('change', applySettings);
  prSlider.addEventListener('input', applySettings);

  app = {
    THREE,
    GLTFLoader,
    scene,
    camera,
    renderer,
    config,
    container,
    uiRoot,
    uiShell,
    loadingPanel,
    editorMode,
    activeMode: 'menu',
    activeUpdate: null,
    activeExit: null,
    pending: null,
    activeTrackOverride: null,
    settings,
    racePaused: false,
    _raceTrackOverride: null,
    _escHandler: null,
    _pauseReturnScreen: 'pause'
  };

  function showLoading(show) {
    setVisible(loadingPanel, show);
  }

  async function setMode(mode, { trackOverride } = {}) {
    if (app.pending) return;
    app.pending = (async () => {
      showLoading(true);
      try {
        // Exit current mode
        if (typeof app.activeExit === 'function') {
          await app.activeExit();
        }
        app.activeExit = null;
        app.activeUpdate = null;

        // Clear scene objects that are not managed by modes.
        // Modes are expected to remove what they add.

        app.activeMode = mode;
        app.activeTrackOverride = trackOverride || null;
        app.racePaused = false;

        if (mode === 'menu') {
          setVisible(app.uiShell, true);
          setScreen(app.uiShell, 'main');
          app.activeExit = () => {};
          app.activeUpdate = () => {};
          return;
        }

        // Non-menu modes hide UI shell except for pause.
        setVisible(app.uiShell, false);

        if (mode === 'race') {
          app._raceTrackOverride = trackOverride || null;
          await initGame({
            THREE: app.THREE,
            GLTFLoader: app.GLTFLoader,
            scene: app.scene,
            camera: app.camera,
            renderer: app.renderer,
            config: app.config,
            container: app.container,
            track: trackOverride,
            settings: app.settings,
            onExitToMenu: async () => {
              await setMode('menu');
            },
            onRestart: async () => {
              await setMode('race', { trackOverride: app._raceTrackOverride });
            }
          });

          // Pause handler (Esc). Capture so it runs before game input.
          app._escHandler = (e) => {
            if (e.code !== 'Escape') return;
            if (app.activeMode !== 'race') return;
            e.preventDefault();
            e.stopPropagation();
            togglePause();
          };
          window.addEventListener('keydown', app._escHandler, true);

          app.activeUpdate = () => {
            if (app.racePaused) {
              // Keep rendering the scene behind the pause UI.
              app.renderer.render(app.scene, app.camera);
              return;
            }
            updateGame();
          };
          app.activeExit = () => {
            if (app._escHandler) {
              window.removeEventListener('keydown', app._escHandler, true);
              app._escHandler = null;
            }
            setVisible(app.uiShell, false);
            disposeGame();
          };
          return;
        }

        if (mode === 'editor') {
          await app.editorMode.enter({
            THREE: app.THREE,
            GLTFLoader: app.GLTFLoader,
            scene: app.scene,
            camera: app.camera,
            renderer: app.renderer,
            config: app.config,
            container: app.container,
            onExitToMenu: () => setMode('menu'),
            onPlaytest: async (trackSpec) => {
              app.activeTrackOverride = { type: 'spec', spec: trackSpec };
              await setMode('race', { trackOverride: app.activeTrackOverride });
            }
          });
          app.activeUpdate = (dt) => app.editorMode.update(dt);
          app.activeExit = () => app.editorMode.exit();
          return;
        }

        throw new Error(`Unknown mode: ${mode}`);
      } finally {
        showLoading(false);
        app.pending = null;
      }
    })();

    return app.pending;
  }

  // Wire menu buttons
  const btnMainPlay = uiShell.querySelector('#ui-main-play');
  const btnMainEditor = uiShell.querySelector('#ui-main-editor');
  const btnMainSettings = uiShell.querySelector('#ui-main-settings');
  const btnMainControls = uiShell.querySelector('#ui-main-controls');
  const btnMainCredits = uiShell.querySelector('#ui-main-credits');

  const btnPlayDefault = uiShell.querySelector('#ui-play-default');
  const btnPlaySaved = uiShell.querySelector('#ui-play-saved');
  const btnPlayBack = uiShell.querySelector('#ui-play-back');
  const playImport = uiShell.querySelector('#ui-play-import');

  const btnSettingsBack = uiShell.querySelector('#ui-settings-back');
  const btnControlsBack = uiShell.querySelector('#ui-controls-back');
  const btnCreditsBack = uiShell.querySelector('#ui-credits-back');

  const btnPauseResume = uiShell.querySelector('#ui-pause-resume');
  const btnPauseRestart = uiShell.querySelector('#ui-pause-restart');
  const btnPauseSettings = uiShell.querySelector('#ui-pause-settings');
  const btnPauseControls = uiShell.querySelector('#ui-pause-controls');
  const btnPauseExit = uiShell.querySelector('#ui-pause-exit');

  btnMainPlay.addEventListener('click', () => {
    setScreen(uiShell, 'play');
  });
  btnMainEditor.addEventListener('click', () => {
    setMode('editor');
  });
  btnMainSettings.addEventListener('click', () => {
    setScreen(uiShell, 'settings');
  });
  btnMainControls.addEventListener('click', () => {
    setScreen(uiShell, 'controls');
  });
  btnMainCredits.addEventListener('click', () => {
    setScreen(uiShell, 'credits');
  });

  btnPlayBack.addEventListener('click', () => {
    setScreen(uiShell, 'main');
  });
  btnPlayDefault.addEventListener('click', () => {
    setMode('race', { trackOverride: { type: 'glb', path: app.config.track?.path } });
  });
  btnPlaySaved.addEventListener('click', () => {
    const spec = getSavedTrackSpec();
    if (!spec) {
      alert('No saved edited track yet. Open the editor and save a track first.');
      return;
    }
    setMode('race', { trackOverride: { type: 'spec', spec } });
  });

  playImport.addEventListener('change', async () => {
    const file = playImport.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const spec = safeJsonParse(text);
      if (!spec) throw new Error('Invalid JSON');
      setMode('race', { trackOverride: { type: 'spec', spec } });
    } catch (e) {
      alert(`Import failed: ${e.message || e}`);
    } finally {
      playImport.value = '';
    }
  });

  const backToMenuOrPause = () => {
    if (app.activeMode === 'race' && app.racePaused) {
      setScreen(uiShell, 'pause');
    } else {
      setScreen(uiShell, 'main');
    }
  };

  btnSettingsBack.addEventListener('click', backToMenuOrPause);
  btnControlsBack.addEventListener('click', backToMenuOrPause);
  btnCreditsBack.addEventListener('click', () => {
    setScreen(uiShell, 'main');
  });

  function showPause(show, returnScreen = 'pause') {
    app._pauseReturnScreen = returnScreen;
    app.racePaused = show;
    setVisible(app.uiShell, show);
    if (show) {
      setScreen(app.uiShell, returnScreen);
    }
  }

  function togglePause() {
    if (app.activeMode !== 'race') return;
    showPause(!app.racePaused, 'pause');
  }

  btnPauseResume.addEventListener('click', () => showPause(false));
  btnPauseRestart.addEventListener('click', async () => {
    showPause(false);
    await setMode('race', { trackOverride: app._raceTrackOverride });
  });
  btnPauseSettings.addEventListener('click', () => {
    showPause(true, 'settings');
  });
  btnPauseControls.addEventListener('click', () => {
    showPause(true, 'controls');
  });
  btnPauseExit.addEventListener('click', async () => {
    showPause(false);
    await setMode('menu');
  });

  // Initial mode
  setVisible(uiShell, true);
  setScreen(uiShell, 'main');
  setVisible(loadingPanel, false);

  // Expose for debugging
  app.setMode = setMode;

  return app;
}

export function updateApp() {
  if (!app || typeof app.activeUpdate !== 'function') return;

  // Give editor a dt; race uses its own clock inside game.js.
  if (app.activeMode === 'editor') {
    if (!app._editorLast) app._editorLast = performance.now();
    const now = performance.now();
    const dt = Math.min((now - app._editorLast) / 1000, 0.05);
    app._editorLast = now;
    app.activeUpdate(dt);
    return;
  }

  app.activeUpdate();
}

export default { initApp, updateApp };
