import * as THREE from 'three';
import { getAccentColor, getThemeColor, THEME, onThemeChange } from '../shared';

const NUM_CUBES = 18;
const CLEAR_ZONE_X = 6.0;
const CLEAR_ZONE_Y = 5.0;
const CLEAR_ZONE_Z = 6.0;
const MAX_PLACEMENT_TRIES = 20;
const MAX_SPAWN_DELAY = 3.0;  // seconds — cubes appear staggered over this window

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
   * @param {number} [count=18] — number of cubes to create
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

      const opacity = 0.08 + Math.random() * 0.17;

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
        x = (Math.random() - 0.5) * 20;
        y = (Math.random() - 0.5) * 16;
        z = (Math.random() - 0.5) * 20;
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
        spinSpeed: 0.001 + Math.random() * 0.002,
        idlePhase: Math.random() * Math.PI * 2,
        idleSpeed: 0.08 + Math.random() * 0.12,
        basePosition: { x, y, z },
        colorLight: colorLight.clone(),
        colorDark: colorDark.clone(),
        baseOpacityDark: opacity,
        baseOpacityLight: Math.min(opacity * 2.2, 0.55),
        baseOpacity: opacity,
        hoverLerp: 0,       // 0 = idle, 1 = fully hovered
        hitLerp: 0,         // 0 = normal, 1 = just hit by laser
        hitSpin: new THREE.Vector3(),
        _spawnDelay: 0,     // seconds until this cube becomes visible after regenerate
      };

      parentGroup.add(cube);
      this.cubes.push(cube);
    }

    // ── Theme change listener ──────────────────────────
    this._themeCleanup = onThemeChange(() => this._applyTheme());
    // Apply correct initial colour
    this._applyTheme();
  }

  /** Swap all cube base colours and opacity to match current theme. */
  _applyTheme() {
    const dark = document.documentElement.classList.contains('dark');
    for (const cube of this.cubes) {
      const d = cube.userData;
      d._currentBase = dark ? d.colorDark : d.colorLight;
      d.baseOpacity = dark ? d.baseOpacityDark : d.baseOpacityLight;
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

      // ── Staggered spawn delay (galaxy transition) ──
      if (d._spawnDelay > 0) {
        d._spawnDelay -= _dt || 0.016;
        if (d._spawnDelay <= 0) {
          // Delay elapsed — reveal the cube with spawn-in animation
          d._spawnDelay = 0;
          cube.visible = true;
          d.spawnLerp = 0;
          cube.scale.setScalar(0.001);
          cube.material.opacity = d.baseOpacity;
        }
      }
      if (!cube.visible) continue;

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

  /**
   * Circular-buffer recycling: cubes that fall behind the saucer are
   * silently repositioned ahead so the galaxy feels infinite.
   * Call every frame during cockpit mode.
   *
   * @param {THREE.Vector3} saucerPos — saucer world position (sceneGroup local)
   * @param {THREE.Vector3} saucerFwd — saucer forward direction (normalised)
   */
  recycleAroundSaucer(saucerPos, saucerFwd) {
    const BEHIND_LIMIT = 8;
    const AHEAD_MIN = 6;
    const AHEAD_MAX = 14;
    const LATERAL_SPREAD = 7;
    const VERTICAL_SPREAD = 5;

    // Perpendicular axes for lateral offset
    const right = new THREE.Vector3(-saucerFwd.z, 0, saucerFwd.x).normalize();
    if (right.length() < 0.01) right.set(1, 0, 0);
    const up = new THREE.Vector3().crossVectors(saucerFwd, right).normalize();

    for (const cube of this.cubes) {
      const d = cube.userData;
      // Skip cubes waiting to spawn (stagger delay from regenerate)
      if (d._spawnDelay > 0) continue;

      const rel = new THREE.Vector3().subVectors(cube.position, saucerPos);
      const forwardDist = rel.dot(saucerFwd);

      if (forwardDist < -BEHIND_LIMIT) {
        // Cube is well behind — recycle it ahead
        const aheadDist = AHEAD_MIN + Math.random() * (AHEAD_MAX - AHEAD_MIN);
        const latOffset = (Math.random() - 0.5) * LATERAL_SPREAD * 2;
        const vertOffset = (Math.random() - 0.5) * VERTICAL_SPREAD * 2;

        const newPos = saucerPos.clone()
          .addScaledVector(saucerFwd, aheadDist)
          .addScaledVector(right, latOffset)
          .addScaledVector(up, vertOffset);

        cube.position.copy(newPos);
        d.basePosition = { x: newPos.x, y: newPos.y, z: newPos.z };

        // Fresh spawn-in animation
        d.spawnLerp = 0;
        cube.scale.setScalar(0.001);
        cube.visible = true;
        d.hitLerp = 0;
        d.hoverLerp = 0;
        d.respawnAt = 0;

        // Refresh spin
        d.spinAxis.set(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5,
        ).normalize();
        d.spinSpeed = 0.001 + Math.random() * 0.002;
        d.idlePhase = Math.random() * Math.PI * 2;
        d.idleSpeed = 0.08 + Math.random() * 0.12;
      }
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

  /**
   * Regenerate all cubes at new random positions with fresh spawn-in
   * animation.  Called when the saucer crosses the galaxy boundary,
   * giving the impression of a "new galaxy" populated with fresh debris.
   *
   * Saves the original state on first call so it can be restored later
   * (e.g. when exiting cockpit mode).
   *
   * @param {number} [cx=0] — center X in sceneGroup local space
   * @param {number} [cy=0] — center Y
   * @param {number} [cz=0] — center Z
   */
  regenerate(cx = 0, cy = 0, cz = 0) {
    // Save original state on first call so we can restore later
    this.saveOriginalState();

    const accentColor = getAccentColor();
    const dark = document.documentElement.classList.contains('dark');

    // Compute all new positions first so we can sort by distance from centre
    // (closer cubes spawn sooner — feels more like flying into a galaxy)
    const newPositions = this.cubes.map(() => {
      let x, y, z, tries = 0;
      do {
        x = cx + (Math.random() - 0.5) * 14;
        y = cy + (Math.random() - 0.5) * 10;
        z = cz + (Math.random() - 0.5) * 14;
        tries++;
      } while (
        Math.abs(x - cx) < CLEAR_ZONE_X &&
        Math.abs(y - cy) < CLEAR_ZONE_Y &&
        Math.abs(z - cz) < CLEAR_ZONE_Z &&
        tries < MAX_PLACEMENT_TRIES
      );
      return { x, y, z };
    });

    // Sort cubes by distance from the saucer — nearer cubes appear first
    const indexed = this.cubes.map((cube, i) => ({ cube, pos: newPositions[i], i }));
    indexed.sort((a, b) => {
      const da = (a.pos.x - cx) ** 2 + (a.pos.y - cy) ** 2 + (a.pos.z - cz) ** 2;
      const db = (b.pos.x - cx) ** 2 + (b.pos.y - cy) ** 2 + (b.pos.z - cz) ** 2;
      return da - db;
    });

    for (let rank = 0; rank < indexed.length; rank++) {
      const { cube, pos } = indexed[rank];
      const d = cube.userData;

      // Stagger: nearer cubes appear first, spread over MAX_SPAWN_DELAY seconds
      const fraction = rank / (indexed.length - 1 || 1);
      d._spawnDelay = fraction * MAX_SPAWN_DELAY;

      // Set new position immediately (invisible until delay elapses)
      cube.position.set(pos.x, pos.y, pos.z);

      // Update per-cube data
      d.basePosition = { x: pos.x, y: pos.y, z: pos.z };
      d.spinAxis.set(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
      ).normalize();
      d.spinSpeed = 0.001 + Math.random() * 0.002;
      d.idlePhase = Math.random() * Math.PI * 2;
      d.idleSpeed = 0.08 + Math.random() * 0.12;

      // Randomise accent-hint distribution (20% chance)
      const hasAccent = Math.random() < 0.2;
      const isLight = Math.random() > 0.5;
      const darkHex = isLight ? THEME.cubeGray.dark : THEME.cubeDark.dark;
      const lightHex = isLight ? THEME.cubeGray.light : THEME.cubeDark.light;
      d.colorLight = hasAccent
        ? accentColor.clone().lerp(new THREE.Color(lightHex), 0.6)
        : new THREE.Color(lightHex);
      d.colorDark = hasAccent
        ? accentColor.clone().lerp(new THREE.Color(darkHex), 0.6)
        : new THREE.Color(darkHex);
      d._currentBase = dark ? d.colorDark : d.colorLight;
      d.baseOpacity = 0.08 + Math.random() * 0.17;

      // Reset state — cube stays hidden until _spawnDelay elapses
      cube.visible = false;
      d.respawnAt = 0;
      d.hitLerp = 0;
      d.hoverLerp = 0;
      d.spawnLerp = 1; // will be reset to 0 when revealed
      cube.material.opacity = d.baseOpacity;
      cube.material.color.copy(d._currentBase);
    }
  }

  /**
   * Public entry-point: save cube state so it can be restored on exit.
   * Call when entering cockpit mode, before any recycling occurs.
   */
  saveOriginalState() {
    if (!this._savedState) {
      this._saveState();
    }
  }

  /**
   * Snapshot every cube's position, colour, and animation state so it
   * can be restored later (e.g. when exiting cockpit mode).
   */
  _saveState() {
    this._savedState = this.cubes.map(cube => {
      const d = cube.userData;
      return {
        x: cube.position.x,
        y: cube.position.y,
        z: cube.position.z,
        bx: d.basePosition.x,
        by: d.basePosition.y,
        bz: d.basePosition.z,
        sax: d.spinAxis.x, say: d.spinAxis.y, saz: d.spinAxis.z,
        spinSpeed: d.spinSpeed,
        idlePhase: d.idlePhase,
        idleSpeed: d.idleSpeed,
        colorLight: d.colorLight.clone(),
        colorDark: d.colorDark.clone(),
        currentBase: d._currentBase ? d._currentBase.clone() : null,
        baseOpacity: d.baseOpacity,
        visible: cube.visible,
        respawnAt: d.respawnAt,
        hitLerp: d.hitLerp,
        hoverLerp: d.hoverLerp,
        spawnLerp: d.spawnLerp,
        _spawnDelay: d._spawnDelay,
        scale: cube.scale.x,
        opacity: cube.material.opacity,
        matColor: cube.material.color.getHex(),
      };
    });
  }

  /**
   * Restore every cube to the state saved by the last _saveState() call.
   * Called when exiting cockpit so the galaxy view returns to normal.
   */
  restoreOriginals() {
    if (!this._savedState) return;
    const dark = document.documentElement.classList.contains('dark');

    for (let i = 0; i < this.cubes.length; i++) {
      const cube = this.cubes[i];
      const s = this._savedState[i];
      if (!s) continue;
      const d = cube.userData;

      cube.position.set(s.x, s.y, s.z);
      d.basePosition = { x: s.bx, y: s.by, z: s.bz };
      d.spinAxis.set(s.sax, s.say, s.saz);
      d.spinSpeed = s.spinSpeed;
      d.idlePhase = s.idlePhase;
      d.idleSpeed = s.idleSpeed;
      d.colorLight = s.colorLight.clone();
      d.colorDark = s.colorDark.clone();
      d._currentBase = dark ? d.colorDark : d.colorLight;
      d.baseOpacity = s.baseOpacity;
      cube.visible = s.visible;
      d.respawnAt = s.respawnAt;
      d.hitLerp = s.hitLerp;
      d.hoverLerp = s.hoverLerp;
      d.spawnLerp = s.spawnLerp;
      d._spawnDelay = s._spawnDelay || 0;
      cube.scale.setScalar(s.scale);
      cube.material.opacity = s.opacity;
      cube.material.color.setHex(s.matColor);
    }
    this._savedState = null;
  }
}
