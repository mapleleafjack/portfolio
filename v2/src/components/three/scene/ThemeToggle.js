import * as THREE from 'three';
import { onThemeChange } from '../shared';

const SPHERE_RADIUS = 0.16;
// Fixed world-space position in the sceneGroup (top-right area)
const WORLD_POS = new THREE.Vector3(3.2, 2.4, 0);

/**
 * A 3D sun/moon toggle that orbits with the sceneGroup.
 *
 * Light mode → Sun:  golden sphere with 3 concentric corona rings
 * Dark mode  → Moon: cool blue-white sphere with crescent cap + subtle ring
 *
 * Clickable via raycaster to toggle the theme.
 * Follows the vanilla-JS-class pattern (CubeField / GalaxyEffect style).
 */
export default class ThemeToggle {
  /**
   * @param {THREE.Group} parentGroup — the sceneGroup to add the toggle to
   * @param {() => void} onToggle — callback invoked on click
   */
  constructor(parentGroup, onToggle) {
    this._parentGroup = parentGroup;
    this._onToggle = onToggle;

    // ═══════════════════════════════════════════════════
    //  Shared geometry
    // ═══════════════════════════════════════════════════
    const sphereGeo = new THREE.SphereGeometry(SPHERE_RADIUS, 32, 32);

    // ── Sun materials ──────────────────────────────────
    this._sunMat = new THREE.MeshBasicMaterial({
      color: 0xf5c842,
      transparent: true,
      opacity: 0.92,
    });

    // ── Moon materials ─────────────────────────────────
    this._moonMat = new THREE.MeshBasicMaterial({
      color: 0xdce8f0,
      transparent: true,
      opacity: 0.9,
    });

    // ── Main sphere mesh ───────────────────────────────
    this.mesh = new THREE.Mesh(sphereGeo, this._sunMat);

    // ═══════════════════════════════════════════════════
    //  Corona rings (sun mode only)
    // ═══════════════════════════════════════════════════
    this._coronaRings = [];
    const coronaData = [
      { scale: 1.35, opacity: 0.28, tube: 0.012 },
      { scale: 1.55, opacity: 0.18, tube: 0.010 },
      { scale: 1.75, opacity: 0.10, tube: 0.008 },
    ];
    for (const cd of coronaData) {
      const ringGeo = new THREE.TorusGeometry(SPHERE_RADIUS * cd.scale, cd.tube, 8, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf5c842,
        transparent: true,
        opacity: cd.opacity,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      // Random initial tilt so rings criss-cross
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      ring.userData = {
        speedX: 0.3 + Math.random() * 0.9,
        speedY: 0.2 + Math.random() * 0.7,
      };
      this._coronaRings.push(ring);
    }

    // ═══════════════════════════════════════════════════
    //  Moon crescent cap (dark sphere that masks the moon)
    // ═══════════════════════════════════════════════════
    const capGeo = new THREE.SphereGeometry(SPHERE_RADIUS * 1.08, 32, 32);
    this._crescentCapMat = new THREE.MeshBasicMaterial({
      color: 0x0a0a0a, // matches dark bg — will be overridden by _applyTheme
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    this._crescentCap = new THREE.Mesh(capGeo, this._crescentCapMat);
    // Offset to leave a crescent visible (shift right-up → crescent on bottom-left)
    this._crescentCap.position.set(SPHERE_RADIUS * 0.55, SPHERE_RADIUS * 0.45, 0);

    // ═══════════════════════════════════════════════════
    //  Moon glow ring (thin, always present but subtle)
    // ═══════════════════════════════════════════════════
    const moonRingGeo = new THREE.TorusGeometry(SPHERE_RADIUS * 1.22, 0.01, 8, 48);
    this._moonRingMat = new THREE.MeshBasicMaterial({
      color: 0xdce8f0,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    this._moonRing = new THREE.Mesh(moonRingGeo, this._moonRingMat);

    // ═══════════════════════════════════════════════════
    //  Assemble group
    // ═══════════════════════════════════════════════════
    this.group = new THREE.Group();
    this.group.position.copy(WORLD_POS);
    this.group.add(this.mesh);
    this.group.add(this._crescentCap);
    this.group.add(this._moonRing);
    for (const ring of this._coronaRings) {
      this.group.add(ring);
    }
    parentGroup.add(this.group);

    // ── Animation state ────────────────────────────────
    this._time = 0;
    this._hovered = false;

    // Store base opacities for hover boost
    this._coronaBaseOpacities = this._coronaRings.map(r => r.material.opacity);
    this._moonRingBaseOpacity = this._moonRingMat.opacity;

    // ── Theme change listener ──────────────────────────
    this._themeCleanup = onThemeChange(() => this._applyTheme());
    this._applyTheme();
  }

  /** Returns meshes for raycaster hit testing. */
  getRayTargets() {
    return [this.mesh];
  }

  /**
   * Set hover state — called each frame by HoverManager.
   * @param {boolean} hovered
   */
  applyHover(hovered) {
    this._hovered = hovered;
  }

  /** Handle a click — invoke the toggle callback with a pop animation. */
  handleClick() {
    const origScale = this.group.scale.clone();
    this.group.scale.set(1.5, 1.5, 1.5);
    setTimeout(() => {
      this.group.scale.copy(origScale);
    }, 180);
    this._onToggle?.();
  }

  /**
   * Per-frame update: pulse, rotate corona/moon rings, hover glow.
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    this._time += dt;

    // ── Hover glow lerp ────────────────────────────────
    const hoverTarget = this._hovered ? 1 : 0;
    if (this._hoverLerp === undefined) this._hoverLerp = 0;
    this._hoverLerp += (hoverTarget - this._hoverLerp) * 0.12;

    // Subtle breathing pulse + hover scale boost
    const pulse = 1 + Math.sin(this._time * 1.6) * 0.045;
    const hoverScale = 1 + this._hoverLerp * 0.25;
    this.mesh.scale.setScalar(pulse * hoverScale);

    const dark = document.documentElement.classList.contains('dark');

    if (dark) {
      // ── Moon mode ───────────────────────────────────
      this._moonRing.rotation.x += dt * 0.7;
      this._moonRing.rotation.y += dt * 0.5;
      this._moonRing.scale.setScalar(1 + Math.sin(this._time * 1.8) * 0.06);
      this._moonRingMat.opacity = this._moonRingBaseOpacity + this._hoverLerp * 0.25;
    } else {
      // ── Sun mode: spin corona rings at varied speeds ─
      for (let i = 0; i < this._coronaRings.length; i++) {
        const ring = this._coronaRings[i];
        ring.rotation.x += dt * ring.userData.speedX;
        ring.rotation.y += dt * ring.userData.speedY;
        ring.material.opacity = this._coronaBaseOpacities[i] + this._hoverLerp * 0.22;
      }
      this.mesh.material.opacity = 0.92 + this._hoverLerp * 0.08;
    }
  }

  /** Apply the current theme's appearance. */
  _applyTheme() {
    const dark = document.documentElement.classList.contains('dark');

    // Read current theme background colour for the crescent cap
    const style = getComputedStyle(document.documentElement);
    const bgHex = style.getPropertyValue('--bg').trim() || (dark ? '#0a0a0a' : '#ffffff');

    if (dark) {
      // ── Moon mode ────────────────────────────────────
      this.mesh.material = this._moonMat;
      this._moonMat.opacity = 0.9;
      this._crescentCapMat.color.set(bgHex);
      this._crescentCap.visible = true;
      this._moonRing.visible = true;
      this._moonRingMat.color.set(0xdce8f0);
      // Hide corona rings
      for (const ring of this._coronaRings) ring.visible = false;
    } else {
      // ── Sun mode ─────────────────────────────────────
      this.mesh.material = this._sunMat;
      this._sunMat.opacity = 0.92;
      this._crescentCap.visible = false;
      this._moonRing.visible = false;
      // Show corona rings, reset base opacities
      for (let i = 0; i < this._coronaRings.length; i++) {
        this._coronaRings[i].visible = true;
        this._coronaRings[i].material.opacity = this._coronaBaseOpacities[i];
      }
    }
  }

  /** Clean up all resources. */
  dispose() {
    if (this._themeCleanup) {
      this._themeCleanup();
      this._themeCleanup = null;
    }
    this._parentGroup.remove(this.group);
    this.mesh.geometry.dispose();
    this._sunMat.dispose();
    this._moonMat.dispose();
    this._crescentCap.geometry.dispose();
    this._crescentCapMat.dispose();
    this._moonRing.geometry.dispose();
    this._moonRingMat.dispose();
    for (const ring of this._coronaRings) {
      ring.geometry.dispose();
      ring.material.dispose();
    }
    this._coronaRings.length = 0;
  }
}
