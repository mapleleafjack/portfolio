import * as THREE from 'three';

/**
 * ZoomTransition — smooth camera zoom-in/zoom-out transitions for torus explore mode.
 *
 * Manages:
 *  - Zoom-in: capture approach direction → lerp camera toward torus
 *  - Zoom-out: capture exit state → lerp camera back to default galaxy view
 *  - OrbitControls handoff (enable when zoom-in completes)
 *
 * Pure state manager — no Three.js objects owned, no DOM access.
 */
export default class ZoomTransition {
  /**
   * @param {THREE.Vector3} defaultPos — default camera position (galaxy view)
   * @param {THREE.Vector3} defaultLook — default lookAt target
   */
  constructor(defaultPos = new THREE.Vector3(0, 0, 5), defaultLook = new THREE.Vector3(0, 0, 0)) {
    this._defaultPos = defaultPos.clone();
    this._defaultLook = defaultLook.clone();

    // Smooth lookAt target (lerped each frame)
    this.smoothLookTarget = new THREE.Vector3(0, 0, 0);

    // ── Zoom-in state ──
    this._transitionElapsed = 0;
    this._zoomStartDist = 7.5;
    this._approachDir = new THREE.Vector3();

    // ── Zoom-out state ──
    this._hasEverEnteredExplore = false;
    this._exitTransitionElapsed = 0;
    this._exitStartCam = new THREE.Vector3();
    this._exitStartLook = new THREE.Vector3();
  }

  /** Whether the user has ever entered explore mode (controls initial view behavior). */
  get hasEverEnteredExplore() { return this._hasEverEnteredExplore; }

  /**
   * Begin zoom-in transition toward a torus.
   * @param {THREE.Vector3} cameraPos — current camera world position
   * @param {THREE.Vector3} torusWorldPos — torus world position
   */
  startZoomIn(cameraPos, torusWorldPos) {
    this._transitionElapsed = 0;
    this._hasEverEnteredExplore = true;
    this._zoomStartDist = cameraPos.distanceTo(torusWorldPos);
    this._approachDir.copy(cameraPos).sub(torusWorldPos).normalize();

    // Clamp vertical approach to avoid extreme angles
    const maxVert = 0.85;
    if (Math.abs(this._approachDir.y) > maxVert) {
      this._approachDir.y = Math.sign(this._approachDir.y) * maxVert;
      this._approachDir.normalize();
    }
  }

  /**
   * Begin zoom-out transition back to galaxy view.
   * @param {THREE.Vector3} cameraPos — current camera world position
   * @param {THREE.Vector3} lookTarget — current smooth lookAt target
   */
  startZoomOut(cameraPos, lookTarget) {
    this._exitTransitionElapsed = 0;
    this._exitStartCam.copy(cameraPos);
    this._exitStartLook.copy(lookTarget);
  }

  /**
   * Per-frame update for zoom-in transition.
   * @param {number} dt — delta time in seconds
   * @param {THREE.Vector3} torusWorldPos — torus world position
   * @param {THREE.Camera} camera — camera to move
   * @returns {boolean} true when transition completes and OrbitControls should be enabled
   */
  updateZoomIn(dt, torusWorldPos, camera) {
    this._transitionElapsed += dt;
    const endDist = 4.5;
    const duration = 0.85;
    const raw = Math.min(this._transitionElapsed / duration, 1.0);
    const eased = easeInOutCubic(raw);
    const dist = this._zoomStartDist + (endDist - this._zoomStartDist) * eased;

    const targetCam = torusWorldPos.clone().addScaledVector(this._approachDir, dist);
    camera.position.copy(targetCam);
    camera.lookAt(this.smoothLookTarget);

    return raw >= 1.0;
  }

  /**
   * Per-frame update for zoom-out transition.
   * @param {number} dt — delta time in seconds
   * @param {THREE.Camera} camera — camera to move
   * @returns {boolean} true when transition is still active (false when done)
   */
  updateZoomOut(dt, camera) {
    if (!this._hasEverEnteredExplore) {
      // Initial load — snap directly
      camera.position.copy(this._defaultPos);
      camera.lookAt(this._defaultLook);
      return false;
    }

    this._exitTransitionElapsed += dt;
    const exitDuration = 0.7;
    const raw = Math.min(this._exitTransitionElapsed / exitDuration, 1.0);
    const eased = easeInOutCubic(raw);

    camera.position.lerpVectors(this._exitStartCam, this._defaultPos, eased);
    this.smoothLookTarget.lerpVectors(this._exitStartLook, this._defaultLook, eased);
    camera.lookAt(this.smoothLookTarget);

    return raw < 1.0; // true = still transitioning
  }
}

// ── Shared easing ─────────────────────────────────────

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
