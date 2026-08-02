import * as THREE from 'three';

const ORBIT_RADIUS = 3.8;
const ORBIT_PERIOD = 32;
const ORBIT_Y_AMP = 0.6;
const ORBIT_Y_PERIOD = 18;

/**
 * Manages the orbital preview torus knot that appears in the 3D background.
 * It can be rebuilt when the user changes parameters in the TorusExplorer,
 * and supports hover detection with visual feedback.
 *
 * Follows the same vanilla-JS-class pattern as GalaxyEffect / FlyingSaucer.
 */
export default class PreviewTorus {
  /**
   * @param {THREE.Group} parentGroup — sceneGroup to add the torus to
   * @param {object} [params] — initial torus parameters
   * @param {number} [params.p=2]
   * @param {number} [params.q=3]
   * @param {number} [params.radius=2.5]
   * @param {number} [params.tube=0.7]
   * @param {string} [params.color='#9944dd']
   */
  constructor(parentGroup, params = {}) {
    this.parentGroup = parentGroup;
    this.group = new THREE.Group();
    parentGroup.add(this.group);

    this.mesh = null;
    this.wire = null;
    this.glow = null;
    this.light = null;

    // Current hover state
    this._hovered = false;

    this.rebuild(params);
  }

  /**
   * Dispose old geometry and rebuild the torus knot with new parameters.
   * @param {object} params
   */
  rebuild(params = {}) {
    const p = params.p ?? 2;
    const q = params.q ?? 3;
    const r = params.radius ?? 2.5;
    const tube = params.tube ?? 0.7;
    const color = params.color ?? '#9944dd';

    // Dispose old
    if (this.mesh) { this.group.remove(this.mesh); this.mesh.geometry?.dispose(); this.mesh.material?.dispose(); }
    if (this.wire) { this.group.remove(this.wire); this.wire.geometry?.dispose(); this.wire.material?.dispose(); }
    if (this.glow) { this.group.remove(this.glow); this.glow.geometry?.dispose(); this.glow.material?.dispose(); }

    const scale = 0.18;

    // Main torus knot mesh
    const geo = new THREE.TorusKnotGeometry(r * scale, tube * scale, 80, 16, Math.round(p), Math.round(q));
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.7,
      metalness: 0.2,
      roughness: 0.45,
      transparent: true,
      opacity: 0.75,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.userData.isPreviewTorus = true;
    this.group.add(this.mesh);

    // Wireframe overlay
    const wGeo = new THREE.TorusKnotGeometry(r * scale * 1.06, tube * scale * 1.06, 40, 10, Math.round(p), Math.round(q));
    const wMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(1.5),
      wireframe: true,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    this.wire = new THREE.Mesh(wGeo, wMat);
    this.group.add(this.wire);

    // Glow sphere
    const glowGeo = new THREE.SphereGeometry(r * scale * 1.35, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.group.add(this.glow);

    // Point light
    if (this.light) this.group.remove(this.light);
    this.light = new THREE.PointLight(color, 1.5, 4);
    this.group.add(this.light);

    this._colorHex = color;
  }

  /**
   * Returns the meshes that should participate in raycaster intersection tests.
   * Caller merges these with its own targets (e.g. cubes).
   * @returns {THREE.Object3D[]}
   */
  getRayTargets() {
    const targets = [];
    if (this.mesh && this.mesh.visible) targets.push(this.mesh);
    if (this.wire && this.wire.visible) targets.push(this.wire);
    return targets;
  }

  /**
   * Check whether a raycast hit object belongs to this torus.
   * @param {THREE.Object3D|null} hitObject
   * @returns {boolean}
   */
  isHit(hitObject) {
    if (!hitObject) return false;
    return hitObject.userData.isPreviewTorus === true || hitObject === this.wire;
  }

  /**
   * Apply hover visual feedback.
   * @param {boolean} hovered
   */
  applyHover(hovered) {
    this._hovered = hovered;
    if (this.mesh) {
      this.mesh.material.emissiveIntensity = hovered ? 1.4 : 0.7;
      this.mesh.scale.setScalar(hovered ? 1.15 : 1);
    }
    if (this.glow) {
      this.glow.material.opacity = hovered ? 0.25 : 0.12;
    }
    if (this.light) {
      this.light.intensity = hovered ? 3 : 1.5;
    }
    if (hovered) {
      document.body.style.cursor = 'pointer';
    }
  }

  /** Whether the torus is currently being hovered. */
  get hovered() {
    return this._hovered;
  }

  /**
   * Per-frame update: orbital motion and self-rotation.
   * @param {number} t — elapsed time in seconds
   * @param {number} dt — delta time in seconds
   */
  update(t, dt) {
    const orbitAngle = (t / ORBIT_PERIOD) * Math.PI * 2;
    const orbitX = Math.cos(orbitAngle) * ORBIT_RADIUS;
    const orbitZ = Math.sin(orbitAngle) * ORBIT_RADIUS;
    const orbitY = Math.sin((t / ORBIT_Y_PERIOD) * Math.PI * 2) * ORBIT_Y_AMP;
    this.group.position.set(orbitX, orbitY, orbitZ);
    this.group.rotation.y += dt * 0.25;
    this.group.rotation.x += dt * 0.12;
  }

  /** Full cleanup of all geometries, materials, and lights. */
  dispose() {
    if (this.mesh) { this.group.remove(this.mesh); this.mesh.geometry?.dispose(); this.mesh.material?.dispose(); }
    if (this.wire) { this.group.remove(this.wire); this.wire.geometry?.dispose(); this.wire.material?.dispose(); }
    if (this.glow) { this.group.remove(this.glow); this.glow.geometry?.dispose(); this.glow.material?.dispose(); }
    if (this.light) this.group.remove(this.light);
    this.parentGroup.remove(this.group);
  }
}
