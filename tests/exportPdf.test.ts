import { describe, expect, it } from 'vitest';
import { collectContentStrings } from '../src/lib/content';
import { resumeMeta } from '../src/lib/documentMeta';
import { createPdfDocument } from '../src/lib/exportPdf';
import { resumeFilename } from '../src/lib/filename';
import { layoutResume } from '../src/lib/layout';
import { parseResume } from '../src/lib/parse';
import { createSampleResume } from '../src/lib/sample';
import type { PageSize, Resume } from '../src/types/resume';

const ASCII_RESUME = `# Parity Person
Product engineer | parity@example.com | +1 555 0100 | Toronto, ON | example.com/parity

## SUMMARY
A short summary line that is easy to extract.

## EXPERIENCE
### Example Company - Senior Engineer
2020 - Present | Toronto, ON
- Built a deterministic export pipeline for PDF and DOCX.
- Kept every bullet across page boundaries.

## SKILLS
Languages: TypeScript, Python
`;

function asciiResume(): Resume {
  return parseResume(ASCII_RESUME).resume;
}

function withPageSize(resume: Resume, pageSize: PageSize): Resume {
  return { ...resume, template: { ...resume.template, pageSize } };
}

describe('PDF export', () => {
  it('creates a PDF with one page per layout page', () => {
    const resume = createSampleResume();
    const layout = layoutResume(resume);
    const doc = createPdfDocument(resumeMeta(resume), layout);
    expect(doc.getNumberOfPages()).toBe(layout.pages.length);
    expect(doc.output()).toMatch(/^%PDF/);
  });

  it('embeds real, selectable text and no images', () => {
    const resume = createSampleResume();
    const layout = layoutResume(resume);
    const output = createPdfDocument(resumeMeta(resume), layout).output();
    expect(output).toContain('Jordan Avery');
    expect(output).toContain('Led the rebuild of a document workflow');
    expect(output).not.toContain('/Subtype /Image');
  });

  it('uses multiple pages for a long resume', () => {
    const bullets = Array.from({ length: 120 }, (_, index) => `- Bullet ${index} with words.`);
    const { resume } = parseResume(
      [
        '# Long Resume',
        '',
        '## EXPERIENCE',
        '### Company - Role',
        '2020 - Present | City',
        ...bullets,
      ].join('\n'),
    );
    const layout = layoutResume(resume);
    const doc = createPdfDocument(resumeMeta(resume), layout);
    expect(layout.pages.length).toBeGreaterThan(1);
    expect(doc.getNumberOfPages()).toBe(layout.pages.length);
  });

  it('uses the selected page dimensions', () => {
    const cases: Array<[PageSize, number, number]> = [
      ['letter', 612, 792],
      ['a4', 595.28, 841.89],
      ['legal', 612, 1008],
    ];

    for (const [pageSize, width, height] of cases) {
      const resume = withPageSize(createSampleResume(), pageSize);
      const layout = layoutResume(resume);
      const doc = createPdfDocument(resumeMeta(resume), layout);
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(width, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(height, 1);
      expect(layout.pageWidthPt).toBeCloseTo(width, 1);
      expect(layout.pageHeightPt).toBeCloseTo(height, 1);
    }
  });

  it('contains every content string', () => {
    const resume = asciiResume();
    const output = createPdfDocument(resumeMeta(resume), layoutResume(resume)).output();
    for (const value of collectContentStrings(resume)) {
      expect(output, `missing PDF text: ${value}`).toContain(value);
    }
  });
});

describe('resumeFilename', () => {
  it('sanitizes the name and adds the extension', () => {
    expect(resumeFilename('Jordan Avery', 'pdf')).toBe('Jordan-Avery-Resume.pdf');
    expect(resumeFilename('  Ada / Lovelace  ', 'docx')).toBe('Ada-Lovelace-Resume.docx');
    expect(resumeFilename('', 'pdf')).toBe('Resume-Resume.pdf');
  });
});
