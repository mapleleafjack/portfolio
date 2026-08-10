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
  saucerBody:   { light: '#666666', dark: '#cccccc' },
  saucerRing:   { light: '#888888', dark: '#dddddd' },
  saucerEngine: { light: '#555555', dark: '#bbbbbb' },
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

// ── Galaxy colour state ──────────────────────────────
// Tracks which galaxy colour is active.  The saucer crossing the
// scene boundary cycles to the next colour, giving the impression
// of warping into a new galaxy.

const GALAXY_COLORS = [
  { hex: '#f0c830', name: 'Solar' },
  { hex: '#e05a2b', name: 'Ember' },
  { hex: '#d946ef', name: 'Nebula' },
  { hex: '#3b82f6', name: 'Azure' },
  { hex: '#10b981', name: 'Verdant' },
  { hex: '#8b5cf6', name: 'Void' },
  { hex: '#ef4444', name: 'Crimson' },
];

let _galaxyColorIndex = -1; // -1 means "not yet initialised"

/** @returns {{ hex: string, name: string }} current galaxy colour info */
export function getGalaxyColor() {
  if (_galaxyColorIndex < 0) {
    // First call — read whatever accent is currently applied
    const hex = document.documentElement.style.getPropertyValue('--accent').trim() || '#f0c830';
    const idx = GALAXY_COLORS.findIndex(c => c.hex.toLowerCase() === hex.toLowerCase());
    _galaxyColorIndex = idx >= 0 ? idx : 0;
  }
  return GALAXY_COLORS[_galaxyColorIndex];
}

/**
 * Cycle to the next galaxy colour.  Updates CSS custom properties
 * and flushes the accent-colour cache so every Three.js material
 * picks up the change next frame.
 * @returns {{ hex: string, name: string }} the newly-active galaxy colour
 */
export function cycleGalaxyColor() {
  // Ensure index is initialised from current CSS value before cycling
  if (_galaxyColorIndex < 0) getGalaxyColor();
  _galaxyColorIndex = (_galaxyColorIndex + 1) % GALAXY_COLORS.length;
  const c = GALAXY_COLORS[_galaxyColorIndex];

  // Update CSS custom properties
  const root = document.documentElement;
  root.style.setProperty('--accent', c.hex);
  const r = parseInt(c.hex.slice(1, 3), 16);
  const g = parseInt(c.hex.slice(3, 5), 16);
  const b = parseInt(c.hex.slice(5, 7), 16);
  root.style.setProperty('--accent-r', r);
  root.style.setProperty('--accent-g', g);
  root.style.setProperty('--accent-b', b);

  // Force accent-colour cache refresh
  _cachedColor = new THREE.Color(c.hex);
  _lastColorRead = performance.now();

  return c;
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
