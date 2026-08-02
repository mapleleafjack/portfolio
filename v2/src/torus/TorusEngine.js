// ──────────────────────────────────────────────────────────
// TorusEngine — self-contained Three.js torus knot renderer
// No React / framework dependencies.  Just a canvas + container.
// ──────────────────────────────────────────────────────────

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ── Default state ──────────────────────────────────────
const DEFAULT_STATE = {
  p: 2, q: 3,
  radius: 2.5, tube: 0.7,
  tubularSegments: 200, radialSegments: 24,
  spinSpeed: 0,
  color: '#9944dd',
  metalness: 0.15, roughness: 0.5,
  showWireframe: true,
  showFieldLines: true,
  showLattice: true,
  fieldLineCount: 20,
  particleSpeed: 0.7,
  morphValue: 0,
  morphPresets: [
    { p: 2, q: 3 }, { p: 3, q: 4 }, { p: 3, q: 5 },
    { p: 4, q: 5 }, { p: 5, q: 3 }, { p: 5, q: 4 },
    { p: 7, q: 3 }, { p: 7, q: 4 },
  ],
};

// ── Scientific presets ─────────────────────────────────
const PRESETS = [
  {
    id: 'dna', name: '🧬 DNA Supercoiling', short: 'DNA',
    subtitle: 'Trefoil Knot (2,3) — simplest non-trivial knot',
    desc: 'DNA molecules form trefoil knots during replication and transcription. Enzymes called <em>topoisomerases</em> resolve these knots — without them, cells would die. The (2,3) torus knot is the fundamental building block of knot theory.',
    params: { p: 2, q: 3, radius: 2.5, tube: 0.45, spinSpeed: 0, color: '#44aadd', metalness: 0.1, roughness: 0.4, fieldLineCount: 18, particleSpeed: 0.5 },
    realWorld: 'Molecular biology — DNA topology & enzymatic unknotting',
    legend: [
      { dot: '#5599dd', label: 'Poloidal rings — magnetic flux encircling the DNA strand' },
      { dot: '#ff8844', label: 'Toroidal flow — enzymatic tracking along the helix' },
    ],
  },
  {
    id: 'tokamak', name: '🔥 Tokamak Fusion', short: 'Fusion',
    subtitle: 'Magnetic Confinement — twisted fields trap plasma',
    desc: 'Fusion reactors (like <strong>ITER</strong>) use helical magnetic fields to confine 150-million-degree plasma in a toroidal chamber. The <em>poloidal</em> field prevents drift; the <em>toroidal</em> field guides particles. Without the twist, plasma escapes.',
    params: { p: 1, q: 3, radius: 2.8, tube: 0.55, spinSpeed: 0, color: '#ff6622', metalness: 0.3, roughness: 0.3, fieldLineCount: 30, particleSpeed: 0.9 },
    realWorld: 'ITER (France), JET (UK) — nuclear fusion energy research',
    legend: [
      { dot: '#5599dd', label: 'Poloidal field — confines plasma radially' },
      { dot: '#ff8844', label: 'Toroidal field — guides plasma around chamber' },
    ],
  },
  {
    id: 'solar', name: '☀️ Solar Corona Loops', short: 'Sun',
    subtitle: 'Magnetic Flux Tubes — braided by convection',
    desc: 'The Sun\'s corona glows with plasma loops tracing twisted magnetic fields. Convective motions at the surface braid these flux tubes into complex knots. When they snap (<em>magnetic reconnection</em>), solar flares erupt.',
    params: { p: 3, q: 4, radius: 2.5, tube: 0.4, spinSpeed: 0, color: '#ffaa22', metalness: 0.05, roughness: 0.5, fieldLineCount: 24, particleSpeed: 0.6 },
    realWorld: 'Solar Dynamics Observatory — coronal magnetic topology',
    legend: [
      { dot: '#5599dd', label: 'Poloidal rings — flux tube cross-sections' },
      { dot: '#ff8844', label: 'Toroidal flow — plasma motion along loops' },
    ],
  },
  {
    id: 'vortex', name: '💨 Vortex Ring', short: 'Vortex',
    subtitle: 'Smoke Ring / Toroidal Vortex — fluid rotation',
    desc: 'A vortex ring is a torus of rotating fluid. Dolphins blow bubble rings, volcanoes erupt smoke rings, and your heart pumps blood through vortex rings in the left ventricle. The fluid circulates <em>poloidally</em> through the center and back around.',
    params: { p: 1, q: 2, radius: 2.5, tube: 0.7, spinSpeed: 0, color: '#aaccff', metalness: 0.08, roughness: 0.6, fieldLineCount: 14, particleSpeed: 1.0 },
    realWorld: 'Fluid dynamics — vortex motion, heart hemodynamics',
    legend: [
      { dot: '#5599dd', label: 'Poloidal flow — fluid circulating through ring' },
      { dot: '#ff8844', label: 'Toroidal flow — rotation around the ring' },
    ],
  },
  {
    id: 'emknot', name: '🧲 Knotted Light', short: 'EM Knot',
    subtitle: 'Electromagnetic Knots — Maxwell\'s equations',
    desc: 'In 2013, physicists proved Maxwell\'s equations admit solutions where electric & magnetic field lines form <em>torus knots</em>. These "knotted light" pulses were created in 2018 using structured laser beams — light itself can be tied in knots.',
    params: { p: 5, q: 3, radius: 2.5, tube: 0.32, spinSpeed: 0, color: '#9944ee', metalness: 0.2, roughness: 0.35, fieldLineCount: 22, particleSpeed: 0.5 },
    realWorld: 'Theoretical physics — topological electrodynamics (2013–2018)',
    legend: [
      { dot: '#5599dd', label: 'Poloidal rings — magnetic field lines' },
      { dot: '#ff8844', label: 'Toroidal lines — electric field lines' },
    ],
  },
  {
    id: 'galaxy', name: '🌌 Galactic Magnetism', short: 'Galaxy',
    subtitle: 'Cosmic Flux — magnetic fields at parsec scale',
    desc: 'Spiral galaxies host large-scale magnetic fields twisted by differential rotation. These fields form helical structures that channel cosmic rays and regulate star formation. The topology mirrors torus knot geometry at galactic scales.',
    params: { p: 2, q: 5, radius: 3.0, tube: 0.28, spinSpeed: 0, color: '#8844cc', metalness: 0.12, roughness: 0.45, fieldLineCount: 16, particleSpeed: 0.3 },
    realWorld: 'Astrophysics — galactic dynamo theory, magnetohydrodynamics',
    legend: [
      { dot: '#5599dd', label: 'Poloidal rings — galactic magnetic loops' },
      { dot: '#ff8844', label: 'Toroidal flow — differential rotation of gas' },
    ],
  },
];

