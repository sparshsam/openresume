import type { Theme } from './theme';

/**
 * The generated light and dark artwork is intentionally cross-assigned:
 * light interfaces use the dark-background asset, and dark interfaces use the
 * light-background asset. Keep the source files and generator names unchanged.
 */
export function headerMarkForTheme(theme: Theme): string {
  return theme === 'dark' ? '/icon-192.png' : '/icon-192-dark.png';
}

export function faviconForTheme(size: 16 | 32, theme: Theme): string {
  return theme === 'dark' ? `/favicon-${size}.png` : `/favicon-${size}-dark.png`;
}
