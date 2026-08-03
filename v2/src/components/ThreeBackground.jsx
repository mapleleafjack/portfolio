import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getAccentColor } from './three/shared';
import CubeField from './three/CubeField';
import LogoTrio from './three/LogoTrio';
import TorusKnot from './three/TorusKnot';
import SceneCamera from './three/SceneCamera';
import GalaxyManager from './three/GalaxyEffect';
import FlyingSaucer from './three/FlyingSaucer';

/**
 * ThreeBackground — thin orchestrator for the full-screen 3D scene.
 *
 * Responsibilities:
 *  - Create scene, camera, renderer, and sceneGroup
 *  - Wire together all managers (CubeField, LogoTrio, TorusKnot,
 *    SceneCamera, GalaxyManager, FlyingSaucer)
 *  - Run the animation loop, calling each manager's update()
 *  - Handle raycaster hover across cubes + torus
 *  - Delegate torus clicks → zoom-in (preview) or marker drag (explore)
 *  - Smooth camera zoom / rotation lerp on mode transitions
 *  - Handle window resize
 *  - Clean up all resources on unmount
 */
export default function ThreeBackground({
  torusParams = null,
  torusFocused = false,
  onTorusClick = null,
  onTorusParamsChange = null,
  saucerFocused = false,
  onSaucerEnter = null,
  onSaucerExit = null,
}) {
  const containerRef = useRef(null);

  // ── Stable refs (avoid re-running the Three.js effect) ──
  const onTorusClickRef = useRef(onTorusClick);
  const torusParamsRef = useRef(torusParams);
  const torusFocusedRef = useRef(torusFocused);
  const onTorusParamsChangeRef = useRef(onTorusParamsChange);
  const saucerFocusedRef = useRef(saucerFocused);
  const onSaucerEnterRef = useRef(onSaucerEnter);
  const onSaucerExitRef = useRef(onSaucerExit);

  if (onTorusClickRef.current !== onTorusClick) onTorusClickRef.current = onTorusClick;
  torusParamsRef.current = torusParams;
  torusFocusedRef.current = torusFocused;
  onTorusParamsChangeRef.current = onTorusParamsChange;
  saucerFocusedRef.current = saucerFocused;
  onSaucerEnterRef.current = onSaucerEnter;
  onSaucerExitRef.current = onSaucerExit;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene setup ──────────────────────────────────────
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    renderer.domElement.style.pointerEvents = 'none';

    // OrbitControls for torus explore mode (disabled in galaxy view)
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enabled = false;
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.minDistance = 2;
    orbitControls.maxDistance = 12;

    // Scene group — rotated on drag instead of moving the camera
    const sceneGroup = new THREE.Group();
    scene.add(sceneGroup);

    // ── Raycaster (shared for hover + click + marker drag) ──
    const raycaster = new THREE.Raycaster();
    let hoveredCube = null;

    // ── Instantiate all managers ────────────────────────
    const cubeField = new CubeField(sceneGroup);
    const logoTrio = new LogoTrio(scene);
    const torusKnot = new TorusKnot(sceneGroup, torusParamsRef.current || {});
    const galaxyManager = new GalaxyManager(sceneGroup);
    const saucer = new FlyingSaucer(sceneGroup, cubeField.getCubes(), galaxyManager);

    // ── Focus transition state ──────────────────────────
    let _wasFocused = false;
    // Smooth camera targets — eliminates jump by interpolating both position + lookAt
    const _smoothLookTarget = new THREE.Vector3(0, 0, 0);
    const _smoothCamTarget = new THREE.Vector3(0, 0, 5);
    // Zoom-in transition timer
    let _transitionElapsed = 0;
    // Zoom-out (exit) transition state — only active after first explore entry
    let _hasEverEnteredExplore = false;
    let _exitTransitionElapsed = 0;
    const _exitStartCam = new THREE.Vector3();
    const _exitStartLook = new THREE.Vector3();
    // Zoom-in transition: captured start distance & approach direction
    let _zoomStartDist = 7.5;
    const _approachDir = new THREE.Vector3();

    // ── Shared easing helper ──────────────────────────
    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // ── Cockpit mode state ────────────────────────────
    let _cockpitActive = false;
    let _pointerLocked = false;
    const _keysDown = new Set();
    /** Virtual cursor position (pixels, relative to window). Springs toward center. */
    let _cursorX = window.innerWidth / 2;
    let _cursorY = window.innerHeight / 2;
    const SPRING_FORCE = 2.5;    // how strongly cursor pulls back to center
    const MAX_TURN_RATE = 3.0;   // max yaw rate at screen edge (rad/s)
    const MAX_PITCH_RATE = 2.2;  // max pitch rate at screen edge (rad/s)
    const DEAD_ZONE = 0.04;      // normalized dead zone near center

    /** Enter cockpit: enable player control, lock pointer, add listeners. */
    function _enterCockpit() {
      if (_cockpitActive) return;
      _cockpitActive = true;
      saucer.setPlayerControlled(true);
      // Disable normal camera systems
      sceneCamera.setDriftEnabled(false);
      orbitControls.enabled = false;
      renderer.domElement.style.pointerEvents = 'auto';
      // Keyboard listeners
      window.addEventListener('keydown', _onKeyDown);
      window.addEventListener('keyup', _onKeyUp);
      // Mouse look (only fires when pointer-locked)
      window.addEventListener('mousemove', _onMouseMove, { passive: true });
      // Fire via mouse
      window.addEventListener('mousedown', _onMouseDownCockpit);
      window.addEventListener('mouseup', _onMouseUpCockpit);
      // Pointer lock change listener
      document.addEventListener('pointerlockchange', _onPointerLockChange);
      // Check if pointer lock was already granted (race condition)
      _pointerLocked = document.pointerLockElement === renderer.domElement;
      // Clear any stale input
      _keysDown.clear();
      _cursorX = window.innerWidth / 2;
      _cursorY = window.innerHeight / 2;
      saucer.setPlayerShootHeld(false);
      // Crosshair + HUD
      document.body.classList.add('cockpit-active');
      _showCrosshair();
      _showCockpitHint();
      // Ensure smooth exit transition back to galaxy view
      _hasEverEnteredExplore = true;
    }

    /** Exit cockpit: disable player control, unlock pointer, remove listeners. */
    function _exitCockpit() {
      if (!_cockpitActive) return;
      _cockpitActive = false;
      saucer.setPlayerControlled(false);
      saucer.setPlayerShootHeld(false);
      // Unlock pointer if still locked
      if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock();
      }
      _pointerLocked = false;
      // Remove listeners
      window.removeEventListener('keydown', _onKeyDown);
      window.removeEventListener('keyup', _onKeyUp);
      window.removeEventListener('mousemove', _onMouseMove);
      window.removeEventListener('mousedown', _onMouseDownCockpit);
      window.removeEventListener('mouseup', _onMouseUpCockpit);
      document.removeEventListener('pointerlockchange', _onPointerLockChange);
      _keysDown.clear();
      _cursorX = window.innerWidth / 2;
      _cursorY = window.innerHeight / 2;
      // Restore normal camera
      sceneCamera.setDriftEnabled(true);
      renderer.domElement.style.pointerEvents = 'none';
      // Smooth return transition
      _exitTransitionElapsed = 0;
      _exitStartCam.copy(camera.position);
      _exitStartLook.copy(_smoothLookTarget);
      // Remove crosshair
      document.body.classList.remove('cockpit-active');
      _removeCrosshair();
      _removeCockpitHint();
    }

    /** Show/hide the game-style crosshair element. */
    let _crosshairEl = null;
    function _showCrosshair() {
      _removeCrosshair();
      _crosshairEl = document.createElement('div');
      _crosshairEl.className = 'cockpit-crosshair';
      _crosshairEl.style.left = _cursorX + 'px';
      _crosshairEl.style.top = _cursorY + 'px';
      const dot = document.createElement('div');
      dot.className = 'cockpit-crosshair-dot';
      _crosshairEl.appendChild(dot);
      const ring = document.createElement('div');
      ring.className = 'cockpit-crosshair-ring';
      _crosshairEl.appendChild(ring);
      document.body.appendChild(_crosshairEl);
    }
    function _removeCrosshair() {
      if (_crosshairEl) { _crosshairEl.remove(); _crosshairEl = null; }
    }

    /** Show a temporary HUD hint at the bottom of the screen. */
    let _hintEl = null;
    let _hintTimeout = null;
    function _showCockpitHint() {
      _removeCockpitHint();
      _hintEl = document.createElement('div');
      _hintEl.className = 'cockpit-hint';
      _hintEl.textContent = 'Mouse to aim  •  W/S boost/brake  •  A/D dodge  •  Space/Ctrl ascend/descend  •  Click to fire  •  Esc to exit';
      document.body.appendChild(_hintEl);
      _hintTimeout = setTimeout(() => {
        if (_hintEl) {
          _hintEl.style.opacity = '0';
          setTimeout(() => _removeCockpitHint(), 1000);
        }
      }, 4000);
    }
    function _removeCockpitHint() {
      if (_hintTimeout) { clearTimeout(_hintTimeout); _hintTimeout = null; }
      if (_hintEl) { _hintEl.remove(); _hintEl = null; }
    }

    // ── Cockpit input handlers ────────────────────────
    function _onKeyDown(e) {
      _keysDown.add(e.code);
      // Escape exits cockpit
      if (e.code === 'Escape') {
        onSaucerExitRef.current?.();
        return;
      }
      // Prevent default for game keys
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ControlLeft', 'ControlRight'].includes(e.code)) {
        e.preventDefault();
      }
    }
    function _onKeyUp(e) {
      _keysDown.delete(e.code);
    }
    function _onMouseMove(e) {
      if (!_pointerLocked) return;
      _cursorX += e.movementX;
      _cursorY += e.movementY;
      // Clamp to screen bounds
      _cursorX = Math.max(0, Math.min(window.innerWidth, _cursorX));
      _cursorY = Math.max(0, Math.min(window.innerHeight, _cursorY));
      // Update crosshair position
      if (_crosshairEl) {
        _crosshairEl.style.left = _cursorX + 'px';
        _crosshairEl.style.top = _cursorY + 'px';
      }
    }
    function _onMouseDownCockpit(e) {
      if (!_pointerLocked) return;
      if (e.button === 0) {
        saucer.setPlayerShootHeld(true);
      }
    }
    function _onMouseUpCockpit(e) {
      if (e.button === 0) {
        saucer.setPlayerShootHeld(false);
      }
    }
    function _onPointerLockChange() {
      _pointerLocked = document.pointerLockElement === renderer.domElement;
      if (!_pointerLocked && _cockpitActive) {
        // User pressed Escape or otherwise lost lock — exit cockpit
        onSaucerExitRef.current?.();
      }
    }

    // ── Click / marker-drag handler ────────────────────
    let _markerDragging = false;

    const handleClick = (e) => {
      const mx = (e.clientX / window.innerWidth) * 2 - 1;
      const my = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);

      // ── Cockpit mode active: ignore normal click handling ──
      if (_cockpitActive) return;

      if (torusFocusedRef.current) {
        // Explore mode — try marker drag on torus
        const targets = torusKnot.getRayTargets();
        if (targets.length === 0) return;
        const hits = raycaster.intersectObjects(targets);
        if (hits.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          _markerDragging = torusKnot.startMarkerDrag(hits[0].point);
          if (_markerDragging) orbitControls.enabled = false;
        }
        return;
      }

      // ── Preview mode: check saucer first, then torus ──
      // Check saucer click
      const saucerTargets = saucer.getRayTargets();
      const saucerHits = saucerTargets.length > 0 ? raycaster.intersectObjects(saucerTargets) : [];
      if (saucerHits.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        // Request pointer lock immediately (must be from user gesture)
        renderer.domElement.requestPointerLock();
        onSaucerEnterRef.current?.();
        return;
      }

      // Check torus click
      if (!onTorusClickRef.current) return;
      const torusTargets = torusKnot.getRayTargets();
      if (torusTargets.length === 0) return;
      const torusHits = raycaster.intersectObjects(torusTargets);
      if (torusHits.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        onTorusClickRef.current();
      }
    };

    // Additional pointer handlers for marker drag (outside SceneCamera)
    const handlePointerMove = (e) => {
      if (!_markerDragging) return;
      const mx = (e.clientX / window.innerWidth) * 2 - 1;
      const my = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);
      const targets = torusKnot.getRayTargets();
      if (targets.length === 0) return;
      const hits = raycaster.intersectObjects(targets);
      if (hits.length > 0) {
        torusKnot.updateMarkerDrag(hits[0].point);
      }
    };

    const handlePointerUp = () => {
      if (_markerDragging) {
        torusKnot.endMarkerDrag();
        _markerDragging = false;
        // Re-enable OrbitControls after marker drag
        if (torusFocusedRef.current) {
          orbitControls.enabled = true;
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);

    const sceneCamera = new SceneCamera(camera, { onClick: handleClick });

    // ── Animation loop ──────────────────────────────────
    let animationId;
    let t = 0;
    const clock = new THREE.Clock();
    // Previous params for fast change detection (avoids JSON.stringify every frame)
    const _initialParams = torusParamsRef.current || {};
    const PARAMS_KEYS = ['p', 'q', 'color', 'radius', 'tube', 'metalness', 'roughness',
      'spinSpeed', 'showWireframe', 'showFieldLines', 'showLattice',
      'fieldLineCount', 'particleSpeed', 'morphValue'];
    let prevParams = { ..._initialParams };

    /** Fast shallow-compare of torus params — avoids JSON.stringify + GC every frame. */
    function _paramsChanged(a, b) {
      for (let i = 0; i < PARAMS_KEYS.length; i++) {
        if (a[PARAMS_KEYS[i]] !== b[PARAMS_KEYS[i]]) return true;
      }
      return false;
    }

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      t += dt;

      const focused = torusFocusedRef.current;
      const saucerFoc = saucerFocusedRef.current;

      // ── Cockpit mode transition ───────────────────
      if (saucerFoc !== _cockpitActive) {
        if (saucerFoc) {
          _enterCockpit();
          // Capture exit-start state for smooth return later
          _exitStartCam.copy(camera.position);
          _exitStartLook.copy(_smoothLookTarget);
        } else {
          _exitCockpit();
        }
      }

      // ── Mode transition: enable/disable drift ──────
      if (focused !== _wasFocused) {
        _wasFocused = focused;
        sceneCamera.setDriftEnabled(!focused && !_cockpitActive);
        torusKnot.setMode(focused ? 'explore' : 'preview');
        if (focused) {
          // Disable OrbitControls during zoom-in transition
          orbitControls.enabled = false;
          _transitionElapsed = 0;
          _hasEverEnteredExplore = true;
          const startTorusPos = torusKnot.getWorldPosition();
          _zoomStartDist = camera.position.distanceTo(startTorusPos);
          _approachDir.copy(camera.position).sub(startTorusPos).normalize();
          const maxVert = 0.85;
          if (Math.abs(_approachDir.y) > maxVert) {
            _approachDir.y = Math.sign(_approachDir.y) * maxVert;
            _approachDir.normalize();
          }
          _smoothCamTarget.copy(camera.position);
          renderer.domElement.style.pointerEvents = 'auto';
        } else {
          orbitControls.enabled = false;
          renderer.domElement.style.pointerEvents = _cockpitActive ? 'auto' : 'none';
          _exitTransitionElapsed = 0;
          _exitStartCam.copy(camera.position);
          _exitStartLook.copy(_smoothLookTarget);
        }
        if (_markerDragging) {
          torusKnot.endMarkerDrag();
          _markerDragging = false;
        }
      }

      // ═══════════════════════════════════════════════════
      //  COCKPIT MODE — first-person flight
      // ═══════════════════════════════════════════════════
      if (_cockpitActive) {
        // ── Read keyboard state ──
        const boosting = _keysDown.has('KeyW');
        const braking = _keysDown.has('KeyS');
        saucer.setPlayerThrottle(boosting, braking);

        const strafe = (_keysDown.has('KeyD') ? 1 : 0) - (_keysDown.has('KeyA') ? 1 : 0);
        const up = (_keysDown.has('Space') ? 1 : 0) - (_keysDown.has('ControlLeft') || _keysDown.has('ControlRight') ? 1 : 0);

        // ── Virtual cursor → turn rate (spring physics) ──
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const hw = Math.max(window.innerWidth / 2, 1);
        const hh = Math.max(window.innerHeight / 2, 1);

        // Normalized offset from center (-1..1)
        let nx = (_cursorX - cx) / hw;
        let ny = (_cursorY - cy) / hh;

        // Dead zone near center
        if (Math.abs(nx) < DEAD_ZONE) nx = 0;
        if (Math.abs(ny) < DEAD_ZONE) ny = 0;

        // Turn rate proportional to offset (smoothed by saucer's internal lerp)
        const yawRate = nx * MAX_TURN_RATE;
        const pitchRate = ny * MAX_PITCH_RATE; // cursor down = positive = pitch down
        saucer.applyPlayerTurn(yawRate, pitchRate);

        // Spring: pull cursor back toward center
        _cursorX -= nx * SPRING_FORCE * 60 * dt;
        _cursorY -= ny * SPRING_FORCE * 60 * dt;
        // Update crosshair position
        if (_crosshairEl) {
          _crosshairEl.style.left = _cursorX + 'px';
          _crosshairEl.style.top = _cursorY + 'px';
        }

        // ── Apply dodge movement (auto-forward is in update) ──
        saucer.applyPlayerDodge(strafe, up, dt);

        // ── Game camera: locked to saucer (ship fixed, world rotates) ──
        saucer.applyGameCamera(camera);

        // ── Keep scene group rotation matching saucer orientation ──
        // (so the background doesn't look static)
        sceneGroup.rotation.x = 0;
        sceneGroup.rotation.y = 0;

        // ── Crosshair raycast for laser targeting ──────
        // Convert virtual cursor pixel coords → NDC → world ray → cube intersection
        const mx = (_cursorX / window.innerWidth) * 2 - 1;
        const my = -(_cursorY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);
        const cockpitCubes = cubeField.getVisibleCubes();
        const crosshairHits = raycaster.intersectObjects(cockpitCubes);
        if (crosshairHits.length > 0 && crosshairHits[0].object.visible) {
          const hitPoint = crosshairHits[0].point; // world-space hit point
          saucer.setPlayerCrosshairTarget(hitPoint, true, crosshairHits[0].object);
        } else {
          // No cube under crosshair — project a far point along the ray direction
          const farPoint = camera.position.clone()
            .addScaledVector(raycaster.ray.direction, saucer._laserRange || 8);
          saucer.setPlayerCrosshairTarget(farPoint, false, null);
        }

        // ── Hide logo ──
        logoTrio.group.visible = false;

        // ── Update subsystems ──────────────────────────
        const currentAccent = getAccentColor();
        cubeField.update(t, dt, null, currentAccent);
        galaxyManager.update(t, dt);
        torusKnot.update(t, dt);
        saucer.update(t, dt);

        // ── Camera shake ───────────────────────────────
        const shake = galaxyManager.getShake();
        let shakeX = 0, shakeY = 0;
        if (shake > 0.001) {
          shakeX = (Math.random() - 0.5) * 2 * shake;
          shakeY = (Math.random() - 0.5) * 2 * shake;
          camera.position.x += shakeX;
          camera.position.y += shakeY;
        }

        renderer.render(scene, camera);

        if (shake > 0.001) {
          camera.position.x -= shakeX;
          camera.position.y -= shakeY;
        }

        // ── Reset cursor to default (cockpit uses crosshair CSS) ──
        document.body.style.cursor = '';

        return; // skip normal camera logic below
      }

      // ═══════════════════════════════════════════════════
      //  NORMAL MODE — galaxy view / torus explore
      // ═══════════════════════════════════════════════════

      // ── Input & drift (galaxy view only — OrbitControls owns the camera in explore mode)
      if (!focused) {
        sceneCamera.update(t, dt);
      } else {
        // Minimal continuous drift so the universe never freezes during explore mode
        sceneCamera.sceneRotation.y += 0.00015;
      }

      if (focused) {
        const torusPos = torusKnot.getWorldPosition();

        // Smoothly track lookAt target toward torus
        _smoothLookTarget.lerp(torusPos, Math.min(4.5 * dt, 0.3));
        // Only update orbit target during transition — let OrbitControls own it when active
        if (!orbitControls.enabled && !_markerDragging) {
          orbitControls.target.copy(_smoothLookTarget);
        }

        if (!orbitControls.enabled && !_markerDragging) {
          // ── Zoom-in transition: zoom toward torus from user's current angle ──
          _transitionElapsed += dt;
          const endDist = 4.5;        // comfortable orbit distance
          const duration = 0.85;      // transition duration in seconds
          const raw = Math.min(_transitionElapsed / duration, 1.0);
          const eased = easeInOutCubic(raw);
          const dist = _zoomStartDist + (endDist - _zoomStartDist) * eased;

          // Zoom along the captured approach direction — preserves the user's
          // viewing angle instead of snapping to a hardcoded direction.
          const targetCam = torusPos.clone().addScaledVector(_approachDir, dist);
          camera.position.copy(targetCam);
          camera.lookAt(_smoothLookTarget);

          // Enable OrbitControls once transition is visually complete
          if (raw >= 1.0 && !_markerDragging) {
            orbitControls.enabled = true;
            orbitControls.update();
          }
        } else {
          // OrbitControls handles camera rotation & zoom
          orbitControls.update();
        }
      } else {
        // ── Return to default galaxy view ──
        if (_hasEverEnteredExplore) {
          // Timed + eased exit transition (only after user has entered explore)
          _exitTransitionElapsed += dt;
          const exitDuration = 0.7;
          const raw = Math.min(_exitTransitionElapsed / exitDuration, 1.0);
          const eased = easeInOutCubic(raw);

          const defaultPos = new THREE.Vector3(0, 0, 5);
          camera.position.lerpVectors(_exitStartCam, defaultPos, eased);

          const defaultLook = new THREE.Vector3(0, 0, 0);
          _smoothLookTarget.lerpVectors(_exitStartLook, defaultLook, eased);
          camera.lookAt(_smoothLookTarget);
        } else {
          // Initial load — no transition, just set default view directly
          camera.position.set(0, 0, 5);
          camera.lookAt(0, 0, 0);
        }

        logoTrio.update(sceneCamera.smoothUserRotation);
      }

      // ── Scene group rotation — always applied so background never freezes
      sceneGroup.rotation.x = sceneCamera.smoothRotation.x;
      sceneGroup.rotation.y = sceneCamera.smoothRotation.y;

      // Hide logo when zoomed into torus
      logoTrio.group.visible = !focused;

      // ── Hover detection (cubes + torus + saucer) ────
      raycaster.setFromCamera(sceneCamera.pointer, camera);
      const visibleCubes = cubeField.getVisibleCubes();
      const saucerTargets = saucer.getRayTargets();
      const rayTargets = [...visibleCubes, ...torusKnot.getRayTargets(), ...saucerTargets];
      const intersects = raycaster.intersectObjects(rayTargets);
      const firstHit = intersects.length > 0 ? intersects[0].object : null;
      const hitTorus = torusKnot.isHit(firstHit);
      const hitSaucer = firstHit && firstHit.userData && firstHit.userData.isSaucer;
      hoveredCube = !hitTorus && !hitSaucer && firstHit ? firstHit : null;

      torusKnot.applyHover(hitTorus && !focused); // hover effect only in preview mode
      if (hitSaucer && !focused && !_cockpitActive) {
        document.body.style.cursor = 'pointer';
      } else if (!hitTorus && !hoveredCube && !_markerDragging) {
        document.body.style.cursor = '';
      }
      if (_markerDragging) {
        document.body.style.cursor = 'grabbing';
      }

      // ── Update subsystems ────────────────────────────
      const currentAccent = getAccentColor();
      cubeField.update(t, dt, hoveredCube, currentAccent);
      galaxyManager.update(t, dt);
      torusKnot.update(t, dt);
      saucer.update(t, dt);

      // ── Torus params change detection (fast shallow compare, no JSON.stringify) ──
      const current = torusParamsRef.current;
      if (current && _paramsChanged(current, prevParams)) {
        prevParams = { ...current };
        torusKnot.rebuild(current);
        // Notify React of the updated state from the 3D engine
        onTorusParamsChangeRef.current?.(torusKnot.getState());
      }

      // ── Camera shake (from galaxy collapses) ─────────
      const shake = galaxyManager.getShake();
      let shakeX = 0;
      let shakeY = 0;
      if (shake > 0.001) {
        shakeX = (Math.random() - 0.5) * 2 * shake;
        shakeY = (Math.random() - 0.5) * 2 * shake;
        camera.position.x += shakeX;
        camera.position.y += shakeY;
      }

      renderer.render(scene, camera);

      // Restore camera position after shake
      if (shake > 0.001) {
        camera.position.x -= shakeX;
        camera.position.y -= shakeY;
      }
    };

    animate();

    // ── Resize handler ──────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ── Cleanup ─────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationId);
      // Exit cockpit if active (clean up listeners, unlock pointer)
      if (_cockpitActive) {
        _exitCockpit();
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      sceneCamera.dispose();
      orbitControls.dispose();
      galaxyManager.dispose();
      saucer.dispose();
      cubeField.dispose();
      logoTrio.dispose();
      torusKnot.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
