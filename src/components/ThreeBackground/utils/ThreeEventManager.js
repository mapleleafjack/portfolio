class ThreeEventManager {
  constructor(sceneManager, onPointerMove) {
    this.sceneManager = sceneManager;
    this.onPointerMove = onPointerMove;
    this.isMiddleMouseDown = false;
    this.isModifierDrag = false;
    this.lastDrag = { x: 0, y: 0 };
    this._bindEvents();
  }

  _bindEvents() {
    this.setSize = this.setSize.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    window.addEventListener('resize', this.setSize);
    window.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointermove', this.handlePointerMove);
  }

  setSize() {
    this.sceneManager.setSize(window.innerWidth, window.innerHeight);
  }

  handlePointerDown(e) {
    if (e.button === 1) {
      this.isMiddleMouseDown = true;
      this.lastDrag.x = e.clientX;
      this.lastDrag.y = e.clientY;
      e.preventDefault();
    } else if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
      this.isModifierDrag = true;
      this.lastDrag.x = e.clientX;
      this.lastDrag.y = e.clientY;
      e.preventDefault();
    }
  }

  handlePointerUp(e) {
    if (e.button === 1) {
      this.isMiddleMouseDown = false;
      e.preventDefault();
    }
    if (e.button === 0) {
      this.isModifierDrag = false;
    }
  }

  handlePointerMove(e) {
    if (this.isMiddleMouseDown || this.isModifierDrag) {
      const dx = e.clientX - this.lastDrag.x;
      const dy = e.clientY - this.lastDrag.y;
      this.sceneManager._sceneRotation.y += dx * 0.01;
      this.sceneManager._sceneRotation.x += dy * 0.01;
      this.lastDrag.x = e.clientX;
      this.lastDrag.y = e.clientY;
    }
    if (this.onPointerMove) {
      this.onPointerMove(e);
    }
  }

  dispose() {
    window.removeEventListener('resize', this.setSize);
    window.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointermove', this.handlePointerMove);
  }
}

export default ThreeEventManager;
