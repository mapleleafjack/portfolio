import { useCallback, useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import Nav from './components/ui/Nav';
import Home from './pages/Home';
import Work from './pages/Work';
import Project from './pages/Project';
import Creative from './pages/Creative';
import About from './pages/About';
import Album from './pages/Album';
import CursorTrail from './components/ui/CursorTrail';
import ColorShift from './components/ui/ColorShift';
import ThreeBackground from './components/ThreeBackground';
import TorusInfoPanel from './components/ui/TorusInfoPanel';
import TorusControlsPanel from './components/ui/TorusControlsPanel';
import { PRESETS as TORUS_PRESETS } from './components/three/torus/TorusKnotData';
import { TorusProvider, useTorus } from './context/TorusContext';
import { ThemeProvider } from './context/ThemeContext';

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

  // ── Saucer cockpit state ─────────────────────────
  const [saucerFocused, setSaucerFocused] = useState(false);
  const enterSaucerCockpit = useCallback(() => setSaucerFocused(true), []);
  const exitSaucerCockpit = useCallback(() => setSaucerFocused(false), []);

  // ── Planet constellation detail overlay ──────────
  const [planetDetail, setPlanetDetail] = useState(null);
  const handlePlanetItemClick = useCallback((data) => {
    setPlanetDetail(data);
  }, []);

  // ── Planet zoom state (drives Nav visibility + ESC, replaced ChartPanel) ──
  const [planetZoomed, setPlanetZoomed] = useState(false);
  const [activePlanet, setActivePlanet] = useState(null); // 'work' | 'craft' | 'music' | 'play' | null
  const [planetZoomOutSignal, setPlanetZoomOutSignal] = useState(0);
  const [planetZoomInSignal, setPlanetZoomInSignal] = useState(0);
  const planetZoomInTargetRef = useRef(null);
  const navigate = useNavigate();

  const handleConstellationHover = useCallback((data) => {
    // Hover data flows to the 3D billboard via ThreeBackground, no React state needed
  }, []);

  const handlePlanetZoomChange = useCallback((data) => {
    if (data && data.phase === 'open' && data.planetId) {
      setPlanetZoomed(true);
      setActivePlanet(data.planetId);
    } else if (data && data.phase === 'none') {
      setPlanetZoomed(false);
      setActivePlanet(null);
    }
  }, []);

  // ── Nav click: zoom to planet (or toggle if already zoomed) ──
  const handleNavClick = useCallback((planetId) => {
    // If on a sub-page, navigate home first — planet zoom will follow
    if (window.location.pathname !== '/') {
      navigate('/');
    }
    // Signal ThreeBackground to zoom to this planet (counter pattern for re-trigger)
    planetZoomInTargetRef.current = planetId;
    setPlanetZoomInSignal(s => s + 1);
    setPlanetDetail(null);
  }, [navigate]);

  const requestZoomOut = useCallback(() => {
    setPlanetZoomOutSignal(s => s + 1);
  }, []);

  const handleBillboardClick = useCallback((link) => {
    navigate(link);
  }, [navigate]);

  // ── Home/logo click: zoom out to galaxy view ──────
  const handleHomeClick = useCallback(() => {
    if (window.location.pathname !== '/') {
      navigate('/');
    }
    if (planetZoomed) {
      requestZoomOut();
    }
  }, [navigate, planetZoomed, requestZoomOut]);

  // ── ESC key to exit torus focus / planet zoom ──────
  useEffect(() => {
    if (!torusFocused && !planetZoomed) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (torusFocused) closeTorus();
        else if (planetZoomed) requestZoomOut();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [torusFocused, closeTorus, planetZoomed, requestZoomOut]);

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
        saucerFocused={saucerFocused}
        onSaucerEnter={enterSaucerCockpit}
        onSaucerExit={exitSaucerCockpit}
        onPlanetItemClick={handlePlanetItemClick}
        onConstellationHover={handleConstellationHover}
        onPlanetZoomChange={handlePlanetZoomChange}
        onBillboardClick={handleBillboardClick}
        planetZoomOutSignal={planetZoomOutSignal}
        planetZoomInSignal={planetZoomInSignal}
        planetZoomInTarget={planetZoomInTargetRef.current}
      />
      {/* Subtle vignette behind torus in explore mode */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at center, var(--vignette-from) 0%, var(--vignette-to) 70%)',
        opacity: torusFocused ? 1 : 0,
        transition: 'opacity 0.35s',
        pointerEvents: 'none',
      }} />

      <CursorTrail />
      <div style={{
        opacity: (torusFocused || saucerFocused || planetZoomed) ? 0 : 1,
        transition: 'opacity 0.35s',
        pointerEvents: (torusFocused || saucerFocused || planetZoomed) ? 'none' : 'auto',
      }}>
        <Nav onNavClick={handleNavClick} activePlanet={activePlanet} onHomeClick={handleHomeClick} />
      </div>

      {/* ── Torus Explore Overlays ────────────────────── */}
      {torusFocused && (
        <>
          {/* Back button */}
          <button
            onClick={closeTorus}
            style={{
              position: 'fixed', top: 12, left: 16, zIndex: 125,
              fontSize: 11, color: 'var(--overlay-text)',
              background: 'var(--overlay-bg)',
              border: '1px solid var(--border)',
              padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transition: 'all 0.2s',
              fontFamily: "'Oxanium', sans-serif",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--overlay-bg-hover)';
              e.currentTarget.style.color = 'var(--overlay-text-hover)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--overlay-bg)';
              e.currentTarget.style.color = 'var(--overlay-text)';
            }}
          >
            ← Back to Galaxy
          </button>

          {/* Hint */}
          <div style={{
            position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
            fontSize: 9.5, color: 'var(--hint-text)', letterSpacing: '0.03em',
            background: 'var(--hint-bg)',
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

      {/* ── Planet Detail Overlay (hidden when planet is zoomed) ── */}
      {planetDetail && !planetZoomed && (
        <div
          style={{
            position: 'fixed',
            left: `${planetDetail.screenX}px`,
            top: `${planetDetail.screenY}px`,
            transform: 'translate(-50%, -115%)',
            zIndex: 100,
            maxWidth: 280,
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '14px 16px',
            boxShadow: '0 8px 32px var(--shadow-lg)',
            fontFamily: "'Oxanium', sans-serif",
          }}
          onClick={() => setPlanetDetail(null)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              {planetDetail.planetId}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setPlanetDetail(null); }}
              className="text-gray-400 hover:text-gray-600 transition-colors text-sm leading-none"
            >
              ✕
            </button>
          </div>
          <h3 className="font-semibold text-sm text-[var(--text)] mb-1">{planetDetail.label}</h3>
          {planetDetail.detail && (
            <p className="text-xs text-gray-500 leading-relaxed mb-2">{planetDetail.detail}</p>
          )}
          {planetDetail.link && (
            <Link
              to={planetDetail.link}
              className="text-xs link-underline text-accent"
              onClick={() => setPlanetDetail(null)}
            >
              View more →
            </Link>
          )}
        </div>
      )}

      <div style={{
        opacity: (torusFocused || saucerFocused || planetZoomed) ? 0 : 1,
        transition: 'opacity 0.35s',
        pointerEvents: (torusFocused || saucerFocused || planetZoomed) ? 'none' : 'auto',
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
      <ThemeProvider>
        <TorusProvider>
          <AppContent />
        </TorusProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
