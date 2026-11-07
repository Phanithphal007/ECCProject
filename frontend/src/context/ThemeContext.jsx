import { useState, useEffect, useCallback } from 'react';
import { ThemeContext } from './ThemeContextInstance';

const STORAGE_KEY = 'edumanage-theme';

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system';
    } catch {
      return 'system';
    }
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Calculate resolved theme reactively
  const resolvedTheme = theme === 'dark' || (theme === 'system' && systemPrefersDark) ? 'dark' : 'light';

  // Apply resolved theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [resolvedTheme]);

  // Listen to OS system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  // Set theme & persist to localStorage
  const setTheme = useCallback((newTheme) => {
    const validTheme = newTheme === 'light' || newTheme === 'dark' || newTheme === 'system' ? newTheme : 'system';
    setThemeState(validTheme);
    try {
      localStorage.setItem(STORAGE_KEY, validTheme);
    } catch (e) {
      console.warn('Could not persist theme preference:', e);
    }
  }, []);

  // Toggle helper
  const toggleTheme = useCallback(() => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
