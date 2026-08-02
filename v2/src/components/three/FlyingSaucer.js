import * as THREE from 'three';
import { getAccentColor } from './shared';

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

// ── Active laser beam (dramatic, traveling, double-line + glow cylinder) ──
class LaserBeam {
  constructor(parentGroup, from, to, accent) {
    this.parentGroup = parentGroup;
    this.from = from.clone();
    this.to = to.clone();
    this.elapsed = 0;
    this.done = false;
    this.duration = 1.0;        // total beam lifetime
    this.travelTime = 0.25;     // time for beam to extend from saucer to target

    // Main beam line
    const points = [from.clone(), to.clone()];
    this.geo = new THREE.BufferGeometry().setFromPoints(points);
    this.mat = new THREE.LineBasicMaterial({
      color: accent.clone(),
      transparent: true,
      opacity: 0,
      linewidth: 2,
    });
    this.line = new THREE.Line(this.geo, this.mat);
    parentGroup.add(this.line);

    // Offset parallel line for visual thickness
    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    if (perp.length() < 0.01) perp.set(1, 0, 0);
    const offset = perp.multiplyScalar(0.015);
    const offsetPoints = [
      from.clone().add(offset),
      to.clone().add(offset),
    ];
    this.geo2 = new THREE.BufferGeometry().setFromPoints(offsetPoints);
    this.mat2 = new THREE.LineBasicMaterial({
      color: accent.clone().multiplyScalar(1.4),
      transparent: true,
      opacity: 0,
      linewidth: 2,
    });
    this.line2 = new THREE.Line(this.geo2, this.mat2);
    parentGroup.add(this.line2);

    // Glow cylinder around the beam
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    const length = from.distanceTo(to);
    this.glowGeo = new THREE.CylinderGeometry(0.02, 0.02, length, 6, 1, true);
    this.glowMat = new THREE.MeshBasicMaterial({
      color: accent.clone(),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.glowCyl = new THREE.Mesh(this.glowGeo, this.glowMat);
    this.glowCyl.position.copy(mid);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir
    );
    this.glowCyl.setRotationFromQuaternion(quat);
    parentGroup.add(this.glowCyl);

    this._dir = dir;
    this._length = length;
  }

  update(dt) {
    if (this.done) return;
    this.elapsed += dt;
    const progress = Math.min(this.elapsed / this.duration, 1);

    // Travel phase: beam extends from saucer to target
    const travelProgress = Math.min(this.elapsed / this.travelTime, 1);
    const easedTravel = 1 - Math.pow(1 - travelProgress, 3);
    const currentEnd = this.from.clone().add(
      this._dir.clone().multiplyScalar(this._length * easedTravel)
    );
    const travelPoints = [this.from.clone(), currentEnd];
    this.geo.setFromPoints(travelPoints);

    // Update offset line
    const perp = new THREE.Vector3(-this._dir.z, 0, this._dir.x).normalize();
    if (perp.length() < 0.01) perp.set(1, 0, 0);
    const offset = perp.multiplyScalar(0.015);
    this.geo2.setFromPoints([
      this.from.clone().add(offset),
      currentEnd.clone().add(offset),
    ]);

    // Update glow cylinder during travel
    const mid = new THREE.Vector3().addVectors(this.from, currentEnd).multiplyScalar(0.5);
    this.glowCyl.position.copy(mid);
    const curLen = this.from.distanceTo(currentEnd);
    this.glowCyl.scale.y = Math.max(curLen / this._length, 0.01);

    // Opacity: ramp during travel, flash at impact, then fade
    let opacity;
    if (travelProgress < 1) {
      opacity = easedTravel * 0.9;
    } else if (progress < 0.55) {
      const flashProgress = (progress - (this.travelTime / this.duration)) / 0.15;
      opacity = 0.9 + Math.max(0, 1 - flashProgress) * 0.1;
    } else {
      opacity = 1.0 - ((progress - 0.55) / 0.45);
    }

    this.mat.opacity = opacity;
    this.mat2.opacity = opacity * 0.6;
    this.glowMat.opacity = opacity * 0.25;

    if (progress >= 1) this.done = true;
  }

  dispose() {
    this.parentGroup.remove(this.line);
    this.parentGroup.remove(this.line2);
    this.parentGroup.remove(this.glowCyl);
    this.geo.dispose();
    this.mat.dispose();
    this.geo2.dispose();
    this.mat2.dispose();
    this.glowGeo.dispose();
    this.glowMat.dispose();
  }
}

const RESPAWN_DELAY = 2.5; // seconds before a destroyed cube respawns

// ── Impact flash (expanding rings + central burst at hit point) ──
class ImpactFlash {
  constructor(parentGroup, position, accent) {
    this.parentGroup = parentGroup;
    this.elapsed = 0;
    this.done = false;
    this.duration = 0.5;

    // Expanding ring
    this.ringGeo = new THREE.TorusGeometry(0.06, 0.018, 8, 16);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: accent.clone().multiplyScalar(1.5),
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });
    this.ring = new THREE.Mesh(this.ringGeo, this.ringMat);
    this.ring.position.copy(position);
    parentGroup.add(this.ring);

    // Second ring (counter-rotating, whiter)
    this.ring2Geo = new THREE.TorusGeometry(0.04, 0.012, 8, 16);
    this.ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    this.ring2 = new THREE.Mesh(this.ring2Geo, this.ring2Mat);
    this.ring2.position.copy(position);
    parentGroup.add(this.ring2);

