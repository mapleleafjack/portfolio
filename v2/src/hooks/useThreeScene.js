import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import PostProcessing from '../components/three/scene/PostProcessing';

/**
 * useThreeScene — creates and manages the Three.js scene lifecycle.
 *
 * Handles scene/camera/renderer/controls creation, resize, and cleanup.
 * Returns a ref that is populated with all scene resources once ready.
 * Keeps ~100 lines of boilerplate out of ThreeBackground.
 *
 * @param {React.RefObject<HTMLElement>} containerRef
 * @returns {React.RefObject<object|null>} resourcesRef — { scene, bloomScene, camera, renderer,
 *   css2DRenderer, orbitControls, sceneGroup, clock, raycaster, postProcessing }
 */
export default function useThreeScene(containerRef) {
  const resourcesRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene ──────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ─────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;

    // ── Renderer ───────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    // ── Post-processing (bloom) ────────────────────────
    const bloomScene = new THREE.Scene();

    const _initialStyle = getComputedStyle(document.documentElement);
    const _initialBg = _initialStyle.getPropertyValue('--bg').trim() || '#0a0a0a';
    bloomScene.background = new THREE.Color(_initialBg);

    const postProcessing = new PostProcessing(
      renderer, bloomScene, camera,
      window.innerWidth, window.innerHeight,
    );

    // ── CSS2DRenderer ──────────────────────────────────
    const css2DRenderer = new CSS2DRenderer();
    css2DRenderer.setSize(window.innerWidth, window.innerHeight);
    css2DRenderer.domElement.style.position = 'absolute';
    css2DRenderer.domElement.style.top = '0';
    css2DRenderer.domElement.style.left = '0';
    css2DRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(css2DRenderer.domElement);

    // ── OrbitControls ──────────────────────────────────
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enabled = false;
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.minDistance = 2;
    orbitControls.maxDistance = 12;

    // ── Scene group ────────────────────────────────────
    const sceneGroup = new THREE.Group();
    bloomScene.add(sceneGroup);

    // ── Raycaster ──────────────────────────────────────
    const raycaster = new THREE.Raycaster();

    // ── Clock ──────────────────────────────────────────
    const clock = new THREE.Clock();

    // ── Resize handler ─────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      postProcessing.setSize(window.innerWidth, window.innerHeight);
      css2DRenderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ── Populate ref ───────────────────────────────────
    const resources = {
      scene,
      bloomScene,
      camera,
      renderer,
      css2DRenderer,
      orbitControls,
      sceneGroup,
      clock,
      raycaster,
      postProcessing,
    };
    resourcesRef.current = resources;

    // ── Cleanup ────────────────────────────────────────
    return () => {
      window.removeEventListener('resize', handleResize);
      orbitControls.dispose();
      postProcessing.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (container.contains(css2DRenderer.domElement)) {
        container.removeChild(css2DRenderer.domElement);
      }
      resourcesRef.current = null;
    };
  }, []);

  return resourcesRef;
}
