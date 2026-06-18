import * as THREE from 'three';

function getAccentColor() {
  const style = getComputedStyle(document.documentElement);
  const hex = style.getPropertyValue('--accent').trim() || '#f0c830';
  return new THREE.Color(hex);
}

// ── Shared geometry for explosion debris ──
const DEBRIS_GEO = new THREE.BoxGeometry(0.05, 0.05, 0.05);
const EXPLOSION_PARTICLES = 10;
const EXPLOSION_DURATION = 0.9;

// ── Mini-explosion class (small galaxy-style burst) ──
class MiniExplosion {
  constructor(parentGroup, position, accent) {
    this.parentGroup = parentGroup;
    this.elapsed = 0;
    this.done = false;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    parentGroup.add(this.group);

    this.meshes = [];
    this.vels = [];

    const neutralMat = new THREE.MeshBasicMaterial({
      color: 0xaaaaaa, wireframe: true, transparent: true, opacity: 0.7, depthWrite: false,
    });
    const accentMat = new THREE.MeshBasicMaterial({
      color: accent.clone(), wireframe: true, transparent: true, opacity: 0.7, depthWrite: false,
    });
    this._mats = [neutralMat, accentMat];

    for (let i = 0; i < EXPLOSION_PARTICLES; i++) {
      const mat = Math.random() < 0.4 ? accentMat : neutralMat;
      const mesh = new THREE.Mesh(DEBRIS_GEO, mat);
      this.group.add(mesh);
      this.meshes.push(mesh);

      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ).normalize();
      const speed = 1.5 + Math.random() * 2.5;
      this.vels.push(dir.multiplyScalar(speed));
    }
  }

  update(dt) {
    if (this.done) return;
    this.elapsed += dt;
    const progress = Math.min(this.elapsed / EXPLOSION_DURATION, 1);

    for (let i = 0; i < this.meshes.length; i++) {
      const m = this.meshes[i];
      const v = this.vels[i];
      m.position.x += v.x * dt;
      m.position.y += v.y * dt;
      m.position.z += v.z * dt;
      v.multiplyScalar(0.96); // drag
      m.rotation.x += dt * 3;
      m.rotation.y += dt * 2;
    }

    const opacity = 0.7 * (1 - progress);
    for (const mat of this._mats) mat.opacity = opacity;

    if (progress >= 1) this.done = true;
  }

  dispose() {
    for (const m of this.meshes) this.group.remove(m);
    for (const mat of this._mats) mat.dispose();
    this.parentGroup.remove(this.group);
  }
}

// ── Active laser beam ──
class LaserBeam {
  constructor(parentGroup, from, to, accent) {
    this.parentGroup = parentGroup;
    this.elapsed = 0;
    this.done = false;
    this.duration = 0.6;

    const points = [from.clone(), to.clone()];
    this.geo = new THREE.BufferGeometry().setFromPoints(points);
    this.mat = new THREE.LineBasicMaterial({
      color: accent.clone(),
      transparent: true,
      opacity: 1.0,
      linewidth: 2,
    });
    this.line = new THREE.Line(this.geo, this.mat);
    parentGroup.add(this.line);
  }

  update(dt) {
    if (this.done) return;
    this.elapsed += dt;
    const progress = Math.min(this.elapsed / this.duration, 1);
    // Hold full brightness for first 40%, then fade
    const fade = progress < 0.4 ? 1.0 : 1.0 - ((progress - 0.4) / 0.6);
    this.mat.opacity = fade;
    if (progress >= 1) this.done = true;
  }

  dispose() {
    this.parentGroup.remove(this.line);
    this.geo.dispose();
    this.mat.dispose();
  }
}

