
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import CubeGroup from './CubeGroup';
import ThreeSceneManager from './utils/ThreeSceneManager';
import ThreeEventManager from './utils/ThreeEventManager';
import ThreeAnimator from './utils/ThreeAnimator';


const ThreeBackground = () => {
  const sceneManager = useRef();
  const cubeGroup = useRef();
  const eventManager = useRef();
  const animator = useRef();
  const raycaster = useRef();
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Setup scene, camera, renderer
    sceneManager.current = new ThreeSceneManager();
    raycaster.current = new THREE.Raycaster();

    // Create cubes using CubeGroup
    cubeGroup.current = new CubeGroup(sceneManager.current.scene);

    // Mouse move for hover
    const onPointerMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      lastPointer.current.x = x;
      lastPointer.current.y = y;
    };

    // Event manager for resize and drag
    eventManager.current = new ThreeEventManager(sceneManager.current, onPointerMove);

    // Animation loop
    animator.current = new ThreeAnimator({
      animate: (t, dt) => {
        // Hover detection
        raycaster.current.setFromCamera(lastPointer.current, sceneManager.current.camera);
        const meshes = cubeGroup.current.getMeshes();
        const intersects = raycaster.current.intersectObjects(meshes);
        let newHovered = intersects.length > 0 ? intersects[0].object : null;
        if (cubeGroup.current.hoveredCube !== newHovered) {
          cubeGroup.current.setHoveredCube(newHovered);
        }
        cubeGroup.current.update(t, dt);
        // Apply scene rotation
        if (sceneManager.current._sceneRotation) {
          sceneManager.current.scene.rotation.x = sceneManager.current._sceneRotation.x;
          sceneManager.current.scene.rotation.y = sceneManager.current._sceneRotation.y;
        }
        sceneManager.current.renderer.render(sceneManager.current.scene, sceneManager.current.camera);
      }
    });
    animator.current.start();

    return () => {
      animator.current.stop();
      eventManager.current.dispose();
      sceneManager.current.dispose();
      if (cubeGroup.current) cubeGroup.current.dispose();
    };
  }, []);

  return null;
};

export default ThreeBackground;