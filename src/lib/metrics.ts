import { normalizeTemplate } from './normalize';
import type {
  ColumnSpacingPreset,
  DensityPreset,
  FontSizePreset,
  MarginPreset,
  PageSize,
  ResumeTemplate,
  SpacingPreset,
} from '../types/resume';

export interface PageDimensions {
  widthPt: number;
  heightPt: number;
  label: string;
}

export const PAGE_SIZES: Record<PageSize, PageDimensions> = {
  letter: { widthPt: 612, heightPt: 792, label: 'US Letter' },
  a4: { widthPt: 595.28, heightPt: 841.89, label: 'A4' },
  legal: { widthPt: 612, heightPt: 1008, label: 'US Legal' },
};

const MARGINS: Record<MarginPreset, { xPt: number; topPt: number; bottomPt: number }> = {
  narrow: { xPt: 28, topPt: 30, bottomPt: 30 },
  normal: { xPt: 44, topPt: 40, bottomPt: 40 },
  wide: { xPt: 58, topPt: 52, bottomPt: 52 },
};

const FONT_SCALES: Record<FontSizePreset, number> = {
  small: 0.93,
  standard: 1,
  large: 1.08,
};

const LINE_FACTORS: Record<SpacingPreset, number> = {
  compact: 1.22,
  standard: 1.37,
  relaxed: 1.52,
};

const COLUMN_GAPS: Record<ColumnSpacingPreset, number> = {
  narrow: 14,
  standard: 22,
  wide: 32,
};

const DENSITY_FACTORS: Record<DensityPreset, number> = {
  compact: 0.82,
  balanced: 1,
  spacious: 1.22,
};

const SECTION_SPACING: Record<SpacingPreset, { beforePt: number; afterPt: number }> = {
  compact: { beforePt: 10, afterPt: 3 },
  standard: { beforePt: 14, afterPt: 4 },
  relaxed: { beforePt: 19, afterPt: 6 },
};

const BULLET_SPACING: Record<SpacingPreset, number> = {
  compact: 0.5,
  standard: 1.2,
  relaxed: 2.6,
};

const WORD_LINE_TWIPS: Record<SpacingPreset, number> = {
  compact: 240,
  standard: 276,
  relaxed: 330,
};

const MAIN_COLUMN_RATIO = 0.6308;
const MIN_SIDE_WIDTH_PT = 100;

export interface ResolvedMetrics {
  pageWidthPt: number;
  pageHeightPt: number;
  pageSizeLabel: string;
  marginXPt: number;
  marginTopPt: number;
  marginBottomPt: number;
  contentWidthPt: number;
  mainWidthPt: number;
  sideWidthPt: number;
  gapPt: number;
  namePt: number;
  nameLinePt: number;
  headlinePt: number;
  headlineLinePt: number;
  bodyPt: number;
  bodyLinePt: number;
  smallPt: number;
  smallLinePt: number;
  headingPt: number;
  headingLinePt: number;
  sectionBeforePt: number;
  sectionAfterPt: number;
  itemBeforePt: number;
  paragraphAfterPt: number;
  bulletAfterPt: number;
  densityFactor: number;
  wordLineTwips: number;
}

export function resolveMetrics(template: ResumeTemplate): ResolvedMetrics {
  const normalized = normalizeTemplate(template);
  const page = PAGE_SIZES[normalized.pageSize];
  const margin = MARGINS[normalized.format.margins];
  const fontScale = FONT_SCALES[normalized.format.fontSize];
  const lineFactor = LINE_FACTORS[normalized.format.lineSpacing];
  const density = DENSITY_FACTORS[normalized.format.density];
  const section = SECTION_SPACING[normalized.format.sectionSpacing];

  const contentWidthPt = page.widthPt - margin.xPt * 2;
  const mainWidthPt = contentWidthPt * MAIN_COLUMN_RATIO;
  let gapPt = COLUMN_GAPS[normalized.format.columnSpacing];
  let sideWidthPt = contentWidthPt - mainWidthPt - gapPt;

  if (sideWidthPt < MIN_SIDE_WIDTH_PT) {
    gapPt = Math.max(8, contentWidthPt - mainWidthPt - MIN_SIDE_WIDTH_PT);
    sideWidthPt = contentWidthPt - mainWidthPt - gapPt;
  }

  const namePt = 23 * fontScale;
  const headlinePt = 10.5 * fontScale;
  const bodyPt = 9.2 * fontScale;
  const smallPt = 8.4 * fontScale;
  const headingPt = 10 * fontScale;

  return {
    pageWidthPt: page.widthPt,
    pageHeightPt: page.heightPt,
    pageSizeLabel: page.label,
    marginXPt: margin.xPt,
    marginTopPt: margin.topPt,
    marginBottomPt: margin.bottomPt,
    contentWidthPt,
    mainWidthPt,
    sideWidthPt,
    gapPt,
    namePt,
    nameLinePt: namePt * 1.17,
    headlinePt,
    headlineLinePt: headlinePt * 1.24,
    bodyPt,
    bodyLinePt: bodyPt * lineFactor,
    smallPt,
    smallLinePt: smallPt * 1.33,
    headingPt,
    headingLinePt: headingPt * 1.3,
    sectionBeforePt: section.beforePt * density,
    sectionAfterPt: section.afterPt * density,
    itemBeforePt: 7 * density,
    paragraphAfterPt: 3 * density,
    bulletAfterPt: BULLET_SPACING[normalized.format.bulletSpacing] * density,
    densityFactor: density,
    wordLineTwips: WORD_LINE_TWIPS[normalized.format.lineSpacing],
  };
}
