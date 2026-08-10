/**
 * CockpitController — manages first-person flight mode for the flying saucer.
 *
 * Responsibilities:
 *  - Own all cockpit state (active, pointer lock, keys, cursor)
 *  - Create/manage DOM elements (crosshair, HUD hint, mobile HUD)
 *  - Handle all input: keyboard, mouse, touch, pointer lock
 *  - Per-frame: read input → apply throttle/dodge/turn to saucer
 *  - Delegate game camera to saucer
 *
 * Does NOT handle:
 *  - Crosshair raycast (done by the orchestrator using shared raycaster)
 *  - Subsystem updates, camera shake, rendering (orchestrator)
 *  - Mode transition detection (orchestrator)
 */

const SPRING_FORCE = 2.5;
const MAX_TURN_RATE = 3.0;
const MAX_PITCH_RATE = 2.2;
const DEAD_ZONE = 0.04;

export default class CockpitController {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.rendererDomElement — canvas for pointer lock / touch
   * @param {import('./FlyingSaucer').default} opts.saucer
   * @param {THREE.Camera} opts.camera — for resetting up vector on exit
   */
  constructor({ rendererDomElement, saucer, camera }) {
    this._domElement = rendererDomElement;
    this._saucer = saucer;
    this._camera = camera;

    // ── State ──────────────────────────────────────────
    this._active = false;
    this._pointerLocked = false;
    this._keysDown = new Set();
    this._isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Virtual cursor (pixels, springs toward center)
    this.cursorX = window.innerWidth / 2;
    this.cursorY = window.innerHeight / 2;

    // Mobile touch tracking
    this._mobileTouchId = null;
    this._mobileFireTouchId = null;

    // Callbacks (set by orchestrator before enter)
    this._onRequestExit = null;      // called when user requests exit (Escape, pointer lock loss)
    this._onExitTransitionStart = null; // called to capture exit transition state

    // ── DOM elements ───────────────────────────────────
    this._crosshairEl = null;
    this._hintEl = null;
    this._hintTimeout = null;
    this._mobileHudEl = null;

    // ── Bound handlers (for add/removeEventListener) ──
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
  }

  // ── Public API ──────────────────────────────────────

  get isActive() { return this._active; }
  get isMobile() { return this._isMobile; }

  /** Set callback invoked when user requests cockpit exit. */
  setOnRequestExit(fn) { this._onRequestExit = fn; }
  /** Set callback invoked just before exit (to capture exit transition state). */
  setOnExitTransitionStart(fn) { this._onExitTransitionStart = fn; }

  /** Enter cockpit mode — add listeners, show UI, request pointer lock. */
  enter() {
    if (this._active) return;
    this._active = true;

    this._saucer.setPlayerControlled(true);

    // Pointer events on canvas needed for pointer lock
    this._domElement.style.pointerEvents = 'auto';

    // Keyboard (shared across desktop + mobile)
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    if (this._isMobile) {
      // ── Mobile: direct touch control ──
      this._domElement.addEventListener('touchstart', this._onTouchStart, { passive: false });
      this._domElement.addEventListener('touchmove', this._onTouchMove, { passive: false });
      this._domElement.addEventListener('touchend', this._onTouchEnd);
      this._domElement.addEventListener('touchcancel', this._onTouchEnd);
      this._pointerLocked = true;
      this._showMobileHUD();
    } else {
      // ── Desktop: pointer lock for mouse look ──
      window.addEventListener('mousemove', this._onMouseMove, { passive: true });
      window.addEventListener('mousedown', this._onMouseDown);
      window.addEventListener('mouseup', this._onMouseUp);
      document.addEventListener('pointerlockchange', this._onPointerLockChange);
      this._pointerLocked = document.pointerLockElement === this._domElement;
    }

    // Reset input state
    this._keysDown.clear();
    this.cursorX = window.innerWidth / 2;
    this.cursorY = window.innerHeight / 2;
    this._saucer.setPlayerShootHeld(false);

    // UI
    document.body.classList.add('cockpit-active');
    this._showCrosshair();
    this._showCockpitHint();
  }

  /** Exit cockpit mode — remove listeners, hide UI, unlock pointer. */
  exit() {
    if (!this._active) return;
    this._active = false;

    this._saucer.setPlayerControlled(false);
    this._saucer.setPlayerShootHeld(false);

    // Unlock pointer (desktop only)
    if (!this._isMobile && document.pointerLockElement === this._domElement) {
      document.exitPointerLock();
    }
    this._pointerLocked = false;

    // Remove listeners
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    this._domElement.removeEventListener('touchstart', this._onTouchStart);
    this._domElement.removeEventListener('touchmove', this._onTouchMove);
    this._domElement.removeEventListener('touchend', this._onTouchEnd);
    this._domElement.removeEventListener('touchcancel', this._onTouchEnd);

    this._mobileTouchId = null;
    this._mobileFireTouchId = null;
    this._keysDown.clear();
    this.cursorX = window.innerWidth / 2;
    this.cursorY = window.innerHeight / 2;

    // Reset camera orientation
    this._camera.up.set(0, 1, 0);

    // Restore pointer events
    this._domElement.style.pointerEvents = 'none';

    // Signal exit transition start
    this._onExitTransitionStart?.();

    // Remove UI
    document.body.classList.remove('cockpit-active');
    this._removeCrosshair();
    this._removeCockpitHint();
    this._removeMobileHUD();
  }

