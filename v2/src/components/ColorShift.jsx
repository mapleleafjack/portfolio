import { useEffect } from 'react';

/* Sets a bold accent colour randomly on each page load. */

const COLORS = [
  '#f0c830', // yellow
  '#e05a2b', // orange-red
  '#d946ef', // magenta
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#ef4444', // red
];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export default function ColorShift() {
  useEffect(() => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const [r, g, b] = hexToRgb(color);
    const root = document.documentElement;
    root.style.setProperty('--accent', color);
    root.style.setProperty('--accent-r', r);
    root.style.setProperty('--accent-g', g);
    root.style.setProperty('--accent-b', b);
  }, []);

  return null;
}
