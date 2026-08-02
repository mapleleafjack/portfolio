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
}) {
  const containerRef = useRef(null);

  // ── Stable refs (avoid re-running the Three.js effect) ──
  const onTorusClickRef = useRef(onTorusClick);
  const torusParamsRef = useRef(torusParams);
  const torusFocusedRef = useRef(torusFocused);
  const onTorusParamsChangeRef = useRef(onTorusParamsChange);

  if (onTorusClickRef.current !== onTorusClick) onTorusClickRef.current = onTorusClick;
  torusParamsRef.current = torusParams;
  torusFocusedRef.current = torusFocused;
  onTorusParamsChangeRef.current = onTorusParamsChange;

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

    // ── Click / marker-drag handler ────────────────────
    let _markerDragging = false;

    const handleClick = (e) => {
      const mx = (e.clientX / window.innerWidth) * 2 - 1;
      const my = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);

      if (torusFocusedRef.current) {
        // Explore mode — try marker drag on torus
        const targets = torusKnot.getRayTargets();
        if (targets.length === 0) return;
        const hits = raycaster.intersectObjects(targets);
        if (hits.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          _markerDragging = torusKnot.startMarkerDrag(hits[0].point);
          // Disable OrbitControls while dragging marker
          if (_markerDragging) orbitControls.enabled = false;
        }
      } else {
        // Preview mode — click torus to zoom in
        if (!onTorusClickRef.current) return;
        const targets = torusKnot.getRayTargets();
        if (targets.length === 0) return;
        const hits = raycaster.intersectObjects(targets);
        if (hits.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          onTorusClickRef.current();
        }
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

      // ── Mode transition: enable/disable drift ────────
      if (focused !== _wasFocused) {
        _wasFocused = focused;
        sceneCamera.setDriftEnabled(!focused);
        torusKnot.setMode(focused ? 'explore' : 'preview');
        if (focused) {
          // Disable OrbitControls during zoom-in transition
          orbitControls.enabled = false;
          _transitionElapsed = 0;
          _hasEverEnteredExplore = true;
          // Capture the approach direction from the user's current camera angle
          // so the camera zooms toward the torus from wherever the user is looking.
          const startTorusPos = torusKnot.getWorldPosition();
          _zoomStartDist = camera.position.distanceTo(startTorusPos);
          _approachDir.copy(camera.position).sub(startTorusPos).normalize();
          // Clamp vertical approach to avoid degenerate top-down views
          const maxVert = 0.85; // sin(≈58°) — keep camera within ±58° of horizontal
          if (Math.abs(_approachDir.y) > maxVert) {
            _approachDir.y = Math.sign(_approachDir.y) * maxVert;
            _approachDir.normalize();
          }
          // Reset smooth target to current camera position so the lerp
          // always starts from where the camera actually is (galaxy view).
          _smoothCamTarget.copy(camera.position);
          // Enable pointer events on canvas so OrbitControls can receive input
          renderer.domElement.style.pointerEvents = 'auto';
        } else {
          // Exit explore: disable OrbitControls, lerp camera back
          orbitControls.enabled = false;
          renderer.domElement.style.pointerEvents = 'none';
          // Capture start state for smooth exit transition
          _exitTransitionElapsed = 0;
          _exitStartCam.copy(camera.position);
          _exitStartLook.copy(_smoothLookTarget);
        }
        // Reset marker drag on mode change
        if (_markerDragging) {
          torusKnot.endMarkerDrag();
          _markerDragging = false;
        }
      }

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

      // ── Hover detection (cubes + torus) ──────────────
      raycaster.setFromCamera(sceneCamera.pointer, camera);
      const visibleCubes = cubeField.getVisibleCubes();
      const rayTargets = [...visibleCubes, ...torusKnot.getRayTargets()];
      const intersects = raycaster.intersectObjects(rayTargets);
      const firstHit = intersects.length > 0 ? intersects[0].object : null;
      const hitTorus = torusKnot.isHit(firstHit);
      hoveredCube = !hitTorus && firstHit ? firstHit : null;

      torusKnot.applyHover(hitTorus && !focused); // hover effect only in preview mode
      if (!hitTorus && !hoveredCube && !_markerDragging) {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
