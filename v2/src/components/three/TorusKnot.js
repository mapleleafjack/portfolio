// ──────────────────────────────────────────────────────────
// TorusKnot — torus knot explorer integrated into shared scene.
// Two modes: 'preview' (small, orbital, clickable) and
// 'explore' (centered, full detail with field lines & particles).
//
// Delegates to:
//   TorusKnotData   — constants, presets, lattice config
//   TorusKnotMath   — pure knot geometry functions
//   TorusKnotParticles — particle system management
//   TorusKnotMarker    — draggable marker & cross-section disc
// ──────────────────────────────────────────────────────────

import * as THREE from 'three';
import {
  DEFAULT_STATE, PRESETS, LATTICE_LAYERS,
  ORBIT_RADIUS, ORBIT_PERIOD, ORBIT_Y_AMP, ORBIT_Y_PERIOD,
  PREVIEW_SCALE, EXPLORE_SCALE,
} from './TorusKnotData';
import {
  knotCurvePoint, surfacePoint, surfaceNormal,
  sampleKnotFrames, getFrame, computeCurvatureSamples,
} from './TorusKnotMath';
import TorusKnotParticles from './TorusKnotParticles';
import TorusKnotMarker from './TorusKnotMarker';
import { getAccentColor, isDarkMode } from './shared';

export default class TorusKnot {
  /**
   * @param {THREE.Group} parentGroup — the sceneGroup to add the torus to
   * @param {object} [params] — initial torus parameters
   */
  constructor(parentGroup, params = {}) {
    this.parentGroup = parentGroup;
    this.group = new THREE.Group();
    parentGroup.add(this.group);

    // Random orbit phase so the torus appears at a different
    // spot on its orbital path every refresh.
    this._orbitPhaseOffset = Math.random() * Math.PI * 2;
    this.group.position.set(
      Math.cos(this._orbitPhaseOffset) * ORBIT_RADIUS,
      Math.sin(this._orbitPhaseOffset) * ORBIT_Y_AMP,
      Math.sin(this._orbitPhaseOffset) * ORBIT_RADIUS,
    );

    // ── Internal state ──────────────────────────────────
    this._state = { ...DEFAULT_STATE, ...params };
    this._state.morphPresets = DEFAULT_STATE.morphPresets;
    this._activePreset = params.activePreset != null ? params.activePreset : -1;

    // ── Mode & transition ──────────────────────────────
    this._mode = 'preview';        // 'preview' | 'explore'
    /** 0 = preview, 1 = explore — smoothly lerped */
    this._modeProgress = 0;
    this._targetModeProgress = 0;  // 0 or 1

    // ── Marker state ───────────────────────────────────
    this._markerT = 0;
    this._markerS = Math.PI / 2;

    // ── Knot samples (for field lines / frame lookups) ──
    this._knotSamples = [];
    this._knotArcLength = 0;
    this._knotCumLengths = [];
    this._curvatureSamples = [];

    // ── Dragging state ─────────────────────────────────
    this._dragging = false;
    this._hovered = false;

    // ── Lazy explore build ────────────────────────────
    this._exploreBuilt = false;

    // ── Visibility cache (skip redundant _applyModeVisibility) ─
    this._lastVisibilityProgress = -1;

    // ── References for rebuild / disposal ──────────────
    this._torusSolid = null;
    this._torusWireframe = null;

    // ── Sub-systems ────────────────────────────────────
    this._particles = new TorusKnotParticles(
      this.group,
      () => this._state,
      (u) => this._getFrame(u),
    );
    this._marker = new TorusKnotMarker(
      this.group,
      () => this._state,
      (t, s) => this._surfacePoint(t, s),
      (t, s) => this._surfaceNormal(t, s),
      (u) => this._getFrame(u),
    );

    // ── Build everything ──────────────────────────────
    this._buildAll();
  }

  // ═══════════════════════════════════════════════════════
  //  MODE MANAGEMENT
  // ═══════════════════════════════════════════════════════

  /** Switch between 'preview' and 'explore' (triggers smooth transition). */
  setMode(mode) {
    if (mode !== 'preview' && mode !== 'explore') return;
    const wasExplore = this._mode === 'explore';
    this._mode = mode;
    this._targetModeProgress = mode === 'explore' ? 1 : 0;
    // Lazy-build explore geometry on first transition to explore
    if (mode === 'explore' && !wasExplore && !this._exploreBuilt) {
      this._buildExplore();
    }
  }

  /** Current mode string. */
  get mode() {
    return this._mode;
  }

  /** Returns transition progress 0..1 for external camera lerp. */
  get modeProgress() {
    return this._modeProgress;
  }

  // ═══════════════════════════════════════════════════════
  //  BUILD ALL
  // ═══════════════════════════════════════════════════════

