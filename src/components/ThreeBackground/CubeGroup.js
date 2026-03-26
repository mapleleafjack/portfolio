import * as THREE from 'three';

const TRACK_COLOR_SCHEMES = [
  { primary: 0xffffff, secondary: 0x222222, accent: 0xcccccc, bg: '#0a0c0e' },
  { primary: 0xc084fc, secondary: 0x4c1d95, accent: 0xa855f7, bg: '#0e0818' },
  { primary: 0xef4444, secondary: 0x7f1d1d, accent: 0xf87171, bg: '#180808' },
  { primary: 0xfb923c, secondary: 0x9a3412, accent: 0xfdba74, bg: '#18100a' },
  { primary: 0x7dd3fc, secondary: 0x0c4a6e, accent: 0x38bdf8, bg: '#081218' },
  { primary: 0xfde047, secondary: 0x854d0e, accent: 0xfacc15, bg: '#181408' },
  { primary: 0x4ade80, secondary: 0x14532d, accent: 0x22c55e, bg: '#081808' },
  { primary: 0xf472b6, secondary: 0x831843, accent: 0xec4899, bg: '#180814' },
  { primary: 0x22d3ee, secondary: 0x164e63, accent: 0x06b6d4, bg: '#081618' },
  { primary: 0xe879f9, secondary: 0x6b21a8, accent: 0xd946ef, bg: '#140818' },
  { primary: 0xf97316, secondary: 0x7c2d12, accent: 0xfb923c, bg: '#180e08' },
  { primary: 0xa78bfa, secondary: 0x3730a3, accent: 0x818cf8, bg: '#0c0a18' },
  { primary: 0x34d399, secondary: 0x065f46, accent: 0x10b981, bg: '#081410' },
  { primary: 0xfca5a5, secondary: 0x991b1b, accent: 0xf87171, bg: '#180c0c' },
  { primary: 0x93c5fd, secondary: 0x1e3a5f, accent: 0x60a5fa, bg: '#0a1018' },
  { primary: 0xd8b4fe, secondary: 0x581c87, accent: 0xc084fc, bg: '#100818' },
  { primary: 0xfcd34d, secondary: 0x78350f, accent: 0xf59e0b, bg: '#181208' },
  { primary: 0x67e8f9, secondary: 0x155e75, accent: 0x22d3ee, bg: '#081418' },
  { primary: 0xfda4af, secondary: 0x9f1239, accent: 0xfb7185, bg: '#180a0e' },
  { primary: 0x86efac, secondary: 0x166534, accent: 0x4ade80, bg: '#0a1808' },
];

const DEFAULT_COLOR_SCHEME = { primary: 0xffffff, secondary: 0x222222, accent: 0xcccccc, bg: '#0a0c0e' };

const ROUTE_CUBE_ASSIGNMENTS = {
  '/': [0, 1, 2, 3, 4, 5, 6, 7],
  '/experience': [8, 9, 10, 11, 12, 13, 14, 15],
  '/creative': [16, 17, 18, 19, 20, 21, 22, 23],
  '/working-style': [24, 25, 26, 27, 28, 29, 30, 31],
  '/contact': [32, 33, 34, 35, 36, 37, 38, 39]
};

const MOTION_TYPES = ['bouncer', 'swayer', 'pulser', 'jitterer', 'orbiter'];

