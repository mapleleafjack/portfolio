// ──────────────────────────────────────────────────────────
// TorusKnotData — constants, presets, and configuration
// for the torus knot explorer. Imported by TorusKnot.js
// and by React panel components directly.
// ──────────────────────────────────────────────────────────

// ── Default parameters ─────────────────────────────────
export const DEFAULT_STATE = {
  p: 2, q: 3,
  radius: 2.5, tube: 0.7,
  tubularSegments: 200, radialSegments: 24,
  spinSpeed: 0,
  color: '#9944dd',
  metalness: 0.15, roughness: 0.6,
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
export const PRESETS = [
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
    desc: 'Fusion reactors (like <strong>ITER</strong>) use helical magnetic fields to confine 150-million-degree plasma in a toroidal chamber. The <em>poloidal</em> field prevents drift; the <em>toroidal</em> field guides particles.',
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
    desc: 'The Sun\'s corona glows with plasma loops tracing twisted magnetic fields. Convective motions at the surface braid these flux tubes into complex knots.',
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
    desc: 'A vortex ring is a torus of rotating fluid. Dolphins blow bubble rings, volcanoes erupt smoke rings. Fluid circulates <em>poloidally</em> through the center and back around.',
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
    desc: 'In 2013, physicists proved Maxwell\'s equations admit solutions where field lines form <em>torus knots</em>. In 2018, "knotted light" was created in the lab using structured laser pulses.',
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
    desc: 'Spiral galaxies host large-scale magnetic fields twisted by differential rotation. These helical structures channel cosmic rays and regulate star formation.',
    params: { p: 2, q: 5, radius: 3.0, tube: 0.28, spinSpeed: 0, color: '#8844cc', metalness: 0.12, roughness: 0.45, fieldLineCount: 16, particleSpeed: 0.3 },
    realWorld: 'Astrophysics — galactic dynamo theory, magnetohydrodynamics',
    legend: [
      { dot: '#5599dd', label: 'Poloidal rings — galactic magnetic loops' },
      { dot: '#ff8844', label: 'Toroidal flow — differential rotation of gas' },
    ],
  },
];

// ── Preview orbit constants ────────────────────────────
export const ORBIT_RADIUS = 5.0;
export const ORBIT_PERIOD = 50;
export const ORBIT_Y_AMP = 0.6;
export const ORBIT_Y_PERIOD = 18;
export const PREVIEW_SCALE = 0.18;
export const EXPLORE_SCALE = 0.45;

// ── Lattice layer definitions ──────────────────────────
export const LATTICE_LAYERS = [
  { factor: 0.28, color: '#ffffff', opacity: 0.75 },
  { factor: 0.45, color: '#bbddff', opacity: 0.50 },
  { factor: 0.62, color: '#eeaacc', opacity: 0.38 },
  { factor: 0.78, color: '#99bbff', opacity: 0.28 },
  { factor: 0.94, color: '#cc99ee', opacity: 0.18 },
  { factor: 1.10, color: '#8866cc', opacity: 0.10 },
];
