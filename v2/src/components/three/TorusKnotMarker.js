// ──────────────────────────────────────────────────────────
// TorusKnotMarker — draggable marker sphere + cross-section
// disc for exploring the torus knot surface in explore mode.
// ──────────────────────────────────────────────────────────

import * as THREE from 'three';

export default class TorusKnotMarker {
  /**
   * @param {THREE.Group} parentGroup — group to add marker visuals to
   * @param {Function} getState — () => current state snapshot { tube, ... }
   * @param {Function} surfacePointFn — (t, s) => THREE.Vector3
   * @param {Function} surfaceNormalFn — (t, s) => THREE.Vector3
   * @param {Function} getFrameFn — (u: number) => { point, tangent, normal, binormal } | null
   */
  constructor(parentGroup, getState, surfacePointFn, surfaceNormalFn, getFrameFn) {
    this._parentGroup = parentGroup;
    this._getState = getState;
    this._surfacePoint = surfacePointFn;
    this._surfaceNormal = surfaceNormalFn;
    this._getFrame = getFrameFn;

    // Groups
    this.markerGroup = new THREE.Group();
    this.crossSectionGroup = new THREE.Group();

    // Built in build()
    this._markerMesh = null;
    this._haloMesh = null;
    this._arrowGroup = null;

    // Materials (for opacity control)
    this._markerMat = null;
    this._haloMat = null;
    this._arrowMat = null;
    this._crossSectionMats = [];

    // Disc arrow cones
    this._discArrowCones = [];
  }

  // ═══════════════════════════════════════════════════════
  //  BUILD
  // ═══════════════════════════════════════════════════════