const VISUAL_PRESETS = {
  radial: {
    name: 'Radial',
    getMotion(d, freq, impact) {
      const clusterPush = freq * 2.0 + impact * 2.5;
      const originPush = (freq * 0.8 + impact * 1.5) * d.normalizedDist;
      const ox = d.clusterDir.x * clusterPush + d.radialDir.x * originPush;
      const oy = d.clusterDir.y * clusterPush + d.radialDir.y * originPush;
      const oz = d.clusterDir.z * clusterPush + d.radialDir.z * originPush;
      return { ox, oy, oz };
    }
  },
  scatter: {
    name: 'Scatter',
    getMotion(d, freq, impact, t) {
      const clusterPush = impact * 2.5;
      const ox = d.clusterDir.x * clusterPush + freq * 1.2 * Math.sin(t * 2.5 + d.pulsePhase);
      const oy = d.clusterDir.y * clusterPush + freq * 1.5 * Math.cos(t * 1.8 + d.pulsePhase * 1.3);
      const oz = d.clusterDir.z * clusterPush + freq * 0.8 * Math.sin(t * 1.5 + d.pulsePhase * 0.7);
      return { ox, oy, oz };
    }
  },
  wave: {
    name: 'Wave',
    getMotion(d, freq, impact, t) {
      const wavePhase = d.basePosition.x * 0.5 + t * 2;
      const clusterPush = impact * 2.0;
      const oy = freq * 2.0 * Math.sin(wavePhase) + d.clusterDir.y * clusterPush;
      const ox = freq * 0.4 * Math.cos(wavePhase * 0.7) + d.clusterDir.x * clusterPush;
      const oz = freq * 0.3 * Math.sin(wavePhase * 1.3) + d.clusterDir.z * clusterPush;
      return { ox, oy, oz };
    }
  },
  pulse: {
    name: 'Pulse',
    getMotion(d, freq, impact) {
      const push = freq * 2.2 + impact * 3.5;
      const ox = d.clusterDir.x * push;
      const oy = d.clusterDir.y * push;
      const oz = d.clusterDir.z * push;
      return { ox, oy, oz };
    }
  },
};

const PRESET_KEYS = Object.keys(VISUAL_PRESETS);

function pickBand(baseY, baseX, maxY, maxX) {
  const ny = (baseY + maxY) / (2 * maxY);
  if (ny < 0.2) return 'subBass';
  if (ny < 0.35) return 'bass';
  if (ny < 0.5) return 'lowMid';
  if (ny < 0.65) return 'mid';
  if (ny < 0.8) return 'highMid';
  return 'treble';
}

export default class CubeGroup {
  constructor(scene, numCubes = 40) {
    this.cubes = [];
    this.songCubes = [];
    this.songOutlines = [];
    this.scene = scene;
    this.NUM_CUBES = numCubes;
    this.currentRoute = '/';
    this.trackIndex = -1;
    this.colorScheme = DEFAULT_COLOR_SCHEME;
    this.targetColorScheme = DEFAULT_COLOR_SCHEME;
    this.colorLerp = 0;
    this.fftData = { subBass: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0, impact: 0, energy: 0 };
    this.smoothImpact = 0;
    this.presetIndex = 0;
    this.preset = VISUAL_PRESETS[PRESET_KEYS[0]];
    this.createCubes();
    this.hoveredCube = null;
    this.hoveredCubeBaseOpacity = 1;
    this.glowMesh = null;
  }

