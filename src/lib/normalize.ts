import {
  DEFAULT_FORMAT,
  DEFAULT_TEMPLATE,
  type ColumnSpacingPreset,
  type DensityPreset,
  type FontSizePreset,
  type FormatSettings,
  type MarginPreset,
  type PageSize,
  type ResumeTemplate,
  type SpacingPreset,
} from '../types/resume';

const PAGE_SIZES = new Set<PageSize>(['letter', 'a4', 'legal']);
const MARGINS = new Set<MarginPreset>(['narrow', 'normal', 'wide']);
const FONT_SIZES = new Set<FontSizePreset>(['small', 'standard', 'large']);
const SPACING = new Set<SpacingPreset>(['compact', 'standard', 'relaxed']);
const COLUMN_SPACING = new Set<ColumnSpacingPreset>(['narrow', 'standard', 'wide']);
const DENSITY = new Set<DensityPreset>(['compact', 'balanced', 'spacious']);

function pick<T extends string>(value: unknown, allowed: Set<T>, fallback: T): T {
  return typeof value === 'string' && allowed.has(value as T) ? (value as T) : fallback;
}

export function normalizeFormat(value: unknown): FormatSettings {
  const source =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  return {
    margins: pick(source.margins, MARGINS, DEFAULT_FORMAT.margins),
    fontSize: pick(source.fontSize, FONT_SIZES, DEFAULT_FORMAT.fontSize),
    lineSpacing: pick(source.lineSpacing, SPACING, DEFAULT_FORMAT.lineSpacing),
    sectionSpacing: pick(source.sectionSpacing, SPACING, DEFAULT_FORMAT.sectionSpacing),
    bulletSpacing: pick(source.bulletSpacing, SPACING, DEFAULT_FORMAT.bulletSpacing),
    columnSpacing: pick(source.columnSpacing, COLUMN_SPACING, DEFAULT_FORMAT.columnSpacing),
    density: pick(source.density, DENSITY, DEFAULT_FORMAT.density),
  };
}

export function normalizeTemplate(value: unknown): ResumeTemplate {
  const source =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  return {
    pageSize: pick(source.pageSize, PAGE_SIZES, DEFAULT_TEMPLATE.pageSize),
    accent:
      typeof source.accent === 'string' && source.accent.trim()
        ? source.accent
        : DEFAULT_TEMPLATE.accent,
    format: normalizeFormat(source.format),
  };
}
