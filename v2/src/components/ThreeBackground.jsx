import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import GalaxyManager from './GalaxyEffect';

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
    const sceneRotation = { x: 0, y: 0 };       // target rotation
    const smoothRotation = { x: 0, y: 0 };      // current (lerped)
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
      if (e.button === 0 && (e.metaKey || e.ctrlKey)) {
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
      lastDrag.x = e.clientX;
      lastDrag.y = e.clientY;
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handleDragMove, { passive: true });

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
        sceneRotation.y += (mid.x - lastTouch.x) * 0.005;
        sceneRotation.x += (mid.y - lastTouch.y) * 0.005;
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

    // Galaxy effect
    const galaxyManager = new GalaxyManager(sceneGroup);

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

        // Spin — faster on hover
        const spinSpeed = d.spinSpeed + d.hoverLerp * 0.04;
        const q = new THREE.Quaternion().setFromAxisAngle(d.spinAxis, spinSpeed);
        cube.quaternion.multiply(q);

        // Scale — subtle grow on hover
        const s = 1 + d.hoverLerp * 0.35;
        cube.scale.setScalar(s);

        // Colour — lerp toward accent on hover
        cube.material.color.copy(d.baseColor).lerp(accent, d.hoverLerp * 0.7);

        // Opacity — brighten on hover
        cube.material.opacity = d.baseOpacity + d.hoverLerp * 0.35;

        // Gentle idle sway
        cube.position.x = d.basePosition.x + Math.sin(t * d.idleSpeed * 0.4 + d.idlePhase) * 0.05;
        cube.position.y = d.basePosition.y + Math.sin(t * d.idleSpeed + d.idlePhase) * 0.08;
        cube.position.z = d.basePosition.z + Math.cos(t * d.idleSpeed * 0.3 + d.idlePhase * 1.5) * 0.04;
      });

      // Update galaxies
      galaxyManager.update(t, dt);

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
      galaxyManager.dispose();
      cubes.forEach((cube) => {
        cube.geometry.dispose();
        cube.material.dispose();
        sceneGroup.remove(cube);
      });
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
