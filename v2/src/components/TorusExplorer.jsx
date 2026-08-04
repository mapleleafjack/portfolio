import { useEffect, useRef, useState } from 'react';

/**
 * Full-screen overlay hosting the TorusEngine.
 * TorusEngine is dynamically imported to keep it out of the main bundle.
 */
export default function TorusExplorer({ isOpen, onClose, initialParams = {}, onParamsChange }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const [visible, setVisible] = useState(false);   // actually in DOM with opacity
  const [active, setActive] = useState(false);      // transition target

  // ── Open / close transitions ──────────────────────────
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      // Force layout then kick transition
      requestAnimationFrame(() => requestAnimationFrame(() => setActive(true)));
    } else {
      setActive(false);
      // Wait for transition to finish before removing from DOM
      const timer = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ── ESC key ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // ── Engine lifecycle (dynamic import keeps TorusEngine out of main bundle) ─
  const onParamsChangeRef = useRef(onParamsChange);
  onParamsChangeRef.current = onParamsChange;

  useEffect(() => {
    let cancelled = false;

    if (!visible) {
      if (engineRef.current) {
        try { engineRef.current.dispose(); } catch (e) { console.warn('TorusEngine dispose error:', e); }
        engineRef.current = null;
      }
      return;
    }

    if (!canvasRef.current || !containerRef.current) return;
    if (engineRef.current) return; // already running

    import('../torus/TorusEngine').then(({ createTorusEngine }) => {
      if (cancelled || !canvasRef.current || !containerRef.current) return;
      const engine = createTorusEngine(canvasRef.current, containerRef.current, {
        initialParams,
        darkBackground: true,
        onStateChange: (params) => {
          onParamsChangeRef.current?.(params);
        },
      });
      engineRef.current = engine;
    });

    return () => { cancelled = true; };
  }, [visible]);

  // Sync initialParams into running engine when they change externally
  const prevParamsRef = useRef(null);
  useEffect(() => {
    if (!engineRef.current || !visible) return;
    const key = JSON.stringify({ p: initialParams.p, q: initialParams.q, color: initialParams.color, radius: initialParams.radius, tube: initialParams.tube });
    if (prevParamsRef.current !== key) {
      prevParamsRef.current = key;
      engineRef.current.updateParams(initialParams);
    }
  }, [initialParams, visible]);

  // ── Full cleanup on unmount ───────────────────────────
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        try { engineRef.current.dispose(); } catch (e) { console.warn('TorusEngine unmount dispose error:', e); }
        engineRef.current = null;
      }
    };
  }, []);

  // ── Don't render anything when not needed ─────────────
  if (!visible) return null;

  return (
    <>
      {/* Darken backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: 'var(--backdrop)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          opacity: active ? 1 : 0,
          transition: 'opacity 400ms ease-out',
          pointerEvents: active ? 'auto' : 'none',
        }}
      />

      {/* Torus overlay */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          opacity: active ? 1 : 0,
          transform: active ? 'scale(1)' : 'scale(0.97)',
          transition: 'opacity 400ms ease-out, transform 400ms ease-out',
          pointerEvents: active ? 'auto' : 'none',
          overflow: 'hidden',
        }}
      >
        {/* Canvas — TorusEngine renders here */}
        <canvas
          ref={canvasRef}
          style={{
            display: 'block', position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
          }}
        />

        {/* Back button */}
        <button
          onClick={onClose}
          style={{
            position: 'fixed', top: 12, left: 16, zIndex: 125,
            fontSize: 12, color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.2s',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >
          ← Back to Galaxy
        </button>
      </div>
    </>
  );
}