  createCubes() {
    const NUM_CLUSTERS = 8;
    const positions = [];
    for (let i = 0; i < this.NUM_CUBES; i++) {
      let baseX, baseY, baseZ, tries = 0;
      do {
        baseX = (Math.random() - 0.5) * 14;
        baseY = (Math.random() - 0.5) * 10;
        baseZ = (Math.random() - 0.5) * 14;
        tries++;
      } while (
        Math.abs(baseX) < 4.5 && Math.abs(baseY) < 3.3 && Math.abs(baseZ) < 4.5 && tries < 20
      );
      positions.push({ x: baseX, y: baseY, z: baseZ });
    }

    const centers = [];
    for (let c = 0; c < NUM_CLUSTERS; c++) {
      centers.push({ ...positions[Math.floor(Math.random() * positions.length)] });
    }
    const assignments = new Array(this.NUM_CUBES).fill(0);
    for (let iter = 0; iter < 10; iter++) {
      for (let i = 0; i < this.NUM_CUBES; i++) {
        let best = 0, bestDist = Infinity;
        for (let c = 0; c < NUM_CLUSTERS; c++) {
          const dx = positions[i].x - centers[c].x;
          const dy = positions[i].y - centers[c].y;
          const dz = positions[i].z - centers[c].z;
          const d = dx * dx + dy * dy + dz * dz;
          if (d < bestDist) { bestDist = d; best = c; }
        }
        assignments[i] = best;
      }
      for (let c = 0; c < NUM_CLUSTERS; c++) {
        let sx = 0, sy = 0, sz = 0, count = 0;
        for (let i = 0; i < this.NUM_CUBES; i++) {
          if (assignments[i] === c) { sx += positions[i].x; sy += positions[i].y; sz += positions[i].z; count++; }
        }
        if (count > 0) { centers[c].x = sx / count; centers[c].y = sy / count; centers[c].z = sz / count; }
      }
    }

    const clusterProps = centers.map((center, c) => ({
      center,
      motionType: MOTION_TYPES[c % MOTION_TYPES.length],
      band: pickBand(center.y, center.x, 5, 7),
      sensitivity: 0.8 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }));

    for (let i = 0; i < this.NUM_CUBES; i++) {
      const { x: baseX, y: baseY, z: baseZ } = positions[i];
      const cluster = clusterProps[assignments[i]];
      const cc = cluster.center;

      const size = 0.3 + Math.random() * 0.5;
      const geometry = new THREE.BoxGeometry(size, size, size);

      let assignedRoute = '/';
      for (const [route, indices] of Object.entries(ROUTE_CUBE_ASSIGNMENTS)) {
        if (indices.includes(i)) { assignedRoute = route; break; }
      }

      const color = Math.random() > 0.5 ? 0xffffff : 0x222222;
      const material = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 1 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(baseX, baseY, baseZ);

      const distOrigin = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
      const normalizedDist = Math.min(distOrigin / 10, 1);
      const odx = distOrigin > 0.1 ? baseX / distOrigin : 0;
      const ody = distOrigin > 0.1 ? baseY / distOrigin : 0;
      const odz = distOrigin > 0.1 ? baseZ / distOrigin : 0;

      const cdx = baseX - cc.x;
      const cdy = baseY - cc.y;
      const cdz = baseZ - cc.z;
      const cdist = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz) || 0.1;
      const clusterDir = { x: cdx / cdist, y: cdy / cdist, z: cdz / cdist };

      const spinAxis = new THREE.Vector3(
        Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5
      ).normalize();

      cube.userData = {
        basePosition: { x: baseX, y: baseY, z: baseZ },
        pulsePhase: cluster.phase + Math.random() * 0.8,
        idleSpeed: 0.2 + Math.random() * 0.3,
        isLight: color === 0xffffff,
        assignedRoute,
        defaultOpacity: material.opacity,
        hoverLerp: 0,
        hoverScale: 1,
        hoverGlow: 0,
        routeActiveLerp: 0,
        band: cluster.band,
        motionType: cluster.motionType,
        lrBias: baseX / 7,
        normalizedDist,
        radialDir: { x: odx, y: ody, z: odz },
        clusterDir,
        clusterDist: cdist,
        spinAxis,
        sensitivity: cluster.sensitivity + Math.random() * 0.3,
        smoothedFreq: 0,
        peakFreq: 0,
        posOffset: { x: 0, y: 0, z: 0 },
        scaleSmooth: 1,
        _clusterIndex: assignments[i],
        isSongCube: false,
        songTrackIndex: -1,
        songGlow: 0,
      };
      this.scene.add(cube);
      this.cubes.push(cube);
    }

