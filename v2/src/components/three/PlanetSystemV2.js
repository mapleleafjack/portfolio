import * as THREE from 'three';
import { getAccentColor } from './shared';
import config from '../../data/planets.json';

// ── Shared geometry for orbiting moons ────────────────
const MOON_GEO = new THREE.SphereGeometry(1, 8, 8);

// ── Easing ────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

const ZOOM_DURATION = 0.85;
const SNAP_DURATION = 0.55;
const MOON_VIS_DURATION = 0.35; // seconds for moon pop-out / pop-in animation
const DEFAULT_POS = new THREE.Vector3(0, 0, 5);
const DEFAULT_LOOK = new THREE.Vector3(0, 0, 0);

// ── Orbit ring radii (multiples of planet size) ───────
const ORBIT_RADII = [2.0, 2.8, 3.6];
const ORBIT_SPEEDS = [1.2, 0.8, 0.5]; // rad/s per ring

export default class PlanetSystem {
  constructor(sceneGroup, camera, onItemClick, onItemHover, onZoomChange) {
    this._sceneGroup = sceneGroup;
    this._camera = camera;
    this._onItemClick = onItemClick || (() => {});
    this._onItemHover = onItemHover || (() => {});
    this._onZoomChange = onZoomChange || (() => {});

    this._planets = new Map();
    this._planetTargets = [];
    this._hoveredPlanetId = null;     // planet hovered in preview (galaxy) view
    this._prevHoveredPlanetId = null; // for detecting hover entry/exit
    this._zoomPlanetId = null;
    this._zoomPhase = 'none';
    this._zoomProgress = 0;
    this._zoomStartCam = new THREE.Vector3();
    this._zoomStartLook = new THREE.Vector3();
    this._zoomTargetLook = new THREE.Vector3();

    this._tooltip = document.createElement('div');
    this._tooltip.className = 'planet-tooltip';
    Object.assign(this._tooltip.style, {
      position: 'fixed', zIndex: '90', pointerEvents: 'none',
      fontFamily: "'Oxanium', sans-serif", fontSize: '11px',
      color: 'var(--text, #fff)', padding: '4px 10px',
      background: 'var(--glass-bg, rgba(0,0,0,0.75))',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid var(--border, rgba(255,255,255,0.12))',
      borderRadius: '6px', whiteSpace: 'nowrap',
      opacity: '0', transition: 'opacity 0.12s',
      transform: 'translate(-50%, -130%)',
    });
    document.body.appendChild(this._tooltip);
    this._buildFromConfig();
  }

  _buildFromConfig() {
    for (const def of config.planets) this._buildPlanet(def);
  }

  /**
   * Return planet data needed by the LabelManager to build on-hover labels.
   * @returns {Array<{ id: string, name: string, color: number, group: THREE.Group }>}
   */
  getPlanetLabelData() {
    const result = [];
    for (const [id, p] of this._planets) {
      const colorHex = '#' + p.body.material.color.getHexString();
      result.push({ id, name: p.body.userData.planetName, colorHex, group: p.group });
    }
    return result;
  }

