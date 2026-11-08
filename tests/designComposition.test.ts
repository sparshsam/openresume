import { describe, expect, it } from 'vitest';
import { layoutResume } from '../src/lib/layout';
import { measureLineWidth } from '../src/lib/measure';
import { parseResume } from '../src/lib/parse';
import { createSampleResume } from '../src/lib/sample';
import type { Resume, ResumeLayoutId } from '../src/types/resume';

function withLayout(resume: Resume, layout: ResumeLayoutId): Resume {
  return { ...resume, template: { ...resume.template, layout } };
}

function blocksFor(layoutId: ResumeLayoutId) {
  return layoutResume(withLayout(createSampleResume(), layoutId)).pages.flatMap(
    (page) => page.blocks,
  );
}

describe('structural design composition', () => {
  it('places metadata beside the title for title-row designs', () => {
    for (const layoutId of [
      'executive',
      'modernMinimal',
      'classic',
      'compact',
      'contemporary',
      'bold',
    ] as const) {
      const rows = blocksFor(layoutId).filter((block) => block.rowLayout === 'metaRight');
      expect(rows.length, layoutId).toBeGreaterThan(0);
      const row = rows[0];
      const baselines = new Set(row.lines.map((line) => line.yPt));
      expect(baselines.size, layoutId).toBe(1);
      const title = row.lines.find((line) => line.font.bold);
      const meta = row.lines.find((line) => !line.font.bold);
      expect(title, layoutId).toBeDefined();
      expect(meta, layoutId).toBeDefined();
      expect(meta?.xPt, layoutId).toBeGreaterThan(title?.xPt ?? 0);
    }
  });

  it('puts dates in a left gutter and indents the academic entry body', () => {
    const layout = layoutResume(withLayout(createSampleResume(), 'academic'));
    const blocks = layout.pages.flatMap((page) => page.blocks);
    const rows = blocks.filter((block) => block.rowLayout === 'metaLeft');
    expect(rows.length).toBeGreaterThan(0);

    const row = rows[0];
    const title = row.lines.find((line) => line.font.bold);
    const meta = row.lines.find((line) => !line.font.bold);
    expect(meta?.xPt).toBeLessThan(title?.xPt ?? 0);
    expect(row.indentLeftPt).toBe(76);

    const indented = blocks.filter((block) => block.kind === 'body' && block.indentLeftPt);
    expect(indented.length).toBeGreaterThan(0);
    for (const block of indented) expect(block.indentLeftPt).toBe(76);
  });

  it('draws a filled heading band with reversed text for bold', () => {
    const headings = blocksFor('bold').filter((block) => block.kind === 'heading');
    expect(headings.length).toBeGreaterThan(0);
    for (const heading of headings) {
      expect(heading.band).toBeDefined();
      expect(heading.band).toMatchObject({ color: '#14532D' });
      expect(heading.lines[0].color).toBe('#FFFFFF');
      expect(heading.heightPt).toBeGreaterThan(heading.lineHeightPt);
    }
  });

  it('uses a banner header with a filled band for bold and contemporary', () => {
    for (const layoutId of ['bold', 'contemporary'] as const) {
      const layout = layoutResume(withLayout(createSampleResume(), layoutId));
      const header = layout.pages[0]?.header;
      expect(header?.band, layoutId).toBeDefined();
      expect(header?.band?.widthPt).toBeCloseTo(layout.metrics.contentWidthPt, 5);
      expect(header?.name.color).toBe('#FFFFFF');
      expect(header?.headline?.color).toBe('#FFFFFF');
    }
  });

  it('draws a centered identity and a double rule for classic and executive', () => {
    for (const layoutId of ['classic', 'executive'] as const) {
      const layout = layoutResume(withLayout(createSampleResume(), layoutId));
      const header = layout.pages[0]?.header;
      expect(header?.rule, layoutId).toBeDefined();
      expect(header?.secondRule, layoutId).toBeDefined();
      expect(header?.name.xPt, layoutId).toBeGreaterThan(layout.metrics.marginXPt);
    }
  });

  it('splits the identity for modern minimal and academic', () => {
    for (const layoutId of ['modernMinimal', 'academic'] as const) {
      const layout = layoutResume(withLayout(createSampleResume(), layoutId));
      const header = layout.pages[0]?.header;
      const contact = header?.contactLines[0];
      expect(contact, layoutId).toBeDefined();
      expect(contact!.xPt + contact!.text.length, layoutId).toBeGreaterThan(
        layout.metrics.pageWidthPt / 2,
      );
    }
  });

  it('tints the configured sidebar edge and draws a divider where requested', () => {
    const creative = layoutResume(withLayout(createSampleResume(), 'creative'));
    expect(creative.sidebarSide).toBe('left');
    expect(creative.sidebarTint).toBeDefined();
    expect(creative.pages[0]?.backgrounds?.[0].xPt).toBe(creative.metrics.marginXPt);

    const contemporary = layoutResume(withLayout(createSampleResume(), 'contemporary'));
    expect(contemporary.sidebarSide).toBe('right');
    expect(contemporary.pages[0]?.divider).toBeDefined();
    expect(contemporary.pages[0]?.backgrounds?.[0].xPt).toBeGreaterThan(
      contemporary.metrics.marginXPt + contemporary.metrics.mainWidthPt,
    );
    expect(creative.pages[0]?.divider?.xPt).toBeCloseTo(
      creative.metrics.marginXPt + creative.metrics.sideWidthPt,
      5,
    );
    expect(contemporary.pages[0]?.divider?.xPt).toBeCloseTo(
      contemporary.pages[0]?.backgrounds?.[0].xPt ?? -1,
      5,
    );

    const compact = layoutResume(withLayout(createSampleResume(), 'compact'));
    expect(compact.sidebarSide).toBe('right');
    expect(compact.pages[0]?.divider).toBeDefined();

    const ats = layoutResume(withLayout(createSampleResume(), 'atsSimple'));
    expect(ats.sidebarTint).toBeUndefined();
    expect(ats.pages[0]?.backgrounds).toBeUndefined();
  });

  it('keeps every new design inside the page and free of blank pages', () => {
    const ids: ResumeLayoutId[] = [
      'executive',
      'modernMinimal',
      'classic',
      'creative',
      'compact',
      'academic',
      'contemporary',
      'bold',
    ];
    for (const layoutId of ids) {
      const layout = layoutResume(withLayout(createSampleResume(), layoutId));
      expect(layout.pages.length, layoutId).toBeGreaterThan(0);
      for (const page of layout.pages) {
        expect(page.blocks.length + (page.header ? 1 : 0), layoutId).toBeGreaterThan(0);
        for (const block of page.blocks) {
          expect(block.xPt, layoutId).toBeGreaterThanOrEqual(0);
          expect(block.xPt + block.widthPt, layoutId).toBeLessThanOrEqual(
            page.widthPt - layout.metrics.marginXPt + 0.01,
          );
          expect(block.yPt, layoutId).toBeGreaterThanOrEqual(0);
          const bottom = block.yPt + Math.max(block.heightPt, 1);
          expect(bottom, layoutId).toBeLessThanOrEqual(
            page.heightPt - layout.metrics.marginBottomPt + 0.6,
          );
        }
      }
    }
  });
});