    this._assignSongCubes();
  }

  _assignSongCubes() {
    const NUM_SONGS = TRACK_COLOR_SCHEMES.length;
    this.songCubes = [];
    this.songOutlines = [];

    const eligible = this.cubes
      .map((cube, i) => {
        const p = cube.userData.basePosition;
        const dist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        return { i, dist, p };
      })
      .filter(e => e.dist > 1.5)
      .sort((a, b) => b.dist - a.dist);

    const chosen = [];
    for (let track = 0; track < NUM_SONGS; track++) {
      let bestIdx = -1;
      let bestScore = -Infinity;
      for (const e of eligible) {
        if (chosen.includes(e.i)) continue;
        let minDistToChosen = Infinity;
        for (const ci of chosen) {
          const cp = this.cubes[ci].userData.basePosition;
          const dx = e.p.x - cp.x;
          const dy = e.p.y - cp.y;
          const dz = e.p.z - cp.z;
          minDistToChosen = Math.min(minDistToChosen, Math.sqrt(dx * dx + dy * dy + dz * dz));
        }
        const spreadScore = chosen.length === 0 ? e.dist : Math.min(minDistToChosen, e.dist * 0.5);
        if (spreadScore > bestScore) {
          bestScore = spreadScore;
          bestIdx = e.i;
        }
      }
      if (bestIdx === -1) bestIdx = track % this.cubes.length;
      chosen.push(bestIdx);

      const cube = this.cubes[bestIdx];
      const scheme = TRACK_COLOR_SCHEMES[track % TRACK_COLOR_SCHEMES.length];

      cube.userData.songTrackIndex = track;
      cube.userData.isSongCube = true;
      cube.userData.songGlow = 0;
      cube.userData.songColor = scheme.accent;

      const s = cube.geometry.parameters.width * 1.3;
      cube.geometry.dispose();
      const boxGeo = new THREE.BoxGeometry(s, s, s);
      cube.geometry = boxGeo;

      cube.material.dispose();
      cube.material = new THREE.MeshBasicMaterial({
        color: scheme.accent,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      cube.userData.defaultOpacity = 0.5;
      cube.userData.isLight = true;

      const edgesGeo = new THREE.EdgesGeometry(boxGeo);
      const edgesMat = new THREE.LineBasicMaterial({
        color: scheme.accent,
        transparent: true,
        opacity: 0.2,
      });
      const outline = new THREE.LineSegments(edgesGeo, edgesMat);
      cube.add(outline);
      this.songOutlines.push(outline);

      const hitGeo = new THREE.BoxGeometry(s * 1.5, s * 1.5, s * 1.5);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitGeo, hitMat);
      hitbox.userData._songParent = cube;
      cube.add(hitbox);

      this.songCubes.push(cube);
    }
  }

  getSongCubes() {
    return this.songCubes;
  }

  getSongCubeForTrack(trackIndex) {
    return this.songCubes.find(c => c.userData.songTrackIndex === trackIndex) || null;
  }

  getMeshes() {
    return this.cubes;
  }

  setCurrentRoute(route) {
    this.currentRoute = route;
  }

  setTrackIndex(index) {
    this.trackIndex = index;
    this.targetColorScheme = TRACK_COLOR_SCHEMES[index % TRACK_COLOR_SCHEMES.length];
    this.colorLerp = 0;
  }

  getTrackBackground() {
    return this.targetColorScheme.bg;
  }

  setFFTData(data) {
    this.fftData = data;
  }

  resetToDefault() {
    this.trackIndex = -1;
    this.targetColorScheme = DEFAULT_COLOR_SCHEME;
    this.colorLerp = 0;
  }

  cyclePreset() {
    this.presetIndex = (this.presetIndex + 1) % PRESET_KEYS.length;
    this.preset = VISUAL_PRESETS[PRESET_KEYS[this.presetIndex]];
    return this.preset.name;
  }

  getPresetName() {
    return this.preset.name;
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
        color: this.targetColorScheme.accent,
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
    this.colorLerp = Math.min(1, this.colorLerp + dt * 1.5);

    const fft = this.fftData;
    const impact = fft.impact || 0;
    this.smoothImpact += (impact - this.smoothImpact) * 0.6;
    this.smoothImpact *= 0.85;

    const hasAudio = fft.raw !== null;

    const schemePrimary = new THREE.Color(this.targetColorScheme.primary);
    const schemeSecondary = new THREE.Color(this.targetColorScheme.secondary);
    const schemeAccent = new THREE.Color(this.targetColorScheme.accent);

    this.cubes.forEach((cube) => {
      const d = cube.userData;
      const isRouteActive = d.assignedRoute === this.currentRoute;

      const bandVal = hasAudio ? (fft[d.band] || 0) : 0;
      const targetFreq = bandVal * d.sensitivity;
      const atk = targetFreq > d.smoothedFreq ? 0.5 : 0.07;
      d.smoothedFreq += (targetFreq - d.smoothedFreq) * atk;
      d.peakFreq = Math.max(d.smoothedFreq, d.peakFreq * 0.93);
      const freq = d.smoothedFreq;

      if (cube === this.hoveredCube) {
        d.hoverLerp += (1 - d.hoverLerp) * 0.18;
        d.hoverScale += (1.4 - d.hoverScale) * 0.18;
        d.hoverGlow += (0.4 * this.hoveredCubeBaseOpacity - d.hoverGlow) * 0.18;
      } else {
        d.hoverLerp *= 0.88;
        d.hoverScale += (1 - d.hoverScale) * 0.12;
        d.hoverGlow *= 0.88;
      }

      const targetRouteLerp = isRouteActive ? 1 : 0;
      d.routeActiveLerp += (targetRouteLerp - d.routeActiveLerp) * 0.08;

      const presetMotion = this.preset.getMotion(d, freq, this.smoothImpact, t, dt);

      let personalOX = 0, personalOY = 0, personalOZ = 0;
      const mt = d.motionType;
      const ph = d.pulsePhase;
      const cd = d.clusterDir;
      if (mt === 'bouncer') {
        const bounce = freq * 1.2 * Math.abs(Math.sin(t * 4 + ph));
        personalOX = cd.x * bounce;
        personalOY = cd.y * bounce;
        personalOZ = cd.z * bounce;
      } else if (mt === 'swayer') {
        const sway = freq * 0.9 * Math.sin(t * 2.5 + ph);
        personalOX = cd.x * sway + freq * 0.3 * Math.cos(t * 2 + ph);
        personalOY = cd.y * sway;
        personalOZ = cd.z * sway + freq * 0.2 * Math.sin(t * 2 + ph);
      } else if (mt === 'pulser') {
        // pulser moves via scale, not position
      } else if (mt === 'jitterer') {
        const jit = freq * 0.5;
        personalOX = cd.x * jit * 0.5 + (Math.random() - 0.5) * jit * 0.4;
        personalOY = cd.y * jit * 0.5 + (Math.random() - 0.5) * jit * 0.4;
        personalOZ = cd.z * jit * 0.5 + (Math.random() - 0.5) * jit * 0.3;
      } else if (mt === 'orbiter') {
        const r = freq * 0.6;
        personalOX = cd.x * r * 0.3 + Math.cos(t * 3 + ph) * r;
        personalOY = cd.y * r * 0.3 + Math.sin(t * 2 + ph) * r * 0.5;
        personalOZ = cd.z * r * 0.3 + Math.sin(t * 2.5 + ph * 1.3) * r * 0.4;
      }

      const idleX = Math.sin(t * d.idleSpeed * 0.4 + ph) * 0.05;
      const idleY = Math.sin(t * d.idleSpeed + ph) * 0.08;
      const idleZ = Math.cos(t * d.idleSpeed * 0.3 + ph * 1.5) * 0.04;

      const targetX = presetMotion.ox + personalOX + idleX;
      const targetY = presetMotion.oy + personalOY + idleY;
      const targetZ = presetMotion.oz + personalOZ + idleZ;

      d.posOffset.x += (targetX - d.posOffset.x) * 0.18;
      d.posOffset.y += (targetY - d.posOffset.y) * 0.18;
      d.posOffset.z += (targetZ - d.posOffset.z) * 0.18;

      cube.position.x = d.basePosition.x + d.posOffset.x;
      cube.position.y = d.basePosition.y + d.posOffset.y;
      cube.position.z = d.basePosition.z + d.posOffset.z;

      const pulserBonus = mt === 'pulser' ? freq * 0.6 : 0;
      const targetScale = 1 + freq * 0.35 + this.smoothImpact * 0.5 + pulserBonus;
      d.scaleSmooth += (targetScale - d.scaleSmooth) * 0.2;
      const routePulse = isRouteActive ? 1 + 0.05 * Math.sin(t * 2 + ph) : 1;
      const s = d.scaleSmooth * routePulse * d.hoverScale;
      cube.scale.set(s, s, s);

      const isActiveSong = d.isSongCube && d.songTrackIndex === this.trackIndex;
      const isSong = d.isSongCube;
      const isHovered = cube === this.hoveredCube;

      const baseOpacity = d.defaultOpacity;
      const routeBoost = isRouteActive ? 0.25 : 0;
      const freqGlow = d.peakFreq * 0.55;
      const impactGlow = this.smoothImpact * 0.35;
      const hoverOpacity = isHovered ? d.hoverGlow : 0;
      const activeBoost = isActiveSong ? 0.2 + 0.08 * Math.sin(t * 2 + ph) : 0;
      cube.material.opacity = Math.min(1, baseOpacity * 0.4 + routeBoost * d.routeActiveLerp + freqGlow + impactGlow + hoverOpacity + activeBoost);

      if (isSong) {
        const songBase = new THREE.Color(d.songColor);
        const currentColor = cube.material.color.clone();
        currentColor.lerp(songBase, 0.08);
        const colorIntensity = Math.max(freq, this.smoothImpact);
        if (colorIntensity > 0.1) {
          currentColor.lerp(new THREE.Color(0xffffff), colorIntensity * 0.3);
        }
        if (isHovered) {
          currentColor.lerp(new THREE.Color(0xffffff), d.hoverLerp * 0.5);
        }
        cube.material.color.copy(currentColor);

        const outline = cube.children[0];
        if (outline && outline.material) {
          outline.material.opacity = isActiveSong ? 0.5 + 0.15 * Math.sin(t * 3)
            : isHovered ? 0.4 * d.hoverLerp : 0.2;
          outline.material.color.copy(currentColor);
        }
      } else {
        const targetBase = d.isLight ? schemePrimary.clone() : schemeSecondary.clone();
        const currentColor = cube.material.color.clone();
        currentColor.lerp(targetBase, this.colorLerp * 0.06);
        const colorIntensity = Math.max(freq, this.smoothImpact);
        if (colorIntensity > 0.05) {
          currentColor.lerp(schemeAccent, Math.min(1, (colorIntensity - 0.05) * 1.1));
        }
        cube.material.color.copy(currentColor);
      }

      if (isSong) {
        if (isActiveSong) {
          cube.scale.multiplyScalar(1 + 0.04 * Math.sin(t * 3 + ph));
        }
      }

      if (isHovered && isSong) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.04 * dt * 60);
        cube.quaternion.multiply(q);
      } else {
        const spinStr = freq * 0.08 + this.smoothImpact * 0.04 + 0.002;
        const q = new THREE.Quaternion().setFromAxisAngle(d.spinAxis, spinStr * dt * 60);
        cube.quaternion.multiply(q);
      }

      if (isHovered && isSong && this.glowMesh) {
        this.glowMesh.position.copy(cube.position);
        this.glowMesh.quaternion.copy(cube.quaternion);
        this.glowMesh.scale.copy(cube.scale).multiplyScalar(1.4 + this.smoothImpact * 0.3);
        this.glowMesh.material.opacity = 0.3 * d.hoverLerp;
      } else if (this.glowMesh) {
        this.glowMesh.material.opacity = 0;
      }
    });
  }

  dispose() {
    this.cubes.forEach(cube => {
      cube.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      this.scene.remove(cube);
      cube.geometry.dispose();
      cube.material.dispose();
    });
    this.cubes = [];
    this.songCubes = [];
    this.songOutlines = [];
    if (this.glowMesh) {
      this.scene.remove(this.glowMesh);
      this.glowMesh.geometry.dispose();
      this.glowMesh.material.dispose();
      this.glowMesh = null;
    }
  }
}
