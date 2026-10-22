import type { Theme } from './theme';

/**
 * The header mark and favicons use the light artwork in both interface themes.
 * The near-black variant proved hard to read against the light interface, so
 * the visible light mark is now shown consistently regardless of theme.
 *
 * The dark variants remain generated and shipped for app icons and social
 * cards; the in-app header and favicon mapping deliberately does not use them.
 *
 * The `Theme` parameter is retained so callers keep one explicit contract.
 */
export function headerMarkForTheme(_theme: Theme): string {
  return '/icon-192.png';
}

export function faviconForTheme(size: 16 | 32, _theme: Theme): string {
  return `/favicon-${size}.png`;
}