// ── CSS (injected once) ────────────────────────────────
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .te-root { --te-accent: #b388ff; --te-accent2: #ff6eb4; }
    .te-root * { margin:0; padding:0; box-sizing:border-box; }
    .te-root { font-family:system-ui,-apple-system,sans-serif; color:#c8c8d4; user-select:none; -webkit-user-select:none; }

    .te-hint {
      position:fixed; top:12px; left:50%; transform:translateX(-50%);
      font-size:10px; color:rgba(255,255,255,0.22); letter-spacing:0.04em;
      pointer-events:none; z-index:5; transition:opacity 0.3s;
    }

    .te-panel {
      position:fixed; bottom:0; left:50%; transform:translateX(-50%);
      background:rgba(5,3,14,0.93); border-top:1px solid rgba(255,255,255,0.06);
      border-radius:12px 12px 0 0; padding:5px 20px 5px; z-index:20;
      backdrop-filter:blur(24px); display:flex; flex-direction:column; gap:2px;
      transition:padding 0.25s; max-width:max-content;
    }
    .te-panel.collapsed { padding:5px 20px 5px; }
    .te-panel.collapsed .te-section-label,
    .te-panel.collapsed .te-controls-grid,
    .te-panel.collapsed .te-reset-btn { display:none; }

    .te-panel-toggle {
      background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
      color:rgba(255,255,255,0.5); border-radius:16px; cursor:pointer;
      font-size:11px; padding:4px 14px; line-height:1.3; transition:all 0.2s;
      flex-shrink:0; margin-left:6px; white-space:nowrap;
    }
    .te-panel-toggle:hover { background:rgba(255,255,255,0.14); color:#fff; }
    .te-panel.collapsed .te-presets-row { cursor:pointer; }

    .te-section-label { font-size:8px; text-transform:uppercase; letter-spacing:0.14em; color:rgba(255,255,255,0.16); padding:0; line-height:1; margin-top:2px; }
    .te-controls-grid { display:flex; flex-wrap:wrap; gap:4px 16px; align-items:flex-end; }
    .te-control-group { display:flex; flex-direction:column; gap:1px; min-width:80px; max-width:130px; flex:1 0 auto; }
    .te-control-group label { font-size:10px; letter-spacing:0.04em; color:rgba(255,255,255,0.4); white-space:nowrap; }
    .te-control-group input[type="range"] { -webkit-appearance:none; width:100%; height:4px; background:rgba(255,255,255,0.07); border-radius:2px; outline:none; cursor:pointer; }
    .te-control-group input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:13px; height:13px; border-radius:50%; background:var(--te-accent); cursor:pointer; border:2px solid rgba(255,255,255,0.2); }
    .te-control-group input[type="color"] { -webkit-appearance:none; width:100%; height:20px; border:1px solid rgba(255,255,255,0.08); border-radius:4px; cursor:pointer; background:transparent; padding:0; }
    .te-control-group .te-val { font-size:9px; color:rgba(255,255,255,0.4); font-variant-numeric:tabular-nums; font-family:'SF Mono','Fira Code',monospace; }
    .te-morph-group { min-width:150px!important; max-width:200px!important; }
    .te-morph-group label { color:var(--te-accent2); font-weight:600; }
    .te-morph-group .te-val { color:var(--te-accent2); }

    .te-presets-row { display:flex; flex-wrap:nowrap; gap:5px; align-items:center; overflow-x:auto; padding-bottom:2px; }
    .te-presets-row::-webkit-scrollbar { height:2px; }
    .te-presets-row::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
    .te-preset-pill { background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.5); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:4px 12px; cursor:pointer; font-size:10.5px; white-space:nowrap; transition:all 0.2s; flex-shrink:0; }
    .te-preset-pill:hover { background:rgba(255,255,255,0.1); color:#fff; }
    .te-preset-pill.active { background:var(--te-accent); color:#fff; border-color:var(--te-accent); box-shadow:0 0 12px rgba(179,136,255,0.25); }

    .te-reset-btn { background:rgba(255,255,255,0.06); align-self:flex-end; color:#fff; border:none; padding:5px 12px; border-radius:6px; cursor:pointer; font-size:10.5px; font-weight:600; letter-spacing:0.03em; }
    .te-reset-btn:hover { background:rgba(255,255,255,0.14); }

    .te-toggle-row { display:flex; align-items:center; gap:5px; font-size:10px; color:rgba(255,255,255,0.4); }
    .te-toggle-row input[type="checkbox"] { accent-color:var(--te-accent); width:13px; height:13px; }

    .te-info-overlay {
      position:fixed; top:12px; right:12px; z-index:15; width:340px;
      max-height:calc(100vh - 180px); background:rgba(7,4,18,0.94);
      border:1px solid rgba(255,255,255,0.06); border-radius:14px;
      padding:20px 20px 16px; overflow-y:auto; backdrop-filter:blur(24px);
      color:#c8c8d4; font-size:11.5px; line-height:1.6;
    }
    .te-info-overlay.hidden { display:none; }
    .te-info-reopen {
      position:fixed; top:12px; right:12px; z-index:14; width:28px; height:28px;
      border-radius:50%; background:rgba(255,255,255,0.06);
      border:1px solid rgba(255,255,255,0.08); color:rgba(255,255,255,0.45);
      font-size:14px; cursor:pointer; display:none; align-items:center;
      justify-content:center; backdrop-filter:blur(8px); transition:all 0.2s;
    }
    .te-info-reopen.visible { display:flex; }
    .te-info-reopen:hover { background:rgba(255,255,255,0.14); color:#fff; }
    .te-info-close { position:absolute; top:8px; right:10px; background:none; border:none; color:rgba(255,255,255,0.3); font-size:18px; cursor:pointer; padding:4px 8px; border-radius:4px; }
    .te-info-close:hover { color:#fff; background:rgba(255,255,255,0.06); }
    .te-info-overlay h3 { font-size:15px; margin:0 28px 2px 0; color:#fff; font-weight:700; }
    .te-info-overlay h4 { font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--te-accent); margin:16px 0 4px; }
    .te-info-overlay .te-subtitle { font-size:10.5px; color:rgba(255,255,255,0.3); margin-bottom:12px; }
    .te-info-overlay p { margin:0 0 8px; font-size:11px; color:rgba(255,255,255,0.55); }
    .te-why-box { background:rgba(179,136,255,0.05); border-left:2px solid var(--te-accent); padding:10px 12px; margin:10px 0; border-radius:0 8px 8px 0; font-size:10.5px; color:rgba(255,255,255,0.5); line-height:1.55; }
    .te-why-box strong { color:rgba(255,255,255,0.7); }
    .te-param-row { display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.03); font-size:10.5px; }
    .te-param-row .te-key { color:rgba(255,255,255,0.35); }
    .te-param-row .te-val { color:var(--te-accent); font-family:'SF Mono',monospace; font-size:10px; }
    .te-legend-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; }
    .te-legend-item { margin:5px 0; font-size:10.5px; line-height:1.45; padding-left:4px; }
    .te-legend-item .te-label { color:rgba(255,255,255,0.6); }
    .te-legend-item .te-why { color:rgba(255,255,255,0.3); font-size:9.5px; display:block; margin-left:16px; }
    .te-real-world { margin-top:10px; padding:8px 10px; background:rgba(255,255,255,0.025); border-radius:8px; font-size:10px; color:rgba(255,255,255,0.4); line-height:1.5; }
    .te-real-world strong { color:var(--te-accent2); }

    @media (max-width:768px) {
      .te-info-overlay { width:260px; right:4px; top:4px; max-height:45vh; font-size:10px; }
      .te-panel { padding:6px 10px 10px; }
      .te-control-group { min-width:60px; max-width:95px; }
      .te-preset-pill { font-size:9px; padding:3px 8px; }
    }
  `;
  document.head.appendChild(style);
}

// ──────────────────────────────────────────────────────────
//  ENGINE  (closure-based — returns control API)
// ──────────────────────────────────────────────────────────

export function createTorusEngine(canvas, container, options = {}) {
  const {
    initialParams = {},
    onStateChange = () => {},
    darkBackground = true,
  } = options;

  // Inject CSS once
  injectStyles();

  // ── State ────────────────────────────────────────────
  const state = { ...DEFAULT_STATE, ...initialParams };
  // Ensure morphPresets is always the default array
  state.morphPresets = DEFAULT_STATE.morphPresets;

  const markerState = { t: 0, s: Math.PI / 2, worldPos: new THREE.Vector3(), worldNormal: new THREE.Vector3() };
  let activePreset = -1;
  let controlsCollapsed = true;
  let disposed = false;

  // ── Notify parent of state changes ────────────────────
  function notifyState() {
    const { morphPresets, ...rest } = state; // don't leak the full presets array
    onStateChange({ ...rest });
  }

  // ── DOM elements (created inside container) ───────────
  container.classList.add('te-root');

  // Hint
  const hintEl = document.createElement('div');
  hintEl.className = 'te-hint';
  hintEl.textContent = '🖱 Drag the glowing marker on the torus  ·  Scroll to zoom  ·  Right-drag to pan';
  container.appendChild(hintEl);

  // Info overlay
  const infoOverlayEl = document.createElement('div');
  infoOverlayEl.className = 'te-info-overlay';
  const infoCloseBtn = document.createElement('button');
  infoCloseBtn.className = 'te-info-close';
  infoCloseBtn.textContent = '×';
  infoCloseBtn.title = 'Hide info';
  const infoContentEl = document.createElement('div');
  infoOverlayEl.appendChild(infoCloseBtn);
  infoOverlayEl.appendChild(infoContentEl);
  container.appendChild(infoOverlayEl);

  // Info reopen button
  const infoReopenBtn = document.createElement('button');
  infoReopenBtn.className = 'te-info-reopen';
  infoReopenBtn.title = 'Show info';
  infoReopenBtn.textContent = 'ℹ';
  container.appendChild(infoReopenBtn);

  infoCloseBtn.addEventListener('click', () => {
    infoOverlayEl.classList.add('hidden');
    infoReopenBtn.classList.add('visible');
  });
  infoReopenBtn.addEventListener('click', () => {
    infoOverlayEl.classList.remove('hidden');
    infoReopenBtn.classList.remove('visible');
    updateInfoOverlay();
  });

  // Controls panel
  const panelEl = document.createElement('div');
  panelEl.className = 'te-panel';
  container.appendChild(panelEl);

  // ── Renderer ─────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  // ── Scene ────────────────────────────────────────────
  const scene = new THREE.Scene();
  const bgColor = darkBackground ? '#060012' : '#060012';
  scene.background = new THREE.Color(bgColor);
  scene.fog = new THREE.FogExp2('#0a001a', 0.00025);

  const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 80);
  camera.position.set(5.5, 3.2, 6.5);
  camera.lookAt(0, 0, 0);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.06;
  orbit.target.set(0, 0, 0);
  orbit.minDistance = 2;
  orbit.maxDistance = 18;
  orbit.update();

  // ── Lighting ─────────────────────────────────────────
  scene.add(new THREE.AmbientLight('#2a1a44', 1.5));
  const keyLight = new THREE.DirectionalLight('#ffffff', 2.5);
  keyLight.position.set(6, 8, 5);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight('#6644aa', 1.8);
  rimLight.position.set(-3, -1, -4);
  scene.add(rimLight);
  const fillLight = new THREE.PointLight('#442288', 8, 15);
  fillLight.position.set(0, 0, 0);
  scene.add(fillLight);
  const topLight = new THREE.PointLight('#8844cc', 6, 12);
  topLight.position.set(0, 5, 0);
  scene.add(topLight);

  // ── Starfield ────────────────────────────────────────
  const starsGeo = new THREE.BufferGeometry();
  const NSTARS = 800;
  const starPos = new Float32Array(NSTARS * 3);
  const starCol = new Float32Array(NSTARS * 3);
  for (let i = 0; i < NSTARS; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 12 + Math.random() * 22;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
    const c = new THREE.Color().setHSL(0.65 + Math.random() * 0.35, 0.4, 0.7 + Math.random() * 0.3);
    starCol[i * 3] = c.r; starCol[i * 3 + 1] = c.g; starCol[i * 3 + 2] = c.b;
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starsGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
  const starsMat = new THREE.PointsMaterial({
    size: 0.04, vertexColors: true, blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true, opacity: 0.7,
  });
  const stars = new THREE.Points(starsGeo, starsMat);
  scene.add(stars);

  // ── Torus Group ──────────────────────────────────────
  const torusGroup = new THREE.Group();
  scene.add(torusGroup);

  let torusSolid = null;
  let torusWireframe = null;
  const latticeGroup = new THREE.Group();
  torusGroup.add(latticeGroup);
  const fieldGroup = new THREE.Group();
  torusGroup.add(fieldGroup);

  // ── Glow texture helper ──────────────────────────────
  function createGlowTexture(colorHex, size) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, colorHex);
    g.addColorStop(0.15, colorHex);
    g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  // ── Knot curve math ─────────────────────────────────
  function knotCurvePoint(t, p, q, R, r) {
    const x = (R + r * Math.cos(q * t)) * Math.cos(p * t);
    const y = (R + r * Math.cos(q * t)) * Math.sin(p * t);
    const z = r * Math.sin(q * t);
    return new THREE.Vector3(x, y, z);
  }

  function surfacePoint(t, s) {
    const { p, q, radius: R, tube: r } = state;
    const eps = 0.0001;
    const c0 = knotCurvePoint(t, p, q, R, r);
    const c1 = knotCurvePoint(t + eps, p, q, R, r);
    const T = c1.clone().sub(c0).normalize();
    const up = new THREE.Vector3(0, 0, 1);
    let N = new THREE.Vector3().crossVectors(T, up).normalize();
    if (N.length() < 0.1) N = new THREE.Vector3().crossVectors(T, new THREE.Vector3(0, 1, 0)).normalize();
    const B = new THREE.Vector3().crossVectors(T, N).normalize();
    return new THREE.Vector3(c0.x, c0.y, c0.z)
      .add(N.clone().multiplyScalar(r * Math.cos(s)))
      .add(B.clone().multiplyScalar(r * Math.sin(s)));
  }

  function surfaceNormal(t, s) {
    const eps = 0.0001;
    const p0 = surfacePoint(t, s);
    const p1 = surfacePoint(t + eps, s);
    const p2 = surfacePoint(t, s + eps);
    const n = new THREE.Vector3().crossVectors(
      p1.clone().sub(p0), p2.clone().sub(p0),
    ).normalize();
    if (n.dot(p0.clone().normalize().multiplyScalar(-1)) < 0) n.negate();
    return n;
  }

  // ── Knot samples (for field lines) ──────────────────
  const N_SAMPLES = 400;
  let knotSamples = [], knotArcLength = 0, knotCumLengths = [];

  function sampleKnot() {
    const { p, q, radius: R, tube: r } = state;
    knotSamples = []; knotCumLengths = []; knotArcLength = 0;
    const eps = 0.0001;
    for (let i = 0; i < N_SAMPLES; i++) {
      const t = (i / N_SAMPLES) * Math.PI * 2;
      const pt = knotCurvePoint(t, p, q, R, r);
      const ptF = knotCurvePoint(t + eps, p, q, R, r);
      const T = ptF.clone().sub(pt).normalize();
      const up = new THREE.Vector3(0, 0, 1);
      let N = new THREE.Vector3().crossVectors(T, up).normalize();
      if (N.length() < 0.1) N = new THREE.Vector3().crossVectors(T, new THREE.Vector3(0, 1, 0)).normalize();
      const B = new THREE.Vector3().crossVectors(T, N).normalize();
      knotSamples.push({ point: pt.clone(), tangent: T, normal: N, binormal: B });
      if (i > 0) knotArcLength += pt.distanceTo(knotSamples[i - 1].point);
      knotCumLengths.push(knotArcLength);
    }
  }

  function getFrame(u) {
    if (!knotSamples.length) return null;
    const target = u * knotArcLength;
    let lo = 0, hi = knotCumLengths.length - 1;
    while (lo < hi - 1) { const m = (lo + hi) >> 1; if (knotCumLengths[m] < target) lo = m; else hi = m; }
    const seg = knotCumLengths[hi] - knotCumLengths[lo];
    const f = seg > 0 ? (target - knotCumLengths[lo]) / seg : 0;
    const a = knotSamples[lo], b = knotSamples[hi];
    return {
      point: new THREE.Vector3().lerpVectors(a.point, b.point, f),
      tangent: new THREE.Vector3().lerpVectors(a.tangent, b.tangent, f).normalize(),
      normal: new THREE.Vector3().lerpVectors(a.normal, b.normal, f).normalize(),
      binormal: new THREE.Vector3().lerpVectors(a.binormal, b.binormal, f).normalize(),
    };
  }

  // ── Curvature computation ────────────────────────────
  let curvatureSamples = [];
  function computeCurvatureSamples() {
    curvatureSamples = [];
    const { p, q, radius: R, tube: r } = state;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const cq = Math.cos(q * t), sq = Math.sin(q * t);
      const cp = Math.cos(p * t), sp = Math.sin(p * t);
      const Rr = R + r * cq;
      const dx = -p * Rr * sp - r * q * sq * cp;
      const dy = p * Rr * cp - r * q * sq * sp;
      const dz = r * q * cq;
      const ddx = -p * p * Rr * cp + 2 * p * r * q * sq * sp - r * q * q * cq * cp;
      const ddy = -p * p * Rr * sp - 2 * p * r * q * sq * cp - r * q * q * cq * sp;
      const ddz = -r * q * q * sq;
      const cx = dy * ddz - dz * ddy;
      const cy = dz * ddx - dx * ddz;
      const cz = dx * ddy - dy * ddx;
      const crossMag = Math.sqrt(cx * cx + cy * cy + cz * cz);
      const speed = Math.sqrt(dx * dx + dy * dy + dz * dz);
      curvatureSamples.push(crossMag / (speed * speed * speed));
    }
  }

  // ── Build Torus Knot geometry ────────────────────────
  function buildGeo() {
    const { radius, tube, tubularSegments, radialSegments, p, q } = state;
    return new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, Math.round(p), Math.round(q));
  }

  // ── Rebuild torus ────────────────────────────────────
  function rebuildTorus() {
    if (torusSolid) {
      torusGroup.remove(torusSolid);
      torusSolid.geometry?.dispose();
      torusSolid.material?.dispose();
      torusSolid = null;
    }
    if (torusWireframe) {
      torusGroup.remove(torusWireframe);
      torusWireframe.geometry?.dispose();
      torusWireframe.material?.dispose();
      torusWireframe = null;
    }
    while (latticeGroup.children.length) {
      const c = latticeGroup.children[0];
      latticeGroup.remove(c);
      c.geometry?.dispose();
      c.material?.dispose();
    }

    computeCurvatureSamples();
    const geo = buildGeo();

    // Curvature vertex coloring
    const posAttr = geo.attributes.position;
    const vertexCount = posAttr.count;
    const vColors = new Float32Array(vertexCount * 3);
    const TS = state.tubularSegments;
    const RS = state.radialSegments;
    const rows = TS + 1, cols = RS + 1;
    const baseColor = new THREE.Color(state.color);

    let minK = Infinity, maxK = -Infinity;
    for (let i = 0; i < curvatureSamples.length; i++) {
      if (curvatureSamples[i] < minK) minK = curvatureSamples[i];
      if (curvatureSamples[i] > maxK) maxK = curvatureSamples[i];
    }

    for (let vi = 0; vi < vertexCount && vi < rows * cols; vi++) {
      const ti = Math.floor(vi / cols);
      const sj = vi % cols;
      const tFrac = ti / TS;
      const kIdx = Math.min(Math.floor(tFrac * curvatureSamples.length), curvatureSamples.length - 1);
      const kappa = curvatureSamples[kIdx];
      const theta = sj / RS * Math.PI * 2;
      const cosTheta = Math.cos(theta);
      const denom = state.tube * (1 - state.tube * kappa * cosTheta);
      const K = -kappa * cosTheta / Math.max(Math.abs(denom), 0.001);
      const tVal = Math.max(0, Math.min(1, (K + 3) / 6));
      const warmColor = new THREE.Color().setHSL(0.08 + tVal * 0.55, 0.75, 0.3 + tVal * 0.4);
      const blend = warmColor.clone().lerp(baseColor, 0.45);
      vColors[vi * 3] = blend.r;
      vColors[vi * 3 + 1] = blend.g;
      vColors[vi * 3 + 2] = blend.b;
    }
    for (let vi = rows * cols; vi < vertexCount; vi++) {
      vColors[vi * 3] = baseColor.r;
      vColors[vi * 3 + 1] = baseColor.g;
      vColors[vi * 3 + 2] = baseColor.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(vColors, 3));

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      vertexColors: true,
      metalness: state.metalness, roughness: state.roughness,
      transparent: true, opacity: 0.55,
    });
    torusSolid = new THREE.Mesh(geo, mat);
    torusGroup.add(torusSolid);

    if (state.showWireframe) {
      const wfGeo = buildGeo();
      const wfMat = new THREE.MeshBasicMaterial({
        color: '#ccaaff', wireframe: true, transparent: true,
        opacity: 0.13, depthWrite: false,
      });
      torusWireframe = new THREE.Mesh(wfGeo, wfMat);
      torusGroup.add(torusWireframe);
    }

    if (state.showLattice) {
      const layers = [
        { factor: 0.28, color: '#ffffff', opacity: 0.75 },
        { factor: 0.45, color: '#bbddff', opacity: 0.50 },
        { factor: 0.62, color: '#eeaacc', opacity: 0.38 },
        { factor: 0.78, color: '#99bbff', opacity: 0.28 },
        { factor: 0.94, color: '#cc99ee', opacity: 0.18 },
        { factor: 1.10, color: '#8866cc', opacity: 0.10 },
      ];
      const segsT = Math.max(100, state.tubularSegments);
      const segsR = Math.max(16, state.radialSegments);
      const pInt = Math.round(state.p), qInt = Math.round(state.q);
      layers.forEach(l => {
        const lGeo = new THREE.TorusKnotGeometry(
          state.radius, state.tube * l.factor, segsT, segsR, pInt, qInt,
        );
        const lMat = new THREE.MeshBasicMaterial({
          color: l.color, wireframe: true, transparent: true,
          opacity: l.opacity, depthWrite: false,
        });
        latticeGroup.add(new THREE.Mesh(lGeo, lMat));
      });
    }

    sampleKnot();
    rebuildFieldLines();
    rebuildDirectionIndicators();

    const discScale = (state.tube * 1.18) / 0.826;
    crossSectionGroup.scale.setScalar(discScale);
  }

  // ── Field Lines ─────────────────────────────────────
  function rebuildFieldLines() {
    while (fieldGroup.children.length) {
      const c = fieldGroup.children[0];
      c.geometry?.dispose(); c.material?.dispose();
      fieldGroup.remove(c);
    }
    if (!state.showFieldLines) return;
    sampleKnot();
    const count = state.fieldLineCount;

    const rings = Math.min(count, 24);
    for (let i = 0; i < rings; i++) {
      const u = i / rings;
      const pts = [];
      const N = 120;
      for (let j = 0; j <= N; j++) {
        const s = (j / N) * Math.PI * 2;
        const f = getFrame(u);
        if (!f) continue;
        const { point, normal, binormal } = f;
        const rr = state.tube * 0.82;
        pts.push(point.clone()
          .add(normal.clone().multiplyScalar(rr * Math.cos(s)))
          .add(binormal.clone().multiplyScalar(rr * Math.sin(s))));
      }
      if (pts.length < 2) continue;
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: '#5599dd', transparent: true, opacity: 0.3, depthWrite: false,
      });
      fieldGroup.add(new THREE.Line(geo, mat));
    }

    const tlines = Math.min(Math.floor(count * 0.5), 10);
    for (let i = 0; i < tlines; i++) {
      const angle = (i / tlines) * Math.PI * 2;
      const pts = [];
      const N = 300;
      for (let j = 0; j <= N; j++) {
        const u = j / N;
        const f = getFrame(u);
        if (!f) continue;
        const { point, normal, binormal } = f;
        const rr = state.tube * 0.45;
        pts.push(point.clone()
          .add(normal.clone().multiplyScalar(rr * Math.cos(angle)))
          .add(binormal.clone().multiplyScalar(rr * Math.sin(angle))));
      }
      if (pts.length < 2) continue;
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: '#ff8844', transparent: true, opacity: 0.35, depthWrite: false,
      });
      fieldGroup.add(new THREE.Line(geo, mat));
    }
  }

  // ── Direction Indicators ─────────────────────────────
  const directionGroup = new THREE.Group();
  torusGroup.add(directionGroup);
  let toroidalArrows = [];
  let poloidalArrows = [];
  const arrowGeoDir = new THREE.ConeGeometry(0.05, 0.14, 5);

  function rebuildDirectionIndicators() {
    toroidalArrows.forEach(a => { directionGroup.remove(a); a.geometry?.dispose(); a.material?.dispose(); });
    poloidalArrows.forEach(a => { directionGroup.remove(a); a.geometry?.dispose(); a.material?.dispose(); });
    toroidalArrows = [];
    poloidalArrows = [];
    if (!state.showFieldLines || !knotSamples.length) return;

    const tlines = Math.min(Math.floor(state.fieldLineCount * 0.5), 6);
    for (let i = 0; i < tlines; i++) {
      const angle = (i / Math.max(tlines, 1)) * Math.PI * 2;
      const rr = state.tube * 0.45;
      for (let k = 0; k < 5; k++) {
        const u = k / 5;
        const f = getFrame(u);
        if (!f) continue;
        const pos = f.point.clone()
          .add(f.normal.clone().multiplyScalar(rr * Math.cos(angle)))
          .add(f.binormal.clone().multiplyScalar(rr * Math.sin(angle)));
        const arrowMat = new THREE.MeshStandardMaterial({
          color: '#ff8844', emissive: '#cc4400', emissiveIntensity: 0.5, roughness: 0.4,
        });
        const arrow = new THREE.Mesh(arrowGeoDir, arrowMat);
        arrow.position.copy(pos);
        arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), f.tangent);
        directionGroup.add(arrow);
        toroidalArrows.push(arrow);
      }
    }

    const rings = Math.min(state.fieldLineCount, 8);
    for (let i = 0; i < rings; i++) {
      const u = i / Math.max(rings, 1);
      const f = getFrame(u);
      if (!f) continue;
      const rr = state.tube * 0.82;
      for (let k = 0; k < 4; k++) {
        const s = (k / 4) * Math.PI * 2;
        const pos = f.point.clone()
          .add(f.normal.clone().multiplyScalar(rr * Math.cos(s)))
          .add(f.binormal.clone().multiplyScalar(rr * Math.sin(s)));
        const poloidalDir = f.binormal.clone().multiplyScalar(Math.cos(s))
          .addScaledVector(f.normal, -Math.sin(s)).normalize();
        const arrowMat = new THREE.MeshStandardMaterial({
          color: '#5599dd', emissive: '#225588', emissiveIntensity: 0.5, roughness: 0.4,
        });
        const arrow = new THREE.Mesh(arrowGeoDir, arrowMat);
        arrow.position.copy(pos);
        arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), poloidalDir);
        directionGroup.add(arrow);
        poloidalArrows.push(arrow);
      }
    }
  }

  // ── Particles ────────────────────────────────────────
  const MAX_P = 1600;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(MAX_P * 3);
  const pCol = new Float32Array(MAX_P * 3);
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const glowTex = createGlowTexture('#ffffff', 64);
  const pMat = new THREE.PointsMaterial({
    size: 0.09, map: glowTex, vertexColors: true,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  torusGroup.add(particles);
  let particleData = [];

  function buildParticleData() {
    particleData = [];
    const count = state.fieldLineCount;

    const nRings = count;
    const ppRing = 22;
    for (let i = 0; i < nRings; i++) {
      for (let j = 0; j < ppRing; j++) {
        particleData.push({
          type: 'poloidal', baseU: i / nRings,
          angle: (j / ppRing) * Math.PI * 2, phase: Math.random(),
          color: [0.35, 0.7, 1.0],
        });
      }
    }

    const nTor = Math.floor(count * 0.6);
    const ppTor = 30;
    for (let i = 0; i < nTor; i++) {
      const off = (i / nTor) * Math.PI * 2;
      for (let j = 0; j < ppTor; j++) {
        particleData.push({
          type: 'toroidal', offsetAngle: off,
          phase: j / ppTor, color: [1.0, 0.5, 0.2],
        });
      }
    }

    if (particleData.length > MAX_P) particleData.length = MAX_P;
  }

  function updateParticles(time) {
    if (!state.showFieldLines || !particleData.length) {
      for (let i = 0; i < MAX_P; i++) {
        pPos[i * 3] = pPos[i * 3 + 1] = pPos[i * 3 + 2] = 0;
        pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0;
      }
      pGeo.attributes.position.needsUpdate = true;
      pGeo.attributes.color.needsUpdate = true;
      return;
    }
    const spd = state.particleSpeed;
    for (let i = 0; i < particleData.length; i++) {
      const pd = particleData[i];
      pd.phase += spd * 0.003;
      if (pd.phase > 1) pd.phase -= 1;

      let pos;
      if (pd.type === 'poloidal') {
        const f = getFrame(pd.baseU);
        if (!f) { pos = new THREE.Vector3(); } else {
          const { point, normal, binormal } = f;
          const rr = state.tube * 0.78;
          const a = pd.angle + pd.phase * Math.PI * 2;
          pos = point.clone()
            .add(normal.clone().multiplyScalar(rr * Math.cos(a)))
            .add(binormal.clone().multiplyScalar(rr * Math.sin(a)));
        }
      } else {
        const f = getFrame(pd.phase);
        if (!f) { pos = new THREE.Vector3(); } else {
          const { point, normal, binormal } = f;
          const rr = state.tube * 0.42;
          pos = point.clone()
            .add(normal.clone().multiplyScalar(rr * Math.cos(pd.offsetAngle)))
            .add(binormal.clone().multiplyScalar(rr * Math.sin(pd.offsetAngle)));
        }
      }
      if (!pos) pos = new THREE.Vector3();
      pPos[i * 3] = pos.x; pPos[i * 3 + 1] = pos.y; pPos[i * 3 + 2] = pos.z;
      pCol[i * 3] = pd.color[0]; pCol[i * 3 + 1] = pd.color[1]; pCol[i * 3 + 2] = pd.color[2];
    }
    for (let i = particleData.length; i < MAX_P; i++) {
      pPos[i * 3] = pPos[i * 3 + 1] = pPos[i * 3 + 2] = 0;
      pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0;
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;
  }

  // ── Marker ───────────────────────────────────────────
  const markerGeo = new THREE.SphereGeometry(0.1, 16, 16);
  const markerMat = new THREE.MeshStandardMaterial({
    color: '#ff4477', emissive: '#ff2244', emissiveIntensity: 2.5, roughness: 0.2,
  });
  const marker = new THREE.Mesh(markerGeo, markerMat);
  torusGroup.add(marker);

  const haloGeoM = new THREE.SphereGeometry(0.18, 16, 16);
  const haloMatM = new THREE.MeshBasicMaterial({
    color: '#ff6688', transparent: true, opacity: 0.3,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const haloMarker = new THREE.Mesh(haloGeoM, haloMatM);
  marker.add(haloMarker);

  const arrowGroup = new THREE.Group();
  torusGroup.add(arrowGroup);
  const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6);
  const headGeo = new THREE.ConeGeometry(0.06, 0.15, 8);
  const arrowMatMarker = new THREE.MeshStandardMaterial({
    color: '#ffdd44', emissive: '#ffaa00', emissiveIntensity: 0.9, roughness: 0.3,
  });
  const shaft = new THREE.Mesh(shaftGeo, arrowMatMarker);
  shaft.position.y = 0.2;
  const head = new THREE.Mesh(headGeo, arrowMatMarker);
  head.position.y = 0.47;
  arrowGroup.add(shaft, head);

  // ── Cross-Section Disc ──────────────────────────────
  const crossSectionGroup = new THREE.Group();
  torusGroup.add(crossSectionGroup);

  const ringGeoD = new THREE.TorusGeometry(0.62, 0.015, 16, 64);
  const ringMatD = new THREE.MeshStandardMaterial({
    color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.6,
    roughness: 0.3, depthWrite: false,
  });
  crossSectionGroup.add(new THREE.Mesh(ringGeoD, ringMatD));

  const discGeo = new THREE.CircleGeometry(0.60, 64);
  const discMat = new THREE.MeshBasicMaterial({
    color: '#5599dd', transparent: true, opacity: 0.08,
    side: THREE.DoubleSide, depthWrite: false,
  });
  crossSectionGroup.add(new THREE.Mesh(discGeo, discMat));

  for (let k = 0; k < 3; k++) {
    const r = 0.15 + k * 0.22;
    const cg = new THREE.TorusGeometry(r, 0.006, 8, 48);
    const cm = new THREE.MeshBasicMaterial({
      color: '#aaccff', transparent: true, opacity: 0.2, depthWrite: false,
    });
    crossSectionGroup.add(new THREE.Mesh(cg, cm));
  }

  const discArrowCones = [];
  for (let k = 0; k < 4; k++) {
    const coneGeo = new THREE.ConeGeometry(0.04, 0.10, 6);
    const coneMat = new THREE.MeshStandardMaterial({
      color: '#88ccff', emissive: '#4488cc', emissiveIntensity: 0.7, roughness: 0.3,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.visible = false;
    crossSectionGroup.add(cone);
    discArrowCones.push(cone);
  }

  function updateMarker() {
    const pos = surfacePoint(markerState.t, markerState.s);
    const norm = surfaceNormal(markerState.t, markerState.s);
    markerState.worldPos.copy(pos);
    markerState.worldNormal.copy(norm);
    marker.position.copy(pos);
    arrowGroup.position.copy(pos);
    arrowGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);

    const f = getFrame(markerState.t / (Math.PI * 2));
    if (f) {
      crossSectionGroup.position.copy(f.point);
      crossSectionGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), f.tangent);
      crossSectionGroup.visible = true;
      const rr = state.tube * 0.82;
      for (let k = 0; k < 4; k++) {
        const cone = discArrowCones[k];
        const s = (k / 4) * Math.PI * 2;
        const localX = Math.cos(s) * rr;
        const localY = Math.sin(s) * rr;
        cone.position.set(localX, localY, 0);
        const dir = new THREE.Vector3(-Math.sin(s), Math.cos(s), 0).normalize();
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        cone.visible = true;
      }
    } else {
      crossSectionGroup.visible = false;
    }
  }

  // ── Raycasting / dragging ────────────────────────────
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let dragging = false;

  function intersect(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const targets = torusSolid ? [torusSolid] : [];
    latticeGroup.children.forEach(c => { if (c.isMesh) targets.push(c); });
    return raycaster.intersectObjects(targets, false);
  }

  function closestParams(worldPt) {
    let best = Infinity, bestT = 0, bestS = 0;
    const nT = 100, nS = 50;
    for (let i = 0; i < nT; i++) {
      const t = (i / nT) * Math.PI * 2;
      for (let j = 0; j < nS; j++) {
        const s = (j / nS) * Math.PI * 2;
        const d = worldPt.distanceToSquared(surfacePoint(t, s));
        if (d < best) { best = d; bestT = t; bestS = s; }
      }
    }
    return { t: bestT, s: bestS };
  }

  // Pointer event handlers
  function onPointerDown(e) {
    const hits = intersect(e);
    if (hits.length > 0) {
      dragging = true;
      orbit.enabled = false;
      canvas.style.cursor = 'grabbing';
      const p = closestParams(hits[0].point);
      markerState.t = p.t; markerState.s = p.s;
      updateMarker();
      hintEl.style.opacity = '0';
    }
  }

  function onPointerMove(e) {
    if (!dragging) {
      if (torusSolid) {
        const hits = intersect(e);
        canvas.style.cursor = hits.length ? 'grab' : '';
      }
      return;
    }
    const hits = intersect(e);
    if (hits.length > 0) {
      const p = closestParams(hits[0].point);
      markerState.t = p.t; markerState.s = p.s;
      updateMarker();
    }
  }

  function onPointerUp() {
    if (dragging) {
      dragging = false;
      orbit.enabled = true;
      canvas.style.cursor = '';
      hintEl.style.opacity = '1';
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  // ── Animation ────────────────────────────────────────
  let animationId;
  const clock = new THREE.Clock();

  function animate() {
    if (disposed) return;
    animationId = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    const time = performance.now() * 0.001;

    torusGroup.rotation.y += state.spinSpeed * dt;
    stars.rotation.y += dt * 0.02;
    stars.rotation.x += dt * 0.005;
    orbit.update();
    updateParticles(time);
    renderer.render(scene, camera);
  }

  // ── Resize ───────────────────────────────────────────
  function handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', handleResize);

  // ── Info overlay update ──────────────────────────────
  function updateInfoOverlay() {
    const p = parseFloat(state.p).toFixed(2);
    const q = parseFloat(state.q).toFixed(2);
    const preset = activePreset >= 0 ? PRESETS[activePreset] : null;

    const legendItems = preset && preset.legend ? preset.legend : [
      { dot: '#5599dd', label: 'Poloidal rings', why: 'Magnetic containment — these circle the tube short-way, preventing plasma/field from drifting outward' },
      { dot: '#ff8844', label: 'Toroidal flow lines', why: 'Current / transport — these follow the knot long-way, showing the main direction of flow or electric current' },
      { dot: '#ff4477', label: 'Draggable marker', why: 'Measurement point — drag it anywhere on the surface to explore the local geometry' },
    ];

    let legendHTML = legendItems.map(l => `
      <div class="te-legend-item">
        <span class="te-legend-dot" style="background:${l.dot}"></span>
        <span class="te-label">${l.label}</span>
        ${l.why ? `<span class="te-why">${l.why}</span>` : ''}
      </div>
    `).join('');

    legendHTML += `
      <div class="te-legend-item">
        <span class="te-legend-dot" style="background:#fff"></span>
        <span class="te-label">Lattice layers</span>
        <span class="te-why">Nested geometry — concentric wireframes show the tube structure at different depths, like layers of an onion</span>
      </div>
      <div class="te-legend-item">
        <span class="te-legend-dot" style="background:#b388ff"></span>
        <span class="te-label">Glowing flow particles</span>
        <span class="te-why">Dynamic flow — each dot follows a field line in real time, showing how fluid or plasma would circulate</span>
      </div>
    `;

    const whyBox = preset ? `
      <div class="te-why-box">
        <strong>Why this shape in nature?</strong><br>
        ${preset.id === 'tokamak' ? 'Fusion plasma must circulate endlessly without touching any wall — a torus is the only shape that allows this. The helical twist (p=' + preset.params.p + ', q=' + preset.params.q + ') prevents the plasma from drifting outward via <em>magnetic shear</em> — the field lines rotate as they go around, averaging out perturbations that would otherwise escape.' : ''}
        ${preset.id === 'dna' ? 'DNA is a very long molecule (~2m per cell) that must be packed into a microscopic nucleus. Supercoiling into toroidal loops compacts it 10,000-fold. The (2,3) trefoil is the simplest knot that cannot be untied — and when DNA forms one, special enzymes (topoisomerases) must cut and reconnect the strand to resolve it.' : ''}
        ${preset.id === 'solar' ? 'The Sun is a ball of electrically conducting plasma in turbulent motion. Moving plasma drags magnetic field lines with it (<em>flux freezing</em>), braiding them into knots. The (3,4) configuration appears where multiple sunspot groups entangle their magnetic loops — when the tension snaps, a solar flare is released.' : ''}
        ${preset.id === 'vortex' ? 'A vortex ring forms because fluids conserve angular momentum. The rotating core cannot simply end — it must close on itself. The poloidal circulation (through the ring and back around) is what keeps the ring stable: it\'s the same physics that lets dolphins blow stable bubble rings underwater.' : ''}
        ${preset.id === 'emknot' ? 'Maxwell\'s equations describe all of electromagnetism. It was only proven in 2013 that these equations contain exact solutions where the field lines form torus knots. In 2018, physicists actually created "knotted light" in the lab using structured laser pulses — proving that light itself can be tied in knots.' : ''}
        ${preset.id === 'galaxy' ? 'Galaxies rotate differentially — the inner parts spin faster than the outer parts. This stretches and twists any existing magnetic field into a helical pattern. Over billions of years, these fields become strong enough to affect how gas clouds collapse into stars — the magnetic topology shapes galactic evolution.' : ''}
      </div>
    ` : `
      <div class="te-why-box">
        <strong>Why do torus shapes appear everywhere in nature?</strong><br>
        Because a torus is the <strong>simplest shape that can contain a circulating flow in 3D space without endpoints</strong>. Any fluid, plasma, or field that must loop back on itself naturally forms a torus. Conservation laws — of magnetic flux, of vorticity, of angular momentum — all favor toroidal topology. Add a twist (p,q > 1) and you get the knotted versions seen in DNA, solar corona, and fusion reactors.
      </div>
    `;

    infoContentEl.innerHTML = `
      <h3>${preset ? preset.name : '🔮 Torus Knot Field'}</h3>
      <div class="te-subtitle">${preset ? preset.subtitle : 'Interactive 3D parametric knot'}</div>
      ${whyBox}
      ${preset ? `<p style="margin-top:10px;">${preset.desc}</p>` : ''}
      <h4>📐 Live Parameters</h4>
      <div class="te-param-row"><span class="te-key">Knot type</span><span class="te-val">(${p}, ${q}) torus knot</span></div>
      <div class="te-param-row"><span class="te-key">p — toroidal windings</span><span class="te-val">${p}</span></div>
      <div class="te-param-row"><span class="te-key">q — poloidal windings</span><span class="te-val">${q}</span></div>
      <div class="te-param-row"><span class="te-key">Major radius R</span><span class="te-val">${parseFloat(state.radius).toFixed(2)}</span></div>
      <div class="te-param-row"><span class="te-key">Minor radius r</span><span class="te-val">${parseFloat(state.tube).toFixed(2)}</span></div>
      <h4>🎨 Reading the visualization</h4>
      ${legendHTML}
      ${preset ? `<div class="te-real-world"><strong>🔬 Real-world connection:</strong><br>${preset.realWorld}</div>` : `
        <div class="te-real-world"><strong>💡 Pick a preset</strong> from the bottom bar to see real examples from fusion energy, molecular biology, solar physics, fluid dynamics, and cosmology — each with its own scientific explanation.</div>
      `}
    `;
  }

  // ── UI Helpers ───────────────────────────────────────
  let pSliderInput, pSliderDisplay, qSliderInput, qSliderDisplay;

  function makeSlider(label, key, min, max, step, fmt) {
    const g = document.createElement('div'); g.className = 'te-control-group';
    const l = document.createElement('label'); l.textContent = label;
    const i = document.createElement('input');
    i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = state[key];
    const d = document.createElement('span'); d.className = 'te-val';
    d.textContent = fmt ? fmt(state[key]) : state[key];
    i.addEventListener('input', () => {
      const v = parseFloat(i.value); state[key] = v;
      d.textContent = fmt ? fmt(v) : v;
      activePreset = -1;
      if (['p', 'q', 'radius', 'tube', 'tubularSegments', 'radialSegments', 'color', 'metalness', 'roughness', 'showWireframe', 'showLattice'].includes(key)) {
        rebuildTorus(); updateMarker();
      }
      if (['fieldLineCount', 'showFieldLines'].includes(key)) {
        rebuildFieldLines(); buildParticleData(); rebuildDirectionIndicators();
      }
      notifyState();
    });
    g.append(l, i, d);
    return { el: g, input: i, display: d };
  }

  function makeColorPick(label, key) {
    const g = document.createElement('div'); g.className = 'te-control-group';
    const l = document.createElement('label'); l.textContent = label;
    const i = document.createElement('input');
    i.type = 'color'; i.value = state[key];
    i.addEventListener('input', () => { state[key] = i.value; activePreset = -1; rebuildTorus(); notifyState(); });
    g.append(l, i);
    return g;
  }

  function makeToggle(label, key) {
    const r = document.createElement('div'); r.className = 'te-toggle-row';
    const i = document.createElement('input');
    i.type = 'checkbox'; i.checked = state[key];
    i.addEventListener('change', () => {
      state[key] = i.checked;
      activePreset = -1;
      rebuildTorus(); buildParticleData();
      notifyState();
    });
    const s = document.createElement('span'); s.textContent = label;
    r.append(i, s);
    return r;
  }

  function applyPreset(idx) {
    if (idx < 0 || idx >= PRESETS.length) return;
    if (idx === activePreset) {
      activePreset = -1;
      resetToDefaults();
      buildUI();
      updateInfoOverlay();
      notifyState();
      return;
    }
    activePreset = idx;
    const pr = PRESETS[idx].params;
    Object.assign(state, {
      p: pr.p, q: pr.q, radius: pr.radius, tube: pr.tube,
      spinSpeed: pr.spinSpeed, color: pr.color,
      metalness: pr.metalness, roughness: pr.roughness,
      fieldLineCount: pr.fieldLineCount, particleSpeed: pr.particleSpeed,
      morphValue: 0,
    });
    markerState.t = 0; markerState.s = Math.PI / 2;
    rebuildTorus(); updateMarker(); buildParticleData();
    buildUI();
    updateInfoOverlay();
    notifyState();
  }

  function resetToDefaults() {
    Object.assign(state, {
      p: 2, q: 3, radius: 2.5, tube: 0.7, tubularSegments: 200, radialSegments: 24,
      spinSpeed: 0, color: '#9944dd', metalness: 0.15, roughness: 0.5,
      showWireframe: true, showFieldLines: true, showLattice: true,
      fieldLineCount: 20, particleSpeed: 0.7, morphValue: 0,
    });
    markerState.t = 0; markerState.s = Math.PI / 2;
    rebuildTorus(); updateMarker(); buildParticleData();
    notifyState();
  }

  function buildUI() {
    panelEl.innerHTML = '';

    // Preset pills
    const presetsRow = document.createElement('div');
    presetsRow.className = 'te-presets-row';
    PRESETS.forEach((pr, i) => {
      const btn = document.createElement('button');
      btn.className = 'te-preset-pill' + (i === activePreset ? ' active' : '');
      btn.textContent = pr.short;
      btn.title = pr.name + '\n' + pr.realWorld;
      btn.addEventListener('click', () => applyPreset(i));
      presetsRow.appendChild(btn);
    });
    panelEl.appendChild(presetsRow);

    // KNOT GEOMETRY
    const sec1 = document.createElement('div');
    sec1.className = 'te-section-label'; sec1.textContent = 'Knot Geometry';
    panelEl.appendChild(sec1);

    const grid1 = document.createElement('div');
    grid1.className = 'te-controls-grid';

    const mg = document.createElement('div');
    mg.className = 'te-control-group te-morph-group';
    const ml = document.createElement('label'); ml.textContent = '🧬 Morph Shape';
    const mi = document.createElement('input');
    mi.type = 'range'; mi.min = 0; mi.max = state.morphPresets.length - 1; mi.step = 0.001;
    mi.value = state.morphValue * (state.morphPresets.length - 1);
    const md = document.createElement('span'); md.className = 'te-val';
    function morphLabel(raw) {
      const idx = Math.round(raw);
      const pr = state.morphPresets[Math.min(idx, state.morphPresets.length - 1)];
      return `(${pr.p}, ${pr.q})`;
    }
    md.textContent = morphLabel(parseFloat(mi.value));
    mi.addEventListener('input', () => {
      const raw = parseFloat(mi.value);
      state.morphValue = raw / (state.morphPresets.length - 1);
      const idxF = state.morphValue * (state.morphPresets.length - 1);
      const lo = Math.floor(idxF), hi = Math.min(lo + 1, state.morphPresets.length - 1);
      const frac = idxF - lo;
      state.p = state.morphPresets[lo].p + (state.morphPresets[hi].p - state.morphPresets[lo].p) * frac;
      state.q = state.morphPresets[lo].q + (state.morphPresets[hi].q - state.morphPresets[lo].q) * frac;
      md.textContent = morphLabel(raw);
      activePreset = -1;
      if (pSliderInput) {
        pSliderInput.value = state.p;
        pSliderDisplay.textContent = parseFloat(state.p).toFixed(2);
        qSliderInput.value = state.q;
        qSliderDisplay.textContent = parseFloat(state.q).toFixed(2);
      }
      rebuildTorus(); updateMarker();
      notifyState();
    });
    mg.append(ml, mi, md);
    grid1.appendChild(mg);

    const pSlider = makeSlider('p', 'p', 1, 9, 0.01, v => parseFloat(v).toFixed(2));
    pSliderInput = pSlider.input; pSliderDisplay = pSlider.display;
    grid1.appendChild(pSlider.el);

    const qSlider = makeSlider('q', 'q', 1, 9, 0.01, v => parseFloat(v).toFixed(2));
    qSliderInput = qSlider.input; qSliderDisplay = qSlider.display;
    grid1.appendChild(qSlider.el);

    grid1.appendChild(makeSlider('Radius', 'radius', 0.5, 5, 0.05, v => parseFloat(v).toFixed(2)).el);
    grid1.appendChild(makeSlider('Tube', 'tube', 0.1, 2, 0.02, v => parseFloat(v).toFixed(2)).el);
    panelEl.appendChild(grid1);

    // DYNAMICS
    const sec2 = document.createElement('div');
    sec2.className = 'te-section-label'; sec2.textContent = 'Dynamics';
    panelEl.appendChild(sec2);

    const grid2 = document.createElement('div');
    grid2.className = 'te-controls-grid';
    grid2.appendChild(makeSlider('Spin', 'spinSpeed', 0, 2, 0.01, v => parseFloat(v).toFixed(2)).el);
    grid2.appendChild(makeSlider('Lines', 'fieldLineCount', 2, 40, 1, v => Math.round(v)).el);
    grid2.appendChild(makeSlider('Speed', 'particleSpeed', 0.1, 3, 0.05, v => parseFloat(v).toFixed(2)).el);
    panelEl.appendChild(grid2);

    // MATERIAL
    const sec3 = document.createElement('div');
    sec3.className = 'te-section-label'; sec3.textContent = 'Material';
    panelEl.appendChild(sec3);

    const grid3 = document.createElement('div');
    grid3.className = 'te-controls-grid';
    grid3.appendChild(makeSlider('Metal', 'metalness', 0, 1, 0.01, v => parseFloat(v).toFixed(2)).el);
    grid3.appendChild(makeSlider('Rough', 'roughness', 0, 1, 0.01, v => parseFloat(v).toFixed(2)).el);
    grid3.appendChild(makeColorPick('Color', 'color'));
    grid3.appendChild(makeToggle('Wire', 'showWireframe'));
    grid3.appendChild(makeToggle('Lattice', 'showLattice'));
    grid3.appendChild(makeToggle('Fields', 'showFieldLines'));
    panelEl.appendChild(grid3);

    // Reset
    const reset = document.createElement('button');
    reset.className = 'te-reset-btn'; reset.textContent = '↺ Reset';
    reset.style.marginTop = '2px';
    reset.addEventListener('click', () => {
      activePreset = -1;
      resetToDefaults();
      buildUI();
      updateInfoOverlay();
    });
    panelEl.appendChild(reset);

    // Collapse toggle
    const tog = document.createElement('button');
    tog.className = 'te-panel-toggle';
    tog.textContent = controlsCollapsed ? '⚙ Controls ▸' : '▲ Collapse';
    tog.title = controlsCollapsed ? 'Show all controls' : 'Hide controls';
    tog.addEventListener('click', (e) => {
      e.stopPropagation();
      controlsCollapsed = !controlsCollapsed;
      if (controlsCollapsed) {
        panelEl.classList.add('collapsed');
        tog.textContent = '⚙ Controls ▸';
        tog.title = 'Show all controls';
      } else {
        panelEl.classList.remove('collapsed');
        tog.textContent = '▲ Collapse';
        tog.title = 'Hide controls';
      }
    });
    panelEl.appendChild(tog);

    panelEl.addEventListener('click', (e) => {
      if (controlsCollapsed && e.target === panelEl) {
        controlsCollapsed = false;
        panelEl.classList.remove('collapsed');
        buildUI();
      }
    });

    if (controlsCollapsed) panelEl.classList.add('collapsed');
  }

  // ── Init ─────────────────────────────────────────────
  function init() {
    handleResize();
    buildUI();
    sampleKnot();
    rebuildTorus();
    updateMarker();
    buildParticleData();
    updateInfoOverlay();
    animate();
    notifyState();
  }

  // ── Public API ───────────────────────────────────────
  function updateParams(partial) {
    Object.assign(state, partial);
    activePreset = -1; // manual changes clear preset selection
    markerState.t = 0; markerState.s = Math.PI / 2;
    rebuildTorus();
    updateMarker();
    buildParticleData();
    buildUI();
    updateInfoOverlay();
    // NOTE: do NOT call notifyState() here — the caller already knows
    // the new state. Calling it would create a feedback loop with React.
  }

  function getState() {
    const { morphPresets, ...rest } = state;
    return { ...rest, activePreset };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointerdown', onPointerDown);

    // Safe disposal helper — guards against null/undefined AND objects lacking the method
    const safeD = (obj) => { if (obj && typeof obj.dispose === 'function') obj.dispose(); };

    safeD(orbit);

    // Dispose all Three.js resources
    [starsGeo, pGeo, markerGeo, haloGeoM, shaftGeo, headGeo, ringGeoD, discGeo, arrowGeoDir,
      ...latticeGroup.children.map(c => c.geometry),
      ...fieldGroup.children.map(c => c.geometry),
      ...directionGroup.children.map(c => c.geometry),
      toroidalArrows.map(a => a.geometry), poloidalArrows.map(a => a.geometry),
    ].forEach(safeD);

    [starsMat, pMat, markerMat, haloMatM, arrowMatMarker, ringMatD, discMat,
      ...latticeGroup.children.map(c => c.material),
      ...fieldGroup.children.map(c => c.material),
      ...directionGroup.children.map(c => c.material),
      toroidalArrows.map(a => a.material), poloidalArrows.map(a => a.material),
    ].forEach(safeD);

    safeD(glowTex);
    if (torusSolid) { safeD(torusSolid.geometry); safeD(torusSolid.material); }
    if (torusWireframe) { safeD(torusWireframe.geometry); safeD(torusWireframe.material); }
    safeD(renderer);

    // Remove DOM
    container.innerHTML = '';
    container.classList.remove('te-root');
  }

  // ── GO! ──────────────────────────────────────────────
  init();

  return { updateParams, getState, resize: handleResize, dispose };
}
