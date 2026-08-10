import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { onThemeChange, THEME } from './shared';

const SPIN_DECAY = 0.94;       // per-frame decay factor for hit spin
const GLOW_DECAY = 0.92;       // per-frame decay for hit glow

/**
 * Manages the 3D extruded logo model (GLB) with a PNG texture overlay
 * on the front and back faces. Supports theme-aware material swapping
 * using real light/dark texture variants.
 *
 * The logo follows only user-driven rotation (no auto-drift) and
 * decays back to center after inactivity.
 *
 * In game/cockpit mode, the logo stays fixed in world space and
 * reacts to laser hits with a dramatic spin animation + glow flash.
 *
 * Follows the same vanilla-JS-class pattern as GalaxyEffect / FlyingSaucer.
 */
export default class LogoTrio {
  /**
   * @param {THREE.Scene} scene — the main scene (not sceneGroup, so logo
   *   rotation is independent of the background drift)
   */
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    const isMobile = window.innerWidth < 640;
    const logoY = 0.4;
    const logoScale = isMobile ? 0.75 : 1;
    this.group.position.set(0, logoY, 0);
    scene.add(this.group);

    // Dark material for the 3D extruded model (theme-aware)
    this._logoMaterial = new THREE.MeshBasicMaterial({ color: THEME.logoMaterial.light });

    // PNG textures for the detailed artwork overlay (light & dark variants)
    const loader = new THREE.TextureLoader();
    this._logoTextureLight = loader.load('/images/jackmusajo_black.png');
    this._logoTextureLight.colorSpace = THREE.SRGBColorSpace;
    this._logoTextureDark = loader.load('/images/jackmusajo_white.png');
    this._logoTextureDark.colorSpace = THREE.SRGBColorSpace;

    this._overlayMat = new THREE.MeshBasicMaterial({
      map: this._logoTextureLight,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
    });

    // GLTF loader — async, populates these refs when complete
    this._logoMesh = null;
    this._overlayGeo = null;
    this._overlayFront = null;
    this._overlayBack = null;
    this._ready = false;

