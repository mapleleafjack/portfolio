/**
 * HoverManager — raycaster-based hover detection across cubes, torus, and saucer.
 *
 * Handles:
 *  - Shared raycaster hit-testing across all scene objects
 *  - Hover glow application on torus (preview mode only)
 *  - Hover glow application on flying saucer (preview mode only)
 *  - Cursor style management (pointer, grabbing, default)
 *
 * Does NOT own the raycaster (shared, created by orchestrator).
 */
export default class HoverManager {
  /**
   * @param {THREE.Raycaster} raycaster — shared raycaster
   * @param {import('./CubeField').default} cubeField
   * @param {import('./TorusKnot').default} torusKnot
   * @param {import('./FlyingSaucer').default} saucer
   */
  constructor(raycaster, cubeField, torusKnot, saucer) {
    this._raycaster = raycaster;
    this._cubeField = cubeField;
    this._torusKnot = torusKnot;
    this._saucer = saucer;
  }

  /**
   * Run hover detection for the current frame.
   * @param {THREE.Vector2} pointer — NDC pointer position from SceneCamera
   * @param {THREE.Camera} camera
   * @param {boolean} isFocused — whether torus explore mode is active
   * @param {boolean} isMarkerDragging — whether a marker drag is in progress
   * @param {boolean} isCockpitActive — whether cockpit mode is active
   * @returns {{ hoveredCube: THREE.Object3D|null, hitTorus: boolean, hitSaucer: boolean }}
   */
  update(pointer, camera, isFocused, isMarkerDragging, isCockpitActive) {
    this._raycaster.setFromCamera(pointer, camera);
    const visibleCubes = this._cubeField.getVisibleCubes();
    const saucerTargets = this._saucer.getRayTargets();
    const rayTargets = [...visibleCubes, ...this._torusKnot.getRayTargets(), ...saucerTargets];
    const intersects = this._raycaster.intersectObjects(rayTargets);
    const firstHit = intersects.length > 0 ? intersects[0].object : null;

    const hitTorus = this._torusKnot.isHit(firstHit);
    const hitSaucer = firstHit && firstHit.userData && firstHit.userData.isSaucer;
    const hoveredCube = !hitTorus && !hitSaucer && firstHit ? firstHit : null;

    // Apply torus hover effect (preview mode only)
    this._torusKnot.applyHover(hitTorus && !isFocused);

    // Apply saucer hover glow effect (preview mode only, not in cockpit)
    this._saucer.applyHover(hitSaucer && !isFocused && !isCockpitActive);

    // Cursor management
    if (isMarkerDragging) {
      document.body.style.cursor = 'grabbing';
    } else if (hitSaucer && !isFocused && !isCockpitActive) {
      document.body.style.cursor = 'pointer';
    } else if (!hitTorus && !hoveredCube) {
      document.body.style.cursor = '';
    }

    return { hoveredCube, hitTorus, hitSaucer };
  }
}
