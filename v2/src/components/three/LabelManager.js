/**
 * LabelManager — star-map-style 3D hover labels via CSS2DRenderer.
 *
 * Each interactive object (torus, saucer, theme toggle) gets:
 *   - A thin connector line (THREE.Line) from the object to an offset point below
 *   - A CSS2DObject label with constant-size readable text
 *   - A tiny anchor dot at the object's position
 *
 * Labels appear on hover, persist while hovering, and fade out 2 s after unhover.
 * Re-hovering during the fade-out resets visibility immediately.
 *
 * Follows the vanilla-JS-class pattern (HoverManager / CubeField style).
 */
import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { getAccentColor, isDarkMode } from './shared';

// ── Per-label configuration ──────────────────────────────
const H_OFFSET = 0.25;       // horizontal nudge (world-space X) before vertical drop

const LABEL_DEFS = [
  {
    key: 'torus',
    name: 'Torus',
    offsetY: -0.35,          // world-space Y offset (below object)
    dotColor: null,           // null → use accent colour
  },
  {
    key: 'saucer',
    name: 'Flying Saucer',
    offsetY: -0.45,
    dotColor: 0x88ccff,
  },
  {
    key: 'toggle',
    name: 'Sun / Moon',
    offsetY: -0.30,
    dotColor: 0xf5c842,
  },
];

// ── Small shared geometries ─────────────────────────────
const DOT_GEO = new THREE.SphereGeometry(0.04, 8, 8);
const DOT_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, depthWrite: false });
const LINE_MAT = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.55,
  depthTest: false,
  depthWrite: false,
});

// ── CSS label HTML (created once, cloned per label) ─────
function buildLabelHTML(name) {
  const container = document.createElement('div');
  container.className = 'label-3d';

  const dot = document.createElement('span');
  dot.className = 'label-3d-dot';
  container.appendChild(dot);

  const text = document.createElement('span');
  text.className = 'label-3d-text';
  text.textContent = name;
  container.appendChild(text);

  return container;
}

// ── State constants ─────────────────────────────────────
const HIDDEN    = 0;
const APPEARING = 1;   // line draws in + text slides up
const VISIBLE   = 2;
const FADING    = 3;

const APPEAR_DURATION = 0.35;  // seconds for line + text to draw in
const FADE_DELAY      = 2.0;   // seconds before fade starts after unhover
const FADE_DURATION    = 0.5;  // seconds for opacity to go from 1 → 0


export default class LabelManager {
  /**
   * @param {import('./TorusKnot').default} torusKnot
   * @param {import('./FlyingSaucer').default} saucer
   * @param {import('./ThemeToggle').default} themeToggle
   * @param {THREE.Scene} mainScene — the main WebGL scene (for connector lines & dots)
   * @param {THREE.Camera} camera — the main perspective camera
   */
  constructor(torusKnot, saucer, themeToggle, mainScene, camera) {
    this._torusKnot = torusKnot;
    this._saucer = saucer;
    this._themeToggle = themeToggle;
    this._mainScene = mainScene;
    this._camera = camera;

    // ── Separate scene for CSS2D objects ──────────────
    this._cssScene = new THREE.Scene();

    // ── Object references lookup ──────────────────────
    this._objects = {
      torus: torusKnot,
      saucer,
      toggle: themeToggle,
    };

    // ── Per-label runtime state ───────────────────────
    /** @type {Map<string, {
     *   def: object,
     *   state: number,
     *   appearProgress: number,  // 0 → 1 during APPEARING
     *   fadeTimer: number,       // seconds remaining before fade begins
     *   fadeProgress: number,    // 0 = visible, 1 = fully hidden
     *   currentOpacity: number,  // lerped 0–1
     *   line: THREE.Line,
     *   dot: THREE.Mesh,
     *   cssObj: CSS2DObject,
     *   cssEl: HTMLElement,
     *   lineMat: THREE.LineBasicMaterial,
     *   dotMat: THREE.MeshBasicMaterial,
     * }>} */
    this._labels = new Map();

    // ── Build each label ──────────────────────────────
    for (const def of LABEL_DEFS) {
      this._buildLabel(def);
    }
  }

  // ═══════════════════════════════════════════════════════
  //  BUILD
  // ═══════════════════════════════════════════════════════

  _buildLabel(def) {
    // ── Connector line (L-shape: anchor → corner → label) ─
    const lineGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(9); // 3 points × 3
    lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const lineMat = LINE_MAT.clone();
    const line = new THREE.Line(lineGeo, lineMat);
    line.visible = false;
    this._mainScene.add(line);

    // ── Anchor dot ────────────────────────────────────
    const dotMat = DOT_MAT.clone();
    dotMat.color.set(def.dotColor || getAccentColor());
    const dot = new THREE.Mesh(DOT_GEO, dotMat);
    dot.visible = false;
    this._mainScene.add(dot);

    // ── CSS label ─────────────────────────────────────
    const el = buildLabelHTML(def.name);
    const cssObj = new CSS2DObject(el);
    cssObj.visible = false;
    el.style.opacity = '0';
    this._cssScene.add(cssObj);

    // ── Store state ───────────────────────────────────
    this._labels.set(def.key, {
      def,
      state: HIDDEN,
      appearProgress: 0,
      fadeTimer: 0,
      fadeProgress: 0,
      currentOpacity: 0,
      line,
      dot,
      cssObj,
      cssEl: el,
      lineMat,
      dotMat,
    });
  }

