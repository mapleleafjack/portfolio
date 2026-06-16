import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const NUM_CUBES = 35;

export default function ThreeBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#ffffff');

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create cubes
    const cubes = [];
    for (let i = 0; i < NUM_CUBES; i++) {
      const size = 0.3 + Math.random() * 0.5;
      const geometry = new THREE.BoxGeometry(size, size, size);

      const isLight = Math.random() > 0.5;
      const color = isLight ? '#555555' : '#0a0a0a';
      const opacity = 0.15 + Math.random() * 0.35;

      const material = new THREE.MeshBasicMaterial({
        color,
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
      };

      scene.add(cube);
      cubes.push(cube);
    }

    // Animation loop
    let animationId;
    let t = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      t += dt;

      cubes.forEach((cube) => {
        const d = cube.userData;

        // Gentle spin
        const q = new THREE.Quaternion().setFromAxisAngle(d.spinAxis, d.spinSpeed);
        cube.quaternion.multiply(q);

        // Gentle idle sway
        cube.position.x = d.basePosition.x + Math.sin(t * d.idleSpeed * 0.4 + d.idlePhase) * 0.05;
        cube.position.y = d.basePosition.y + Math.sin(t * d.idleSpeed + d.idlePhase) * 0.08;
        cube.position.z = d.basePosition.z + Math.cos(t * d.idleSpeed * 0.3 + d.idlePhase * 1.5) * 0.04;
      });

      renderer.render(scene, camera);
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
      cubes.forEach((cube) => {
        cube.geometry.dispose();
        cube.material.dispose();
        scene.remove(cube);
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
