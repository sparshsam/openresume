import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { THEME_KEY, ThemeContext, getInitialTheme, type Theme } from '../lib/theme';
import { faviconForTheme } from '../lib/themeAssets';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;

    const themeColor = theme === 'dark' ? '#0f1210' : '#f4f5f2';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);

    document.querySelectorAll<HTMLLinkElement>('link[data-favicon]').forEach((link) => {
      const size = link.dataset.favicon;
      if (size !== '16' && size !== '32') return;
      link.href = faviconForTheme(size === '16' ? 16 : 32, theme);
    });
  }, [theme]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      try {
        if (!localStorage.getItem(THEME_KEY)) setTheme(event.matches ? 'dark' : 'light');
      } catch {
        setTheme(event.matches ? 'dark' : 'light');
      }
    };
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((previous) => {
      const next: Theme = previous === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      document.documentElement.style.colorScheme = next;
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // The theme still applies for this session if storage is unavailable.
      }
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
