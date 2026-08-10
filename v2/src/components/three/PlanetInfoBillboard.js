import * as THREE from 'three';

// ── Planet descriptions ────────────────────────────
const PLANET_DESCS = {
  work: 'Software I\'ve shipped — legal-tech AI, housing SaaS, comic certification. Built across micro-frontends, Python backends, and .NET services.',
  craft: 'Things I build with my hands — custom PCBs, ESP32 devices, reactive LED installations, and festival tech. From schematic to solder.',
  music: 'Music production & audio engineering — psytrance albums, VST plugin development, and live performance with Ableton Push.',
  play: 'Experiments & side quests — LLM slime colonies, fermentation labs, mushroom cultivation, and the occasional biotech proposal.',
};

// ── Planet → page route mapping ────────────────────
const PLANET_ROUTES = {
  work: '/work',
  craft: null,
  music: '/creative',
  play: null,
};

// ── Planet highlight stats (shown in billboard) ────
const PLANET_HIGHLIGHTS = {
  work: ['7 key projects', '5 companies', 'Legal-tech · Gov · Fintech'],
  craft: ['6 hardware builds', 'PCB · ESP32 · LEDs', 'Installations · Festivals'],
  music: ['3 albums', 'VST plugin', 'Audio engineering diploma'],
  play: ['6 experiments', 'AI · CLI · Biotech', 'Mycology · Fermentation'],
};

const ORBIT_COUNTS = {
  work: '7 projects in orbit',
  craft: '6 builds in orbit',
  music: '6 tracks in orbit',
  play: '6 experiments in orbit',
};

// ── Canvas geometry ──────────────────────────────────
const CANVAS_W = 1920;
const CANVAS_H = 640;
const PLANE_W = 4.8;
const PLANE_H = 1.6;

// ── Animation constants ──────────────────────────────
const ENTRANCE_DURATION = 0.4;  // seconds for scale + fade in

export default class PlanetInfoBillboard {
  /**
   * @param {THREE.Group} sceneGroup — parent group for the billboard
   * @param {THREE.Camera} camera — used for billboard lookAt
   */
  constructor(sceneGroup, camera) {
    this._sceneGroup = sceneGroup;
    this._camera = camera;

    // ── State ────────────────────────────────────────
    this._visible = false;
    this._planetId = null;
    this._planetColor = '#f0c830';
    this._planetName = '';
    this._hoveredItem = null;      // { label, detail, link } or null
    this._currentLink = null;
    this._entranceT = 0;           // entrance progress (0..1)
    this._entranceActive = false;

    // ── Canvas ──────────────────────────────────────
    this._canvas = document.createElement('canvas');
    this._canvas.width = CANVAS_W;
    this._canvas.height = CANVAS_H;
    this._ctx = this._canvas.getContext('2d');

    // ── Texture ─────────────────────────────────────
    this._texture = new THREE.CanvasTexture(this._canvas);
    this._texture.minFilter = THREE.LinearFilter;
    this._texture.magFilter = THREE.LinearFilter;

    // ── Material ────────────────────────────────────
    this._material = new THREE.MeshBasicMaterial({
      map: this._texture,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });

    // ── Plane mesh ──────────────────────────────────
    this._planeGeo = new THREE.PlaneGeometry(PLANE_W, PLANE_H);
    this._plane = new THREE.Mesh(this._planeGeo, this._material);
    this._plane.visible = false;
    this._plane.renderOrder = 999;
    this._plane.material.depthTest = false;
    this._plane.material.depthWrite = false;
    sceneGroup.add(this._plane);

    // ── Pre-allocated quaternions for billboard rotation ──
    // Reused every frame to avoid GC pressure at 60fps.
    this._camWorldQuat = new THREE.Quaternion();
    this._parentWorldQuat = new THREE.Quaternion();

    // Initial blank render
    this._redraw();
  }

  // ═══════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════