  /**
   * Per-frame input processing.
   * Reads keyboard + virtual cursor → applies throttle/dodge/turn to saucer.
   * Does NOT apply game camera (orchestrator calls saucer.applyGameCamera directly).
   */
  update(dt) {
    if (!this._active) return;

    const saucer = this._saucer;

    // ── Keyboard → throttle ──
    const boosting = this._keysDown.has('KeyW');
    const braking = this._keysDown.has('KeyS');
    saucer.setPlayerThrottle(boosting, braking);

    // ── Keyboard → dodge ──
    const strafe = (this._keysDown.has('KeyD') ? 1 : 0) - (this._keysDown.has('KeyA') ? 1 : 0);
    const up = (this._keysDown.has('Space') ? 1 : 0)
      - (this._keysDown.has('ControlLeft') || this._keysDown.has('ControlRight') ? 1 : 0);

    // ── Virtual cursor → turn rate (spring physics) ──
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const hw = Math.max(window.innerWidth / 2, 1);
    const hh = Math.max(window.innerHeight / 2, 1);

    let nx = (this.cursorX - cx) / hw;
    let ny = (this.cursorY - cy) / hh;

    if (Math.abs(nx) < DEAD_ZONE) nx = 0;
    if (Math.abs(ny) < DEAD_ZONE) ny = 0;

    const yawRate = nx * MAX_TURN_RATE;
    const pitchRate = ny * MAX_PITCH_RATE;
    saucer.applyPlayerTurn(yawRate, pitchRate);

    // Spring: pull cursor back toward center (desktop only)
    if (!this._isMobile) {
      this.cursorX -= nx * SPRING_FORCE * 60 * dt;
      this.cursorY -= ny * SPRING_FORCE * 60 * dt;
    }

    // Update crosshair DOM position
    if (this._crosshairEl) {
      this._crosshairEl.style.left = this.cursorX + 'px';
      this._crosshairEl.style.top = this.cursorY + 'px';
    }

    // ── Apply dodge ──
    saucer.applyPlayerDodge(strafe, up, dt);
  }

  /** Clean up all resources (DOM, listeners). */
  dispose() {
    if (this._active) {
      // Force exit without calling callbacks (cleanup path)
      this._saucer.setPlayerControlled(false);
      this._saucer.setPlayerShootHeld(false);
    }
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    this._domElement.removeEventListener('touchstart', this._onTouchStart);
    this._domElement.removeEventListener('touchmove', this._onTouchMove);
    this._domElement.removeEventListener('touchend', this._onTouchEnd);
    this._domElement.removeEventListener('touchcancel', this._onTouchEnd);
    this._removeCrosshair();
    this._removeCockpitHint();
    this._removeMobileHUD();
    document.body.classList.remove('cockpit-active');
  }

  // ── DOM helpers ─────────────────────────────────────

  _showCrosshair() {
    this._removeCrosshair();
    this._crosshairEl = document.createElement('div');
    this._crosshairEl.className = 'cockpit-crosshair';
    this._crosshairEl.style.left = this.cursorX + 'px';
    this._crosshairEl.style.top = this.cursorY + 'px';
    const dot = document.createElement('div');
    dot.className = 'cockpit-crosshair-dot';
    this._crosshairEl.appendChild(dot);
    const ring = document.createElement('div');
    ring.className = 'cockpit-crosshair-ring';
    this._crosshairEl.appendChild(ring);
    document.body.appendChild(this._crosshairEl);
  }

  _removeCrosshair() {
    if (this._crosshairEl) { this._crosshairEl.remove(); this._crosshairEl = null; }
  }

  _showCockpitHint() {
    this._removeCockpitHint();
    this._hintEl = document.createElement('div');
    this._hintEl.className = 'cockpit-hint';
    if (this._isMobile) {
      this._hintEl.textContent = 'Drag to aim  •  ⚡ boost  •  🛑 brake  •  🔥 fire  •  ✕ to exit';
    } else {
      this._hintEl.textContent = 'Mouse to aim  •  W/S boost/brake  •  A/D dodge  •  Space/Ctrl ascend/descend  •  Click to fire  •  Esc to exit';
    }
    document.body.appendChild(this._hintEl);
    this._hintTimeout = setTimeout(() => {
      if (this._hintEl) {
        this._hintEl.style.opacity = '0';
        setTimeout(() => this._removeCockpitHint(), 1000);
      }
    }, 4000);
  }

  _removeCockpitHint() {
    if (this._hintTimeout) { clearTimeout(this._hintTimeout); this._hintTimeout = null; }
    if (this._hintEl) { this._hintEl.remove(); this._hintEl = null; }
  }

  // ── Mobile HUD ─────────────────────────────────────