  _buildPlanet(def) {
    const group = new THREE.Group();

    // Use orbital parameters for initial position if available, otherwise fall back to position
    const hasOrbit = typeof def.orbitRadius === 'number' && typeof def.orbitPhase === 'number';
    if (hasOrbit) {
      const orbitAngle = def.orbitPhase;
      const cx = Math.cos(orbitAngle) * def.orbitRadius;
      const cz = Math.sin(orbitAngle) * def.orbitRadius;
      const tilt = def.orbitTilt || 0.25;
      const cy = cz * Math.sin(tilt);
      const czTilted = cz * Math.cos(tilt);
      group.position.set(cx, cy, czTilted);
    } else {
      const pos = new THREE.Vector3(def.position[0], def.position[1], def.position[2]);
      group.position.copy(pos);
    }
    const pos = hasOrbit
      ? group.position.clone()
      : new THREE.Vector3(def.position[0], def.position[1], def.position[2]);
    this._sceneGroup.add(group);

    const color = new THREE.Color(def.color);
    const size = def.size || 0.25;
    const accent = getAccentColor();

    // Wireframe planet body
    const bodyGeo = new THREE.IcosahedronGeometry(size, 2);
    const bodyMat = new THREE.MeshBasicMaterial({
      color: color.clone().lerp(accent, 0.3),
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.userData = { isPlanet: true, planetId: def.id, planetName: def.name };
    group.add(body);
    this._planetTargets.push(body);

    // ── Planet core glow (solid sphere inside wireframe) ──
    const coreGeo = new THREE.SphereGeometry(size * 0.55, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // ── Planet glow halo (large soft sprite behind planet) ──
    const haloSize = size * 4.5;
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const hctx = haloCanvas.getContext('2d');
    const haloGrad = hctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    const hexStr = '#' + color.getHexString();
    haloGrad.addColorStop(0, hexStr + '66');
    haloGrad.addColorStop(0.25, hexStr + '22');
    haloGrad.addColorStop(0.6, hexStr + '04');
    haloGrad.addColorStop(1, 'transparent');
    hctx.fillStyle = haloGrad;
    hctx.fillRect(0, 0, 128, 128);
    const haloTexture = new THREE.CanvasTexture(haloCanvas);
    haloTexture.minFilter = THREE.LinearFilter;
    const haloMat = new THREE.SpriteMaterial({
      map: haloTexture,
      transparent: true,
      opacity: 0.35,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(haloSize, haloSize, 1);
    halo.renderOrder = -1;
    group.add(halo);

    // ── Orbiting moons ──────────────────────────────
    const items = [];
    const itemCount = def.constellation.length;

    // Determine number of orbit rings based on item count
    const ringCount = itemCount <= 4 ? 1 : itemCount <= 8 ? 2 : 3;
    const itemsPerRing = [];
    let remaining = itemCount;
    for (let r = 0; r < ringCount; r++) {
      const count = r < ringCount - 1
        ? Math.ceil(remaining / (ringCount - r))
        : remaining;
      itemsPerRing.push(count);
      remaining -= count;
    }

    // Random phase offset so each planet's moons start at different positions
    const ringPhaseOffset = Math.random() * Math.PI * 2;

    let itemIdx = 0;
    for (let r = 0; r < ringCount; r++) {
      const count = itemsPerRing[r];
      const orbitRadius = size * ORBIT_RADII[r];
      const orbitSpeed = ORBIT_SPEEDS[r];
      const angleStep = (Math.PI * 2) / count;

      for (let j = 0; j < count; j++) {
        const itemDef = def.constellation[itemIdx];
        const itemColor = itemDef.color ? new THREE.Color(itemDef.color) : color;
        const moonSize = 0.05;

        const moonGeo = MOON_GEO.clone();
        moonGeo.scale(moonSize, moonSize, moonSize);
        const moonMat = new THREE.MeshBasicMaterial({
          color: itemColor,
          wireframe: true,
          transparent: true,
          opacity: 0.45,
        });
        const mesh = new THREE.Mesh(moonGeo, moonMat);

        // Initial phase: evenly spaced around the ring
        const angle = j * angleStep + ringPhaseOffset;
        mesh.position.set(
          Math.cos(angle) * orbitRadius,
          0,
          Math.sin(angle) * orbitRadius,
        );
        mesh.visible = true;

        mesh.userData = {
          isConstellationItem: true,
          planetId: def.id,
          label: itemDef.label,
          detail: itemDef.detail || '',
          link: itemDef.link || '',
        };
        group.add(mesh);
        items.push({
          mesh,
          orbitRadius,
          orbitSpeed,
          orbitPhase: angle,
          snapPhase: j * angleStep,        // evenly-spaced target for frozen state
          orbitPhaseStart: angle,           // captured when snapping begins
        });
        itemIdx++;
      }
    }

    // ── Orbital path rings (faint guide lines) ─────
    const orbitRings = [];
    for (let r = 0; r < ringCount; r++) {
      const orbitRadius = size * ORBIT_RADII[r];
      const ringPoints = [];
      const segments = 64;
      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringLine = new THREE.Line(
        ringGeo,
        new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.08,
          depthTest: true,
          depthWrite: false,
        }),
      );
      group.add(ringLine);
      orbitRings.push(ringLine);
    }

    this._planets.set(def.id, {
      group, body, core, halo, items,
      orbitRings,
      hovered: null,
      floatOffset: pos.clone(),
      // Orbital parameters (null when using legacy fixed-position mode)
      orbitRadius: hasOrbit ? def.orbitRadius : null,
      orbitSpeed: hasOrbit ? def.orbitSpeed : null,
      orbitPhase: hasOrbit ? def.orbitPhase : null,
      orbitTilt: hasOrbit ? def.orbitTilt : null,
      orbitState: 'orbiting',   // 'orbiting' | 'snapping' | 'frozen'
      snapProgress: 0,
      // Hover-driven moon visibility (preview / galaxy view)
      moonVisibility: 0,        // 0 hidden → 1 visible (lerped)
      moonVisTarget: 0,         // 0 or 1
      moonVisProgress: 0,       // 0 → 1 transition progress
    });
  }

  get isZoomed() {
    return this._zoomPhase === 'in' || this._zoomPhase === 'open';
  }

  /** Public method to trigger zoom out (called from React panel close). */
  startZoomOut() {
    if (this._zoomPhase === 'open' || this._zoomPhase === 'in') {
      this._startZoomOut();
    }
  }

  /**
   * Public method to zoom to a specific planet by ID.
   * Called from React (nav clicks) without raycasting.
   * @param {string} planetId — 'work' | 'craft' | 'music' | 'play'
   */
  zoomToPlanet(planetId) {
    if (!this._planets.has(planetId)) return;
    // Already zoomed to this planet — nothing to do
    if (this._zoomPlanetId === planetId && this._zoomPhase === 'open') return;
    // If zoomed to a different planet, release its frozen state
    if (this._zoomPhase === 'open' || this._zoomPhase === 'in') {
      const prev = this._planets.get(this._zoomPlanetId);
      if (prev && prev.orbitState !== 'orbiting') {
        prev.orbitState = 'orbiting';
        prev.snapProgress = 0;
      }
    }
    this._zoomPlanetId = planetId;
    this._startZoomIn();
  }

  /** @returns {string | null} the id of the currently zoomed planet */
  getZoomedPlanetId() {
    return this._zoomPlanetId;
  }

  /** @returns {THREE.Vector3} world position of the zoomed planet */
  getZoomedPlanetWorldPos() {
    if (!this._zoomPlanetId) return new THREE.Vector3();
    return this._getPlanetWorldPos(this._zoomPlanetId);
  }

  /** @returns {THREE.Quaternion} world quaternion of the zoomed planet group */
  getZoomedPlanetQuat() {
    if (!this._zoomPlanetId) return new THREE.Quaternion();
    const p = this._planets.get(this._zoomPlanetId);
    if (!p) return new THREE.Quaternion();
    return p.group.getWorldQuaternion(new THREE.Quaternion());
  }

  getPlanetTargets() { return this._planetTargets; }

  /**
   * Set which planet is hovered in preview (galaxy) view.
   * Triggers moon/ring pop-out animation for that planet,
   * and pop-in for the previously hovered planet.
   * @param {string|null} planetId
   */
  setHoveredPlanet(planetId) {
    // Ignore during zoom — moons are always visible when zoomed
    if (this.isZoomed) return;
    if (planetId === this._hoveredPlanetId) return;

    // Pop-in the previously hovered planet
    if (this._hoveredPlanetId) {
      const prev = this._planets.get(this._hoveredPlanetId);
      if (prev) {
        prev.moonVisTarget = 0;
        prev.moonVisProgress = 1 - prev.moonVisibility; // start from current
      }
    }

    this._hoveredPlanetId = planetId;

    // Pop-out the newly hovered planet
    if (planetId) {
      const next = this._planets.get(planetId);
      if (next) {
        next.moonVisTarget = 1;
        next.moonVisProgress = next.moonVisibility; // start from current
      }
    }
  }

  /**
   * Clear the hovered planet (pop-in moons/rings).
   */
  clearHoveredPlanet() {
    this.setHoveredPlanet(null);
  }

  getConstellationTargets() {
    // Moons are always visible, but only clickable when zoomed in
    if (this._zoomPhase !== 'open') return [];
    const p = this._planets.get(this._zoomPlanetId);
    if (!p) return [];
    return p.items.map(it => it.mesh);
  }

  handleClick(mesh) {
    if (!mesh) return false;
    // Ignore clicks during zoom transitions
    if (this._zoomPhase === 'in' || this._zoomPhase === 'out') return false;

    const ud = mesh.userData;
    if (ud.isPlanet) {
      if (this._zoomPlanetId === ud.planetId && this._zoomPhase === 'open') {
        this._startZoomOut();
      } else {
        if (this._zoomPhase === 'open') this._startZoomOut();
        this._zoomPlanetId = ud.planetId;
        this._startZoomIn();
      }
      return true;
    }
    if (ud.isConstellationItem) {
      const worldPt = new THREE.Vector3();
      mesh.getWorldPosition(worldPt);
      const screenPt = worldPt.clone().project(this._camera);
      const sx = (screenPt.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-screenPt.y * 0.5 + 0.5) * window.innerHeight;
      this._onItemClick({
        planetId: ud.planetId, label: ud.label, detail: ud.detail,
        link: ud.link, screenX: sx, screenY: sy,
      });
      return true;
    }
    return false;
  }

  _startZoomIn() {
    this._zoomPhase = 'in';
    this._zoomProgress = 0;
    this._zoomStartCam.copy(this._camera.position);
    this._zoomStartLook.copy(this._zoomTargetLook);
  }

  _startZoomOut() {
    const zp = this._planets.get(this._zoomPlanetId);
    if (zp && zp.orbitState !== 'orbiting') {
      zp.orbitState = 'orbiting';
      zp.snapProgress = 0;
    }
    this._zoomPhase = 'out';
    this._zoomProgress = 0;
    this._zoomStartCam.copy(this._camera.position);
    this._zoomStartLook.copy(this._zoomTargetLook);
  }

  _getPlanetWorldPos(id) {
    const p = this._planets.get(id);
    if (!p) return new THREE.Vector3();
    const wp = new THREE.Vector3();
    p.group.getWorldPosition(wp);
    return wp;
  }

  _updateZoom(dt) {
    if (this._zoomPhase === 'none') return;
    this._zoomProgress += dt;
    const planetWorld = this._getPlanetWorldPos(this._zoomPlanetId);
    if (this._zoomPhase === 'in') {
      const raw = Math.min(this._zoomProgress / ZOOM_DURATION, 1);
      const eased = easeInOutCubic(raw);
      const planetGroup = this._planets.get(this._zoomPlanetId).group;
      const planetQuat = planetGroup.getWorldQuaternion(new THREE.Quaternion());
      const approach = new THREE.Vector3(0, 5.5, 0).applyQuaternion(planetQuat);
      const lookOffset = new THREE.Vector3(1.5, 0, 0).applyQuaternion(planetQuat);
      const targetCam = planetWorld.clone().add(approach);
      const targetLook = planetWorld.clone().add(lookOffset);
      this._camera.position.lerpVectors(this._zoomStartCam, targetCam, eased);
      this._zoomTargetLook.lerpVectors(this._zoomStartLook, targetLook, eased);
      this._camera.lookAt(this._zoomTargetLook);
      if (raw >= 1) {
        this._zoomPhase = 'open';
        this._zoomHoldCam = targetCam.clone();
        this._zoomHoldLook = targetLook.clone();
        this._onZoomChange?.({ planetId: this._zoomPlanetId, phase: 'open' });
        // Trigger moon snap-to-freeze for the zoomed planet
        const zp = this._planets.get(this._zoomPlanetId);
        if (zp && zp.orbitState === 'orbiting') {
          for (const item of zp.items) {
            item.orbitPhaseStart = item.orbitPhase;
          }
          zp.orbitState = 'snapping';
          zp.snapProgress = 0;
        }
      }
    } else if (this._zoomPhase === 'open') {
      // Hold camera position
      this._camera.position.copy(this._zoomHoldCam);
      this._camera.lookAt(this._zoomHoldLook);
    } else if (this._zoomPhase === 'out') {
      const raw = Math.min(this._zoomProgress / ZOOM_DURATION, 1);
      const eased = easeInOutCubic(raw);
      this._camera.position.lerpVectors(this._zoomStartCam, DEFAULT_POS, eased);
      this._zoomTargetLook.lerpVectors(this._zoomStartLook, DEFAULT_LOOK, eased);
      this._camera.lookAt(this._zoomTargetLook);
      if (raw >= 1) {
        this._zoomPhase = 'none';
        this._onZoomChange?.({ planetId: null, phase: 'none' });
        this._zoomPlanetId = null;
      }
    }
  }

  handleHover(mesh) {
    const p = this._planets.get(this._zoomPlanetId);
    if (!p) {
      this._onItemHover?.(null);
      return;
    }
    if (p.hovered && p.hovered !== mesh) this._unhighlight(p.hovered);
    p.hovered = mesh;
    if (mesh) {
      this._highlight(mesh);
      this._onItemHover?.({
        planetId: this._zoomPlanetId,
        label: mesh.userData.label,
        detail: mesh.userData.detail,
        link: mesh.userData.link,
      });
    } else {
      this._onItemHover?.(null);
    }
  }

  _highlight(mesh) {
    if (!mesh.material) return;
    mesh.material._savedOpacity = mesh.material.opacity;
    mesh.material._savedColor = mesh.material.color.getHex();
    mesh.material.opacity = 0.78;
    mesh.material.color.lerp(new THREE.Color(0xffffff), 0.25);
  }

  _unhighlight(mesh) {
    if (!mesh.material) return;
    mesh.material.opacity = mesh.material._savedOpacity ?? 0.45;
    if (mesh.material._savedColor !== undefined) {
      mesh.material.color.setHex(mesh.material._savedColor);
    }
  }

  _updateTooltip() {
    const p = this._planets.get(this._zoomPlanetId);
    if (!p || !p.hovered || this._zoomPhase !== 'open') {
      this._tooltip.style.opacity = '0';
      return;
    }
    this._tooltip.textContent = p.hovered.userData.label || '';
    this._tooltip.style.opacity = '1';
    const worldPt = new THREE.Vector3();
    p.hovered.getWorldPosition(worldPt);
    const screenPt = worldPt.clone().project(this._camera);
    this._tooltip.style.left = `${(screenPt.x * 0.5 + 0.5) * window.innerWidth}px`;
    this._tooltip.style.top = `${(-screenPt.y * 0.5 + 0.5) * window.innerHeight}px`;
  }

  update(t, dt) {
    this._updateZoom(dt);
    const zoomed = this.isZoomed;

    // ── When zoomed, always force full moon visibility ──
    if (zoomed && this._zoomPlanetId) {
      const zp = this._planets.get(this._zoomPlanetId);
      if (zp) {
        zp.moonVisibility = 1;
        zp.moonVisTarget = 1;
        zp.moonVisProgress = 1;
      }
    }

    for (const [planetId, p] of this._planets) {
      // ── Moon visibility pop animation (preview hover) ──
      // Lerp moonVisibility toward target with easing
      if (p.moonVisTarget !== p.moonVisibility) {
        const dir = p.moonVisTarget > p.moonVisibility ? 1 : -1;
        if (p.moonVisTarget === 1) {
          // Pop-out: use easeOutBack for bouncy reveal
          p.moonVisProgress += dt / MOON_VIS_DURATION;
          const raw = Math.min(p.moonVisProgress, 1);
          p.moonVisibility = easeOutBack(raw);
          if (raw >= 1) {
            p.moonVisibility = 1;
            p.moonVisProgress = 1;
          }
        } else {
          // Pop-in: use easeInOutCubic for smooth hide
          p.moonVisProgress += dt / MOON_VIS_DURATION;
          const raw = Math.min(p.moonVisProgress, 1);
          p.moonVisibility = 1 - easeInOutCubic(raw);
          if (raw >= 1) {
            p.moonVisibility = 0;
            p.moonVisProgress = 0;
          }
        }
      }

      const moonVis = p.moonVisibility;

      // Orbital or floating motion (freeze when zoomed into any planet)
      if (!zoomed) {
        if (p.orbitRadius != null) {
          // True orbital system — planet circles the center
          const angle = p.orbitPhase + t * p.orbitSpeed;
          const cx = Math.cos(angle) * p.orbitRadius;
          const cz = Math.sin(angle) * p.orbitRadius;
          const tilt = p.orbitTilt || 0.25;
          const cy = cz * Math.sin(tilt);
          const czTilted = cz * Math.cos(tilt);
          // Subtle floating overlay on top of orbital position
          p.group.position.x = cx + Math.sin(t * 0.25 + p.orbitPhase) * 0.15;
          p.group.position.y = cy + Math.cos(t * 0.3 + p.orbitPhase) * 0.12;
          p.group.position.z = czTilted + Math.cos(t * 0.2 + p.orbitPhase) * 0.15;
        } else {
          // Legacy fixed-position floating (backward compat)
          p.group.position.x = p.floatOffset.x + Math.sin(t * 0.25 + p.floatOffset.x * 0.4) * 0.45;
          p.group.position.y = p.floatOffset.y + Math.cos(t * 0.3 + p.floatOffset.y * 0.3) * 0.3;
          p.group.position.z = p.floatOffset.z + Math.cos(t * 0.2 + p.floatOffset.z * 0.5) * 0.35;
        }
      }

      // Planet body rotation
      p.body.rotation.y += dt * 0.3;
      p.body.rotation.x += dt * 0.1;

      // ── Idle breathing animation ─────────────────
      // Subtle scale oscillation, each planet at a different phase
      const breathe = 1 + Math.sin(t * 0.6 + p.floatOffset.x * 0.7 + p.floatOffset.y * 0.3) * 0.02;
      p.body.scale.setScalar(breathe);
      if (p.core) p.core.scale.setScalar(breathe * 0.98);
      if (p.halo) {
        // Subtle halo opacity pulse
        p.halo.material.opacity = 0.28 + Math.sin(t * 0.45 + p.floatOffset.x) * 0.07;
      }

      // ── Moons orbital animation ──────────────────
      // Only compute orbits when moons are visible (moonVis > 0)
      if (moonVis > 0.001) {
        if (p.orbitState === 'snapping') {
          p.snapProgress += dt / SNAP_DURATION;
          const raw = Math.min(p.snapProgress, 1);
          const tEased = easeOutBack(raw);
          for (const item of p.items) {
            // shortest angular path from captured start to evenly-spaced snap target
            let diff = item.snapPhase - item.orbitPhaseStart;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            item.orbitPhase = item.orbitPhaseStart + diff * tEased;
            item.mesh.position.set(
              Math.cos(item.orbitPhase) * item.orbitRadius,
              0,
              Math.sin(item.orbitPhase) * item.orbitRadius,
            );
            item.mesh.rotation.y += dt * 0.5;
            item.mesh.rotation.x += dt * 0.3;
          }
          if (raw >= 1) {
            p.orbitState = 'frozen';
            p.snapProgress = 0;
          }
        } else if (p.orbitState === 'frozen') {
          // Moons held at evenly-spaced snap positions — no orbit increment
          for (const item of p.items) {
            item.orbitPhase = item.snapPhase;
            item.mesh.position.set(
              Math.cos(item.orbitPhase) * item.orbitRadius,
              0,
              Math.sin(item.orbitPhase) * item.orbitRadius,
            );
            item.mesh.rotation.y += dt * 0.5;
            item.mesh.rotation.x += dt * 0.3;
          }
        } else {
          // Normal orbiting
          for (const item of p.items) {
            item.orbitPhase += dt * item.orbitSpeed;
            item.mesh.position.set(
              Math.cos(item.orbitPhase) * item.orbitRadius,
              0,
              Math.sin(item.orbitPhase) * item.orbitRadius,
            );
            item.mesh.rotation.y += dt * 0.5;
            item.mesh.rotation.x += dt * 0.3;
          }
        }
      }

      // ── Apply moon visibility to mesh scale & opacity ──
      for (const item of p.items) {
        item.mesh.scale.setScalar(moonVis);
        item.mesh.material.opacity = moonVis * 0.45;
        item.mesh.visible = moonVis > 0.005;
      }

      // ── Apply moon visibility to orbital rings ──
      if (p.orbitRings) {
        for (const ring of p.orbitRings) {
          ring.material.opacity = moonVis * 0.08;
          ring.visible = moonVis > 0.005;
        }
      }
    }
    this._updateTooltip();
  }

  dispose() {
    for (const [, p] of this._planets) {
      p.body.geometry.dispose();
      p.body.material.dispose();
      if (p.core) {
        p.core.geometry.dispose();
        p.core.material.dispose();
      }
      if (p.halo) {
        p.halo.material.map?.dispose();
        p.halo.material.dispose();
      }
      if (p.orbitRings) {
        for (const ring of p.orbitRings) {
          ring.geometry.dispose();
          ring.material.dispose();
        }
      }
      for (const item of p.items) {
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
      }
    }
    this._planets.clear();
    this._planetTargets.length = 0;
    if (this._tooltip.parentNode) this._tooltip.remove();
  }
}
