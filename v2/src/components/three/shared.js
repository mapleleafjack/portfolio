import * as THREE from 'three';

// ── Accent colour cache ───────────────────────────────
// getComputedStyle() forces a style recalculation — extremely
// expensive when called 60×/sec in the animation loop.
// Cache the result and only re-read at most every 500ms.
let _cachedColor = null;
let _lastColorRead = 0;
const COLOR_CACHE_MS = 500;

/**
 * Read the current accent colour from CSS custom properties (--accent).
 * Cached: calls getComputedStyle at most once every 500ms.
 * Shared across all Three.js scene modules.
 */
export function getAccentColor() {
  const now = performance.now();
  if (_cachedColor && now - _lastColorRead < COLOR_CACHE_MS) {
    return _cachedColor.clone();
  }
  const style = getComputedStyle(document.documentElement);
  const hex = style.getPropertyValue('--accent').trim() || '#f0c830';
  _cachedColor = new THREE.Color(hex);
  _lastColorRead = now;
  return _cachedColor.clone();
}

// ── Torus params diffing ──────────────────────────────

const PARAMS_KEYS = ['p', 'q', 'color', 'radius', 'tube', 'metalness', 'roughness',
  'spinSpeed', 'showWireframe', 'showFieldLines', 'showLattice',
  'fieldLineCount', 'particleSpeed', 'morphValue'];

/**
 * Fast shallow-compare of torus params — avoids JSON.stringify + GC every frame.
 * @param {object} a
 * @param {object} b
 * @returns {boolean} true if any key differs
 */
export function paramsChanged(a, b) {
  for (let i = 0; i < PARAMS_KEYS.length; i++) {
    if (a[PARAMS_KEYS[i]] !== b[PARAMS_KEYS[i]]) return true;
  }
  return false;
}

// ── Camera shake ──────────────────────────────────────

/**
 * Apply a random camera shake, render, then restore.
 * @param {THREE.Camera} camera
 * @param {number} shakeAmount — intensity (0 = none)
 * @param {THREE.Scene} scene
 * @param {THREE.WebGLRenderer} renderer
 */
export function renderWithShake(camera, shakeAmount, scene, renderer) {
  if (shakeAmount <= 0.001) {
    renderer.render(scene, camera);
    return;
  }
  const sx = (Math.random() - 0.5) * 2 * shakeAmount;
  const sy = (Math.random() - 0.5) * 2 * shakeAmount;
  camera.position.x += sx;
  camera.position.y += sy;
  renderer.render(scene, camera);
  camera.position.x -= sx;
  camera.position.y -= sy;
}
