import { describe, expect, it } from 'vitest';
import { createPdfDocument } from '../src/lib/exportPdf';
import { resumeFilename } from '../src/lib/filename';
import { layoutResume } from '../src/lib/layout';
import { createSampleResume } from '../src/lib/sample';
import { parseResume } from '../src/lib/parse';

describe('PDF export', () => {
  it('creates a PDF with one page per layout page', () => {
    const resume = createSampleResume();
    const layout = layoutResume(resume);
    const doc = createPdfDocument(resume, layout);
    expect(doc.getNumberOfPages()).toBe(layout.pages.length);
    expect(doc.output()).toMatch(/^%PDF/);
  });

  it('embeds real, selectable text', () => {
    const resume = createSampleResume();
    const layout = layoutResume(resume);
    const output = createPdfDocument(resume, layout).output();
    expect(output).toContain('Jordan Avery');
    expect(output).toContain('Led the rebuild of a document workflow');
  });

  it('uses multiple pages for a long resume', () => {
    const bullets = Array.from({ length: 120 }, (_, index) => `- Bullet ${index} with words.`);
    const { resume } = parseResume(
      [
        '# Long Resume',
        '',
        '## EXPERIENCE',
        '### Company — Role',
        '2020 – Present | City',
        ...bullets,
      ].join('\n'),
    );
    const layout = layoutResume(resume);
    const doc = createPdfDocument(resume, layout);
    expect(layout.pages.length).toBeGreaterThan(1);
    expect(doc.getNumberOfPages()).toBe(layout.pages.length);
  });
});

describe('resumeFilename', () => {
  it('sanitizes the name and adds the extension', () => {
    expect(resumeFilename('Jordan Avery', 'pdf')).toBe('Jordan-Avery-Resume.pdf');
    expect(resumeFilename('  Ada / Lovelace  ', 'docx')).toBe('Ada-Lovelace-Resume.docx');
    expect(resumeFilename('', 'pdf')).toBe('Resume-Resume.pdf');
  });
});
