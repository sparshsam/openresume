import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { createDocxDocument } from '../src/lib/exportDocx';
import { createPdfDocument } from '../src/lib/exportPdf';
import { resumeMeta } from '../src/lib/documentMeta';
import { layoutResume } from '../src/lib/layout';
import { resolveMetrics } from '../src/lib/metrics';
import { createSampleResume } from '../src/lib/sample';
import { COLORS } from '../src/lib/tokens';
import { DEFAULT_TEMPLATE, type Resume } from '../src/types/resume';

function channel(hex: string, offset: number): number {
  return Number.parseInt(hex.replace('#', '').slice(offset, offset + 2), 16) / 255;
}

function luminance(hex: string): number {
  const linear = [0, 2, 4].map((offset) => {
    const value = channel(hex, offset);
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function withAts(): Resume {
  const sample = createSampleResume();
  return { ...sample, template: { ...sample.template, layout: 'atsSimple' } };
}

describe('secondary text readability', () => {
  it('sets secondary text at a readable size with generous leading', () => {
    const metrics = resolveMetrics(DEFAULT_TEMPLATE);
    expect(metrics.smallPt).toBeGreaterThanOrEqual(8.8);
    expect(metrics.smallLinePt).toBeGreaterThanOrEqual(metrics.smallPt * 1.35);
    expect(metrics.smallPt).toBeLessThan(metrics.bodyPt);
  });

  it('keeps muted text at AAA contrast on white', () => {
    expect(contrastRatio(COLORS.muted, '#FFFFFF')).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(COLORS.text, '#FFFFFF')).toBeGreaterThanOrEqual(12);
  });
});

describe('section and entry spacing', () => {
  it('gives sections clear separation without breaking density', () => {
    const metrics = resolveMetrics(DEFAULT_TEMPLATE);
    expect(metrics.sectionBeforePt).toBeGreaterThanOrEqual(16);
    expect(metrics.sectionAfterPt).toBeGreaterThanOrEqual(5);
    expect(metrics.sectionBeforePt).toBeLessThanOrEqual(20);
  });

  it('separates experience entries and still composes with density', () => {
    const compact = resolveMetrics({
      ...DEFAULT_TEMPLATE,
      format: { ...DEFAULT_TEMPLATE.format, density: 'compact' },
    });
    const balanced = resolveMetrics(DEFAULT_TEMPLATE);
    const spacious = resolveMetrics({
      ...DEFAULT_TEMPLATE,
      format: { ...DEFAULT_TEMPLATE.format, density: 'spacious' },
    });

    expect(balanced.itemBeforePt).toBeGreaterThanOrEqual(9);
    expect(compact.itemBeforePt).toBeLessThan(balanced.itemBeforePt);
    expect(spacious.itemBeforePt).toBeGreaterThan(balanced.itemBeforePt);
  });

  it('keeps the dense sample on a professional page budget', () => {
    const twoColumn = layoutResume(createSampleResume());
    const ats = layoutResume(withAts());
    expect(twoColumn.pages.length).toBe(1);
    expect(ats.pages.length).toBeLessThanOrEqual(2);
  });
});

describe('preview, PDF, and DOCX typography stay in sync', () => {
  it('uses the layout metrics for both templates in PDF and DOCX', async () => {
    for (const resume of [createSampleResume(), withAts()]) {
      const layout = layoutResume(resume);
      const { metrics } = layout;

      // Preview consumes line.font.sizePt directly; PDF emits the same point size.
      const pdfOutput = createPdfDocument(resumeMeta(resume), layout).output();
      expect(pdfOutput).toContain(`/F1 ${metrics.bodyPt} Tf`);
      expect(pdfOutput).toContain(`/F1 ${metrics.smallPt} Tf`);
      expect(pdfOutput).toContain(`/F2 ${metrics.headingPt} Tf`);
      expect(pdfOutput).toContain(`/F2 ${metrics.namePt} Tf`);

      const buffer = await Packer.toBuffer(createDocxDocument(resume, layout));
      const zip = await JSZip.loadAsync(buffer);
      const file = zip.file('word/document.xml');
      if (!file) throw new Error('document.xml missing');
      const xml = await file.async('string');

      // DOCX stores half-points, so compare against the same rounded scale.
      expect(xml).toContain(`<w:sz w:val="${Math.round(metrics.smallPt * 2)}"/>`);
      expect(xml).toContain(`<w:sz w:val="${Math.round(metrics.headingPt * 2)}"/>`);
      expect(xml).toContain(`<w:sz w:val="${Math.round(metrics.namePt * 2)}"/>`);
      expect(xml).toContain(`w:w="${Math.round(metrics.pageWidthPt * 20)}"`);
      expect(xml).toContain(`w:h="${Math.round(metrics.pageHeightPt * 20)}"`);
    }
  });

  it('paginates deterministically for identical input', () => {
    const resume = createSampleResume();
    const first = layoutResume(resume);
    const second = layoutResume(resume);
    expect(second.pages.length).toBe(first.pages.length);
    expect(second.pages.map((page) => page.blocks.length)).toEqual(
      first.pages.map((page) => page.blocks.length),
    );
  });
});