    // Central flash sphere
    this.sphereGeo = new THREE.SphereGeometry(0.05, 8, 8);
    this.sphereMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });
    this.sphere = new THREE.Mesh(this.sphereGeo, this.sphereMat);
    this.sphere.position.copy(position);
    parentGroup.add(this.sphere);
  }

  update(dt) {
    if (this.done) return;
    this.elapsed += dt;
    const progress = Math.min(this.elapsed / this.duration, 1);

    // Expand rings outward
    const scale = 1 + progress * 5;
    this.ring.scale.setScalar(scale);
    this.ring2.scale.setScalar(scale * 0.7);
    this.ring.rotation.x += dt * 4;
    this.ring2.rotation.x += dt * 8;
    this.ring2.rotation.y += dt * 6;

    // Quick flash then decay
    const fade = progress < 0.12
      ? progress / 0.12
      : 1 - ((progress - 0.12) / 0.88);
    this.ringMat.opacity = fade * 0.8;
    this.ring2Mat.opacity = fade * 0.6;
    this.sphereMat.opacity = fade;
    this.sphere.scale.setScalar(1 + progress * 4);

    if (progress >= 1) this.done = true;
  }

  dispose() {
    this.parentGroup.remove(this.ring);
    this.parentGroup.remove(this.ring2);
    this.parentGroup.remove(this.sphere);
    this.ringGeo.dispose();
    this.ringMat.dispose();
    this.ring2Geo.dispose();
    this.ring2Mat.dispose();
    this.sphereGeo.dispose();
    this.sphereMat.dispose();
  }
}

export default class FlyingSaucer {
  constructor(parentGroup, cubes, galaxyManager) {
    this.parentGroup = parentGroup;
    this.cubes = cubes || [];
    this._galaxyManager = galaxyManager || null;
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
    this._shootCooldown = 6.0 + Math.random() * 4; // seconds until first shot
    this._shootTimer = 0;
    this._laserRange = 4.5; // max distance to target a cube
    this._lasers = [];
    this._explosions = [];
    this._flashEffects = [];  // impact flash effects
    this._saucerWorldPos = new THREE.Vector3();
    this._cubeWorldPos = new THREE.Vector3();
    this._fireGlow = 0; // 0 = normal, 1 = full glow
    this._chargeGlowTarget = 0; // target glow during charge-up
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
          // Fire the laser now (after charge-up)
          this._tryShoot();
          // Resume previous movement
          this._targetSpeed = this.orbitBaseSpeed * this.orbitDirection;
          this._moveState = 'resuming';
          this._moveTimer = 0.6 + Math.random() * 0.3;
          // Drop glow after firing
          this._fireGlow = 0.3;
          this._chargeGlowTarget = 0;
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
        this._shootCooldown = 7.0 + Math.random() * 8.0; // 7-15s between shots
        // Interrupt movement: stop, charge, fire
        this._savedMoveState = this._moveState;
        this._savedMoveTimer = this._moveTimer;
        this._moveState = 'shooting';
        this._moveTimer = 1.2; // charge-up time before firing
        this._targetSpeed = 0;
        this._chargeGlowTarget = 1.0; // ramp up glow during charge
      }
    }

    // Gradual charge-up glow during shooting state
    if (this._moveState === 'shooting') {
      this._fireGlow += (this._chargeGlowTarget - this._fireGlow) * 0.04;
    } else {
      // Decay fire glow after firing
      if (this._fireGlow > 0.001) {
        this._fireGlow *= 0.92;
      } else {
        this._fireGlow = 0;
      }
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

    // Update impact flash effects
    for (let i = this._flashEffects.length - 1; i >= 0; i--) {
      this._flashEffects[i].update(dt);
      if (this._flashEffects[i].done) {
        this._flashEffects[i].dispose();
        this._flashEffects.splice(i, 1);
      }
    }

    // ── Cube respawn logic ──
    const now = performance.now() / 1000;
    for (const cube of this.cubes) {
      const d = cube.userData;
      if (!cube.visible && d.respawnAt && now >= d.respawnAt) {
        cube.visible = true;
        d.respawnAt = 0;
        d.hitLerp = 0;
        d.hoverLerp = 0;
        d.spawnLerp = 0; // start spawn-in animation
        cube.scale.setScalar(0.001); // start as a point (prevents 1-frame flash at full size)
        cube.material.opacity = d.baseOpacity;
        cube.material.color.copy(d.baseColor);
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

    // Find nearby cubes (skip already destroyed ones)
    let closest = null;
    let closestDist = this._laserRange;
    for (const cube of this.cubes) {
      if (!cube.visible) continue; // skip destroyed cubes
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

    // Spawn laser beam (dramatic traveling beam)
    this._lasers.push(new LaserBeam(this.parentGroup, fromLocal, targetLocal, this._accent));

    // Spawn impact flash at the cube
    this._flashEffects.push(new ImpactFlash(this.parentGroup, targetLocal, this._accent));

    // ── Destroy the cube ──
    const d = closest.userData;
    closest.visible = false;
    d.respawnAt = performance.now() / 1000 + RESPAWN_DELAY;
    d.hitLerp = 0;
    d.hoverLerp = 0;

    // Spawn galaxy destruction effect at cube position (boosted explosion)
    if (this._galaxyManager) {
      this._galaxyManager.spawnAt(targetLocal, 2.0);
    }
  }

  dispose() {
    for (const laser of this._lasers) laser.dispose();
    for (const exp of this._explosions) exp.dispose();
    for (const flash of this._flashEffects) flash.dispose();
    this._lasers.length = 0;
    this._explosions.length = 0;
    this._flashEffects.length = 0;
    for (const mat of this._mats) mat.dispose();
    for (const geo of this._geos) geo.dispose();
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}