  // ═══════════════════════════════════════════════════════
  //  UPDATE (called each frame)
  // ═══════════════════════════════════════════════════════

  /**
   * @param {{ hitTorus: boolean, hitSaucer: boolean, hitToggle: boolean }} hoverState
   * @param {number} dt — delta time in seconds
   * @param {boolean} hideAll — force-hide all labels (explore mode / cockpit)
   */
  update(hoverState, dt, hideAll = false) {
    const hoverMap = {
      torus: hoverState.hitTorus,
      saucer: hoverState.hitSaucer,
      toggle: hoverState.hitToggle,
    };

    for (const [key, label] of this._labels) {
      const hovered = hoverMap[key] && !hideAll;
      this._updateLabelState(label, hovered, dt);
      this._updateLabelGeometry(label, key, dt);
    }
  }

  /**
   * Advance the visibility state machine for one label.
   *
   *   HIDDEN  ──hover──→  APPEARING  ──done──→  VISIBLE
   *   FADING  ──hover──→  APPEARING  (restart anim)
   *   APPEARING / VISIBLE  ──!hover──→  FADING
   *   FADING  ──!hover──→  HIDDEN
   */
  _updateLabelState(label, hovered, dt) {
    if (hovered) {
      if (label.state === HIDDEN || label.state === FADING) {
        // Start (or restart) the appear animation
        label.state = APPEARING;
        label.appearProgress = 0;
        label.fadeTimer = 0;
        label.fadeProgress = 0;
      } else if (label.state === APPEARING) {
        // Continue drawing in
        label.appearProgress += dt / APPEAR_DURATION;
        if (label.appearProgress >= 1) {
          label.appearProgress = 1;
          label.state = VISIBLE;
        }
      }
      // VISIBLE + hovered → stay visible (nothing to do)
    } else {
      // Not hovered
      if (label.state === APPEARING || label.state === VISIBLE) {
        // Start fading out
        label.state = FADING;
        label.fadeTimer = FADE_DELAY;
      } else if (label.state === FADING) {
        // Count down delay, then fade
        if (label.fadeTimer > 0) {
          label.fadeTimer -= dt;
          if (label.fadeTimer <= 0) label.fadeTimer = 0;
        } else {
          label.fadeProgress += dt / FADE_DURATION;
          if (label.fadeProgress >= 1) {
            label.fadeProgress = 1;
            label.state = HIDDEN;
          }
        }
      }
      // HIDDEN → nothing to do
    }
  }

  /**
   * Compute target opacity from current state, then lerp.
   * Uses framerate-independent exponential decay.
   * During APPEARING the text fades in slightly ahead of the line.
   */
  _computeOpacity(label, dt) {
    let targetOpacity;
    if (label.state === APPEARING) {
      // Text fades in with a head-start (appearProgress 0→0.7 maps to opacity 0→1)
      targetOpacity = Math.min(label.appearProgress / 0.7, 1);
    } else if (label.state === VISIBLE) {
      targetOpacity = 1;
    } else if (label.state === FADING) {
      if (label.fadeTimer > 0) {
        targetOpacity = 1; // still in delay phase
      } else {
        targetOpacity = 1 - label.fadeProgress; // fading out
      }
    } else {
      targetOpacity = 0; // HIDDEN
    }
    // Exponential decay lerp (framerate-independent)
    const speed = (label.state === APPEARING || label.state === VISIBLE) ? 12 : 6;
    const factor = 1 - Math.exp(-speed * dt);
    label.currentOpacity += (targetOpacity - label.currentOpacity) * factor;
    // Snap near extremities
    if (label.currentOpacity < 0.005) label.currentOpacity = 0;
    if (label.currentOpacity > 0.995) label.currentOpacity = 1;
  }

