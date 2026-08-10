import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * PostProcessing — renders the bloom scene through EffectComposer.
 * Does NOT handle overlay compositing — that's done explicitly in
 * ThreeBackground so the render pipeline is easy to reason about.
 */
export default class PostProcessing {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.Scene} bloomScene — scene containing bloom-able objects
   * @param {THREE.Camera} camera
   * @param {number} width
   * @param {number} height
   */
  constructor(renderer, bloomScene, camera, width, height) {
    this._camera = camera;

    this._composer = new EffectComposer(renderer);
    this._composer.addPass(new RenderPass(bloomScene, camera));

    this._bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.3,   // strength
      0.4,   // radius
      0.75,  // threshold
    );
    this._composer.addPass(this._bloomPass);

    this._composer.addPass(new OutputPass());
  }

  /**
   * Render bloom scene through composer with optional screen shake.
   * Returns shake undo info so the caller can apply the same shake
   * to a follow-up direct render if needed.
   * @param {number} [shakeAmount=0]
   */
  render(shakeAmount = 0) {
    if (shakeAmount > 0.001) {
      const sx = (Math.random() - 0.5) * 2 * shakeAmount;
      const sy = (Math.random() - 0.5) * 2 * shakeAmount;
      this._camera.position.x += sx;
      this._camera.position.y += sy;
      this._composer.render();
      this._camera.position.x -= sx;
      this._camera.position.y -= sy;
    } else {
      this._composer.render();
    }
  }

  setSize(width, height) {
    this._composer.setSize(width, height);
    this._bloomPass.resolution.set(width, height);
  }

  /** @param {number} s — bloom strength (0–1) */
  setBloomStrength(s) { this._bloomPass.strength = s; }

  /** @param {number} t — luminance threshold (0–1) */
  setBloomThreshold(t) { this._bloomPass.threshold = t; }

  dispose() {}
}