describe('long section headings', () => {
  it('wraps a long heading inside a narrow rail without losing words', () => {
    const sample = createSampleResume();
    const longTitle = 'Professional Development and Certifications';
    const sections = sample.sections.map((section) =>
      section.kind === 'skills' ? { ...section, title: longTitle } : section,
    );
    const layout = layoutResume({
      ...sample,
      sections,
      template: { ...sample.template, layout: 'compact' },
    });
    const skills = sections.find((section) => section.kind === 'skills');
    const heading = layout.pages
      .flatMap((page) => page.blocks)
      .find((block) => block.sectionId === skills?.id && block.kind === 'heading');

    expect(heading).toBeDefined();
    expect(heading!.lines.length).toBeGreaterThan(1);
    for (const line of heading!.lines) {
      expect(line.xPt + measureLineWidth(line.text, line.font)).toBeLessThanOrEqual(
        heading!.xPt + heading!.widthPt + 0.01,
      );
    }
    const text = layout.pages
      .flatMap((page) => page.blocks)
      .flatMap((block) => block.lines.map((line) => line.text))
      .join(' ')
      .replace(/\s+/g, ' ');
    expect(text).toContain(longTitle.toUpperCase());
  });
});

describe('reversed text contrast', () => {
  it('keeps banner and fill text dark on a light accent', () => {
    const sample = createSampleResume();
    const resume: Resume = {
      ...sample,
      template: { ...sample.template, layout: 'bold', accent: '#FDE68A' },
    };
    const layout = layoutResume(resume);
    expect(layout.pages[0]?.header?.name.color).toBe('#1A1A1A');
    expect(layout.pages[0]?.header?.headline?.color).toBe('#1A1A1A');
    for (const block of layout.pages.flatMap((page) => page.blocks)) {
      if (block.kind === 'heading' && block.band) {
        expect(block.lines[0].color).toBe('#1A1A1A');
      }
    }
  });

  it('keeps reversed text white on the default dark accent', () => {
    const layout = layoutResume(withLayout(createSampleResume(), 'bold'));
    expect(layout.pages[0]?.header?.name.color).toBe('#FFFFFF');
    for (const block of layout.pages.flatMap((page) => page.blocks)) {
      if (block.kind === 'heading' && block.band) {
        expect(block.lines[0].color).toBe('#FFFFFF');
      }
    }
  });
});