  _showMobileHUD() {
    this._removeMobileHUD();
    this._mobileHudEl = document.createElement('div');
    this._mobileHudEl.className = 'cockpit-mobile-hud';

    // Exit button
    const exitBtn = document.createElement('button');
    exitBtn.className = 'cockpit-mobile-btn cockpit-mobile-exit';
    exitBtn.textContent = '✕ Exit';
    exitBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._onRequestExit?.();
    });
    this._mobileHudEl.appendChild(exitBtn);

    // Fire button
    const fireBtn = document.createElement('button');
    fireBtn.className = 'cockpit-mobile-btn cockpit-mobile-fire';
    fireBtn.textContent = '🔥';
    fireBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._mobileFireTouchId = e.changedTouches[0]?.identifier ?? 'fire';
      this._saucer.setPlayerShootHeld(true);
    });
    fireBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this._mobileFireTouchId = null;
      this._saucer.setPlayerShootHeld(false);
    });
    fireBtn.addEventListener('touchcancel', () => {
      this._mobileFireTouchId = null;
      this._saucer.setPlayerShootHeld(false);
    });
    this._mobileHudEl.appendChild(fireBtn);

    // Boost button
    const boostBtn = document.createElement('button');
    boostBtn.className = 'cockpit-mobile-btn cockpit-mobile-boost';
    boostBtn.textContent = '⚡';
    boostBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._keysDown.add('KeyW');
      this._saucer.setPlayerThrottle(true, false);
    });
    boostBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this._keysDown.delete('KeyW');
      this._saucer.setPlayerThrottle(false, this._keysDown.has('KeyS'));
    });
    boostBtn.addEventListener('touchcancel', () => {
      this._keysDown.delete('KeyW');
      this._saucer.setPlayerThrottle(false, this._keysDown.has('KeyS'));
    });
    this._mobileHudEl.appendChild(boostBtn);

    // Brake button
    const brakeBtn = document.createElement('button');
    brakeBtn.className = 'cockpit-mobile-btn cockpit-mobile-brake';
    brakeBtn.textContent = '🛑';
    brakeBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._keysDown.add('KeyS');
      this._saucer.setPlayerThrottle(this._keysDown.has('KeyW'), true);
    });
    brakeBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this._keysDown.delete('KeyS');
      this._saucer.setPlayerThrottle(this._keysDown.has('KeyW'), false);
    });
    brakeBtn.addEventListener('touchcancel', () => {
      this._keysDown.delete('KeyS');
      this._saucer.setPlayerThrottle(this._keysDown.has('KeyW'), false);
    });
    this._mobileHudEl.appendChild(brakeBtn);

    document.body.appendChild(this._mobileHudEl);
  }

  _removeMobileHUD() {
    if (this._mobileHudEl) { this._mobileHudEl.remove(); this._mobileHudEl = null; }
  }

  // ── Input handlers ──────────────────────────────────

  _onKeyDown(e) {
    this._keysDown.add(e.code);
    if (e.code === 'Escape') {
      this._onRequestExit?.();
      return;
    }
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ControlLeft', 'ControlRight'].includes(e.code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    this._keysDown.delete(e.code);
  }

  _onMouseMove(e) {
    if (!this._pointerLocked) return;
    this.cursorX += e.movementX;
    this.cursorY += e.movementY;
    this.cursorX = Math.max(0, Math.min(window.innerWidth, this.cursorX));
    this.cursorY = Math.max(0, Math.min(window.innerHeight, this.cursorY));
    if (this._crosshairEl) {
      this._crosshairEl.style.left = this.cursorX + 'px';
      this._crosshairEl.style.top = this.cursorY + 'px';
    }
  }

  _onMouseDown(e) {
    if (!this._pointerLocked) return;
    if (e.button === 0) {
      this._saucer.setPlayerShootHeld(true);
    }
  }

  _onMouseUp(e) {
    if (e.button === 0) {
      this._saucer.setPlayerShootHeld(false);
    }
  }

  _onPointerLockChange() {
    this._pointerLocked = document.pointerLockElement === this._domElement;
    if (!this._pointerLocked && this._active) {
      this._onRequestExit?.();
    }
  }

  // ── Mobile touch handlers ───────────────────────────

  _onTouchStart(e) {
    if (!this._active) return;
    e.preventDefault();
    if (this._mobileTouchId === null && e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      this._mobileTouchId = t.identifier;
      this.cursorX = t.clientX;
      this.cursorY = t.clientY;
      if (this._crosshairEl) {
        this._crosshairEl.style.left = this.cursorX + 'px';
        this._crosshairEl.style.top = this.cursorY + 'px';
      }
    }
  }

  _onTouchMove(e) {
    if (!this._active) return;
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this._mobileTouchId) {
        this.cursorX = t.clientX;
        this.cursorY = t.clientY;
        if (this._crosshairEl) {
          this._crosshairEl.style.left = this.cursorX + 'px';
          this._crosshairEl.style.top = this.cursorY + 'px';
        }
        break;
      }
    }
  }

  _onTouchEnd(e) {
    if (!this._active) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this._mobileTouchId) {
        this._mobileTouchId = null;
        break;
      }
    }
  }
}
