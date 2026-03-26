
import { useEffect, useRef } from 'react';
import { useLocation } from '@reach/router';
import * as THREE from 'three';
import CubeGroup from './CubeGroup';
import NavigationPortals from './NavigationPortals';
import CameraController from './CameraController';
import ThreeSceneManager from './utils/ThreeSceneManager';
import ThreeEventManager from './utils/ThreeEventManager';
import ThreeAnimator from './utils/ThreeAnimator';
import audioManager from '../../utils/AudioManager';


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

    const onPointerClick = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.ctrlKey || e.metaKey) return;
      raycaster.current.setFromCamera(lastPointer.current, sceneManager.current.camera);

      const songCubes = cubeGroup.current.getSongCubes();
      if (songCubes.length > 0) {
        const songHits = raycaster.current.intersectObjects(songCubes, true);
        for (const hit of songHits) {
          let obj = hit.object;
          if (obj.userData._songParent) obj = obj.userData._songParent;
          if (obj.userData.isSongCube && typeof obj.userData.songTrackIndex === 'number') {
            cameraController.current.focusOnPosition(obj.position);
            window.dispatchEvent(new CustomEvent('song-cube-click', {
              detail: { trackIndex: obj.userData.songTrackIndex }
            }));
            return;
          }
        }
      }

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

    const onTrackChange = (e) => {
      if (cubeGroup.current && e.detail && typeof e.detail.trackIndex === 'number') {
        cubeGroup.current.setTrackIndex(e.detail.trackIndex);
        const bg = cubeGroup.current.getTrackBackground();
        sceneManager.current._targetBg = new THREE.Color(bg);
        if (navigationPortals.current) {
          navigationPortals.current.setAccentColor(cubeGroup.current.targetColorScheme.accent);
        }
        const songCube = cubeGroup.current.getSongCubeForTrack(e.detail.trackIndex);
        if (songCube) {
          cameraController.current.focusOnPosition(songCube.position);
        }
      }
    };

    const onCyclePreset = () => {
      if (cubeGroup.current) {
        const name = cubeGroup.current.cyclePreset();
        window.dispatchEvent(new CustomEvent('preset-changed', { detail: { name } }));
      }
    };

    const onStopPlayback = () => {
      if (cubeGroup.current) {
        cubeGroup.current.resetToDefault();
        const bg = cubeGroup.current.getTrackBackground();
        sceneManager.current._targetBg = new THREE.Color(bg);
        if (navigationPortals.current) {
          navigationPortals.current.setAccentColor(0xcccccc);
        }
      }
      cameraController.current.resetToDefault();
    };

    eventManager.current = new ThreeEventManager(sceneManager.current, onPointerMove);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', onPointerClick);
      window.addEventListener('track-change', onTrackChange);
      window.addEventListener('cycle-preset', onCyclePreset);
      window.addEventListener('stop-playback', onStopPlayback);
    }

    animator.current = new ThreeAnimator({
      animate: (t, dt) => {
        const fft = audioManager.getFrequencyData();
        cubeGroup.current.setFFTData(fft);

        raycaster.current.setFromCamera(lastPointer.current, sceneManager.current.camera);
        
        let newHoveredCube = null;
        const songCubes = cubeGroup.current.getSongCubes();
        if (songCubes.length > 0) {
          const songHits = raycaster.current.intersectObjects(songCubes, true);
          for (const hit of songHits) {
            let obj = hit.object;
            if (obj.userData._songParent) obj = obj.userData._songParent;
            if (obj.userData.isSongCube) { newHoveredCube = obj; break; }
          }
        }
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
        window.removeEventListener('pointerdown', onPointerClick);
        window.removeEventListener('track-change', onTrackChange);
        window.removeEventListener('cycle-preset', onCyclePreset);
        window.removeEventListener('stop-playback', onStopPlayback);
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