import { describe, expect, it } from 'vitest';
import { faviconForTheme, headerMarkForTheme } from '../src/lib/themeAssets';
import { DEFAULT_DOCUMENT_ACCENT, DOCUMENT_ACCENTS, documentAccentName } from '../src/lib/tokens';

describe('document accent palette', () => {
  it('keeps the existing green as the default', () => {
    expect(DEFAULT_DOCUMENT_ACCENT).toBe('#14532D');
    expect(DOCUMENT_ACCENTS[0]).toEqual({ name: 'Green', value: '#14532D' });
  });

  it('provides nine distinct named colours', () => {
    expect(DOCUMENT_ACCENTS).toHaveLength(9);
    expect(new Set(DOCUMENT_ACCENTS.map((accent) => accent.value)).size).toBe(9);
    for (const accent of DOCUMENT_ACCENTS) {
      expect(accent.name.length).toBeGreaterThan(0);
      expect(accent.value).toMatch(/^#[0-9A-F]{6}$/);
      expect(documentAccentName(accent.value)).toBe(accent.name);
    }
  });
});

describe('single brand mark across themes', () => {
  it('uses the light artwork in both interfaces', () => {
    for (const theme of ['light', 'dark'] as const) {
      expect(headerMarkForTheme(theme)).toBe('/icon-192.png');
      expect(faviconForTheme(16, theme)).toBe('/favicon-16.png');
      expect(faviconForTheme(32, theme)).toBe('/favicon-32.png');
    }
  });

  it('never references the near-black variants in the interface', () => {
    for (const theme of ['light', 'dark'] as const) {
      expect(headerMarkForTheme(theme)).not.toContain('-dark');
      expect(faviconForTheme(16, theme)).not.toContain('-dark');
      expect(faviconForTheme(32, theme)).not.toContain('-dark');
    }
  });
});