describe('long content fallbacks', () => {
  it('moves a long academic date out of the gutter instead of overflowing', () => {
    const { resume } = parseResume(
      [
        '# Jordan Avery',
        'jordan@example.com | Toronto, ON',
        '',
        '## EXPERIENCE',
        '### Northwind Studio — Senior Product Engineer',
        'September 2019 – Present | Toronto, ON',
        '- Led a document workflow.',
      ].join('\n'),
    );
    const layout = layoutResume({
      ...resume,
      template: { ...resume.template, layout: 'academic' },
    });
    const text = layout.pages
      .flatMap((page) => page.blocks)
      .flatMap((block) => block.lines.map((line) => line.text))
      .join(' ');
    expect(text).toContain('September 2019 – Present');
    const gutterRows = layout.pages
      .flatMap((page) => page.blocks)
      .filter((block) => block.rowLayout === 'metaLeft');
    expect(
      gutterRows.every((row) => row.lines.every((line) => !line.text.includes('September'))),
    ).toBe(true);
  });
});

describe('long identity blocks', () => {
  it('fits a long name inside the bold banner without clipping', () => {
    const sample = createSampleResume();
    const longName = 'Alexandria Konstantinopoulos-Montgomery';
    const layout = layoutResume({
      ...sample,
      header: { ...sample.header, name: longName },
      template: { ...sample.template, layout: 'bold' },
    });
    const name = layout.pages[0]?.header?.name;
    expect(name?.text).toBe(longName);
    expect(name!.font.sizePt).toBeLessThan(layout.metrics.namePt);
    expect(name!.xPt + measureLineWidth(longName, name!.font)).toBeLessThanOrEqual(
      layout.pageWidthPt - layout.metrics.marginXPt + 0.01,
    );
  });

  it('fits a long name inside a split identity', () => {
    const sample = createSampleResume();
    const longName = 'Alexandria Konstantinopoulos-Montgomery';
    const layout = layoutResume({
      ...sample,
      header: { ...sample.header, name: longName },
      template: { ...sample.template, layout: 'modernMinimal' },
    });
    const name = layout.pages[0]?.header?.name;
    expect(name!.font.sizePt).toBeLessThan(layout.metrics.namePt);
    expect(name!.xPt + measureLineWidth(longName, name!.font)).toBeLessThanOrEqual(
      layout.metrics.marginXPt + layout.metrics.contentWidthPt * 0.56 + 0.01,
    );
  });
});
