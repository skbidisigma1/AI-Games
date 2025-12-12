import { buildTrackFromModularSpec } from '../tools/trackElementGenerator.js';

export class ModularTrackBuilder {
  constructor() {
    this.type = 'modular';
  }

  build({ THREE, scene, config, spec }) {
    return buildTrackFromModularSpec({ THREE, scene, config, spec });
  }
}

export default ModularTrackBuilder;
