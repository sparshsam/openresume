import { describe, expect, it } from 'vitest';
import { collectCoverLetterContentStrings } from '../src/lib/content';
import { layoutCoverLetter } from '../src/lib/coverLetterLayout';
import { parseCoverLetter } from '../src/lib/parseCoverLetter';
import { createSampleCoverLetter } from '../src/lib/coverLetterSample';
import type { CoverLetter } from '../src/types/coverLetter';
import type { FormatSettings, PageSize } from '../src/types/resume';

function withTemplate(
  letter: CoverLetter,
  pageSize: PageSize = 'letter',
  format: Partial<FormatSettings> = {},
): CoverLetter {
  return {
    ...letter,
    template: {
      ...letter.template,
      pageSize,
      format: { ...letter.template.format, ...format },
    },
  };
}

function allLines(letter: CoverLetter): string {
  const layout = layoutCoverLetter(letter);
  const header = layout.pages[0].header;
  const headerLines = header
    ? [
        header.name.text,
        ...(header.headline ? [header.headline.text] : []),
        ...header.contactLines.map((line) => line.text),
      ]
    : [];

  return [
    ...headerLines,
    ...layout.pages
      .flatMap((page) => page.blocks)
      .flatMap((block) => block.lines.map((line) => line.text)),
  ]
    .join(' ')
    .replace(/\s+/g, ' ');
}

describe('layoutCoverLetter', () => {
  it('renders header and letter blocks in reading order', () => {
    const layout = layoutCoverLetter(createSampleCoverLetter());
    expect(layout.kind).toBe('coverLetter');
    expect(layout.pages[0].header?.name.text).toBe('Jordan Avery');

    const kinds = layout.pages[0].blocks.map((block) => block.kind);
    const unique = kinds.filter(
      (kind, index) => kind !== 'recipient' || kinds[index - 1] !== 'recipient',
    );
    expect(unique).toEqual([
      'letterDate',
      'recipient',
      'subject',
      'salutation',
      'letterBody',
      'letterBody',
      'letterBody',
      'closing',
      'signature',
    ]);
  });

  it('preserves every content string', () => {
    const letter = createSampleCoverLetter();
    const text = allLines(letter);
    for (const value of collectCoverLetterContentStrings(letter)) {
      expect(text).toContain(value.replace(/\s+/g, ' '));
    }
  });

  it('renders a minimal letter without blank blocks or pages', () => {
    const letter = parseCoverLetter(
      ['# A Person', '', '## BODY', 'Only paragraph.'].join('\n'),
    ).coverLetter;
    const layout = layoutCoverLetter(letter);

    expect(layout.pages).toHaveLength(1);
    expect(layout.pages[0].blocks.map((block) => block.kind)).toEqual(['letterBody']);
    expect(layout.pages[0].blocks[0].lines.map((line) => line.text).join(' ')).toBe(
      'Only paragraph.',
    );
  });

  it('paginates a long letter and preserves every paragraph exactly once', () => {
    const paragraphs = Array.from(
      { length: 70 },
      (_, index) =>
        `Paragraph ${index} describes a specific piece of work with enough words to wrap across a full page and continue naturally.`,
    );
    const letter = parseCoverLetter(
      ['# Long Person', '', '## BODY', ...paragraphs.flatMap((p) => [p, ''])].join('\n'),
    ).coverLetter;
    const layout = layoutCoverLetter(letter);
    const text = allLines(letter);

    expect(layout.pages.length).toBeGreaterThan(1);
    for (const paragraph of paragraphs) {
      expect(text.split(paragraph).length - 1).toBe(1);
    }
    for (const page of layout.pages) {
      expect(page.blocks.length > 0 || page.header).toBe(true);
      for (const block of page.blocks) {
        const bottom = block.yPt + block.lines.length * block.lineHeightPt;
        expect(bottom).toBeLessThanOrEqual(
          layout.metrics.pageHeightPt - layout.metrics.marginBottomPt + 0.6,
        );
      }
    }
  });

  it('supports every page size', () => {
    const letter = createSampleCoverLetter();
    for (const pageSize of ['letter', 'a4', 'legal'] as PageSize[]) {
      const layout = layoutCoverLetter(withTemplate(letter, pageSize));
      expect(layout.pageWidthPt).toBe(layout.metrics.pageWidthPt);
      expect(layout.pageHeightPt).toBe(layout.metrics.pageHeightPt);
      expect(layout.pages[0].header?.name.text).toBe('Jordan Avery');
    }
  });

  it('applies paragraph spacing presets', () => {
    const letter = createSampleCoverLetter();
    const compact = layoutCoverLetter(
      withTemplate(letter, 'letter', { paragraphSpacing: 'compact' }),
    );
    const relaxed = layoutCoverLetter(
      withTemplate(letter, 'letter', { paragraphSpacing: 'relaxed' }),
    );

    const compactBody = compact.pages[0].blocks.find((block) => block.kind === 'letterBody')!;
    const relaxedBody = relaxed.pages[0].blocks.find((block) => block.kind === 'letterBody')!;
    const compactAfter = compactBody.heightPt - compactBody.lines.length * compactBody.lineHeightPt;
    const relaxedAfter = relaxedBody.heightPt - relaxedBody.lines.length * relaxedBody.lineHeightPt;

    expect(compactAfter).toBeLessThan(relaxedAfter);
  });

  it('keeps closing and signature on the same page', () => {
    const paragraphs = Array.from(
      { length: 55 },
      (_, index) =>
        `Paragraph ${index} with enough detail to fill several lines across the letter page.`,
    );
    const letter = parseCoverLetter(
      [
        '# Long Person',
        '',
        '## BODY',
        ...paragraphs.flatMap((p) => [p, '']),
        '## CLOSING',
        'Sincerely,',
        '',
        '## SIGNATURE',
        'Long Person',
      ].join('\n'),
    ).coverLetter;
    const layout = layoutCoverLetter(letter);

    const closingPage = layout.pages.findIndex((page) =>
      page.blocks.some((block) => block.kind === 'closing'),
    );
    const signaturePage = layout.pages.findIndex((page) =>
      page.blocks.some((block) => block.kind === 'signature'),
    );
    expect(closingPage).toBeGreaterThanOrEqual(0);
    expect(signaturePage).toBe(closingPage);
  });
});
