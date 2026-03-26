import * as THREE from 'three';

export default class NavigationPortals {
  constructor(scene) {
    this.scene = scene;
    this.portals = [];
    this.labels = [];
    this.currentRoute = '/';
    this.accentColor = new THREE.Color(0xcccccc);
    
    this.routes = [
      { path: '/', label: 'Home', position: { x: 0, y: 4.5, z: -10 } },
      { path: '/experience', label: 'Code', position: { x: -6, y: 2, z: -10 } },
      { path: '/creative', label: 'Creative', position: { x: 6, y: 2, z: -10 } },
      { path: '/working-style', label: 'Working Style', position: { x: -6, y: -2, z: -10 } },
      { path: '/contact', label: 'Contact', position: { x: 6, y: -2, z: -10 } }
    ];
    
    this.createPortals();
  }

  createPortals() {
    this.routes.forEach((route, index) => {
      const portalGroup = new THREE.Group();
      
      const geometry = new THREE.RingGeometry(0.3, 0.4, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(geometry, material);
      ring.userData = {
        route: route.path,
        label: route.label,
        isPortal: true,
        baseOpacity: 0.15,
        hoverOpacity: 0.6,
        currentOpacity: 0.15,
        pulsePhase: index * Math.PI / 3
      };
      
      portalGroup.add(ring);
      portalGroup.position.set(route.position.x, route.position.y, route.position.z);
      
      this.scene.add(portalGroup);
      this.portals.push(ring);
    });
  }

  setCurrentRoute(route) {
    this.currentRoute = route;
  }

  setAccentColor(hex) {
    this.accentColor = new THREE.Color(hex);
  }

  setHoveredPortal(portal) {
    this.portals.forEach(p => {
      if (p === portal) {
        p.userData.isHovered = true;
      } else {
        p.userData.isHovered = false;
      }
    });
  }

  update(t, dt) {
    this.portals.forEach(portal => {
      const isActive = portal.userData.route === this.currentRoute;
      const targetOpacity = isActive ? 0.7 : (portal.userData.isHovered ? portal.userData.hoverOpacity : portal.userData.baseOpacity);
      
      portal.userData.currentOpacity += (targetOpacity - portal.userData.currentOpacity) * 0.1;
      portal.material.opacity = portal.userData.currentOpacity;
      
      const pulse = Math.sin(t * 1.5 + portal.userData.pulsePhase) * 0.03;
      const scale = isActive ? 1.15 + pulse : 1.0 + pulse * 0.3;
      portal.scale.set(scale, scale, 1);
      
      portal.rotation.z += dt * 0.3;
      
      if (isActive) {
        portal.material.color.setHex(0xffffff);
      } else {
        portal.material.color.copy(this.accentColor);
      }
    });
  }

  getPortalMeshes() {
    return this.portals;
  }

  dispose() {
    this.portals.forEach(portal => {
      this.scene.remove(portal.parent);
      portal.geometry.dispose();
      portal.material.dispose();
    });
    this.portals = [];
  }
}
