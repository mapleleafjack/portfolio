import * as THREE from 'three';
import { getAccentColor } from './shared';
import config from '../../data/planets.json';

// ── Shared geometries ──────────────────────────────────
const GEO = {
  gem:   new THREE.IcosahedronGeometry(1, 1),
  orb:   new THREE.SphereGeometry(1, 12, 12),
  box:   new THREE.BoxGeometry(1, 1, 1, 2, 2, 2),
  disc:  new THREE.CylinderGeometry(1, 1, 0.18, 24),
  chip:  new THREE.BoxGeometry(1, 0.22, 0.75),
  tetra: new THREE.TetrahedronGeometry(1, 1),
};

// ── Easing ────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function easeInCubic(t) { return t * t * t; }

const ZOOM_DURATION = 0.85;
const DEFAULT_POS = new THREE.Vector3(0, 0, 5);
const DEFAULT_LOOK = new THREE.Vector3(0, 0, 0);

export default class PlanetSystem {
  constructor(sceneGroup, camera, onItemClick, onItemHover, onZoomChange) {
    this._sceneGroup = sceneGroup;
    this._camera = camera;
    this._onItemClick = onItemClick || (() => {});
    this._onItemHover = onItemHover || (() => {});
    this._onZoomChange = onZoomChange || (() => {});

    this._planets = new Map();
    this._planetTargets = [];
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
   * Create a sprite label with canvas-rendered text.
   * @param {string} text
   * @param {THREE.Color} color
   * @returns {THREE.Sprite}
   */
  _createLabelSprite(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Semi-transparent background pill
    const hex = '#' + color.getHexString();
    ctx.fillStyle = hex + '1a'; // ~10% opacity
    ctx.beginPath();
    ctx.roundRect(40, 12, 176, 40, 20);
    ctx.fill();

    // Border
    ctx.strokeStyle = hex + '66'; // ~40% opacity
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(40, 12, 176, 40, 20);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 22px "Oxanium", "SF Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    return new THREE.Sprite(material);
  }

  _buildPlanet(def) {
    const group = new THREE.Group();
    const pos = new THREE.Vector3(def.position[0], def.position[1], def.position[2]);
    group.position.copy(pos);
    this._sceneGroup.add(group);

    const color = new THREE.Color(def.color);
    const size = def.size || 0.40;
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

    // ── Planet name label (sprite) ──────────────────
    const labelSprite = this._createLabelSprite(def.name, color);
    labelSprite.position.set(0, size + 0.35, 0);
    labelSprite.scale.set(1.2, 0.32, 1);
    group.add(labelSprite);

    // Wireframe ring
    const ringRadius = size * 1.8;
    const ringGeo = new THREE.TorusGeometry(ringRadius, def.ringWidth || 0.06, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    group.add(ring);

    // Constellation items (wireframe)
    const items = [];
    const itemCount = def.constellation.length;

    // ── Concentric ring layout for top-down chart view ──
    const ringRadii = [0.9, 1.4, 1.9];
    const ringHeights = [0.0, 0.2, -0.15];
    const ringCount = Math.min(ringRadii.length, Math.max(1, Math.ceil(itemCount / 4)));
    const itemsPerRing = [];
    let remaining = itemCount;
    for (let r = 0; r < ringCount; r++) {
      const count = r < ringCount - 1
        ? Math.ceil(remaining / (ringCount - r))
        : remaining;
      itemsPerRing.push(count);
      remaining -= count;
    }

    // ── Orbit rings (thin wireframe circles on XZ plane) ──
    const orbitRings = [];
    for (let r = 0; r < ringCount; r++) {
      const orbitGeo = new THREE.TorusGeometry(ringRadii[r], 0.015, 6, 64);
      const orbitMat = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.0,
      });
      const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
      orbitRing.rotation.x = Math.PI / 2; // flat on XZ plane (top-down)
      orbitRing.position.y = ringHeights[r];
      orbitRing.visible = false;
      group.add(orbitRing);
      orbitRings.push({ mesh: orbitRing, targetOpacity: 0.08 });
    }

    let itemIdx = 0;
    for (let r = 0; r < ringCount; r++) {
      const count = itemsPerRing[r];
      const radius = ringRadii[r];
      const height = ringHeights[r];
      for (let j = 0; j < count; j++) {
        const itemDef = def.constellation[itemIdx];
        const itemColor = itemDef.color ? new THREE.Color(itemDef.color) : color;
        const itemSize = itemDef.size || 0.16;
        const baseGeo = GEO[itemDef.type] || GEO.orb;
        const itemGeo = baseGeo.clone();
        if (itemDef.type === 'disc') {
          itemGeo.scale(itemSize, itemSize * 0.18, itemSize);
        } else {
          itemGeo.scale(itemSize, itemSize, itemSize);
        }
        const itemMat = new THREE.MeshBasicMaterial({
          color: itemColor,
          wireframe: true,
          transparent: true,
          opacity: 0.35,
        });
        const mesh = new THREE.Mesh(itemGeo, itemMat);
        const angle = (j / count) * Math.PI * 2;
        const targetPos = new THREE.Vector3(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius,
        );
        mesh.position.set(0, 0, 0);
        mesh.scale.set(0, 0, 0);
        mesh.visible = false;
        mesh.userData = {
          isConstellationItem: true,
          planetId: def.id,
          label: itemDef.label,
          detail: itemDef.detail || '',
          link: itemDef.link || '',
        };
        group.add(mesh);
        items.push({ mesh, targetPos });
        itemIdx++;
      }
    }

    this._planets.set(def.id, {
      group, body, ring, items, orbitRings, label: labelSprite,
      constellState: 'closed',
      constellProgress: 0,
      hovered: null,
      floatOffset: pos.clone(),
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

  getPlanetTargets() { return this._planetTargets; }

  getConstellationTargets() {
    if (this._zoomPhase !== 'open') return [];
    const p = this._planets.get(this._zoomPlanetId);
    if (!p || p.constellState === 'closed' || p.constellState === 'closing') return [];
    return p.items.map(it => it.mesh);
  }

  handleClick(mesh) {
    if (!mesh) return false;
    // Ignore clicks during zoom transitions (prevents snap-back bug)
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
    const p = this._planets.get(this._zoomPlanetId);
    if (p && (p.constellState === 'open' || p.constellState === 'opening')) {
      p.constellState = 'closing';
      p.constellProgress = 0;
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
      // Pure top-down chart: camera high above for wide coverage,
      // looking moderately right so the planet + all moons fit on the left.
      // Use planet-local directions so the chart stays flat regardless of sceneGroup rotation.
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
        // Store the target camera position so we can hold it during 'open' state
        this._zoomHoldCam = targetCam.clone();
        this._zoomHoldLook = targetLook.clone();
        // Notify React that chart view is open
        this._onZoomChange?.({ planetId: this._zoomPlanetId, phase: 'open' });
        const p = this._planets.get(this._zoomPlanetId);
        if (p) {
          for (const item of p.items) {
            item.mesh.visible = true;
            item.mesh.position.set(0, 0, 0);
            item.mesh.scale.set(0, 0, 0);
          }
          p.constellState = 'opening';
          p.constellProgress = 0;
        }
      }
    } else if (this._zoomPhase === 'open') {
      // Hold camera position — prevent other systems from pulling it back to center
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
        // Notify React that chart view is closed
        this._onZoomChange?.({ planetId: null, phase: 'none' });
        this._zoomPlanetId = null;
      }
    }
  }

  _animateConstellation(p, dt) {
    if (p.constellState === 'closed') return;
    const DUR_OPEN = 0.55;
    const DUR_CLOSE = 0.3;
    p.constellProgress += dt;
    const origin = new THREE.Vector3(0, 0, 0);
    if (p.constellState === 'opening') {
      const raw = Math.min(p.constellProgress / DUR_OPEN, 1);
      const tEased = easeOutBack(raw);
      for (const item of p.items) {
        item.mesh.position.lerpVectors(origin, item.targetPos, tEased);
        item.mesh.scale.setScalar(tEased);
        item.mesh.rotation.x += dt * 0.5;
        item.mesh.rotation.y += dt * 0.7;
      }
      // Orbit ring opacity fade-in during opening
      if (p.orbitRings) {
        for (const or of p.orbitRings) {
          or.mesh.visible = true;
          or.mesh.material.opacity = Math.min(tEased * or.targetOpacity, or.targetOpacity);
        }
      }
      if (raw >= 1) { p.constellState = 'open'; p.constellProgress = 0; }
    } else if (p.constellState === 'open') {
      // Static in chart mode — no rotation
    } else if (p.constellState === 'closing') {
      const raw = Math.min(p.constellProgress / DUR_CLOSE, 1);
      const tEased = easeInCubic(raw);
      for (const item of p.items) {
        item.mesh.position.lerpVectors(item.targetPos, origin, tEased);
        item.mesh.scale.setScalar(1 - tEased);
      }
      if (raw >= 1) {
        p.constellState = 'closed';
        p.constellProgress = 0;
        for (const item of p.items) { item.mesh.visible = false; item.mesh.scale.set(0, 0, 0); }
        // Hide orbit rings
        if (p.orbitRings) {
          for (const or of p.orbitRings) {
            or.mesh.visible = false;
            or.mesh.material.opacity = 0.0;
          }
        }
        if (p.hovered) { this._unhighlight(p.hovered); p.hovered = null; }
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
    // Faint glow: lighten color slightly
    mesh.material.color.lerp(new THREE.Color(0xffffff), 0.25);
  }

  _unhighlight(mesh) {
    if (!mesh.material) return;
    mesh.material.opacity = mesh.material._savedOpacity ?? 0.35;
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
    for (const [, p] of this._planets) {
      // Freeze floating animation when zoomed into a planet
      if (!zoomed) {
        p.group.position.x = p.floatOffset.x + Math.sin(t * 0.25 + p.floatOffset.x * 0.4) * 0.45;
        p.group.position.y = p.floatOffset.y + Math.cos(t * 0.3 + p.floatOffset.y * 0.3) * 0.3;
        p.group.position.z = p.floatOffset.z + Math.cos(t * 0.2 + p.floatOffset.z * 0.5) * 0.35;
      }
      p.body.rotation.y += dt * 0.3;
      p.body.rotation.x += dt * 0.1;
      p.ring.rotation.z += dt * 0.15;
      // Hide label when zoomed into any planet, show otherwise
      if (p.label) {
        p.label.visible = this._zoomPhase !== 'open' && this._zoomPhase !== 'in';
      }
      this._animateConstellation(p, dt);
    }
    this._updateTooltip();
  }

  dispose() {
    for (const [, p] of this._planets) {
      p.body.geometry.dispose();
      p.body.material.dispose();
      p.ring.geometry.dispose();
      p.ring.material.dispose();
      if (p.label) {
        p.label.material.map?.dispose();
        p.label.material.dispose();
      }
      for (const item of p.items) {
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
      }
      if (p.orbitRings) {
        for (const or of p.orbitRings) {
          or.mesh.geometry.dispose();
          or.mesh.material.dispose();
        }
      }
    }
    this._planets.clear();
    this._planetTargets.length = 0;
    if (this._tooltip.parentNode) this._tooltip.remove();
  }
}
