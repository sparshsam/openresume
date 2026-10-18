export interface DocumentAccent {
  name: string;
  value: string;
}

/** Restrained, print-friendly accent palette for generated documents. */
export const DOCUMENT_ACCENTS: DocumentAccent[] = [
  { name: 'Green', value: '#14532D' },
  { name: 'Blue', value: '#1D4ED8' },
  { name: 'Navy', value: '#1E3A5F' },
  { name: 'Teal', value: '#0F766E' },
  { name: 'Purple', value: '#5B21B6' },
  { name: 'Red', value: '#991B1B' },
  { name: 'Orange', value: '#9A3412' },
  { name: 'Brown', value: '#78350F' },
  { name: 'Charcoal', value: '#374151' },
];

export const DEFAULT_DOCUMENT_ACCENT = DOCUMENT_ACCENTS[0].value;

export function documentAccentName(value: string): string | undefined {
  return DOCUMENT_ACCENTS.find((accent) => accent.value === value)?.name;
}

/**
 * Shared document colors. Geometry and typography are resolved per document
 * from `Resume.template` in `src/lib/metrics.ts`.
 */
export const COLORS = {
  accent: DEFAULT_DOCUMENT_ACCENT,
  text: '#1A1A1A',
  muted: '#555555',
  rule: '#D5DED7',
} as const;
