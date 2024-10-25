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

    for (let i = 0; i < 50; i++) {
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const material = new THREE.MeshBasicMaterial({ color: "grey", wireframe: true });
      const cube = new THREE.Mesh(geometry, material);

      cube.position.x = (Math.random() - 0.5) * 10;
      cube.position.y = (Math.random() - 0.5) * 10;
      cube.position.z = (Math.random() - 0.5) * 10;

      scene.current.add(cube);
      cubes.current.push(cube);
    }

    const animate = () => {
      requestAnimationFrame(animate);

      cubes.current.forEach(cube => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      });

      renderer.current.render(scene.current, camera.current);
    };

    window.addEventListener('resize', setSize);
    setSize(); // Set initial size
    animate();

    return () => {
      window.removeEventListener('resize', setSize);
      document.body.removeChild(renderer.current.domElement);
    };
  }, []);

  return null; // No visible component, just the background
};

export default ThreeBackground;
