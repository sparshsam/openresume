import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { collectContentStrings } from '../src/lib/content';
import { resumeMeta } from '../src/lib/documentMeta';
import { createDocxDocument } from '../src/lib/exportDocx';
import { createPdfDocument } from '../src/lib/exportPdf';
import { layoutResume } from '../src/lib/layout';
import { parseResume } from '../src/lib/parse';
import { createSampleResume } from '../src/lib/sample';
import type { PageSize, Resume } from '../src/types/resume';

const ATS_ASCII_RESUME = `# Parity Person
Product engineer | parity@example.com | +1 555 0100 | Toronto, ON

## SUMMARY
A short summary line.

## EXPERIENCE
### Example Company - Senior Engineer
2020 - Present | Toronto, ON
- Built a deterministic export pipeline.

## SKILLS
Languages: TypeScript, Python
`;

function atsResume(): Resume {
  const sample = createSampleResume();
  return { ...sample, template: { ...sample.template, layout: 'atsSimple' } };
}

/** Short lines so every string stays on one PDF text line. */
function atsAsciiResume(): Resume {
  const { resume } = parseResume(ATS_ASCII_RESUME);
  return { ...resume, template: { ...resume.template, layout: 'atsSimple' } };
}

function withPageSize(resume: Resume, pageSize: PageSize): Resume {
  return { ...resume, template: { ...resume.template, pageSize } };
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractDocxText(xml: string): string[] {
  return [...xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((match) =>
    decodeEntities(match[1]),
  );
}

async function docxXml(resume: Resume): Promise<string> {
  const buffer = await Packer.toBuffer(createDocxDocument(resume, layoutResume(resume)));
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('document.xml missing');
  return file.async('string');
}

function pdfOutput(resume: Resume): string {
  return createPdfDocument(resumeMeta(resume), layoutResume(resume)).output();
}

describe('ATS Simple DOCX export', () => {
  it('uses no tables, so text extraction sees a linear flow', async () => {
    const xml = await docxXml(atsResume());
    expect(xml).not.toContain('<w:tbl>');
    expect(xml).not.toContain('<w:tc>');
    expect(xml).toContain('<w:t');
  });

  it('contains every content string', async () => {
    const resume = atsResume();
    const extracted = extractDocxText(await docxXml(resume)).join(' ');
    for (const value of collectContentStrings(resume)) {
      expect(extracted, `missing DOCX text: ${value}`).toContain(value);
    }
  });

  it('writes sections in author order', async () => {
    const resume = atsResume();
    const extracted = extractDocxText(await docxXml(resume)).join(' ');
    const titles = resume.sections
      .filter((section) => section.enabled)
      .map((section) => section.title.toUpperCase());

    let cursor = -1;
    for (const title of titles) {
      const index = extracted.indexOf(title, cursor + 1);
      expect(index, `section ${title} out of order`).toBeGreaterThan(cursor);
      cursor = index;
    }
  });

  it('keeps real text with no embedded images or drawings', async () => {
    const xml = await docxXml(atsResume());
    expect(xml).not.toContain('<w:drawing');
    expect(xml).not.toContain('<w:pict');
  });

  it('applies the document accent and the shared typography scale', async () => {
    const sample = atsResume();
    const resume: Resume = {
      ...sample,
      template: { ...sample.template, accent: '#1D4ED8' },
    };
    const { metrics } = layoutResume(resume);
    const xml = await docxXml(resume);

    expect(xml).toContain('w:color w:val="1D4ED8"');
    expect(xml).toContain(`<w:sz w:val="${Math.round(metrics.smallPt * 2)}"/>`);
    expect(xml).toContain(`<w:sz w:val="${Math.round(metrics.headingPt * 2)}"/>`);
    expect(xml).toContain(`<w:sz w:val="${Math.round(metrics.namePt * 2)}"/>`);
  });

  it('keeps every bullet across page breaks', async () => {
    const bullets = Array.from(
      { length: 120 },
      (_, index) => `ATS DOCX bullet ${index} with enough words to wrap.`,
    );
    const { resume } = parseResume(
      [
        '# ATS Writer',
        '',
        '## EXPERIENCE',
        '### Company — Role',
        '2020 – Present | City',
        ...bullets.map((bullet) => `- ${bullet}`),
      ].join('\n'),
    );
    const ats: Resume = { ...resume, template: { ...resume.template, layout: 'atsSimple' } };
    const layout = layoutResume(ats);
    const xml = await docxXml(ats);

    expect(layout.pages.length).toBeGreaterThan(1);
    expect(xml).toContain('<w:br w:type="page"/>');
    const extracted = extractDocxText(xml).join(' ');
    for (const bullet of bullets) {
      expect(extracted).toContain(bullet);
    }
  });
});

describe('ATS Simple PDF export', () => {
  it('matches the layout page count and contains selectable text', () => {
    const resume = atsAsciiResume();
    const layout = layoutResume(resume);
    const doc = createPdfDocument(resumeMeta(resume), layout);
    const output = doc.output();

    expect(doc.getNumberOfPages()).toBe(layout.pages.length);
    expect(output).toMatch(/^%PDF/);
    expect(output).not.toContain('/Subtype /Image');
    for (const value of collectContentStrings(resume)) {
      expect(output, `missing PDF text: ${value}`).toContain(value);
    }
  });

  it('emits headings in linear reading order', () => {
    const resume = atsResume();
    const output = pdfOutput(resume);
    const titles = resume.sections
      .filter((section) => section.enabled)
      .map((section) => section.title.toUpperCase());

    let cursor = -1;
    for (const title of titles) {
      const index = output.indexOf(title, cursor + 1);
      expect(index, `PDF section ${title} out of order`).toBeGreaterThan(cursor);
      cursor = index;
    }
  });

  it('uses the shared secondary and body text sizes', () => {
    const resume = atsResume();
    const { metrics } = layoutResume(resume);
    const output = pdfOutput(resume);

    expect(output).toContain(`/F1 ${metrics.smallPt} Tf`);
    expect(output).toContain(`/F1 ${metrics.bodyPt} Tf`);
    expect(output).toContain(`/F2 ${metrics.headingPt} Tf`);
  });

  it('honours page sizes without changing the template', () => {
    for (const pageSize of ['letter', 'a4', 'legal'] as PageSize[]) {
      const resume = withPageSize(atsResume(), pageSize);
      const layout = layoutResume(resume);
      const doc = createPdfDocument(resumeMeta(resume), layout);
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(layout.pageWidthPt, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(layout.pageHeightPt, 1);
    }
  });
});