export default class FlyingSaucer {
  constructor(parentGroup, cubes) {
    this.parentGroup = parentGroup;
    this.cubes = cubes || [];
    this.group = new THREE.Group();
    parentGroup.add(this.group);

    const accent = getAccentColor();
    this._accent = accent;

    // ── Body: flattened sphere (classic saucer disc) ──
    const bodyGeo = new THREE.SphereGeometry(0.35, 16, 8);
    const bodyMat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    this.bodyMat = bodyMat;
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
    this.domeMat = domeMat;
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
    this.orbitBaseSpeed = 0.15 + Math.random() * 0.1;
    this.orbitTilt = 0.3 + Math.random() * 0.3;     // tilt of the orbit plane
    this.orbitAngle = Math.random() * Math.PI * 2;   // current angle (accumulated)
    this.orbitDirection = Math.random() < 0.5 ? 1 : -1;
    this.bobSpeed = 1.5 + Math.random() * 0.5;
    this.bobAmount = 0.15;

    // ── Movement state machine ──
    // States: 'cruising' | 'stopping' | 'hovering' | 'resuming'
    this._moveState = 'cruising';
    this._moveTimer = 4 + Math.random() * 6;     // time until next state change
    this._currentSpeed = this.orbitBaseSpeed * this.orbitDirection;
    this._targetSpeed = this._currentSpeed;
    this._smoothYaw = 0; // smoothed facing direction

    // Scale the whole saucer
    this.group.scale.setScalar(0.6);

    // ── Laser shooting state ──
    this._shootCooldown = 2.5 + Math.random() * 2; // seconds until next shot
    this._shootTimer = 0;
    this._laserRange = 4.5; // max distance to target a cube
    this._lasers = [];
    this._explosions = [];
    this._saucerWorldPos = new THREE.Vector3();
    this._cubeWorldPos = new THREE.Vector3();
    this._fireGlow = 0; // 0 = normal, 1 = full glow
    this._savedMoveState = null; // state to restore after shooting

    // Store materials for disposal
    this._mats = [bodyMat, domeMat, beamMat, ...this.lights.map(l => l.mat)];
    this._geos = [bodyGeo, domeGeo, lightGeo, beamGeo];
  }

  update(t, dt) {
    // ── Movement state machine ──
    this._moveTimer -= dt;
    if (this._moveTimer <= 0) {
      switch (this._moveState) {
        case 'cruising':
          this._moveState = 'stopping';
          this._targetSpeed = 0;
          this._moveTimer = 0.8 + Math.random() * 0.4; // decel duration
          break;
        case 'stopping':
          this._moveState = 'hovering';
          this._currentSpeed = 0;
          this._moveTimer = 0.8 + Math.random() * 1.2; // hover duration
          break;
        case 'hovering':
          // Possibly reverse direction
          if (Math.random() < 0.4) this.orbitDirection *= -1;
          this._targetSpeed = this.orbitBaseSpeed * this.orbitDirection;
          this._moveState = 'resuming';
          this._moveTimer = 0.6 + Math.random() * 0.4; // accel duration
          break;
        case 'shooting':
          // Fire the laser now
          this._tryShoot();
          // Resume previous movement
          this._targetSpeed = this.orbitBaseSpeed * this.orbitDirection;
          this._moveState = 'resuming';
          this._moveTimer = 0.6 + Math.random() * 0.3;
          break;
        case 'resuming':
          this._moveState = 'cruising';
          this._moveTimer = 4 + Math.random() * 6; // cruise duration
          break;
      }
    }

    // Smoothly lerp current speed toward target
    const speedLerp = this._moveState === 'stopping' ? 0.04 : 0.06;
    this._currentSpeed += (this._targetSpeed - this._currentSpeed) * speedLerp;

    // Advance orbit angle by current speed
    this.orbitAngle += this._currentSpeed * dt;

    // Elliptical orbit
    const angle = this.orbitAngle;
    const x = Math.cos(angle) * this.orbitRadiusX;
    const z = Math.sin(angle) * this.orbitRadiusZ;
    // Tilt the orbit plane
    const y = Math.sin(angle) * this.orbitRadiusZ * Math.sin(this.orbitTilt)
            + Math.sin(t * this.bobSpeed) * this.bobAmount;

    this.group.position.set(x, y, z);

    // Face the direction of travel (tangent to the orbit)
    const step = 0.01 * Math.sign(this._currentSpeed || this.orbitDirection);
    const nextAngle = angle + step;
    const nx = Math.cos(nextAngle) * this.orbitRadiusX;
    const nz = Math.sin(nextAngle) * this.orbitRadiusZ;
    const dx = nx - x;
    const dz = nz - z;
    const targetYaw = Math.atan2(dx, dz);
    // Smooth yaw so direction changes don't snap
    this._smoothYaw = this._lerpAngle(this._smoothYaw, targetYaw, 0.06);
    this.group.rotation.y = this._smoothYaw;

    // Slight banking into the turn (proportional to speed)
    const speedRatio = this._currentSpeed / (this.orbitBaseSpeed || 0.15);
    this.group.rotation.z = Math.sin(angle) * 0.15 * speedRatio;

    // Subtle wobble
    this.group.rotation.x = Math.sin(t * 1.2) * 0.05;

    // Animate rim lights (sequential pulsing + glow boost)
    for (const l of this.lights) {
      const pulse = Math.sin(t * 4 + l.phase * Math.PI * 2) * 0.5 + 0.5;
      l.mat.opacity = Math.min(0.3 + pulse * 0.7 + this._fireGlow * 0.3, 1.0);
    }

    // Beam opacity pulsing (brighter during glow)
    this.beamMat.opacity = 0.06 + Math.sin(t * 2) * 0.06 + this._fireGlow * 0.25;

    // ── Laser shooting logic ──
    if (this._moveState !== 'shooting') {
      this._shootTimer += dt;
      if (this._shootTimer >= this._shootCooldown && this.cubes.length > 0) {
        this._shootTimer = 0;
        this._shootCooldown = 2.0 + Math.random() * 3.0;
        // Interrupt movement: stop, charge, fire
        this._savedMoveState = this._moveState;
        this._savedMoveTimer = this._moveTimer;
        this._moveState = 'shooting';
        this._moveTimer = 0.5; // charge-up time before firing
        this._targetSpeed = 0;
        this._fireGlow = 1.0;
      }
    }

    // Decay fire glow
    if (this._fireGlow > 0.001) {
      this._fireGlow *= 0.95;
    } else {
      this._fireGlow = 0;
    }

    // Apply glow to body and dome
    const baseBodyOpacity = 0.5;
    const baseDomeOpacity = 0.45;
    this.bodyMat.opacity = baseBodyOpacity + this._fireGlow * 0.5;
    this.domeMat.opacity = baseDomeOpacity + this._fireGlow * 0.55;
    // Lerp body/dome color toward accent when glowing
    this.bodyMat.color.set(0x888888).lerp(this._accent, this._fireGlow * 0.6);
    this.domeMat.color.set(0xaaaaaa).lerp(this._accent, this._fireGlow * 0.5);

    // Update active lasers
    for (let i = this._lasers.length - 1; i >= 0; i--) {
      this._lasers[i].update(dt);
      if (this._lasers[i].done) {
        this._lasers[i].dispose();
        this._lasers.splice(i, 1);
      }
    }

    // Update active explosions
    for (let i = this._explosions.length - 1; i >= 0; i--) {
      this._explosions[i].update(dt);
      if (this._explosions[i].done) {
        this._explosions[i].dispose();
        this._explosions.splice(i, 1);
      }
    }
  }

