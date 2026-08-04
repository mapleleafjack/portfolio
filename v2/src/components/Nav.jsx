import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export default function Nav() {
  const { pathname } = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <nav className="px-6 sm:px-10 pt-4 sm:pt-6 pb-4 flex items-center gap-x-6 text-sm">
      <Link to="/" className="font-semibold link-underline mr-auto flex items-center gap-2">
        <img src="/images/octopus_bw.png" alt="" className="w-5 h-5 opacity-70 invert" />
        Jack Musajo
      </Link>
      <Link to="/work" className={`link-underline${pathname === '/work' ? ' font-medium' : ''}`}>Work</Link>
      <Link to="/about" className={`link-underline${pathname === '/about' ? ' font-medium' : ''}`}>About</Link>
      <Link to="/creative" className={`link-underline${pathname === '/creative' ? ' font-medium' : ''}`}>Creative</Link>
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
