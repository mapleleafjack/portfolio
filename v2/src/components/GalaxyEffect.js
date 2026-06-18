import * as THREE from 'three';

// 3 size tiers for varied rock debris
const GEO_S = new THREE.BoxGeometry(0.06, 0.06, 0.06);
const GEO_M = new THREE.BoxGeometry(0.12, 0.12, 0.12);
const GEO_L = new THREE.BoxGeometry(0.20, 0.20, 0.20);

const PHASE_SPIRAL = 0;
const PHASE_COLLAPSE = 1;
const PHASE_EXPLODE = 2;
const PHASE_FADE = 3;
const PHASE_DONE = 4;

const TIMING_SPIRAL = 8.0;
const TIMING_COLLAPSE = 1.0;
const TIMING_EXPLODE = 1.5;
const TIMING_FADE = 1.5;
const TIMING_SC = TIMING_SPIRAL + TIMING_COLLAPSE;
const TIMING_SCE = TIMING_SC + TIMING_EXPLODE;

const PARTICLES = 40;
const CLUSTER_RADIUS = 1.0;

const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _zero = new THREE.Vector3(0, 0, 0);
const _raycaster = new THREE.Raycaster();
const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _intersect = new THREE.Vector3();

function getAccentHex() {
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue('--accent').trim() || '#f0c830';
}

function pickGeo() {
  const r = Math.random();
  if (r < 0.15) return GEO_L;
  if (r < 0.45) return GEO_M;
  return GEO_S;
}