  /**
   * Update line geometry, dot position, and CSS2DObject world position.
   *
   * L-shaped connector:   anchor ●──→ corner ──→ label text
   *                           (horizontal)  (vertical)
   */
  _updateLabelGeometry(label, key, dt) {
    const obj = this._objects[key];
    const def = label.def;

    // ── Get world position ────────────────────────────
    const worldPos = new THREE.Vector3();
    obj.group.getWorldPosition(worldPos);

    // ── L-shape points ───────────────────────────────
    //   anchor → horizontal nudge → vertical drop → label
    const anchor  = worldPos.clone();
    const corner  = new THREE.Vector3(worldPos.x + H_OFFSET, worldPos.y, worldPos.z);
    const labelPt = new THREE.Vector3(worldPos.x + H_OFFSET, worldPos.y + def.offsetY, worldPos.z);

    // ── Appear progress (0 → 1, only during APPEARING) ──
    let drawT = 1; // default: fully drawn
    if (label.state === APPEARING) {
      drawT = label.appearProgress;
    } else if (label.state === HIDDEN) {
      drawT = 0;
    }

    // ── Opacity ──────────────────────────────────────
    this._computeOpacity(label, dt);
    const alpha = label.currentOpacity;

    // ── Visibility ───────────────────────────────────
    const show = alpha > 0.001;
    label.line.visible = show;
    label.dot.visible = show;
    label.cssObj.visible = show;

    // ── CSS text animation class ─────────────────────
    if (label.state === APPEARING) {
      label.cssEl.classList.add('label-3d--appearing');
    } else {
      label.cssEl.classList.remove('label-3d--appearing');
    }

    if (!show) {
      label.cssEl.style.opacity = '0';
      label.cssEl.classList.remove('label-3d--appearing');
      return;
    }

    // ── Animate line vertices based on drawT ─────────
    //   drawT 0.0  →  all 3 points at anchor (invisible)
    //   drawT 0.5  →  horizontal segment fully drawn, vertical at anchor
    //   drawT 1.0  →  full L-shape drawn
    const posArr = label.line.geometry.attributes.position.array;

    // Point 0: anchor (always at anchor)
    posArr[0] = anchor.x;
    posArr[1] = anchor.y;
    posArr[2] = anchor.z;

    // Point 1: corner — interpolates along horizontal from anchor
    const hT = Math.min(drawT / 0.5, 1); // first half of animation = horizontal
    const interpCorner = new THREE.Vector3().lerpVectors(anchor, corner, hT);
    posArr[3] = interpCorner.x;
    posArr[4] = interpCorner.y;
    posArr[5] = interpCorner.z;

    // Point 2: label — interpolates along vertical from corner position
    const vT = drawT <= 0.5 ? 0 : (drawT - 0.5) / 0.5; // second half = vertical
    const cornerNow = interpCorner.clone();
    const interpLabel = new THREE.Vector3().lerpVectors(cornerNow, labelPt, vT);
    posArr[6] = interpLabel.x;
    posArr[7] = interpLabel.y;
    posArr[8] = interpLabel.z;

    label.line.geometry.attributes.position.needsUpdate = true;

    // ── Update dot position ──────────────────────────
    label.dot.position.copy(anchor);

    // ── Update CSS2DObject position (follows label point) ─
    label.cssObj.position.copy(interpLabel);

    // ── Apply opacity ────────────────────────────────
    label.lineMat.opacity = 0.55 * alpha;
    label.dot.material.opacity = alpha;
    label.cssEl.style.opacity = String(Math.round(alpha * 100) / 100);

    // ── Dot colour — refresh accent per frame ────────
    if (!def.dotColor) {
      label.dotMat.color.copy(getAccentColor());
    }

    // ── Theme-aware colours ─────────────────────────
    this._applyThemeColors(label);
  }

  /**
   * Update line and CSS text colours based on current theme.
   * Dark mode → white lines / white text.
   * Light mode → dark grey lines / near-black text.
   */
  _applyThemeColors(label) {
    const dark = isDarkMode();
    const lineHex = dark ? 0xffffff : 0x333333;
    const textColor = dark ? '#ffffff' : '#1a1a1a';
    const textShadow = dark
      ? '0 0 8px rgba(255,255,255,0.35), 0 0 2px rgba(255,255,255,0.15)'
      : '0 0 4px rgba(0,0,0,0.10), 0 0 1px rgba(0,0,0,0.08)';

    label.lineMat.color.set(lineHex);
    label.cssEl.style.color = textColor;
    label.cssEl.style.textShadow = textShadow;
  }

  // ═══════════════════════════════════════════════════════
  //  PUBLIC
  // ═══════════════════════════════════════════════════════

  /** Returns the CSS scene to be rendered by CSS2DRenderer. */
  getScene() {
    return this._cssScene;
  }

  /**
   * Immediately hide all labels (no fade-out).
   * Called when an object is clicked (torus zoom, cockpit entry, theme toggle).
   */
  dismissAll() {
    for (const [, label] of this._labels) {
      label.state = HIDDEN;
      label.appearProgress = 0;
      label.fadeTimer = 0;
      label.fadeProgress = 0;
      label.currentOpacity = 0;
      label.line.visible = false;
      label.dot.visible = false;
      label.cssObj.visible = false;
      label.cssEl.style.opacity = '0';
      label.cssEl.classList.remove('label-3d--appearing');
    }
  }

  /** Clean up all resources. */
  dispose() {
    for (const [, label] of this._labels) {
      // Remove from scenes
      this._mainScene.remove(label.line);
      this._mainScene.remove(label.dot);
      this._cssScene.remove(label.cssObj);

      // Dispose geometries & materials
      label.line.geometry.dispose();
      label.lineMat.dispose();
      // DOT_GEO and DOT_MAT are shared — don't dispose here
      // (they'll be garbage-collected when the module unloads)
    }
    this._labels.clear();
  }
}
