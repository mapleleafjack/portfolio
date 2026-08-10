import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export default function Nav({ onNavClick, activePlanet, onHomeClick }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const navItemClass = (planetId) =>
    `link-underline cursor-pointer${activePlanet === planetId ? ' font-medium' : ''}`;

  return (
    <nav className="px-6 sm:px-10 pt-4 sm:pt-6 pb-4 flex items-center gap-x-6 text-sm">
      <button onClick={onHomeClick} className="font-semibold link-underline mr-auto flex items-center gap-2 cursor-pointer">
        <img src={isDark ? '/images/octopus_white.png' : '/images/octopus_bw.png'} alt="" className="w-5 h-5 opacity-70" />
        Jack Musajo
      </button>
      <button onClick={() => onNavClick?.('work')} className={navItemClass('work')}>Work</button>
      <button onClick={() => onNavClick?.('craft')} className={navItemClass('craft')}>Craft</button>
      <button onClick={() => onNavClick?.('music')} className={navItemClass('music')}>Music</button>
      <button onClick={() => onNavClick?.('play')} className={navItemClass('play')}>Play</button>
      <button
        onClick={toggleTheme}
        className="p-1.5 rounded-full transition-all duration-300 hover:bg-[var(--input-bg)]"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ color: 'var(--text-muted)' }}
      >
        <span className="block transition-transform duration-500" style={{ transform: isDark ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </span>
      </button>
    </nav>
  );
}
