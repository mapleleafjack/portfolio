import * as THREE from 'three';
import { getAccentColor, THEME, onThemeChange } from './shared';

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
const PLAYER_SPEED = 1.5;    // base forward speed (cruising)
const PLAYER_BOOST = 3.0;   // boost speed
const PLAYER_BRAKE = 0.6;   // brake speed
const PLAYER_DODGE_SPEED = 1.2; // strafe/vertical dodge speed
const PLAYER_COOLDOWN = 0.2; // seconds between player shots
const MOUSE_SENSITIVITY = 0.0015; // rad/pixel (smoother game feel)
const PITCH_CLAMP = 1.4;     // ~80° pitch limit

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
      color: THEME.saucerBody.light,
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
      color: THEME.saucerRing.light,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    this.domeMat = domeMat;
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.06;
    this.group.add(dome);

    // ── Theme-aware base colour refs (updated on theme change) ──
    this._bodyBaseHex = THEME.saucerBody.light;
    this._domeBaseHex = THEME.saucerRing.light;
    this._themeCleanup = onThemeChange(() => {
      const dark = document.documentElement.classList.contains('dark');
      this._bodyBaseHex = dark ? THEME.saucerBody.dark : THEME.saucerBody.light;
      this._domeBaseHex = dark ? THEME.saucerRing.dark : THEME.saucerRing.light;
    });

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

    // ── Glow sphere (visible only on hover, accent colour) ──
    const glowGeo = new THREE.SphereGeometry(0.50, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: accent.clone(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this._glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this._glowMat = glowMat;
    this._glowMesh.scale.set(1, 0.45, 1); // match saucer disc proportions
    this.group.add(this._glowMesh);

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
    this._hovered = false;     // hover state for glow effect
    this._savedMoveState = null; // state to restore after shooting
    this._onCubeDestroyed = null; // callback(cube) when any cube is destroyed
    this._onPlayerLaserFired = null; // callback(targetWorldPos, hitCubeOrNull) when player fires

    // ── Player control state ──
    this._playerControlled = false;
    this._playerCooldown = 0;
    this._playerPitch = 0;       // current pitch angle (applied to rotation.x)
    this._playerShootHeld = false;
    this._playerSpeed = PLAYER_SPEED;
    // Crosshair-based targeting
    this._playerCrosshairTarget = new THREE.Vector3(); // world-space target from crosshair raycast
    this._playerCrosshairHasHit = false;               // whether crosshair ray hit a cube
    this._playerCrosshairHitCube = null;               // the hit cube (if any)
    // Turn-rate control (virtual cursor): continuous turn rates in rad/s
    this._targetYawRate = 0;     // desired yaw rate (from cursor position)
    this._targetPitchRate = 0;   // desired pitch rate
    this._yawRate = 0;           // smoothed yaw rate
    this._pitchRate = 0;         // smoothed pitch rate
    this._roll = 0;              // bank angle (visual)
    this._prevYaw = 0;

    // ── Invisible click sphere (raycaster target) ──
    const clickGeo = new THREE.SphereGeometry(0.45, 12, 12);
    const clickMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    });
    this._clickSphere = new THREE.Mesh(clickGeo, clickMat);
    this._clickSphere.userData.isSaucer = true;
    this._clickSphere.renderOrder = 999;
    this.group.add(this._clickSphere);

    // Store materials for disposal
    this._mats = [bodyMat, domeMat, beamMat, glowMat, clickMat, ...this.lights.map(l => l.mat)];
    this._geos = [bodyGeo, domeGeo, lightGeo, beamGeo, glowGeo, clickGeo];
  }

  update(t, dt) {
    if (this._playerControlled) {
      // ── Player-controlled mode ──────────────────
      this._updatePlayerMode(t, dt);
    } else {
      // ── AI orbit mode ───────────────────────────
      this._updateAIMode(t, dt);
    }

    // ── Shared: update active lasers ──────────────────
    for (let i = this._lasers.length - 1; i >= 0; i--) {
      this._lasers[i].update(dt);
      if (this._lasers[i].done) {
        this._lasers[i].dispose();
        this._lasers.splice(i, 1);
      }
    }

    // ── Shared: update active explosions ──────────────
    for (let i = this._explosions.length - 1; i >= 0; i--) {
      this._explosions[i].update(dt);
      if (this._explosions[i].done) {
        this._explosions[i].dispose();
        this._explosions.splice(i, 1);
      }
    }

    // ── Shared: update impact flash effects ───────────
    for (let i = this._flashEffects.length - 1; i >= 0; i--) {
      this._flashEffects[i].update(dt);
      if (this._flashEffects[i].done) {
        this._flashEffects[i].dispose();
        this._flashEffects.splice(i, 1);
      }
    }

    // ── Shared: cube respawn logic ────────────────────
    const now = performance.now() / 1000;
    for (const cube of this.cubes) {
      const d = cube.userData;
      if (!cube.visible && d.respawnAt && now >= d.respawnAt) {
        cube.visible = true;
        d.respawnAt = 0;
        d.hitLerp = 0;
        d.hoverLerp = 0;
        d.spawnLerp = 0;
        cube.scale.setScalar(0.001);
        cube.material.opacity = d.baseOpacity;
        cube.material.color.copy(d.baseColor);
      }
    }

    // ── Apply hover glow (overrides per-frame AI/player rendering) ──
    if (this._hovered) {
      this._applyHoverVisuals();
    } else {
      this._glowMat.opacity = 0;
    }
  }

  /** AI orbit movement: state machine, elliptical orbit, auto-shooting. */
  _updateAIMode(t, dt) {
    // ── Movement state machine ──
    this._moveTimer -= dt;
    if (this._moveTimer <= 0) {
      switch (this._moveState) {
        case 'cruising':
          this._moveState = 'stopping';
          this._targetSpeed = 0;
          this._moveTimer = 0.8 + Math.random() * 0.4;
          break;
        case 'stopping':
          this._moveState = 'hovering';
          this._currentSpeed = 0;
          this._moveTimer = 0.8 + Math.random() * 1.2;
          break;
        case 'hovering':
          if (Math.random() < 0.4) this.orbitDirection *= -1;
          this._targetSpeed = this.orbitBaseSpeed * this.orbitDirection;
          this._moveState = 'resuming';
          this._moveTimer = 0.6 + Math.random() * 0.4;
          break;
        case 'shooting':
          this._tryShoot();
          this._targetSpeed = this.orbitBaseSpeed * this.orbitDirection;
          this._moveState = 'resuming';
          this._moveTimer = 0.6 + Math.random() * 0.3;
          this._fireGlow = 0.3;
          this._chargeGlowTarget = 0;
          break;
        case 'resuming':
          this._moveState = 'cruising';
          this._moveTimer = 4 + Math.random() * 6;
          break;
      }
    }

    const speedLerp = this._moveState === 'stopping' ? 0.04 : 0.06;
    this._currentSpeed += (this._targetSpeed - this._currentSpeed) * speedLerp;
    this.orbitAngle += this._currentSpeed * dt;

    const angle = this.orbitAngle;
    const x = Math.cos(angle) * this.orbitRadiusX;
    const z = Math.sin(angle) * this.orbitRadiusZ;
    const y = Math.sin(angle) * this.orbitRadiusZ * Math.sin(this.orbitTilt)
            + Math.sin(t * this.bobSpeed) * this.bobAmount;
    this.group.position.set(x, y, z);

    const step = 0.01 * Math.sign(this._currentSpeed || this.orbitDirection);
    const nextAngle = angle + step;
    const nx = Math.cos(nextAngle) * this.orbitRadiusX;
    const nz = Math.sin(nextAngle) * this.orbitRadiusZ;
    const dx = nx - x;
    const dz = nz - z;
    const targetYaw = Math.atan2(dx, dz);
    this._smoothYaw = this._lerpAngle(this._smoothYaw, targetYaw, 0.06);
    this.group.rotation.y = this._smoothYaw;
    this.group.rotation.z = Math.sin(angle) * 0.15 * (this._currentSpeed / (this.orbitBaseSpeed || 0.15));
    this.group.rotation.x = Math.sin(t * 1.2) * 0.05;

    for (const l of this.lights) {
      const pulse = Math.sin(t * 4 + l.phase * Math.PI * 2) * 0.5 + 0.5;
      l.mat.opacity = Math.min(0.3 + pulse * 0.7 + this._fireGlow * 0.3, 1.0);
    }
    this.beamMat.opacity = 0.06 + Math.sin(t * 2) * 0.06 + this._fireGlow * 0.25;

    // ── AI laser shooting logic ──
    if (this._moveState !== 'shooting') {
      this._shootTimer += dt;
      if (this._shootTimer >= this._shootCooldown && this.cubes.length > 0) {
        this._shootTimer = 0;
        this._shootCooldown = 7.0 + Math.random() * 8.0;
        this._savedMoveState = this._moveState;
        this._savedMoveTimer = this._moveTimer;
        this._moveState = 'shooting';
        this._moveTimer = 1.2;
        this._targetSpeed = 0;
        this._chargeGlowTarget = 1.0;
      }
    }

    if (this._moveState === 'shooting') {
      this._fireGlow += (this._chargeGlowTarget - this._fireGlow) * 0.04;
    } else {
      if (this._fireGlow > 0.001) { this._fireGlow *= 0.92; } else { this._fireGlow = 0; }
    }

    const baseBodyOpacity = 0.5;
    const baseDomeOpacity = 0.45;
    this.bodyMat.opacity = baseBodyOpacity + this._fireGlow * 0.5;
    this.domeMat.opacity = baseDomeOpacity + this._fireGlow * 0.55;
    this.bodyMat.color.set(this._bodyBaseHex).lerp(this._accent, this._fireGlow * 0.6);
    this.domeMat.color.set(this._domeBaseHex).lerp(this._accent, this._fireGlow * 0.5);
  }

  /** Player-controlled mode: chase cam with turn-rate control from virtual cursor. */
  _updatePlayerMode(t, dt) {
    if (this._playerCooldown > 0) {
      this._playerCooldown -= dt;
    }

    if (this._playerShootHeld && this._playerCooldown <= 0) {
      this._playerShoot();
    }

    // ── Smooth turn rates toward target (gives weight to controls) ──
    const rateLerp = Math.min(12 * dt, 1);
    this._yawRate += (this._targetYawRate - this._yawRate) * rateLerp;
    this._pitchRate += (this._targetPitchRate - this._pitchRate) * rateLerp;

    // Apply rotation
    this.group.rotation.y += this._yawRate * dt;
    this._playerPitch += this._pitchRate * dt;
    this._playerPitch = Math.max(-PITCH_CLAMP, Math.min(PITCH_CLAMP, this._playerPitch));

    // Banking: roll proportional to yaw rate
    const targetRoll = -this._yawRate * 0.45;
    this._roll += (targetRoll - this._roll) * Math.min(8 * dt, 1);
    this._roll = Math.max(-1.0, Math.min(1.0, this._roll));

    // ── Auto-forward flight ──
    const worldFwd = new THREE.Vector3(0, 0, 1);
    worldFwd.applyQuaternion(this.group.quaternion).normalize();
    const speed = this._playerSpeed * dt;
    this.group.position.x += worldFwd.x * speed;
    this.group.position.y += worldFwd.y * speed;
    this.group.position.z += worldFwd.z * speed;

    // ── Glow ──
    const boostRatio = Math.max(0, Math.min(1, (this._playerSpeed - PLAYER_BRAKE) / (PLAYER_BOOST - PLAYER_BRAKE)));
    const idlePulse = Math.sin(t * 3) * 0.08 + 0.08;
    this.bodyMat.opacity = 0.65 + idlePulse + boostRatio * 0.15;
    this.domeMat.opacity = 0.6 + idlePulse + boostRatio * 0.12;
    this.bodyMat.color.set(this._bodyBaseHex).lerp(this._accent, 0.15 + boostRatio * 0.35);
    this.domeMat.color.set(this._domeBaseHex).lerp(this._accent, 0.12 + boostRatio * 0.3);

    for (const l of this.lights) {
      const pulse = Math.sin(t * 6 + l.phase * Math.PI * 2) * 0.5 + 0.5;
      l.mat.opacity = 0.5 + pulse * 0.5 + boostRatio * 0.2;
    }
    this.beamMat.opacity = 0.12 + Math.sin(t * 3) * 0.04 + boostRatio * 0.15;

    // ── Final orientation ──
    this.group.rotation.x = Math.sin(t * 1.8) * 0.02 + this._playerPitch;
    this.group.rotation.z = this._roll;
  }

  // ═══════════════════════════════════════════════════════
  //  PLAYER CONTROL API
  // ═══════════════════════════════════════════════════════

  /** Returns the raycaster targets for click detection. */
  getRayTargets() {
    return [this._clickSphere];
  }

  /**
   * Apply hover visual feedback — glow ring and accent colour shift.
   * Mirrors the torus glow-on-hover behaviour.
   * Only sets/clears the state flag; actual rendering is applied at end of update().
   * @param {boolean} hovered
   */
  applyHover(hovered) {
    this._hovered = hovered;
  }

  /**
   * Internal: apply hover visuals if the saucer is currently hovered.
   * Called at the end of update() so it overrides per-frame AI/player rendering.
   */
  _applyHoverVisuals() {
    if (!this._hovered) return;
    const accent = getAccentColor();
    this.bodyMat.color.set(this._bodyBaseHex).lerp(accent, 0.45);
    this.bodyMat.opacity = 0.75;
    this.domeMat.color.set(this._domeBaseHex).lerp(accent, 0.4);
    this.domeMat.opacity = 0.65;
    this._glowMat.color.copy(accent);
    this._glowMat.opacity = 0.12;
  }

  /** Whether the saucer is currently player-controlled. */
  isPlayerControlled() {
    return this._playerControlled;
  }

  /** Maximum distance for laser targeting. */
  getLaserRange() {
    return this._laserRange;
  }

  /**
   * Set a callback invoked whenever a cube is destroyed by any laser.
   * @param {(cube: THREE.Mesh) => void} fn
   */
  setOnCubeDestroyed(fn) {
    this._onCubeDestroyed = fn;
  }

  /**
   * Set a callback invoked every time the player fires a laser.
   * Receives the world-space target point and the hit cube (if any).
   * @param {(targetWorldPos: THREE.Vector3, hitCube: THREE.Mesh|null) => void} fn
   */
  setOnPlayerLaserFired(fn) {
    this._onPlayerLaserFired = fn;
  }

  /**
   * Compute the cockpit world position (inside the dome).
   * @param {THREE.Vector3} target — output vector
   */
  getCockpitWorldPosition(target) {
    const localCockpit = new THREE.Vector3(0, 0.10, 0.08);
    this.group.localToWorld(localCockpit);
    target.copy(localCockpit);
    return target;
  }

  /**
   * Compute the saucer's forward direction in world space.
   * Forward is local +Z (the direction the saucer faces).
   * @param {THREE.Vector3} target — output vector
   */
  getForwardDirection(target) {
    const localForward = new THREE.Vector3(0, 0, 1);
    this.group.localToWorld(localForward);
    target.copy(localForward).sub(this.group.getWorldPosition(new THREE.Vector3())).normalize();
    return target;
  }

  /**
   * Game-style third-person camera: locked behind the saucer.
   * The ship stays centered on screen; the world rotates around it.
   * @param {THREE.PerspectiveCamera} camera — the scene camera to position
   */
  applyGameCamera(camera) {
    const saucerPos = this.group.getWorldPosition(new THREE.Vector3());
    const fwd = this.getForwardDirection(new THREE.Vector3());

    // Saucer's local up vector (for banking — camera rolls with the ship)
    const saucerUp = new THREE.Vector3(0, 1, 0);
    saucerUp.applyQuaternion(this.group.quaternion);

    // Camera position: behind and above the saucer
    camera.position.copy(saucerPos)
      .addScaledVector(fwd, -5)
      .addScaledVector(saucerUp, 3);

    // Use saucer's up so the camera banks with the ship
    camera.up.copy(saucerUp);
    camera.lookAt(saucerPos);
  }

  /**
   * Enable or disable player control.
   * When enabling, cancels AI movement and resets state.
   */
  setPlayerControlled(enabled) {
    this._playerControlled = enabled;
    if (enabled) {
      this._currentSpeed = 0;
      this._targetSpeed = 0;
      this._moveState = 'hovering';
      this._playerCooldown = 0;
      this._playerPitch = 0;
      this._playerShootHeld = false;
      this._playerSpeed = PLAYER_SPEED;
      this._targetYawRate = 0;
      this._targetPitchRate = 0;
      this._yawRate = 0;
      this._pitchRate = 0;
      this._roll = 0;
      this._prevYaw = this.group.rotation.y;
      this._fireGlow = 0;
      this._chargeGlowTarget = 0;
      // Clear any lingering hover glow from preview mode
      this._hovered = false;
      this._glowMat.opacity = 0;
    }
  }

  /**
   * Set desired turn rates from virtual cursor position.
   * Positive yawRate = turn right, positive pitchRate = pitch up.
   * @param {number} yawRate   — desired yaw rate in rad/s (-1..1 mapped from cursor)
   * @param {number} pitchRate — desired pitch rate in rad/s (-1..1 mapped from cursor)
   */
  applyPlayerTurn(yawRate, pitchRate) {
    if (!this._playerControlled) return;
    // Negate yaw: cursor right → positive yawRate → turn RIGHT in Three.js (negative rotation.y)
    this._targetYawRate = -yawRate;
    this._targetPitchRate = pitchRate;
  }

  /**
   * Apply dodge (strafe left/right) and vertical movement.
   * Forward flight is automatic (Starfox-style).
   * @param {number} strafe — -1..1 (A/D dodge)
   * @param {number} up     — -1..1 (Space/Ctrl)
   * @param {number} dt     — delta time in seconds
   */
  applyPlayerDodge(strafe, up, dt) {
    if (!this._playerControlled) return;

    const speed = PLAYER_DODGE_SPEED * dt;

    // Right direction (local +X in world space)
    const worldRight = new THREE.Vector3(1, 0, 0);
    worldRight.applyQuaternion(this.group.quaternion).normalize();

    // World up
    const worldUp = new THREE.Vector3(0, 1, 0);

    this.group.position.x += (worldRight.x * strafe + worldUp.x * up) * speed;
    this.group.position.y += (worldRight.y * strafe + worldUp.y * up) * speed;
    this.group.position.z += (worldRight.z * strafe + worldUp.z * up) * speed;
  }

  /**
   * Set boost (W held) or brake (S held).
   * @param {boolean} boosting — W is held
   * @param {boolean} braking  — S is held
   */
  setPlayerThrottle(boosting, braking) {
    if (!this._playerControlled) return;
    if (boosting) {
      this._playerSpeed = PLAYER_BOOST;
    } else if (braking) {
      this._playerSpeed = PLAYER_BRAKE;
    } else {
      this._playerSpeed = PLAYER_SPEED;
    }
  }

  /** Set whether the fire button is held (auto-fire handled in update). */
  setPlayerShootHeld(held) {
    this._playerShootHeld = held;
  }

  /**
   * Set the world-space target point from the crosshair raycast.
   * Called every frame in cockpit mode to update laser aim.
   * @param {THREE.Vector3} worldPos — world-space point under the crosshair
   * @param {boolean} hasHit — whether the crosshair ray hit a cube
   * @param {THREE.Mesh|null} hitCube — the cube that was hit (if any)
   */
  setPlayerCrosshairTarget(worldPos, hasHit, hitCube) {
    this._playerCrosshairTarget.copy(worldPos);
    this._playerCrosshairHasHit = hasHit;
    this._playerCrosshairHitCube = hitCube || null;
  }

  /** Player-initiated shot (respects cooldown, aims at crosshair target). */
  _playerShoot() {
    if (this._playerCooldown > 0) return;

    // Get saucer world position
    this.group.getWorldPosition(this._saucerWorldPos);

    // Determine laser endpoint from crosshair target
    let targetWorld;
    if (this._playerCrosshairHasHit && this._playerCrosshairHitCube) {
      // Crosshair is over a cube — aim at the hit point
      targetWorld = this._playerCrosshairTarget.clone();
    } else {
      // No cube under crosshair — fire forward from saucer in crosshair direction
      const crosshairDir = this._playerCrosshairTarget.clone()
        .sub(this._saucerWorldPos).normalize();
      // If crosshair target is too close or behind, default to saucer forward
      if (crosshairDir.length() < 0.001 ||
          crosshairDir.dot(this.getForwardDirection(new THREE.Vector3())) < -0.3) {
        targetWorld = this._saucerWorldPos.clone()
          .addScaledVector(this.getForwardDirection(new THREE.Vector3()), this._laserRange);
      } else {
        targetWorld = this._saucerWorldPos.clone()
          .addScaledVector(crosshairDir, this._laserRange);
      }
    }

    // Convert to sceneGroup local space
    const targetLocal = this.parentGroup.worldToLocal(targetWorld.clone());
    const fromLocal = this.parentGroup.worldToLocal(this._saucerWorldPos.clone());

    // Spawn laser beam (visual always shows)
    this._lasers.push(new LaserBeam(this.parentGroup, fromLocal, targetLocal, this._accent));

    // Only destroy cube if crosshair actually hit one
    if (this._playerCrosshairHasHit && this._playerCrosshairHitCube) {
      const cube = this._playerCrosshairHitCube;
      const hitLocal = this.parentGroup.worldToLocal(this._playerCrosshairTarget.clone());

      this._flashEffects.push(new ImpactFlash(this.parentGroup, hitLocal, this._accent));

      const d = cube.userData;
      cube.visible = false;
      d.respawnAt = performance.now() / 1000 + RESPAWN_DELAY;
      d.hitLerp = 0;
      d.hoverLerp = 0;

      // Notify score system
      this._onCubeDestroyed?.(cube);

      // Galaxy explosion
      if (this._galaxyManager) {
        this._galaxyManager.spawnAt(hitLocal, 2.0);
      }
    }

    // Reset cooldown
    this._playerCooldown = PLAYER_COOLDOWN;

    // Notify orchestrator (for logo hit detection, etc.)
    this._onPlayerLaserFired?.(targetWorld, this._playerCrosshairHasHit ? this._playerCrosshairHitCube : null);
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

    // Notify score system
    this._onCubeDestroyed?.(closest);

    // Spawn galaxy destruction effect at cube position (boosted explosion)
    if (this._galaxyManager) {
      this._galaxyManager.spawnAt(targetLocal, 2.0);
    }
  }

  dispose() {
    if (this._themeCleanup) {
      this._themeCleanup();
      this._themeCleanup = null;
    }
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