  /**
   * Show the billboard above a planet.
   * @param {THREE.Vector3} worldPos — planet world position
   * @param {THREE.Quaternion} planetQuat — planet group world quaternion (aligns offset with camera approach)
   * @param {{ id: string, name: string, color: string }} planetData
   */
  show(worldPos, planetQuat, planetData) {
    this._planetId = planetData.id;
    this._planetName = planetData.name;
    this._planetColor = planetData.color;
    this._hoveredItem = null;
    this._currentLink = PLANET_ROUTES[planetData.id] ?? null;

    // Position above the planet: separate distance along the camera
    // approach direction from screen-space vertical offset, so the
    // billboard shifts up on screen without scaling larger.
    const approachDir = new THREE.Vector3(0, 1, 0).applyQuaternion(planetQuat);
    const screenUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this._camera.quaternion);
    const offset = approachDir.multiplyScalar(2.2).add(screenUp.multiplyScalar(1.8));
    const targetWorld = worldPos.clone().add(offset);
    this._plane.position.copy(this._sceneGroup.worldToLocal(targetWorld));

    this._plane.visible = true;
    this._visible = true;
    this._entranceActive = true;
    this._entranceT = 0;

    this._redraw();
  }

  /** Hide the billboard with a quick fade. */
  hide() {
    this._visible = false;
    this._entranceActive = false;
    this._plane.visible = false;
    this._material.opacity = 0;
    this._plane.scale.set(0.8, 0.8, 1);
    this._hoveredItem = null;
    this._currentLink = null;
    this._planetId = null;
  }

  /**
   * Update the hovered constellation item.
   * @param {{ label: string, detail: string, link: string } | null} item
   */
  setHoveredItem(item) {
    this._hoveredItem = item || null;
    this._currentLink = item?.link || null;
    this._redraw();
  }

  /** @returns {THREE.Mesh[]} meshes to include in raycasting for clicks */
  getRayTargets() {
    return this._visible ? [this._plane] : [];
  }

  /** @returns {string | null} */
  getCurrentLink() {
    return this._currentLink;
  }

  /** @returns {boolean} */
  get isVisible() {
    return this._visible;
  }

  // ═══════════════════════════════════════════════════
  //  PER-FRAME UPDATE
  // ═══════════════════════════════════════════════════

  /**
   * @param {number} t — absolute elapsed time (seconds)
   * @param {number} dt — delta time (seconds)
   */
  update(t, dt) {
    if (!this._visible && !this._entranceActive) return;

    // ── Billboard: always face the camera ────────────
    // Align the plane's orientation with the camera's world
    // quaternion so it matches full camera orientation (pitch,
    // yaw, roll) — not just position.  PlaneGeometry renders
    // on +Z which naturally faces the camera here (camera looks
    // along -Z toward the scene).  Convert to plane-local space
    // to compensate for sceneGroup rotation.
    this._camera.getWorldQuaternion(this._camWorldQuat);
    this._plane.parent.getWorldQuaternion(this._parentWorldQuat);
    this._plane.quaternion.copy(
      this._parentWorldQuat.invert().multiply(this._camWorldQuat),
    );

    // ── Entrance animation ───────────────────────────
    if (this._entranceActive) {
      this._entranceT += dt / ENTRANCE_DURATION;
      const raw = Math.min(this._entranceT, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - raw, 3);
      this._material.opacity = eased;
      const s = 0.8 + eased * 0.2;
      this._plane.scale.set(s, s, 1);
      if (raw >= 1) {
        this._entranceActive = false;
        this._material.opacity = 1;
        this._plane.scale.set(1, 1, 1);
      }
    }
  }

  dispose() {
    this._planeGeo.dispose();
    this._material.dispose();
    this._texture.dispose();
    this._sceneGroup.remove(this._plane);
  }

  // ═══════════════════════════════════════════════════
  //  CANVAS RENDERING (holographic style)
  // ═══════════════════════════════════════════════════

  _redraw() {
    const ctx = this._ctx;
    const W = CANVAS_W / 2;  // logical coords after ctx.scale(2,2)
    const H = CANVAS_H / 2;
    const accent = this._planetColor || '#f0c830';

    // Clear at full physical resolution, then scale for crisp 2x rendering
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.save();
    ctx.scale(2, 2);

    // ── Background panel ────────────────────────────
    const panelX = 20;
    const panelY = 16;
    const panelW = W - 40;
    const panelH = H - 32;
    const radius = 18;

    // Glass-like dark fill
    ctx.fillStyle = 'rgba(8, 8, 16, 0.78)';
    ctx.beginPath();
    this._roundRect(ctx, panelX, panelY, panelW, panelH, radius);
    ctx.fill();

    // ── Static scanlines ────────────────────────────
    ctx.save();
    ctx.beginPath();
    this._roundRect(ctx, panelX, panelY, panelW, panelH, radius);
    ctx.clip();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let y = panelY; y < panelY + panelH; y += 3) {
      ctx.fillRect(panelX, y, panelW, 1);
    }
    ctx.restore();

    // ── Glowing border ─────────────────────────────
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 9;
    ctx.strokeStyle = accent + '99';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    this._roundRect(ctx, panelX, panelY, panelW, panelH, radius);
    ctx.stroke();
    ctx.restore();

    // ── Corner brackets ────────────────────────────
    const bracketLen = 28;
    const bracketGap = 8;
    ctx.strokeStyle = accent + 'cc';
    ctx.lineWidth = 1;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 4;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(panelX + bracketGap, panelY + bracketLen);
    ctx.lineTo(panelX + bracketGap, panelY + bracketGap);
    ctx.lineTo(panelX + bracketLen, panelY + bracketGap);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(panelX + panelW - bracketLen, panelY + bracketGap);
    ctx.lineTo(panelX + panelW - bracketGap, panelY + bracketGap);
    ctx.lineTo(panelX + panelW - bracketGap, panelY + bracketLen);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(panelX + bracketGap, panelY + panelH - bracketLen);
    ctx.lineTo(panelX + bracketGap, panelY + panelH - bracketGap);
    ctx.lineTo(panelX + bracketLen, panelY + panelH - bracketGap);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(panelX + panelW - bracketLen, panelY + panelH - bracketGap);
    ctx.lineTo(panelX + panelW - bracketGap, panelY + panelH - bracketGap);
    ctx.lineTo(panelX + panelW - bracketGap, panelY + panelH - bracketLen);
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // ── Content area ───────────────────────────────
    const contentX = panelX + 36;
    const contentW = panelW - 72;

    if (this._hoveredItem) {
      // ── Hovered item view ──────────────────────
      this._drawHoveredContent(ctx, contentX, panelY + 30, contentW, panelH - 60, accent);
    } else {
      // ── Default planet overview ────────────────
      this._drawDefaultContent(ctx, contentX, panelY + 30, contentW, panelH - 60, accent);
    }

    ctx.restore();
    // Update texture
    this._texture.needsUpdate = true;
  }

  _drawDefaultContent(ctx, x, y, maxW, maxH, accent) {
    // ── Planet color dot + name ─────────────────────
    const dotR = 9;
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.arc(x + dotR, y + dotR + 4, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 26px "Oxanium", "SF Mono", "Courier New", monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(this._planetName.toUpperCase(), x + dotR * 2 + 12, y + 4);

    // ── Description ─────────────────────────────────
    const desc = PLANET_DESCS[this._planetId] || '';
    ctx.fillStyle = 'rgba(200, 200, 215, 0.85)';
    ctx.font = '400 13px "Oxanium", "SF Mono", monospace';
    const descLines = this._wrapText(ctx, desc, maxW - 20);
    let ly = y + 46;
    for (const line of descLines) {
      ctx.fillText(line, x + 4, ly);
      ly += 18;
    }

    // ── Highlights (bullet points) ─────────────────
    const highlights = PLANET_HIGHLIGHTS[this._planetId] || [];
    if (highlights.length > 0) {
      ly += 4;
      ctx.fillStyle = 'rgba(180, 185, 200, 0.7)';
      ctx.font = '400 11px "Oxanium", "SF Mono", monospace';
      for (const hl of highlights) {
        ctx.fillText(`· ${hl}`, x + 8, ly);
        ly += 16;
      }
    }

    // ── Primary action badge ("OPEN WORK PAGE →") ──
    const route = PLANET_ROUTES[this._planetId];
    if (route) {
      const btnY = y + maxH - 60;
      const btnText = `OPEN ${this._planetName.toUpperCase()} PAGE  →`;
      ctx.fillStyle = accent + '26';
      ctx.beginPath();
      const btnMetrics = ctx.measureText(btnText);
      const btnW = btnMetrics.width + 32;
      const btnH = 26;
      this._roundRect(ctx, x, btnY, btnW, btnH, 13);
      ctx.fill();
      ctx.strokeStyle = accent + '99';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      this._roundRect(ctx, x, btnY, btnW, btnH, 13);
      ctx.stroke();

      const pulsePhase = (Date.now() % 1500) / 1500;
      const dotAlpha = 0.5 + Math.sin(pulsePhase * Math.PI * 2) * 0.5;
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.5 + dotAlpha * 0.5;
      ctx.beginPath();
      ctx.arc(x + 13, btnY + btnH / 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = accent;
      ctx.font = '600 11px "Oxanium", "SF Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(btnText, x + 22, btnY + btnH / 2);
    }

    // ── Orbit count badge ──────────────────────────
    const countText = ORBIT_COUNTS[this._planetId] || '';
    if (countText) {
      const badgeY = y + maxH - 6;
      ctx.fillStyle = accent + '1a';
      ctx.beginPath();
      const badgeMetrics = ctx.measureText(countText);
      const badgeW = badgeMetrics.width + 24;
      const badgeH = 20;
      this._roundRect(ctx, x, badgeY - badgeH, badgeW, badgeH, 10);
      ctx.fill();
      ctx.strokeStyle = accent + '55';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      this._roundRect(ctx, x, badgeY - badgeH, badgeW, badgeH, 10);
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.font = '500 10px "Oxanium", "SF Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(countText, x + 12, badgeY - badgeH / 2);
    }
  }

  _drawHoveredContent(ctx, x, y, maxW, maxH, accent) {
    // ── Item label (large heading) ──────────────────
    const label = this._hoveredItem.label || '';
    ctx.fillStyle = accent;
    ctx.font = '700 30px "Oxanium", "SF Mono", "Courier New", monospace';
    ctx.textBaseline = 'top';
    const labelLines = this._wrapText(ctx, label, maxW);
    let ly = y + 2;
    for (const line of labelLines.slice(0, 2)) {
      ctx.fillText(line, x, ly);
      ly += 36;
    }

    // ── Detail text ─────────────────────────────────
    const detail = this._hoveredItem.detail || '';
    if (detail) {
      ctx.fillStyle = 'rgba(200, 200, 215, 0.82)';
      ctx.font = '400 14px "Oxanium", "SF Mono", monospace';
      const detailLines = this._wrapText(ctx, detail, maxW - 10);
      ly += 6;
      for (const line of detailLines.slice(0, 3)) {
        ctx.fillText(line, x + 4, ly);
        ly += 20;
      }
    }

    // ── Link indicator ──────────────────────────────
    if (this._hoveredItem.link) {
      const linkY = y + maxH - 42;
      const linkText = 'CLICK TO VIEW  →';
      ctx.fillStyle = accent + '1a';
      ctx.beginPath();
      const linkMetrics = ctx.measureText(linkText);
      const badgeW = linkMetrics.width + 28;
      const badgeH = 28;
      this._roundRect(ctx, x, linkY, badgeW, badgeH, 14);
      ctx.fill();
      ctx.strokeStyle = accent + '88';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      this._roundRect(ctx, x, linkY, badgeW, badgeH, 14);
      ctx.stroke();

      // Pulsing dot indicator
      const pulsePhase = (Date.now() % 1500) / 1500;
      const dotAlpha = 0.5 + Math.sin(pulsePhase * Math.PI * 2) * 0.5;
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.5 + dotAlpha * 0.5;
      ctx.beginPath();
      ctx.arc(x + 14, linkY + badgeH / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = accent;
      ctx.font = '600 12px "Oxanium", "SF Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(linkText, x + 24, linkY + badgeH / 2);
    }
  }

  // ═══════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════

  /** Rounded rectangle path. */
  _roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /** Wrap text into lines that fit within maxWidth. */
  _wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }
}
