import { describe, expect, it } from 'vitest';
import { measureLineWidth, wrapText } from '../src/lib/measure';
import { resolveMetrics } from '../src/lib/metrics';
import { layoutResume } from '../src/lib/layout';
import { parseResume } from '../src/lib/parse';
import { createSampleResume } from '../src/lib/sample';
import type { FormatSettings, PageSize, Resume, ResumeTemplate } from '../src/types/resume';

function withTemplate(
  resume: Resume,
  pageSize: PageSize = 'letter',
  format: Partial<FormatSettings> = {},
): Resume {
  const template: ResumeTemplate = {
    ...resume.template,
    pageSize,
    format: { ...resume.template.format, ...format },
  };
  return { ...resume, template };
}

function allLines(resume: Resume): string {
  const layout = layoutResume(resume);
  return layout.pages
    .flatMap((page) => page.blocks)
    .flatMap((block) => block.lines.map((line) => line.text))
    .join(' ')
    .replace(/•\s+/g, ' ')
    .replace(/\s+/g, ' ');
}

describe('measureLineWidth', () => {
  it('scales with font size', () => {
    const small = measureLineWidth('Resume', { sizePt: 9 });
    const large = measureLineWidth('Resume', { sizePt: 18 });
    expect(large).toBeCloseTo(small * 2, 5);
  });

  it('measures bold wider than regular', () => {
    expect(measureLineWidth('Hello', { sizePt: 10, bold: true })).toBeGreaterThan(
      measureLineWidth('Hello', { sizePt: 10 }),
    );
  });

  it('measures narrow glyphs narrower than wide glyphs', () => {
    expect(measureLineWidth('iiii', { sizePt: 10 })).toBeLessThan(
      measureLineWidth('WWWW', { sizePt: 10 }),
    );
  });
});

describe('wrapText', () => {
  it('wraps without exceeding the width', () => {
    const font = { sizePt: 10 };
    const lines = wrapText(
      'A reasonably long sentence that must wrap across several lines.',
      80,
      font,
    );
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(measureLineWidth(line, font)).toBeLessThanOrEqual(80.01);
    }
  });

  it('splits a single word that is wider than the column', () => {
    const font = { sizePt: 10 };
    const lines = wrapText('Supercalifragilisticexpialidocious', 40, font);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(measureLineWidth(line, font)).toBeLessThanOrEqual(40.01);
    }
  });

  it('returns a single empty line for empty input', () => {
    expect(wrapText('   ', 100, { sizePt: 10 })).toEqual(['']);
  });
});

