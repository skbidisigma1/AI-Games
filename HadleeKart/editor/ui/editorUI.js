function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readLayout() {
  try {
    const raw = localStorage.getItem('hadleekart.editor.layout');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLayout(layout) {
  try {
    localStorage.setItem('hadleekart.editor.layout', JSON.stringify(layout));
  } catch {
    // ignore
  }
}

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function makeMenu({ label, items, onAction }) {
  const wrap = createEl('div', 'ed-menubar-menu');
  const btn = createEl('button', 'ed-menubar-btn', label);
  btn.type = 'button';

  const pop = createEl('div', 'ed-menubar-pop');
  pop.setAttribute('role', 'menu');
  pop.style.display = 'none';

  const close = () => {
    pop.style.display = 'none';
    wrap.classList.remove('is-open');
  };

  items.forEach((it) => {
    if (it === 'separator') {
      pop.appendChild(createEl('div', 'ed-menubar-sep'));
      return;
    }

    const item = createEl('button', 'ed-menubar-item');
    item.type = 'button';
    item.setAttribute('role', 'menuitem');

    const left = createEl('div', 'ed-menubar-item-left');
    const right = createEl('div', 'ed-menubar-item-right');

    left.textContent = it.label;
    right.textContent = it.shortcut || '';

    item.appendChild(left);
    item.appendChild(right);

    item.addEventListener('click', () => {
      close();
      onAction?.(it.id);
    });

    pop.appendChild(item);
  });

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isOpen = wrap.classList.contains('is-open');
    // Close any other open menus
    document.querySelectorAll('.ed-menubar-menu.is-open').forEach((m) => {
      if (m !== wrap) {
        m.classList.remove('is-open');
        const p = m.querySelector('.ed-menubar-pop');
        if (p) p.style.display = 'none';
      }
    });

    if (isOpen) {
      close();
    } else {
      wrap.classList.add('is-open');
      pop.style.display = '';
    }
  });

  // Hover switching when another menu is open (Blender-ish feel)
  wrap.addEventListener('mouseenter', () => {
    const anyOpen = document.querySelector('.ed-menubar-menu.is-open');
    if (anyOpen && anyOpen !== wrap) {
      anyOpen.classList.remove('is-open');
      const p = anyOpen.querySelector('.ed-menubar-pop');
      if (p) p.style.display = 'none';
      wrap.classList.add('is-open');
      pop.style.display = '';
    }
  });

  wrap.appendChild(btn);
  wrap.appendChild(pop);

  return { wrap, close };
}

