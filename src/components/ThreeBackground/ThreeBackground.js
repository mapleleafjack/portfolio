import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeBackground = () => {
  const sceneRef = useRef();
  const scene = useRef(new THREE.Scene());
  const camera = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const renderer = useRef(new THREE.WebGLRenderer({ alpha: true })); // Keep alpha for transparency
  const cubes = useRef([]);

  useEffect(() => {
    const setSize = () => {
      renderer.current.setSize(window.innerWidth, window.innerHeight);
      camera.current.aspect = window.innerWidth / window.innerHeight;
      camera.current.updateProjectionMatrix();
    };

    // Initialize scene, camera, and renderer
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.current.domElement); // Append to body, behind all content

    camera.current.position.z = 5;

    // Set the scene background to a dark color
    scene.current.background = new THREE.Color(0x111111); // Dark grey background

    // Create dark cubes (darker color, subtle contrast)
    for (let i = 0; i < 50; i++) {
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const material = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true }); // Black cubes with wireframe
      const cube = new THREE.Mesh(geometry, material);

      // Randomize cube positions
      cube.position.x = (Math.random() - 0.5) * 10;
      cube.position.y = (Math.random() - 0.5) * 10;
      cube.position.z = (Math.random() - 0.5) * 10;

      scene.current.add(cube);
      cubes.current.push(cube);
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate the cubes for animation
      cubes.current.forEach((cube) => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      });

      renderer.current.render(scene.current, camera.current);
    };

    // Handle window resizing
    window.addEventListener('resize', setSize);

    animate();
    setSize(); // Set initial size

    return () => {
      document.body.removeChild(renderer.current.domElement);
      window.removeEventListener('resize', setSize);
    };
  }, []);

  return null; // No visible component, just the background
};

export default ThreeBackground;
