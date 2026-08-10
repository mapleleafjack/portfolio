# Portfolio — Vite + React + Three.js

Personal portfolio site built with React 18, Vite, Three.js, and Tailwind CSS.

## Structure

```
src/
├── main.jsx              # Entry point
├── App.jsx               # Root component (routing, state)
├── index.css             # Tailwind + CSS custom properties (theme tokens)
├── context/              # React contexts
│   ├── ThemeContext.jsx   # Dark/light/system theme
│   └── TorusContext.jsx   # Torus knot explorer state
├── hooks/
│   └── useThreeScene.js   # Three.js scene lifecycle hook
├── pages/                # Route-level page components
│   ├── Home.jsx
│   ├── Work.jsx
│   ├── Project.jsx
│   ├── Creative.jsx
│   ├── About.jsx
│   └── Album.jsx
├── components/
│   ├── ThreeBackground.jsx  # 3D scene orchestrator
│   ├── ui/                  # UI overlays
│   │   ├── Nav.jsx
│   │   ├── CursorTrail.jsx
│   │   ├── ColorShift.jsx
│   │   ├── TorusInfoPanel.jsx
│   │   ├── TorusControlsPanel.jsx
│   │   └── TorusExplorer.jsx
│   └── three/              # Three.js scene modules
│       ├── shared.js        # Colour & theme utilities
│       ├── torus/           # Torus knot explorer
│       ├── planet/          # Planet system + billboard
│       ├── scene/           # Scene objects (cubes, saucer, etc.)
│       └── interaction/     # Hover, labels, zoom
├── data/                   # Static data
│   ├── index.js             # Portfolio content (projects, brands, etc.)
│   ├── planets.json         # Planet config + constellation data
│   └── colors.json          # Colour palette
└── torus/                   # Standalone torus engine (dynamic import)
    └── TorusEngine.js
```

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run lint` — Lint with ESLint
