import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Manages the 3D extruded logo model (GLB) with a PNG texture overlay
 * on the front and back faces.
 *
 * The logo follows only user-driven rotation (no auto-drift) and
 * decays back to center after inactivity.
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

    // Dark material for the 3D extruded model
    this._logoMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });

    // PNG texture for the detailed artwork overlay
    this._logoTexture = new THREE.TextureLoader().load('/images/jackmusajo_black.png');
    this._logoTexture.colorSpace = THREE.SRGBColorSpace;
    this._overlayMat = new THREE.MeshBasicMaterial({
      map: this._logoTexture,
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
        this._ready = true;
      }
    );
  }

  /** Whether the GLTF model has finished loading. */
  get ready() {
    return this._ready;
  }

  /**
   * Apply the smoothed user-driven rotation (no auto-drift component).
   * @param {{ x: number, y: number }} smoothUserRotation
   */
  update(smoothUserRotation) {
    this.group.rotation.x = smoothUserRotation.x;
    this.group.rotation.y = smoothUserRotation.y;
  }

  /** Full cleanup of GLTF model, textures, materials, and geometries. */
  dispose() {
    if (this._logoMesh) {
      this.group.remove(this._logoMesh);
      this._logoMesh.traverse((child) => {
        if (child.isMesh) child.geometry.dispose();
      });
    }
    if (this._overlayFront) this.group.remove(this._overlayFront);
    if (this._overlayBack) this.group.remove(this._overlayBack);
    if (this._overlayGeo) this._overlayGeo.dispose();
    this._overlayMat.dispose();
    this._logoTexture.dispose();
    this.scene.remove(this.group);
    this._logoMaterial.dispose();
  }
}