  /** Create all marker visuals and add to parent group. */
  build(markerT, markerS) {
    this._parentGroup.add(this.markerGroup);
    this._parentGroup.add(this.crossSectionGroup);

    // Marker sphere
    const markerGeo = new THREE.SphereGeometry(0.1, 16, 16);
    this._markerMat = new THREE.MeshStandardMaterial({
      color: '#ff4477', emissive: '#ff2244', emissiveIntensity: 2.5,
      roughness: 0.2, transparent: true, opacity: 0,
    });
    this._markerMesh = new THREE.Mesh(markerGeo, this._markerMat);
    this.markerGroup.add(this._markerMesh);

    // Marker halo
    const haloGeo = new THREE.SphereGeometry(0.18, 16, 16);
    this._haloMat = new THREE.MeshBasicMaterial({
      color: '#ff6688', transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this._haloMesh = new THREE.Mesh(haloGeo, this._haloMat);
    this._markerMesh.add(this._haloMesh);

    // Normal arrow
    this._arrowGroup = new THREE.Group();
    this.markerGroup.add(this._arrowGroup);
    const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6);
    const headGeo = new THREE.ConeGeometry(0.06, 0.15, 8);
    this._arrowMat = new THREE.MeshStandardMaterial({
      color: '#ffdd44', emissive: '#ffaa00', emissiveIntensity: 0.9,
      roughness: 0.3, transparent: true, opacity: 0,
    });
    const shaft = new THREE.Mesh(shaftGeo, this._arrowMat);
    shaft.position.y = 0.2;
    const head = new THREE.Mesh(headGeo, this._arrowMat);
    head.position.y = 0.47;
    this._arrowGroup.add(shaft, head);

    // Cross-section disc
    this._crossSectionMats = [];
    this._buildCrossSectionDisc();

    this.updateTransform(markerT, markerS);
  }

  _buildCrossSectionDisc() {
    const ringGeoD = new THREE.TorusGeometry(0.62, 0.015, 16, 64);
    const ringMatD = new THREE.MeshStandardMaterial({
      color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.6,
      roughness: 0.3, depthWrite: false, transparent: true, opacity: 0,
    });
    this._crossSectionMats.push({ mat: ringMatD, targetOpacity: 1 });
    this.crossSectionGroup.add(new THREE.Mesh(ringGeoD, ringMatD));

    const discGeo = new THREE.CircleGeometry(0.60, 64);
    const discMat = new THREE.MeshBasicMaterial({
      color: '#5599dd', transparent: true, opacity: 0,
      side: THREE.DoubleSide, depthWrite: false,
    });
    this._crossSectionMats.push({ mat: discMat, targetOpacity: 0.15 });
    this.crossSectionGroup.add(new THREE.Mesh(discGeo, discMat));

    // Concentric rings
    for (let k = 0; k < 3; k++) {
      const r = 0.15 + k * 0.22;
      const cg = new THREE.TorusGeometry(r, 0.006, 8, 48);
      const cm = new THREE.MeshBasicMaterial({
        color: '#aaccff', transparent: true, opacity: 0,
        depthWrite: false,
      });
      this._crossSectionMats.push({ mat: cm, targetOpacity: 0.2 });
      this.crossSectionGroup.add(new THREE.Mesh(cg, cm));
    }

    // Disc arrow cones
    this._discArrowCones = [];
    for (let k = 0; k < 4; k++) {
      const coneGeo = new THREE.ConeGeometry(0.04, 0.10, 6);
      const coneMat = new THREE.MeshStandardMaterial({
        color: '#88ccff', emissive: '#4488cc', emissiveIntensity: 0.7,
        roughness: 0.3, transparent: true, opacity: 0,
      });
      this._crossSectionMats.push({ mat: coneMat, targetOpacity: 1 });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.visible = false;
      this.crossSectionGroup.add(cone);
      this._discArrowCones.push(cone);
    }
  }

  // ═══════════════════════════════════════════════════════
  //  TRANSFORM
  // ═══════════════════════════════════════════════════════

  /**
   * Update marker position, normal arrow, and cross-section disc.
   * @param {number} markerT — t parameter [0, 2π)
   * @param {number} markerS — s parameter [0, 2π)
   */
  updateTransform(markerT, markerS) {
    const pos = this._surfacePoint(markerT, markerS);
    const norm = this._surfaceNormal(markerT, markerS);

    // Store world position/normal for external queries
    this.markerWorldPos = pos.clone();
    this.markerWorldNormal = norm.clone();

    this._markerMesh.position.copy(pos);
    this._arrowGroup.position.copy(pos);
    this._arrowGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);

    const f = this._getFrame(markerT / (Math.PI * 2));
    if (f) {
      this.crossSectionGroup.position.copy(f.point);
      this.crossSectionGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), f.tangent);
      this.crossSectionGroup.visible = true;
      const rr = this._getState().tube * 0.82;
      for (let k = 0; k < 4; k++) {
        const cone = this._discArrowCones[k];
        if (!cone) continue;
        const s = (k / 4) * Math.PI * 2;
        const localX = Math.cos(s) * rr;
        const localY = Math.sin(s) * rr;
        cone.position.set(localX, localY, 0);
        const dir = new THREE.Vector3(-Math.sin(s), Math.cos(s), 0).normalize();
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        cone.visible = true;
      }
    } else {
      this.crossSectionGroup.visible = false;
    }
  }

  // ═══════════════════════════════════════════════════════
  //  CLOSEST PARAMS (for dragging)
  // ═══════════════════════════════════════════════════════

  /**
   * Find the closest (t, s) surface parameters to a world point.
   * @param {THREE.Vector3} worldPt — point in torus local space
   * @returns {{ t: number, s: number }}
   */
  closestParams(worldPt) {
    let best = Infinity, bestT = 0, bestS = 0;
    const nT = 100, nS = 50;
    for (let i = 0; i < nT; i++) {
      const t = (i / nT) * Math.PI * 2;
      for (let j = 0; j < nS; j++) {
        const s = (j / nS) * Math.PI * 2;
        const d = worldPt.distanceToSquared(this._surfacePoint(t, s));
        if (d < best) { best = d; bestT = t; bestS = s; }
      }
    }
    return { t: bestT, s: bestS };
  }

  // ═══════════════════════════════════════════════════════
  //  VISIBILITY
  // ═══════════════════════════════════════════════════════

  /**
   * Set opacity for all marker materials based on mode progress.
   * @param {number} progress — 0 (hidden) to 1 (fully visible)
   */
  setOpacity(progress) {
    if (this._markerMat) this._markerMat.opacity = progress;
    if (this._haloMat) this._haloMat.opacity = 0.3 * progress;
    if (this._arrowMat) this._arrowMat.opacity = progress;
    if (this._crossSectionMats) {
      this._crossSectionMats.forEach(({ mat, targetOpacity }) => {
        mat.opacity = targetOpacity * progress;
      });
    }
  }

  /**
   * Toggle marker group visibility. Called when exiting explore mode
   * to remove marker objects from the render pipeline entirely.
   * @param {boolean} visible
   */
  setGroupVisible(visible) {
    if (this.markerGroup) this.markerGroup.visible = visible;
    if (this.crossSectionGroup) this.crossSectionGroup.visible = visible;
  }

  // ═══════════════════════════════════════════════════════
  //  CLEANUP
  // ═══════════════════════════════════════════════════════

  dispose() {
    const safeD = (obj) => { if (obj && typeof obj.dispose === 'function') obj.dispose(); };

    safeD(this._markerMat);
    safeD(this._haloMat);
    safeD(this._arrowMat);

    // Cross-section
    while (this.crossSectionGroup?.children.length) {
      const c = this.crossSectionGroup.children[0];
      this.crossSectionGroup.remove(c);
      safeD(c.geometry);
      safeD(c.material);
    }

    // Marker group children
    while (this.markerGroup?.children.length) {
      const c = this.markerGroup.children[0];
      this.markerGroup.remove(c);
      safeD(c.geometry);
      safeD(c.material);
    }

    this._parentGroup.remove(this.markerGroup);
    this._parentGroup.remove(this.crossSectionGroup);

    this._discArrowCones = [];
    this._crossSectionMats = [];
  }
}
