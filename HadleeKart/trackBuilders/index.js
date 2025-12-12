import { RibbonTrackBuilder } from './ribbonTrackBuilder.js';
import { ModularTrackBuilder } from './modularTrackBuilder.js';

export function createTrackBuilder(type) {
  const t = type || 'ribbon';
  if (t === 'ribbon') return new RibbonTrackBuilder();
  if (t === 'modular') return new ModularTrackBuilder();

  // Placeholder for future modular pieces implementation.
  // Keep API stable so we can swap builders without touching TrackLoader/editor.
  throw new Error(`Unknown track builder type: ${t}`);
}

export default { createTrackBuilder };
