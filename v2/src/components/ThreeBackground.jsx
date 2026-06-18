import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GalaxyManager from './GalaxyEffect';
import FlyingSaucer from './FlyingSaucer';

const NUM_CUBES = 35;

// Read the current accent colour from CSS custom properties
function getAccentColor() {
  const style = getComputedStyle(document.documentElement);
  const hex = style.getPropertyValue('--accent').trim() || '#f0c830';
  return new THREE.Color(hex);
}

export default function ThreeBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Scene group — we rotate this on drag instead of moving the camera
    const sceneGroup = new THREE.Group();
    scene.add(sceneGroup);
    const sceneRotation = { x: 0, y: 0 };       // target rotation (drift + user)
    const smoothRotation = { x: 0, y: 0 };      // current (lerped)
    const userRotation = { x: 0, y: 0 };         // user-driven rotation only
    const smoothUserRotation = { x: 0, y: 0 };   // current (lerped)
    let lastDragTime = 0;                          // timestamp of last drag input
    const RETURN_DELAY = 2.0;                      // seconds before returning to center
    let targetZoom = camera.position.z;           // pinch-zoom target
    const ZOOM_MIN = 2;
    const ZOOM_MAX = 12;

    // Raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-999, -999);
    let hoveredCube = null;

    // Create cubes
    const cubes = [];
    const accentColor = getAccentColor();

    for (let i = 0; i < NUM_CUBES; i++) {
      const size = 0.3 + Math.random() * 0.5;
      const geometry = new THREE.BoxGeometry(size, size, size);

      // ~20% of cubes get a hint of the accent colour
      const hasAccent = Math.random() < 0.2;
      const isLight = Math.random() > 0.5;
      const baseColor = hasAccent
        ? accentColor.clone().lerp(new THREE.Color(isLight ? '#555555' : '#0a0a0a'), 0.6)
        : new THREE.Color(isLight ? '#555555' : '#0a0a0a');
      const opacity = 0.15 + Math.random() * 0.35;

      const material = new THREE.MeshBasicMaterial({
        color: baseColor,
        wireframe: true,
        transparent: true,
        opacity,
      });

      const cube = new THREE.Mesh(geometry, material);

      // Spread cubes across a wide area, keeping a clear zone near centre
      let x, y, z, tries = 0;
      do {
        x = (Math.random() - 0.5) * 14;
        y = (Math.random() - 0.5) * 10;
        z = (Math.random() - 0.5) * 14;
        tries++;
      } while (
        Math.abs(x) < 3.5 && Math.abs(y) < 2.5 && Math.abs(z) < 3.5 && tries < 20
      );

      cube.position.set(x, y, z);

      // Store per-cube animation data
      cube.userData = {
        spinAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        spinSpeed: 0.002 + Math.random() * 0.004,
        idlePhase: Math.random() * Math.PI * 2,
        idleSpeed: 0.2 + Math.random() * 0.3,
        basePosition: { x, y, z },
        baseColor: baseColor.clone(),
        baseOpacity: opacity,
        hoverLerp: 0,       // 0 = idle, 1 = fully hovered
        hitLerp: 0,         // 0 = normal, 1 = just hit by laser
        hitSpin: new THREE.Vector3(),
      };

      sceneGroup.add(cube);
      cubes.push(cube);
    }

    // ── Pointer tracking ──────────────────────────────────
    const handlePointerMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // ── Cmd/Ctrl + drag (desktop) ─────────────────────────
    let isDragging = false;
    const lastDrag = { x: 0, y: 0 };

    const handlePointerDown = (e) => {
      if ((e.button === 0 && (e.metaKey || e.ctrlKey)) || e.button === 1) {
        isDragging = true;
        lastDrag.x = e.clientX;
        lastDrag.y = e.clientY;
        e.preventDefault();
      }
    };
    const handlePointerUp = () => { isDragging = false; };
    const handleDragMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastDrag.x;
      const dy = e.clientY - lastDrag.y;
      sceneRotation.y += dx * 0.005;
      sceneRotation.x += dy * 0.005;
      userRotation.y += dx * 0.005;
      userRotation.x += dy * 0.005;
      lastDragTime = performance.now() / 1000;
      lastDrag.x = e.clientX;
      lastDrag.y = e.clientY;
    };

    // Prevent default middle-click auto-scroll
    const handleAuxClick = (e) => { if (e.button === 1) e.preventDefault(); };
    const handleMouseDown = (e) => { if (e.button === 1) e.preventDefault(); };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handleDragMove, { passive: true });
    window.addEventListener('auxclick', handleAuxClick);
    window.addEventListener('mousedown', handleMouseDown);

    // ── Scroll wheel zoom (desktop) ─────────────────────────
    const handleWheel = (e) => {
      e.preventDefault();
      targetZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, targetZoom + e.deltaY * 0.005));
    };
    window.addEventListener('wheel', handleWheel, { passive: false });

    // ── Two-finger drag (touch) ───────────────────────────
    // Distinguishes drag from pinch: only rotates when the midpoint
    // moves but the finger spread stays roughly constant.
    let touchDragging = false;
    const lastTouch = { x: 0, y: 0 };
    let lastSpread = 0;

    function midpoint(touches) {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    }

    function spread(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        touchDragging = true;
        const mid = midpoint(e.touches);
        lastTouch.x = mid.x;
        lastTouch.y = mid.y;
        lastSpread = spread(e.touches);
      }
    };
    const handleTouchMove = (e) => {
      if (!touchDragging || e.touches.length !== 2) return;
      const mid = midpoint(e.touches);
      const currentSpread = spread(e.touches);
      const spreadDelta = Math.abs(currentSpread - lastSpread);
      const midDelta = Math.sqrt(
        (mid.x - lastTouch.x) ** 2 + (mid.y - lastTouch.y) ** 2
      );

      e.preventDefault();

      // Pinch → zoom the camera
      if (spreadDelta > 2) {
        const zoomDelta = (currentSpread - lastSpread) * 0.012;
        targetZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, targetZoom - zoomDelta));
      }

      // Drag → rotate the scene (only when spread is mostly stable)
      if (spreadDelta < midDelta * 0.8) {
        const dxR = (mid.x - lastTouch.x) * 0.005;
        const dyR = (mid.y - lastTouch.y) * 0.005;
        sceneRotation.y += dxR;
        sceneRotation.x += dyR;
        userRotation.y += dxR;
        userRotation.x += dyR;
        lastDragTime = performance.now() / 1000;
      }

      lastTouch.x = mid.x;
      lastTouch.y = mid.y;
      lastSpread = currentSpread;
    };
    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) touchDragging = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    // ── Logo 3D model + PNG texture on front ─────────
    const logoGroup = new THREE.Group();
    const isMobile = window.innerWidth < 640;
    const logoY = 0;
    const logoScale = isMobile ? 0.75 : 1;
    logoGroup.position.set(0, logoY, 0);
    scene.add(logoGroup);
    const logoMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
    // PNG texture for the detailed artwork
    const logoTexture = new THREE.TextureLoader().load('/images/jackmusajo_black.png');
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    const overlayMat = new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
    });
    const gltfLoader = new GLTFLoader();
    let logoMesh = null;
    let overlayGeo = null;
    let overlayFront = null;
    let overlayBack = null;
    gltfLoader.load('/images/jackmusajo_logo_3d_model/jackmusajo_logo_extruded_160mm.glb', (gltf) => {
      logoMesh = gltf.scene;
      const box = new THREE.Box3().setFromObject(logoMesh);
      const size = new THREE.Vector3();
      box.getSize(size);
      const targetWidth = 2.4 * logoScale;
      const scaleFactor = targetWidth / size.x;
      logoMesh.scale.set(scaleFactor, scaleFactor, scaleFactor * 0.15);
      // Center the model
      box.setFromObject(logoMesh);
      const center = new THREE.Vector3();
      box.getCenter(center);
      logoMesh.position.sub(center);
      logoMesh.traverse((child) => {
        if (child.isMesh) {
          child.material = logoMaterial;
        }
      });
      // Measure the scaled model to size the PNG overlay correctly
      const finalBox = new THREE.Box3().setFromObject(logoMesh);
      const finalSize = new THREE.Vector3();
      finalBox.getSize(finalSize);
      overlayGeo = new THREE.PlaneGeometry(finalSize.x, finalSize.y);
      overlayFront = new THREE.Mesh(overlayGeo, overlayMat);
      overlayBack = new THREE.Mesh(overlayGeo, overlayMat);
      overlayFront.position.set(0, 0, finalBox.max.z + 0.002);
      overlayBack.position.set(0, 0, finalBox.min.z - 0.002);
      logoGroup.add(logoMesh);
      logoGroup.add(overlayFront);
      logoGroup.add(overlayBack);
    });

    // Galaxy effect
    const galaxyManager = new GalaxyManager(sceneGroup);

    // Flying saucer orbiting the scene
    const saucer = new FlyingSaucer(sceneGroup, cubes);

    const handleClick = (e) => {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey) return;
      galaxyManager.spawn(pointer, camera);
    };
    window.addEventListener('click', handleClick);

    // Animation loop
    let animationId;
    let t = 0;
    const clock = new THREE.Clock();
    const accent = getAccentColor();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      t += dt;

      // Gentle automatic drift (pauses while user is dragging)
      if (!isDragging && !touchDragging) {
        sceneRotation.y += 0.0008;
        sceneRotation.x += Math.sin(t * 0.15) * 0.00012;
      }

      // Smoothly lerp scene rotation (with damping / inertia feel)
      smoothRotation.x += (sceneRotation.x - smoothRotation.x) * 0.08;
      smoothRotation.y += (sceneRotation.y - smoothRotation.y) * 0.08;
      sceneGroup.rotation.x = smoothRotation.x;
      sceneGroup.rotation.y = smoothRotation.y;

      // Logo follows only user-driven rotation (no auto-drift)
      // Decay back to center after RETURN_DELAY seconds of no input
      const now = performance.now() / 1000;
      if (!isDragging && !touchDragging && now - lastDragTime > RETURN_DELAY) {
        userRotation.x += (0 - userRotation.x) * 0.03;
        userRotation.y += (0 - userRotation.y) * 0.03;
      }
      smoothUserRotation.x += (userRotation.x - smoothUserRotation.x) * 0.08;
      smoothUserRotation.y += (userRotation.y - smoothUserRotation.y) * 0.08;
      logoGroup.rotation.x = smoothUserRotation.x;
      logoGroup.rotation.y = smoothUserRotation.y;

      // Smoothly lerp camera zoom
      camera.position.z += (targetZoom - camera.position.z) * 0.08;

      // Raycast for hover
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(cubes);
      hoveredCube = intersects.length > 0 ? intersects[0].object : null;

      cubes.forEach((cube) => {
        const d = cube.userData;
        const isHovered = cube === hoveredCube;

        // Smooth hover lerp
        const hoverTarget = isHovered ? 1 : 0;
        d.hoverLerp += (hoverTarget - d.hoverLerp) * (isHovered ? 0.12 : 0.06);

        // Decay hit reaction
        if (d.hitLerp > 0.001) {
          d.hitLerp *= 0.94; // smooth decay
          // Apply tumble kick from laser hit
          const hq = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
              d.hitSpin.x * d.hitLerp,
              d.hitSpin.y * d.hitLerp,
              d.hitSpin.z * d.hitLerp,
            )
          );
          cube.quaternion.multiply(hq);
        } else {
          d.hitLerp = 0;
        }

        // Spin — faster on hover or hit
        const spinSpeed = d.spinSpeed + d.hoverLerp * 0.04 + d.hitLerp * 0.06;
        const q = new THREE.Quaternion().setFromAxisAngle(d.spinAxis, spinSpeed);
        cube.quaternion.multiply(q);

        // Scale — grow on hover, pop on hit
        const s = 1 + d.hoverLerp * 0.35 + d.hitLerp * 0.5;
        cube.scale.setScalar(s);

        // Colour — lerp toward accent on hover or hit
        const accentBlend = Math.max(d.hoverLerp * 0.7, d.hitLerp);
        cube.material.color.copy(d.baseColor).lerp(accent, accentBlend);

        // Opacity — brighten on hover or hit
        cube.material.opacity = d.baseOpacity + d.hoverLerp * 0.35 + d.hitLerp * 0.5;

        // Gentle idle sway
        cube.position.x = d.basePosition.x + Math.sin(t * d.idleSpeed * 0.4 + d.idlePhase) * 0.05;
        cube.position.y = d.basePosition.y + Math.sin(t * d.idleSpeed + d.idlePhase) * 0.08;
        cube.position.z = d.basePosition.z + Math.cos(t * d.idleSpeed * 0.3 + d.idlePhase * 1.5) * 0.04;
      });

      // Update galaxies
      galaxyManager.update(t, dt);

      // Update flying saucer
      saucer.update(t, dt);

      // Camera shake from galaxy collapse (temporary offset, restored after render)
      const shake = galaxyManager.getShake();
      let shakeX = 0, shakeY = 0;
      if (shake > 0.001) {
        shakeX = (Math.random() - 0.5) * 2 * shake;
        shakeY = (Math.random() - 0.5) * 2 * shake;
        camera.position.x += shakeX;
        camera.position.y += shakeY;
      }

      renderer.render(scene, camera);

      // Restore camera position
      if (shake > 0.001) {
        camera.position.x -= shakeX;
        camera.position.y -= shakeY;
      }
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      const mobile = window.innerWidth < 640;
      logoGroup.position.y = 0;
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handleDragMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('auxclick', handleAuxClick);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('wheel', handleWheel);
      galaxyManager.dispose();
      saucer.dispose();
      cubes.forEach((cube) => {
        cube.geometry.dispose();
        cube.material.dispose();
        sceneGroup.remove(cube);
      });
      if (logoMesh) {
        logoGroup.remove(logoMesh);
        logoMesh.traverse((child) => {
          if (child.isMesh) child.geometry.dispose();
        });
      }
      if (overlayFront) logoGroup.remove(overlayFront);
      if (overlayBack) logoGroup.remove(overlayBack);
      if (overlayGeo) overlayGeo.dispose();
      overlayMat.dispose();
      logoTexture.dispose();
      scene.remove(logoGroup);
      logoMaterial.dispose();
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
