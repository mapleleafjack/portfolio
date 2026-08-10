import { useEffect } from 'react';
import colors from '../../data/colors.json';

/* Sets a bold accent colour randomly on each page load. */

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export default function ColorShift() {
  useEffect(() => {
    const palette = colors.accentPalette;
    const color = palette[Math.floor(Math.random() * palette.length)];
    const [r, g, b] = hexToRgb(color);
    const root = document.documentElement;
    root.style.setProperty('--accent', color);
    root.style.setProperty('--accent-r', r);
    root.style.setProperty('--accent-g', g);
    root.style.setProperty('--accent-b', b);
  }, []);

  return null;
}
