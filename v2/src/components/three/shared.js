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
