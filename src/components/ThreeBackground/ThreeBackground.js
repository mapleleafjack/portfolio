
import React, { useEffect, useRef } from 'react';
import { useLocation } from '@reach/router';
import * as THREE from 'three';
import CubeGroup from './CubeGroup';
import NavigationPortals from './NavigationPortals';
import CameraController from './CameraController';
import ThreeSceneManager from './utils/ThreeSceneManager';
import ThreeEventManager from './utils/ThreeEventManager';
import ThreeAnimator from './utils/ThreeAnimator';


const ThreeBackground = () => {
  const location = useLocation();
  const sceneManager = useRef();
  const cubeGroup = useRef();
  const navigationPortals = useRef();
  const cameraController = useRef();
  const eventManager = useRef();
  const animator = useRef();
  const raycaster = useRef();
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    sceneManager.current = new ThreeSceneManager();
    raycaster.current = new THREE.Raycaster();

    cubeGroup.current = new CubeGroup(sceneManager.current.scene);
    navigationPortals.current = new NavigationPortals(sceneManager.current.scene);
    cameraController.current = new CameraController(sceneManager.current.camera);

    const onPointerMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      lastPointer.current.x = x;
      lastPointer.current.y = y;
    };

    const onPointerClick = () => {
      raycaster.current.setFromCamera(lastPointer.current, sceneManager.current.camera);
      const portalMeshes = navigationPortals.current.getPortalMeshes();
      const intersects = raycaster.current.intersectObjects(portalMeshes);
      
      if (intersects.length > 0) {
        const portal = intersects[0].object;
        if (portal.userData.isPortal && portal.userData.route) {
          if (typeof window !== 'undefined' && window.navigate) {
            window.navigate(portal.userData.route);
          }
        }
      }
    };

    eventManager.current = new ThreeEventManager(sceneManager.current, onPointerMove);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('click', onPointerClick);
    }

    animator.current = new ThreeAnimator({
      animate: (t, dt) => {
        raycaster.current.setFromCamera(lastPointer.current, sceneManager.current.camera);
        
        const cubeMeshes = cubeGroup.current.getMeshes();
        const cubeIntersects = raycaster.current.intersectObjects(cubeMeshes);
        let newHoveredCube = cubeIntersects.length > 0 ? cubeIntersects[0].object : null;
        if (cubeGroup.current.hoveredCube !== newHoveredCube) {
          cubeGroup.current.setHoveredCube(newHoveredCube);
        }
        
        const portalMeshes = navigationPortals.current.getPortalMeshes();
        const portalIntersects = raycaster.current.intersectObjects(portalMeshes);
        let newHoveredPortal = portalIntersects.length > 0 ? portalIntersects[0].object : null;
        navigationPortals.current.setHoveredPortal(newHoveredPortal);
        
        cubeGroup.current.update(t, dt);
        navigationPortals.current.update(t, dt);
        cameraController.current.update(dt);
        sceneManager.current.lerpBackground(dt);
        
        if (sceneManager.current._sceneRotation) {
          sceneManager.current.scene.rotation.x = sceneManager.current._sceneRotation.x;
          sceneManager.current.scene.rotation.y = sceneManager.current._sceneRotation.y;
        }
        
        sceneManager.current.renderer.render(sceneManager.current.scene, sceneManager.current.camera);
      }
    });
    animator.current.start();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', onPointerClick);
      }
      animator.current.stop();
      eventManager.current.dispose();
      sceneManager.current.dispose();
      if (cubeGroup.current) cubeGroup.current.dispose();
      if (navigationPortals.current) navigationPortals.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (navigationPortals.current && cameraController.current && cubeGroup.current) {
      const path = location?.pathname || '/';
      const normalizedPath = path === '/' ? path : path.replace(/\/$/, '');
      navigationPortals.current.setCurrentRoute(normalizedPath);
      cameraController.current.setRoute(normalizedPath);
      cubeGroup.current.setCurrentRoute(normalizedPath);
    }
  }, [location]);

  return null;
};

export default ThreeBackground;