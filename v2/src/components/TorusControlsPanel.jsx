import { useState, useCallback } from 'react';
import { PRESETS, DEFAULT_STATE } from './three/TorusKnotData';

/**
 * Bottom control bar — light glassmorphic, matches app aesthetic.
 * Collapsible — collapsed shows only preset row + expand button.
 */
export default function TorusControlsPanel({
  params = {},
  activePreset = -1,
  onParamsChange,
  onPresetSelect,
  onReset,
}) {
  const [collapsed, setCollapsed] = useState(true);

  const update = useCallback((key, value) => {
    onParamsChange?.({ [key]: value });
  }, [onParamsChange]);

  const presets = PRESETS;

  // ── Helpers ────────────────────────────────────────
  const slider = (label, key, min, max, step, fmt) => (
    <div className="tc-group" key={key}>
      <label>{label}</label>
      <input type="range" min={min} max={max} step={step}
        value={params[key] ?? 0}
        onChange={e => update(key, parseFloat(e.target.value))} />
      <span className="tc-val">{fmt ? fmt(params[key]) : params[key]}</span>
    </div>
  );

  const toggle = (label, key) => (
    <div className="tc-toggle-row" key={key}>
      <input type="checkbox" checked={params[key] ?? false}
        onChange={e => update(key, e.target.checked)} />
      <span>{label}</span>
    </div>
  );

  const colorPick = (label, key) => (
    <div className="tc-group" key={key}>
      <label>{label}</label>
      <input type="color" value={params[key] ?? '#9944dd'}
        onChange={e => update(key, e.target.value)} />
    </div>
  );

  const morphPresets = params.morphPresets || DEFAULT_STATE.morphPresets;
  const morphIdx = (params.morphValue ?? 0) * (morphPresets.length - 1);
  const morphLabel = () => {
    const idx = Math.round(morphIdx);
    const pr = morphPresets[Math.min(idx, morphPresets.length - 1)];
    return pr ? `(${pr.p}, ${pr.q})` : '';
  };

  return (
    <>
      <style>{`
        .tc-root * { margin:0; padding:0; box-sizing:border-box; }
        .tc-root { font-family:'Oxanium',sans-serif; color:#333; user-select:none; -webkit-user-select:none; }
        .tc-panel {
          position:fixed; bottom:0; left:50%; transform:translateX(-50%);
          background:rgba(255,255,255,0.78); border-top:1px solid rgba(0,0,0,0.08);
          border-radius:12px 12px 0 0; padding:6px 20px 6px; z-index:20;
          backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
          box-shadow:0 -4px 24px rgba(0,0,0,0.08);
          display:flex; flex-direction:column; gap:2px; max-width:max-content;
        }
        .tc-panel.collapsed { padding:6px 20px 6px; }
        .tc-panel.collapsed .tc-section-label,
        .tc-panel.collapsed .tc-controls-grid,
        .tc-panel.collapsed .tc-reset-btn { display:none; }
        .tc-panel-toggle {
          background:rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.08);
          color:#888; border-radius:16px; cursor:pointer;
          font-size:10.5px; padding:3px 12px; line-height:1.3;
          flex-shrink:0; margin-left:6px; white-space:nowrap; transition:all 0.2s;
          font-family:'Oxanium',sans-serif;
        }
        .tc-panel-toggle:hover { background:rgba(0,0,0,0.08); color:#333; }
        .tc-section-label { font-size:7.5px; text-transform:uppercase; letter-spacing:0.12em; color:rgba(0,0,0,0.32); padding:0; line-height:1; margin-top:2px; }
        .tc-controls-grid { display:flex; flex-wrap:wrap; gap:4px 16px; align-items:flex-end; }
        .tc-group { display:flex; flex-direction:column; gap:1px; min-width:80px; max-width:130px; flex:1 0 auto; }
        .tc-group label { font-size:9.5px; letter-spacing:0.03em; color:#777; white-space:nowrap; }
        .tc-group input[type="range"] { -webkit-appearance:none; width:100%; height:4px; background:rgba(0,0,0,0.08); border-radius:2px; outline:none; cursor:pointer; }
        .tc-group input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:13px; height:13px; border-radius:50%; background:var(--accent); cursor:pointer; border:2px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,0.15); }
        .tc-group input[type="color"] { -webkit-appearance:none; width:100%; height:20px; border:1px solid rgba(0,0,0,0.1); border-radius:4px; cursor:pointer; background:transparent; padding:0; }
        .tc-group .tc-val { font-size:8.5px; color:#aaa; font-variant-numeric:tabular-nums; font-family:'SF Mono','Fira Code',monospace; }
        .tc-morph-group { min-width:150px!important; max-width:200px!important; }
        .tc-morph-group label { color:var(--accent); font-weight:600; }
        .tc-morph-group .tc-val { color:var(--accent); }
        .tc-presets-row { display:flex; flex-wrap:nowrap; gap:5px; align-items:center; overflow-x:auto; padding-bottom:2px; }
        .tc-presets-row::-webkit-scrollbar { height:2px; }
        .tc-presets-row::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.1); border-radius:2px; }
        .tc-preset-pill { background:rgba(0,0,0,0.03); color:#888; border:1px solid rgba(0,0,0,0.08); border-radius:16px; padding:3px 12px; cursor:pointer; font-size:10px; white-space:nowrap; transition:all 0.2s; flex-shrink:0; font-family:'Oxanium',sans-serif; }
        .tc-preset-pill:hover { background:rgba(0,0,0,0.06); color:#333; }
        .tc-preset-pill.active { background:var(--accent); color:#fff; border-color:var(--accent); box-shadow:0 0 10px rgba(0,0,0,0.15); }
        .tc-reset-btn { background:rgba(0,0,0,0.04); align-self:flex-end; color:#666; border:1px solid rgba(0,0,0,0.08); padding:4px 12px; border-radius:6px; cursor:pointer; font-size:10px; font-weight:600; letter-spacing:0.02em; font-family:'Oxanium',sans-serif; transition:all 0.2s; }
        .tc-reset-btn:hover { background:rgba(0,0,0,0.08); color:#333; }
        .tc-toggle-row { display:flex; align-items:center; gap:5px; font-size:10px; color:#999; }
        .tc-toggle-row input[type="checkbox"] { accent-color:var(--accent); width:13px; height:13px; }
        @media (max-width:768px) {
          .tc-panel { padding:6px 10px 10px; }
          .tc-group { min-width:60px; max-width:95px; }
          .tc-preset-pill { font-size:8.5px; padding:2px 8px; }
        }
      `}</style>

      <div className={`tc-root tc-panel${collapsed ? ' collapsed' : ''}`}>
        <div className="tc-presets-row">
          {presets.map((pr, i) => (
            <button key={pr.id}
              className={`tc-preset-pill${i === activePreset ? ' active' : ''}`}
              title={`${pr.name}\n${pr.realWorld}`}
              onClick={() => onPresetSelect?.(i)}>{pr.short}</button>
          ))}
        </div>

        <div className="tc-section-label">Knot Geometry</div>
        <div className="tc-controls-grid">
          <div className="tc-group tc-morph-group">
            <label>🧬 Morph Shape</label>
            <input type="range" min={0} max={morphPresets.length - 1} step={0.001}
              value={morphIdx}
              onChange={e => {
                const raw = parseFloat(e.target.value);
                const mv = raw / (morphPresets.length - 1);
                const idxF = mv * (morphPresets.length - 1);
                const lo = Math.floor(idxF), hi = Math.min(lo + 1, morphPresets.length - 1);
                const frac = idxF - lo;
                const newP = morphPresets[lo].p + (morphPresets[hi].p - morphPresets[lo].p) * frac;
                const newQ = morphPresets[lo].q + (morphPresets[hi].q - morphPresets[lo].q) * frac;
                onParamsChange?.({ morphValue: mv, p: newP, q: newQ });
              }} />
            <span className="tc-val">{morphLabel()}</span>
          </div>
          {slider('p', 'p', 1, 9, 0.01, v => parseFloat(v).toFixed(2))}
          {slider('q', 'q', 1, 9, 0.01, v => parseFloat(v).toFixed(2))}
          {slider('Radius', 'radius', 0.5, 5, 0.05, v => parseFloat(v).toFixed(2))}
          {slider('Tube', 'tube', 0.1, 2, 0.02, v => parseFloat(v).toFixed(2))}
        </div>

        <div className="tc-section-label">Dynamics</div>
        <div className="tc-controls-grid">
          {slider('Spin', 'spinSpeed', 0, 2, 0.01, v => parseFloat(v).toFixed(2))}
          {slider('Lines', 'fieldLineCount', 2, 40, 1, v => Math.round(v))}
          {slider('Speed', 'particleSpeed', 0.1, 3, 0.05, v => parseFloat(v).toFixed(2))}
        </div>

        <div className="tc-section-label">Material</div>
        <div className="tc-controls-grid">
          {slider('Metal', 'metalness', 0, 1, 0.01, v => parseFloat(v).toFixed(2))}
          {slider('Rough', 'roughness', 0, 1, 0.01, v => parseFloat(v).toFixed(2))}
          {colorPick('Color', 'color')}
          {toggle('Wire', 'showWireframe')}
          {toggle('Lattice', 'showLattice')}
          {toggle('Fields', 'showFieldLines')}
        </div>

        <button className="tc-reset-btn" style={{ marginTop: 2 }} onClick={onReset}>↺ Reset</button>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="tc-panel-toggle"
            title={collapsed ? 'Show all controls' : 'Hide controls'}
            onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}>
            {collapsed ? '⚙ Controls ▸' : '▲ Collapse'}
          </button>
        </div>
      </div>
    </>
  );
}
