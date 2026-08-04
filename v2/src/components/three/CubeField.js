import * as THREE from 'three';
import { getAccentColor, getThemeColor, THEME, onThemeChange } from './shared';

const NUM_CUBES = 35;
const CLEAR_ZONE_X = 3.5;
const CLEAR_ZONE_Y = 2.5;
const CLEAR_ZONE_Z = 3.5;
const MAX_PLACEMENT_TRIES = 20;

// ── Per-frame object pools (avoid GC from new Quaternion / Euler every frame) ──
const _qPool = new THREE.Quaternion();
const _ePool = new THREE.Euler();
const _axisPool = new THREE.Vector3();

/**
 * Manages the field of floating wireframe cubes in the 3D scene.
 * Handles creation, per-frame animation (spin, hover, hit reactions,
 * spawn-in), and disposal. Supports theme-aware colour swapping.
 *
 * Follows the same vanilla-JS-class pattern as GalaxyEffect / FlyingSaucer.
 */
export default class CubeField {
  /**
   * @param {THREE.Group} parentGroup — sceneGroup to add cubes to
   * @param {number} [count=35] — number of cubes to create
   */
  constructor(parentGroup, count = NUM_CUBES) {
    this.parentGroup = parentGroup;
    this.cubes = [];

    const accentColor = getAccentColor();

    for (let i = 0; i < count; i++) {
      const size = 0.3 + Math.random() * 0.5;
      const geometry = new THREE.BoxGeometry(size, size, size);

      // ~20% of cubes get a hint of the accent colour
      const hasAccent = Math.random() < 0.2;
      const isLight = Math.random() > 0.5;

      // Build both light and dark variants so we can swap on theme change
      const darkHex = isLight ? THEME.cubeGray.dark : THEME.cubeDark.dark;
      const lightHex = isLight ? THEME.cubeGray.light : THEME.cubeDark.light;
      const colorLight = hasAccent
        ? accentColor.clone().lerp(new THREE.Color(lightHex), 0.6)
        : new THREE.Color(lightHex);
      const colorDark = hasAccent
        ? accentColor.clone().lerp(new THREE.Color(darkHex), 0.6)
        : new THREE.Color(darkHex);

      const opacity = 0.15 + Math.random() * 0.35;

      const material = new THREE.MeshBasicMaterial({
        color: colorLight.clone(),
        wireframe: true,
        transparent: true,
        opacity,
      });

      const cube = new THREE.Mesh(geometry, material);

      // Spread cubes across a wide area, keeping a clear zone near centre
      let x, y, z, tries = 0;
      do {
        x = (Math.random() - 0.5) * 14;
        y = (Math.random() - 0.5) * 10;
        z = (Math.random() - 0.5) * 14;
        tries++;
      } while (
        Math.abs(x) < CLEAR_ZONE_X &&
        Math.abs(y) < CLEAR_ZONE_Y &&
        Math.abs(z) < CLEAR_ZONE_Z &&
        tries < MAX_PLACEMENT_TRIES
      );

      cube.position.set(x, y, z);

      // Store per-cube animation data
      cube.userData = {
        spinAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        spinSpeed: 0.002 + Math.random() * 0.004,
        idlePhase: Math.random() * Math.PI * 2,
        idleSpeed: 0.2 + Math.random() * 0.3,
        basePosition: { x, y, z },
        colorLight: colorLight.clone(),
        colorDark: colorDark.clone(),
        baseOpacity: opacity,
        hoverLerp: 0,       // 0 = idle, 1 = fully hovered
        hitLerp: 0,         // 0 = normal, 1 = just hit by laser
        hitSpin: new THREE.Vector3(),
      };

      parentGroup.add(cube);
      this.cubes.push(cube);
    }

    // ── Theme change listener ──────────────────────────
    this._themeCleanup = onThemeChange(() => this._applyTheme());
    // Apply correct initial colour
    this._applyTheme();
  }