  _lerpAngle(current, target, factor) {
    let diff = target - current;
    // Wrap to -PI..PI
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return current + diff * factor;
  }

  _tryShoot() {
    // Get saucer world position
    this.group.getWorldPosition(this._saucerWorldPos);

    // Find nearby cubes
    let closest = null;
    let closestDist = this._laserRange;
    for (const cube of this.cubes) {
      cube.getWorldPosition(this._cubeWorldPos);
      const dist = this._saucerWorldPos.distanceTo(this._cubeWorldPos);
      if (dist < closestDist) {
        closestDist = dist;
        closest = cube;
      }
    }

    if (!closest) return;

    // Get target position in parent (sceneGroup) local space
    closest.getWorldPosition(this._cubeWorldPos);
    const targetLocal = this.parentGroup.worldToLocal(this._cubeWorldPos.clone());
    const fromLocal = this.parentGroup.worldToLocal(this._saucerWorldPos.clone());

    // Spawn laser beam
    this._lasers.push(new LaserBeam(this.parentGroup, fromLocal, targetLocal, this._accent));

    // Spawn mini-explosion at target
    this._explosions.push(new MiniExplosion(this.parentGroup, targetLocal, this._accent));

    // ── Hit reaction on the cube ──
    const d = closest.userData;
    d.hitLerp = 1.0;
    // Give a random tumble kick
    d.hitSpin = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3,
    );
  }

  dispose() {
    for (const laser of this._lasers) laser.dispose();
    for (const exp of this._explosions) exp.dispose();
    this._lasers.length = 0;
    this._explosions.length = 0;
    for (const mat of this._mats) mat.dispose();
    for (const geo of this._geos) geo.dispose();
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}
