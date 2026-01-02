function isTextInputFocused() {
  const el = document.activeElement;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function normCombo(e) {
  const ctrl = !!(e.ctrlKey || e.metaKey);
  const shift = !!e.shiftKey;
  const alt = !!e.altKey;

  // Prefer code for letter keys (KeyG) to avoid layout issues.
  let key = e.code || e.key;

  // Normalize common variants
  if (key === 'KeyZ' && ctrl && shift) return 'Ctrl+Shift+KeyZ';

  const parts = [];
  if (ctrl) parts.push('Ctrl');
  if (shift) parts.push('Shift');
  if (alt) parts.push('Alt');
  parts.push(key);
  return parts.join('+');
}

export function createEditorKeymap({ runCommand }) {
  const bindings = new Map([
    ['Ctrl+KeyS', 'editor.save'],

    ['Ctrl+KeyZ', 'editor.undo'],
    ['Ctrl+Shift+KeyZ', 'editor.redo'],
    ['Ctrl+KeyY', 'editor.redo'],

    ['Ctrl+KeyD', 'editor.duplicate'],
    ['Ctrl+KeyC', 'editor.copy'],
    ['Ctrl+KeyV', 'editor.paste'],
    ['Delete', 'editor.delete'],
    ['Backspace', 'editor.delete'],

    ['KeyG', 'editor.mode.translate'],
    ['KeyR', 'editor.mode.rotate'],
    ['KeyF', 'editor.mode.scale'],

    ['KeyC', 'editor.focus'],
    ['KeyV', 'editor.toggleSnap'],

    ['Enter', 'editor.deselect'],

    ['F2', 'editor.rename'],

    ['Escape', 'editor.pause.toggle'],
  ]);

  function handleKeydown(e) {
    if (isTextInputFocused()) return false;

    const combo = normCombo(e);
    const id = bindings.get(combo);
    if (!id) return false;

    e.preventDefault();
    e.stopPropagation();
    runCommand?.(id);
    return true;
  }

  return { handleKeydown };
}
