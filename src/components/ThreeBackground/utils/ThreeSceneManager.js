import * as THREE from 'three';

class ThreeSceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.position.z = 5;
    this.scene.background = new THREE.Color(0x0a0c0e);
    this._targetBg = new THREE.Color(0x0a0c0e);
    document.body.appendChild(this.renderer.domElement);
    this._sceneRotation = { x: 0, y: 0 };

    this._onBgChange = (e) => {
      if (e.detail && e.detail.color) {
        this._targetBg = new THREE.Color(e.detail.color);
      }
    };
    window.addEventListener('three-bg-change', this._onBgChange);
  }

  lerpBackground(dt) {
    this.scene.background.lerp(this._targetBg, Math.min(1, dt * 3));
  }

  setSize(width, height) {
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    window.removeEventListener('three-bg-change', this._onBgChange);
    document.body.removeChild(this.renderer.domElement);
  }
}

export default ThreeSceneManager;
