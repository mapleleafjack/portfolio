import * as THREE from 'three';

const ACCENT_COLOR = 0x9eb8a2;
const PALETTE = [0x222222, 0xffffff];

const ROUTE_COLORS = {
  '/': 0x9eb8a2,
  '/experience': 0x6b9eb8,
  '/creative': 0xb89e6b,
  '/working-style': 0xb86b9e,
  '/contact': 0x6bb89e
};

const ROUTE_CUBE_ASSIGNMENTS = {
  '/': [0, 1, 2, 3, 4, 5, 6, 7],
  '/experience': [8, 9, 10, 11, 12, 13, 14, 15],
  '/creative': [16, 17, 18, 19, 20, 21, 22, 23],
  '/working-style': [24, 25, 26, 27, 28, 29, 30, 31],
  '/contact': [32, 33, 34, 35, 36, 37, 38, 39]
};

export default class CubeGroup {
  constructor(scene, numCubes = 40) {
    this.cubes = [];
    this.scene = scene;
    this.NUM_CUBES = numCubes;
    this.ACCENT_COLOR = ACCENT_COLOR;
    this.palette = PALETTE;
    this.currentRoute = '/';
    this.createCubes();
    this.hoveredCube = null;
    this.hoveredCubeBaseOpacity = 1;
    this.glowMesh = null;
  }

