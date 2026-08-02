import * as THREE from 'three';

const ZOOM_MIN = 2;
const ZOOM_MAX = 12;
const RETURN_DELAY = 2.0; // seconds before user rotation returns to center

/**
 * Manages all user input for the 3D scene: pointer tracking, Cmd/Ctrl+drag
 * rotation, middle-click drag, scroll-wheel zoom, and two-finger touch
 * drag/pinch. Also handles automatic drift and smooth lerp of all rotation
 * and zoom values.
 *
 * Follows the same vanilla-JS-class pattern as GalaxyEffect / FlyingSaucer.
 */
export default class SceneCamera {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {object} [opts]
   * @param {(e: PointerEvent) => void} [opts.onClick] — called on left-click (no modifier)
   */
  constructor(camera, opts = {}) {
    this.camera = camera;
    this._onClick = opts.onClick || null;

    // ── Rotation state ──────────────────────────────
    /** Target rotation (drift + user drag). Written by input handlers. */
    this.sceneRotation = { x: 0, y: 0 };
    /** Current lerped rotation applied to sceneGroup each frame. */
    this.smoothRotation = { x: 0, y: 0 };
    /** User-driven rotation only (no drift). Used by logo. */
    this.userRotation = { x: 0, y: 0 };
    /** Lerped user rotation applied to logo each frame. */
    this.smoothUserRotation = { x: 0, y: 0 };

    // ── Zoom ────────────────────────────────────────
    this.targetZoom = camera.position.z;
    this.ZOOM_MIN = ZOOM_MIN;
    this.ZOOM_MAX = ZOOM_MAX;

    // ── Pointer / drag ──────────────────────────────
    this.pointer = new THREE.Vector2(-999, -999);
    this.isDragging = false;
    this.touchDragging = false;
    this._lastDrag = { x: 0, y: 0 };
    this._lastDragTime = 0;

    // ── Touch state ─────────────────────────────────
    this._lastTouch = { x: 0, y: 0 };
    this._lastSpread = 0;

    // ── Bind handlers (so we can remove them later) ─
    this._handlePointerMove = this._onPointerMove.bind(this);
    this._handlePointerDown = this._onPointerDown.bind(this);
    this._handlePointerUp = this._onPointerUp.bind(this);
    this._handleDragMove = this._onDragMove.bind(this);
    this._handleAuxClick = this._onAuxClick.bind(this);
    this._handleMouseDown = this._onMouseDown.bind(this);
    this._handleWheel = this._onWheel.bind(this);
    this._handleTouchStart = this._onTouchStart.bind(this);
    this._handleTouchMove = this._onTouchMove.bind(this);
    this._handleTouchEnd = this._onTouchEnd.bind(this);

    // ── Attach listeners ────────────────────────────
    window.addEventListener('pointermove', this._handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', this._handlePointerDown);
    window.addEventListener('pointerup', this._handlePointerUp);
    window.addEventListener('pointermove', this._handleDragMove, { passive: true });
    window.addEventListener('auxclick', this._handleAuxClick);
    window.addEventListener('mousedown', this._handleMouseDown);
    window.addEventListener('wheel', this._handleWheel, { passive: false });
    window.addEventListener('touchstart', this._handleTouchStart, { passive: true });
    window.addEventListener('touchmove', this._handleTouchMove, { passive: false });
    window.addEventListener('touchend', this._handleTouchEnd, { passive: true });
  }

  // ── Public helpers ──────────────────────────────────

  /**
   * Returns true if the user is currently interacting (drag or touch-drag).
   * Used to pause auto-drift.
   */
  get isInteracting() {
    return this.isDragging || this.touchDragging;
  }

  /**
   * Enable or disable the automatic scene drift.
   * When disabled, the scene stays put (useful for focused views).
   * @param {boolean} enabled
   */
  setDriftEnabled(enabled) {
    this._driftEnabled = enabled;
  }

  /**
   * Reset all rotation state to center (used when entering focus mode
   * so the torus faces the camera head-on).
   */
  resetRotation() {
    this.sceneRotation.x = 0;
    this.sceneRotation.y = 0;
    this.smoothRotation.x = 0;
    this.smoothRotation.y = 0;
    this.userRotation.x = 0;
    this.userRotation.y = 0;
    this.smoothUserRotation.x = 0;
    this.smoothUserRotation.y = 0;
  }

  // ── Per-frame update ────────────────────────────────

  /**
   * Apply automatic drift, smooth lerp rotations, logo return-to-center,
   * and camera zoom lerp. Call once per animation frame.
   * @param {number} t — elapsed time in seconds
   * @param {number} _dt — delta time (unused currently)
   */
  update(t, _dt) {
    // Gentle automatic drift (pauses while user is dragging)
    if (!this.isDragging && !this.touchDragging && this._driftEnabled !== false) {
      this.sceneRotation.y += 0.0008;
      this.sceneRotation.x += Math.sin(t * 0.15) * 0.00012;
    }

    // Smoothly lerp scene rotation (with damping / inertia feel)
    this.smoothRotation.x += (this.sceneRotation.x - this.smoothRotation.x) * 0.08;
    this.smoothRotation.y += (this.sceneRotation.y - this.smoothRotation.y) * 0.08;

    // Logo follows only user-driven rotation (no auto-drift)
    // Decay back to center after RETURN_DELAY seconds of no input
    const now = performance.now() / 1000;
    if (!this.isDragging && !this.touchDragging && now - this._lastDragTime > RETURN_DELAY) {
      this.userRotation.x += (0 - this.userRotation.x) * 0.03;
      this.userRotation.y += (0 - this.userRotation.y) * 0.03;
    }
    this.smoothUserRotation.x += (this.userRotation.x - this.smoothUserRotation.x) * 0.08;
    this.smoothUserRotation.y += (this.userRotation.y - this.smoothUserRotation.y) * 0.08;

    // Smoothly lerp camera zoom
    this.camera.position.z += (this.targetZoom - this.camera.position.z) * 0.08;
  }

  // ── Cleanup ──────────────────────────────────────────

  dispose() {
    window.removeEventListener('pointermove', this._handlePointerMove);
    window.removeEventListener('pointerdown', this._handlePointerDown);
    window.removeEventListener('pointerup', this._handlePointerUp);
    window.removeEventListener('pointermove', this._handleDragMove);
    window.removeEventListener('auxclick', this._handleAuxClick);
    window.removeEventListener('mousedown', this._handleMouseDown);
    window.removeEventListener('wheel', this._handleWheel);
    window.removeEventListener('touchstart', this._handleTouchStart);
    window.removeEventListener('touchmove', this._handleTouchMove);
    window.removeEventListener('touchend', this._handleTouchEnd);
  }

  // ── Private: input handlers ─────────────────────────

  _onPointerMove(e) {
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  _onPointerDown(e) {
    // Left-click without modifier → fire onClick callback
    if (e.button === 0 && !e.metaKey && !e.ctrlKey) {
      if (this._onClick) this._onClick(e);
    }
    // Cmd/Ctrl + left-click or middle-click → start drag
    if ((e.button === 0 && (e.metaKey || e.ctrlKey)) || e.button === 1) {
      this.isDragging = true;
      this._lastDrag.x = e.clientX;
      this._lastDrag.y = e.clientY;
      e.preventDefault();
    }
  }

  _onPointerUp() {
    this.isDragging = false;
  }

  _onDragMove(e) {
    if (!this.isDragging) return;
    const dx = e.clientX - this._lastDrag.x;
    const dy = e.clientY - this._lastDrag.y;
    this.sceneRotation.y += dx * 0.005;
    this.sceneRotation.x += dy * 0.005;
    this.userRotation.y += dx * 0.005;
    this.userRotation.x += dy * 0.005;
    this._lastDragTime = performance.now() / 1000;
    this._lastDrag.x = e.clientX;
    this._lastDrag.y = e.clientY;
  }

  _onAuxClick(e) {
    if (e.button === 1) e.preventDefault();
  }

  _onMouseDown(e) {
    if (e.button === 1) e.preventDefault();
  }

  _onWheel(e) {
    // Only intercept wheel events on the background — let content scroll normally
    if (this._isInteractiveTarget(e.target)) return;
    e.preventDefault();
    this.targetZoom = Math.max(
      this.ZOOM_MIN,
      Math.min(this.ZOOM_MAX, this.targetZoom + e.deltaY * 0.005)
    );
  }

  _isInteractiveTarget(el) {
    const tag = el.tagName?.toLowerCase();
    if (
      tag === 'a' || tag === 'button' || tag === 'input' ||
      tag === 'select' || tag === 'textarea' || tag === 'video'
    ) {
      return true;
    }
    return el.closest('nav, main, a, button, input, select, textarea, [role="button"]');
  }

  // ── Touch helpers ────────────────────────────────────

  _midpoint(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  _spread(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _onTouchStart(e) {
    if (e.touches.length === 2) {
      this.touchDragging = true;
      const mid = this._midpoint(e.touches);
      this._lastTouch.x = mid.x;
      this._lastTouch.y = mid.y;
      this._lastSpread = this._spread(e.touches);
    }
  }

  _onTouchMove(e) {
    if (!this.touchDragging || e.touches.length !== 2) return;
    const mid = this._midpoint(e.touches);
    const currentSpread = this._spread(e.touches);
    const spreadDelta = Math.abs(currentSpread - this._lastSpread);
    const midDelta = Math.sqrt(
      (mid.x - this._lastTouch.x) ** 2 + (mid.y - this._lastTouch.y) ** 2
    );

    e.preventDefault();

    // Pinch → zoom the camera
    if (spreadDelta > 2) {
      const zoomDelta = (currentSpread - this._lastSpread) * 0.012;
      this.targetZoom = Math.max(
        this.ZOOM_MIN,
        Math.min(this.ZOOM_MAX, this.targetZoom - zoomDelta)
      );
    }

    // Drag → rotate the scene (only when spread is mostly stable)
    if (spreadDelta < midDelta * 0.8) {
      const dxR = (mid.x - this._lastTouch.x) * 0.005;
      const dyR = (mid.y - this._lastTouch.y) * 0.005;
      this.sceneRotation.y += dxR;
      this.sceneRotation.x += dyR;
      this.userRotation.y += dxR;
      this.userRotation.x += dyR;
      this._lastDragTime = performance.now() / 1000;
    }

    this._lastTouch.x = mid.x;
    this._lastTouch.y = mid.y;
    this._lastSpread = currentSpread;
  }

  _onTouchEnd(e) {
    if (e.touches.length < 2) this.touchDragging = false;
  }
}
