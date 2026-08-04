import { useState, useMemo } from 'react';
import { PRESETS } from './three/TorusKnotData';

export default function TorusInfoPanel({ params = {}, activePreset = -1 }) {
  const [hidden, setHidden] = useState(false);
  const preset = useMemo(() => {
    if (activePreset < 0 || activePreset >= PRESETS.length) return null;
    return PRESETS[activePreset];
  }, [activePreset]);

  const p = parseFloat(params.p ?? 2).toFixed(2);
  const q = parseFloat(params.q ?? 2).toFixed(2);

  const legendItems = preset?.legend || [
    { dot: '#5599dd', label: 'Poloidal rings', why: 'Circle the tube short-way, preventing drift outward' },
    { dot: '#ff8844', label: 'Toroidal flow lines', why: 'Follow the knot long-way' },
    { dot: '#ff4477', label: 'Draggable marker', why: 'Drag anywhere on the surface to explore local geometry' },
  ];

  const whyBox = preset ? (() => {
    const e = {
      tokamak: 'Fusion plasma must circulate endlessly without touching any wall — a torus is the only shape that allows this.',
      dna: 'DNA molecules (~2m per cell) pack into a microscopic nucleus. The (2,3) trefoil is the simplest knot that cannot be untied.',
      solar: 'The Sun\'s corona glows with plasma loops tracing twisted magnetic fields.',
      vortex: 'A vortex ring forms because fluids conserve angular momentum.',
      emknot: 'In 2013 it was proven Maxwell\'s equations admit solutions where field lines form torus knots.',
      galaxy: 'Galaxies rotate differentially, stretching magnetic fields into helical patterns.',
    };
    return e[preset.id] || '';
  })() : '';

  // ── Hidden state: just a reopen button ──────────────
  if (hidden) {
    return (
      <button onClick={() => setHidden(false)} title="Show info"
        style={{
          position: 'fixed', top: 12, right: 12, zIndex: 14,
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--overlay-bg)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)', fontSize: 14,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)', fontFamily: "'Oxanium', sans-serif",
        }}
      >ℹ</button>
    );
  }

  // ── Shared style constants ──────────────────────────
  const S = {
    panel: {
      position: 'fixed', top: 12, right: 12, zIndex: 15, width: 330,
      maxHeight: 'calc(100vh - 180px)',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid var(--border)', borderRadius: 14,
      boxShadow: '0 4px 32px var(--shadow-lg)',
      padding: '18px 18px 14px', overflowY: 'auto',
      fontFamily: "'Oxanium', sans-serif", color: 'var(--text)', fontSize: 11, lineHeight: 1.55,
    },
    close: { position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: 'var(--close-btn)', fontSize: 16, cursor: 'pointer', padding: '4px 8px', borderRadius: 4 },
    h3: { fontSize: 14, margin: '0 24px 2px 0', color: 'var(--text)', fontWeight: 700 },
    sub: { fontSize: 10, color: 'var(--label-text)', marginBottom: 10 },
    h4: { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', margin: '14px 0 4px', fontWeight: 600 },
    why: { background: 'var(--input-bg)', borderLeft: '2px solid var(--accent)', padding: '8px 10px', margin: '8px 0', borderRadius: '0 8px 8px 0', fontSize: 9.5, color: 'var(--text-muted)', lineHeight: 1.5 },
    real: { marginTop: 10, padding: '8px 10px', background: 'var(--input-bg-hover)', borderRadius: 8, fontSize: 9.5, color: 'var(--label-text)', lineHeight: 1.45 },
    row: { display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--divider)', fontSize: 10 },
    dotRow: { margin: '3px 0', fontSize: 9.5, lineHeight: 1.4, paddingLeft: 3 },
    dot: { display: 'inline-block', width: 7, height: 7, borderRadius: '50%', marginRight: 5, flexShrink: 0, verticalAlign: 'middle' },
    dotWhy: { color: 'var(--text-subtle)', fontSize: 8.5, display: 'block', marginLeft: 14 },
  };

  return (
    <div style={S.panel}>
      <button onClick={() => setHidden(true)} style={S.close} title="Hide">×</button>

      <h3 style={S.h3}>{preset ? preset.name : '🔮 Torus Knot Field'}</h3>
      <div style={S.sub}>{preset ? preset.subtitle : 'Interactive 3D parametric knot'}</div>

      <div style={S.why}>
        <strong>{preset ? 'Why this shape in nature?' : 'Why torus shapes appear everywhere?'}</strong><br />
        {whyBox || 'A torus is the simplest shape that can contain a circulating flow in 3D without endpoints.'}
      </div>

      {preset?.desc && <p style={{ margin: '8px 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: preset.desc }} />}

      <h4 style={S.h4}>📐 Live Parameters</h4>
      <PRow k="Knot type" v={`(${p}, ${q}) torus knot`} />
      <PRow k="p — toroidal windings" v={p} />
      <PRow k="q — poloidal windings" v={q} />
      <PRow k="Major radius R" v={parseFloat(params.radius ?? 2.5).toFixed(2)} />
      <PRow k="Minor radius r" v={parseFloat(params.tube ?? 0.7).toFixed(2)} />

      <h4 style={S.h4}>🎨 Reading the visualization</h4>
      {legendItems.map((l, i) => (
        <div key={i} style={S.dotRow}>
          <span style={{ ...S.dot, background: l.dot }} /><span style={{ color: 'var(--text)' }}>{l.label}</span>
          {l.why && <span style={S.dotWhy}>{l.why}</span>}
        </div>
      ))}
      <div style={S.dotRow}><span style={{ ...S.dot, background: 'var(--text-subtle)' }} /><span style={{ color: 'var(--text)' }}>Lattice layers</span><span style={S.dotWhy}>Concentric wireframes at different tube depths</span></div>
      <div style={S.dotRow}><span style={{ ...S.dot, background: 'var(--accent)' }} /><span style={{ color: 'var(--text)' }}>Glowing flow particles</span><span style={S.dotWhy}>Each dot follows a field line in real time</span></div>

      <div style={S.real}>
        <strong style={{ color: 'var(--accent)' }}>🔬 Real-world connection:</strong><br />
        {preset ? preset.realWorld : 'Pick a preset below to see real examples from fusion, biology, solar physics, and cosmology.'}
      </div>
    </div>
  );
}

function PRow({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--divider)', fontSize: 10 }}>
      <span style={{ color: 'var(--text-subtle)' }}>{k}</span>
      <span style={{ color: 'var(--accent)', fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 9.5, fontWeight: 500 }}>{v}</span>
    </div>
  );
}