  createCubes() {
    for (let i = 0; i < this.NUM_CUBES; i++) {
      const size = 0.35 + Math.random() * 0.45;
      const geometry = new THREE.BoxGeometry(size, size, size);
      
      let assignedRoute = '/';
      for (const [route, indices] of Object.entries(ROUTE_CUBE_ASSIGNMENTS)) {
        if (indices.includes(i)) {
          assignedRoute = route;
          break;
        }
      }
      
      const routeColor = ROUTE_COLORS[assignedRoute];
      const color = this.palette[Math.floor(Math.random() * this.palette.length)];
      const material = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 1 });
      const cube = new THREE.Mesh(geometry, material);
      let baseX, baseY, baseZ, tries = 0;
      do {
        baseX = (Math.random() - 0.5) * 14;
        baseY = (Math.random() - 0.5) * 10;
        baseZ = (Math.random() - 0.5) * 14;
        tries++;
      } while (
        Math.abs(baseX) < 4.5 && Math.abs(baseY) < 3.3 && Math.abs(baseZ) < 4.5 && tries < 20
      );
      cube.position.set(baseX, baseY, baseZ);
      cube.userData = {
        basePosition: { x: baseX, y: baseY, z: baseZ },
        pulsePhase: Math.random() * Math.PI * 2,
        defaultColor: color,
        routeColor: routeColor,
        assignedRoute: assignedRoute,
        defaultOpacity: material.opacity,
        hoverLerp: 0,
        hoverScale: 1,
        hoverGlow: 0,
        routeActiveLerp: 0
      };
      this.scene.add(cube);
      this.cubes.push(cube);
    }
  }

  getMeshes() {
    return this.cubes;
  }

  setCurrentRoute(route) {
    this.currentRoute = route;
  }

  setHoveredCube(cube) {
    this.hoveredCube = cube;
    if (cube) this.hoveredCubeBaseOpacity = cube.userData.defaultOpacity;
    this.cubes.forEach(c => {
      c.userData.hoverLerp = 0;
      c.userData.hoverScale = 1;
      c.userData.hoverGlow = 0;
    });
    if (this.glowMesh) {
      this.scene.remove(this.glowMesh);
      this.glowMesh.geometry.dispose();
      this.glowMesh.material.dispose();
      this.glowMesh = null;
    }
    if (cube) {
      const glowGeo = cube.geometry.clone();
      const glowMat = new THREE.MeshBasicMaterial({
        color: this.ACCENT_COLOR,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide
      });
      this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
      this.glowMesh.scale.copy(cube.scale).multiplyScalar(1.35);
      this.glowMesh.position.copy(cube.position);
      this.glowMesh.quaternion.copy(cube.quaternion);
      this.scene.add(this.glowMesh);
    }
  }

  update(t, dt) {
    this.cubes.forEach((cube, i) => {
      const isRouteActive = cube.userData.assignedRoute === this.currentRoute;
      
      if (cube === this.hoveredCube) {
        cube.userData.hoverLerp += (1 - cube.userData.hoverLerp) * 0.18;
        cube.userData.hoverScale += (1.45 - cube.userData.hoverScale) * 0.18;
        cube.userData.hoverGlow += (0.45 * this.hoveredCubeBaseOpacity - cube.userData.hoverGlow) * 0.18;
      } else {
        cube.userData.hoverLerp += (0 - cube.userData.hoverLerp) * 0.18;
        cube.userData.hoverScale += (1 - cube.userData.hoverScale) * 0.18;
        cube.userData.hoverGlow += (0 - cube.userData.hoverGlow) * 0.18;
      }
      
      const targetRouteLerp = isRouteActive ? 1 : 0;
      cube.userData.routeActiveLerp += (targetRouteLerp - cube.userData.routeActiveLerp) * 0.08;
      
      const floatY = Math.sin(t * 0.7 + i) * 0.25;
      const driftX = Math.sin(t * 0.35 + i) * 0.08;
      const driftZ = Math.cos(t * 0.25 + i * 1.3) * 0.08;
      cube.position.x = cube.userData.basePosition.x + driftX;
      cube.position.y = cube.userData.basePosition.y + floatY;
      cube.position.z = cube.userData.basePosition.z + driftZ;
      
      let pulse = 0.92 + 0.08 * Math.sin(t * 0.9 + cube.userData.pulsePhase);
      if (isRouteActive) {
        pulse += 0.15 * Math.sin(t * 2 + cube.userData.pulsePhase);
      }
      let thisPulse = pulse * cube.userData.hoverScale;
      cube.scale.set(thisPulse, thisPulse, thisPulse);
      
      const baseOpacity = cube.userData.defaultOpacity;
      const routeBoost = isRouteActive ? 0.4 : 0;
      cube.material.opacity = (cube === this.hoveredCube)
        ? this.hoveredCubeBaseOpacity + cube.userData.hoverGlow
        : baseOpacity + routeBoost * cube.userData.routeActiveLerp;
      
      if (cube.userData.defaultColor && cube.material.color) {
        const baseColor = new THREE.Color(cube.userData.defaultColor);
        const accentColor = new THREE.Color(this.ACCENT_COLOR);
        const routeColor = new THREE.Color(cube.userData.routeColor);
        
        baseColor.lerp(accentColor, cube.userData.hoverLerp * ((cube === this.hoveredCube) ? this.hoveredCubeBaseOpacity : cube.userData.defaultOpacity));
        baseColor.lerp(routeColor, cube.userData.routeActiveLerp * 0.8);
        
        cube.material.color.copy(baseColor);
      }
      
      if (cube === this.hoveredCube || isRouteActive) {
        const spinAxis = new THREE.Vector3(0, 1, 0);
        const spinSpeed = isRouteActive ? 0.02 : 0.04;
        const spinAngle = spinSpeed * dt * 60;
        const spinQuat = new THREE.Quaternion().setFromAxisAngle(spinAxis, spinAngle);
        cube.quaternion.multiply(spinQuat);
      }
      
      if (cube === this.hoveredCube && this.glowMesh) {
        this.glowMesh.position.copy(cube.position);
        this.glowMesh.quaternion.copy(cube.quaternion);
        this.glowMesh.scale.copy(cube.scale).multiplyScalar(1.35 + 0.1 * Math.sin(t * 2));
        this.glowMesh.material.opacity = 0.45 * this.hoveredCubeBaseOpacity * cube.userData.hoverLerp;
      }
      if (cube !== this.hoveredCube && this.glowMesh) {
        this.glowMesh.material.opacity = 0;
      }
    });
  }

  dispose() {
    this.cubes.forEach(cube => {
      this.scene.remove(cube);
      cube.geometry.dispose();
      cube.material.dispose();
    });
    this.cubes = [];
    if (this.glowMesh) {
      this.scene.remove(this.glowMesh);
      this.glowMesh.geometry.dispose();
      this.glowMesh.material.dispose();
      this.glowMesh = null;
    }
  }
}