export function createEditorUI({ container, onMenuAction, onOutlinerSelect, onOutlinerRename }) {
  const root = createEl('div', 'ed-ui-root');

  const layout = readLayout() || { leftWidth: 260, rightWidth: 420 };
  layout.leftWidth = clamp(layout.leftWidth ?? 260, 180, 520);
  layout.rightWidth = clamp(layout.rightWidth ?? 420, 260, 660);

  const bottomPanelHeight = 220;
  const bottomPanelGap = 10;

  // Menubar
  const menubar = createEl('div', 'ed-menubar');
  const menubarLeft = createEl('div', 'ed-menubar-left');
  const menubarRight = createEl('div', 'ed-menubar-right');
  const title = createEl('div', 'ed-menubar-title', 'Track Editor');

  const playtestBtn = createEl('button', 'ed-menubar-action ed-menubar-action-primary', 'Playtest');
  playtestBtn.type = 'button';
  playtestBtn.addEventListener('click', () => onMenuAction?.('editor.playtest'));

  menubarRight.appendChild(playtestBtn);
  menubarRight.appendChild(title);
  menubar.appendChild(menubarLeft);
  menubar.appendChild(menubarRight);

  const menus = [];
  const fileMenu = makeMenu({
    label: 'File',
    items: [
      { id: 'editor.save', label: 'Save', shortcut: 'Ctrl+S' },
      { id: 'editor.import', label: 'Import JSON…' },
      { id: 'editor.export', label: 'Export JSON…' },
      'separator',
      { id: 'editor.playtest', label: 'Playtest' },
      'separator',
      { id: 'editor.exit', label: 'Exit to Menu' }
    ],
    onAction: onMenuAction
  });
  const editMenu = makeMenu({
    label: 'Edit',
    items: [
      { id: 'editor.undo', label: 'Undo', shortcut: 'Ctrl+Z' },
      { id: 'editor.redo', label: 'Redo', shortcut: 'Ctrl+Y' },
      'separator',
      { id: 'editor.duplicate', label: 'Duplicate', shortcut: 'Ctrl+D' },
      { id: 'editor.delete', label: 'Delete', shortcut: 'Del' }
    ],
    onAction: onMenuAction
  });
  const viewMenu = makeMenu({
    label: 'View',
    items: [
      { id: 'editor.focus', label: 'Focus Selection', shortcut: 'C' },
      { id: 'editor.toggleSnap', label: 'Toggle Snap', shortcut: 'V' },
      'separator',
      { id: 'editor.resetLayout', label: 'Reset Layout' }
    ],
    onAction: onMenuAction
  });
  const helpMenu = makeMenu({
    label: 'Help',
    items: [
      { id: 'editor.showShortcuts', label: 'Shortcuts' }
    ],
    onAction: onMenuAction
  });

  menus.push(fileMenu, editMenu, viewMenu, helpMenu);
  menubarLeft.appendChild(fileMenu.wrap);
  menubarLeft.appendChild(editMenu.wrap);
  menubarLeft.appendChild(viewMenu.wrap);
  menubarLeft.appendChild(helpMenu.wrap);

  // Workspace (side panes overlay the viewport)
  const workspace = createEl('div', 'ed-workspace');

  const leftPane = createEl('div', 'ed-pane ed-pane-left');
  leftPane.style.width = `${layout.leftWidth}px`;

  const leftHeader = createEl('div', 'ed-pane-header');
  leftHeader.appendChild(createEl('div', 'ed-pane-title', 'Outliner'));
  leftPane.appendChild(leftHeader);

  const outliner = createEl('div', 'ed-outliner');
  leftPane.appendChild(outliner);

  const leftResizer = createEl('div', 'ed-resizer ed-resizer-left');

  const viewportPassthrough = createEl('div', 'ed-viewport');

  const rightResizer = createEl('div', 'ed-resizer ed-resizer-right');

  const rightPane = createEl('div', 'ed-pane ed-pane-right');
  rightPane.style.width = `${layout.rightWidth}px`;

  const rightHeader = createEl('div', 'ed-pane-header');
  rightHeader.appendChild(createEl('div', 'ed-pane-title', 'Properties'));
  const selectionInfo = createEl('div', 'ed-pane-subtitle', 'No selection');
  rightHeader.appendChild(selectionInfo);
  rightPane.appendChild(rightHeader);

  const rightContent = createEl('div', 'ed-pane-content');
  rightPane.appendChild(rightContent);

  const statusbar = createEl('div', 'ed-statusbar');
  const statusLeft = createEl('div', 'ed-status-left');
  const statusRight = createEl('div', 'ed-status-right');
  statusbar.appendChild(statusLeft);
  statusbar.appendChild(statusRight);

  statusLeft.textContent = 'LMB: select/place • RMB+WASD: fly • G/R/F: transform • Esc: menu';
  statusRight.textContent = 'Snap: on';

  // Bottom tray (Materials)
  const bottomPanel = createEl('div', 'ed-bottompanel');
  const bottomHeader = createEl('div', 'ed-bottompanel-header');
  bottomHeader.appendChild(createEl('div', 'ed-bottompanel-title', 'Materials'));
  bottomPanel.appendChild(bottomHeader);
  const bottomContent = createEl('div', 'ed-bottompanel-content');
  bottomPanel.appendChild(bottomContent);

  // Pause modal (Esc)
  const modal = createEl('div', 'ed-modal');
  const modalCard = createEl('div', 'ed-modal-card');
  const modalTitle = createEl('div', 'ed-modal-title', 'Editor Menu');
  const modalSub = createEl('div', 'ed-modal-sub', 'Esc to close');
  const modalGrid = createEl('div', 'ed-modal-grid');

  const btnResume = createEl('button', 'ui-btn ui-btn-primary', 'Resume');
  btnResume.type = 'button';
  btnResume.addEventListener('click', () => onMenuAction?.('editor.pause.resume'));

  const btnPlaytest = createEl('button', 'ui-btn', 'Playtest');
  btnPlaytest.type = 'button';
  btnPlaytest.addEventListener('click', () => onMenuAction?.('editor.playtest'));

  const btnExit = createEl('button', 'ui-btn ui-btn-danger', 'Exit to Menu');
  btnExit.type = 'button';
  btnExit.addEventListener('click', () => onMenuAction?.('editor.exit'));

  modalGrid.appendChild(btnResume);
  modalGrid.appendChild(btnPlaytest);
  modalGrid.appendChild(btnExit);

  modalCard.appendChild(modalTitle);
  modalCard.appendChild(modalSub);
  modalCard.appendChild(modalGrid);
  modal.appendChild(modalCard);
  // IMPORTANT: when closed, the modal must not be hit-testable.
  // Relying on opacity/pointer-events alone is brittle because children can still
  // capture pointer events in some browsers/CSS combinations.
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  try { modal.inert = true; } catch { /* ignore */ }
  modal.addEventListener('click', (e) => {
    if (e.target === modal) onMenuAction?.('editor.pause.resume');
  });

  workspace.appendChild(leftPane);
  workspace.appendChild(leftResizer);
  workspace.appendChild(viewportPassthrough);
  workspace.appendChild(rightResizer);
  workspace.appendChild(rightPane);
  workspace.appendChild(bottomPanel);

  root.appendChild(menubar);
  root.appendChild(workspace);
  root.appendChild(statusbar);
  root.appendChild(modal);

  // Custom outliner context menu
  const ctxMenu = createEl('div', 'ed-contextmenu');
  ctxMenu.style.display = 'none';
  root.appendChild(ctxMenu);

  function closeContextMenu() {
    ctxMenu.style.display = 'none';
    ctxMenu.innerHTML = '';
  }

  function openContextMenu({ x, y, items }) {
    ctxMenu.innerHTML = '';
    items.forEach((it) => {
      if (it === 'separator') {
        ctxMenu.appendChild(createEl('div', 'ed-contextmenu-sep'));
        return;
      }
      const row = createEl('button', 'ed-contextmenu-item');
      row.type = 'button';
      const left = createEl('div', 'ed-contextmenu-label', it.label);
      row.appendChild(left);
      if (it.shortcut) {
        const right = createEl('div', 'ed-contextmenu-hotkey', it.shortcut);
        row.appendChild(right);
      }
      row.addEventListener('click', () => {
        closeContextMenu();
        it.onClick?.();
      });
      ctxMenu.appendChild(row);
    });

    ctxMenu.style.display = 'block';
    ctxMenu.style.left = `${x}px`;
    ctxMenu.style.top = `${y}px`;

    // Clamp into viewport after layout.
    requestAnimationFrame(() => {
      const rect = ctxMenu.getBoundingClientRect();
      const pad = 8;
      let nx = x;
      let ny = y;
      if (rect.right > window.innerWidth - pad) nx = Math.max(pad, window.innerWidth - pad - rect.width);
      if (rect.bottom > window.innerHeight - pad) ny = Math.max(pad, window.innerHeight - pad - rect.height);
      ctxMenu.style.left = `${nx}px`;
      ctxMenu.style.top = `${ny}px`;
    });
  }

  container.appendChild(root);

  function applyLayout() {
    const bottomInset = 10 + bottomPanelHeight + bottomPanelGap;
    leftPane.style.width = `${layout.leftWidth}px`;
    rightPane.style.width = `${layout.rightWidth}px`;
    leftPane.style.bottom = `${bottomInset}px`;
    rightPane.style.bottom = `${bottomInset}px`;
    leftResizer.style.bottom = `${bottomInset}px`;
    rightResizer.style.bottom = `${bottomInset}px`;
    // Resizers are positioned relative to 10px insets.
    leftResizer.style.left = `${10 + layout.leftWidth}px`;
    rightResizer.style.right = `${10 + layout.rightWidth}px`;
  }

  applyLayout();

  // Close menus on outside click / escape
  const onDocPointerDown = (e) => {
    // Close context menu when clicking outside.
    if (ctxMenu.style.display !== 'none' && !e.target.closest?.('.ed-contextmenu')) {
      closeContextMenu();
    }
    // if clicking inside menubar menu/popup, keep open.
    if (e.target.closest?.('.ed-menubar-menu')) return;
    document.querySelectorAll('.ed-menubar-menu.is-open').forEach((m) => {
      m.classList.remove('is-open');
      const p = m.querySelector('.ed-menubar-pop');
      if (p) p.style.display = 'none';
    });
  };

  const onDocKeyDown = (e) => {
    if (e.code === 'Escape') {
      closeContextMenu();
    }
    if (e.code === 'Escape') {
      document.querySelectorAll('.ed-menubar-menu.is-open').forEach((m) => {
        m.classList.remove('is-open');
        const p = m.querySelector('.ed-menubar-pop');
        if (p) p.style.display = 'none';
      });
    }
  };

  window.addEventListener('pointerdown', onDocPointerDown);
  window.addEventListener('keydown', onDocKeyDown);

  // Resizers
  function attachResizer(resizerEl, side) {
    let startX = 0;
    let startWidth = 0;

    const onDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startWidth = side === 'left' ? leftPane.getBoundingClientRect().width : rightPane.getBoundingClientRect().width;
      document.body.classList.add('ed-resizing');
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    const onMove = (e) => {
      const dx = e.clientX - startX;
      if (side === 'left') {
        const w = clamp(startWidth + dx, 180, 520);
        layout.leftWidth = w;
      } else {
        const w = clamp(startWidth - dx, 260, 660);
        layout.rightWidth = w;
      }
      applyLayout();
      writeLayout(layout);
    };

    const onUp = () => {
      document.body.classList.remove('ed-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    resizerEl.addEventListener('pointerdown', onDown);
    return () => resizerEl.removeEventListener('pointerdown', onDown);
  }

  const detachLeftResizer = attachResizer(leftResizer, 'left');
  const detachRightResizer = attachResizer(rightResizer, 'right');

  function setSelectionInfo({ count, label }) {
    selectionInfo.textContent = count > 0 ? `${count} selected${label ? ` • ${label}` : ''}` : 'No selection';
  }

  function setStatusRight(text) {
    statusRight.textContent = text;
  }

  function renderOutliner({ pieces, selection, primaryIndex, markers, selectedMarker }) {
    outliner.innerHTML = '';
    const list = createEl('div', 'ed-outliner-list');

    // Markers (collapsible)
    const m = markers || {};
    const start = Array.isArray(m.start) ? m.start : [];
    const checkpoints = Array.isArray(m.checkpoints) ? m.checkpoints : [];
    const items = Array.isArray(m.items) ? m.items : [];

    const hasAnyMarkers = start.length > 0 || checkpoints.length > 0 || items.length > 0;
    if (hasAnyMarkers) {
      const wrap = document.createElement('details');
      wrap.className = 'ed-outliner-group';
      wrap.open = true;

      const summary = document.createElement('summary');
      summary.className = 'ed-outliner-group-title';
      summary.textContent = `Markers (${start.length + checkpoints.length + items.length})`;
      wrap.appendChild(summary);

      const addHeader = (text) => {
        const h = createEl('div', 'ed-outliner-section', text);
        wrap.appendChild(h);
      };

      const addMarkerRow = ({ label, markerType, index }) => {
        const row = createEl('button', 'ed-outliner-row');
        row.type = 'button';
        const isSel = !!selectedMarker && selectedMarker.type === markerType && selectedMarker.index === index;
        row.classList.toggle('is-selected', isSel);
        row.classList.toggle('is-primary', isSel);
        row.textContent = label;
        row.addEventListener('click', () => {
          onOutlinerSelect?.({ kind: 'marker', markerType, index, additive: false });
        });

        row.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onOutlinerSelect?.({ kind: 'marker', markerType, index, additive: false });
          openContextMenu({
            x: e.clientX,
            y: e.clientY,
            items: [
              { label: 'Duplicate', shortcut: 'Ctrl+D', onClick: () => onMenuAction?.('editor.duplicate') },
              { label: 'Copy', shortcut: 'Ctrl+C', onClick: () => onMenuAction?.('editor.copy') },
              { label: 'Paste', shortcut: 'Ctrl+V', onClick: () => onMenuAction?.('editor.paste') },
              'separator',
              { label: 'Focus', shortcut: 'C', onClick: () => onMenuAction?.('editor.focus') },
              { label: 'Delete', shortcut: 'Del', onClick: () => onMenuAction?.('editor.delete') },
            ]
          });
        });

        wrap.appendChild(row);
      };

      if (start.length > 0) {
        addHeader('Start');
        start.forEach((_, idx) => addMarkerRow({ label: `Start ${idx}`, markerType: 'start', index: idx }));
      }
      if (checkpoints.length > 0) {
        addHeader('Checkpoints');
        checkpoints.forEach((_, idx) => addMarkerRow({ label: `Checkpoint ${idx}`, markerType: 'checkpoints', index: idx }));
      }
      if (items.length > 0) {
        addHeader('Items');
        items.forEach((_, idx) => addMarkerRow({ label: `Item ${idx}`, markerType: 'items', index: idx }));
      }

      list.appendChild(wrap);
    }

    pieces.forEach((p, idx) => {
      const row = createEl('button', 'ed-outliner-row');
      row.type = 'button';
      const isSel = selection?.has?.(idx);
      const isPrimary = primaryIndex === idx;
      row.classList.toggle('is-selected', !!isSel);
      row.classList.toggle('is-primary', !!isPrimary);

      const name = `${idx}`.padStart(3, '0');
      const kind = p?.kind || 'piece';
      const mat = typeof p?.material === 'string' ? p.material : '';
      const labelName = (typeof p?.name === 'string' && p.name.trim().length > 0) ? p.name.trim() : '<unnamed>';
      row.textContent = `${name}  ${labelName}  ${kind}${mat ? `  [${mat}]` : ''}`;

      row.addEventListener('click', (e) => {
        const additive = !!e.shiftKey;
        onOutlinerSelect?.({ kind: 'piece', index: idx, additive });
      });

      // Rename pieces only (markers intentionally not renameable).
      row.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onOutlinerSelect?.({ kind: 'piece', index: idx, additive: false });
        onMenuAction?.('editor.rename');
      });

      row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onOutlinerSelect?.({ kind: 'piece', index: idx, additive: false });
        openContextMenu({
          x: e.clientX,
          y: e.clientY,
          items: [
            { label: 'Rename', shortcut: 'F2', onClick: () => onMenuAction?.('editor.rename') },
            { label: 'Duplicate', shortcut: 'Ctrl+D', onClick: () => onMenuAction?.('editor.duplicate') },
            { label: 'Copy', shortcut: 'Ctrl+C', onClick: () => onMenuAction?.('editor.copy') },
            { label: 'Paste', shortcut: 'Ctrl+V', onClick: () => onMenuAction?.('editor.paste') },
            'separator',
            { label: 'Focus', shortcut: 'C', onClick: () => onMenuAction?.('editor.focus') },
            { label: 'Delete', shortcut: 'Del', onClick: () => onMenuAction?.('editor.delete') },
          ]
        });
      });

      list.appendChild(row);
    });

    outliner.appendChild(list);
  }

  function resetLayout() {
    layout.leftWidth = 260;
    layout.rightWidth = 420;
    applyLayout();
    writeLayout(layout);
  }

  function setPaused(paused) {
    const open = !!paused;
    if (open) {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
      try { modal.inert = false; } catch { /* ignore */ }
      // Ensure the opacity transition can play.
      requestAnimationFrame(() => {
        modal.classList.add('is-open');
      });
      return;
    }

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    try { modal.inert = true; } catch { /* ignore */ }

    // Hide after fade-out to guarantee no hover/click while closed.
    setTimeout(() => {
      if (!modal.classList.contains('is-open')) {
        modal.style.display = 'none';
      }
    }, 140);
  }

  function isPaused() {
    return modal.classList.contains('is-open');
  }

  function dispose() {
    detachLeftResizer();
    detachRightResizer();
    window.removeEventListener('pointerdown', onDocPointerDown);
    window.removeEventListener('keydown', onDocKeyDown);
    if (root.parentElement) root.parentElement.removeChild(root);
  }

  return {
    root,
    rightContent,
    bottomContent,
    setSelectionInfo,
    setStatusRight,
    renderOutliner,
    resetLayout,
    setPaused,
    isPaused,
    dispose
  };
}
