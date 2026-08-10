/**
 * HoverManager — raycaster-based hover detection across cubes, torus, saucer, theme toggle, and planets.
 *
 * Handles:
 *  - Shared raycaster hit-testing across all scene objects
 *  - Hover glow application on torus (preview mode only)
 *  - Hover glow application on flying saucer (preview mode only)
 *  - Planet hover detection (for on-hover labels)
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
   * @param {import('./ThemeToggle').default} [themeToggle]
   * @param {import('./PlanetSystem').default} [planetSystem]
   */
  constructor(raycaster, cubeField, torusKnot, saucer, themeToggle = null, planetSystem = null) {
    this._raycaster = raycaster;
    this._cubeField = cubeField;
    this._torusKnot = torusKnot;
    this._saucer = saucer;
    this._themeToggle = themeToggle;
    this._planetSystem = planetSystem;
  }

  /**
   * Run hover detection for the current frame.
   * @param {THREE.Vector2} pointer — NDC pointer position from SceneCamera
   * @param {THREE.Camera} camera
   * @param {boolean} isFocused — whether torus explore mode is active
   * @param {boolean} isMarkerDragging — whether a marker drag is in progress
   * @param {boolean} isCockpitActive — whether cockpit mode is active
   * @returns {{ hoveredCube: THREE.Object3D|null, hitTorus: boolean, hitSaucer: boolean, hitToggle: boolean, hitPlanet: boolean, planetId: string|null }}
   */
  update(pointer, camera, isFocused, isMarkerDragging, isCockpitActive) {
    this._raycaster.setFromCamera(pointer, camera);
    const visibleCubes = this._cubeField.getVisibleCubes();
    const saucerTargets = this._saucer.getRayTargets();
    const toggleTargets = this._themeToggle ? this._themeToggle.getRayTargets() : [];
    const planetTargets = this._planetSystem ? this._planetSystem.getPlanetTargets() : [];
    const rayTargets = [
      ...visibleCubes,
      ...this._torusKnot.getRayTargets(),
      ...saucerTargets,
      ...toggleTargets,
      ...planetTargets,
    ];
    const intersects = this._raycaster.intersectObjects(rayTargets);
    const firstHit = intersects.length > 0 ? intersects[0].object : null;

    const hitTorus = this._torusKnot.isHit(firstHit);
    const hitSaucer = firstHit && firstHit.userData && firstHit.userData.isSaucer;
    const hitToggle = this._themeToggle && toggleTargets.includes(firstHit);
    const hitPlanet = firstHit && firstHit.userData && firstHit.userData.isPlanet;
    const planetId = hitPlanet ? (firstHit.userData.planetId || null) : null;
    const hoveredCube = !hitTorus && !hitSaucer && !hitToggle && !hitPlanet && firstHit ? firstHit : null;

    // Apply torus hover effect (preview mode only)
    this._torusKnot.applyHover(hitTorus && !isFocused);

    // Apply saucer hover glow effect (preview mode only, not in cockpit)
    this._saucer.applyHover(hitSaucer && !isFocused && !isCockpitActive);

    // Apply theme toggle hover glow (preview mode only)
    if (this._themeToggle) {
      this._themeToggle.applyHover(hitToggle && !isFocused && !isCockpitActive);
    }

    // Cursor management
    if (isMarkerDragging) {
      document.body.style.cursor = 'grabbing';
    } else if (hitToggle && !isFocused && !isCockpitActive) {
      document.body.style.cursor = 'pointer';
    } else if (hitSaucer && !isFocused && !isCockpitActive) {
      document.body.style.cursor = 'pointer';
    } else if (hitPlanet && !isFocused && !isCockpitActive) {
      document.body.style.cursor = 'pointer';
    } else if (!hitTorus && !hoveredCube) {
      document.body.style.cursor = '';
    }

    return { hoveredCube, hitTorus, hitSaucer, hitToggle, hitPlanet, planetId };
  }
}
