export class FreeFlyControls {
  constructor({ THREE, camera, domElement }) {
    this.THREE = THREE;
    this.camera = camera;
    this.domElement = domElement;

    this.enabled = true;

    this.lookSpeed = 0.0022;
    this.moveSpeed = 45;
    this.fastMultiplier = 4;

    this._keys = Object.create(null);
    this._looking = false;
    this._yaw = 0;
    this._pitch = 0;

    this._tmpForward = new THREE.Vector3();
    this._tmpRight = new THREE.Vector3();
    this._tmpUp = new THREE.Vector3(0, 1, 0);

    this._handlers = {
      keydown: (e) => this._onKey(e, true),
      keyup: (e) => this._onKey(e, false),
      pointerdown: (e) => this._onPointerDown(e),
      pointerup: () => this._onPointerUp(),
      pointermove: (e) => this._onPointerMove(e),
      contextmenu: (e) => this._onContextMenu(e)
    };

    window.addEventListener('keydown', this._handlers.keydown);
    window.addEventListener('keyup', this._handlers.keyup);
    domElement.addEventListener('pointerdown', this._handlers.pointerdown);
    window.addEventListener('pointerup', this._handlers.pointerup);
    window.addEventListener('pointermove', this._handlers.pointermove);
    domElement.addEventListener('contextmenu', this._handlers.contextmenu);

    this._syncFromCamera();
  }

  dispose() {
    window.removeEventListener('keydown', this._handlers.keydown);
    window.removeEventListener('keyup', this._handlers.keyup);
    this.domElement.removeEventListener('pointerdown', this._handlers.pointerdown);
    window.removeEventListener('pointerup', this._handlers.pointerup);
    window.removeEventListener('pointermove', this._handlers.pointermove);
    this.domElement.removeEventListener('contextmenu', this._handlers.contextmenu);
  }

  _syncFromCamera() {
    const euler = new this.THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    this._yaw = euler.y;
    this._pitch = euler.x;
  }

  _onKey(event, down) {
    if (!this.enabled) return;
    this._keys[event.code] = down;
  }

  _onPointerDown(event) {
    if (!this.enabled) return;
    // Right mouse button: look around
    if (event.button === 2) {
      this._looking = true;
    }
  }

  _onPointerUp() {
    this._looking = false;
  }

  _onPointerMove(event) {
    if (!this.enabled) return;
    if (!this._looking) return;

    this._yaw -= event.movementX * this.lookSpeed;
    this._pitch -= event.movementY * this.lookSpeed;
    const maxPitch = Math.PI * 0.49;
    this._pitch = Math.max(-maxPitch, Math.min(maxPitch, this._pitch));

    const euler = new this.THREE.Euler(this._pitch, this._yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  _onContextMenu(event) {
    // Prevent right-click menu so RMB look feels normal
    event.preventDefault();
  }

  update(dt) {
    if (!this.enabled) return;

    const speed = this._keys.ShiftLeft || this._keys.ShiftRight
      ? this.moveSpeed * this.fastMultiplier
      : this.moveSpeed;

    const move = speed * dt;

    // Camera forward/right vectors
    this.camera.getWorldDirection(this._tmpForward);
    this._tmpForward.y = 0;
    if (this._tmpForward.lengthSq() < 1e-6) this._tmpForward.set(0, 0, -1);
    this._tmpForward.normalize();

    this._tmpRight.crossVectors(this._tmpForward, this._tmpUp).normalize();

    // WASD in XZ
    if (this._keys.KeyW) this.camera.position.addScaledVector(this._tmpForward, move);
    if (this._keys.KeyS) this.camera.position.addScaledVector(this._tmpForward, -move);
    if (this._keys.KeyD) this.camera.position.addScaledVector(this._tmpRight, move);
    if (this._keys.KeyA) this.camera.position.addScaledVector(this._tmpRight, -move);

    // QE vertical
    if (this._keys.KeyE) this.camera.position.y += move;
    if (this._keys.KeyQ) this.camera.position.y -= move;

    // Optional: speed fine-tune
    if (this._keys.BracketRight) this.moveSpeed = Math.min(300, this.moveSpeed + 30 * dt);
    if (this._keys.BracketLeft) this.moveSpeed = Math.max(5, this.moveSpeed - 30 * dt);
  }
}

export default FreeFlyControls;
