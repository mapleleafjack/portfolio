// ──────────────────────────────────────────────────────────
// TorusKnotParticles — particle system for the torus knot.
// Manages poloidal (blue, around tube) and toroidal (orange,
// along knot) particles rendered as THREE.Points.
// ──────────────────────────────────────────────────────────

import * as THREE from 'three';

export default class TorusKnotParticles {
  /**
   * @param {THREE.Group} parentGroup — group to add particles to
   * @param {Function} getState — () => current state snapshot
   * @param {Function} getFrame — (u: number) => { point, normal, binormal } | null
   * @param {number} [maxParticles=1600]
   */
  constructor(parentGroup, getState, getFrame, maxParticles = 1600) {
    this._parentGroup = parentGroup;
    this._getState = getState;
    this._getFrame = getFrame;
    this._MAX = maxParticles;

    /** @type {Array<{type:string, baseU?:number, angle?:number, offsetAngle?:number, phase:number, color:number[]}>} */
    this._data = [];

    // Created in buildSystem()
    this._points = null;
    this._material = null;
    this._positions = null;
    this._colors = null;
    this._texture = null;
  }

  // ═══════════════════════════════════════════════════════
  //  BUILD
  // ═══════════════════════════════════════════════════════

  /** Create the THREE.Points mesh and add to parent group. */
  buildSystem() {
    const geo = new THREE.BufferGeometry();
    this._positions = new Float32Array(this._MAX * 3);
    this._colors = new Float32Array(this._MAX * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this._positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this._colors, 3));

