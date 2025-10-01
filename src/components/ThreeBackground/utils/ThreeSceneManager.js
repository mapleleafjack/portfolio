import * as THREE from 'three';

class ThreeSceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.position.z = 5;
    this.scene.background = new THREE.Color(0x111111);
    document.body.appendChild(this.renderer.domElement);
    this._sceneRotation = { x: 0, y: 0 };
  }

  setSize(width, height) {
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    document.body.removeChild(this.renderer.domElement);
  }
}

export default ThreeSceneManager;