describe('layoutResume', () => {
  it('renders the sample with a header on page zero only', () => {
    const layout = layoutResume(createSampleResume());
    expect(layout.pages.length).toBeGreaterThanOrEqual(1);
    expect(layout.pages[0].header?.name.text).toBe('Jordan Avery');
    for (const page of layout.pages.slice(1)) {
      expect(page.header).toBeUndefined();
    }
  });

  it('keeps every block inside the selected page margins', () => {
    const layout = layoutResume(createSampleResume());
    const { metrics } = layout;
    for (const page of layout.pages) {
      for (const block of page.blocks) {
        const bottom = block.yPt + block.lines.length * block.lineHeightPt;
        expect(block.yPt).toBeGreaterThanOrEqual(metrics.marginTopPt - 0.01);
        expect(bottom).toBeLessThanOrEqual(metrics.pageHeightPt - metrics.marginBottomPt + 0.6);
        expect(block.xPt).toBeGreaterThanOrEqual(metrics.marginXPt - 0.01);
        expect(block.xPt + block.widthPt).toBeLessThanOrEqual(
          metrics.pageWidthPt - metrics.marginXPt + 0.01,
        );
      }
    }
  });

  it('places side-column sections to the right of the main column', () => {
    const layout = layoutResume(createSampleResume());
    const { metrics } = layout;
    const sideStart = metrics.marginXPt + metrics.mainWidthPt + metrics.gapPt;
    const blocks = layout.pages.flatMap((page) => page.blocks);
    expect(blocks.some((block) => block.xPt >= sideStart - 0.01)).toBe(true);
    expect(blocks.some((block) => block.xPt < sideStart)).toBe(true);
  });

  it('preserves every piece of content from the sample', () => {
    const resume = createSampleResume();
    const text = allLines(resume);
    for (const section of resume.sections) {
      for (const item of section.items) {
        for (const bullet of item.bullets) {
          expect(text).toContain(bullet.replace(/\s+/g, ' '));
        }
        if (item.body) expect(text).toContain(item.body.replace(/\s+/g, ' '));
      }
    }
  });

  it('paginates a long resume and renders every bullet exactly once', () => {
    const bullets = Array.from(
      { length: 150 },
      (_, index) =>
        `Unique bullet ${index} describing a specific piece of work with enough words to wrap.`,
    );
    const input = [
      '# Pagination Test',
      'Example headline | test@example.com',
      '',
      '## EXPERIENCE',
      '### Long Company — Role',
      '2020 – Present | Toronto, ON',
      ...bullets.map((bullet) => `- ${bullet}`),
    ].join('\n');

    const { resume } = parseResume(input);
    const layout = layoutResume(resume);
    expect(layout.pages.length).toBeGreaterThan(1);

    const text = allLines(resume);
    for (const bullet of bullets) {
      expect(text.split(bullet).length - 1).toBe(1);
    }

    for (const page of layout.pages) {
      for (const block of page.blocks) {
        const bottom = block.yPt + block.lines.length * block.lineHeightPt;
        expect(bottom).toBeLessThanOrEqual(
          layout.metrics.pageHeightPt - layout.metrics.marginBottomPt + 0.6,
        );
      }
    }
  });

  it('omits disabled and empty sections', () => {
    const resume = createSampleResume();
    const disabled = resume.sections.map((section) =>
      section.kind === 'interests' ? { ...section, enabled: false } : section,
    );
    const text = allLines({ ...resume, sections: disabled });
    expect(text).not.toContain('Bookbinding');
  });

  it('respects every supported page size', () => {
    for (const pageSize of ['letter', 'a4', 'legal'] as PageSize[]) {
      const resume = withTemplate(createSampleResume(), pageSize);
      const layout = layoutResume(resume);
      const metrics = resolveMetrics(resume.template);
      expect(layout.pageWidthPt).toBe(metrics.pageWidthPt);
      expect(layout.pageHeightPt).toBe(metrics.pageHeightPt);
      expect(layout.pageSizeLabel).toBe(metrics.pageSizeLabel);
      for (const page of layout.pages) {
        expect(page.widthPt).toBe(metrics.pageWidthPt);
        expect(page.heightPt).toBe(metrics.pageHeightPt);
      }
    }
  });

  it('changes typography and spacing with formatting presets', () => {
    const small = layoutResume(
      withTemplate(createSampleResume(), 'letter', {
        fontSize: 'small',
        lineSpacing: 'compact',
        sectionSpacing: 'compact',
        bulletSpacing: 'compact',
      }),
    );
    const large = layoutResume(
      withTemplate(createSampleResume(), 'letter', {
        fontSize: 'large',
        lineSpacing: 'relaxed',
        sectionSpacing: 'relaxed',
        bulletSpacing: 'relaxed',
      }),
    );

    expect(small.metrics.bodyPt).toBeLessThan(large.metrics.bodyPt);
    expect(small.metrics.bodyLinePt).toBeLessThan(large.metrics.bodyLinePt);
    expect(small.metrics.sectionBeforePt).toBeLessThan(large.metrics.sectionBeforePt);
    expect(small.metrics.bulletAfterPt).toBeLessThan(large.metrics.bulletAfterPt);
  });

  it('changes margins and column spacing in the rendered geometry', () => {
    const narrow = layoutResume(
      withTemplate(createSampleResume(), 'letter', {
        margins: 'narrow',
        columnSpacing: 'narrow',
      }),
    );
    const wide = layoutResume(
      withTemplate(createSampleResume(), 'letter', { margins: 'wide', columnSpacing: 'wide' }),
    );

    const narrowFirst = narrow.pages[0].blocks[0];
    const wideFirst = wide.pages[0].blocks[0];
    expect(narrowFirst.xPt).toBeLessThan(wideFirst.xPt);

    const narrowSideStart =
      narrow.metrics.marginXPt + narrow.metrics.mainWidthPt + narrow.metrics.gapPt;
    const wideSideStart = wide.metrics.marginXPt + wide.metrics.mainWidthPt + wide.metrics.gapPt;
    expect(wideSideStart - narrowSideStart).not.toBe(0);
  });

  it('never truncates a long paragraph', () => {
    const words = Array.from({ length: 900 }, (_, index) => `word${index}`);
    const { resume } = parseResume(
      ['# Long Paragraph', '', '## SUMMARY', words.join(' ')].join('\n'),
    );
    const text = allLines(resume);
    for (const word of words) {
      expect(text).toContain(word);
    }
  });

  it('never emits a fully blank page', () => {
    const resume = withTemplate(createSampleResume(), 'legal', { density: 'spacious' });
    for (const page of layoutResume(resume).pages) {
      expect(page.blocks.length > 0 || page.header).toBe(true);
    }
  });

  it('preserves every bullet on every page size', () => {
    const bullets = Array.from(
      { length: 80 },
      (_, index) => `Page-size bullet ${index} with enough words to wrap in a narrow column.`,
    );
    const input = [
      '# Page Size Test',
      '',
      '## EXPERIENCE',
      '### Company — Role',
      '2020 – Present | City',
      ...bullets.map((bullet) => `- ${bullet}`),
    ].join('\n');
    const parsed = parseResume(input).resume;

    for (const pageSize of ['letter', 'a4', 'legal'] as PageSize[]) {
      const text = allLines(withTemplate(parsed, pageSize));
      for (const bullet of bullets) {
        expect(text.split(bullet).length - 1).toBe(1);
      }
    }
  });
});
