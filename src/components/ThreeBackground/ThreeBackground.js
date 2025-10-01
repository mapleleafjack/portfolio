import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeBackground = () => {
  const sceneRef = useRef();
  const scene = useRef(null);
  const camera = useRef(null);
  const renderer = useRef(null);
  const cubes = useRef([]);

  useEffect(() => {
    // Only execute if the code is running on the client-side
    if (typeof window === 'undefined') return;

    scene.current = new THREE.Scene();
    camera.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer.current = new THREE.WebGLRenderer({ alpha: true });

    const setSize = () => {
      renderer.current.setSize(window.innerWidth, window.innerHeight);
      camera.current.aspect = window.innerWidth / window.innerHeight;
      camera.current.updateProjectionMatrix();
    };

    // Append renderer to the DOM
    document.body.appendChild(renderer.current.domElement);

    camera.current.position.z = 5;
    scene.current.background = new THREE.Color(0x111111);

    // Store base positions for floating
    cubes.current = [];
    let placed = 0;
    const NUM_CUBES = 12 + Math.floor(Math.random() * 4); // 12-15 cubes
    while (placed < NUM_CUBES) {
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const material = new THREE.MeshBasicMaterial({ color: "grey", wireframe: true });
      const cube = new THREE.Mesh(geometry, material);

      // Avoid center: keep cubes outside a larger central box, and spread them wider
      let baseX, baseY, baseZ;
      let tries = 0;
      do {
        baseX = (Math.random() - 0.5) * 14;
        baseY = (Math.random() - 0.5) * 10;
        baseZ = (Math.random() - 0.5) * 14;
        tries++;
      } while (Math.abs(baseX) < 2.5 && Math.abs(baseY) < 2.5 && Math.abs(baseZ) < 2.5 && tries < 20);

      cube.position.set(baseX, baseY, baseZ);
      cube.userData.basePosition = { x: baseX, y: baseY, z: baseZ };

      scene.current.add(cube);
      cubes.current.push(cube);
      placed++;
    }

    // Mouse and click interaction
    let mouse3D = new THREE.Vector3(0, 0, 0);
    let rotateToMouse = false;
    let lastPointer = { x: 0, y: 0 };
    let clickAnim = [];
    let clickStartTime = 0;
    const CLICK_ANIM_DURATION = 1.2; // seconds
    const onMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      const vector = new THREE.Vector3(x, y, 0.5);
      vector.unproject(camera.current);
      mouse3D.copy(vector);
      lastPointer.x = x;
      lastPointer.y = y;
    };
    const onBackgroundClick = () => {
      rotateToMouse = true;
      clickStartTime = performance.now() / 1000;
      clickAnim = cubes.current.map(cube => {
        const start = cube.quaternion.clone();
        const q = new THREE.Quaternion();
        cube.lookAt(mouse3D);
        q.copy(cube.quaternion);
        cube.quaternion.copy(start); // restore
        return { start, target: q };
      });
    };

    let t = 0;
    let lastFrameTime = performance.now() / 1000;
    const animate = () => {
      requestAnimationFrame(animate);
      const now = performance.now() / 1000;
      const dt = now - lastFrameTime;
      lastFrameTime = now;
      t += dt;

      // Easing function for smoothness
      function easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      }

      cubes.current.forEach((cube, i) => {
        // Subtle floating and drifting
        const floatY = Math.sin(t * 0.7 + i) * 0.25;
        const driftX = Math.sin(t * 0.35 + i) * 0.08;
        const driftZ = Math.cos(t * 0.25 + i * 1.3) * 0.08;
        cube.position.x = cube.userData.basePosition.x + driftX;
        cube.position.y = cube.userData.basePosition.y + floatY;
        cube.position.z = cube.userData.basePosition.z + driftZ;

        if (rotateToMouse && clickAnim[i]) {
          // Slerp from stored start to target quaternion with easing
          const elapsed = now - clickStartTime;
          let tNorm = Math.min(1, elapsed / CLICK_ANIM_DURATION);
          tNorm = easeInOutCubic(tNorm);
          cube.quaternion.slerpQuaternions(clickAnim[i].start, clickAnim[i].target, tNorm);
          if (elapsed >= CLICK_ANIM_DURATION) {
            // Snap to target and resume idle rotation
            cube.quaternion.copy(clickAnim[i].target);
            rotateToMouse = false;
          }
        } else {
          // Smooth idle rotation using slerp toward a slightly rotated orientation
          const idleAxis = new THREE.Vector3(1, 1, 0).normalize();
          const idleAngle = 0.003 * dt * 60; // slower
          const idleQuat = new THREE.Quaternion().setFromAxisAngle(idleAxis, idleAngle);
          cube.quaternion.slerp(idleQuat.multiply(cube.quaternion), 0.04);
        }
      });

      renderer.current.render(scene.current, camera.current);
    };

  window.addEventListener('resize', setSize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onBackgroundClick);
  setSize(); // Set initial size
  animate();

    return () => {
      window.removeEventListener('resize', setSize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onBackgroundClick);
      document.body.removeChild(renderer.current.domElement);
    };
  }, []);

  return null; // No visible component, just the background
};

export default ThreeBackground;
