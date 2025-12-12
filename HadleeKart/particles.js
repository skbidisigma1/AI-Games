import * as THREEImport from 'three';

class ParticleSystem {
  constructor({ THREE = THREEImport, scene, maxParticles = 1500 } = {}) {
    if (!scene) throw new Error('ParticleSystem requires a scene reference');
    this.THREE = THREE;
    this.scene = scene;
    this.max = maxParticles;
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      vertexColors: false,
      blending: THREE.AdditiveBlending
    });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.max * 3), 3);
    this.mesh.geometry.setAttribute('instanceColor', this.mesh.instanceColor);
    this.instanceAlpha = new THREE.InstancedBufferAttribute(new Float32Array(this.max), 1);
    this.mesh.geometry.setAttribute('instanceAlpha', this.instanceAlpha);
    this.mesh.count = this.max;
    this.mesh.frustumCulled = false;
    this._applyInstanceAlphaShader();
    this.scene.add(this.mesh);
    this.pool = Array.from({ length: this.max }, (_, index) => ({
      index,
      active: false,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      acceleration: new THREE.Vector3(0, -9.5, 0),
      life: 0,
      maxLife: 0,
      size: 0.25,
      startSize: 0.25,
      alpha: 1,
      startAlpha: 1,
      drag: 1,
      fade: true,
      groundY: 0,
      bounce: 0.25,
      friction: 0.6,
      color: new THREE.Color(1, 1, 1),
      rotation: new THREE.Euler(),
      angularVelocity: new THREE.Vector3()
    }));
    this.free = [];
    this._offscreenPos = new THREE.Vector3(0, -9999, 0);
    this._zeroEuler = new THREE.Euler();
    this._tempObj = new THREE.Object3D();
    for (let i = this.max - 1; i >= 0; i -= 1) {
      this.free.push(i);
      this._writeMatrix(i, this._offscreenPos, this._zeroEuler, 0);
      if (this.mesh.instanceColor) {
        this.mesh.instanceColor.setXYZ(i, 1, 1, 1);
      }
      this._writeAlpha(i, 0);
    }
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
    this.instanceAlpha.needsUpdate = true;
    this.active = [];
  }

  spawn(options = {}) {
    if (this.free.length === 0) return null;
    const index = this.free.pop();
    const particle = this.pool[index];
    particle.active = true;
    particle.life = options.lifetime ?? 0.6;
    particle.maxLife = particle.life;
    particle.size = options.size ?? 0.25;
    particle.startSize = particle.size;
    particle.drag = options.drag ?? 1;
    particle.fade = options.fade !== false;
    const alpha = typeof options.alpha === 'number'
      ? this.THREE.MathUtils.clamp(options.alpha, 0, 1)
      : 0.95;
    particle.startAlpha = alpha;
    particle.alpha = alpha;
    const pos = this._ensureVector(options.position);
    particle.position.copy(pos);
    const vel = this._ensureVector(options.velocity);
    particle.velocity.copy(vel);
    const acc = this._ensureVector(options.acceleration);
    if (acc.lengthSq() === 0) {
      particle.acceleration.set(0, -9.5, 0);
    } else {
      particle.acceleration.copy(acc);
    }
    particle.groundY = typeof options.groundY === 'number' ? options.groundY : -Infinity;
    particle.bounce = options.bounce ?? 0.25;
    particle.friction = options.friction ?? 0.75;
    const color = new this.THREE.Color(options.color ?? 0xffffff);
    particle.color.copy(color);
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.setXYZ(particle.index, color.r, color.g, color.b);
      this.mesh.instanceColor.needsUpdate = true;
    }
    this._writeAlpha(index, alpha);
    particle.rotation.set(0, 0, 0);
    particle.angularVelocity.copy(
      options.angularVelocity || new this.THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      )
    );
    this.active.push(index);
    this._writeMatrix(index, particle.position, particle.rotation, particle.size);
    return particle;
  }

  spawnBurst({
    count = 10,
    position,
    positionJitter = 0,
    baseVelocity = new this.THREE.Vector3(),
    velocityJitter = 0,
    color = 0xffffff,
    colorJitter,
    sizeRange = [0.15, 0.3],
    lifetimeRange = [0.25, 0.55],
    acceleration = new this.THREE.Vector3(0, -9.5, 0),
    drag = 1,
    fade = true,
    groundY,
    bounce = 0.3,
    friction = 0.7
  } = {}) {
    const posJitter = this._toVector(positionJitter);
    const velJitter = this._toVector(velocityJitter);
    for (let i = 0; i < count; i += 1) {
      const spawnPos = this._ensureVector(position).clone();
      spawnPos.x += (Math.random() - 0.5) * posJitter.x;
      spawnPos.y += (Math.random() - 0.5) * posJitter.y;
      spawnPos.z += (Math.random() - 0.5) * posJitter.z;
      const vel = this._ensureVector(baseVelocity).clone();
      vel.x += (Math.random() - 0.5) * velJitter.x;
      vel.y += (Math.random() - 0.5) * velJitter.y;
      vel.z += (Math.random() - 0.5) * velJitter.z;
      const lerpColor = colorJitter
        ? new this.THREE.Color(color).lerp(new this.THREE.Color(colorJitter), Math.random())
        : new this.THREE.Color(color);
      const life = this.THREE.MathUtils.lerp(lifetimeRange[0], lifetimeRange[1], Math.random());
      const size = this.THREE.MathUtils.lerp(sizeRange[0], sizeRange[1], Math.random());
      this.spawn({
        position: spawnPos,
        velocity: vel,
        color: lerpColor,
        lifetime: life,
        size,
        acceleration,
        drag,
        fade,
        groundY,
        bounce,
        friction
      });
    }
  }

  update(delta) {
    if (this.active.length === 0) return;
    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      const index = this.active[i];
      const particle = this.pool[index];
      particle.life -= delta;
      if (particle.life <= 0) {
        this._deactivate(index);
        this.active.splice(i, 1);
        continue;
      }
      particle.velocity.addScaledVector(particle.acceleration, delta);
      if (particle.drag !== 1) {
        const dragFactor = Math.max(0, 1 - (1 - particle.drag) * delta);
        particle.velocity.multiplyScalar(dragFactor);
      }
      particle.rotation.x += particle.angularVelocity.x * delta;
      particle.rotation.y += particle.angularVelocity.y * delta;
      particle.rotation.z += particle.angularVelocity.z * delta;
      particle.position.addScaledVector(particle.velocity, delta);
      if (particle.position.y <= particle.groundY) {
        particle.position.y = particle.groundY;
        if (particle.velocity.y < 0) {
          particle.velocity.y *= -particle.bounce;
          particle.velocity.x *= particle.friction;
          particle.velocity.z *= particle.friction;
          if (Math.abs(particle.velocity.y) < 0.3) {
            particle.velocity.y = 0;
          }
        }
      }
      const lifeRatio = particle.life / particle.maxLife;
      const fadeRatio = particle.fade ? lifeRatio : 1;
      const size = Math.max(0.001, particle.startSize * fadeRatio);
      const alpha = particle.fade ? particle.startAlpha * lifeRatio : particle.startAlpha;
      particle.alpha = alpha;
      this._writeMatrix(index, particle.position, particle.rotation, size);
      this._writeAlpha(index, alpha);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  _writeMatrix(index, position, rotation, scaleValue) {
    const dummy = this._tempObj;
    dummy.position.copy(position);
    dummy.rotation.copy(rotation);
    dummy.scale.setScalar(scaleValue);
    dummy.updateMatrix();
    this.mesh.setMatrixAt(index, dummy.matrix);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  _writeAlpha(index, value) {
    const clamped = this.THREE.MathUtils.clamp(value, 0, 1);
    this.instanceAlpha.setX(index, clamped);
    this.instanceAlpha.needsUpdate = true;
  }

  _deactivate(index) {
    const particle = this.pool[index];
    particle.active = false;
    this.free.push(index);
    this._writeMatrix(index, this._offscreenPos, this._zeroEuler, 0);
    this._writeAlpha(index, 0);
  }

  _ensureVector(value) {
    if (!value) return new this.THREE.Vector3();
    if (value.isVector3) return value;
    if (typeof value === 'number') return new this.THREE.Vector3(value, value, value);
    const { x = 0, y = 0, z = 0 } = value;
    return new this.THREE.Vector3(x, y, z);
  }

  _toVector(value) {
    if (value === undefined) return new this.THREE.Vector3(0, 0, 0);
    if (value.isVector3) return value;
    if (typeof value === 'number') return new this.THREE.Vector3(value, value, value);
    return new this.THREE.Vector3(value.x ?? 0, value.y ?? 0, value.z ?? 0);
  }

  _applyInstanceAlphaShader() {
    this.material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <color_pars_vertex>',
        '#include <color_pars_vertex>\nattribute float instanceAlpha;\nvarying float vInstanceAlpha;'
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <color_vertex>',
        '#include <color_vertex>\nvInstanceAlpha = instanceAlpha;'
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_pars_fragment>',
        '#include <color_pars_fragment>\nvarying float vInstanceAlpha;'
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        'vec4 diffuseColor = vec4( diffuse, opacity * vInstanceAlpha );'
      );
    };
  }
}

export { ParticleSystem };
export default ParticleSystem;
