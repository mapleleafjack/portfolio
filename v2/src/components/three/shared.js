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

// ── Theme helpers ─────────────────────────────────────

let _cachedDark = null;
let _lastDarkRead = 0;

/**
 * Returns true if dark mode is currently active.
 * Cached at the same interval as accent colour.
 */
export function isDarkMode() {
  const now = performance.now();
  if (_cachedDark !== null && now - _lastDarkRead < COLOR_CACHE_MS) {
    return _cachedDark;
  }
  _cachedDark = document.documentElement.classList.contains('dark');
  _lastDarkRead = now;
  return _cachedDark;
}

/**
 * Returns a THREE.Color appropriate for the current theme.
 * @param {string} lightHex — hex colour for light mode
 * @param {string} darkHex  — hex colour for dark mode
 * @returns {THREE.Color}
 */
export function getThemeColor(lightHex, darkHex) {
  return new THREE.Color(isDarkMode() ? darkHex : lightHex);
}

/**
 * Pre-defined theme-aware colour pairs for Three.js materials.
 * Each key maps to { light, dark } hex strings.
 */
export const THEME = {
  cubeDark:     { light: '#0a0a0a', dark: '#e0e0e0' },
  cubeGray:     { light: '#555555', dark: '#aaaaaa' },
  logoMaterial: { light: '#1a1a1a', dark: '#e5e5e5' },
  saucerBody:   { light: '#aaaaaa', dark: '#cccccc' },
  saucerRing:   { light: '#ffffff', dark: '#dddddd' },
  saucerEngine: { light: '#888888', dark: '#bbbbbb' },
};

/**
 * Register a callback to be invoked when the theme changes.
 * Uses a MutationObserver on <html> classList.
 * @param {() => void} callback
 * @returns {() => void} dispose function
 */
export function onThemeChange(callback) {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'class') {
        callback();
        return;
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
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
