import * as THREE from 'three';

const ROUTE_CAMERA_POSITIONS = {
  '/': { x: 0, y: 0, z: 5, lookAt: { x: 0, y: 0, z: 0 } },
  '/experience': { x: -3, y: 1, z: 6, lookAt: { x: -2, y: 0.5, z: 0 } },
  '/creative': { x: 3, y: 1, z: 6, lookAt: { x: 2, y: 0.5, z: 0 } },
  '/working-style': { x: -3, y: -1, z: 6, lookAt: { x: -2, y: -0.5, z: 0 } },
  '/contact': { x: 3, y: -1, z: 6, lookAt: { x: 2, y: -0.5, z: 0 } }
};

export default class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.targetPosition = new THREE.Vector3(0, 0, 5);
    this.targetLookAt = new THREE.Vector3(0, 0, 0);
    this.currentLookAt = new THREE.Vector3(0, 0, 0);
    this.isTransitioning = false;
    this.transitionSpeed = 0.03;
  }

  setRoute(route) {
    const config = ROUTE_CAMERA_POSITIONS[route] || ROUTE_CAMERA_POSITIONS['/'];
    
    this.targetPosition.set(config.x, config.y, config.z);
    this.targetLookAt.set(config.lookAt.x, config.lookAt.y, config.lookAt.z);
    this.isTransitioning = true;
  }

  focusOnPosition(worldPos) {
    const dir = new THREE.Vector3().subVectors(worldPos, new THREE.Vector3(0, 0, 0)).normalize();
    const camOffset = dir.multiplyScalar(2.5);
    this.targetPosition.set(
      worldPos.x + camOffset.x,
      worldPos.y + 0.5,
      worldPos.z + 3.5
    );
    this.targetLookAt.set(worldPos.x, worldPos.y, worldPos.z);
    this.isTransitioning = true;
  }

  resetToDefault() {
    const config = ROUTE_CAMERA_POSITIONS['/'];
    this.targetPosition.set(config.x, config.y, config.z);
    this.targetLookAt.set(config.lookAt.x, config.lookAt.y, config.lookAt.z);
    this.isTransitioning = true;
  }

  update(dt) {
    if (!this.isTransitioning) return;

    const positionDistance = this.camera.position.distanceTo(this.targetPosition);
    const lookAtDistance = this.currentLookAt.distanceTo(this.targetLookAt);
    
    if (positionDistance < 0.01 && lookAtDistance < 0.01) {
      this.camera.position.copy(this.targetPosition);
      this.currentLookAt.copy(this.targetLookAt);
      this.isTransitioning = false;
    } else {
      this.camera.position.lerp(this.targetPosition, this.transitionSpeed);
      this.currentLookAt.lerp(this.targetLookAt, this.transitionSpeed);
    }
    
    this.camera.lookAt(this.currentLookAt);
  }

  getIsTransitioning() {
    return this.isTransitioning;
  }
}