  /** Swap all cube base colours to match current theme. */
  _applyTheme() {
    const dark = document.documentElement.classList.contains('dark');
    for (const cube of this.cubes) {
      const d = cube.userData;
      d._currentBase = dark ? d.colorDark : d.colorLight;
    }
  }

  /** Returns all cubes (visible + destroyed). Use for general access. */
  getCubes() {
    return this.cubes;
  }

  /** Returns only currently visible cubes. Use for raycaster / saucer targeting. */
  getVisibleCubes() {
    return this.cubes.filter(c => c.visible);
  }

  /**
   * Per-frame update: spin, hover/hit lerp, spawn-in, idle sway,
   * colour and opacity transitions.
   *
   * @param {number} t — elapsed time in seconds
   * @param {number} _dt — delta time (unused currently, kept for API consistency)
   * @param {THREE.Mesh|null} hoveredCube — the cube currently under the pointer
   * @param {THREE.Color} currentAccent — current accent colour from CSS
   */
  update(t, _dt, hoveredCube, currentAccent) {
    for (const cube of this.cubes) {
      const d = cube.userData;
      const isHovered = cube === hoveredCube;

      // Smooth hover lerp
      const hoverTarget = isHovered ? 1 : 0;
      d.hoverLerp += (hoverTarget - d.hoverLerp) * (isHovered ? 0.12 : 0.06);

      // Decay hit reaction
      if (d.hitLerp > 0.001) {
        d.hitLerp *= 0.94; // smooth decay
        // Apply tumble kick from laser hit (reuse pooled objects)
        _ePool.set(d.hitSpin.x * d.hitLerp, d.hitSpin.y * d.hitLerp, d.hitSpin.z * d.hitLerp);
        _qPool.setFromEuler(_ePool);
        cube.quaternion.multiply(_qPool);
      } else {
        d.hitLerp = 0;
      }

      // Spin — faster on hover or hit
      const spinSpeed = d.spinSpeed + d.hoverLerp * 0.04 + d.hitLerp * 0.06;
      _qPool.setFromAxisAngle(d.spinAxis, spinSpeed);
      cube.quaternion.multiply(_qPool);

      // Scale — grow on hover, pop on hit, spawn-in animation
      // Smooth spawn-in: lerp from 0 → 1
      if (d.spawnLerp !== undefined && d.spawnLerp < 1) {
        d.spawnLerp += (1 - d.spawnLerp) * 0.06;
        if (d.spawnLerp > 0.999) d.spawnLerp = 1;
      }
      const spawnScale = d.spawnLerp !== undefined ? d.spawnLerp : 1;
      const s = (1 + d.hoverLerp * 0.35 + d.hitLerp * 0.5) * spawnScale;
      cube.scale.setScalar(s);

      // Colour — lerp toward accent on hover or hit
      const accentBlend = Math.max(d.hoverLerp * 0.7, d.hitLerp);
      const base = d._currentBase || d.colorLight;
      cube.material.color.copy(base).lerp(currentAccent, accentBlend);

      // Opacity — brighten on hover or hit
      cube.material.opacity = d.baseOpacity + d.hoverLerp * 0.35 + d.hitLerp * 0.5;

      // Gentle idle sway
      cube.position.x = d.basePosition.x + Math.sin(t * d.idleSpeed * 0.4 + d.idlePhase) * 0.05;
      cube.position.y = d.basePosition.y + Math.sin(t * d.idleSpeed + d.idlePhase) * 0.08;
      cube.position.z = d.basePosition.z + Math.cos(t * d.idleSpeed * 0.3 + d.idlePhase * 1.5) * 0.04;
    }
  }

  /** Dispose all cube geometries and materials, remove from parent. */
  dispose() {
    if (this._themeCleanup) {
      this._themeCleanup();
      this._themeCleanup = null;
    }
    for (const cube of this.cubes) {
      cube.geometry.dispose();
      cube.material.dispose();
      this.parentGroup.remove(cube);
    }
    this.cubes.length = 0;
  }
}
