import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { getAccentColor, paramsChanged, cycleGalaxyColor, onThemeChange } from './three/shared';
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
import PlanetSystem from './three/PlanetSystemV2';
import PlanetInfoBillboard from './three/PlanetInfoBillboard';
import PostProcessing from './three/PostProcessing';
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
  onPlanetItemClick = null,
  onConstellationHover = null,
  onPlanetZoomChange = null,
  onBillboardClick = null,
  planetZoomOutSignal = 0,
  planetZoomInSignal = 0,
  planetZoomInTarget = null,
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
  const onPlanetItemClickRef = useRef(onPlanetItemClick);
  const onConstellationHoverRef = useRef(onConstellationHover);
  const onPlanetZoomChangeRef = useRef(onPlanetZoomChange);
  const onBillboardClickRef = useRef(onBillboardClick);
  const planetZoomOutSignalRef = useRef(planetZoomOutSignal);
  const planetZoomInSignalRef = useRef(planetZoomInSignal);
  const planetZoomInTargetRef = useRef(planetZoomInTarget);

  if (onTorusClickRef.current !== onTorusClick) onTorusClickRef.current = onTorusClick;
  torusParamsRef.current = torusParams;
  torusFocusedRef.current = torusFocused;
  onTorusParamsChangeRef.current = onTorusParamsChange;
  saucerFocusedRef.current = saucerFocused;
  onSaucerEnterRef.current = onSaucerEnter;
  onSaucerExitRef.current = onSaucerExit;
  toggleThemeRef.current = toggleTheme;
  onConstellationHoverRef.current = onConstellationHover;
  onPlanetItemClickRef.current = onPlanetItemClick;
  onPlanetZoomChangeRef.current = onPlanetZoomChange;
  onBillboardClickRef.current = onBillboardClick;
  planetZoomOutSignalRef.current = planetZoomOutSignal;
  planetZoomInSignalRef.current = planetZoomInSignal;
  planetZoomInTargetRef.current = planetZoomInTarget;

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
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    // ── Post-processing (bloom) ──
    const bloomScene = new THREE.Scene();

    // Set initial background colour from CSS theme
    const _initialStyle = getComputedStyle(document.documentElement);
    const _initialBg = _initialStyle.getPropertyValue('--bg').trim() || '#0a0a0a';
    bloomScene.background = new THREE.Color(_initialBg);

    const postProcessing = new PostProcessing(
      renderer, bloomScene, camera,
      window.innerWidth, window.innerHeight,
    );

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

    // Scene group — rotated on drag instead of moving the camera.
    // Placed in bloomScene so planets/cubes/torus get bloom; logo
    // (in `scene`) renders natively on top.
    const sceneGroup = new THREE.Group();
    bloomScene.add(sceneGroup);

    // ── Raycaster (shared for hover + click + marker drag + crosshair) ──
    const raycaster = new THREE.Raycaster();

    // ── Instantiate all managers ────────────────────────
    const cubeField = new CubeField(sceneGroup);
    const logoTrio = new LogoTrio(scene);
    const torusKnot = new TorusKnot(sceneGroup, torusParamsRef.current || {});
    const galaxyManager = new GalaxyManager(sceneGroup);
    const saucer = new FlyingSaucer(sceneGroup, cubeField.getCubes(), galaxyManager);
    const themeToggle = new ThemeToggle(sceneGroup, () => toggleThemeRef.current?.());

    // ── Theme-aware scene background + bloom params ─────
    const _applyBgAndBloom = () => {
      const s = getComputedStyle(document.documentElement);
      const bg = s.getPropertyValue('--bg').trim();
      const dark = document.documentElement.classList.contains('dark');
      if (bg) bloomScene.background = new THREE.Color(bg);
      // Light mode: raise threshold so white bg doesn't trigger bloom
      postProcessing.setBloomThreshold(dark ? 0.75 : 1.0);
      postProcessing.setBloomStrength(dark ? 0.30 : 0.15);
    };
    _applyBgAndBloom();
    const _themeCleanup = onThemeChange(() => _applyBgAndBloom());

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

    // ── Planet system (data-driven 3D anchors + constellations) ──
    const colorMap = { work: '#f0c830', craft: '#10b981', music: '#d946ef', play: '#f97316' };

    // ── Info billboard (holographic, replaces ChartPanel) ────
    const infoBillboard = new PlanetInfoBillboard(sceneGroup, camera);

    const planetSystem = new PlanetSystem(sceneGroup, camera, (data) => {
      onPlanetItemClickRef.current?.(data);
    }, (data) => {
      onConstellationHoverRef.current?.(data);
      infoBillboard.setHoveredItem(data);
    }, (data) => {
      onPlanetZoomChangeRef.current?.(data);
      if (data && data.phase === 'open' && data.planetId) {
        const pos = planetSystem.getZoomedPlanetWorldPos();
        const quat = planetSystem.getZoomedPlanetQuat();
        infoBillboard.show(pos, quat, {
          id: data.planetId,
          name: data.planetId.charAt(0).toUpperCase() + data.planetId.slice(1),
          color: colorMap[data.planetId] || '#f0c830',
        });
      } else if (data && data.phase === 'none') {
        infoBillboard.hide();
      }
    });

    const hoverManager = new HoverManager(raycaster, cubeField, torusKnot, saucer, themeToggle, planetSystem);
    const labelManager = new LabelManager(torusKnot, saucer, themeToggle, scene, camera);

    // ── Register planet labels with LabelManager ─────
    labelManager.setPlanets(planetSystem.getPlanetLabelData());

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

      // ── Preview mode: check planet system, then billboard, then theme toggle, then saucer, then torus ──

      // Planets + constellation items
      const planetTargets = planetSystem.getPlanetTargets();
      const constellTargets = planetSystem.getConstellationTargets();
      const allPlanetTargets = [...planetTargets, ...constellTargets];
      if (allPlanetTargets.length > 0) {
        const planetHits = raycaster.intersectObjects(allPlanetTargets);
        if (planetHits.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          planetSystem.handleClick(planetHits[0].object);
          return;
        }
      }

      // Info billboard (holographic panel above zoomed planet)
      const billboardTargets = infoBillboard.getRayTargets();
      if (billboardTargets.length > 0) {
        const billboardHits = raycaster.intersectObjects(billboardTargets);
        if (billboardHits.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          const link = infoBillboard.getCurrentLink();
          if (link) {
            onBillboardClickRef.current?.(link);
            planetSystem.startZoomOut();
          }
          return;
        }
      }

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
    let _wasPlanetZoomed = false;
    let _prevZoomOutSignal = planetZoomOutSignalRef.current;
    let _prevZoomInSignal = planetZoomInSignalRef.current;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      t += dt;

      const focused = torusFocusedRef.current;
      const saucerFoc = saucerFocusedRef.current;
      const planetZoomed = planetSystem.isZoomed;

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
        sceneCamera.setDriftEnabled(!focused && !cockpit.isActive && !planetSystem.isZoomed);
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

      // ── Planet zoom state tracking ────────────────
      // Disable drift when zoomed into a planet so the camera stays put
      if (planetZoomed !== _wasPlanetZoomed) {
        _wasPlanetZoomed = planetZoomed;
        sceneCamera.setDriftEnabled(!planetZoomed && !focused && !cockpit.isActive);
      }

      // ── Zoom-out signal detection (React requests zoom out) ──
      if (planetZoomOutSignalRef.current !== _prevZoomOutSignal) {
        _prevZoomOutSignal = planetZoomOutSignalRef.current;
        if (planetSystem.isZoomed) planetSystem.startZoomOut();
      }

      // ── Zoom-in signal detection (React requests zoom to planet) ──
      if (planetZoomInSignalRef.current !== _prevZoomInSignal) {
        _prevZoomInSignal = planetZoomInSignalRef.current;
        // Read the target planet ID from the stored ref (set by handleNavClick)
        const target = planetZoomInTargetRef.current;
        if (target) {
          planetSystem.zoomToPlanet(target);
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

        // Render with shake + bloom
        postProcessing.render(galaxyManager.getShake());

        // Composite logo scene on top (no bloom)
        // Clear depth only — color buffer has the bloom output
        renderer.autoClear = false;
        renderer.clearDepth();
        renderer.render(scene, camera);
        renderer.autoClear = true;

        document.body.style.cursor = '';

        return; // skip normal mode logic
      }

      // ═══════════════════════════════════════════════════
      //  NORMAL MODE — galaxy view / torus explore
      // ═══════════════════════════════════════════════════

      // ── Input & drift ──
      if (!focused && !planetZoomed) {
        sceneCamera.update(t, dt);
      } else if (focused) {
        sceneCamera.sceneRotation.y += 0.00015;
      }
      // When zoomed into a planet, skip sceneCamera entirely (planet owns the camera)

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
      } else if (!planetZoomed) {
        // Only run zoom-out transition when NOT zoomed into a planet
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

      // Hide logo when zoomed into torus or planet
      logoTrio.group.visible = !focused && !planetZoomed;

      // ── Hover detection ──
      const { hoveredCube, hitTorus, hitSaucer, hitToggle, hitPlanet, planetId } = hoverManager.update(
        sceneCamera.pointer, camera, focused, _markerDragging, cockpit.isActive,
      );

      // ── Planet moon visibility (hover-to-reveal in preview mode) ──
      if (hitPlanet && planetId && !focused && !cockpit.isActive && !planetZoomed) {
        planetSystem.setHoveredPlanet(planetId);
      } else if (!hitPlanet || focused || cockpit.isActive || planetZoomed) {
        planetSystem.clearHoveredPlanet();
      }

      // ── 3D hover labels (star-map style) ──
      labelManager.update(
        { hitTorus, hitSaucer, hitToggle, hitPlanet, planetId },
        dt,
        focused || cockpit.isActive || planetZoomed,
      );

      // ── Planet constellation hover ────────────────
      if (!focused && !cockpit.isActive) {
        const cTargets = planetSystem.getConstellationTargets();
        if (cTargets.length > 0) {
          raycaster.setFromCamera(sceneCamera.pointer, camera);
          const cHits = raycaster.intersectObjects(cTargets);
          planetSystem.handleHover(cHits.length > 0 ? cHits[0].object : null);
        } else {
          planetSystem.handleHover(null);
        }
      }

      // ── Planet system update ──────────────────────
      planetSystem.update(t, dt);
      infoBillboard.update(t, dt);

      // ── Update subsystems ──
      const currentAccent = getAccentColor();
      cubeField.update(t, dt, hoveredCube, currentAccent);
      galaxyManager.update(t, dt);
      torusKnot.update(t, dt);
      saucer.update(t, dt);
      themeToggle.group.visible = !focused && !planetZoomed; // hide during torus explore or planet zoom
      themeToggle.update(dt);

      // ── Hide explosions & torus during planet zoom ──
      galaxyManager.setVisible(!planetZoomed);
      torusKnot.setPreviewVisible(!planetZoomed);

      // ── Torus params change detection ──
      const current = torusParamsRef.current;
      if (current && paramsChanged(current, prevParams)) {
        prevParams = { ...current };
        torusKnot.rebuild(current);
        onTorusParamsChangeRef.current?.(torusKnot.getState());
      }

      // ── Render with shake + bloom ──
      postProcessing.render(galaxyManager.getShake());

      // Composite logo scene on top (no bloom)
      // Clear depth only — color buffer has the bloom output
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(scene, camera);
      renderer.autoClear = true;

      css2DRenderer.render(labelManager.getScene(), camera);
    };

    animate();

    // ── Resize handler ──────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      postProcessing.setSize(window.innerWidth, window.innerHeight);
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
      planetSystem.dispose();
      infoBillboard.dispose();
      postProcessing.dispose();
      if (_themeCleanup) _themeCleanup();
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