    this._texture = _createGlowTexture('#ffffff', 64);
    this._material = new THREE.PointsMaterial({
      size: 0.12, map: this._texture, vertexColors: true,
      blending: THREE.NormalBlending, depthWrite: false,
      transparent: true, opacity: 0,
    });
    this._points = new THREE.Points(geo, this._material);
    this._parentGroup.add(this._points);
  }

  /** Populate particle data from current state. */
  buildData() {
    this._data = [];
    const count = this._getState().fieldLineCount;

    // Poloidal particles (blue)
    const nRings = count;
    const ppRing = 22;
    for (let i = 0; i < nRings; i++) {
      for (let j = 0; j < ppRing; j++) {
        this._data.push({
          type: 'poloidal',
          baseU: i / nRings,
          angle: (j / ppRing) * Math.PI * 2,
          phase: Math.random(),
          color: [0.15, 0.45, 0.85],
        });
      }
    }

    // Toroidal particles (orange)
    const nTor = Math.floor(count * 0.6);
    const ppTor = 30;
    for (let i = 0; i < nTor; i++) {
      const off = (i / nTor) * Math.PI * 2;
      for (let j = 0; j < ppTor; j++) {
        this._data.push({
          type: 'toroidal',
          offsetAngle: off,
          phase: j / ppTor,
          color: [0.9, 0.35, 0.1],
        });
      }
    }

    if (this._data.length > this._MAX) {
      this._data.length = this._MAX;
    }
  }

  // ═══════════════════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════════════════

  /**
   * Update particle positions and colors for the current frame.
   * Uses pre-allocated vectors and caches getFrame results to avoid GC storms.
   * @param {number} time — elapsed time in seconds
   */
  update(time) {
    const state = this._getState();
    const pdLen = this._data.length;
    const pPos = this._positions;
    const pCol = this._colors;

    if (!state.showFieldLines || pdLen === 0) {
      // Zero out buffer once and return — visibility is managed by setGroupVisible()
      for (let i = 0; i < this._MAX; i++) {
        pPos[i * 3] = pPos[i * 3 + 1] = pPos[i * 3 + 2] = 0;
        pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0;
      }
      if (this._points) {
        this._points.geometry.attributes.position.needsUpdate = true;
        this._points.geometry.attributes.color.needsUpdate = true;
      }
      return;
    }

    const spd = state.particleSpeed;
    const tube = state.tube;

    // ── Pre-allocate reusable working vectors (avoid GC) ──
    if (!this._wPos) {
      this._wPos = new THREE.Vector3();
    }

    const wPos = this._wPos;
    const poloidalUStrings = new Set();
    for (let i = 0; i < pdLen; i++) {
      if (this._data[i].type === 'poloidal') {
        poloidalUStrings.add(this._data[i].baseU.toFixed(6));
      }
    }
    const poloidalFrameCache = {};
    for (const uStr of poloidalUStrings) {
      const u = parseFloat(uStr);
      const f = this._getFrame(u);
      if (f) {
        poloidalFrameCache[uStr] = { point: f.point, normal: f.normal, binormal: f.binormal };
      }
    }

    for (let i = 0; i < pdLen; i++) {
      const pd = this._data[i];
      pd.phase += spd * 0.003;
      if (pd.phase > 1) pd.phase -= 1;

      let rr, f;
      if (pd.type === 'poloidal') {
        f = poloidalFrameCache[pd.baseU.toFixed(6)];
        rr = tube * 0.78;
        const a = pd.angle + pd.phase * Math.PI * 2;
        const cosA = Math.cos(a), sinA = Math.sin(a);
        if (f) {
          // Use pre-allocated vectors + set/addScaledVector (zero allocation)
          wPos.copy(f.point)
            .addScaledVector(f.normal, rr * cosA)
            .addScaledVector(f.binormal, rr * sinA);
        } else {
          wPos.set(0, 0, 0);
        }
      } else {
        // Toroidal: phase varies per particle, so getFrame per-particle (no caching)
        f = this._getFrame(pd.phase);
        rr = tube * 0.42;
        const cosOff = Math.cos(pd.offsetAngle);
        const sinOff = Math.sin(pd.offsetAngle);
        if (f) {
          wPos.copy(f.point)
            .addScaledVector(f.normal, rr * cosOff)
            .addScaledVector(f.binormal, rr * sinOff);
        } else {
          wPos.set(0, 0, 0);
        }
      }

      pPos[i * 3] = wPos.x; pPos[i * 3 + 1] = wPos.y; pPos[i * 3 + 2] = wPos.z;
      pCol[i * 3] = pd.color[0]; pCol[i * 3 + 1] = pd.color[1]; pCol[i * 3 + 2] = pd.color[2];
    }
    for (let i = pdLen; i < this._MAX; i++) {
      pPos[i * 3] = pPos[i * 3 + 1] = pPos[i * 3 + 2] = 0;
      pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0;
    }
    if (this._points) {
      this._points.geometry.attributes.position.needsUpdate = true;
      this._points.geometry.attributes.color.needsUpdate = true;
    }
  }

  // ═══════════════════════════════════════════════════════
  //  VISIBILITY
  // ═══════════════════════════════════════════════════════

  /** Set the material opacity (0 = hidden, 1 = fully visible). */
  setOpacity(value) {
    if (this._material) this._material.opacity = value;
  }

  /**
   * Toggle the entire Points object visibility.
   * Call with false when exiting explore mode to remove particles
   * from the render pipeline entirely (not just opacity 0).
   */
  setGroupVisible(visible) {
    if (this._points) this._points.visible = visible;
  }

  // ═══════════════════════════════════════════════════════
  //  CLEANUP
  // ═══════════════════════════════════════════════════════

  dispose() {
    if (this._points) {
      this._points.geometry?.dispose();
      this._points.material?.dispose();
      this._parentGroup.remove(this._points);
      this._points = null;
    }
    if (this._texture) {
      this._texture.dispose();
      this._texture = null;
    }
    this._material = null;
    this._positions = null;
    this._colors = null;
    this._data = [];
  }
}

// ── Internal helper ─────────────────────────────────────

function _createGlowTexture(colorHex, size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, colorHex);
  g.addColorStop(0.15, colorHex);
  g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
