import { createContext, useContext, useState, useCallback } from 'react';
import { PRESETS } from './components/three/TorusKnotData';

// ── Random preset on each page load ────────────────────
const PRESET_LIST = PRESETS || [];
const randomPresetIdx = PRESET_LIST.length > 0
  ? Math.floor(Math.random() * PRESET_LIST.length)
  : -1;
const randomPreset = randomPresetIdx >= 0 ? PRESET_LIST[randomPresetIdx] : null;

const DEFAULT_TORUS_PARAMS = randomPreset
  ? {
      ...randomPreset.params,
      tubularSegments: 200,
      radialSegments: 24,
      showWireframe: true,
      showFieldLines: true,
      showLattice: true,
      morphValue: 0,
      activePreset: randomPresetIdx,
    }
  : {
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
      activePreset: -1,
    };

const TorusContext = createContext(null);

export function TorusProvider({ children }) {
  const [torusFocused, setTorusFocused] = useState(false);
  const [torusParams, setTorusParams] = useState(DEFAULT_TORUS_PARAMS);

  const openTorus = useCallback(() => setTorusFocused(true), []);
  const closeTorus = useCallback(() => setTorusFocused(false), []);

  const updateTorusParams = useCallback((partial) => {
    setTorusParams(prev => ({ ...prev, ...partial }));
  }, []);

  const applyPreset = useCallback((presetIdx, presetParams) => {
    setTorusParams(prev => ({
      ...prev,
      ...presetParams,
      activePreset: presetIdx,
      morphValue: 0,
    }));
  }, []);

  const resetTorusParams = useCallback(() => {
    setTorusParams({ ...DEFAULT_TORUS_PARAMS });
  }, []);

  return (
    <TorusContext.Provider value={{
      torusFocused,
      torusParams,
      openTorus,
      closeTorus,
      updateTorusParams,
      applyPreset,
      resetTorusParams,
    }}>
      {children}
    </TorusContext.Provider>
  );
}

export function useTorus() {
  const ctx = useContext(TorusContext);
  if (!ctx) throw new Error('useTorus must be used within TorusProvider');
  return ctx;
}

export { DEFAULT_TORUS_PARAMS };
