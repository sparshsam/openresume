import { describe, expect, it } from 'vitest';
import { layoutResume } from '../src/lib/layout';
import { normalizeTemplate } from '../src/lib/normalize';
import { parseResume } from '../src/lib/parse';
import { createSampleResume } from '../src/lib/sample';
import { DOCUMENT_ACCENTS } from '../src/lib/tokens';
import type { FormatSettings, PageSize, Resume, ResumeLayoutId } from '../src/types/resume';

function withLayout(resume: Resume, layout: ResumeLayoutId): Resume {
  return { ...resume, template: { ...resume.template, layout } };
}

function withFormat(resume: Resume, format: Partial<FormatSettings>): Resume {
  return {
    ...resume,
    template: { ...resume.template, format: { ...resume.template.format, ...format } },
  };
}

function allBlocks(resume: Resume) {
  return layoutResume(resume).pages.flatMap((page) => page.blocks);
}

/** Every word placed on the page, independent of wrapping and column order. */
function words(resume: Resume): string[] {
  return allBlocks(resume)
    .flatMap((block) => block.lines.map((line) => line.text))
    .join(' ')
    .replace(/•/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort();
}

function sectionTitles(resume: Resume): string[] {
  return resume.sections
    .filter(
      (section) =>
        section.enabled &&
        section.items.some(
          (item) =>
            Boolean(item.title || item.subtitle || item.body || item.dateRange || item.location) ||
            item.bullets.length > 0,
        ),
    )
    .map((section) => section.title.toUpperCase());
}

describe('ATS Simple layout', () => {
  it('is the opt-in template; the two-column layout stays the default', () => {
    expect(createSampleResume().template.layout).toBe('twoColumn');
    expect(layoutResume(createSampleResume()).variant).toBe('twoColumn');
    expect(layoutResume(withLayout(createSampleResume(), 'atsSimple')).variant).toBe('atsSimple');
  });

  it('places every block in one full-width column', () => {
    const layout = layoutResume(withLayout(createSampleResume(), 'atsSimple'));
    expect(layout.pages.length).toBeGreaterThan(0);

    for (const page of layout.pages) {
      for (const block of page.blocks) {
        expect(block.xPt).toBeCloseTo(layout.metrics.marginXPt, 5);
        expect(block.widthPt).toBeCloseTo(layout.metrics.contentWidthPt, 5);
      }
    }
  });

  it('keeps the two-column layout genuinely two-column', () => {
    const layout = layoutResume(createSampleResume());
    const xPositions = new Set(
      layout.pages.flatMap((page) => page.blocks).map((block) => block.xPt),
    );
    expect(xPositions.size).toBeGreaterThan(1);
  });

  it('reads sections in author order, including sections assigned to the side column', () => {
    const resume = withLayout(createSampleResume(), 'atsSimple');
    const headings = allBlocks(resume)
      .filter((block) => block.kind === 'heading')
      .map((block) => block.lines[0].text);

    expect(headings).toEqual(sectionTitles(resume));
    expect(headings).toContain('SKILLS');
    expect(headings).toContain('EDUCATION');
  });

  it('preserves every word when switching templates', () => {
    const sample = createSampleResume();
    expect(words(withLayout(sample, 'atsSimple'))).toEqual(words(sample));
  });

  it('keeps the header on the first page only', () => {
    const sample = createSampleResume();
    const long = parseResume(
      [
        '# ATS Person',
        'ats@example.com',
        '',
        '## EXPERIENCE',
        '### Company — Role',
        '2020 – Present | City',
        ...Array.from({ length: 120 }, (_, index) => `- Bullet ${index} with enough words.`),
      ].join('\n'),
    ).resume;
    const resume = withLayout(long, 'atsSimple');
    const layout = layoutResume(resume);

    expect(layout.pages.length).toBeGreaterThan(1);
    expect(layout.pages[0].header?.name.text).toBe('ATS Person');
    for (const page of layout.pages.slice(1)) expect(page.header).toBeUndefined();

    // Switch back to the rich sample to check header placement there too.
    const sampleLayout = layoutResume(withLayout(sample, 'atsSimple'));
    expect(sampleLayout.pages[0].header?.name.text).toBe('Jordan Avery');
    for (const page of sampleLayout.pages.slice(1)) expect(page.header).toBeUndefined();
  });

  it('paginates every bullet exactly once inside the margins', () => {
    const bullets = Array.from(
      { length: 150 },
      (_, index) => `ATS bullet ${index} describing work with enough words to wrap.`,
    );
    const { resume } = parseResume(
      [
        '# Pagination Person',
        '',
        '## EXPERIENCE',
        '### Long Company — Role',
        '2020 – Present | City',
        ...bullets.map((bullet) => `- ${bullet}`),
      ].join('\n'),
    );
    const ats = withLayout(resume, 'atsSimple');
    const layout = layoutResume(ats);
    expect(layout.pages.length).toBeGreaterThan(1);

    const text = allBlocks(ats)
      .flatMap((block) => block.lines.map((line) => line.text))
      .join(' ');
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

  it('applies every accent colour to the header and section headings', () => {
    for (const accent of DOCUMENT_ACCENTS) {
      const sample = createSampleResume();
      const resume: Resume = {
        ...withLayout(sample, 'atsSimple'),
        template: { ...sample.template, layout: 'atsSimple', accent: accent.value },
      };
      const layout = layoutResume(resume);
      expect(layout.accent).toBe(accent.value);
      expect(layout.pages[0].header?.name.color).toBe(accent.value);
      expect(layout.pages[0].header?.rule.color).toBe(accent.value);
      for (const heading of allBlocks(resume).filter((block) => block.kind === 'heading')) {
        expect(heading.lines[0].color).toBe(accent.value);
      }
    }
  });

  it('keeps formatting presets effective', () => {
    const sample = withLayout(createSampleResume(), 'atsSimple');
    const small = layoutResume(withFormat(sample, { fontSize: 'small', density: 'compact' }));
    const large = layoutResume(withFormat(sample, { fontSize: 'large', density: 'spacious' }));

    expect(small.metrics.bodyPt).toBeLessThan(large.metrics.bodyPt);
    expect(small.metrics.sectionBeforePt).toBeLessThan(large.metrics.sectionBeforePt);
    expect(small.metrics.itemBeforePt).toBeLessThan(large.metrics.itemBeforePt);
  });

  it('honours every page size', () => {
    for (const pageSize of ['letter', 'a4', 'legal'] as PageSize[]) {
      const sample = withLayout(createSampleResume(), 'atsSimple');
      const resume: Resume = { ...sample, template: { ...sample.template, pageSize } };
      const layout = layoutResume(resume);
      expect(layout.pageWidthPt).toBe(layoutResume(resume).metrics.pageWidthPt);
      for (const page of layout.pages) {
        expect(page.widthPt).toBe(layout.metrics.pageWidthPt);
        expect(page.heightPt).toBe(layout.metrics.pageHeightPt);
      }
    }
  });

  it('omits disabled sections in the single column', () => {
    const sample = withLayout(createSampleResume(), 'atsSimple');
    const disabled: Resume = {
      ...sample,
      sections: sample.sections.map((section) =>
        section.kind === 'interests' ? { ...section, enabled: false } : section,
      ),
    };
    const text = allBlocks(disabled)
      .flatMap((block) => block.lines.map((line) => line.text))
      .join(' ');
    expect(text).not.toContain('Bookbinding');
  });
});

describe('layout normalization', () => {
  it('defaults missing or unknown layouts to the two-column template', () => {
    expect(normalizeTemplate({}).layout).toBe('twoColumn');
    expect(normalizeTemplate({ layout: 'fancy' }).layout).toBe('twoColumn');
    expect(normalizeTemplate({ layout: 'atsSimple' }).layout).toBe('atsSimple');
  });

  it('keeps a valid layout alongside a legacy page size and accent', () => {
    const normalized = normalizeTemplate({
      pageSize: 'a4',
      accent: '#099019',
      layout: 'atsSimple',
    });
    expect(normalized.pageSize).toBe('a4');
    expect(normalized.accent).toBe('#099019');
    expect(normalized.layout).toBe('atsSimple');
  });
});
