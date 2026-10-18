import { describe, expect, it } from 'vitest';
import { measureLineWidth, wrapText } from '../src/lib/measure';
import { layoutResume } from '../src/lib/layout';
import { parseResume } from '../src/lib/parse';
import { createSampleResume } from '../src/lib/sample';
import { COLUMNS, MARGIN, PAGE } from '../src/lib/tokens';
import type { Resume } from '../src/types/resume';

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
  it('renders the sample across at least one page with a header on page zero only', () => {
    const layout = layoutResume(createSampleResume());
    expect(layout.pages.length).toBeGreaterThanOrEqual(1);
    expect(layout.pages[0].header?.name.text).toBe('Jordan Avery');
    for (const page of layout.pages.slice(1)) {
      expect(page.header).toBeUndefined();
    }
  });

  it('keeps every block inside the page margins', () => {
    const layout = layoutResume(createSampleResume());
    for (const page of layout.pages) {
      for (const block of page.blocks) {
        const bottom = block.yPt + block.lines.length * block.lineHeightPt;
        expect(block.yPt).toBeGreaterThanOrEqual(MARGIN.topPt - 0.01);
        expect(bottom).toBeLessThanOrEqual(PAGE.heightPt - MARGIN.bottomPt + 0.6);
        expect(block.xPt).toBeGreaterThanOrEqual(MARGIN.xPt - 0.01);
        expect(block.xPt + block.widthPt).toBeLessThanOrEqual(PAGE.widthPt - MARGIN.xPt + 0.01);
      }
    }
  });

  it('places side-column sections to the right of the main column', () => {
    const layout = layoutResume(createSampleResume());
    const sideStart = MARGIN.xPt + COLUMNS.mainWidthPt + COLUMNS.gapPt;
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
      const occurrences = text.split(bullet).length - 1;
      expect(occurrences).toBe(1);
    }

    for (const page of layout.pages) {
      for (const block of page.blocks) {
        const bottom = block.yPt + block.lines.length * block.lineHeightPt;
        expect(bottom).toBeLessThanOrEqual(PAGE.heightPt - MARGIN.bottomPt + 0.6);
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
});
