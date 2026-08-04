import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { getAccentColor, paramsChanged, renderWithShake, cycleGalaxyColor } from './three/shared';
import CubeField from './three/CubeField';
import LogoTrio from './three/LogoTrio';
import TorusKnot from './three/TorusKnot';
import SceneCamera from './three/SceneCamera';
import GalaxyManager from './three/GalaxyEffect';
import FlyingSaucer from './three/FlyingSaucer';
import CockpitController from './three/CockpitController';
import ZoomTransition from './three/ZoomTransition';
import HoverManager from './three/HoverManager';
import LabelManager from './three/LabelManager';
import ThemeToggle from './three/ThemeToggle';
import { useTheme } from '../ThemeContext';

/**
 * ThreeBackground — thin orchestrator for the full-screen 3D scene.
 *
 * Responsibilities:
 *  - Create scene, camera, renderer, and sceneGroup
 *  - Wire together all managers (CubeField, LogoTrio, TorusKnot,
 *    SceneCamera, GalaxyManager, FlyingSaucer, CockpitController,
 *    ZoomTransition, HoverManager)
 *  - Run the animation loop, calling each manager's update()
 *  - Handle click → zoom-in / saucer entry / marker drag
 *  - Detect torus param changes and trigger rebuild
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
  const { toggleTheme } = useTheme();

  // ── Stable refs (avoid re-running the Three.js effect) ──
  const onTorusClickRef = useRef(onTorusClick);
  const torusParamsRef = useRef(torusParams);
  const torusFocusedRef = useRef(torusFocused);
  const onTorusParamsChangeRef = useRef(onTorusParamsChange);
  const saucerFocusedRef = useRef(saucerFocused);
  const onSaucerEnterRef = useRef(onSaucerEnter);
  const onSaucerExitRef = useRef(onSaucerExit);
  const toggleThemeRef = useRef(toggleTheme);

  if (onTorusClickRef.current !== onTorusClick) onTorusClickRef.current = onTorusClick;
  torusParamsRef.current = torusParams;
  torusFocusedRef.current = torusFocused;
  onTorusParamsChangeRef.current = onTorusParamsChange;
  saucerFocusedRef.current = saucerFocused;
  onSaucerEnterRef.current = onSaucerEnter;
  onSaucerExitRef.current = onSaucerExit;
  toggleThemeRef.current = toggleTheme;

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

    // CSS2DRenderer for 3D hover labels (constant-size text)
    const css2DRenderer = new CSS2DRenderer();
    css2DRenderer.setSize(window.innerWidth, window.innerHeight);
    css2DRenderer.domElement.style.position = 'absolute';
    css2DRenderer.domElement.style.top = '0';
    css2DRenderer.domElement.style.left = '0';
    css2DRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(css2DRenderer.domElement);

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

    // ── Raycaster (shared for hover + click + marker drag + crosshair) ──
    const raycaster = new THREE.Raycaster();

    // ── Instantiate all managers ────────────────────────
    const cubeField = new CubeField(sceneGroup);
    const logoTrio = new LogoTrio(scene);
    const torusKnot = new TorusKnot(sceneGroup, torusParamsRef.current || {});
    const galaxyManager = new GalaxyManager(sceneGroup);
    const saucer = new FlyingSaucer(sceneGroup, cubeField.getCubes(), galaxyManager);
    const themeToggle = new ThemeToggle(sceneGroup, () => toggleThemeRef.current?.());

    // ── Score system + logo hit tracking ────────────────
    let _score = 0;
    let _scoreEl = null;
    let _logoUnderCrosshair = false;

    saucer.setOnCubeDestroyed((cube) => {
      _score += cube.userData.pointValue || 10;
      if (_scoreEl) {
        _scoreEl.textContent = String(_score);
        // Brief pop animation
        _scoreEl.classList.add('cockpit-score-pop');
        clearTimeout(_scoreEl._popTimeout);
        _scoreEl._popTimeout = setTimeout(() => {
          _scoreEl?.classList.remove('cockpit-score-pop');
        }, 150);
      }
    });

    saucer.setOnPlayerLaserFired((_targetWorldPos, hitCube) => {
      if (!hitCube && _logoUnderCrosshair && logoTrio.ready) {
        // Laser hit the logo — trigger dramatic spin
        const saucerWorldPos = new THREE.Vector3();
        saucer.group.getWorldPosition(saucerWorldPos);
        const hitDir = _targetWorldPos.clone().sub(saucerWorldPos).normalize();
        logoTrio.hit(hitDir);
      }
    });

    // ── Galaxy boundary crossing (colour switch) ────────
    saucer.setOnGalaxyBoundaryCrossed((worldPos) => {
      cycleGalaxyColor();

      // Convert world position to sceneGroup local space for explosions
      const localPos = sceneGroup.worldToLocal(worldPos.clone());

      // Dramatic burst at the transition point
      galaxyManager.spawnAt(localPos, 4.0);
      for (let i = 0; i < 3; i++) {
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 2.5,
        );
        galaxyManager.spawnAt(localPos.clone().add(offset), 1.5);
      }
    });

    const cockpit = new CockpitController({
      rendererDomElement: renderer.domElement,
      saucer,
      camera,
    });
    const zoomTransition = new ZoomTransition();
    const hoverManager = new HoverManager(raycaster, cubeField, torusKnot, saucer, themeToggle);
    const labelManager = new LabelManager(torusKnot, saucer, themeToggle, scene, camera);

    // ── Wire cockpit callbacks ──────────────────────────
    cockpit.setOnRequestExit(() => onSaucerExitRef.current?.());
    cockpit.setOnExitTransitionStart(() => {
      zoomTransition.startZoomOut(camera.position, zoomTransition.smoothLookTarget);
    });

    // ── Click / marker-drag handler ────────────────────
    let _markerDragging = false;

    const handleClick = (e) => {
      const mx = (e.clientX / window.innerWidth) * 2 - 1;
      const my = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);

      // Cockpit mode active — ignore normal click handling
      if (cockpit.isActive) return;

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

      // ── Preview mode: check theme toggle first, then saucer, then torus ──
      const toggleTargets = themeToggle.getRayTargets();
      const toggleHits = raycaster.intersectObjects(toggleTargets);
      if (toggleHits.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        labelManager.dismissAll();
        themeToggle.handleClick();
        return;
      }

      const saucerTargets = saucer.getRayTargets();
      const saucerHits = saucerTargets.length > 0 ? raycaster.intersectObjects(saucerTargets) : [];
      if (saucerHits.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        labelManager.dismissAll();
        // Request pointer lock (desktop only — mobile enters directly)
        if (!cockpit.isMobile) {
          renderer.domElement.requestPointerLock();
        }
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
        labelManager.dismissAll();
        onTorusClickRef.current();
      }
    };

    // ── Marker drag pointer handlers ────────────────────
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
    const _initialParams = torusParamsRef.current || {};
    let prevParams = { ..._initialParams };
    let _wasFocused = false;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      t += dt;

      const focused = torusFocusedRef.current;
      const saucerFoc = saucerFocusedRef.current;

      // ── Cockpit mode transition ───────────────────
      if (saucerFoc !== cockpit.isActive) {
        if (saucerFoc) {
          // Enter cockpit
          sceneCamera.setDriftEnabled(false);
          orbitControls.enabled = false;

          // Save cube positions so we can restore on exit
          cubeField.saveOriginalState();

          cockpit.enter();
          // Capture exit-start state for smooth return
          zoomTransition.startZoomOut(camera.position, zoomTransition.smoothLookTarget);

          // ── Score HUD ──────────────────────────────
          _score = 0;
          _logoUnderCrosshair = false;
          _scoreEl = document.createElement('div');
          _scoreEl.className = 'cockpit-score';
          _scoreEl.textContent = '0';
          document.body.appendChild(_scoreEl);
        } else {
          // Exit cockpit
          cockpit.exit();
          sceneCamera.setDriftEnabled(true);
          sceneCamera.resetRotation();

          // ── Remove score HUD ───────────────────────
          if (_scoreEl) { _scoreEl.remove(); _scoreEl = null; }
          _score = 0;
          _logoUnderCrosshair = false;

          // Reset logo to default pose
          logoTrio.reset();

          // Restore cube field to original positions (in case
          // galaxy switches moved them during the session)
          cubeField.restoreOriginals();
        }
      }

      // ── Torus focus transition ────────────────────
      if (focused !== _wasFocused) {
        _wasFocused = focused;
        sceneCamera.setDriftEnabled(!focused && !cockpit.isActive);
        torusKnot.setMode(focused ? 'explore' : 'preview');
        if (focused) {
          orbitControls.enabled = false;
          zoomTransition.startZoomIn(camera.position, torusKnot.getWorldPosition());
          renderer.domElement.style.pointerEvents = 'auto';
        } else {
          orbitControls.enabled = false;
          renderer.domElement.style.pointerEvents = cockpit.isActive ? 'auto' : 'none';
          zoomTransition.startZoomOut(camera.position, zoomTransition.smoothLookTarget);
        }
        if (_markerDragging) {
          torusKnot.endMarkerDrag();
          _markerDragging = false;
        }
      }

      // ═══════════════════════════════════════════════════
      //  COCKPIT MODE — first-person flight
      // ═══════════════════════════════════════════════════
      if (cockpit.isActive) {
        cockpit.update(dt);
        saucer.applyGameCamera(camera);

        // Scene group stays neutral (cockpit camera owns orientation)
        sceneGroup.rotation.x = 0;
        sceneGroup.rotation.y = 0;

        // ── Crosshair raycast for laser targeting ──────
        const mx = (cockpit.cursorX / window.innerWidth) * 2 - 1;
        const my = -(cockpit.cursorY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);

        // Check cubes first (priority over logo)
        const cockpitCubes = cubeField.getVisibleCubes();
        const crosshairHits = raycaster.intersectObjects(cockpitCubes);
        if (crosshairHits.length > 0 && crosshairHits[0].object.visible) {
          saucer.setPlayerCrosshairTarget(crosshairHits[0].point, true, crosshairHits[0].object);
          _logoUnderCrosshair = false;
        } else {
          // Check logo meshes
          const logoTargets = logoTrio.getRayTargets();
          const logoHits = logoTargets.length > 0 ? raycaster.intersectObjects(logoTargets) : [];
          if (logoHits.length > 0 && logoTrio.group.visible) {
            saucer.setPlayerCrosshairTarget(logoHits[0].point, true, null);
            _logoUnderCrosshair = true;
          } else {
            // Compute far point from saucer (not camera) so laser fires toward cursor
            const saucerWorldPos = new THREE.Vector3();
            saucer.group.getWorldPosition(saucerWorldPos);
            const farPoint = saucerWorldPos.clone()
              .addScaledVector(raycaster.ray.direction, saucer.getLaserRange());
            saucer.setPlayerCrosshairTarget(farPoint, false, null);
            _logoUnderCrosshair = false;
          }
        }

        // Logo stays visible in cockpit — update game-mode spin physics
        logoTrio.updateGameMode(dt);

        // Update subsystems
        const currentAccent = getAccentColor();
        cubeField.update(t, dt, null, currentAccent);

        // ── Circular cube recycling — cubes behind the saucer
        //     are silently moved ahead for an infinite galaxy feel
        const saucerLocalPos = saucer.group.position;
        const saucerLocalFwd = new THREE.Vector3(0, 0, 1)
          .applyQuaternion(saucer.group.quaternion).normalize();
        cubeField.recycleAroundSaucer(saucerLocalPos, saucerLocalFwd);

        galaxyManager.update(t, dt);
        torusKnot.update(t, dt);
        saucer.update(t, dt);
        themeToggle.group.visible = false; // hide in cockpit
        themeToggle.update(dt);

        // Render with shake
        renderWithShake(camera, galaxyManager.getShake(), scene, renderer);
        document.body.style.cursor = '';

        return; // skip normal mode logic
      }

      // ═══════════════════════════════════════════════════
      //  NORMAL MODE — galaxy view / torus explore
      // ═══════════════════════════════════════════════════

      // ── Input & drift ──
      if (!focused) {
        sceneCamera.update(t, dt);
      } else {
        sceneCamera.sceneRotation.y += 0.00015;
      }

      // ── Camera transition ──
      if (focused) {
        const torusPos = torusKnot.getWorldPosition();

        // Track lookAt toward torus
        zoomTransition.smoothLookTarget.lerp(torusPos, Math.min(4.5 * dt, 0.3));
        if (!orbitControls.enabled && !_markerDragging) {
          orbitControls.target.copy(zoomTransition.smoothLookTarget);
        }

        if (!orbitControls.enabled && !_markerDragging) {
          const done = zoomTransition.updateZoomIn(dt, torusPos, camera);
          if (done && !_markerDragging) {
            orbitControls.enabled = true;
            orbitControls.update();
          }
        } else {
          orbitControls.update();
        }
      } else {
        zoomTransition.updateZoomOut(dt, camera);
        if (!zoomTransition.hasEverEnteredExplore) {
          camera.position.set(0, 0, 5);
          camera.lookAt(0, 0, 0);
        }
        logoTrio.update(sceneCamera.smoothUserRotation);
      }

      // ── Scene group rotation ──
      sceneGroup.rotation.x = sceneCamera.smoothRotation.x;
      sceneGroup.rotation.y = sceneCamera.smoothRotation.y;

      // Hide logo when zoomed into torus
      logoTrio.group.visible = !focused;

      // ── Hover detection ──
      const { hoveredCube, hitTorus, hitSaucer, hitToggle } = hoverManager.update(
        sceneCamera.pointer, camera, focused, _markerDragging, cockpit.isActive,
      );

      // ── 3D hover labels (star-map style) ──
      labelManager.update(
        { hitTorus, hitSaucer, hitToggle },
        dt,
        focused || cockpit.isActive,
      );

      // ── Update subsystems ──
      const currentAccent = getAccentColor();
      cubeField.update(t, dt, hoveredCube, currentAccent);
      galaxyManager.update(t, dt);
      torusKnot.update(t, dt);
      saucer.update(t, dt);
      themeToggle.group.visible = !focused; // hide during torus explore
      themeToggle.update(dt);

      // ── Torus params change detection ──
      const current = torusParamsRef.current;
      if (current && paramsChanged(current, prevParams)) {
        prevParams = { ...current };
        torusKnot.rebuild(current);
        onTorusParamsChangeRef.current?.(torusKnot.getState());
      }

      // ── Render with shake ──
      renderWithShake(camera, galaxyManager.getShake(), scene, renderer);
      css2DRenderer.render(labelManager.getScene(), camera);
    };

    animate();

    // ── Resize handler ──────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      css2DRenderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ── Cleanup ─────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      cockpit.dispose();
      sceneCamera.dispose();
      orbitControls.dispose();
      galaxyManager.dispose();
      saucer.dispose();
      cubeField.dispose();
      logoTrio.dispose();
      torusKnot.dispose();
      themeToggle.dispose();
      labelManager.dispose();
      renderer.dispose();
      if (_scoreEl) { _scoreEl.remove(); _scoreEl = null; }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (container.contains(css2DRenderer.domElement)) {
        container.removeChild(css2DRenderer.domElement);
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