  _buildAll() {
    this._buildPreviewBase();
    this._buildExploreLayers();
    // Explore geometry is deferred — built lazily on first setMode('explore').
    // This keeps the preview (galaxy) view fast with only 3 meshes in the scene.
  }

  /**
   * Lazy-build all explore-mode geometry on first transition to explore.
   * Called once; subsequent rebuilds go through rebuild().
   */
  _buildExplore() {
    if (this._exploreBuilt) return;
    this._exploreBuilt = true;

    this._sampleKnot();
    this._computeCurvatureSamples();
    this._rebuildTorusSolid();
    this._rebuildLattice();
    this._rebuildFieldLines();
    this._rebuildDirectionIndicators();
    this._particles.buildSystem();
    this._particles.buildData();
    this._marker.build(this._markerT, this._markerS);
    this._initLighting();
    // Start with everything invisible — update() fades them in via _applyModeVisibility
    this._applyModeVisibility(0);
  }

  // ═══════════════════════════════════════════════════════
  //  PREVIEW BASE (wireframe-only, like cubes)
  // ═══════════════════════════════════════════════════════

  _buildPreviewBase() {
    const { radius, tube } = this._state;
    const accent = getAccentColor();

    // ── Base wireframe colour (grayscale, theme-aware) ──
    const baseGray = new THREE.Color(isDarkMode() ? '#aaaaaa' : '#888888');
    this._previewBaseColor = baseGray.clone();

    // ── Wireframe-only torus knot (no solid fill) ──────────
    // Segments boosted for a smoother polygon look
    const wGeo = new THREE.TorusKnotGeometry(
      radius, tube, 72, 18,
      Math.round(this._state.p), Math.round(this._state.q),
    );
    const wMat = new THREE.MeshBasicMaterial({
      color: baseGray,
      wireframe: true,
      transparent: true,
      opacity: 0.30,
      depthWrite: false,
    });
    this._previewWire = new THREE.Mesh(wGeo, wMat);
    this._previewWireGeo = wGeo;
    this._previewWireMat = wMat;
    this.group.add(this._previewWire);

    // ── Invisible click sphere (raycaster target, larger than torus) ──
    const clickGeo = new THREE.SphereGeometry(radius * 1.5, 16, 16);
    const clickMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    });
    this._clickSphere = new THREE.Mesh(clickGeo, clickMat);
    this._clickSphere.userData.isPreviewTorus = true;
    this._clickSphere.renderOrder = 999;
    this.group.add(this._clickSphere);

    // ── Glow sphere (visible only on hover, accent colour) ──
    const glowGeo = new THREE.SphereGeometry(radius * 1.35, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this._glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this._glowMat = glowMat;
    this.group.add(this._glowMesh);
  }

  // ═══════════════════════════════════════════════════════
  //  EXPLORE LAYERS (groups for lattice, fields, arrows)
  // ═══════════════════════════════════════════════════════

  _buildExploreLayers() {
    // Group for lattice wireframes
    this._latticeGroup = new THREE.Group();
    this.group.add(this._latticeGroup);

    // Group for field lines
    this._fieldGroup = new THREE.Group();
    this.group.add(this._fieldGroup);

    // Group for direction indicator arrows
    this._directionGroup = new THREE.Group();
    this.group.add(this._directionGroup);

    // Torus solid (curvature-colored) — built in _rebuildTorusSolid
    this._exploreSolid = null;

    // Torus wireframe — built in _rebuildTorusSolid
    this._exploreWire = null;

    // Arrow geometry (shared across direction indicators)
    this._arrowGeoDir = new THREE.ConeGeometry(0.05, 0.14, 5);
  }

  // ═══════════════════════════════════════════════════════
  //  LIGHTING (ambient + point lights for explore mode)
  // ═══════════════════════════════════════════════════════

  _initLighting() {
    // Ambient light — added to group, illuminates torus materials
    this._ambientLight = new THREE.AmbientLight('#2a1a44', 0);
    this.group.add(this._ambientLight);

    // Key point light for the torus
    this._keyLight = new THREE.PointLight('#ffffff', 0, 10);
    this._keyLight.position.set(3, 2, 3);
    this.group.add(this._keyLight);

    // Fill point light
    this._fillLight = new THREE.PointLight('#442288', 0, 8);
    this._fillLight.position.set(2, 1, 1);
    this.group.add(this._fillLight);

    // Rim point light
    this._rimLight = new THREE.PointLight('#6644aa', 0, 8);
    this._rimLight.position.set(-2, -1, -2);
    this.group.add(this._rimLight);
  }

  // ═══════════════════════════════════════════════════════
  //  KNOT MATH (thin wrappers around TorusKnotMath)
  // ═══════════════════════════════════════════════════════

  _knotCurvePoint(t, p, q, R, r) {
    return knotCurvePoint(t, p, q, R, r);
  }

  _surfacePoint(t, s) {
    const { p, q, radius: R, tube: r } = this._state;
    return surfacePoint(t, s, p, q, R, r);
  }

  _surfaceNormal(t, s) {
    const { p, q, radius: R, tube: r } = this._state;
    return surfaceNormal(t, s, p, q, R, r);
  }

  _sampleKnot() {
    const { p, q, radius: R, tube: r } = this._state;
    const result = sampleKnotFrames(p, q, R, r, 400);
    this._knotSamples = result.samples;
    this._knotCumLengths = result.cumLengths;
    this._knotArcLength = result.arcLength;
  }

  _getFrame(u) {
    return getFrame(u, this._knotSamples, this._knotCumLengths, this._knotArcLength);
  }

  _computeCurvatureSamples() {
    const { p, q, radius: R, tube: r } = this._state;
    this._curvatureSamples = computeCurvatureSamples(p, q, R, r, 400);
  }

  // ═══════════════════════════════════════════════════════
  //  TORUS SOLID (curvature-colored + wireframe)
  // ═══════════════════════════════════════════════════════

  _buildGeo() {
    const { radius, tube, tubularSegments, radialSegments, p, q } = this._state;
    return new THREE.TorusKnotGeometry(
      radius, tube, tubularSegments, radialSegments,
      Math.round(p), Math.round(q),
    );
  }

  _rebuildTorusSolid() {
    // Dispose old explore solid/wire
    if (this._exploreSolid) {
      this.group.remove(this._exploreSolid);
      this._exploreSolid.geometry?.dispose();
      this._exploreSolid.material?.dispose();
      this._exploreSolid = null;
    }
    if (this._exploreWire) {
      this.group.remove(this._exploreWire);
      this._exploreWire.geometry?.dispose();
      this._exploreWire.material?.dispose();
      this._exploreWire = null;
    }

    const geo = this._buildGeo();

    // ── Curvature vertex coloring ──────────────────────
    const posAttr = geo.attributes.position;
    const vertexCount = posAttr.count;
    const vColors = new Float32Array(vertexCount * 3);
    const TS = this._state.tubularSegments;
    const RS = this._state.radialSegments;
    const rows = TS + 1, cols = RS + 1;
    const baseColor = new THREE.Color(this._state.color);

    let minK = Infinity, maxK = -Infinity;
    for (let i = 0; i < this._curvatureSamples.length; i++) {
      if (this._curvatureSamples[i] < minK) minK = this._curvatureSamples[i];
      if (this._curvatureSamples[i] > maxK) maxK = this._curvatureSamples[i];
    }

    for (let vi = 0; vi < vertexCount && vi < rows * cols; vi++) {
      const ti = Math.floor(vi / cols);
      const sj = vi % cols;
      const tFrac = ti / TS;
      const kIdx = Math.min(Math.floor(tFrac * this._curvatureSamples.length), this._curvatureSamples.length - 1);
      const kappa = this._curvatureSamples[kIdx];
      const theta = (sj / RS) * Math.PI * 2;
      const cosTheta = Math.cos(theta);
      const denom = this._state.tube * (1 - this._state.tube * kappa * cosTheta);
      const K = -kappa * cosTheta / Math.max(Math.abs(denom), 0.001);
      const tVal = Math.max(0, Math.min(1, (K + 3) / 6));
      const warmColor = new THREE.Color().setHSL(0.08 + tVal * 0.55, 0.75, 0.3 + tVal * 0.4);
      const blend = warmColor.clone().lerp(baseColor, 0.45);
      vColors[vi * 3] = blend.r;
      vColors[vi * 3 + 1] = blend.g;
      vColors[vi * 3 + 2] = blend.b;
    }
    for (let vi = rows * cols; vi < vertexCount; vi++) {
      vColors[vi * 3] = baseColor.r;
      vColors[vi * 3 + 1] = baseColor.g;
      vColors[vi * 3 + 2] = baseColor.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(vColors, 3));

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      vertexColors: true,
      metalness: this._state.metalness,
      roughness: this._state.roughness,
      transparent: true,
      opacity: 0,  // controlled by mode progress
      depthWrite: true,
    });
    this._exploreSolid = new THREE.Mesh(geo, mat);
    this._exploreSolid.userData.isExploreTorus = true;
    this._exploreSolidMat = mat;
    this.group.add(this._exploreSolid);

    // Wireframe
    if (this._state.showWireframe) {
      const wfGeo = this._buildGeo();
      const wfMat = new THREE.MeshBasicMaterial({
        color: '#ccaaff',
        wireframe: true,
        transparent: true,
        opacity: 0,  // controlled by mode progress
        depthWrite: false,
      });
      this._exploreWire = new THREE.Mesh(wfGeo, wfMat);
      this._exploreWireMat = wfMat;
      this.group.add(this._exploreWire);
    }
  }

  // ═══════════════════════════════════════════════════════
  //  LATTICE (concentric wireframe layers)
  // ═══════════════════════════════════════════════════════

  _rebuildLattice() {
    while (this._latticeGroup.children.length) {
      const c = this._latticeGroup.children[0];
      this._latticeGroup.remove(c);
      c.geometry?.dispose();
      c.material?.dispose();
    }
    this._latticeMaterials = [];

    if (!this._state.showLattice) return;

    const segsT = Math.max(100, this._state.tubularSegments);
    const segsR = Math.max(16, this._state.radialSegments);
    const pInt = Math.round(this._state.p), qInt = Math.round(this._state.q);

    LATTICE_LAYERS.forEach(l => {
      const lGeo = new THREE.TorusKnotGeometry(
        this._state.radius, this._state.tube * l.factor,
        segsT, segsR, pInt, qInt,
      );
      const lMat = new THREE.MeshBasicMaterial({
        color: l.color,
        wireframe: true,
        transparent: true,
        opacity: 0,  // controlled by mode progress
        depthWrite: false,
      });
      this._latticeMaterials.push({ mat: lMat, targetOpacity: l.opacity });
      this._latticeGroup.add(new THREE.Mesh(lGeo, lMat));
    });
  }

  // ═══════════════════════════════════════════════════════
  //  FIELD LINES (poloidal rings + toroidal flow lines)
  // ═══════════════════════════════════════════════════════

  _rebuildFieldLines() {
    while (this._fieldGroup.children.length) {
      const c = this._fieldGroup.children[0];
      c.geometry?.dispose();
      c.material?.dispose();
      this._fieldGroup.remove(c);
    }
    this._fieldMaterials = [];

    if (!this._state.showFieldLines) return;
    this._sampleKnot();
    const count = this._state.fieldLineCount;

    // Poloidal rings (blue, short-way around tube)
    const rings = Math.min(count, 24);
    for (let i = 0; i < rings; i++) {
      const u = i / rings;
      const pts = [];
      const N = 120;
      for (let j = 0; j <= N; j++) {
        const s = (j / N) * Math.PI * 2;
        const f = this._getFrame(u);
        if (!f) continue;
        const rr = this._state.tube * 0.82;
        pts.push(f.point.clone()
          .add(f.normal.clone().multiplyScalar(rr * Math.cos(s)))
          .add(f.binormal.clone().multiplyScalar(rr * Math.sin(s))));
      }
      if (pts.length < 2) continue;
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: '#5599dd', transparent: true,
        opacity: 0,  // controlled by mode progress
        depthWrite: false,
      });
      this._fieldMaterials.push({ mat, targetOpacity: 0.5 });
      this._fieldGroup.add(new THREE.Line(geo, mat));
    }

    // Toroidal flow lines (orange, long-way along knot)
    const tlines = Math.min(Math.floor(count * 0.5), 10);
    for (let i = 0; i < tlines; i++) {
      const angle = (i / tlines) * Math.PI * 2;
      const pts = [];
      const N = 300;
      for (let j = 0; j <= N; j++) {
        const u = j / N;
        const f = this._getFrame(u);
        if (!f) continue;
        const rr = this._state.tube * 0.45;
        pts.push(f.point.clone()
          .add(f.normal.clone().multiplyScalar(rr * Math.cos(angle)))
          .add(f.binormal.clone().multiplyScalar(rr * Math.sin(angle))));
      }
      if (pts.length < 2) continue;
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: '#ff8844', transparent: true,
        opacity: 0,  // controlled by mode progress
        depthWrite: false,
      });
      this._fieldMaterials.push({ mat, targetOpacity: 0.55 });
      this._fieldGroup.add(new THREE.Line(geo, mat));
    }
  }

  // ═══════════════════════════════════════════════════════
  //  DIRECTION INDICATORS (arrows)
  // ═══════════════════════════════════════════════════════

  _rebuildDirectionIndicators() {
    // Dispose old
    if (this._toroidalArrows) {
      this._toroidalArrows.forEach(a => {
        this._directionGroup.remove(a);
        a.geometry?.dispose();
        a.material?.dispose();
      });
    }
    if (this._poloidalArrows) {
      this._poloidalArrows.forEach(a => {
        this._directionGroup.remove(a);
        a.geometry?.dispose();
        a.material?.dispose();
      });
    }
    this._toroidalArrows = [];
    this._poloidalArrows = [];
    this._dirArrowMaterials = [];

    if (!this._state.showFieldLines || !this._knotSamples.length) return;

    // Toroidal arrows
    const tlines = Math.min(Math.floor(this._state.fieldLineCount * 0.5), 6);
    for (let i = 0; i < tlines; i++) {
      const angle = (i / Math.max(tlines, 1)) * Math.PI * 2;
      const rr = this._state.tube * 0.45;
      for (let k = 0; k < 5; k++) {
        const u = k / 5;
        const f = this._getFrame(u);
        if (!f) continue;
        const pos = f.point.clone()
          .add(f.normal.clone().multiplyScalar(rr * Math.cos(angle)))
          .add(f.binormal.clone().multiplyScalar(rr * Math.sin(angle)));
        const arrowMat = new THREE.MeshStandardMaterial({
          color: '#ff8844', emissive: '#cc4400', emissiveIntensity: 0.5,
          roughness: 0.4, transparent: true, opacity: 0,
        });
        this._dirArrowMaterials.push({ mat: arrowMat, targetOpacity: 1 });
        const arrow = new THREE.Mesh(this._arrowGeoDir, arrowMat);
        arrow.position.copy(pos);
        arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), f.tangent);
        this._directionGroup.add(arrow);
        this._toroidalArrows.push(arrow);
      }
    }

    // Poloidal arrows
    const rings = Math.min(this._state.fieldLineCount, 8);
    for (let i = 0; i < rings; i++) {
      const u = i / Math.max(rings, 1);
      const f = this._getFrame(u);
      if (!f) continue;
      const rr = this._state.tube * 0.82;
      for (let k = 0; k < 4; k++) {
        const s = (k / 4) * Math.PI * 2;
        const pos = f.point.clone()
          .add(f.normal.clone().multiplyScalar(rr * Math.cos(s)))
          .add(f.binormal.clone().multiplyScalar(rr * Math.sin(s)));
        const poloidalDir = f.binormal.clone().multiplyScalar(Math.cos(s))
          .addScaledVector(f.normal, -Math.sin(s)).normalize();
        const arrowMat = new THREE.MeshStandardMaterial({
          color: '#5599dd', emissive: '#225588', emissiveIntensity: 0.5,
          roughness: 0.4, transparent: true, opacity: 0,
        });
        this._dirArrowMaterials.push({ mat: arrowMat, targetOpacity: 1 });
        const arrow = new THREE.Mesh(this._arrowGeoDir, arrowMat);
        arrow.position.copy(pos);
        arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), poloidalDir);
        this._directionGroup.add(arrow);
        this._poloidalArrows.push(arrow);
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  //  MODE VISIBILITY (apply opacity based on progress)
  // ═══════════════════════════════════════════════════════

  _applyModeVisibility(progress) {
    // Skip if progress hasn't changed since last frame
    if (progress === this._lastVisibilityProgress) return;
    this._lastVisibilityProgress = progress;

    // ── Threshold for hiding explore-only geometry ─────
    // When progress < 0.01, completely remove heavy explore objects from the
    // render pipeline (not just opacity 0). This is critical for performance
    // after exiting explore mode — all those lattice layers, field lines, arrows,
    // and particles would otherwise still consume draw calls every frame.
    const exploreActive = progress > 0.01;

    // Preview gone by progress 0.12 — no overlap with explore
    const previewFade = Math.max(0, 1 - progress * 8.0);
    if (this._previewWireMat) this._previewWireMat.opacity = 0.30 * previewFade;
    // Glow stays at 0 (only shows on hover, managed by _applyPreviewHoverState)

    // Completely remove preview meshes from the render pipeline once faded out,
    // so their depth writes don't occlude the finer explore solid geometry.
    const previewVisible = previewFade > 0.001;
    if (this._previewWire) this._previewWire.visible = previewVisible;
    if (this._glowMesh) this._glowMesh.visible = previewVisible;
    // Click sphere stays visible as long as preview is active (needed for raycasting)
    if (this._clickSphere) this._clickSphere.visible = previewVisible;

    // Explore fully opaque by progress 0.3
    const exploreFade = Math.max(0, Math.min(1, progress / 0.3));
    if (this._exploreSolidMat) this._exploreSolidMat.opacity = 0.88 * exploreFade;
    if (this._exploreWireMat) this._exploreWireMat.opacity = 0.18 * exploreFade;

    // ── Explore-only groups: hide entirely when not active ──
    if (this._exploreSolid) this._exploreSolid.visible = exploreActive;
    if (this._exploreWire) this._exploreWire.visible = exploreActive;
    if (this._latticeGroup) this._latticeGroup.visible = exploreActive;
    if (this._fieldGroup) this._fieldGroup.visible = exploreActive;
    if (this._directionGroup) this._directionGroup.visible = exploreActive;
    // Particles: delegate visibility to the particle system
    this._particles.setGroupVisible(exploreActive);

    // Lattice
    if (this._latticeMaterials) {
      this._latticeMaterials.forEach(({ mat, targetOpacity }) => {
        mat.opacity = targetOpacity * progress;
      });
    }

    // Field lines
    if (this._fieldMaterials) {
      this._fieldMaterials.forEach(({ mat, targetOpacity }) => {
        mat.opacity = targetOpacity * progress;
      });
    }

    // Direction arrows
    if (this._dirArrowMaterials) {
      this._dirArrowMaterials.forEach(({ mat, targetOpacity }) => {
        mat.opacity = targetOpacity * progress;
      });
    }

    // Particles (delegated)
    this._particles.setOpacity(progress);

    // Marker (delegated)
    this._marker.setOpacity(progress);
    // Hide marker groups entirely when not in explore mode
    this._marker.setGroupVisible(exploreActive);

    // Lighting — completely hide lights when not in explore mode
    if (this._ambientLight) { this._ambientLight.intensity = 0.5 * progress; this._ambientLight.visible = exploreActive; }
    if (this._keyLight) { this._keyLight.intensity = 0.8 * progress; this._keyLight.visible = exploreActive; }
    if (this._fillLight) { this._fillLight.intensity = 1.5 * progress; this._fillLight.visible = exploreActive; }
    if (this._rimLight) { this._rimLight.intensity = 0.8 * progress; this._rimLight.visible = exploreActive; }
  }

  _applyPreviewHoverState(hovered) {
    if (!this._previewWireMat || !this._glowMat) return;
    const baseGray = this._previewBaseColor || new THREE.Color('#888888');
    if (hovered) {
      const accent = getAccentColor();
      this._previewWireMat.color.copy(baseGray).lerp(accent, 0.7);
      this._previewWireMat.opacity = 0.65;
      this._glowMat.color.copy(accent);
      this._glowMat.opacity = 0.12;
    } else {
      this._previewWireMat.color.copy(baseGray);
      this._previewWireMat.opacity = 0.30;
      this._glowMat.opacity = 0;
    }
  }

  // ═══════════════════════════════════════════════════════
  //  RAY TARGETS & HIT DETECTION (for click handling)
  // ═══════════════════════════════════════════════════════

  /**
   * Returns meshes that should participate in raycaster intersections.
   * In preview mode: the invisible click sphere (larger than torus for easy targeting).
   * In explore mode: the explore solid + wire + lattice children.
   */
  getRayTargets() {
    const targets = [];
    if (this._modeProgress < 0.5) {
      // Preview mode: use the invisible click sphere (easier to click than the torus mesh)
      if (this._clickSphere?.visible) targets.push(this._clickSphere);
    }
    // Explore solid only when transitioning in or fully in explore
    if (this._exploreSolid?.visible && this._modeProgress > 0.3) {
      targets.push(this._exploreSolid);
    }
    if (this._exploreWire?.visible && this._modeProgress > 0.5) {
      targets.push(this._exploreWire);
    }
    // Lattice children
    if (this._latticeGroup && this._modeProgress > 0.3) {
      this._latticeGroup.children.forEach(c => {
        if (c.isMesh) targets.push(c);
      });
    }
    return targets;
  }

  /**
   * Check whether a raycast hit object belongs to this torus.
   */
  isHit(hitObject) {
    if (!hitObject) return false;
    return hitObject.userData.isPreviewTorus === true
      || hitObject.userData.isExploreTorus === true
      || hitObject === this._clickSphere
      || hitObject === this._previewWire
      || hitObject === this._exploreWire;
  }

  /**
   * Apply hover visual feedback (preview mode only — explore has marker dragging).
   */
  applyHover(hovered) {
    this._hovered = hovered;
    if (this._modeProgress < 0.5) {
      this._applyPreviewHoverState(hovered);
    }
    if (hovered && this._modeProgress < 0.5) {
      document.body.style.cursor = 'pointer';
    }
  }

  /** Whether the torus is currently hovered (preview mode). */
  get hovered() {
    return this._hovered;
  }

  /**
   * Returns the world-space position of the torus (for camera targeting).
   */
  getWorldPosition() {
    const pos = new THREE.Vector3();
    this.group.getWorldPosition(pos);
    return pos;
  }

  // ═══════════════════════════════════════════════════════
  //  PUBLIC API: rebuild, presets, params
  // ═══════════════════════════════════════════════════════

  /** Full rebuild from new parameter set. */
  rebuild(params = {}) {
    Object.assign(this._state, params);
    // Preserve activePreset from explicit React-driven updates;
    // engine-internal calls (applyPreset, resetToDefaults) set it before rebuild().
    if ('activePreset' in params) {
      this._activePreset = params.activePreset;
    }

    // Check if any geometry-affecting params changed
    const geoKeys = ['p', 'q', 'radius', 'tube'];
    const needsGeoRebuild = geoKeys.some(k => k in params);

    if (needsGeoRebuild) {
      // Dispose old preview meshes
      if (this._clickSphere) {
        this.group.remove(this._clickSphere);
        this._clickSphere.geometry?.dispose();
        this._clickSphere.material?.dispose();
        this._clickSphere = null;
      }
      if (this._previewWire) {
        this.group.remove(this._previewWire);
        this._previewWireGeo?.dispose();
        this._previewWireMat?.dispose();
        this._previewWire = null;
      }
      if (this._glowMesh) {
        this.group.remove(this._glowMesh);
        this._glowMat?.dispose();
        this._glowMesh = null;
      }
      // Rebuild preview base with new geometry
      this._buildPreviewBase();
    }
    // Note: colour-only changes no longer affect the preview wireframe
    // (it stays grayscale). The explore solid still uses the colour param.

    // Rebuild explore layers only if they've been built
    if (this._exploreBuilt) {
      this._sampleKnot();
      this._computeCurvatureSamples();
      this._rebuildTorusSolid();
      this._rebuildLattice();
      this._rebuildFieldLines();
      this._rebuildDirectionIndicators();
      this._particles.buildData();
      this._marker.updateTransform(this._markerT, this._markerS);
    }

    // Re-apply current mode visibility
    // Invalidate the per-frame cache so visibility is always applied after a
    // rebuild, even if modeProgress hasn't changed since the last update() frame.
    this._lastVisibilityProgress = -1;
    this._applyModeVisibility(this._modeProgress);
  }

  /** Apply a scientific preset by index. Returns the preset or null. */
  applyPreset(idx) {
    if (idx < 0 || idx >= PRESETS.length) return null;
    if (idx === this._activePreset) {
      // Deselect — reset to defaults
      this._activePreset = -1;
      this.resetToDefaults();
      return null;
    }
    this._activePreset = idx;
    const pr = PRESETS[idx].params;
    Object.assign(this._state, {
      p: pr.p, q: pr.q, radius: pr.radius, tube: pr.tube,
      spinSpeed: pr.spinSpeed, color: pr.color,
      metalness: pr.metalness, roughness: pr.roughness,
      fieldLineCount: pr.fieldLineCount, particleSpeed: pr.particleSpeed,
      morphValue: 0,
    });
    this._markerT = 0; this._markerS = Math.PI / 2;
    this.rebuild();
    return PRESETS[idx];
  }

  /** Reset all parameters to defaults. */
  resetToDefaults() {
    Object.assign(this._state, {
      p: 2, q: 3, radius: 2.5, tube: 0.7, tubularSegments: 200, radialSegments: 24,
      spinSpeed: 0, color: '#9944dd', metalness: 0.15, roughness: 0.5,
      showWireframe: true, showFieldLines: true, showLattice: true,
      fieldLineCount: 20, particleSpeed: 0.7, morphValue: 0,
    });
    this._markerT = 0; this._markerS = Math.PI / 2;
    this._activePreset = -1;
    this.rebuild();
  }

  /** Get current state snapshot (for external panels). */
  getState() {
    const { morphPresets, ...rest } = this._state;
    return { ...rest, activePreset: this._activePreset };
  }

  /** Static access to presets for React panels (backward compat). */
  static get PRESETS() { return PRESETS; }
  static get DEFAULT_STATE() { return DEFAULT_STATE; }

  // ═══════════════════════════════════════════════════════
  //  MARKER DRAGGING (for explore mode)
  // ═══════════════════════════════════════════════════════

  /** Returns true if the marker drag was started. Call from pointerdown.
   *  @param {THREE.Vector3} worldPoint — raycast hit point in world space */
  startMarkerDrag(worldPoint) {
    if (this._modeProgress < 0.5) return false;
    this._dragging = true;
    // Convert world-space hit to torus group local space
    const localPt = this.group.worldToLocal(worldPoint.clone());
    const p = this._marker.closestParams(localPt);
    this._markerT = p.t; this._markerS = p.s;
    this._marker.updateTransform(this._markerT, this._markerS);
    return true;
  }

  /** Update marker position during drag.
   *  @param {THREE.Vector3} worldPoint — raycast hit point in world space */
  updateMarkerDrag(worldPoint) {
    if (!this._dragging) return;
    const localPt = this.group.worldToLocal(worldPoint.clone());
    const p = this._marker.closestParams(localPt);
    this._markerT = p.t; this._markerS = p.s;
    this._marker.updateTransform(this._markerT, this._markerS);
  }

  /** End marker drag. */
  endMarkerDrag() {
    this._dragging = false;
  }

  get isDragging() {
    return this._dragging;
  }

  // ═══════════════════════════════════════════════════════
  //  PER-FRAME UPDATE
  // ═══════════════════════════════════════════════════════

  /**
   * Called every frame by ThreeBackground.
   * @param {number} t — elapsed time in seconds
   * @param {number} dt — delta time in seconds
   */
  update(t, dt) {
    // ── Mode transition lerp ──────────────────────────
    const transitionSpeed = 3.0; // takes ~0.33s for full transition
    this._modeProgress += (this._targetModeProgress - this._modeProgress) * Math.min(transitionSpeed * dt, 1);
    // Snap when close enough
    if (Math.abs(this._targetModeProgress - this._modeProgress) < 0.001) {
      this._modeProgress = this._targetModeProgress;
    }

    const prog = this._modeProgress;

    // Belt-and-suspenders: if explore was requested but not built yet, build now.
    // (setMode triggers the build, but this catches edge cases like direct state manipulation.)
    if (this._targetModeProgress > 0.01 && !this._exploreBuilt) {
      this._buildExplore();
    }

    // Position: smooth lerp between orbit (preview) and center (explore)
    const orbitAngle = (t / ORBIT_PERIOD) * Math.PI * 2 + this._orbitPhaseOffset;
    const orbitX = Math.cos(orbitAngle) * ORBIT_RADIUS;
    const orbitZ = Math.sin(orbitAngle) * ORBIT_RADIUS;
    const orbitY = Math.sin((t / ORBIT_Y_PERIOD) * Math.PI * 2 + this._orbitPhaseOffset) * ORBIT_Y_AMP;
    const centerPos = new THREE.Vector3(0, 0, 0);

    // Target position blends orbit ↔ center based on mode progress
    const targetPos = new THREE.Vector3(orbitX, orbitY, orbitZ)
      .lerp(centerPos, prog);
    // Smooth follow — fast enough to track orbit, slow enough to avoid snap
    this.group.position.lerp(targetPos, Math.min(8.0 * dt, 1));

    // Scale: grows moderately in explore mode
    const targetScale = PREVIEW_SCALE + (EXPLORE_SCALE - PREVIEW_SCALE) * prog;
    this.group.scale.setScalar(targetScale);

    // Self-rotation (spin)
    this.group.rotation.y += this._state.spinSpeed * dt;
    this.group.rotation.x += dt * 0.12 * (1 - prog);  // preview tumble fades in explore

    // ── Mode visibility (fade layers) ────────────────
    this._applyModeVisibility(prog);

    // ── Particles (delegated) ────────────────────────
    if (prog > 0.05) {
      this._particles.update(t);
    }

    // ── Hover effect for preview mode ────────────────
    if (prog < 0.3 && this._hovered) {
      const hoverScale = 1 + 0.08 * (1 - prog);
      this.group.scale.setScalar(targetScale * hoverScale);
    }
  }

  // ═══════════════════════════════════════════════════════
  //  CLEANUP
  // ═══════════════════════════════════════════════════════

  dispose() {
    const safeD = (obj) => { if (obj && typeof obj.dispose === 'function') obj.dispose(); };

    // Preview
    safeD(this._previewWireGeo);
    safeD(this._previewWireMat);
    safeD(this._glowMat);
    if (this._clickSphere) {
      safeD(this._clickSphere.geometry);
      safeD(this._clickSphere.material);
    }

    // Explore solid
    if (this._exploreSolid) {
      safeD(this._exploreSolid.geometry);
      safeD(this._exploreSolid.material);
    }
    if (this._exploreWire) {
      safeD(this._exploreWire.geometry);
      safeD(this._exploreWire.material);
    }
    safeD(this._exploreSolidMat);
    safeD(this._exploreWireMat);

    // Lattice
    while (this._latticeGroup?.children.length) {
      const c = this._latticeGroup.children[0];
      this._latticeGroup.remove(c);
      safeD(c.geometry);
      safeD(c.material);
    }

    // Field lines
    while (this._fieldGroup?.children.length) {
      const c = this._fieldGroup.children[0];
      this._fieldGroup.remove(c);
      safeD(c.geometry);
      safeD(c.material);
    }

    // Direction arrows
    if (this._toroidalArrows) {
      this._toroidalArrows.forEach(a => { safeD(a.geometry); safeD(a.material); });
    }
    if (this._poloidalArrows) {
      this._poloidalArrows.forEach(a => { safeD(a.geometry); safeD(a.material); });
    }
    safeD(this._arrowGeoDir);

    // Particles (delegated)
    this._particles.dispose();

    // Marker (delegated)
    this._marker.dispose();

    // Remove group from parent
    this.parentGroup.remove(this.group);
  }
}
