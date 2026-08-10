import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

/**
 * Returns the initial theme setting:
 *   'dark' | 'light' — explicit user choice from localStorage
 *   'system'          — follow OS preference
 */
function getInitialTheme() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* localStorage unavailable (SSR / privacy mode) */ }
  return 'system';
}

/**
 * Resolves the abstract theme value to concrete 'dark' | 'light'.
 */
function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

/**
 * Applies the resolved theme to the DOM.
 * Returns the resolved value ('dark' | 'light').
 */
function applyTheme(theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  return resolved;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(getInitialTheme()));

  // Sync DOM class and localStorage whenever `theme` changes
  useEffect(() => {
    const resolved = applyTheme(theme);
    setResolvedTheme(resolved);
    try {
      if (theme !== 'system') {
        localStorage.setItem('theme', theme);
      } else {
        localStorage.removeItem('theme');
      }
    } catch { /* ignore */ }
  }, [theme]);

  // Listen for system preference changes when theme === 'system'
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        const resolved = resolveTheme('system');
        setResolvedTheme(resolved);
        document.documentElement.classList.toggle('dark', resolved === 'dark');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  /**
   * Toggle between dark and light.
   * If currently following system preference, the toggle flips AWAY from
   * the current resolved appearance and stores the explicit choice.
   */
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const currentResolved = resolveTheme(prev);
      return currentResolved === 'dark' ? 'light' : 'dark';
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access the current theme and toggle function.
 * Must be used within <ThemeProvider>.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within <ThemeProvider>');
  }
  return ctx;
}
