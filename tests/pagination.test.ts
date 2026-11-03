import { describe, expect, it } from 'vitest';
import { layoutResume } from '../src/lib/layout';
import { paginateColumn, type FlowBlock } from '../src/lib/paginate';
import { parseResume } from '../src/lib/parse';
import { createSampleResume } from '../src/lib/sample';
import type { Resume } from '../src/types/resume';

function textBlock(heightPt: number, overrides: Partial<FlowBlock> = {}): FlowBlock {
  const lineHeightPt = 10;
  const lines = Array.from({ length: Math.ceil(heightPt / lineHeightPt) }, (_, index) => ({
    text: `line-${index}`,
    xOffsetPt: 0,
    font: { sizePt: 10 },
    color: '#000000',
  }));
  return {
    sectionId: 'section',
    kind: 'body',
    lineHeightPt,
    lines,
    spaceBeforePt: 0,
    spaceAfterPt: 0,
    splittable: true,
    ...overrides,
  };
}

describe('paginateColumn pagination controls', () => {
  it('moves a whole entry to the next page when it fits there', () => {
    const first = textBlock(70);
    const entryStart = textBlock(20, { groupHeightPt: 40 });
    const entryEnd = textBlock(20);

    const withoutKeeping = paginateColumn([first, entryStart, entryEnd], 100, 100, 200);
    expect(withoutKeeping.map((page) => page.length)).toEqual([3, 1]);

    const withKeeping = paginateColumn([first, entryStart, entryEnd], 100, 100, 200, {
      keepEntriesTogether: true,
    });
    expect(withKeeping.map((page) => page.length)).toEqual([1, 2]);
    expect(withKeeping[1].every((block) => block.sectionId === 'section')).toBe(true);
  });

  it('leaves an entry alone when it fits the remaining space', () => {
    const first = textBlock(20);
    const entryStart = textBlock(20, { groupHeightPt: 40 });
    const entryEnd = textBlock(20);

    const pages = paginateColumn([first, entryStart, entryEnd], 100, 100, 200, {
      keepEntriesTogether: true,
    });
    expect(pages).toHaveLength(1);
  });

  it('keeps a heading with its first entry even when entries are not kept together', () => {
    const heading = textBlock(10, { kind: 'heading', groupHeightPt: 80 });
    const entry = textBlock(70);

    const pages = paginateColumn([textBlock(30), heading, entry], 100, 100, 200, {
      keepEntriesTogether: false,
    });
    expect(pages.map((page) => page.length)).toEqual([1, 2]);
    expect(pages[1][0].kind).toBe('heading');
  });

  it('starts a section on a new page without leaving a blank page', () => {
    const pages = paginateColumn(
      [textBlock(20), textBlock(20, { forcePageBreak: true })],
      100,
      100,
      200,
    );
    expect(pages.map((page) => page.length)).toEqual([1, 1]);
    expect(pages).toHaveLength(2);
  });

  it('does not create a blank page for a break requested at the top', () => {
    const pages = paginateColumn(
      [textBlock(20, { forcePageBreak: true }), textBlock(20)],
      100,
      100,
      200,
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(2);
  });

  it('falls back to splitting an entry taller than a page', () => {
    const first = textBlock(20, { sectionId: 'other' });
    const oversized = textBlock(200, { groupHeightPt: 200, sectionId: 'oversized' });
    const pages = paginateColumn([first, oversized], 100, 100, 200, {
      keepEntriesTogether: true,
    });

    expect(pages.length).toBeGreaterThan(1);
    const placedLines = pages
      .flat()
      .filter((block) => block.sectionId === 'oversized')
      .flatMap((block) => block.lines);
    expect(placedLines).toHaveLength(20);
  });

  it('never emits a trailing empty page', () => {
    const pages = paginateColumn([textBlock(100)], 100, 100, 200);
    expect(pages).toHaveLength(1);
  });
});

describe('layout pagination controls', () => {
  function longResume(): Resume {
    const bullets = Array.from(
      { length: 70 },
      (_, index) => `- Delivered measurable result ${index}.`,
    );
    const text = [
      '# Pagination Person',
      'Engineer | pagination@example.com',
      '',
      '## SUMMARY',
      'A concise summary.',
      '',
      '## EXPERIENCE',
      '### First Company - Engineer',
      '2020 - Present | Toronto, ON',
      ...bullets.slice(0, 20),
      '',
      '## PROJECTS',
      '### Project One',
      '2021 | Remote',
      ...bullets.slice(20, 45),
      '',
      '## EDUCATION',
      '### Example University - B.Sc.',
      '2012 - 2016 | Toronto, ON',
      ...bullets.slice(45),
    ].join('\n');
    return parseResume(text).resume;
  }

  it('starts a selected section on a new page', () => {
    const resume = longResume();
    const sections = resume.sections.map((section) =>
      section.kind === 'projects' ? { ...section, startOnNewPage: true } : section,
    );
    const layout = layoutResume({
      ...resume,
      template: { ...resume.template, layout: 'atsSimple' },
      sections,
    });

    const headingPage = (title: string) =>
      layout.pages.findIndex((page) =>
        page.blocks.some(
          (block) => block.kind === 'heading' && block.lines.some((line) => line.text === title),
        ),
      );

    const experiencePage = headingPage('EXPERIENCE');
    const projectsPage = headingPage('PROJECTS');
    expect(experiencePage).toBeGreaterThanOrEqual(0);
    expect(projectsPage).toBeGreaterThan(experiencePage);
    expect(
      layout.pages[projectsPage].blocks.some(
        (block) => block.sectionId === layout.pages[experiencePage].blocks[0].sectionId,
      ),
    ).toBe(false);
  });

  it('never leaves a heading orphaned at the bottom of a column', () => {
    const variants: Resume[] = [
      longResume(),
      { ...longResume(), template: { ...longResume().template, layout: 'atsSimple' } },
    ];

    for (const resume of variants) {
      const layout = layoutResume(resume);
      for (const page of layout.pages) {
        const columns = new Map<number, typeof page.blocks>();
        for (const block of page.blocks) {
          const key = Math.round(block.xPt);
          columns.set(key, [...(columns.get(key) ?? []), block]);
        }
        for (const columnBlocks of columns.values()) {
          columnBlocks.forEach((block, index) => {
            if (block.kind !== 'heading') return;
            expect(index).toBeLessThan(columnBlocks.length - 1);
            expect(columnBlocks[index + 1].sectionId).toBe(block.sectionId);
          });
        }
      }
    }
  });

  it('keeps automatic pagination producing no blank pages', () => {
    const layout = layoutResume(longResume());
    for (const page of layout.pages) {
      expect(page.blocks.length + (page.header ? 1 : 0)).toBeGreaterThan(0);
    }
    expect(layout.pages.map((page) => page.index)).toEqual(layout.pages.map((_, index) => index));
  });

  it('defaults pagination to keeping entries together', () => {
    expect(createSampleResume().template.pagination.keepEntriesTogether).toBe(true);
  });
});