class Galaxy {
  constructor(parentGroup, origin) {
    this.parentGroup = parentGroup;
    this.origin = origin.clone();
    this.elapsed = 0;
    this.phase = PHASE_SPIRAL;
    this.explodeIntensity = 1;
    this.merged = false;
    this.shakenSolo = false;

    // Orbit setup — tilted plane based on click position
    const dist = origin.length();
    this.initialRadius = dist || 1;
    this.orbitAngle = Math.atan2(origin.z, origin.x);
    // Fixed angular speed — negative to match sceneGroup Y rotation direction
    this.angularSpeed = -(1.2 + Math.random() * 0.4);

    // Tilt the orbit plane based on the Y position of the click
    // Click near top → tilted orbit, click at center → flat XZ orbit
    const tiltAmount = Math.atan2(origin.y, Math.sqrt(origin.x * origin.x + origin.z * origin.z));
    // Tilt axis is perpendicular to the origin direction in the XZ plane
    this.tiltAxis = new THREE.Vector3(-origin.z, 0, origin.x).normalize();
    if (this.tiltAxis.length() < 0.01) this.tiltAxis.set(1, 0, 0);
    this.tiltAngle = tiltAmount;

    this.count = PARTICLES;
    this.localPositions = new Float32Array(this.count * 3);
    this.spinAxes = new Float32Array(this.count * 3);
    this.spinSpeeds = new Float32Array(this.count);
    this.phases = new Float32Array(this.count);
    this.explodeVels = new Float32Array(this.count * 3);

    this.meshes = [];
    this.group = new THREE.Group();
    this.group.position.copy(origin);

    this.neutralMat = new THREE.MeshBasicMaterial({
      color: 0xaaaaaa,
      wireframe: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.accentMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(getAccentHex()),
      wireframe: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    this._createParticles();
    this.parentGroup.add(this.group);
  }

  _createParticles() {
    for (let i = 0; i < this.count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const rFrac = Math.pow(Math.random(), 0.6) * CLUSTER_RADIUS;
      const lx = rFrac * Math.sin(phi) * Math.cos(theta);
      const ly = rFrac * Math.sin(phi) * Math.sin(theta);
      const lz = rFrac * Math.cos(phi);

      const li = i * 3;
      this.localPositions[li] = lx;
      this.localPositions[li + 1] = ly;
      this.localPositions[li + 2] = lz;

      this.phases[i] = Math.random() * Math.PI * 2;
      this.spinSpeeds[i] = 1 + Math.random() * 3;

      _v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      this.spinAxes[li] = _v.x;
      this.spinAxes[li + 1] = _v.y;
      this.spinAxes[li + 2] = _v.z;

      const geo = pickGeo();
      const mat = Math.random() < 0.3 ? this.accentMat : this.neutralMat;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(lx, ly, lz);
      this.group.add(mesh);
      this.meshes.push(mesh);
    }
  }

  getPhase() { return this.phase; }

  getCollapseProgress() {
    if (this.phase !== PHASE_COLLAPSE) return -1;
    return (this.elapsed - TIMING_SPIRAL) / TIMING_COLLAPSE;
  }

  triggerMergedExplosion(intensity) {
    this.explodeIntensity = intensity;
    this.merged = true;
  }

  update(t, dt) {
    if (this.phase === PHASE_DONE) return;
    this.elapsed += dt;
    const n = this.count;

    if (this.phase === PHASE_SPIRAL) {
      const progress = Math.min(this.elapsed / TIMING_SPIRAL, 1);
      const easeIn = progress * progress;

      // Linear radius decay: constant inward drift
      const radiusFrac = 1 - easeIn * 0.85; // goes from 1.0 to 0.15 over spiral phase
      const r = this.initialRadius * radiusFrac;
      this.orbitAngle += this.angularSpeed * dt;

      // Fade in over first 0.8s
      const fadeIn = Math.min(this.elapsed / 0.8, 1);
      this.neutralMat.opacity = fadeIn * 0.6;
      this.accentMat.opacity = fadeIn * 0.6;

      // Compute flat circle point, then tilt it
      _v.set(Math.cos(this.orbitAngle) * r, 0, Math.sin(this.orbitAngle) * r);
      _v.applyAxisAngle(this.tiltAxis, this.tiltAngle);
      this.group.position.copy(_v);

      // Shrink cluster proportionally to orbit radius
      const shrink = 0.3 + radiusFrac * 0.7; // 1.0 → ~0.3 as it approaches center

      for (let i = 0; i < n; i++) {
        const li = i * 3;
        const m = this.meshes[i];
        const wobble = Math.sin(t * 1.5 + this.phases[i]) * 0.04 * (1 - progress);
        m.position.x = this.localPositions[li] * shrink + wobble;
        m.position.y = this.localPositions[li + 1] * shrink + wobble * 0.5;
        m.position.z = this.localPositions[li + 2] * shrink;
        m.scale.setScalar(shrink);

        _v.set(this.spinAxes[li], this.spinAxes[li + 1], this.spinAxes[li + 2]);
        _q.setFromAxisAngle(_v, this.spinSpeeds[i] * dt);
        m.quaternion.multiply(_q);
      }

      // Gentle self-tumble
      this.group.rotation.y += dt * 0.5;
      this.group.rotation.x += dt * 0.2;

      if (this.elapsed >= TIMING_SPIRAL) this.phase = PHASE_COLLAPSE;

    } else if (this.phase === PHASE_COLLAPSE) {
      const collapseElapsed = this.elapsed - TIMING_SPIRAL;
      const progress = Math.min(collapseElapsed / TIMING_COLLAPSE, 1);
      const eased = progress * progress * progress;

      // Tighten orbit: continue linear collapse
      const collapseFrac = (1 - progress) * 0.15; // 0.15 → 0
      const r = this.initialRadius * collapseFrac;
      this.orbitAngle += this.angularSpeed * dt;

      _v.set(Math.cos(this.orbitAngle) * r, 0, Math.sin(this.orbitAngle) * r);
      _v.applyAxisAngle(this.tiltAxis, this.tiltAngle);
      this.group.position.copy(_v);

      // Compress particles toward group center
      const shrink = 0.3 * (1 - eased * 0.9); // continues shrinking from spiral end
      for (let i = 0; i < n; i++) {
        const m = this.meshes[i];
        m.position.multiplyScalar(1 - eased * 0.2);
        m.scale.setScalar(shrink);
      }

      this.group.rotation.y += dt * 2;
      this.group.rotation.x += dt * 0.6;

      if (collapseElapsed >= TIMING_COLLAPSE) {
        this._initExplosion();
        this.phase = PHASE_EXPLODE;
      }

    } else if (this.phase === PHASE_EXPLODE) {
      const progress = Math.min((this.elapsed - TIMING_SC) / TIMING_EXPLODE, 1);

      for (let i = 0; i < n; i++) {
        const vi = i * 3;
        const m = this.meshes[i];
        m.position.x += this.explodeVels[vi] * dt;
        m.position.y += this.explodeVels[vi + 1] * dt;
        m.position.z += this.explodeVels[vi + 2] * dt;
        this.explodeVels[vi] *= 0.97;
        this.explodeVels[vi + 1] *= 0.97;
        this.explodeVels[vi + 2] *= 0.97;

        _v.set(this.spinAxes[vi], this.spinAxes[vi + 1], this.spinAxes[vi + 2]);
        _q.setFromAxisAngle(_v, this.spinSpeeds[i] * 2 * dt);
        m.quaternion.multiply(_q);
      }

      this.neutralMat.opacity = 0.6 * (1 - progress * 0.5);
      this.accentMat.opacity = 0.6 * (1 - progress * 0.5);
      if (this.elapsed - TIMING_SC >= TIMING_EXPLODE) this.phase = PHASE_FADE;

    } else if (this.phase === PHASE_FADE) {
      const progress = Math.min((this.elapsed - TIMING_SCE) / TIMING_FADE, 1);
      const dtSlow = dt * 0.3;

      for (let i = 0; i < n; i++) {
        const vi = i * 3;
        const m = this.meshes[i];
        m.position.x += this.explodeVels[vi] * dtSlow;
        m.position.y += this.explodeVels[vi + 1] * dtSlow;
        m.position.z += this.explodeVels[vi + 2] * dtSlow;
      }

      this.neutralMat.opacity = 0.3 * (1 - progress);
      this.accentMat.opacity = 0.3 * (1 - progress);
      if (this.elapsed - TIMING_SCE >= TIMING_FADE) this.phase = PHASE_DONE;
    }
  }

  _initExplosion() {
    // Reset scale for explosion
    for (let i = 0; i < this.count; i++) {
      this.meshes[i].scale.setScalar(1);
    }
    const intensity = this.explodeIntensity;
    for (let i = 0; i < this.count; i++) {
      _v.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      const speed = (2 + Math.random() * 4) * intensity;
      const vi = i * 3;
      this.explodeVels[vi] = _v.x * speed;
      this.explodeVels[vi + 1] = _v.y * speed;
      this.explodeVels[vi + 2] = _v.z * speed;
    }
  }

  dispose() {
    for (let i = this.meshes.length - 1; i >= 0; i--) {
      this.group.remove(this.meshes[i]);
    }
    this.meshes.length = 0;
    this.neutralMat.dispose();
    this.accentMat.dispose();
    this.parentGroup.remove(this.group);
  }
}

export default class GalaxyManager {
  constructor(sceneGroup) {
    this.sceneGroup = sceneGroup;
    this.galaxies = [];
    this.shakeIntensity = 0;
  }

  spawn(pointer, camera) {
    // Unproject click position onto z=0 plane in world space
    _raycaster.setFromCamera(pointer, camera);
    const hit = _raycaster.ray.intersectPlane(_plane, _intersect);
    let origin;
    if (hit) {
      // Convert world position to sceneGroup local space
      origin = this.sceneGroup.worldToLocal(_intersect.clone());
    } else {
      origin = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        0
      );
    }
    this.galaxies.push(new Galaxy(this.sceneGroup, origin));
  }

  getShake() {
    const s = this.shakeIntensity;
    this.shakeIntensity *= 0.9;
    if (this.shakeIntensity < 0.001) this.shakeIntensity = 0;
    return s;
  }

  update(t, dt) {
    for (let i = 0; i < this.galaxies.length; i++) {
      this.galaxies[i].update(t, dt);
    }

    // Detect collapsing galaxies for merge
    let collapsingCount = 0;
    let firstIdx = -1;
    for (let i = 0; i < this.galaxies.length; i++) {
      const g = this.galaxies[i];
      if (g.getPhase() === PHASE_COLLAPSE && g.getCollapseProgress() > 0.7 && !g.merged) {
        if (firstIdx === -1) firstIdx = i;
        collapsingCount++;
      }
    }

    if (collapsingCount >= 2) {
      const primary = this.galaxies[firstIdx];
      for (let i = 0; i < this.galaxies.length; i++) {
        if (i === firstIdx) continue;
        const g = this.galaxies[i];
        if (g.getPhase() === PHASE_COLLAPSE && g.getCollapseProgress() > 0.7 && !g.merged) {
          g.phase = PHASE_DONE;
          g.merged = true;
        }
      }
      primary.triggerMergedExplosion(collapsingCount);
      this.shakeIntensity = Math.min(Math.max(this.shakeIntensity, 0.04 * collapsingCount), 0.08);
    } else if (collapsingCount === 1) {
      const g = this.galaxies[firstIdx];
      if (g.getCollapseProgress() > 0.95 && !g.shakenSolo) {
        g.shakenSolo = true;
        this.shakeIntensity = Math.max(this.shakeIntensity, 0.03);
      }
    }

    // Cleanup done galaxies
    let w = 0;
    for (let i = 0; i < this.galaxies.length; i++) {
      if (this.galaxies[i].getPhase() === PHASE_DONE) {
        this.galaxies[i].dispose();
      } else {
        this.galaxies[w++] = this.galaxies[i];
      }
    }
    this.galaxies.length = w;
  }

  dispose() {
    for (let i = 0; i < this.galaxies.length; i++) {
      this.galaxies[i].dispose();
    }
    this.galaxies.length = 0;
  }
}