    // ── Hit reaction state ──────────────────────────
    this._spinVelocity = new THREE.Vector3(0, 0, 0); // angular velocity (rad/s per axis)
    this._hitGlow = 0;                                // 0..1 glow intensity
    this._hitGlowMat = null;                          // glow overlay material
    this._hitGlowMesh = null;                         // glow overlay mesh

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/images/jackmusajo_logo_3d_model/jackmusajo_logo_extruded_160mm.glb',
      (gltf) => {
        this._logoMesh = gltf.scene;
        const box = new THREE.Box3().setFromObject(this._logoMesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        const targetWidth = 2.4 * logoScale;
        const scaleFactor = targetWidth / size.x;
        this._logoMesh.scale.set(scaleFactor, scaleFactor, scaleFactor * 0.15);

        // Center the model
        box.setFromObject(this._logoMesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        this._logoMesh.position.sub(center);

        this._logoMesh.traverse((child) => {
          if (child.isMesh) {
            child.material = this._logoMaterial;
          }
        });

        // Measure the scaled model to size the PNG overlay correctly
        const finalBox = new THREE.Box3().setFromObject(this._logoMesh);
        const finalSize = new THREE.Vector3();
        finalBox.getSize(finalSize);
        this._overlayGeo = new THREE.PlaneGeometry(finalSize.x, finalSize.y);
        this._overlayFront = new THREE.Mesh(this._overlayGeo, this._overlayMat);
        this._overlayBack = new THREE.Mesh(this._overlayGeo, this._overlayMat);
        this._overlayFront.position.set(0, 0, finalBox.max.z + 0.002);
        this._overlayBack.position.set(0, 0, finalBox.min.z - 0.002);

        this.group.add(this._logoMesh);
        this.group.add(this._overlayFront);
        this.group.add(this._overlayBack);

        // ── Hit glow overlay (invisible until hit) ──
        const glowGeo = new THREE.PlaneGeometry(finalSize.x * 1.15, finalSize.y * 1.15);
        this._hitGlowMat = new THREE.MeshBasicMaterial({
          color: 0xff4444,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        this._hitGlowMesh = new THREE.Mesh(glowGeo, this._hitGlowMat);
        this._hitGlowMesh.position.set(0, 0, finalBox.max.z + 0.004);
        this.group.add(this._hitGlowMesh);

        this._ready = true;

        // Apply initial theme
        this._applyTheme();
      }
    );

    // ── Theme change listener ──────────────────────────
    this._themeCleanup = onThemeChange(() => this._applyTheme());
  }

  /**
   * Swap logo material colour and PNG overlay between light and dark.
   * Uses real white/black texture assets instead of runtime inversion.
   */
  _applyTheme() {
    const dark = document.documentElement.classList.contains('dark');

    // Swap 3D extruded model material
    const matColor = dark ? THEME.logoMaterial.dark : THEME.logoMaterial.light;
    this._logoMaterial.color.set(matColor);

    // Swap PNG overlay texture — use the real white/black variants
    this._overlayMat.map = dark ? this._logoTextureDark : this._logoTextureLight;
    this._overlayMat.needsUpdate = true;
  }

  /** Whether the GLTF model has finished loading. */
  get ready() {
    return this._ready;
  }

  /**
   * Apply the smoothed user-driven rotation (no auto-drift component).
   * Used in normal (non-cockpit) mode.
   * @param {{ x: number, y: number }} smoothUserRotation
   */
  update(smoothUserRotation) {
    this.group.rotation.x = smoothUserRotation.x;
    this.group.rotation.y = smoothUserRotation.y;
  }

  /**
   * Game-mode update: apply spin physics + glow decay.
   * The logo stays in its fixed world position; only spin from laser hits.
   * @param {number} dt — delta time in seconds
   */
  updateGameMode(dt) {
    // Apply spin velocity as incremental rotation
    if (this._spinVelocity.lengthSq() > 0.0001) {
      const rx = this._spinVelocity.x * dt;
      const ry = this._spinVelocity.y * dt;
      const rz = this._spinVelocity.z * dt;
      this.group.rotateX(rx);
      this.group.rotateY(ry);
      this.group.rotateZ(rz);

      // Decay spin
      this._spinVelocity.multiplyScalar(SPIN_DECAY);
      if (this._spinVelocity.lengthSq() < 0.001) {
        this._spinVelocity.set(0, 0, 0);
      }
    }

    // Decay hit glow
    if (this._hitGlow > 0.001) {
      this._hitGlow *= GLOW_DECAY;
      if (this._hitGlowMat) {
        this._hitGlowMat.opacity = this._hitGlow * 0.5;
      }
    } else {
      this._hitGlow = 0;
      if (this._hitGlowMat) {
        this._hitGlowMat.opacity = 0;
      }
    }
  }

  /**
   * Trigger a dramatic spin + glow when the logo is hit by a laser.
   * @param {THREE.Vector3} [hitDirection] — optional world-space direction
   *   of the laser for directional spin (defaults to random if omitted).
   */
  hit(hitDirection) {
    // Strong random angular velocity kick
    const baseSpeed = 8 + Math.random() * 12; // rad/s
    if (hitDirection) {
      // Spin around the hit direction's perpendicular axes
      const dir = hitDirection.clone().normalize();
      this._spinVelocity.set(
        dir.y * baseSpeed * (Math.random() > 0.5 ? 1 : -1),
        dir.x * baseSpeed * (Math.random() > 0.5 ? 1 : -1),
        dir.z * baseSpeed * (Math.random() > 0.5 ? 1 : -1),
      );
    } else {
      this._spinVelocity.set(
        (Math.random() - 0.5) * baseSpeed * 2,
        (Math.random() - 0.5) * baseSpeed * 2,
        (Math.random() - 0.5) * baseSpeed * 2,
      );
    }

    // Flash glow
    this._hitGlow = 1.0;
    if (this._hitGlowMat) {
      this._hitGlowMat.opacity = 0.5;
      // Randomize glow color slightly for variety
      const hue = Math.random() < 0.5 ? 0xff4444 : 0xff8844;
      this._hitGlowMat.color.set(hue);
    }
  }

  /**
   * Reset all hit-reaction state — spin, glow, and rotation.
   * Called when exiting game/cockpit mode so the logo returns to its
   * default pose before normal-mode rotation takes over.
   */
  reset() {
    this._spinVelocity.set(0, 0, 0);
    this._hitGlow = 0;
    if (this._hitGlowMat) {
      this._hitGlowMat.opacity = 0;
    }
    this.group.rotation.set(0, 0, 0);
  }

  /**
   * Returns all meshes that should be tested by the raycaster
   * for laser hit detection in game mode.
   * @returns {THREE.Object3D[]}
   */
  getRayTargets() {
    const targets = [];
    if (this._logoMesh) {
      this._logoMesh.traverse((child) => {
        if (child.isMesh) targets.push(child);
      });
    }
    if (this._overlayFront) targets.push(this._overlayFront);
    if (this._overlayBack) targets.push(this._overlayBack);
    return targets;
  }

  /** Full cleanup of GLTF model, textures, materials, and geometries. */
  dispose() {
    if (this._themeCleanup) {
      this._themeCleanup();
      this._themeCleanup = null;
    }
    if (this._logoTextureDark) {
      this._logoTextureDark.dispose();
      this._logoTextureDark = null;
    }
    if (this._logoTextureLight) {
      this._logoTextureLight.dispose();
      this._logoTextureLight = null;
    }
    if (this._logoMesh) {
      this.group.remove(this._logoMesh);
      this._logoMesh.traverse((child) => {
        if (child.isMesh) child.geometry.dispose();
      });
    }
    if (this._overlayFront) this.group.remove(this._overlayFront);
    if (this._overlayBack) this.group.remove(this._overlayBack);
    if (this._hitGlowMesh) this.group.remove(this._hitGlowMesh);
    if (this._overlayGeo) this._overlayGeo.dispose();
    this._overlayMat.dispose();
    if (this._hitGlowMat) this._hitGlowMat.dispose();
    this.scene.remove(this.group);
    this._logoMaterial.dispose();
  }
}
