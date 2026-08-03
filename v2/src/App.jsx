import { useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './components/Home';
import Work from './components/Work';
import Project from './components/Project';
import Creative from './components/Creative';
import About from './components/About';
import Album from './components/Album';
import CursorTrail from './components/CursorTrail';
import ColorShift from './components/ColorShift';
import ThreeBackground from './components/ThreeBackground';
import TorusInfoPanel from './components/TorusInfoPanel';
import TorusControlsPanel from './components/TorusControlsPanel';
import { PRESETS as TORUS_PRESETS } from './components/three/TorusKnotData';
import { TorusProvider, useTorus } from './TorusContext';

function PageWrapper({ children }) {
  const location = useLocation();
  return <div key={location.pathname} className="page-enter">{children}</div>;
}

function AppContent() {
  const {
    torusFocused,
    torusParams,
    openTorus,
    closeTorus,
    updateTorusParams,
    applyPreset,
    resetTorusParams,
  } = useTorus();

  // ── ESC key to exit torus focus ──────────────────────
  useEffect(() => {
    if (!torusFocused) return;
    const onKey = (e) => { if (e.key === 'Escape') closeTorus(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [torusFocused, closeTorus]);

  // ── Engine state sync callback ──────────────────────
  const handleEngineStateChange = useCallback((engineState) => {
    // Sync engine-driven state changes back to React (e.g. marker-driven geometry).
    // activePreset is a React-only UI concern — never synced from the engine.
    if (engineState) {
      updateTorusParams({
        p: engineState.p,
        q: engineState.q,
      });
    }
  }, [updateTorusParams]);

  // ── Preset selection handler ────────────────────────
  const handlePresetSelect = useCallback((idx) => {
    const presets = TORUS_PRESETS;
    if (idx < 0 || idx >= presets.length) return;
    if (idx === torusParams.activePreset) {
      // Deselect — reset to defaults
      resetTorusParams();
    } else {
      applyPreset(idx, presets[idx].params);
    }
  }, [torusParams.activePreset, applyPreset, resetTorusParams]);

  // ── Param change from controls (sliders, toggles) ───
  const handleParamsChange = useCallback((partial) => {
    // Mark preset as deselected when user manually changes params
    if (partial.p !== undefined || partial.q !== undefined
        || partial.radius !== undefined || partial.tube !== undefined
        || partial.color !== undefined) {
      updateTorusParams({ ...partial, activePreset: -1 });
    } else {
      updateTorusParams(partial);
    }
  }, [updateTorusParams]);

  return (
    <>
      <ColorShift />
      <ThreeBackground
        torusParams={torusParams}
        torusFocused={torusFocused}
        onTorusClick={openTorus}
        onTorusParamsChange={handleEngineStateChange}
      />
      {/* Subtle vignette behind torus in explore mode */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 70%)',
        opacity: torusFocused ? 1 : 0,
        transition: 'opacity 0.35s',
        pointerEvents: 'none',
      }} />

      <CursorTrail />
      <div style={{
        opacity: torusFocused ? 0 : 1,
        transition: 'opacity 0.35s',
        pointerEvents: torusFocused ? 'none' : 'auto',
      }}>
        <Nav />
      </div>

      {/* ── Torus Explore Overlays ────────────────────── */}
      {torusFocused && (
        <>
          {/* Back button */}
          <button
            onClick={closeTorus}
            style={{
              position: 'fixed', top: 12, left: 16, zIndex: 125,
              fontSize: 11, color: '#888',
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(0,0,0,0.08)',
              padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transition: 'all 0.2s',
              fontFamily: "'Oxanium', sans-serif",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
              e.currentTarget.style.color = '#222';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
              e.currentTarget.style.color = '#888';
            }}
          >
            ← Back to Galaxy
          </button>

          {/* Hint */}
          <div style={{
            position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
            fontSize: 9.5, color: 'rgba(0,0,0,0.42)', letterSpacing: '0.03em',
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            padding: '3px 14px', borderRadius: 20,
            pointerEvents: 'none', zIndex: 5, fontFamily: "'Oxanium', sans-serif",
            whiteSpace: 'nowrap',
          }}>
            🖱 Drag the glowing marker on the torus · Cmd+drag to orbit · Scroll to zoom
          </div>

          {/* Info panel */}
          <TorusInfoPanel
            params={torusParams}
            activePreset={torusParams.activePreset ?? -1}
          />

          {/* Controls panel */}
          <TorusControlsPanel
            params={torusParams}
            activePreset={torusParams.activePreset ?? -1}
            onParamsChange={handleParamsChange}
            onPresetSelect={handlePresetSelect}
            onReset={resetTorusParams}
          />
        </>
      )}
      <div style={{
        opacity: torusFocused ? 0 : 1,
        transition: 'opacity 0.35s',
        pointerEvents: torusFocused ? 'none' : 'auto',
      }}>
        <Routes>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/work" element={<main className="max-w-5xl mx-auto px-6 py-8 sm:py-12"><PageWrapper><Work /></PageWrapper></main>} />
        <Route path="/work/:slug" element={<main className="max-w-5xl mx-auto px-6 py-8 sm:py-12"><PageWrapper><Project /></PageWrapper></main>} />
        <Route path="/about" element={<main className="max-w-5xl mx-auto px-6 py-8 sm:py-12"><PageWrapper><About /></PageWrapper></main>} />
        <Route path="/creative" element={<main className="max-w-5xl mx-auto px-6 py-8 sm:py-12"><PageWrapper><Creative /></PageWrapper></main>} />
        <Route path="/creative/:slug" element={<main className="max-w-5xl mx-auto px-6 py-8 sm:py-12"><PageWrapper><Album /></PageWrapper></main>} />
      </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TorusProvider>
        <AppContent />
      </TorusProvider>
    </BrowserRouter>
  );
}
