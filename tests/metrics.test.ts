import { describe, expect, it } from 'vitest';
import { PAGE_SIZES, resolveMetrics } from '../src/lib/metrics';
import { normalizeFormat, normalizeTemplate } from '../src/lib/normalize';
import {
  DEFAULT_FORMAT,
  DEFAULT_TEMPLATE,
  type ColumnSpacingPreset,
  type FormatSettings,
  type MarginPreset,
  type PageSize,
  type ResumeTemplate,
} from '../src/types/resume';

function template(
  format: Partial<FormatSettings> = {},
  pageSize: PageSize = 'letter',
): ResumeTemplate {
  return { ...DEFAULT_TEMPLATE, pageSize, format: { ...DEFAULT_FORMAT, ...format } };
}

describe('resolveMetrics', () => {
  it('supports US Letter, A4, and US Legal', () => {
    expect(PAGE_SIZES.letter).toMatchObject({ widthPt: 612, heightPt: 792 });
    expect(PAGE_SIZES.a4.widthPt).toBeCloseTo(595.28, 2);
    expect(PAGE_SIZES.a4.heightPt).toBeCloseTo(841.89, 2);
    expect(PAGE_SIZES.legal).toMatchObject({ widthPt: 612, heightPt: 1008 });
    expect(resolveMetrics(template()).pageSizeLabel).toBe('US Letter');
    expect(resolveMetrics(template({}, 'a4')).pageSizeLabel).toBe('A4');
    expect(resolveMetrics(template({}, 'legal')).pageSizeLabel).toBe('US Legal');
  });

  it('defaults to US Letter', () => {
    expect(DEFAULT_TEMPLATE.pageSize).toBe('letter');
    expect(resolveMetrics(DEFAULT_TEMPLATE)).toMatchObject({
      pageWidthPt: 612,
      pageHeightPt: 792,
    });
  });

  it('changes margins without changing the page', () => {
    const narrow = resolveMetrics(template({ margins: 'narrow' }));
    const wide = resolveMetrics(template({ margins: 'wide' }));
    expect(narrow.marginXPt).toBeLessThan(wide.marginXPt);
    expect(narrow.contentWidthPt).toBeGreaterThan(wide.contentWidthPt);
    expect(narrow.pageWidthPt).toBe(wide.pageWidthPt);
  });

  it('changes font sizes and their line heights', () => {
    const small = resolveMetrics(template({ fontSize: 'small' }));
    const large = resolveMetrics(template({ fontSize: 'large' }));
    expect(small.bodyPt).toBeLessThan(large.bodyPt);
    expect(small.namePt).toBeLessThan(large.namePt);
    expect(small.bodyLinePt).toBeLessThan(large.bodyLinePt);
  });

  it('changes line spacing without changing font size', () => {
    const compact = resolveMetrics(template({ lineSpacing: 'compact' }));
    const relaxed = resolveMetrics(template({ lineSpacing: 'relaxed' }));
    expect(compact.bodyPt).toBe(relaxed.bodyPt);
    expect(compact.bodyLinePt).toBeLessThan(relaxed.bodyLinePt);
  });

  it('changes section, bullet, and column spacing independently', () => {
    const compact = resolveMetrics(
      template({ sectionSpacing: 'compact', bulletSpacing: 'compact', columnSpacing: 'narrow' }),
    );
    const relaxed = resolveMetrics(
      template({ sectionSpacing: 'relaxed', bulletSpacing: 'relaxed', columnSpacing: 'wide' }),
    );
    expect(compact.sectionBeforePt).toBeLessThan(relaxed.sectionBeforePt);
    expect(compact.bulletAfterPt).toBeLessThan(relaxed.bulletAfterPt);
    expect(compact.gapPt).toBeLessThan(relaxed.gapPt);
    expect(compact.mainWidthPt).toBe(relaxed.mainWidthPt);
  });

  it('composes density with individual spacing instead of overriding it', () => {
    const compactDensity = resolveMetrics(
      template({ density: 'compact', sectionSpacing: 'relaxed' }),
    );
    const spaciousDensity = resolveMetrics(
      template({ density: 'spacious', sectionSpacing: 'relaxed' }),
    );
    expect(compactDensity.bodyLinePt).toBe(spaciousDensity.bodyLinePt);
    expect(compactDensity.sectionBeforePt).toBeLessThan(spaciousDensity.sectionBeforePt);
    expect(compactDensity.bulletAfterPt).toBeLessThan(spaciousDensity.bulletAfterPt);
  });

  it('keeps column geometry valid for every page, margin, and gap combination', () => {
    const pages: PageSize[] = ['letter', 'a4', 'legal'];
    const margins: MarginPreset[] = ['narrow', 'normal', 'wide'];
    const gaps: ColumnSpacingPreset[] = ['narrow', 'standard', 'wide'];

    for (const pageSize of pages) {
      for (const margin of margins) {
        for (const columnSpacing of gaps) {
          const metrics = resolveMetrics(template({ margins: margin, columnSpacing }, pageSize));
          expect(metrics.sideWidthPt).toBeGreaterThanOrEqual(100 - 1e-6);
          expect(metrics.mainWidthPt + metrics.sideWidthPt + metrics.gapPt).toBeCloseTo(
            metrics.contentWidthPt,
            5,
          );
          expect(metrics.mainWidthPt).toBeGreaterThan(metrics.sideWidthPt);
        }
      }
    }
  });
});

describe('normalize', () => {
  it('fills missing format settings with defaults', () => {
    expect(normalizeFormat(undefined)).toEqual(DEFAULT_FORMAT);
    expect(normalizeFormat({})).toEqual(DEFAULT_FORMAT);
  });

  it('keeps valid settings and rejects invalid ones', () => {
    expect(
      normalizeFormat({ fontSize: 'large', margins: 'wide', density: 'compact' }),
    ).toMatchObject({ fontSize: 'large', margins: 'wide', density: 'compact' });
    expect(
      normalizeFormat({ fontSize: 'huge', margins: 'giant', density: 'unknown' }),
    ).toEqual(DEFAULT_FORMAT);
  });

  it('upgrades a v0.1.0 template without losing its page size', () => {
    const upgraded = normalizeTemplate({ pageSize: 'a4', accent: '#099019' });
    expect(upgraded.pageSize).toBe('a4');
    expect(upgraded.accent).toBe('#099019');
    expect(upgraded.format).toEqual(DEFAULT_FORMAT);
  });

  it('falls back to US Letter for an unknown page size', () => {
    expect(normalizeTemplate({ pageSize: 'tabloid' }).pageSize).toBe('letter');
  });
});
