import * as THREE from 'three';

function getAccentColor() {
  const style = getComputedStyle(document.documentElement);
  const hex = style.getPropertyValue('--accent').trim() || '#f0c830';
  return new THREE.Color(hex);
}

export default class FlyingSaucer {
  constructor(parentGroup) {
    this.group = new THREE.Group();
    parentGroup.add(this.group);

    const accent = getAccentColor();

    // ── Body: flattened sphere (classic saucer disc) ──
    const bodyGeo = new THREE.SphereGeometry(0.35, 16, 8);
    const bodyMat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.set(1, 0.25, 1); // flatten
    this.group.add(body);

    // ── Dome: half-sphere on top ──
    const domeGeo = new THREE.SphereGeometry(0.15, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshBasicMaterial({
      color: 0xaaaaaa,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.06;
    this.group.add(dome);

    // ── Ring of lights around the rim ──
    this.lights = [];
    const lightCount = 8;
    const lightGeo = new THREE.SphereGeometry(0.025, 4, 4);
    for (let i = 0; i < lightCount; i++) {
      const angle = (i / lightCount) * Math.PI * 2;
      const lightMat = new THREE.MeshBasicMaterial({
        color: accent.clone(),
        transparent: true,
        opacity: 0.8,
      });
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(
        Math.cos(angle) * 0.33,
        -0.02,
        Math.sin(angle) * 0.33
      );
      this.group.add(light);
      this.lights.push({ mesh: light, mat: lightMat, phase: i / lightCount });
    }

    // ── Beam underneath (subtle tractor beam cone) ──
    const beamGeo = new THREE.ConeGeometry(0.18, 0.5, 8, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: accent.clone(),
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = -0.32;
    beam.rotation.x = Math.PI; // point downward
    this.group.add(beam);
    this.beamMat = beamMat;

    // ── Orbit parameters ──
    this.orbitRadiusX = 4.5 + Math.random() * 1.5;
    this.orbitRadiusZ = 3.5 + Math.random() * 1.5;
    this.orbitSpeed = 0.15 + Math.random() * 0.1;
    this.orbitTilt = 0.3 + Math.random() * 0.3;     // tilt of the orbit plane
    this.orbitPhase = Math.random() * Math.PI * 2;   // starting angle
    this.bobSpeed = 1.5 + Math.random() * 0.5;
    this.bobAmount = 0.15;

    // Scale the whole saucer
    this.group.scale.setScalar(0.6);

    // Store materials for disposal
    this._mats = [bodyMat, domeMat, beamMat, ...this.lights.map(l => l.mat)];
    this._geos = [bodyGeo, domeGeo, lightGeo, beamGeo];
  }

  update(t) {
    const angle = this.orbitPhase + t * this.orbitSpeed;

    // Elliptical orbit
    const x = Math.cos(angle) * this.orbitRadiusX;
    const z = Math.sin(angle) * this.orbitRadiusZ;
    // Tilt the orbit plane
    const y = Math.sin(angle) * this.orbitRadiusZ * Math.sin(this.orbitTilt)
            + Math.sin(t * this.bobSpeed) * this.bobAmount;

    this.group.position.set(x, y, z);

    // Face the direction of travel (tangent to the orbit)
    const nextAngle = angle + 0.01;
    const nx = Math.cos(nextAngle) * this.orbitRadiusX;
    const nz = Math.sin(nextAngle) * this.orbitRadiusZ;
    const dx = nx - x;
    const dz = nz - z;
    this.group.rotation.y = Math.atan2(dx, dz);

    // Slight banking into the turn
    this.group.rotation.z = Math.sin(angle) * 0.15;

    // Subtle wobble
    this.group.rotation.x = Math.sin(t * 1.2) * 0.05;

    // Animate rim lights (sequential pulsing)
    for (const l of this.lights) {
      const pulse = Math.sin(t * 4 + l.phase * Math.PI * 2) * 0.5 + 0.5;
      l.mat.opacity = 0.3 + pulse * 0.7;
    }

    // Beam opacity pulsing
    this.beamMat.opacity = 0.06 + Math.sin(t * 2) * 0.06;
  }

  dispose() {
    for (const mat of this._mats) mat.dispose();
    for (const geo of this._geos) geo.dispose();
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}
